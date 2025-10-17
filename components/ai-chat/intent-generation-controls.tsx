"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Languages,
  ListOrdered,
  Link,
  History,
  X,
  ChevronDown,
  SlidersHorizontal,
  Braces,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface IntentGenerationControlsProps {
  language: string;
  onLanguageChange: (language: string) => void;
  avgCount: number;
  onAvgCountChange: (count: number) => void;
  forceOptions: boolean;
  onForceOptionsChange: (force: boolean) => void;
  includeInHistory: boolean;
  onIncludeInHistoryChange: (include: boolean) => void;
  contextVariables: string[];
  onContextVariablesChange: (vars: string[]) => void;
}

export function IntentGenerationControls({
  language,
  onLanguageChange,
  avgCount,
  onAvgCountChange,
  forceOptions,
  onForceOptionsChange,
  includeInHistory,
  onIncludeInHistoryChange,
  contextVariables,
  onContextVariablesChange,
}: IntentGenerationControlsProps) {
  const [ctxInput, setCtxInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const addVariable = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const token = v.replace(/^\{\{|\}\}$/g, "").trim();
    if (!token || contextVariables.includes(token)) return;
    onContextVariablesChange([...contextVariables, token]);
    setCtxInput("");
  };

  const removeVariable = (token: string) => {
    onContextVariablesChange(contextVariables.filter(v => v !== token));
  };

  const handleCtxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      addVariable(ctxInput);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden bg-background">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-500/5 via-fuchsia-500/5 to-amber-500/5 border-b hover:bg-accent/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls="generation-controls-body"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SlidersHorizontal className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold">Generation Controls</span>
            <span className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Configure language, sizes, options and context
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <Badge
            variant="secondary"
            className="text-[10px] gap-1 px-1.5 py-0.5"
          >
            <Languages className="h-3 w-3" />
            <span className="hidden xs:inline">{language?.toUpperCase()}</span>
          </Badge>

          <Badge
            variant="secondary"
            className="text-[10px] gap-1 px-1.5 py-0.5"
          >
            <ListOrdered className="h-3 w-3" />
            <span>{avgCount}</span>
          </Badge>

          {forceOptions && (
            <Badge
              variant="secondary"
              className="text-[10px] gap-1 px-1.5 py-0.5 hidden sm:inline-flex"
            >
              <Link className="h-3 w-3" />
            </Badge>
          )}

          {contextVariables?.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 px-1.5 py-0.5 hidden md:inline-flex"
            >
              <Braces className="h-3 w-3" />
              <span>{contextVariables.length}</span>
            </Badge>
          )}

          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          id="generation-controls-body"
          className="space-y-3 p-3 bg-muted/20 max-h-[60vh] overflow-y-auto"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" />
              Language
            </Label>
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListOrdered className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Avg. Count</span>
                <span className="xs:hidden">Count</span>
              </span>
              <span className="text-primary font-semibold text-sm">
                {avgCount}
              </span>
            </Label>
            <Slider
              value={[avgCount]}
              onValueChange={values => onAvgCountChange(values[0])}
              min={2}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              Patterns & responses per intent
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="force-options"
                checked={forceOptions}
                onCheckedChange={checked =>
                  onForceOptionsChange(checked as boolean)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="force-options"
                className="text-xs font-normal flex items-start gap-1.5 cursor-pointer leading-tight"
              >
                <Link className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Force options</span>
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="include-history"
                checked={includeInHistory}
                onCheckedChange={checked =>
                  onIncludeInHistoryChange(checked as boolean)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="include-history"
                className="text-xs font-normal flex items-start gap-1.5 cursor-pointer leading-tight"
              >
                <History className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Include in history</span>
              </Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Braces className="h-3.5 w-3.5" />
              Context Variables
            </Label>

            {contextVariables?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {contextVariables.map(token => (
                  <Badge
                    key={token}
                    variant="secondary"
                    className="text-[10px] gap-1 pr-1 py-0.5"
                  >
                    <span className="max-w-[100px] truncate">{token}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-3.5 w-3.5 hover:bg-destructive/20"
                      onClick={() => removeVariable(token)}
                      title="Remove"
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <Input
              value={ctxInput}
              onChange={e => setCtxInput(e.target.value)}
              onKeyDown={handleCtxKeyDown}
              placeholder="user_name"
              className="h-8 text-xs"
              onBlur={() => addVariable(ctxInput)}
            />
            <p className="text-[9px] text-muted-foreground leading-tight">
              Type and press Enter. Use as{" "}
              <code className="text-[9px]">{"{{var}}"}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

