"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Sparkles, Eye } from "lucide-react";
import { IDataset } from "@/types/dataset";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { datasetsService } from "@/services/datasets-service";
import { intentsService } from "@/services/intents-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IIntent } from "@/types/intent";
import { MetadataCard } from "@/components/metadata-card";
import { IntentModal } from "@/components/intent-modal";
import { FormModal } from "@/components/form-modal";

interface DatasetModalProps {
  datasetId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DatasetModal({
  datasetId,
  isOpen,
  onClose,
}: DatasetModalProps) {
  const [dataset, setDataset] = useState<IDataset | null>(null);
  const [intents, setIntents] = useState<IIntent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewIntentId, setPreviewIntentId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    async function loadDataset() {
      if (datasetId && isOpen) {
        setIsLoading(true);
        try {
          const data = await datasetsService.getDataset(datasetId);
          setDataset(data);

          if (data.intents && data.intents.length > 0) {
            const intentPromises = data.intents.map(intentId =>
              intentsService.getIntent(intentId)
            );
            const loadedIntents = await Promise.all(intentPromises);
            setIntents(loadedIntents);
          }
        } catch (error) {
          console.error("Error loading dataset:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadDataset();
  }, [datasetId, isOpen]);

  const handlePreviewIntent = (intentId: string) => {
    setPreviewIntentId(intentId);
    setIsPreviewModalOpen(true);
  };

  if (!datasetId || !isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="space-y-4">
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-32" />
        </div>
      </FormModal>
    );
  }

  if (!dataset) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="Dataset not found">
        <p>Unable to load dataset details.</p>
      </FormModal>
    );
  }

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Dataset: ${dataset.name}`}
        actions={
          <Link href={`/ai/datasets/edit/${dataset.id}`} passHref>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Basic Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Dataset Name
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-sm normal-case px-3 py-1"
                  >
                    {dataset.name}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Total Intents
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {intents.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <CardTitle>Intents</CardTitle>
              </div>
              <CardDescription>
                All intents included in this dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {intents.length > 0 ? (
                  intents.map((intent, index) => (
                    <div
                      key={index}
                      className="text-sm p-3 bg-muted/50 border rounded-lg group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{intent.tag}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {intent.patterns?.length || 0} patterns
                          </span>
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
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No intents in this dataset
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <MetadataCard
            createdAt={dataset.createdAt}
            createdBy={dataset.createdBy}
            updatedAt={dataset.updatedAt}
            updatedBy={dataset.updatedBy}
          />
        </div>
      </FormModal>

      <IntentModal
        intentId={previewIntentId}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewIntentId(null);
        }}
        onUpdate={async () => {
          if (dataset && dataset.intents && dataset.intents.length > 0) {
            try {
              const intentPromises = dataset.intents.map(intentId =>
                intentsService.getIntent(intentId)
              );
              const loadedIntents = await Promise.all(intentPromises);
              setIntents(loadedIntents);
            } catch (error) {
              console.error("Error reloading intents:", error);
            }
          }
        }}
      />
    </>
  );
}

