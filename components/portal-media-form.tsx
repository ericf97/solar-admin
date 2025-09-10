"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ImageCropModal } from "@/components/image-crop-modal";
import Image from "next/image";
import { Trash2, Link, ImageIcon, GripVertical } from "lucide-react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { PortalFormData } from "./portal-form";

interface PortalMediaFormProps {
  control: Control<PortalFormData>;
  cardImage?: boolean
}

const SortableItem = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="p-4 rounded-lg shadow-md border border-border bg-card/50 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            className="cursor-grab"
            {...listeners}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export function PortalMediaForm({ control, cardImage = false }: PortalMediaFormProps) {

  type CurrentImage = {
    preview: string | ArrayBuffer | null;
    file: File;
  };

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: "items",
  });

  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<CurrentImage | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fileNames, setFileNames] = useState<{[key: number]: string}>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(item => item.id === active.id);
      const newIndex = fields.findIndex(item => item.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage({ preview: reader.result, file });
        if (!cardImage) setEditingIndex(index ?? null);
        setIsOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedUrl: string) => {
    if (cardImage) {
      setValue("cardImage", croppedUrl);
      setValue("cardImageFileName", currentImage?.file?.name ?? ""); 
    } else if (editingIndex !== null) {
      update(editingIndex, {
        ...fields[editingIndex],
        image: croppedUrl
      });
      setFileNames(prev => ({
        ...prev,
        [editingIndex]: currentImage?.file?.name ?? ""
      }));
    }
    setCurrentImage(prev =>
      prev ? { ...prev, preview: croppedUrl } : null
    );
    setIsOpen(false);
    setEditingIndex(null);
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>{cardImage ? 'Card Image' : 'Items'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
      {cardImage ? (
        <div className="flex-grow space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <input
                type="file"
                id="card-image-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-background hover:bg-accent"
                onClick={() =>
                  document.getElementById("card-image-upload")?.click()
                }
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={control}
              name="cardImage"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      disabled
                      placeholder="Card image URL"
                      value={watch("cardImageFileName") ?? ""}
                      readOnly
                      />
                      {field.value && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="relative h-10 w-10 rounded-md overflow-hidden border border-border">
                                  <Image
                                    src={field.value}
                                    alt={`Card Image`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="w-64 p-0"
                              >
                                <div className="relative aspect-square w-full overflow-hidden rounded-md">
                                  <Image
                                    src={field.value}
                                    alt={`Card Image preview`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                  </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-background hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setValue("cardImage", "")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {fields.map((item, index) => (
              <SortableItem key={item.id} id={item.id}>
                <div className="flex-grow space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0 bg-background hover:bg-accent"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <FormField
                      control={control}
                      name={`items.${index}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Item URL"
                              value={field.value ?? ""}
                              className="bg-background"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      <input
                        type="file"
                        id={`image-upload-${index}`}
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, index)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-background hover:bg-accent"
                        onClick={() =>
                          document
                            .getElementById(`image-upload-${index}`)
                            ?.click()
                        }
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={control}
                      name={`items.${index}.image`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                {...field}
                                placeholder="Image URL"
                                value={(fileNames[index] || field.value) ?? ""}
                                className="bg-background"
                              />
                              {field.value && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="relative h-10 w-10 rounded-md overflow-hidden border border-border">
                                        <Image
                                          src={field.value}
                                          alt={`Item ${index + 1}`}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="right"
                                      className="w-64 p-0"
                                    >
                                      <div className="relative aspect-square w-full overflow-hidden rounded-md">
                                        <Image
                                          src={field.value}
                                          alt={`Item ${index + 1} preview`}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="bg-background hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        )}
        { !cardImage && (
          <Button
          type="button"
          variant="outline"
          onClick={() => append({ url: "", image: "" })}
          className="mt-4 bg-background hover:bg-accent"
          >
          Add Item
        </Button>
          )}
      </CardContent>

      <ImageCropModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setCurrentImage(null);
          setEditingIndex(null);
        }}
        onCropComplete={(croppedUrl) => handleCropComplete(croppedUrl)}
        imageUrl={currentImage?.preview as string || ""}
      />
    </Card>
  );
}

