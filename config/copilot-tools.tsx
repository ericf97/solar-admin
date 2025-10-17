import { Sparkles, Bot, User } from "lucide-react";
import type {
  CopilotTool,
  CopilotToolMessage,
  CopilotToolResponse,
  CopilotCanvasItem,
} from "@/types/copilot-tool";
import { IntentGenerationControlsWrapper } from "@/components/ai-chat/intent-generation-controls-wrapper";
import type { IIntent } from "@/types/intent";
import { nanoid } from "nanoid";
import { parseIntentsFromResponse } from "@/services/ai/ai-intents-service";
import { IntentsCanvas } from "@/components/copilot/intents-canvas";
import { AgentsCanvas } from "@/components/copilot/agents-canvas";
import { parseAgentsFromResponse } from "@/services/ai/ai-agents-service";
import type { IAgent } from "@/types/agent";

interface IntentCanvasItem extends CopilotCanvasItem {
  tag: string;
  patterns: string[];
  responses: Array<{ text: string; alt?: string }>;
  options?: Array<{ label: string; text: string; tag: string }>;
  visualCue?: {
    face?: { id: string; intensity: number };
    body?: { id: string; intensity: number };
  };
}

interface AgentCanvasItem extends CopilotCanvasItem {
  name: string;
  description?: string;
  role?: string;
  systemPrompt?: string;
  objective?: string;
  personality?: string;
  backstory?: string;
}

interface IntentControlsState {
  language: string;
  avgCount: number;
  forceOptions: boolean;
  includeInHistory: boolean;
  contextVariables: string[];
}

