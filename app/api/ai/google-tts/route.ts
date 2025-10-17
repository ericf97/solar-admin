import { NextRequest } from "next/server";

export const runtime = "edge";

interface GoogleTTSRequest {
  text: string;
  options?: {
    voiceName?: string;
    languageCode?: string;
    ssmlGender?: "MALE" | "FEMALE";
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    audioEncoding?: "LINEAR16" | "MP3" | "OGG_OPUS" | "MULAW" | "ALAW";
    sampleRateHertz?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GoogleTTSRequest = await request.json();
    const { text, options = {} } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google TTS API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;

    const requestBody = {
      input: {
        text: text,
      },
      voice: {
        languageCode: options.languageCode || "en-US",
        name: options.voiceName,
        ssmlGender: options.ssmlGender,
      },
      audioConfig: {
        audioEncoding: options.audioEncoding || "LINEAR16",
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0.0,
        volumeGainDb: options.volumeGainDb || 0.0,
        sampleRateHertz: options.sampleRateHertz || 24000,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(
        JSON.stringify({
          error: "Google TTS API error",
          details: error.error?.message || response.statusText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        audioContent: data.audioContent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Google TTS API] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate speech",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageCode = searchParams.get("languageCode");

    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google TTS API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = `https://texttospeech.googleapis.com/v1beta1/voices?key=${apiKey}${
      languageCode ? `&languageCode=${languageCode}` : ""
    }`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return new Response(
        JSON.stringify({
          error: "Google TTS API error",
          details: error.error?.message || response.statusText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Google TTS API] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch voices",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

