"use client";

import * as Comlink from "comlink";
import type { PiperWorkerAPI } from "./piper-worker";
import { VoiceId } from "@diffusionstudio/vits-web";

type ProgressCallback = (percent: number) => void;

export interface VoiceInfo {
  key: string;
  name: string;
  quality: string;
  language: {
    code: string;
    name_english: string;
    name_native: string;
    country_english: string;
  };
  files: Record<string, { size_bytes: number; md5_digest: string }>;
  aliases: string[];
  num_speakers?: number;
  speaker_id_map?: Record<string, number>;
}

class PiperService {
  private static instance: PiperService;
  private worker?: Worker;
  private remote?: Comlink.Remote<PiperWorkerAPI>;
  private voicesCache: Record<string, VoiceInfo> = {};

  private constructor() {}

  static getInstance(): PiperService {
    return (this.instance ??= new PiperService());
  }

  async initialize() {
    if (this.remote) return;
    this.worker = new Worker(new URL("./piper-worker.ts", import.meta.url), {
      type: "module",
    });
    this.remote = Comlink.wrap<PiperWorkerAPI>(this.worker);
    const voicesArray = await this.remote.voices();
    this.voicesCache = voicesArray.reduce((acc, voice) => {
      acc[voice.key] = voice as VoiceInfo;
      return acc;
    }, {} as Record<string, VoiceInfo>);
  }

  getVoices(): Record<string, VoiceInfo> {
    return this.voicesCache;
  }

  getVoice(voiceId: string): VoiceInfo | null {
    return this.voicesCache[voiceId] || null;
  }

  async getDownloadedModels(): Promise<Set<VoiceId>> {
    await this.initialize();
    const stored = await this.remote!.stored();
    return new Set(stored);
  }

  async isModelDownloaded(voiceId: VoiceId): Promise<boolean> {
    await this.initialize();
    const stored = await this.remote!.stored();
    return stored.includes(voiceId);
  }

  getModelSize(voiceId: VoiceId): string {
    const voice = this.voicesCache[voiceId];
    if (!voice?.files) return "0";
    const totalBytes = Object.values(voice.files).reduce(
      (sum, file) => sum + (file.size_bytes || 0),
      0
    );
    return (totalBytes / (1024 * 1024)).toFixed(1);
  }

  async getTotalDownloadedSize(): Promise<number> {
    const downloaded = await this.getDownloadedModels();
    return Array.from(downloaded).reduce(
      (sum, id) => sum + parseFloat(this.getModelSize(id)),
      0
    );
  }

  getDefaultVoiceId(): string | null {
    const voiceIds = Object.keys(this.voicesCache);
    if (voiceIds.length === 0) return null;
    return voiceIds.find(id => id.startsWith("en_")) || voiceIds[0];
  }

  async downloadModel(voiceId: VoiceId, onProgress?: ProgressCallback) {
    await this.initialize();
    const progressProxy = Comlink.proxy(
      ({ loaded, total }: { loaded: number; total: number }) => {
        onProgress?.(Math.round((loaded * 100) / total));
      }
    );
    await this.remote!.download(voiceId, progressProxy);
  }

  async removeModel(voiceId: VoiceId): Promise<void> {
    await this.initialize();
    await this.remote!.remove(voiceId);
  }

  async generateAudio(
    text: string,
    voiceId: VoiceId,
    speakerId = 0,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    await this.initialize();

    if (!(await this.isModelDownloaded(voiceId))) {
      await this.downloadModel(voiceId, onProgress);
    }

    const progressProxy = Comlink.proxy(
      ({ loaded, total }: { loaded: number; total: number }) => {
        onProgress?.(Math.round((loaded * 100) / total));
      }
    );

    const buffer = await this.remote!.predict(
      text,
      voiceId,
      speakerId,
      progressProxy
    );
    return new Blob([buffer], { type: "audio/wav" });
  }

  async generateBase64Audio(
    text: string,
    voiceId: VoiceId,
    speakerId = 0,
    onProgress?: ProgressCallback
  ): Promise<string> {
    await this.initialize();

    if (!(await this.isModelDownloaded(voiceId))) {
      await this.downloadModel(voiceId, onProgress);
    }

    const progressProxy = Comlink.proxy(
      ({ loaded, total }: { loaded: number; total: number }) => {
        onProgress?.(Math.round((loaded * 100) / total));
      }
    );

    return await this.remote!.predictBase64(
      text,
      voiceId,
      speakerId,
      progressProxy
    );
  }

  async speak(
    text: string,
    voiceId: VoiceId,
    speakerId = 0,
    onProgress?: ProgressCallback
  ) {
    const wav = await this.generateAudio(text, voiceId, speakerId, onProgress);
    const ctx = new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    const arrBuf = await wav.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrBuf);
    const node = ctx.createBufferSource();
    node.buffer = audioBuf;
    node.connect(ctx.destination);
    node.start();
  }

  destroy() {
    this.remote = undefined;
    this.worker?.terminate();
    this.worker = undefined;
  }
}

export const piperService = PiperService.getInstance();

