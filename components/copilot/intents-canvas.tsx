"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Trash2,
  Save,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IntentPreview } from "@/components/intent-preview";
import { IIntent } from "@/types/intent";
import { IntentSubmitData } from "@/components/intent-form";
import { toast } from "sonner";
import { intentsService } from "@/services/intents-service";
import { datasetsService } from "@/services/datasets-service";
import { IDataset } from "@/types/dataset";
import { DatasetSaveDialog } from "@/components/dataset-save-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CopilotCanvasProps } from "@/types/copilot-tool";
import { validateAndFixIntent } from "@/services/ai/ai-intents-service";

interface IntentCanvasItem {
  id: string;
  tag: string;
  patterns: string[];
  responses: Array<{ text: string; alt?: string }>;
  options?: Array<{ label: string; text: string; tag: string }>;
  visualCue?: {
    face?: { id: string; intensity: number };
    body?: { id: string; intensity: number };
  };
}

export function IntentsCanvas({
  items,
  onClear,
}: CopilotCanvasProps<IntentCanvasItem>) {
  const [intents, setIntents] = useState<IIntent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savingIntentId, setSavingIntentId] = useState<string | null>(null);
  const [failedIntents, setFailedIntents] = useState<Map<string, string>>(
    new Map()
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [datasets, setDatasets] = useState<IDataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [lastSaveContext, setLastSaveContext] = useState<{
    mode: "existing" | "new";
    datasetId?: string;
    datasetName?: string;
  } | null>(null);

  useEffect(() => {
    setIntents(items as IIntent[]);
  }, [items]);

  useEffect(() => {
    if (showSaveDialog) {
      loadDatasets();
    }
  }, [showSaveDialog]);

  const loadDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const response = await datasetsService.getDatasets(
        undefined,
        undefined,
        1,
        100
      );
      setDatasets(response.data);
    } catch (err) {
      toast.error("Failed to load datasets", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const handleRemoveIntent = (intentId: string) => {
    setIntents(prev => prev.filter(intent => intent.id !== intentId));
    toast.success("Intent removed");
  };

  const handleUpdateIntent = (intentId: string, data: IntentSubmitData) => {
    setIntents(prev =>
      prev.map(intent =>
        intent.id === intentId ? { ...intent, ...data } : intent
      )
    );
    toast.success("Intent updated in preview");
  };

  const handleSaveIntentsOnly = async () => {
    if (!intents.length) return;

    setIsSaving(true);
    setFailedIntents(new Map());
    let saved = 0;
    const failures = new Map<string, string>();

    const existingTags = new Set<string>();
    try {
      const response = await intentsService.getIntents(undefined, undefined, 1, 1000);
      response.data.forEach(intent => existingTags.add(intent.tag));
    } catch (err) {
      console.error("[Intents Canvas] Failed to fetch existing tags:", err);
    }

    for (const intent of intents) {
      setSavingIntentId(intent.id);
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const fixedIntent = validateAndFixIntent(intent, existingTags);
        
        await intentsService.createIntent(fixedIntent);
        toast.success("Intent saved", {
          description: fixedIntent.tag,
          duration: 2000,
        });
        await new Promise(resolve => setTimeout(resolve, 600));
        setIntents(prev => prev.filter(i => i.id !== intent.id));
        saved++;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        failures.set(intent.id, errorMessage);
        toast.error("Failed to save intent", {
          description: `${intent.tag}: ${errorMessage}`,
          duration: 4000,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSavingIntentId(null);
    setIsSaving(false);
    setFailedIntents(failures);

    if (failures.size === 0) {
      toast.success("All intents saved!", {
        description: `Successfully saved ${saved} intent(s)`,
        duration: 3000,
      });
      setLastSaveContext(null);
      if (onClear) onClear();
    }
  };

  const handleSaveWithDataset = async (params: {
    mode: "existing" | "new";
    datasetId?: string;
    datasetName?: string;
  }) => {
    setLastSaveContext(params);

    try {
      let targetDatasetId = params.datasetId;
      let targetDatasetName = params.datasetName;

      if (params.mode === "new") {
        if (!params.datasetName) {
          toast.error("Dataset name is required");
          return;
        }

        toast.info("Creating dataset...", {
          description: `Creating dataset '${params.datasetName}'`,
        });

        try {
          const newDataset = await datasetsService.createDataset({
            name: params.datasetName,
            intents: [],
          });

          targetDatasetId = newDataset.id;
          targetDatasetName = newDataset.name;

          toast.success("Dataset created", {
            description: `Created dataset '${newDataset.name}'`,
          });
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          toast.error("Failed to create dataset", {
            description: errorMessage,
          });
          return;
        }
      }

      if (!targetDatasetId || !targetDatasetName) {
        toast.error("Invalid dataset selection");
        return;
      }

      setLastSaveContext({
        mode: params.mode,
        datasetId: targetDatasetId,
        datasetName: targetDatasetName,
      });

      setIsSaving(true);
      setFailedIntents(new Map());
      let saved = 0;
      const failures = new Map<string, string>();

      const existingTags = new Set<string>();
      try {
        const response = await intentsService.getIntents(undefined, undefined, 1, 1000);
        response.data.forEach(intent => existingTags.add(intent.tag));
      } catch (err) {
        console.error("[Intents Canvas] Failed to fetch existing tags:", err);
      }

      for (const intent of intents) {
        setSavingIntentId(intent.id);
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
          const fixedIntent = validateAndFixIntent(intent, existingTags);
          
          const savedIntent = await intentsService.createIntent(fixedIntent);
          toast.success("Intent saved", {
            description: fixedIntent.tag,
            duration: 2000,
          });

          await new Promise(resolve => setTimeout(resolve, 400));

          try {
            const currentDataset = await datasetsService.getDataset(
              targetDatasetId
            );
            await datasetsService.updateDataset(targetDatasetId, {
              intents: [...currentDataset.intents, savedIntent.id],
            });

            toast.success("Dataset updated", {
              description: `Added '${fixedIntent.tag}' to ${targetDatasetName}`,
              duration: 2000,
            });
          } catch (datasetErr) {
            const datasetErrorMessage =
              datasetErr instanceof Error ? datasetErr.message : "Unknown error";
            toast.warning("Intent saved but dataset update failed", {
              description: `${fixedIntent.tag} was saved but couldn't be added to dataset: ${datasetErrorMessage}`,
            });
            console.error("Dataset update error:", datasetErr);
          }

          await new Promise(resolve => setTimeout(resolve, 400));
          setIntents(prev => prev.filter(i => i.id !== intent.id));
          saved++;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          failures.set(intent.id, errorMessage);
          toast.error("Failed to save intent", {
            description: `${intent.tag}: ${errorMessage}`,
            duration: 4000,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSavingIntentId(null);
      setIsSaving(false);
      setFailedIntents(failures);

      if (failures.size === 0) {
        toast.success("All intents saved!", {
          description: `Successfully saved ${saved} intent(s) to ${targetDatasetName}`,
        });
        setLastSaveContext(null);
        if (onClear) onClear();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error("Unexpected error", {
        description: errorMessage,
      });
    }
  };

  const handleResumeSave = () => {
    if (lastSaveContext) {
      handleSaveWithDataset(lastSaveContext);
    }
  };

  const handleClearAll = () => {
    setIntents([]);
    setFailedIntents(new Map());
    if (onClear) onClear();
    toast.info("Preview cleared");
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-sidebar">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Intents Preview</h2>
          <Badge variant="secondary" className="text-xs">
            {intents.length}
          </Badge>
          {failedIntents.size > 0 && (
            <Badge variant="destructive" className="text-xs">
              {failedIntents.size} failed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {intents.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              {failedIntents.size > 0 && lastSaveContext && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Resume Save
                    </>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSaveIntentsOnly}>
                    Save intents only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                    Save to dataset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {failedIntents.size > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Save Errors</AlertTitle>
            <AlertDescription>
              {failedIntents.size} intent(s) failed to save. Review errors below
              {lastSaveContext && " and click 'Resume Save' to retry"}.
            </AlertDescription>
          </Alert>
        )}

        {intents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              Generated intents will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ask the Intent Creator to generate some intents
            </p>
          </div>
        ) : (
          <IntentPreview
            intents={intents}
            onRemoveIntent={handleRemoveIntent}
            onUpdateIntent={handleUpdateIntent}
            savingIntentId={savingIntentId}
            failedIntents={failedIntents}
          />
        )}
      </ScrollArea>

      <DatasetSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveWithDataset}
        datasets={datasets}
        isLoadingDatasets={isLoadingDatasets}
      />
    </div>
  );
}

