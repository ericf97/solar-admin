"use client";

import { useEffect, useRef, useState } from "react";
import type { CopilotTool } from "@/types/copilot-tool";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ToolSelectorProps {
  query: string;
  tools: CopilotTool[];
  onSelect: (tool: CopilotTool) => void;
  onClose: () => void;
}

export function ToolSelector({
  query,
  tools,
  onSelect,
  onClose,
}: ToolSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTools = tools.filter(
    tool =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.trigger.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredTools.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          prev => (prev - 1 + filteredTools.length) % filteredTools.length
        );
      } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
        e.preventDefault();
        onSelect(filteredTools[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredTools, selectedIndex, onSelect, onClose]);

  if (filteredTools.length === 0) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground">
          No tools found matching &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-2 border-b bg-muted/50">
        <p className="text-xs font-medium text-muted-foreground">
          Select a tool (↑↓ to navigate, Enter to select, Esc to cancel)
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filteredTools.map((tool, index) => (
          <button
            key={tool.id}
            onClick={() => onSelect(tool)}
            className={cn(
              "w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors",
              selectedIndex === index && "bg-accent"
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0 mt-0.5">
              <tool.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{tool.name}</span>
                <span className="text-xs text-muted-foreground">
                  {tool.trigger}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {tool.description}
              </p>
            </div>
            {selectedIndex === index && (
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

