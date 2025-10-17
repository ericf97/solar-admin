import { generateAgents } from "@/services/ai/ai-agents-service";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { message, history, model, language, webSearchEnabled } = body;

    if (!message) {
      console.error("[AI Generate Agents] No message provided");
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await generateAgents(message, history, model, {
      language: language || "en",
      includePersonality: true,
      includeBackstory: true,
      webSearchEnabled: webSearchEnabled || false,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[AI Generate Agents] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });

    return new Response(
      JSON.stringify({
        error: "Failed to generate agents",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

