"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Volume2, Download, Check, Settings2, Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { VoiceSelectModal } from "@/components/voice-select-modal";
import { ModelManagementModal } from "@/components/piper-management-modal";
import { piperService } from "@/services/ai/piper-service";
import { usePiper } from "@/hooks/use-piper";
import { VoiceId } from "@diffusionstudio/vits-web";

export default function VitsClient() {
  const [text, setText] = useState("Hello, this is a test with VITS Web TTS.");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalVoices: 0,
    downloadedModels: 0,
    totalSize: 0,
  });

  const {
    voiceId,
    setVoiceId,
    speakerId,
    setSpeakerId,
    speak,
    isGenerating,
    progress,
    selectedVoice,
    isReady,
  } = usePiper();

  useEffect(() => {
    if (isReady) {
      updateStats();
    }
  }, [isReady, isVoiceModalOpen, isManagementModalOpen]);

  const updateStats = async () => {
    const downloadedModels = await piperService.getDownloadedModels();
    const totalSize = await piperService.getTotalDownloadedSize();

    setStats({
      totalVoices: Object.keys(piperService.getVoices()).length,
      downloadedModels: downloadedModels.size,
      totalSize: totalSize,
    });
  };

  const handleSpeak = async () => {
    try {
      await speak(text);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const numSpeakers = selectedVoice?.num_speakers || 1;
  const speakerOptions =
    numSpeakers > 1
      ? Object.keys(selectedVoice?.speaker_id_map || {}).length > 0
        ? Object.entries(selectedVoice?.speaker_id_map || {})
        : Array.from({ length: numSpeakers }, (_, i) => [i.toString(), i])
      : [];

  const getVoiceDisplay = () => {
    if (!selectedVoice) return "Select voice";
    return `${selectedVoice.language.name_native} - ${selectedVoice.name} (${selectedVoice.quality})`;
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {stats.totalVoices}
              </div>
              <div className="text-xs text-muted-foreground">
                Available Voices
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.downloadedModels}
              </div>
              <div className="text-xs text-muted-foreground">
                Downloaded Models
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalSize.toFixed(1)} MB
              </div>
              <div className="text-xs text-muted-foreground">Space Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Voice Synthesis
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManagementModalOpen(true)}
              disabled={stats.downloadedModels === 0}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Manage Models
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Selected Voice</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start h-auto py-3"
                onClick={() => setIsVoiceModalOpen(true)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 text-left truncate">
                    {selectedVoice ? (
                      <VoiceDisplayWithDownloadStatus
                        voiceId={voiceId!}
                        getVoiceDisplay={getVoiceDisplay}
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        Select voice
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            </div>
            {selectedVoice && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pl-1">
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedVoice.quality}
                  </Badge>
                  Quality
                </span>
                <span>·</span>
                <span>{piperService.getModelSize(voiceId!)} MB</span>
                <span>·</span>
                <span>{selectedVoice.language.country_english}</span>
              </div>
            )}
          </div>

          {numSpeakers > 1 && speakerOptions.length > 0 && (
            <div className="space-y-3">
              <Label>Speaker / Variant</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {speakerOptions.map(([name, id]) => (
                  <Button
                    key={id as string}
                    variant={speakerId === id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpeakerId(Number(id))}
                    className="justify-start"
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="text">Text to Synthesize</Label>
            <Textarea
              id="text"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={5}
              className="resize-none"
              placeholder="Write the text you want to convert to speech..."
            />
            <div className="text-xs text-muted-foreground text-right">
              {text.length} characters
            </div>
          </div>

          {progress !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Download className="h-4 w-4 animate-pulse" />
                  Downloading model...
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSpeak}
              disabled={isGenerating || !text.trim() || !voiceId}
              className="flex-1"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5 mr-2" />
                  Play Voice
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <VoiceSelectModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedVoiceId={voiceId}
        onSelectVoice={(voiceId: string) => setVoiceId(voiceId as VoiceId)}
      />

      <ModelManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />
    </div>
  );
}

function VoiceDisplayWithDownloadStatus({
  voiceId,
  getVoiceDisplay,
}: {
  voiceId: VoiceId;
  getVoiceDisplay: () => string;
}) {
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  React.useEffect(() => {
    piperService.isModelDownloaded(voiceId).then(setIsDownloaded);
  }, [voiceId]);

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{getVoiceDisplay()}</span>
      {isDownloaded && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Check className="h-3 w-3" />
          Downloaded
        </Badge>
      )}
    </div>
  );
}

