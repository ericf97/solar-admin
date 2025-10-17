import { generateAIResponse } from "@/services/ai/ai-service";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { message, history, model, systemPrompt, temperature } = body;

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

    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "System prompt is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const text = await generateAIResponse({
      model,
      systemPrompt,
      userMessage: message,
      conversationHistory: history || [],
      temperature: temperature || 0.7,
    });

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI Chat API] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

