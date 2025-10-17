"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { IAgent, EVoiceProvider } from "@/types/agent";
import {
  Trash2,
  Plus,
  Bot,
  MessageSquare,
  Target,
  RefreshCw,
  Database,
  Search,
  Eye,
  Tags,
  AlertCircle,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { datasetsService } from "@/services/datasets-service";
import { intentsService } from "@/services/intents-service";
import { IDataset } from "@/types/dataset";
import { useDebouncedCallback } from "use-debounce";
import { DatasetModal } from "@/components/dataset-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TagSelector } from "@/components/tag-selector";
import { Textarea } from "./ui/textarea";
import { VoiceSelectModal } from "./voice-select-modal";
import { piperService } from "@/services/ai/piper-service";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  role: z.string().optional(),
  systemPrompt: z.string().optional(),
  objective: z.string().optional(),
  personality: z.string().optional(),
  backstory: z.string().optional(),
  voiceConfig: z
    .object({
      provider: z.nativeEnum(EVoiceProvider),
      voiceId: z.string().min(1, "Voice ID is required"),
      additionalConfig: z.record(z.any()).optional(),
    })
    .optional(),
  datasets: z.array(z.string()).min(0),
  greetings: z
    .array(z.string())
    .min(1, "At least one greeting tag is required"),
  fallback: z.array(z.string()).min(1, "At least one fallback tag is required"),
  repeatedInput: z.array(z.string()).min(0),
  repeatedInputConfig: z.object({
    enabled: z.boolean(),
    tolerance: z.number().min(0),
    historySize: z.number().min(0),
    allowOriginalResponse: z.boolean(),
  }),
  objectives: z
    .array(
      z.object({
        tag: z.string().min(1, "Tag is required"),
        intervalMessages: z.number().min(0),
        showAfterReply: z.boolean(),
      })
    )
    .min(0),
});

export type AgentFormData = z.infer<typeof agentSchema>;

export type AgentSubmitData = AgentFormData;

interface AgentFormProps {
  initialData?: IAgent;
  onSubmit: (data: AgentSubmitData) => Promise<void>;
  mode?: "view" | "edit" | "create";
}

interface AvailableTag {
  tag: string;
  datasetName: string;
  datasetId: string;
}

const removeEmptyValues = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(v => v != null && v !== "");
  }
  if (obj !== null && typeof obj === "object") {
    const entries = Object.entries(obj).map(([k, v]) => {
      const preserveEmptyArrayFields = [
        "repeatedInput",
        "greetings",
        "fallback",
        "objectives",
        "datasets",
      ];

      if (preserveEmptyArrayFields.includes(k as string) && Array.isArray(v)) {
        return [k, v];
      }

      return [k, removeEmptyValues(v)];
    });

    return Object.fromEntries(
      entries.filter(([k, v]) => {
        const preserveEmptyArrayFields = [
          "repeatedInput",
          "greetings",
          "fallback",
          "objectives",
          "datasets",
        ];

        if (
          preserveEmptyArrayFields.includes(k as string) &&
          Array.isArray(v)
        ) {
          return true;
        }

        return v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
      })
    );
  }
  return obj;
};

