"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IIntent } from "@/types/intent";
import {
  Trash2,
  Plus,
  Zap,
  MessageSquare,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EBodyAnimation, EFaceAnimation } from "@/types/animation";
import { SliderInput } from "./slider-input";
import { Badge } from "@/components/ui/badge";

const intentSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
  patterns: z
    .array(z.object({ value: z.string().min(1, "Pattern cannot be empty") }))
    .min(1, "At least one pattern is required"),
  responses: z
    .array(
      z.object({
        text: z.string().min(1, "Response text is required"),
        alt: z.string().optional(),
      })
    )
    .min(1, "At least one response is required"),
  options: z
    .array(
      z.object({
        label: z.string().min(1, "Label is required"),
        text: z.string().min(1, "Text is required"),
        tag: z.string().min(1, "Tag is required"),
      })
    )
    .optional(),
  visualCue: z
    .object({
      face: z.object({
        id: z.nativeEnum(EFaceAnimation),
        intensity: z.number().min(0).max(1),
      }),
      body: z.object({
        id: z.nativeEnum(EBodyAnimation),
        intensity: z.number().min(0).max(1),
      }),
    })
    .optional(),
});

export type IntentFormData = z.infer<typeof intentSchema>;

export type IntentSubmitData = Omit<IntentFormData, "patterns"> & {
  patterns: string[];
};

interface IntentFormProps {
  initialData?: IIntent;
  onSubmit: (data: IntentSubmitData) => Promise<void> | void;
  mode?: "view" | "edit" | "create";
  formId?: string;
}

const removeEmptyValues = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(v => v != null && v !== "");
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, removeEmptyValues(v)])
        .filter(([, v]) => v != null && v !== "")
    );
  }
  return obj;
};

export function IntentForm({
  initialData,
  onSubmit,
  mode = "create",
  formId,
}: IntentFormProps) {
  const isViewMode = mode === "view";
  const isEditing = mode === "edit" || mode === "create";

  const form = useForm<IntentFormData>({
    resolver: zodResolver(intentSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          patterns: initialData.patterns.map(p => ({ value: p })),
        }
      : {
          tag: "",
          patterns: [{ value: "" }],
          responses: [{ text: "", alt: "" }],
          options: [],
          visualCue: {
            face: { id: EFaceAnimation.ACTING_CUTE, intensity: 0.5 },
            body: { id: EBodyAnimation.AGREEING, intensity: 0.5 },
          },
        },
  });

  const { control } = form;

  const {
    fields: patternFields,
    append: appendPattern,
    remove: removePattern,
  } = useFieldArray({
    control,
    name: "patterns",
  });

  const {
    fields: responseFields,
    append: appendResponse,
    remove: removeResponse,
  } = useFieldArray({
    control,
    name: "responses" as const,
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: "options" as const,
  });

  const handleSubmit = async (data: IntentFormData) => {
    try {
      const transformedData: IntentSubmitData = {
        ...data,
        patterns: data.patterns.map(p => p.value),
      };
      const filteredData = removeEmptyValues(
        transformedData
      ) as IntentSubmitData;

      const result = onSubmit(filteredData);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8"
      >
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          }}
        >
          <div className="space-y-6 2xl:space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>
                  Enter the tag that identifies this intent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., greeting"
                          className="font-medium"
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this intent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <CardTitle>Patterns</CardTitle>
                </div>
                <CardDescription>
                  Add patterns that trigger this intent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {patternFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`patterns.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                placeholder="Enter a pattern"
                                className="bg-background border"
                                disabled={isViewMode && !isEditing}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {patternFields.length > 1 && !isViewMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePattern(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendPattern({ value: "" })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pattern
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <CardTitle>Responses</CardTitle>
                </div>
                <CardDescription>Add responses for this intent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {responseFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 p-4 bg-muted/50 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs normal-case">
                        Response {index + 1}
                      </Badge>
                      {responseFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResponse(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name={`responses.${index}.text` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Text
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Response text"
                              className="bg-background resize-none"
                              rows={3}
                              disabled={isViewMode && !isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`responses.${index}.alt` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Alt Text (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Alternative text"
                              className="bg-background"
                              disabled={isViewMode && !isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendResponse({ text: "", alt: "" })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Response
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6 2xl:space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5 text-purple-500" />
                  <CardTitle>Options (Optional)</CardTitle>
                </div>
                <CardDescription>
                  Add follow-up options for this intent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {optionFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 p-4 bg-muted/50 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs normal-case">
                        Option {index + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`options.${index}.label` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Label
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Option label"
                              className="bg-background"
                              disabled={isViewMode && !isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.text` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Text
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Option text"
                              className="bg-background"
                              disabled={isViewMode && !isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.tag` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">
                            Tag
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Target intent tag"
                              className="bg-background"
                              disabled={isViewMode && !isEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendOption({ label: "", text: "", tag: "" })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <CardTitle>Visual Cues (Optional)</CardTitle>
                </div>
                <CardDescription>
                  Configure visual animations for this intent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-muted/50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs normal-case">
                      Face Animation
                    </Badge>
                  </div>
                  <FormField
                    control={form.control}
                    name="visualCue.face.id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Animation
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isViewMode && !isEditing}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="bg-background"
                              disabled={isViewMode && !isEditing}
                            >
                              <SelectValue placeholder="Select animation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(EFaceAnimation).map(anim => (
                              <SelectItem key={anim} value={anim}>
                                {anim}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <SliderInput
                    label="Intensity"
                    name="visualCue.face.intensity"
                    control={form.control}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isViewMode && !isEditing}
                  />
                </div>
                <div className="space-y-4 p-4 bg-muted/50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs normal-case">
                      Body Animation
                    </Badge>
                  </div>
                  <FormField
                    control={form.control}
                    name="visualCue.body.id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          Animation
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isViewMode && !isEditing}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="bg-background"
                              disabled={isViewMode && !isEditing}
                            >
                              <SelectValue placeholder="Select animation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(EBodyAnimation).map(anim => (
                              <SelectItem key={anim} value={anim}>
                                {anim}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <SliderInput
                    label="Intensity"
                    name="visualCue.body.intensity"
                    control={form.control}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isViewMode && !isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

export function IntentFormActions({
  isViewMode,
  isEditing,
  isSubmitting,
  onEdit,
  onCancel,
  onSave,
  hasInitialData,
}: {
  isViewMode: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  hasInitialData: boolean;
}) {
  if (isViewMode && !isEditing) {
    return (
      <>
        <Button type="button" variant="outline" onClick={onCancel}>
          Close
        </Button>
        <Button type="button" onClick={onEdit}>
          Edit
        </Button>
      </>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" onClick={onSave} disabled={isSubmitting}>
        {isSubmitting
          ? "Saving..."
          : hasInitialData
          ? "Save Changes"
          : "Create Intent"}
      </Button>
    </>
  );
}

