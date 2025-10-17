import { streamAIResponse } from "./ai-service";
import { COPILOT_TOOLS } from "@/config/copilot-tools";

function generateCopilotSystemPrompt(): string {
  const toolsList = COPILOT_TOOLS.filter(t => t.id !== "general")
    .map(tool => `- ${tool.name} (${tool.trigger}): ${tool.description}`)
    .join("\n");

  return `You are Copilot, an AI assistant integrated into the Solar Admin application. Your role is to help users with:

- Understanding and navigating the application
- Managing users, portals, AI models, monsters, and skills
- Managing conversational AI components (intents, agents)
- Searching the web for current information (use /search tool)
- Answering questions about the application features
- Providing guidance on best practices
- Helping with technical issues

IMPORTANT: When users ask what tools are available or what you can help with, ONLY mention these specialized tools:

${toolsList}

Do NOT invent or mention capabilities that aren't listed above.

For web searches or questions requiring current information, suggest using the Web Search tool (/search).

When a user's request will trigger a tool switch, respond briefly acknowledging the request and let the tool switch happen.

Be concise, helpful, and professional. If you're unsure about something specific to the application, acknowledge it and suggest alternatives.`;
}

export interface CopilotStreamOptions {
  userMessage: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  model: string;
  temperature?: number;
  webSearchEnabled?: boolean;
}

export async function streamCopilotResponse({
  userMessage,
  conversationHistory = [],
  model,
  temperature = 0.7,
  webSearchEnabled = false,
}: CopilotStreamOptions) {
  return streamAIResponse({
    model,
    systemPrompt: generateCopilotSystemPrompt(),
    userMessage,
    conversationHistory,
    temperature,
    webSearchEnabled,
  });
}

