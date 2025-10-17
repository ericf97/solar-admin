"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { IDataset } from "@/types/dataset";
import { IIntent } from "@/types/intent";
import { Database, Sparkles, Search, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { intentsService } from "@/services/intents-service";
import { Badge } from "@/components/ui/badge";
import { useDebouncedCallback } from "use-debounce";
import { IntentModal } from "@/components/intent-modal";

const datasetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  intents: z.array(z.string()).min(1, "At least one intent is required"),
});

export type DatasetFormData = z.infer<typeof datasetSchema>;

interface DatasetFormProps {
  initialData?: IDataset;
  onSubmit: (data: DatasetFormData) => Promise<void>;
  mode?: "view" | "edit" | "create";
}

export function DatasetForm({
  initialData,
  onSubmit,
  mode = "create",
}: DatasetFormProps) {
  const isViewMode = mode === "view";
  const isEditing = mode === "edit" || mode === "create";
  const [availableIntents, setAvailableIntents] = useState<IIntent[]>([]);
  const [isLoadingIntents, setIsLoadingIntents] = useState(true);
  const [selectedIntentIds, setSelectedIntentIds] = useState<Set<string>>(
    new Set(initialData?.intents || [])
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [previewIntentId, setPreviewIntentId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const form = useForm<DatasetFormData>({
    resolver: zodResolver(datasetSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          intents: initialData.intents || [],
        }
      : {
          name: "",
          intents: [],
        },
  });

  const loadIntents = async (search: string) => {
    setIsLoadingIntents(true);
    try {
      const filter = search ? `contains(tag, '${search}')` : "";
      const response = await intentsService.getIntents(filter, "tag", 1, 5);
      if (response.data) {
        setAvailableIntents(response.data);
      }
    } catch (error) {
      console.error("Error loading intents:", error);
    } finally {
      setIsLoadingIntents(false);
    }
  };

  useEffect(() => {
    loadIntents("");
  }, []);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadIntents(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleIntentToggle = (intent: IIntent) => {
    const newSelectedIds = new Set(selectedIntentIds);
    if (newSelectedIds.has(intent.id)) {
      newSelectedIds.delete(intent.id);
    } else {
      newSelectedIds.add(intent.id);
    }
    setSelectedIntentIds(newSelectedIds);

    const selectedIds = Array.from(newSelectedIds);
    form.setValue("intents", selectedIds, { shouldValidate: true });
  };

  const handlePreviewIntent = (intentId: string) => {
    setPreviewIntentId(intentId);
    setIsPreviewModalOpen(true);
  };

  const handleSubmit = async (data: DatasetFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Basic Information</CardTitle>
            </div>
            <CardDescription>
              Enter the name that identifies this dataset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Customer Support Dataset"
                      className="font-medium"
                      disabled={isViewMode && !isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this dataset
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
              <Sparkles className="h-5 w-5 text-blue-500" />
              <CardTitle>Select Intents</CardTitle>
            </div>
            <CardDescription>
              Choose the intents to include in this dataset
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center w-full bg-background border rounded-lg px-2">
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
                <Input
                  className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search intents by tag..."
                  disabled={isViewMode && !isEditing}
                />
              </div>

              {isLoadingIntents ? (
                <p className="text-sm text-muted-foreground">
                  Loading intents...
                </p>
              ) : (
                <FormField
                  control={form.control}
                  name="intents"
                  render={() => (
                    <FormItem>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {availableIntents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No intents found
                          </p>
                        ) : (
                          availableIntents.map(intent => (
                            <div
                              key={intent.id}
                              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                            >
                              <Checkbox
                                checked={selectedIntentIds.has(intent.id)}
                                onCheckedChange={() =>
                                  handleIntentToggle(intent)
                                }
                                disabled={isViewMode && !isEditing}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {intent.tag}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {intent.patterns?.length || 0} patterns
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewIntent(intent.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                      <FormDescription>
                        Selected: {selectedIntentIds.size} intent(s) | Showing
                        top 5 results
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      <IntentModal
        intentId={previewIntentId}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewIntentId(null);
        }}
      />
    </Form>
  );
}

export function DatasetFormActions({
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
          : "Create Dataset"}
      </Button>
    </>
  );
}

