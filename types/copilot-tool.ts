import { ChatMessage } from "@/components/ai-chat/chat-container";
import { ChatStatus } from "ai";
import { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { CollapsibleBlockConfig } from "@/components/ai-elements/response";

export interface CopilotToolMessage {
  userMessage: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  model: string;
  temperature?: number;
  controlsState?: Record<string, unknown>;
  systemPrompt?: string;
  webSearchEnabled?: boolean;
}

export interface CopilotToolResponse {
  stream: ReadableStream;
  parseContent?: (text: string) => unknown[];
}

export interface CopilotCanvasItem {
  id: string;
  [key: string]: unknown;
}

export interface CopilotCanvasProps<T = CopilotCanvasItem> {
  items: T[];
  onClear?: () => void;
}

export interface CopilotControlsProps<T = Record<string, unknown>> {
  value: T;
  onChange: (value: T) => void;
}

export interface CopilotTool<
  TCanvasItem extends CopilotCanvasItem = CopilotCanvasItem,
  TControlsState = Record<string, unknown>
> {
  id: string;
  name: string;
  description: string;
  trigger: string;
  icon: LucideIcon;
  canvasEnabled: boolean;
  keywords?: string[];
  detectionPrompt?: string;
  getSystemPrompt: (context?: TControlsState) => string;
  handleSubmit: (message: CopilotToolMessage) => Promise<CopilotToolResponse>;
  parseCanvasItems?: (text: string) => TCanvasItem[];
  CanvasComponent?: ComponentType<CopilotCanvasProps<TCanvasItem>>;
  ControlsComponent?: ComponentType<CopilotControlsProps<TControlsState>>;
  initialControlsState?: TControlsState;
  collapsibleBlocks?: CollapsibleBlockConfig[];
}

export interface UseCopilotChatReturn {
  messages: ChatMessage[];
  status: ChatStatus;
  handleSubmit: (message: { text?: string; files?: File[] }) => void;
  stop: () => void;
  shouldHideJsonBlocks: boolean;
}

