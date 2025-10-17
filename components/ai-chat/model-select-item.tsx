"use client";
import { Zap, Cpu, DollarSign } from "lucide-react";
import type { ModelOption } from "./chat-input";

interface ModelSelectItemContentProps {
  model: ModelOption;
  compact?: boolean;
}

export function ModelSelectItemContent({
  model,
  compact = false,
}: ModelSelectItemContentProps) {
  const renderPrice = () => {
    if (typeof model.price === "string") {
      return (
        <span className="text-xs text-muted-foreground">{model.price}</span>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <span className="text-[10px]">In:</span>
          {model.price.input}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="flex items-center gap-0.5">
          <span className="text-[10px]">Out:</span>
          {model.price.output}
        </span>
      </div>
    );
  };

  const renderStars = (value: number, max: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < value ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  if (compact) {
    return <span className="font-medium truncate">{model.name}</span>;
  }

  return (
    <div className="flex flex-col gap-2 w-full py-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{model.name}</span>
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          {renderPrice()}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Capacity</span>
          {renderStars(model.capacity)}
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Speed</span>
          {renderStars(model.speed)}
        </div>
      </div>
    </div>
  );
}

