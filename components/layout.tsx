"use client";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { useCopilotStore } from "@/store/copilot-store";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isCopilotOpen = useCopilotStore(state => state.isOpen);
  const isFullscreen = useCopilotStore(state => state.isFullscreen);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 overflow-y-auto mr-2 mb-2 bg-[hsl(var(--main-content))] rounded-lg p-3 sm:p-4 lg:p-6 border border-[hsl(var(--border))]",

            isCopilotOpen &&
              !isFullscreen &&
              "mr-[450px] transition-[margin] duration-300 ease-in-out",
            isCopilotOpen && isFullscreen && "opacity-0 pointer-events-none"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
