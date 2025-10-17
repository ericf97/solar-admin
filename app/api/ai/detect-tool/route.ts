import { generateText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { message, model, systemPrompt } = await request.json();

    if (!message || !model || !systemPrompt) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: message,
      temperature: 0.1,
    });

    const toolId = result.text.trim().toLowerCase();

    return Response.json({ toolId });
  } catch (error) {
    console.error("[Detect Tool API] Error:", error);
    return Response.json(
      {
        error: "Failed to detect tool",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

