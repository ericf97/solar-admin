"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Mic,
  MicOff,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import UnityLoader from "@/components/unity-loader";
import { cn } from "@/lib/utils";
import { piperService } from "@/services/ai/piper-service";
import {
  googleTTSService,
  GoogleTTSOptions,
} from "@/services/ai/google-tts-service";
import { VoiceId } from "@diffusionstudio/vits-web";
import { EFaceAnimation, EBodyAnimation } from "@/types/animation";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { IAgent } from "@/types/agent";
import {
  loadAgentFullData,
  generateAgentChatResponse,
} from "@/services/ai/ai-agent-chat-service";
import {
  unityBridgeService,
  type NlpReplyMessage,
  type TrainingStatusMessage,
  type FallbackRequestMessage,
} from "@/services/unity-bridge-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface IMessage {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
  isStreaming?: boolean;
}

interface IVisualCue {
  face: {
    id: EFaceAnimation;
    intensity: number;
  };
  body: {
    id: EBodyAnimation;
    intensity: number;
  };
}

interface IAIResponse {
  text: string;
  visualCue: IVisualCue;
}

interface UnityChatWindowLLMProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  availableAgents?: IAgent[];
  onAgentChange?: (agentId: string) => void;
  voiceId?: VoiceId;
  speakerId?: number;
  model?: string;
  temperature?: number;
  usePiper?: boolean;
  googleTTSOptions?: GoogleTTSOptions;
}

const ThinkingIndicator = () => (
  <div className="flex items-center gap-1.5">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
    </div>
  </div>
);

