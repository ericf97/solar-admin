"use client";

import { CopilotChat } from "./copilot-chat";
import { useCopilotStore } from "@/store/copilot-store";
import { cn } from "@/lib/utils";

export function CopilotWrapper() {
  const isOpen = useCopilotStore(state => state.isOpen);
  const isFullscreen = useCopilotStore(state => state.isFullscreen);

  return (
    <div
      className={cn(
        "fixed right-0 top-14 bottom-0 bg-background z-30 overflow-hidden"
      )}
      style={{
        width: !isOpen ? "0px" : isFullscreen ? "100vw" : "450px",
        transition: "width 300ms ease-in-out, border-color 300ms ease-in-out",
      }}
    >
      <CopilotChat isOpen={isOpen} />
    </div>
  );
}

