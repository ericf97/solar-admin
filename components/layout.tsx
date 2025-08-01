import { Sidebar } from "@/components/sidebar";

import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 overflow-y-auto border-r border-border md:block">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 md:ml-4">
        {children}
      </main>
    </div>
  );
}

