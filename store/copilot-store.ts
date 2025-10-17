import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CopilotCanvasItem } from "@/types/copilot-tool";

interface CopilotState {
  isOpen: boolean;
  isFullscreen: boolean;
  isCanvasOpen: boolean;
  messages: unknown[];
  canvasItems: CopilotCanvasItem[];
  selectedToolId: string;
  controlsState: Record<string, unknown>;
  webSearchEnabled: boolean;
  selectedModel: string;
  inputText: string;

  setOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setFullscreen: (isFullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setCanvasOpen: (isOpen: boolean) => void;
  toggleCanvas: () => void;
  setMessages: (messages: unknown[]) => void;
  addMessage: (message: unknown) => void;
  setCanvasItems: (items: CopilotCanvasItem[]) => void;
  addCanvasItem: (item: CopilotCanvasItem) => void;
  clearCanvasItems: () => void;
  setSelectedToolId: (toolId: string) => void;
  setControlsState: (state: Record<string, unknown>) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  toggleWebSearch: () => void;
  setSelectedModel: (modelId: string) => void;
  setInputText: (text: string) => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  isFullscreen: false,
  isCanvasOpen: false,
  messages: [],
  canvasItems: [],
  selectedToolId: "general",
  controlsState: {},
  webSearchEnabled: false,
  selectedModel: "",
  inputText: "",
};

export const useCopilotStore = create<CopilotState>()(
  persist(
    set => ({
      ...initialState,

      setOpen: isOpen => set({ isOpen }),
      toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),

      setFullscreen: isFullscreen => set({ isFullscreen }),
      toggleFullscreen: () =>
        set(state => ({ isFullscreen: !state.isFullscreen })),

      setCanvasOpen: isOpen => set({ isCanvasOpen: isOpen }),
      toggleCanvas: () => set(state => ({ isCanvasOpen: !state.isCanvasOpen })),

      setMessages: messages => set({ messages }),
      addMessage: message =>
        set(state => ({ messages: [...state.messages, message] })),

      setCanvasItems: items => set({ canvasItems: items }),
      addCanvasItem: item =>
        set(state => ({ canvasItems: [...state.canvasItems, item] })),
      clearCanvasItems: () => set({ canvasItems: [], isCanvasOpen: false }),

      setSelectedToolId: toolId => set({ selectedToolId: toolId }),

      setControlsState: state => set({ controlsState: state }),

      setWebSearchEnabled: enabled => set({ webSearchEnabled: enabled }),
      toggleWebSearch: () =>
        set(state => ({ webSearchEnabled: !state.webSearchEnabled })),

      setSelectedModel: modelId => set({ selectedModel: modelId }),

      setInputText: text => set({ inputText: text }),

      reset: () => set(initialState),
    }),
    {
      name: "copilot-storage",
      partialize: state => ({
        selectedToolId: state.selectedToolId,
        controlsState: state.controlsState,
        webSearchEnabled: state.webSearchEnabled,
        selectedModel: state.selectedModel,
        isFullscreen: state.isFullscreen,
      }),
    }
  )
);

