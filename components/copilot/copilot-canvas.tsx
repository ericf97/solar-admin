"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CopilotCanvasProps {
  items: unknown[];
  onClear?: () => void;
}

export function CopilotCanvas({ items, onClear }: CopilotCanvasProps) {
  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-sidebar">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Canvas</h2>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              Generated content will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ask Copilot to create something for you
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

