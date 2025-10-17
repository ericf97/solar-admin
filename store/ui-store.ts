import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      isSidebarCollapsed: false,
      toggleSidebar: () =>
        set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: isCollapsed =>
        set({ isSidebarCollapsed: isCollapsed }),
    }),
    {
      name: "ui-storage",
    }
  )
);

