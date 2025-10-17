"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Bot,
  MessageSquare,
  Target,
  RefreshCw,
  Database,
  Eye,
  Volume2,
} from "lucide-react";
import { IAgent } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { agentsService } from "@/services/agents-service";
import { datasetsService } from "@/services/datasets-service";
import { IDataset } from "@/types/dataset";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetadataCard } from "@/components/metadata-card";
import { DatasetModal } from "@/components/dataset-modal";

interface AgentModalProps {
  agentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentModal({ agentId, isOpen, onClose }: AgentModalProps) {
  const [agent, setAgent] = useState<IAgent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [datasets, setDatasets] = useState<IDataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    async function loadAgent() {
      if (agentId && isOpen) {
        setIsLoading(true);
        try {
          const data = await agentsService.getAgent(agentId);
          setAgent(data);
          if (data.datasets && data.datasets.length > 0) {
            setIsLoadingDatasets(true);
            try {
              const datasetPromises = data.datasets.map(datasetId =>
                datasetsService.getDataset(datasetId)
              );
              const loadedDatasets = await Promise.all(datasetPromises);
              setDatasets(loadedDatasets);
            } catch (error) {
              console.error("Error loading datasets:", error);
            } finally {
              setIsLoadingDatasets(false);
            }
          }
        } catch (error) {
          console.error("Error loading agent:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadAgent();
  }, [agentId, isOpen]);

  const handlePreviewDataset = (datasetId: string) => {
    setPreviewDatasetId(datasetId);
    setIsPreviewModalOpen(true);
  };

  if (!agentId || !isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-32" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!agent) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Agent not found</DialogTitle>
          </DialogHeader>
          <p>Unable to load agent details.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto pt-10">
        <DialogHeader className="flex flex-row justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <DialogTitle className="text-2xl font-bold">
                {agent.name}
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Agent details and configuration
            </p>
          </div>
          <Link href={`/ai/agents/edit/${agent.id}`} passHref>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Agent Name
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-sm normal-case px-3 py-1"
                    >
                      {agent.name}
                    </Badge>
                  </div>
                  {agent.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Description
                      </p>
                      <p className="text-sm">{agent.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(agent.role ||
              agent.systemPrompt ||
              agent.objective ||
              agent.personality ||
              agent.backstory) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    <CardTitle>Agent Configuration</CardTitle>
                  </div>
                  <CardDescription>
                    Behavior and personality settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agent.role && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Role
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {agent.role}
                        </p>
                      </div>
                    )}
                    {agent.systemPrompt && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          System Prompt
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {agent.systemPrompt}
                        </p>
                      </div>
                    )}
                    {agent.objective && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Main Objective
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {agent.objective}
                        </p>
                      </div>
                    )}
                    {agent.personality && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Personality
                        </p>
                        <Badge
                          variant="outline"
                          className="text-sm normal-case"
                        >
                          {agent.personality}
                        </Badge>
                      </div>
                    )}
                    {agent.backstory && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Backstory
                        </p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {agent.backstory}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {agent.datasets.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-500" />
                    <CardTitle>Datasets</CardTitle>
                  </div>
                  <CardDescription>
                    {isLoadingDatasets
                      ? "Loading datasets..."
                      : `${datasets.length} linked dataset(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {isLoadingDatasets ? (
                      <div className="space-y-2">
                        {agent.datasets.map((_, index) => (
                          <Skeleton key={index} className="w-full h-16" />
                        ))}
                      </div>
                    ) : (
                      datasets.map(dataset => (
                        <div
                          key={dataset.id}
                          className="p-3 bg-muted/50 border rounded-lg space-y-2 group hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <Badge
                                variant="secondary"
                                className="text-sm normal-case"
                              >
                                {dataset.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {dataset.intents?.length || 0} intents
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewDataset(dataset.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {dataset.id}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <CardTitle>Greetings</CardTitle>
                </div>
                <CardDescription>Initial greeting messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.greetings.map((greeting, index) => (
                    <div
                      key={index}
                      className="text-sm p-3 bg-muted/50 border rounded-lg"
                    >
                      {greeting}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                  <CardTitle>Fallback Messages</CardTitle>
                </div>
                <CardDescription>
                  Messages when no intent matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.fallback.map((fallback, index) => (
                    <div
                      key={index}
                      className="text-sm p-3 bg-muted/50 border rounded-lg"
                    >
                      {fallback}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-green-500" />
                  <CardTitle>Repeated Input Config</CardTitle>
                </div>
                <CardDescription>
                  Configuration for repeated input detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Enabled
                    </span>
                    <Badge
                      variant={
                        agent.repeatedInputConfig.enabled
                          ? "default"
                          : "secondary"
                      }
                    >
                      {agent.repeatedInputConfig.enabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Tolerance
                    </span>
                    <span className="text-sm font-medium">
                      {agent.repeatedInputConfig.tolerance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      History Size
                    </span>
                    <span className="text-sm font-medium">
                      {agent.repeatedInputConfig.historySize}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Allow Original
                    </span>
                    <Badge
                      variant={
                        agent.repeatedInputConfig.allowOriginalResponse
                          ? "default"
                          : "secondary"
                      }
                    >
                      {agent.repeatedInputConfig.allowOriginalResponse
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                </div>

                {agent.repeatedInput.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Repeated Input Messages
                    </p>
                    {agent.repeatedInput.map((input, index) => (
                      <div
                        key={index}
                        className="text-sm p-3 bg-muted/50 border rounded-lg"
                      >
                        {input}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {agent.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <CardTitle>Objectives</CardTitle>
                  </div>
                  <CardDescription>
                    Agent objectives configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {agent.objectives.map((objective, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted/50 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-xs normal-case"
                          >
                            Objective {index + 1}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Tag
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs normal-case"
                            >
                              {objective.tag}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Interval Messages
                            </span>
                            <span className="text-xs font-medium">
                              {objective.intervalMessages}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Show After Reply
                            </span>
                            <Badge
                              variant={
                                objective.showAfterReply
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {objective.showAfterReply ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {agent.voiceConfig && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-indigo-500" />
                    <CardTitle>Voice Configuration</CardTitle>
                  </div>
                  <CardDescription>Text-to-speech settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Provider
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-sm normal-case"
                      >
                        {agent.voiceConfig.provider}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Voice ID
                      </p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg font-mono">
                        {agent.voiceConfig.voiceId}
                      </p>
                    </div>
                    {agent.voiceConfig.additionalConfig?.speakerId !==
                      undefined && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Speaker ID
                        </p>
                        <Badge variant="outline" className="text-sm">
                          {agent.voiceConfig.additionalConfig.speakerId}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <MetadataCard
              createdAt={agent.createdAt}
              createdBy={agent.createdBy}
              updatedAt={agent.updatedAt}
              updatedBy={agent.updatedBy}
            />
          </div>
        </div>
      </DialogContent>

      <DatasetModal
        datasetId={previewDatasetId}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewDatasetId(null);
        }}
      />
    </Dialog>
  );
}

