import { streamCopilotResponse } from "@/services/ai/ai-copilot-service";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { message, history, model, temperature, webSearchEnabled } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!model) {
      return new Response(JSON.stringify({ error: "Model is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await streamCopilotResponse({
      userMessage: message,
      conversationHistory: history || [],
      model,
      temperature: temperature || 0.7,
      webSearchEnabled: webSearchEnabled || false,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[Copilot API] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process copilot request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

