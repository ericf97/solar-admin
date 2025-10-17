"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";
import { IDataset } from "@/types/dataset";

interface DatasetSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: {
    mode: "existing" | "new";
    datasetId?: string;
    datasetName?: string;
  }) => void;
  datasets: IDataset[];
  isLoadingDatasets: boolean;
}

export function DatasetSaveDialog({
  isOpen,
  onClose,
  onSave,
  datasets,
  isLoadingDatasets,
}: DatasetSaveDialogProps) {
  const [saveMode, setSaveMode] = useState<"existing" | "new">("existing");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [newDatasetName, setNewDatasetName] = useState<string>("");
  const [searchDataset, setSearchDataset] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDatasetId("");
      setNewDatasetName("");
      setSearchDataset("");
      setSaveMode("existing");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchDataset.toLowerCase())
  );

  const handleSave = () => {
    const params = {
      mode: saveMode,
      datasetId: saveMode === "existing" ? selectedDatasetId : undefined,
      datasetName:
        saveMode === "new"
          ? newDatasetName.trim()
          : datasets.find(d => d.id === selectedDatasetId)?.name,
    };

    onClose();

    setTimeout(() => {
      onSave(params);
    }, 50);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="relative bg-background border rounded-lg shadow-lg w-full max-w-[500px] animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Save to Dataset</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose to save intents to an existing dataset or create a new one.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <RadioGroup
            value={saveMode}
            onValueChange={value => setSaveMode(value as "existing" | "new")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing">Add to existing dataset</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new">Create new dataset</Label>
            </div>
          </RadioGroup>
          {saveMode === "existing" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search datasets</Label>
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchDataset}
                  onChange={e => setSearchDataset(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Select dataset</Label>
                {isLoadingDatasets ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] border rounded-md">
                    <div className="p-4 space-y-2">
                      {filteredDatasets.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No datasets found
                        </p>
                      ) : (
                        filteredDatasets.map(dataset => (
                          <div
                            key={dataset.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedDatasetId === dataset.id
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedDatasetId(dataset.id)}
                          >
                            <div className="font-medium">{dataset.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {dataset.intents.length} intent(s)
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="datasetName">Dataset name</Label>
              <Input
                id="datasetName"
                placeholder="Enter dataset name..."
                value={newDatasetName}
                onChange={e => setNewDatasetName(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              (saveMode === "existing" && !selectedDatasetId) ||
              (saveMode === "new" && !newDatasetName.trim())
            }
          >
            {saveMode === "existing" ? "Add to Dataset" : "Create & Save"}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}