export function UnityChatWindowLLM({
  isOpen,
  onClose,
  agentId,
  availableAgents = [],
  onAgentChange,
  voiceId = "en_US-kathleen-low" as VoiceId,
  speakerId = 0,
  model = "google/gemini-2.5-flash",
  temperature = 0.7,
  usePiper = false,
  googleTTSOptions,
}: UnityChatWindowLLMProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 500, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<IAgent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [isTrainingAgent, setIsTrainingAgent] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [trainingProgress, setTrainingProgress] = useState({
    currentEpoch: 0,
    totalEpochs: 0,
    loss: 0,
  });
  const [isUnityNlpReady, setIsUnityNlpReady] = useState(false);
  const [isFallbackOnlyMode, setIsFallbackOnlyMode] = useState(false);
  const [hasShownNoDatasetToast, setHasShownNoDatasetToast] = useState(false);
  const [isUnityLoaded, setIsUnityLoaded] = useState(false);
  const trainingInProgressRef = useRef(false);
  const lastLoadedAgentIdRef = useRef<string | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unityInstanceRef = useRef<any>(null);
  const lastProcessedTranscriptRef = useRef<string>("");
  const pendingFallbackRef = useRef<FallbackRequestMessage | null>(null);
  const conversationHistoryRef = useRef<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const {
    error: sttError,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const clearResults = useCallback(() => {
    if (setResults) {
      setResults([]);
    }
  }, [setResults]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }

      if (isResizing && !isMaximized) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        let newWidth = resizeStartSize.current.width;
        let newHeight = resizeStartSize.current.height;

        if (resizeDirection.includes("e")) {
          newWidth = Math.max(400, resizeStartSize.current.width + deltaX);
        }
        if (resizeDirection.includes("w")) {
          newWidth = Math.max(400, resizeStartSize.current.width - deltaX);
        }
        if (resizeDirection.includes("s")) {
          newHeight = Math.max(400, resizeStartSize.current.height + deltaY);
        }
        if (resizeDirection.includes("n")) {
          newHeight = Math.max(400, resizeStartSize.current.height - deltaY);
        }

        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection("");
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeDirection,
    isMaximized,
    isOpen,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    if (isMaximized) return;

    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { width: size.width, height: size.height };
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, 50);
  };

  const parseAIResponse = (text: string): IAIResponse | null => {
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return parsed;
      }

      try {
        const trimmed = text.trim();
        const parsed = JSON.parse(trimmed);
        if (parsed.text && parsed.visualCue) {
          return parsed;
        }
      } catch {
        console.warn("Raw JSON parse failed, trying other methods");
      }

      const jsonObjMatch = text.match(
        /\{[\s\S]*?"text"\s*:\s*"[\s\S]*?"[\s\S]*?"visualCue"\s*:\s*\{[\s\S]*?\}\s*\}/
      );
      if (jsonObjMatch) {
        const parsed = JSON.parse(jsonObjMatch[0]);
        return parsed;
      }

      console.warn("Could not parse JSON, using fallback");
      return {
        text: text,
        visualCue: {
          face: { id: EFaceAnimation.FRIENDLY, intensity: 0.7 },
          body: { id: EBodyAnimation.LOOKING_DOWN, intensity: 0.5 },
        },
      };
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return null;
    }
  };

  const sendVoiceReplyToUnity = (
    visualCue: IVisualCue,
    audioBase64: string
  ) => {
    if (!unityInstanceRef.current) {
      console.warn("Unity instance not available yet");
      return;
    }

    const payload = {
      visualCue: visualCue,
      audioBase64: audioBase64,
      audioEncoding: "WAV",
      sampleRate: 24000,
    };

    try {
      unityInstanceRef.current.SendMessage(
        "ReactUnityBridge",
        "ReceiveVoiceReply",
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error("Error sending to Unity:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processAIResponse = useCallback(
    async (userMessage: string, addUserMessage = true) => {
      if (!currentAgent) {
        toast.error("No agent loaded");
        return;
      }

      if (addUserMessage) {
        const userMsg: IMessage = {
          id: Date.now().toString(),
          text: userMessage,
          sender: "user",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
      }

      setIsProcessing(true);

      const agentMsgId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev,
        {
          id: agentMsgId,
          text: "Thinking...",
          sender: "agent",
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      try {
        const data = await generateAgentChatResponse({
          agentId: currentAgent.id,
          userMessage,
          conversationHistory: conversationHistoryRef.current,
          model,
          temperature,
        });

        const fullText = data.text;

        const parsedResponse = parseAIResponse(fullText);

        if (!parsedResponse) {
          throw new Error("Failed to parse AI response");
        }

        if (!parsedResponse.text || parsedResponse.text.trim() === "") {
          console.error(
            "Empty text in parsed response, using full text as fallback"
          );
          parsedResponse.text = fullText;
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === agentMsgId
              ? {
                  ...msg,
                  text: parsedResponse.text,
                  isStreaming: false,
                }
              : msg
          )
        );

        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: "user", content: userMessage },
          { role: "assistant", content: parsedResponse.text },
        ];

        let audioBase64: string;

        try {
          if (usePiper) {
            audioBase64 = await piperService.generateBase64Audio(
              parsedResponse.text,
              voiceId,
              speakerId
            );
          } else {
            const defaultOptions: GoogleTTSOptions = {
              languageCode: "en-US",
              voiceName: "en-US-Chirp3-HD-Iapetus",
              audioEncoding: "LINEAR16",
              sampleRateHertz: 24000,
            };

            audioBase64 = await googleTTSService.generateBase64Audio(
              parsedResponse.text,
              { ...defaultOptions, ...googleTTSOptions }
            );
          }

          sendVoiceReplyToUnity(parsedResponse.visualCue, audioBase64);
        } catch (audioError) {
          console.error("Error generating audio:", audioError);
          toast.error("Failed to generate audio", {
            description:
              audioError instanceof Error
                ? audioError.message
                : "Unknown error",
          });
        }
      } catch (error) {
        console.error("Error processing AI response:", error);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === agentMsgId
              ? {
                  ...msg,
                  text: "Sorry, I encountered an error. Please try again.",
                  isStreaming: false,
                }
              : msg
          )
        );
        toast.error("Failed to process response", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [
      currentAgent,
      model,
      temperature,
      voiceId,
      speakerId,
      usePiper,
      googleTTSOptions,
    ]
  );

  const processAIResponseForFallback = useCallback(
    async (userMessage: string) => {
      if (!currentAgent) {
        setIsProcessing(false);
        return;
      }

      try {
        const data = await generateAgentChatResponse({
          agentId: currentAgent.id,
          userMessage,
          conversationHistory: conversationHistoryRef.current,
          model,
          temperature,
        });

        const parsedResponse = parseAIResponse(data.text);

        if (parsedResponse) {
          setMessages(prev =>
            prev.map(msg =>
              msg.sender === "agent" && msg.isStreaming
                ? {
                    ...msg,
                    text: parsedResponse.text,
                    isStreaming: false,
                  }
                : msg
            )
          );

          conversationHistoryRef.current.push({
            role: "assistant",
            content: parsedResponse.text,
          });

          let audioBase64: string;

          try {
            if (usePiper) {
              audioBase64 = await piperService.generateBase64Audio(
                parsedResponse.text,
                voiceId,
                speakerId
              );
            } else {
              const defaultOptions: GoogleTTSOptions = {
                languageCode: "en-US",
                voiceName: "en-US-Chirp3-HD-Iapetus",
                audioEncoding: "LINEAR16",
                sampleRateHertz: 24000,
              };

              audioBase64 = await googleTTSService.generateBase64Audio(
                parsedResponse.text,
                { ...defaultOptions, ...googleTTSOptions }
              );
            }

            sendVoiceReplyToUnity(parsedResponse.visualCue, audioBase64);
          } catch (audioError) {
            console.error("Error generating audio:", audioError);
            toast.error("Failed to generate audio", {
              description:
                audioError instanceof Error
                  ? audioError.message
                  : "Unknown error",
            });
          }
        } else {
          throw new Error("Failed to parse LLM response");
        }
      } catch (error) {
        console.error("[Unity Chat] Error in fallback-only mode:", error);

        setMessages(prev =>
          prev.map(msg =>
            msg.sender === "agent" && msg.isStreaming
              ? {
                  ...msg,
                  text: "I'm having trouble understanding. Could you rephrase that?",
                  isStreaming: false,
                }
              : msg
          )
        );

        toast.error("Failed to process response", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [
      currentAgent,
      model,
      temperature,
      usePiper,
      voiceId,
      speakerId,
      googleTTSOptions,
    ]
  );

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isProcessing) return;

    if (!isFallbackOnlyMode && !isUnityNlpReady) return;

    const message = inputValue;
    setInputValue("");

    clearResults();

    const userMsg: IMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    conversationHistoryRef.current.push({
      role: "user",
      content: message,
    });

    const agentMsgId = `agent-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: agentMsgId,
        text: "Thinking...",
        sender: "agent",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    setIsProcessing(true);

    if (isFallbackOnlyMode) {
      processAIResponseForFallback(message);
    } else {
      unityBridgeService.sendUserMessage(message);
    }
  }, [
    inputValue,
    isProcessing,
    isFallbackOnlyMode,
    isUnityNlpReady,
    clearResults,
    processAIResponseForFallback,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUnityLoaded = useCallback((instance: any) => {
    unityInstanceRef.current = instance;
    try {
      unityBridgeService.initialize(instance);
    } catch (e) {
      console.error("[Unity Chat] Bridge initialize error:", e);
    }
  }, []);

  const handleUnityAppLoaded = useCallback(() => {
    setIsUnityLoaded(true);
  }, []);

  const handleUnityError = useCallback((error: string) => {
    console.error("[Unity Chat] Unity error:", error);
    toast.error("Unity failed to load", {
      description: "Please refresh the page and try again.",
    });
    setIsUnityLoaded(false);
    setIsTrainingAgent(false);
    setIsUnityNlpReady(false);
    unityInstanceRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = unityBridgeService.onTrainingStatus(
      (status: TrainingStatusMessage) => {
        setTrainingProgress({
          currentEpoch: status.currentEpoch,
          totalEpochs: status.totalEpochs,
          loss: status.loss,
        });

        if (status.status === "complete") {
          setIsTrainingAgent(false);
          setIsUnityNlpReady(true);
          toast.success("Agent trained successfully!");
        } else if (status.status === "error") {
          setIsTrainingAgent(false);
          setIsUnityNlpReady(false);
          toast.error("Training failed", {
            description: status.errorMessage,
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isProcessingReply = false;

    const unsubscribe = unityBridgeService.onNlpReply(
      async (reply: NlpReplyMessage) => {
        if (isProcessingReply) {
          return;
        }

        if (reply.isFallback) {
          return;
        }

        isProcessingReply = true;

        try {
          setMessages(prev => {
            const existingIndex = prev.findIndex(
              msg => msg.sender === "agent" && msg.isStreaming
            );

            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                text: reply.text,
                isStreaming: false,
              };
              return updated;
            }

            console.warn(
              "[Unity Chat] No streaming message found, adding new one"
            );
            return [
              ...prev,
              {
                id: `agent-${Date.now()}`,
                text: reply.text,
                sender: "agent",
                timestamp: new Date(),
                isStreaming: false,
              },
            ];
          });

          conversationHistoryRef.current.push({
            role: "assistant",
            content: reply.text,
          });

          let audioBase64: string;

          try {
            if (usePiper) {
              audioBase64 = await piperService.generateBase64Audio(
                reply.text,
                voiceId,
                speakerId
              );
            } else {
              const defaultOptions: GoogleTTSOptions = {
                languageCode: "en-US",
                voiceName: "en-US-Chirp3-HD-Iapetus",
                audioEncoding: "LINEAR16",
                sampleRateHertz: 24000,
              };

              audioBase64 = await googleTTSService.generateBase64Audio(
                reply.text,
                { ...defaultOptions, ...googleTTSOptions }
              );
            }

            unityBridgeService.sendVoiceReply(
              reply.visualCue,
              audioBase64,
              "LINEAR16",
              24000
            );
          } catch (audioError) {
            console.error("[Unity Chat] Error generating audio:", audioError);
            toast.error("Failed to generate audio", {
              description:
                audioError instanceof Error
                  ? audioError.message
                  : "Unknown error",
            });
          }
        } catch (error) {
          console.error("[Unity Chat] Error processing reply:", error);
          toast.error("Failed to process response");
        } finally {
          setIsProcessing(false);
          isProcessingReply = false;
        }
      }
    );

    return () => {
      isProcessingReply = false;
      unsubscribe();
    };
  }, [isOpen, usePiper, voiceId, speakerId, googleTTSOptions]);

  useEffect(() => {
    if (!isOpen) return;

    let isProcessingFallback = false;

    const unsubscribe = unityBridgeService.onFallbackRequest(
      async (request: FallbackRequestMessage) => {
        if (isProcessingFallback) {
          return;
        }

        isProcessingFallback = true;

        if (!currentAgent) {
          console.error("[Unity Chat] No agent loaded for fallback");
          isProcessingFallback = false;
          return;
        }

        pendingFallbackRef.current = request;

        try {
          setMessages(prev => {
            const existingThinkingIndex = prev.findIndex(
              msg => msg.sender === "agent" && msg.isStreaming
            );

            if (existingThinkingIndex !== -1) {
              return prev;
            }

            return [
              ...prev,
              {
                id: `agent-fallback-${Date.now()}`,
                text: "Let me think about that...",
                sender: "agent",
                timestamp: new Date(),
                isStreaming: true,
              },
            ];
          });

          setIsProcessing(true);

          const data = await generateAgentChatResponse({
            agentId: currentAgent.id,
            userMessage: request.userInput,
            conversationHistory: conversationHistoryRef.current,
            model,
            temperature,
          });

          const parsedResponse = parseAIResponse(data.text);

          if (parsedResponse) {
            setMessages(prev =>
              prev.map(msg =>
                msg.sender === "agent" && msg.isStreaming
                  ? {
                      ...msg,
                      text: parsedResponse.text,
                      isStreaming: false,
                    }
                  : msg
              )
            );

            conversationHistoryRef.current.push({
              role: "assistant",
              content: parsedResponse.text,
            });

            let audioBase64: string;

            try {
              if (usePiper) {
                audioBase64 = await piperService.generateBase64Audio(
                  parsedResponse.text,
                  voiceId,
                  speakerId
                );
              } else {
                const defaultOptions: GoogleTTSOptions = {
                  languageCode: "en-US",
                  voiceName: "en-US-Chirp3-HD-Iapetus",
                  audioEncoding: "LINEAR16",
                  sampleRateHertz: 24000,
                };

                audioBase64 = await googleTTSService.generateBase64Audio(
                  parsedResponse.text,
                  { ...defaultOptions, ...googleTTSOptions }
                );
              }

              unityBridgeService.sendVoiceReply(
                parsedResponse.visualCue,
                audioBase64,
                "LINEAR16",
                24000
              );
            } catch (audioError) {
              console.error("[Unity Chat] Error generating audio:", audioError);
              toast.error("Failed to generate audio", {
                description:
                  audioError instanceof Error
                    ? audioError.message
                    : "Unknown error",
              });
            }
          } else {
            throw new Error("Failed to parse LLM fallback response");
          }
        } catch (error) {
          console.error("[Unity Chat] Error handling fallback:", error);

          setMessages(prev =>
            prev.map(msg =>
              msg.sender === "agent" && msg.isStreaming
                ? {
                    ...msg,
                    text: "I'm having trouble understanding. Could you rephrase that?",
                    isStreaming: false,
                  }
                : msg
            )
          );

          toast.error("Fallback failed", {
            description:
              error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          setIsProcessing(false);
          isProcessingFallback = false;
        }
      }
    );

    return () => {
      isProcessingFallback = false;
      unsubscribe();
    };
  }, [
    isOpen,
    currentAgent,
    model,
    temperature,
    usePiper,
    voiceId,
    speakerId,
    googleTTSOptions,
  ]);

  useEffect(() => {
    if (!agentId || !isOpen) return;
    if (!isUnityLoaded || !unityInstanceRef.current) {
      return;
    }
    if (trainingInProgressRef.current) {
      return;
    }

    if (lastLoadedAgentIdRef.current === agentId) {
      return;
    }

    let isMounted = true;

    const trainAgent = async () => {
      trainingInProgressRef.current = true;
      lastLoadedAgentIdRef.current = agentId;

      await new Promise(resolve => setTimeout(resolve, 300));

      if (!isMounted) {
        trainingInProgressRef.current = false;
        return;
      }

      setIsLoadingAgent(true);
      setIsTrainingAgent(false);
      setIsUnityNlpReady(false);
      setIsFallbackOnlyMode(false);

      try {
        const result = await loadAgentFullData(agentId);

        if (!isMounted) return;

        setCurrentAgent(result.agent);

        if (!result.hasDatasets || !result.agentJson) {
          setIsFallbackOnlyMode(true);
          setIsUnityNlpReady(false);

          if (!hasShownNoDatasetToast) {
            toast.info("Agent has no datasets", {
              description: "All responses will be handled by the LLM directly.",
            });
            setHasShownNoDatasetToast(true);
          }

          return;
        }

        const ready = await unityBridgeService.waitForReady(15000);
        if (!ready) {
          if (!isMounted) return;
          toast.error("Unity bridge not ready", {
            description: "Please reload the page and try again",
          });
          return;
        }

        if (!isMounted) return;
        setIsTrainingAgent(true);

        await unityBridgeService.trainAgent(result.agentJson);
      } catch (error) {
        if (!isMounted) return;
        console.error("[Unity Chat] Error loading/training agent:", error);
        toast.error("Failed to load agent", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setIsTrainingAgent(false);
        setIsUnityNlpReady(false);
        setIsFallbackOnlyMode(false);
      } finally {
        if (isMounted) {
          setIsLoadingAgent(false);
          trainingInProgressRef.current = false;
        }
      }
    };

    trainAgent();

    return () => {
      isMounted = false;
      trainingInProgressRef.current = false;
      setIsTrainingAgent(false);
      setIsUnityNlpReady(false);
    };
  }, [agentId, hasShownNoDatasetToast, isOpen, isUnityLoaded]);

  useEffect(() => {
    if (!isOpen) {
      lastProcessedTranscriptRef.current = "";
      lastLoadedAgentIdRef.current = null;
      setInputValue("");
      if (setResults) {
        setResults([]);
      }
      setIsUnityLoaded(false);
      unityInstanceRef.current = null;
    }
  }, [isOpen, setResults]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setInputValue("");
      clearResults();
      lastProcessedTranscriptRef.current = "";
      startSpeechToText();
    }
  };

  const handleAgentSelect = (newAgentId: string) => {
    if (newAgentId === agentId) return;

    setAgentDropdownOpen(false);

    if (onAgentChange) {
      onAgentChange(newAgentId);
    }
  };

  useEffect(() => {
    if (sttError) {
      console.error("Speech to Text Error:", sttError);
    }
  }, [sttError]);

  useEffect(() => {
    if (isRecording && interimResult) {
      setInputValue(interimResult);
    }
  }, [interimResult, isRecording]);

  useEffect(() => {
    if (!isRecording && results.length > 0) {
      const lastResult = results[results.length - 1];
      if (
        (lastResult as ResultType)?.transcript &&
        (lastResult as ResultType).transcript.trim()
      ) {
        const transcript = (lastResult as ResultType).transcript.trim();

        if (lastProcessedTranscriptRef.current === transcript) {
          return;
        }
        lastProcessedTranscriptRef.current = transcript;

        if (inputValue !== transcript) {
          setInputValue(transcript);
        }

        if (isFallbackOnlyMode || isUnityNlpReady) {
          setTimeout(() => {
            const userMsg: IMessage = {
              id: Date.now().toString(),
              text: transcript,
              sender: "user",
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMsg]);

            conversationHistoryRef.current.push({
              role: "user",
              content: transcript,
            });

            const agentMsgId = `agent-${Date.now()}`;
            setMessages(prev => [
              ...prev,
              {
                id: agentMsgId,
                text: "Thinking...",
                sender: "agent",
                timestamp: new Date(),
                isStreaming: true,
              },
            ]);

            setIsProcessing(true);

            if (isFallbackOnlyMode) {
              processAIResponseForFallback(transcript);
            } else {
              unityBridgeService.sendUserMessage(transcript);
            }
          }, 100);
        }

        setTimeout(() => {
          setInputValue("");
          if (setResults) {
            setResults([]);
          }
        }, 200);
      }
    }
  }, [
    isRecording,
    results,
    isUnityNlpReady,
    isFallbackOnlyMode,
    setResults,
    processAIResponseForFallback,
    inputValue,
  ]);

  if (!isOpen) return null;

  const windowStyle = isMaximized
    ? {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }
    : {
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: isMinimized ? "auto" : `${size.height}px`,
      };

  return (
    <div
      ref={windowRef}
      className="fixed bg-background border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
      style={windowStyle}
    >
      {!isMaximized && !isMinimized && (
        <>
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50"
            onMouseDown={e => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50"
            onMouseDown={e => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
            onMouseDown={e => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
            onMouseDown={e => handleResizeStart(e, "se")}
          />
          <div
            className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-50"
            onMouseDown={e => handleResizeStart(e, "n")}
          />
          <div
            className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-50"
            onMouseDown={e => handleResizeStart(e, "s")}
          />
          <div
            className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-50"
            onMouseDown={e => handleResizeStart(e, "w")}
          />
          <div
            className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-50"
            onMouseDown={e => handleResizeStart(e, "e")}
          />
        </>
      )}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 cursor-move select-none z-40"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group"
          >
            <X className="h-2 w-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center group"
          >
            <Minus className="h-2 w-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group"
          >
            {isMaximized ? (
              <Minimize2 className="h-2 w-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <Maximize2 className="h-2 w-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 mt-2">
          {isLoadingAgent || isTrainingAgent ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span className="text-sm font-medium text-white">
                {isTrainingAgent ? `Training...` : "Loading agent..."}
              </span>
            </div>
          ) : currentAgent ? (
            <DropdownMenu
              open={agentDropdownOpen}
              onOpenChange={setAgentDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 gap-1 hover:bg-white/20 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:text-white rounded-full"
                  disabled={availableAgents.length === 0}
                >
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium max-w-[200px] truncate">
                    {currentAgent.name}
                  </span>
                  {availableAgents.length > 0 && (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              {availableAgents.length > 0 && (
                <DropdownMenuContent align="center" className="w-64">
                  <DropdownMenuLabel>Switch Agent</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableAgents.map(agent => (
                    <DropdownMenuItem
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent.id)}
                      className="flex items-start gap-3 py-2"
                    >
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {agent.name}
                          </span>
                          {agent.id === currentAgent.id && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        {agent.role && (
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.role}
                          </p>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          ) : (
            <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
              No agent loaded
            </span>
          )}
        </div>

        <div className="w-20"></div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            className="absolute inset-0 bg-black overflow-hidden pointer-events-auto"
            style={{
              borderBottomLeftRadius: "1rem",
              borderBottomRightRadius: "1rem",
            }}
          >
            <UnityLoader
              buildPath="/unity"
              buildName="solar_web_build"
              width="100%"
              height="100%"
              onLoaded={handleUnityAppLoaded}
              onError={handleUnityError}
              onUnityInstance={handleUnityLoaded}
            />
          </div>

          <div className="absolute bottom-14 left-4 right-4 h-[40%] pointer-events-none z-10 flex flex-col">
            <div className="relative flex-1 flex flex-col min-h-0">
              <div
                className="flex-1 min-h-0 overflow-hidden relative"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 20%, black 96%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 20%, black 96%, transparent 100%)",
                }}
              >
                <ScrollArea className="h-full">
                  <div className="space-y-2 px-4 pt-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300",
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-lg transition-all",
                            message.sender === "user"
                              ? "bg-white/90 text-black dark:bg-white/90 dark:text-black"
                              : "bg-background/90 border border-border/40"
                          )}
                        >
                          {message.isStreaming ? (
                            <div className="flex items-center gap-2 py-1">
                              <ThinkingIndicator />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.text}
                              </p>
                              <span className="text-xs opacity-70 mt-1 block">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10 z-20 pointer-events-auto"
            style={{
              borderBottomLeftRadius: "1rem",
              borderBottomRightRadius: "1rem",
            }}
          >
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isRecording
                    ? "Listening..."
                    : isTrainingAgent
                    ? "Training agent..."
                    : isFallbackOnlyMode
                    ? "Type your message... (LLM Mode)"
                    : !isUnityNlpReady
                    ? "Agent not ready..."
                    : isProcessing
                    ? "AI is thinking..."
                    : "Type your message..."
                }
                disabled={
                  isProcessing ||
                  isTrainingAgent ||
                  (!isUnityNlpReady && !isFallbackOnlyMode)
                }
                className={cn(
                  "flex-1 bg-white/10 backdrop-blur-md border-white/20 rounded-full px-4 text-white placeholder:text-white/60",
                  isRecording && "border-red-400 border-2"
                )}
              />
              <Button
                onClick={handleToggleRecording}
                disabled={
                  isProcessing ||
                  isTrainingAgent ||
                  (!isUnityNlpReady && !isFallbackOnlyMode) ||
                  !!sttError
                }
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className={cn(
                  "backdrop-blur-md rounded-full h-10 w-10 bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30",
                  isRecording && "animate-pulse bg-red-500/80 hover:bg-red-500"
                )}
                title={
                  sttError
                    ? "Speech recognition not available"
                    : isRecording
                    ? "Stop recording"
                    : "Start recording"
                }
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-white" />
                ) : (
                  <Mic className="h-4 w-4 text-white" />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={
                  isProcessing ||
                  isTrainingAgent ||
                  (!isUnityNlpReady && !isFallbackOnlyMode) ||
                  !inputValue.trim()
                }
                variant={"outline"}
                size="icon"
                className="backdrop-blur-md rounded-full h-10 w-10 bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

