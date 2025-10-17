import * as Comlink from "comlink";
import * as tts from "@diffusionstudio/vits-web";

type Progress = { url: string; loaded: number; total: number };

const api = {
  async voices() {
    const voicesMap = await tts.voices();
    return Object.values(voicesMap);
  },
  async stored() {
    return await tts.stored();
  },
  async remove(voiceId: tts.VoiceId) {
    return await tts.remove(voiceId);
  },
  async flush() {
    return await tts.flush();
  },
  async download(voiceId: tts.VoiceId, cb?: (p: Progress) => void) {
    await tts.download(voiceId, p => cb?.(p));
  },
  async predict(
    text: string,
    voiceId: tts.VoiceId,
    speakerId: number,
    cb?: (p: Progress) => void
  ): Promise<ArrayBuffer> {
    const wav = await tts.predict({ text, voiceId, speakerId }, p => cb?.(p));
    return await wav.arrayBuffer();
  },
  async predictBase64(
    text: string,
    voiceId: tts.VoiceId,
    speakerId: number,
    cb?: (p: Progress) => void
  ): Promise<string> {
    const wav = await tts.predict({ text, voiceId, speakerId }, p => cb?.(p));
    const arrayBuffer = await wav.arrayBuffer();

    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },
};

Comlink.expose(api);
export type PiperWorkerAPI = typeof api;

