"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarFilterProps {
  min: number;
  max: number;
  onRangeChange: (min: number, max: number) => void;
  icon?: React.ReactNode;
  color?: "amber" | "emerald" | "blue";
}

export function StarFilter({
  min,
  max,
  onRangeChange,
  icon,
  color = "amber",
}: StarFilterProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSelectingMin, setIsSelectingMin] = useState(false);

  const stars = [1, 2, 3, 4, 5];

  const getStarState = (star: number) => {
    if (hoveredStar !== null) {
      if (isSelectingMin) {
        return star <= hoveredStar && star <= max;
      } else {
        return star <= hoveredStar && star >= min;
      }
    }
    return star >= min && star <= max;
  };

  const handleStarClick = (star: number) => {
    if (isSelectingMin) {
      if (star <= max) {
        onRangeChange(star, max);
      }
    } else {
      if (star >= min) {
        onRangeChange(min, star);
      }
    }
    setIsSelectingMin(!isSelectingMin);
  };

  const colorClasses = {
    amber: {
      active: "bg-gradient-to-br from-amber-400 to-orange-500",
      hover: "hover:from-amber-300 hover:to-orange-400",
      text: "text-amber-600 dark:text-amber-500",
    },
    emerald: {
      active: "bg-gradient-to-br from-emerald-400 to-green-500",
      hover: "hover:from-emerald-300 hover:to-green-400",
      text: "text-emerald-600 dark:text-emerald-500",
    },
    blue: {
      active: "bg-gradient-to-br from-blue-400 to-cyan-500",
      hover: "hover:from-blue-300 hover:to-cyan-400",
      text: "text-blue-600 dark:text-blue-500",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="flex items-center gap-2">
      {icon && <div className={cn("shrink-0", colors.text)}>{icon}</div>}
      <div
        className="flex gap-0.5"
        onMouseLeave={() => {
          setHoveredStar(null);
          setIsSelectingMin(false);
        }}
      >
        {stars.map(star => (
          <button
            key={star}
            type="button"
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-200 cursor-pointer",
              getStarState(star)
                ? `${colors.active} ${colors.hover} scale-110`
                : "bg-muted hover:bg-muted-foreground/20"
            )}
            onMouseEnter={() => setHoveredStar(star)}
            onClick={() => handleStarClick(star)}
            title={`${isSelectingMin ? "Min" : "Max"}: ${star}`}
          />
        ))}
      </div>
    </div>
  );
}

