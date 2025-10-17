"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Check, Download, Globe, Users, Loader2 } from "lucide-react";
import { piperService, VoiceInfo } from "../services/ai/piper-service";
import { VoiceId } from "@diffusionstudio/vits-web";

interface VoiceSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
}

export function VoiceSelectModal({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
}: VoiceSelectModalProps) {
  const [voices, setVoices] = useState<Record<string, VoiceInfo>>({});
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [downloadedFilter, setDownloadedFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await piperService.initialize();
      setVoices(piperService.getVoices());
      const models = await piperService.getDownloadedModels();
      setDownloadedModels(models);
    } catch (error) {
      console.error("Error loading voices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const languages = useMemo(() => {
    const langs = new Set<string>();
    Object.values(voices).forEach(voice => {
      langs.add(voice.language.name_english);
    });
    return Array.from(langs).sort();
  }, [voices]);

  const qualities = useMemo(() => {
    const quals = new Set<string>();
    Object.values(voices).forEach(voice => {
      quals.add(voice.quality);
    });
    return Array.from(quals).sort();
  }, [voices]);

  const filteredVoices = useMemo(() => {
    return Object.entries(voices).filter(([id, voice]) => {
      const matchesSearch =
        voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voice.language.name_english
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        voice.language.name_native
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        voice.language.country_english
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesLanguage =
        languageFilter === "all" ||
        voice.language.name_english === languageFilter;

      const matchesQuality =
        qualityFilter === "all" || voice.quality === qualityFilter;

      const matchesDownloaded =
        downloadedFilter === "all" ||
        (downloadedFilter === "downloaded" && downloadedModels.has(id)) ||
        (downloadedFilter === "not-downloaded" && !downloadedModels.has(id));

      return (
        matchesSearch && matchesLanguage && matchesQuality && matchesDownloaded
      );
    });
  }, [
    voices,
    searchTerm,
    languageFilter,
    qualityFilter,
    downloadedFilter,
    downloadedModels,
  ]);

  const handleSelectVoice = (voiceId: string) => {
    onSelectVoice(voiceId);
    onClose();
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "high":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "low":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "x_low":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">Select Voice</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading voices...</p>
          </div>
        ) : Object.keys(voices).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <p className="text-sm text-muted-foreground mb-2">
              No voices available
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure the service is initialized correctly
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, language or country..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select
                  value={languageFilter}
                  onValueChange={setLanguageFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All languages</SelectItem>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All qualities</SelectItem>
                    {qualities.map(qual => (
                      <SelectItem key={qual} value={qual}>
                        {qual}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={downloadedFilter}
                  onValueChange={setDownloadedFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="downloaded">Downloaded</SelectItem>
                    <SelectItem value="not-downloaded">
                      Not downloaded
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{filteredVoices.length} voices found</span>
                <span>{downloadedModels.size} downloaded</span>
              </div>
            </div>
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-2 pb-6">
                {filteredVoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No voices match your filters
                  </div>
                ) : (
                  filteredVoices.map(([id, voice]) => {
                    const isDownloaded = downloadedModels.has(id);
                    const isSelected = selectedVoiceId === id;

                    return (
                      <Button
                        key={id}
                        variant={isSelected ? "secondary" : "ghost"}
                        className="w-full h-auto py-4 px-4 justify-start"
                        onClick={() => handleSelectVoice(id)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            ) : (
                              <Globe className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">
                                {voice.name}
                              </span>
                              {isDownloaded && (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center gap-1 flex-shrink-0"
                                >
                                  <Download className="h-3 w-3" />
                                  <span className="text-xs">
                                    {piperService.getModelSize(id as VoiceId)}{" "}
                                    MB
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-muted-foreground">
                                {voice.language.name_native}
                              </span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {voice.language.country_english}
                              </span>
                              {voice.num_speakers && voice.num_speakers > 1 && (
                                <>
                                  <span className="text-muted-foreground">
                                    ·
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Users className="h-3 w-3" />
                                    {voice.num_speakers}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          <Badge className={getQualityColor(voice.quality)}>
                            {voice.quality}
                          </Badge>
                        </div>
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

