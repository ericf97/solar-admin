"use client";

import { useState, useCallback, useEffect } from "react";
import { VoiceId } from "@diffusionstudio/vits-web";
import { piperService } from "../services/ai/piper-service";

export function usePiper() {
  const [voiceId, setVoiceId] = useState<VoiceId | null>(null);
  const [speakerId, setSpeakerId] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    piperService.initialize().then(() => {
      setIsReady(true);
      const defaultVoice = piperService.getDefaultVoiceId();
      if (defaultVoice) {
        setVoiceId(defaultVoice as VoiceId);
      }
    });
  }, []);

  useEffect(() => {
    setSpeakerId(0);
  }, [voiceId]);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceId) throw new Error("No voice selected");

      setIsGenerating(true);
      setProgress(null);
      try {
        const base64Audio = await piperService.generateBase64Audio(
          text,
          voiceId,
          speakerId,
          p => setProgress(p)
        );
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/wav" });
        const audio = new Audio(URL.createObjectURL(blob));
        await audio.play();
      } finally {
        setIsGenerating(false);
        setProgress(null);
      }
    },
    [voiceId, speakerId]
  );

  const generateAudio = useCallback(
    async (text: string): Promise<string> => {
      if (!voiceId) throw new Error("No voice selected");

      setIsGenerating(true);
      setProgress(null);
      try {
        return await piperService.generateBase64Audio(
          text,
          voiceId,
          speakerId,
          p => setProgress(p)
        );
      } finally {
        setIsGenerating(false);
        setProgress(null);
      }
    },
    [voiceId, speakerId]
  );

  const selectedVoice = voiceId ? piperService.getVoice(voiceId) : null;

  return {
    voiceId,
    setVoiceId,
    speakerId,
    setSpeakerId,
    speak,
    generateAudio,
    isGenerating,
    progress,
    selectedVoice,
    isReady,
  };
}

