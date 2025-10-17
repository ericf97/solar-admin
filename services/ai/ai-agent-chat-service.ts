import { streamAIResponse } from "./ai-service";
import { IAgent } from "@/types/agent";
import { agentsService } from "@/services/agents-service";
import { intentsService } from "../intents-service";
import { datasetsService } from "../datasets-service";

export interface AgentChatContext {
  agent: IAgent;
  systemPrompt: string;
}

function generateAgentSystemPrompt(agent: IAgent): string {
  const sections = [];

  sections.push(`You are ${agent.name}, an AI assistant.`);

  if (agent.role) {
    sections.push(`Your role: ${agent.role}`);
  }

  if (agent.description) {
    sections.push(`About you: ${agent.description}`);
  }

  if (agent.objective) {
    sections.push(`Your main objective: ${agent.objective}`);
  }

  if (agent.personality) {
    sections.push(`Your personality: ${agent.personality}`);
  }

  if (agent.backstory) {
    sections.push(`Your backstory: ${agent.backstory}`);
  }

  if (agent.systemPrompt) {
    sections.push(`\nSpecial instructions:\n${agent.systemPrompt}`);
  }

  sections.push(`
RESPONSE LENGTH GUIDELINES (CRITICAL):
- Be EXTREMELY brief: Maximum 1 short sentence or 8-20 words
- Go straight to the point - no fluff, no elaboration
- Answer directly without explanations unless specifically asked
- NEVER repeat your name or introduce yourself - the user already knows who you are
- If you can answer in 3-5 words, do it
- Think: "What's the shortest useful answer I can give?"`);

  sections.push(`
RESPONSE FORMAT (MANDATORY):
You must always respond with a JSON object in this exact format:
\`\`\`json
{
  "text": "Your conversational response here",
  "visualCue": {
    "face": {
      "id": "FACE_ANIMATION_NAME",
      "intensity": 0.8
    },
    "body": {
      "id": "BODY_ANIMATION_NAME",
      "intensity": 0.7
    }
  }
}
\`\`\`

AVAILABLE ANIMATIONS:
Face animations: FRIENDLY, ATTENTIVE, FOCUSED, CONCERNED, NEUTRAL, HAPPY, SAD, ANGRY, SURPRISED
Body animations: WAVING, NODDING, GESTURING, SUPPORTIVE, LOOKING_DOWN, IDLE, AGREEING, THINKING, EXPLAINING

ANIMATION GUIDELINES:
- intensity: value between 0 and 1
- Choose animations that match the emotion and context of your response
- Stay in character based on your personality and role

Remember: Your response must ALWAYS be a valid JSON object with both "text" and "visualCue" fields.`);

  return sections.join("\n\n");
}

export async function loadAgentChatContext(
  agentId: string
): Promise<AgentChatContext> {
  try {
    const agent = await agentsService.getAgent(agentId);
    const systemPrompt = generateAgentSystemPrompt(agent);

    return {
      agent,
      systemPrompt,
    };
  } catch (error) {
    console.error("[Agent Chat Service] Error loading agent:", error);
    throw new Error(
      `Failed to load agent: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface AgentChatOptions {
  agentId: string;
  userMessage: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  model: string;
  temperature?: number;
}

export async function streamAgentChat({
  agentId,
  userMessage,
  conversationHistory = [],
  model,
  temperature = 0.7,
}: AgentChatOptions) {
  const context = await loadAgentChatContext(agentId);

  return streamAIResponse({
    model,
    systemPrompt: context.systemPrompt,
    userMessage,
    conversationHistory,
    temperature,
  });
}

export interface AgentChatResponse {
  text: string;
  fullResponse: string;
}

export async function generateAgentChatResponse({
  agentId,
  userMessage,
  conversationHistory = [],
  model,
  temperature = 0.7,
}: AgentChatOptions): Promise<AgentChatResponse> {
  const context = await loadAgentChatContext(agentId);

  const response = await fetch("/api/ai/agent-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId,
      message: userMessage,
      history: conversationHistory,
      model,
      systemPrompt: context.systemPrompt,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    text: data.text,
    fullResponse: data.text,
  };
}

export async function loadAgentFullData(agentId: string) {
  try {
    const agent = await agentsService.getAgent(agentId);

    if (!agent.datasets || agent.datasets.length === 0) {
      return {
        agent,
        agentJson: null,
        hasDatasets: false,
      };
    }

    const datasetsWithIntents = await Promise.all(
      agent.datasets.map(async datasetId => {
        const dataset = await datasetsService.getDataset(datasetId);

        const intents = await Promise.all(
          dataset.intents.map(intentId => intentsService.getIntent(intentId))
        );

        return {
          Name: dataset.name,
          Intents: intents.map(intent => ({
            Tag: intent.tag,
            Patterns: intent.patterns,
            Responses: intent.responses.map(r => ({
              Text: r.text,
              Alt: r.alt || null,
            })),
            Options: intent.options
              ? intent.options.map(opt => ({
                  Label: opt.label,
                  Text: opt.text,
                  Tag: opt.tag,
                }))
              : null,
            VisualCue: intent.visualCue
              ? {
                  Face: intent.visualCue.face
                    ? {
                        Id: intent.visualCue.face.id,
                        Intensity: intent.visualCue.face.intensity,
                      }
                    : null,
                  Body: intent.visualCue.body
                    ? {
                        Id: intent.visualCue.body.id,
                        Intensity: intent.visualCue.body.intensity,
                      }
                    : null,
                }
              : null,
          })),
        };
      })
    );

    const agentData = {
      Name: agent.name,
      Description: agent.description || "",
      Datasets: datasetsWithIntents,
      Greetings: agent.greetings || [],
      Fallback: agent.fallback || [],
      RepeatedInput: agent.repeatedInput || [],
      RepeatedInputConfig: {
        Enabled: agent.repeatedInputConfig?.enabled ?? true,
        Tolerance: agent.repeatedInputConfig?.tolerance ?? 2,
        HistorySize: agent.repeatedInputConfig?.historySize ?? 5,
        AllowOriginalResponse:
          agent.repeatedInputConfig?.allowOriginalResponse ?? true,
      },
      Objectives: (agent.objectives || []).map(obj => ({
        Tag: obj.tag,
        IntervalMessages: obj.intervalMessages,
        ShowAfterReply: obj.showAfterReply,
      })),
    };

    const agentJson = JSON.stringify(agentData);

    return {
      agent,
      agentJson,
      hasDatasets: true,
    };
  } catch (error) {
    console.error("[AgentChat] Error loading full agent data:", error);
    throw error;
  }
}

