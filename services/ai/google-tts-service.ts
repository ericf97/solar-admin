"use client";

export interface GoogleTTSVoice {
  languageCodes: string[];
  name: string;
  ssmlGender: "MALE" | "FEMALE";
  naturalSampleRateHertz: number;
}

export interface GoogleTTSOptions {
  voiceName?: string;
  languageCode?: string;
  ssmlGender?: "MALE" | "FEMALE";
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
  volumeGainDb?: number; // -96.0 to 16.0
  audioEncoding?: "LINEAR16" | "MP3" | "OGG_OPUS" | "MULAW" | "ALAW";
  sampleRateHertz?: number;
}

class GoogleTTSService {
  private static instance: GoogleTTSService;
  private voicesCache: GoogleTTSVoice[] | null = null;

  private constructor() {}

  static getInstance(): GoogleTTSService {
    return (this.instance ??= new GoogleTTSService());
  }

  async getVoices(languageCode?: string): Promise<GoogleTTSVoice[]> {
    const url = `/api/ai/google-tts${
      languageCode ? `?languageCode=${languageCode}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google TTS API error: ${
          error.details || error.error || response.statusText
        }`
      );
    }

    const data = await response.json();
    this.voicesCache = data.voices || [];
    return this.voicesCache || [];
  }

  async synthesize(
    text: string,
    options: GoogleTTSOptions = {}
  ): Promise<ArrayBuffer> {
    const response = await fetch("/api/ai/google-tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google TTS API error: ${
          error.details || error.error || response.statusText
        }`
      );
    }

    const data = await response.json();

    const audioContent = data.audioContent;
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }

  async generateAudio(
    text: string,
    options: GoogleTTSOptions = {}
  ): Promise<Blob> {
    const buffer = await this.synthesize(text, options);
    const mimeType = this.getMimeType(options.audioEncoding || "LINEAR16");
    return new Blob([buffer], { type: mimeType });
  }

  async generateBase64Audio(
    text: string,
    options: GoogleTTSOptions = {}
  ): Promise<string> {
    const response = await fetch("/api/ai/google-tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google TTS API error: ${
          error.details || error.error || response.statusText
        }`
      );
    }

    const data = await response.json();
    return data.audioContent;
  }

  async speak(text: string, options: GoogleTTSOptions = {}) {
    const blob = await this.generateAudio(text, options);
    const ctx = new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    const arrBuf = await blob.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrBuf);
    const node = ctx.createBufferSource();
    node.buffer = audioBuf;
    node.connect(ctx.destination);
    node.start();
  }

  private getMimeType(encoding: string): string {
    switch (encoding) {
      case "MP3":
        return "audio/mpeg";
      case "OGG_OPUS":
        return "audio/ogg";
      case "LINEAR16":
        return "audio/wav";
      case "MULAW":
        return "audio/basic";
      case "ALAW":
        return "audio/x-alaw-basic";
      default:
        return "audio/wav";
    }
  }
}

export const googleTTSService = GoogleTTSService.getInstance();

