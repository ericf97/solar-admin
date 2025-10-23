"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SplitViewProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function SplitView({
  isOpen,
  children,
  title,
  actions,
  onClose,
}: SplitViewProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <div
      className={cn(
        "h-full transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
        isOpen ? "w-full lg:w-[60%] xl:w-[45%] ml-0 lg:ml-4" : "w-0 ml-0"
      )}
    >
      {isOpen && (
        <div className="h-full bg-background border rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-muted/30 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              {title || "Details"}
            </h2>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      )}
    </div>
  );
}