export function AgentForm({
  initialData,
  onSubmit,
  mode = "create",
}: AgentFormProps) {
  const isViewMode = mode === "view";
  const isEditing = mode === "edit" || mode === "create";

  const [availableDatasets, setAvailableDatasets] = useState<IDataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(
    new Set(initialData?.datasets || [])
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedGreetingTags, setSelectedGreetingTags] = useState<Set<string>>(
    new Set(initialData?.greetings || [])
  );
  const [selectedFallbackTags, setSelectedFallbackTags] = useState<Set<string>>(
    new Set(initialData?.fallback || [])
  );
  const [selectedRepeatedInputTags, setSelectedRepeatedInputTags] = useState<
    Set<string>
  >(new Set(initialData?.repeatedInput || []));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPiperReady, setIsPiperReady] = useState(false);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: initialData
      ? {
          ...initialData,
        }
      : {
          name: "",
          description: "",
          role: "",
          systemPrompt: "",
          objective: "",
          personality: "",
          backstory: "",
          voiceConfig: undefined,
          datasets: [],
          greetings: [],
          fallback: [],
          repeatedInput: [],
          repeatedInputConfig: {
            enabled: false,
            tolerance: 3,
            historySize: 5,
            allowOriginalResponse: false,
          },
          objectives: [],
        },
  });

  const { control } = form;

  const {
    fields: objectiveFields,
    append: appendObjective,
    remove: removeObjective,
  } = useFieldArray({
    control,
    name: "objectives",
  });

  const loadDatasets = async (search: string) => {
    setIsLoadingDatasets(true);
    try {
      const filter = search ? `contains(name, '${search}')` : "";
      const response = await datasetsService.getDatasets(filter, "name", 1, 5);
      if (response.data) {
        setAvailableDatasets(response.data);
      }
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const loadTagsFromDatasets = async (datasetIds: string[]) => {
    if (datasetIds.length === 0) {
      setAvailableTags([]);
      return;
    }

    setIsLoadingTags(true);
    try {
      const tags: AvailableTag[] = [];
      const tagSet = new Set<string>();

      for (const datasetId of datasetIds) {
        const datasetResponse = await datasetsService.getDataset(datasetId);
        if (datasetResponse) {
          const dataset = datasetResponse;

          for (const intentId of dataset.intents) {
            const intentResponse = await intentsService.getIntent(intentId);
            if (intentResponse) {
              const intent = intentResponse;
              if (intent.tag && !tagSet.has(intent.tag)) {
                tagSet.add(intent.tag);
                tags.push({
                  tag: intent.tag,
                  datasetName: dataset.name,
                  datasetId: dataset.id,
                });
              }
            }
          }
        }
      }

      setAvailableTags(tags);
    } catch (error) {
      console.error("Error loading tags from datasets:", error);
    } finally {
      setIsLoadingTags(false);
    }
  };

  useEffect(() => {
    loadDatasets("");
    piperService
      .initialize()
      .then(() => {
        setIsPiperReady(true);
      })
      .catch(err => {
        console.error("Error initializing Piper:", err);
      });
  }, []);

  useEffect(() => {
    if (selectedDatasetIds.size > 0) {
      loadTagsFromDatasets(Array.from(selectedDatasetIds));
    } else {
      setAvailableTags([]);
    }
  }, [selectedDatasetIds]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    loadDatasets(value);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleDatasetToggle = (dataset: IDataset) => {
    const newSelectedIds = new Set(selectedDatasetIds);
    if (newSelectedIds.has(dataset.id)) {
      newSelectedIds.delete(dataset.id);
    } else {
      newSelectedIds.add(dataset.id);
    }
    setSelectedDatasetIds(newSelectedIds);

    const selectedIds = Array.from(newSelectedIds);
    form.setValue("datasets", selectedIds, { shouldValidate: true });
  };

  const handlePreviewDataset = (datasetId: string) => {
    setPreviewDatasetId(datasetId);
    setIsPreviewModalOpen(true);
  };

  const handleTagToggle = (
    tag: string,
    type: "greeting" | "fallback" | "repeatedInput"
  ) => {
    if (type === "greeting") {
      const newSet = new Set(selectedGreetingTags);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      setSelectedGreetingTags(newSet);
      form.setValue("greetings", Array.from(newSet), { shouldValidate: true });
    } else if (type === "fallback") {
      const newSet = new Set(selectedFallbackTags);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      setSelectedFallbackTags(newSet);
      form.setValue("fallback", Array.from(newSet), { shouldValidate: true });
    } else if (type === "repeatedInput") {
      const newSet = new Set(selectedRepeatedInputTags);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      setSelectedRepeatedInputTags(newSet);
      form.setValue("repeatedInput", Array.from(newSet), {
        shouldValidate: true,
      });
    }
  };

  const validateTags = async (data: AgentFormData): Promise<boolean> => {
    setValidationError(null);

    if (data.datasets.length === 0) {
      setValidationError(
        "Please select at least one dataset before assigning tags"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (data: AgentFormData) => {
    try {
      const isValid = await validateTags(data);
      if (!isValid) {
        return;
      }

      const filteredData = removeEmptyValues(data) as AgentSubmitData;
      await onSubmit(filteredData);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    form.setValue("voiceConfig", {
      provider: EVoiceProvider.PIPER,
      voiceId,
      additionalConfig: {
        speakerId: 0,
      },
    });
  };

  const selectedVoiceId = form.watch("voiceConfig")?.voiceId;
  const selectedSpeakerId = form.watch(
    "voiceConfig.additionalConfig.speakerId"
  );
  const selectedVoice = selectedVoiceId
    ? piperService.getVoice(selectedVoiceId)
    : null;
  const numSpeakers = selectedVoice?.num_speakers || 1;
  const speakerOptions =
    numSpeakers > 1
      ? Object.keys(selectedVoice?.speaker_id_map || {}).length > 0
        ? Object.entries(selectedVoice?.speaker_id_map || {})
        : Array.from({ length: numSpeakers }, (_, i) => [`Speaker ${i}`, i])
      : [];

  const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(textarea => {
      adjustTextareaHeight(textarea as HTMLTextAreaElement);
    });
  }, [initialData]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

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
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>
                  Enter the name and description for this agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Customer Support Agent"
                          className="font-medium"
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description of the agent's purpose"
                          rows={3}
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of what this agent does
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
                  <Bot className="h-5 w-5 text-purple-500" />
                  <CardTitle>Agent Configuration</CardTitle>
                </div>
                <CardDescription>
                  Define the agent&apos;s behavior and personality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., You are an assistant designed to help with solar energy solutions"
                          className="resize-none overflow-hidden min-h-[60px]"
                          disabled={isViewMode && !isEditing}
                          onInput={e => adjustTextareaHeight(e.currentTarget)}
                          ref={el => {
                            field.ref(el);
                            adjustTextareaHeight(el);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Define the agent&apos;s role or purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>System Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Speak with enthusiasm and clarity. Avoid technical jargon."
                          className="resize-none overflow-hidden min-h-[60px]"
                          disabled={isViewMode && !isEditing}
                          onInput={e => adjustTextareaHeight(e.currentTarget)}
                          ref={el => {
                            field.ref(el);
                            adjustTextareaHeight(el);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Instructions for how the agent should behave
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Objective</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Guide users through solar panel selection"
                          className="resize-none overflow-hidden min-h-[60px]"
                          disabled={isViewMode && !isEditing}
                          onInput={e => adjustTextareaHeight(e.currentTarget)}
                          ref={el => {
                            field.ref(el);
                            adjustTextareaHeight(el);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        The main goal of this agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personality</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Friendly, professional, enthusiastic"
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Personality traits of the agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="backstory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backstory</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Created to help customers understand renewable energy"
                          className="resize-none overflow-hidden min-h-[60px]"
                          disabled={isViewMode && !isEditing}
                          onInput={e => adjustTextareaHeight(e.currentTarget)}
                          ref={el => {
                            field.ref(el);
                            adjustTextareaHeight(el);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Background story or context for the agent
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
                  <Database className="h-5 w-5 text-purple-500" />
                  <CardTitle>Datasets</CardTitle>
                </div>
                <CardDescription>
                  Select datasets to link to this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center w-full bg-background border rounded-lg px-2">
                    <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
                    <Input
                      className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search datasets by name..."
                      disabled={isViewMode && !isEditing}
                    />
                  </div>

                  {isLoadingDatasets ? (
                    <p className="text-sm text-muted-foreground">
                      Loading datasets...
                    </p>
                  ) : (
                    <FormField
                      control={form.control}
                      name="datasets"
                      render={() => (
                        <FormItem>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {availableDatasets.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No datasets found
                              </p>
                            ) : (
                              availableDatasets.map(dataset => (
                                <div
                                  key={dataset.id}
                                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                                >
                                  <Checkbox
                                    checked={selectedDatasetIds.has(dataset.id)}
                                    onCheckedChange={() =>
                                      handleDatasetToggle(dataset)
                                    }
                                    disabled={isViewMode && !isEditing}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">
                                        {dataset.name}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {dataset.intents?.length || 0} intents
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handlePreviewDataset(dataset.id)
                                    }
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
                            Selected: {selectedDatasetIds.size} dataset(s) |
                            Showing top 5 results
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="greetings"
              render={() => (
                <FormItem>
                  <TagSelector
                    title="Greeting Tags"
                    description="Select intent tags to use as greetings (references to intent tags)"
                    icon={MessageSquare}
                    selectedTags={selectedGreetingTags}
                    onToggle={tag => handleTagToggle(tag, "greeting")}
                    type="greeting"
                    colorClass="text-blue-500"
                    availableTags={availableTags}
                    isLoadingTags={isLoadingTags}
                    hasSelectedDatasets={selectedDatasetIds.size > 0}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fallback"
              render={() => (
                <FormItem>
                  <TagSelector
                    title="Fallback Tags"
                    description="Select intent tags for fallback messages (references to intent tags)"
                    icon={MessageSquare}
                    selectedTags={selectedFallbackTags}
                    onToggle={tag => handleTagToggle(tag, "fallback")}
                    type="fallback"
                    colorClass="text-orange-500"
                    availableTags={availableTags}
                    isLoadingTags={isLoadingTags}
                    hasSelectedDatasets={selectedDatasetIds.size > 0}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6 2xl:space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-indigo-500" />
                  <CardTitle>Voice Configuration</CardTitle>
                </div>
                <CardDescription>
                  Select a voice for the agent (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="voiceConfig"
                  render={() => (
                    <FormItem>
                      <FormLabel>Voice</FormLabel>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 justify-start h-auto py-3"
                          onClick={() => setIsVoiceModalOpen(true)}
                          disabled={!isPiperReady || (isViewMode && !isEditing)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 text-left truncate">
                              {selectedVoiceId ? (
                                <span className="font-medium">
                                  {selectedVoiceId}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {isPiperReady
                                    ? "Select a voice (optional)"
                                    : "Loading voices..."}
                                </span>
                              )}
                            </div>
                          </div>
                        </Button>
                        {selectedVoiceId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              form.setValue("voiceConfig", undefined)
                            }
                            disabled={isViewMode && !isEditing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormDescription>
                        Choose a voice for text-to-speech output
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedVoiceId &&
                  numSpeakers > 1 &&
                  speakerOptions.length > 0 && (
                    <div className="space-y-3">
                      <FormLabel>Speaker / Variant</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {speakerOptions.map(([name, id]) => {
                          const speakerId = Number(id);
                          const isSelected = selectedSpeakerId === speakerId;

                          return (
                            <Button
                              key={id as string}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentConfig =
                                  form.getValues("voiceConfig");
                                if (currentConfig) {
                                  form.setValue(
                                    "voiceConfig",
                                    {
                                      ...currentConfig,
                                      additionalConfig: {
                                        ...currentConfig.additionalConfig,
                                        speakerId: speakerId,
                                      },
                                    },
                                    { shouldValidate: true }
                                  );
                                }
                              }}
                              disabled={isViewMode && !isEditing}
                              className="justify-start"
                            >
                              {name}
                            </Button>
                          );
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select a speaker variant for this voice
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-500" />
                  <CardTitle>Repeated Input</CardTitle>
                </div>
                <CardDescription>
                  Configure repeated input detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="repeatedInputConfig.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable repeated input detection</FormLabel>
                        <FormDescription>
                          Detect when user sends repeated messages
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repeatedInputConfig.tolerance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tolerance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of repeated messages before triggering
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repeatedInputConfig.historySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={e =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of messages to track
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repeatedInputConfig.allowOriginalResponse"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isViewMode && !isEditing}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow original response</FormLabel>
                        <FormDescription>
                          Allow sending original intent response
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <FormField
                    control={form.control}
                    name="repeatedInput"
                    render={() => (
                      <FormItem>
                        <TagSelector
                          title="Repeated Input Tags"
                          description="Select intent tags for repeated input messages (references to intent tags)"
                          icon={Tags}
                          selectedTags={selectedRepeatedInputTags}
                          onToggle={tag =>
                            handleTagToggle(tag, "repeatedInput")
                          }
                          type="repeatedInput"
                          colorClass="text-green-500"
                          availableTags={availableTags}
                          isLoadingTags={isLoadingTags}
                          hasSelectedDatasets={selectedDatasetIds.size > 0}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  <CardTitle>Objectives</CardTitle>
                </div>
                <CardDescription>
                  Add objectives for this agent (references to intent tags)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {objectiveFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 p-4 bg-muted/50 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs normal-case">
                        Objective {index + 1}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeObjective(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`objectives.${index}.tag`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">
                            Tag (Intent Reference)
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              disabled={
                                availableTags.length === 0 ||
                                (isViewMode && !isEditing)
                              }
                            >
                              <option value="">Select a tag</option>
                              {availableTags.map(tagInfo => (
                                <option
                                  key={`${tagInfo.tag}-${tagInfo.datasetId}`}
                                  value={tagInfo.tag}
                                >
                                  {tagInfo.tag} ({tagInfo.datasetName})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Select an intent tag from your datasets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`objectives.${index}.intervalMessages`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">
                            Interval Messages
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e =>
                                field.onChange(parseInt(e.target.value))
                              }
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
                      name={`objectives.${index}.showAfterReply`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isViewMode && !isEditing}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-xs font-semibold">
                              Show after reply
                            </FormLabel>
                          </div>
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
                      appendObjective({
                        tag: "",
                        intervalMessages: 0,
                        showAfterReply: false,
                      })
                    }
                    disabled={availableTags.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Objective
                  </Button>
                )}
                {availableTags.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Select datasets first to add objectives
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <DatasetModal
        datasetId={previewDatasetId}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewDatasetId(null);
        }}
      />

      <VoiceSelectModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedVoiceId={selectedVoiceId || null}
        onSelectVoice={handleVoiceSelect}
      />
    </Form>
  );
}

export function AgentFormActions({
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
          : "Create Agent"}
      </Button>
    </>
  );
}

