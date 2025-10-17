import type { CopilotTool } from "@/types/copilot-tool";
import { COPILOT_TOOLS } from "@/config/copilot-tools";

interface ToolDetectionResult {
  tool: CopilotTool | null;
  confidence: number;
  reason?: string;
}

function generateToolSelectionPrompt(tools: CopilotTool[]): string {
  const toolDescriptions = tools
    .filter(t => t.id !== "general")
    .map(
      (tool, index) =>
        `${index + 1}. "${tool.id}" (${tool.trigger}): ${tool.description}
   Keywords: ${tool.keywords?.join(", ") || "N/A"}`
    )
    .join("\n\n");

  return `You are a tool selector. Given a user message, determine which specialized tool should handle it.

Available specialized tools:
${toolDescriptions}

Rules:
- Return ONLY the tool id (e.g., "intents", "code")
- If the message clearly matches a specialized tool, return that tool id
- If NO specialized tool matches, return "general"
- Be decisive but accurate

Examples:
- "create intents" → "intents"
- "generate code" → "code"
- "what can you do?" → "general"
- "help me with users" → "general"

Respond with ONLY the tool id, nothing else.`;
}

export function detectToolByKeywords(
  message: string,
  tools: CopilotTool[] = COPILOT_TOOLS
): ToolDetectionResult {
  const lowerMessage = message.toLowerCase();

  for (const tool of tools) {
    if (!tool.keywords || tool.keywords.length === 0) continue;

    const matchedKeywords = tool.keywords.filter(keyword =>
      lowerMessage.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      const confidence = matchedKeywords.length / tool.keywords.length;
      return {
        tool,
        confidence,
        reason: `Matched keywords: ${matchedKeywords.join(", ")}`,
      };
    }
  }

  return {
    tool: tools.find(t => t.id === "general") || null,
    confidence: 0.5,
    reason: "No specific tool matched, defaulting to general",
  };
}

export async function detectToolWithLLM(
  message: string,
  model: string,
  tools: CopilotTool[] = COPILOT_TOOLS
): Promise<ToolDetectionResult> {
  try {
    const systemPrompt = generateToolSelectionPrompt(tools);

    const response = await fetch("/api/ai/detect-tool", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        model,
        systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error("Tool detection API failed");
    }

    const { toolId } = await response.json();
    const detectedTool = tools.find(t => t.id === toolId);

    if (detectedTool) {
      return {
        tool: detectedTool,
        confidence: 0.9,
        reason:
          detectedTool.id === "general"
            ? "No specific tool matched"
            : `Detected specialized tool: ${detectedTool.name}`,
      };
    }

    return {
      tool: tools.find(t => t.id === "general") || null,
      confidence: 0.5,
      reason: "Tool not found, defaulting to general",
    };
  } catch (error) {
    console.error("[Tool Detector] LLM detection failed:", error);
    return detectToolByKeywords(message, tools);
  }
}

export async function detectToolHybrid(
  message: string,
  model: string,
  tools: CopilotTool[] = COPILOT_TOOLS
): Promise<ToolDetectionResult> {
  const keywordResult = detectToolByKeywords(message, tools);

  if (keywordResult.confidence >= 0.7) {
    return keywordResult;
  }

  return detectToolWithLLM(message, model, tools);
}

