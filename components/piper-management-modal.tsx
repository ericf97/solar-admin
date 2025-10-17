"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, HardDrive, Globe } from "lucide-react";
import { piperService, VoiceInfo } from "../services/ai/piper-service";
import { VoiceId } from "@diffusionstudio/vits-web";

interface ModelManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelManagementModal({
  isOpen,
  onClose,
}: ModelManagementModalProps) {
  const [voices, setVoices] = useState<Record<string, VoiceInfo>>({});
  const [downloadedModels, setDownloadedModels] = useState<Set<VoiceId>>(
    new Set()
  );
  const [totalSize, setTotalSize] = useState<number>(0);
  const [modelToDelete, setModelToDelete] = useState<VoiceId | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setVoices(piperService.getVoices());
    const models = await piperService.getDownloadedModels();
    setDownloadedModels(models);
    const size = await piperService.getTotalDownloadedSize();
    setTotalSize(size);
  };

  const handleConfirmDelete = async () => {
    if (modelToDelete) {
      await piperService.removeModel(modelToDelete);
      await loadData();
      setModelToDelete(null);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "high":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "low":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "x_low":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">Model Management</DialogTitle>
            <DialogDescription>
              Manage downloaded models on your device
            </DialogDescription>
          </DialogHeader>

          <div className="px-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {downloadedModels.size}
                  </div>
                  <div className="text-xs text-muted-foreground">Models</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {totalSize.toFixed(1)} MB
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Space
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px] px-6">
            <div className="space-y-2 pb-6">
              {Array.from(downloadedModels).map(modelId => {
                const voice = voices[modelId];
                if (!voice) return null;

                return (
                  <div
                    key={modelId}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {voice.name}
                        </span>
                        <Badge className={getQualityColor(voice.quality)}>
                          {voice.quality}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{voice.language.name_native}</span>
                        <span>·</span>
                        <span>{voice.language.country_english}</span>
                        <span>·</span>
                        <span className="font-medium">
                          {piperService.getModelSize(modelId)} MB
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setModelToDelete(modelId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {downloadedModels.size === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <HardDrive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No downloaded models</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!modelToDelete}
        onOpenChange={() => setModelToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the model{" "}
              <strong>{modelToDelete && voices[modelToDelete]?.name}</strong>{" "}
              from your device. You will need to download it again to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