async function callCopilotAPI(
  message: CopilotToolMessage
): Promise<CopilotToolResponse> {
  const response = await fetch("/api/ai/copilot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message.userMessage,
      history: message.conversationHistory,
      model: message.model,
      temperature: message.temperature || 0.7,
      webSearchEnabled: message.webSearchEnabled || false,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return {
    stream: response.body!,
  };
}

async function callIntentsAPI(
  message: CopilotToolMessage,
  options: IntentControlsState
): Promise<CopilotToolResponse> {
  const response = await fetch("/api/ai/generate-intents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message.userMessage,
      history: message.conversationHistory,
      model: message.model,
      language: options.language,
      avgCount: options.avgCount,
      forceOptions: options.forceOptions,
      contextVariables: options.contextVariables,
      webSearchEnabled: message.webSearchEnabled || false,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return {
    stream: response.body!,
    parseContent: (text: string) => parseIntentsFromResponse(text),
  };
}

async function callAgentsAPI(
  message: CopilotToolMessage,
  options: { language: string }
): Promise<CopilotToolResponse> {
  const response = await fetch("/api/ai/generate-agents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message.userMessage,
      history: message.conversationHistory,
      model: message.model,
      language: options.language,
      webSearchEnabled: message.webSearchEnabled || false,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return {
    stream: response.body!,
    parseContent: (text: string) => parseAgentsFromResponse(text),
  };
}

const generalCopilotTool: CopilotTool = {
  id: "general",
  name: "General Assistant",
  description: "General help with the Solar Admin application",
  trigger: "/copilot",
  icon: Sparkles,
  canvasEnabled: false,
  keywords: [
    "help",
    "how to",
    "what is",
    "explain",
    "guide",
    "navigate",
    "dashboard",
    "user",
    "portal",
    "monster",
    "skill",
    "what can you do",
    "available tools",
    "tools list",
  ],

  getSystemPrompt: () => {
    const toolsList = COPILOT_TOOLS.filter(t => t.id !== "general")
      .map(tool => `- ${tool.name} (${tool.trigger}): ${tool.description}`)
      .join("\n");

    return `You are Copilot, an AI assistant integrated into the Solar Admin application.

Available specialized tools:
${toolsList}

When users ask about available tools or what you can help with, list ONLY the specialized tools above.

When a user's request will trigger a tool switch, respond briefly like:
"I'll switch you to the [Tool Name] where you can [brief action]."

For general questions about the app (users, portals, monsters, skills, etc.), provide helpful guidance.

Note: You have access to web search when enabled by the user. When web search is active, you'll receive current information from the internet to supplement your responses.`;
  },

  handleSubmit: async (message: CopilotToolMessage) => {
    return callCopilotAPI(message);
  },
};

const intentsCreatorTool: CopilotTool<IntentCanvasItem, IntentControlsState> = {
  id: "intents",
  name: "Intents Creator",
  description: "Create conversation intents for chatbots",
  trigger: "/intents",
  icon: Bot,
  canvasEnabled: true,
  keywords: [
    "intent",
    "intents",
    "create intent",
    "generate intent",
    "new intent",
    "intent for",
    "conversation intent",
    "chatbot intent",
    "bot intent",
    "training data",
  ],

  getSystemPrompt: (context?: IntentControlsState) => {
    const safeContext: IntentControlsState = {
      language: context?.language || "en",
      avgCount: context?.avgCount || 4,
      forceOptions: context?.forceOptions || false,
      contextVariables: context?.contextVariables || [],
      includeInHistory: context?.includeInHistory || false,
    };

    return `You are an AI assistant specialized in creating conversation intents for chatbots.

Current configuration:
- Language: ${safeContext.language}
- Average count: ${safeContext.avgCount}
- Force options: ${safeContext.forceOptions}
- Context variables: ${safeContext.contextVariables.join(", ") || "none"}

Generate intents according to these specifications.`;
  },

  handleSubmit: async (message: CopilotToolMessage) => {
    const controls = message.controlsState as IntentControlsState | undefined;

    const options: IntentControlsState = {
      language: controls?.language || "en",
      avgCount: controls?.avgCount || 4,
      forceOptions: controls?.forceOptions || false,
      contextVariables: controls?.contextVariables || [],
      includeInHistory: controls?.includeInHistory || false,
    };

    return callIntentsAPI(message, options);
  },

  parseCanvasItems: (text: string): IntentCanvasItem[] => {
    const intents = parseIntentsFromResponse(text);
    return intents.map((intent: IIntent) => ({
      id: intent.id || nanoid(),
      tag: intent.tag,
      patterns: intent.patterns,
      responses: intent.responses,
      options: intent.options,
      visualCue: intent.visualCue,
    }));
  },

  CanvasComponent: IntentsCanvas,

  ControlsComponent: IntentGenerationControlsWrapper,

  initialControlsState: {
    language: "en",
    avgCount: 4,
    forceOptions: false,
    includeInHistory: false,
    contextVariables: [],
  },

  collapsibleBlocks: [
    {
      language: "json",
      hideByDefault: true,
      collapsedLabel: "Generating intent...",
      collapsedIcon: Sparkles,
      animate: true,
    },
  ],
};

const agentsCreatorTool: CopilotTool<AgentCanvasItem, { language: string }> = {
  id: "agents",
  name: "Agents Creator",
  description: "Create conversational AI agents with personality and backstory",
  trigger: "/agents",
  icon: User,
  canvasEnabled: true,
  keywords: [
    "agent",
    "agents",
    "create agent",
    "generate agent",
    "new agent",
    "chatbot agent",
    "conversational agent",
    "ai agent",
    "virtual agent",
    "assistant",
  ],

  getSystemPrompt: (context?: { language: string }) => {
    const language = context?.language || "en";

    return `You are an AI assistant specialized in creating conversational AI agents.

Current configuration:
- Language: ${language}

Generate agents with detailed system prompts, clear objectives, and appropriate personality traits.`;
  },

  handleSubmit: async (message: CopilotToolMessage) => {
    const controls = message.controlsState as { language: string } | undefined;

    const options = {
      language: controls?.language || "en",
    };

    return callAgentsAPI(message, options);
  },

  parseCanvasItems: (text: string): AgentCanvasItem[] => {
    const agents = parseAgentsFromResponse(text);
    return agents.map((agent: Partial<IAgent>) => ({
      id: nanoid(),
      name: agent.name || "Unnamed Agent",
      description: agent.description,
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      objective: agent.objective,
      personality: agent.personality,
      backstory: agent.backstory,
    }));
  },

  CanvasComponent: AgentsCanvas,

  initialControlsState: {
    language: "en",
  },

  collapsibleBlocks: [
    {
      language: "json",
      hideByDefault: true,
      collapsedLabel: "Generating agent...",
      collapsedIcon: User,
      animate: true,
    },
  ],
};

// Remove webSearchTool from exports
export const COPILOT_TOOLS: CopilotTool[] = [
  generalCopilotTool,
  intentsCreatorTool as unknown as CopilotTool,
  agentsCreatorTool as unknown as CopilotTool,
];

export const getToolByTrigger = (trigger: string): CopilotTool | undefined => {
  return COPILOT_TOOLS.find(tool => tool.trigger === trigger);
};

export const getToolById = (id: string): CopilotTool | undefined => {
  return COPILOT_TOOLS.find(tool => tool.id === id);
};

