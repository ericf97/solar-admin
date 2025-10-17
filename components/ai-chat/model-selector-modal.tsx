"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, Cpu, DollarSign, Check, Sparkles, X } from "lucide-react";
import type { ModelOption } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StarFilter } from "./star-filter";

interface ModelSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelectorModal({
  open,
  onOpenChange,
  models,
  selectedModel,
  onSelectModel,
}: ModelSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [minCapacity, setMinCapacity] = useState<number>(1);
  const [maxCapacity, setMaxCapacity] = useState<number>(5);
  const [minSpeed, setMinSpeed] = useState<number>(1);
  const [maxSpeed, setMaxSpeed] = useState<number>(5);

  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    models.forEach(model => {
      const provider = model.id.split("/")[0];
      if (provider) providerSet.add(provider);
    });
    return Array.from(providerSet).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    let filtered = models;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        model =>
          model.name.toLowerCase().includes(query) ||
          model.id.toLowerCase().includes(query)
      );
    }

    if (selectedProvider !== "all") {
      filtered = filtered.filter(model =>
        model.id.startsWith(`${selectedProvider}/`)
      );
    }

    filtered = filtered.filter(
      model => model.capacity >= minCapacity && model.capacity <= maxCapacity
    );

    filtered = filtered.filter(
      model => model.speed >= minSpeed && model.speed <= maxSpeed
    );

    return filtered;
  }, [
    models,
    searchQuery,
    selectedProvider,
    minCapacity,
    maxCapacity,
    minSpeed,
    maxSpeed,
  ]);

  const handleSelectModel = (modelId: string) => {
    onSelectModel(modelId);
    onOpenChange(false);
    resetFilters();
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedProvider("all");
    setMinCapacity(1);
    setMaxCapacity(5);
    setMinSpeed(1);
    setMaxSpeed(5);
  };

  const hasActiveFilters =
    selectedProvider !== "all" ||
    minCapacity > 1 ||
    maxCapacity < 5 ||
    minSpeed > 1 ||
    maxSpeed < 5;

  const renderStars = (value: number, max: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i < value
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderPrice = (price: ModelOption["price"]) => {
    if (typeof price === "string") {
      return <span className="text-xs text-muted-foreground">{price}</span>;
    }
    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px] font-medium">Input:</span>
          <span className="font-mono">{price.input}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px] font-medium">Output:</span>
          <span className="font-mono">{price.output}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Select AI Model
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 border-b bg-muted/20 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="h-10 w-[160px]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Provider" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All providers</SelectItem>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center px-3 h-10 border rounded-md bg-background">
              <StarFilter
                min={minCapacity}
                max={maxCapacity}
                onRangeChange={(min, max) => {
                  setMinCapacity(min);
                  setMaxCapacity(max);
                }}
                icon={<Cpu className="h-4 w-4" />}
                color="emerald"
              />
            </div>
            <div className="flex items-center px-3 h-10 border rounded-md bg-background">
              <StarFilter
                min={minSpeed}
                max={maxSpeed}
                onRangeChange={(min, max) => {
                  setMinSpeed(min);
                  setMaxSpeed(max);
                }}
                icon={<Zap className="h-4 w-4" />}
                color="blue"
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-2 h-10"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="px-6 py-2 bg-muted/10 border-b">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold">{filteredModels.length}</span> of{" "}
            <span className="font-semibold">{models.length}</span> models
          </p>
        </div>
        <ScrollArea className="h-[calc(90vh-220px)]">
          <div className="p-6">
            <AnimatePresence mode="popLayout">
              {filteredModels.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12"
                >
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No models found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModels.map((model, index) => {
                    const isSelected = model.id === selectedModel;

                    return (
                      <motion.button
                        key={model.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.03,
                        }}
                        onClick={() => handleSelectModel(model.id)}
                        className={`
                          relative p-4 rounded-xl border-2 text-left
                          transition-all duration-200 group
                          bg-card hover:bg-muted/50
                          hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                          ${
                            isSelected
                              ? "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02] border-primary"
                              : "border-border hover:border-primary/50"
                          }
                        `}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                          >
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </motion.div>
                        )}
                        <div className="mb-3 pb-3 border-b border-border/50">
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                            {model.name}
                          </h3>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {model.id}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
                            <div className="flex-1 min-w-0">
                              {renderPrice(model.price)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                            <div className="flex-1 flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Capacity
                              </span>
                              {renderStars(model.capacity)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-500" />
                            <div className="flex-1 flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Speed
                              </span>
                              {renderStars(model.speed)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/50 flex gap-2 flex-wrap">
                          {model.capacity >= 4 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            >
                              High Capacity
                            </Badge>
                          )}
                          {model.speed >= 4 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            >
                              Fast
                            </Badge>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

