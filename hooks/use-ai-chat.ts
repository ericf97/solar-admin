"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage } from "@/components/ai-chat/chat-container";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { toast } from "sonner";

export interface UseAIChatOptions<TExtract = unknown> {
  initialMessages?: ChatMessage[];
  model?: string;
  apiEndpoint: string;
  onDataExtracted?: (data: TExtract) => void;
  extractData?: (text: string) => Promise<TExtract[]>;
  buildRequestPayload?: (message: string, history: unknown[]) => unknown;
  shouldFilterHistory?: boolean;
  filterHistoryFn?: (history: unknown[]) => unknown[];
}

export function useAIChat<TExtract = unknown>({
  initialMessages = [],
  model,
  apiEndpoint,
  onDataExtracted,
  extractData,
  buildRequestPayload,
  shouldFilterHistory = false,
  filterHistoryFn,
}: UseAIChatOptions<TExtract>) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const shouldCancelRef = useRef<boolean>(false);
  const addMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationHistoryRef = useRef<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const processedDataRef = useRef<Set<string>>(new Set());
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetProcessedData = useCallback(() => {
    processedDataRef.current.clear();
  }, []);

  const stop = useCallback(() => {
    shouldCancelRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (addMessageTimeoutRef.current) {
      clearTimeout(addMessageTimeoutRef.current);
      addMessageTimeoutRef.current = null;
    }

    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }

    setStatus("ready");

    toast.info("Generation stopped", {
      description: "The AI generation has been cancelled.",
      duration: 2000,
    });
  }, []);

  const parseAndExtract = useCallback(
    async (text: string) => {
      if (!onDataExtracted || !extractData) return;

      try {
        const extractedItems = await extractData(text);

        for (const item of extractedItems) {
          const itemKey = JSON.stringify(item).substring(0, 100);

          if (!processedDataRef.current.has(itemKey)) {
            processedDataRef.current.add(itemKey);
            onDataExtracted(item);
          }
        }
      } catch (error) {
        console.error("[useAIChat] Error extracting data:", error);
      }
    },
    [onDataExtracted, extractData]
  );

  const streamResponse = useCallback(
    async (messageId: string, userMessage: string, selectedModel: string) => {
      setStatus("streaming");
      shouldCancelRef.current = false;
      abortControllerRef.current = new AbortController();

      responseTimeoutRef.current = setTimeout(() => {
        if (status === "streaming") {
          toast.info("Still processing...", {
            description: "The AI is taking longer than expected. Please wait.",
            duration: 5000,
          });
        }
      }, 15000);

      try {
        const history =
          shouldFilterHistory && filterHistoryFn
            ? filterHistoryFn(conversationHistoryRef.current)
            : conversationHistoryRef.current;

        const payload = buildRequestPayload
          ? buildRequestPayload(userMessage, history)
          : {
              message: userMessage,
              history,
              model: selectedModel,
            };

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
          responseTimeoutRef.current = null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[useAIChat] Response not ok:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });

          let errorMessage = "Failed to generate response";
          if (response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again later.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage =
              "Authentication error. Please check your credentials.";
          }

          toast.error("AI Error", {
            description: errorMessage,
            duration: 5000,
          });

          throw new Error(
            `Failed to generate response: ${response.status} ${errorText}`
          );
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done || shouldCancelRef.current) {
                if (shouldCancelRef.current) {
                  setMessages(prev =>
                    prev.map(msg => {
                      if (msg.versions.some(v => v.id === messageId)) {
                        return {
                          ...msg,
                          versions: msg.versions.map(v =>
                            v.id === messageId
                              ? {
                                  ...v,
                                  content:
                                    accumulatedText +
                                    "\n\n_Generation stopped by user._",
                                }
                              : v
                          ),
                        };
                      }
                      return msg;
                    })
                  );
                }
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              accumulatedText += chunk;

              setMessages(prev =>
                prev.map(msg => {
                  if (msg.versions.some(v => v.id === messageId)) {
                    return {
                      ...msg,
                      versions: msg.versions.map(v =>
                        v.id === messageId
                          ? { ...v, content: accumulatedText }
                          : v
                      ),
                    };
                  }
                  return msg;
                })
              );

              parseAndExtract(accumulatedText);
            }
          } catch (error: unknown) {
            if (error instanceof Error && error.name === "AbortError") {
              console.warn("[useAIChat] Stream aborted by user");
              return;
            }
            throw error;
          } finally {
            reader.releaseLock();
          }

          if (!accumulatedText.trim() && !shouldCancelRef.current) {
            toast.warning("Empty response", {
              description:
                "The AI returned an empty response. Please try again.",
              duration: 4000,
            });
          }
        } else {
          console.error("[useAIChat] No reader available from response body");
          toast.error("Stream error", {
            description: "Unable to read AI response stream.",
            duration: 4000,
          });
        }

        if (!shouldCancelRef.current) {
          conversationHistoryRef.current.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: accumulatedText }
          );
        }

        setStatus("ready");
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          console.warn("[useAIChat] Request aborted by user");
          setStatus("ready");
          return;
        }

        console.error("[useAIChat] Error streaming response:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          error,
        });

        if (error instanceof Error) {
          if (error.message.includes("fetch")) {
            toast.error("Connection error", {
              description:
                "Unable to connect to AI service. Please check your internet connection.",
              duration: 5000,
            });
          } else if (error.message.includes("timeout")) {
            toast.error("Request timeout", {
              description: "The request took too long. Please try again.",
              duration: 5000,
            });
          }
        }

        setStatus("error");

        setMessages(prev =>
          prev.map(msg => {
            if (msg.versions.some(v => v.id === messageId)) {
              return {
                ...msg,
                versions: msg.versions.map(v =>
                  v.id === messageId
                    ? {
                        ...v,
                        content:
                          "❌ **Error generating response**\n\nSomething went wrong. Please try again or contact support if the issue persists.",
                      }
                    : v
                ),
              };
            }
            return msg;
          })
        );
      } finally {
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
          responseTimeoutRef.current = null;
        }
        abortControllerRef.current = null;
      }
    },
    [
      parseAndExtract,
      apiEndpoint,
      buildRequestPayload,
      shouldFilterHistory,
      filterHistoryFn,
      status,
    ]
  );

  const addUserMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (content: string, files?: File[]) => {
      const userMessage: ChatMessage = {
        key: `user-${Date.now()}`,
        from: "user",
        versions: [
          {
            id: `user-${Date.now()}`,
            content,
          },
        ],
        name: "User",
      };

      setMessages(prev => [...prev, userMessage]);

      addMessageTimeoutRef.current = setTimeout(async () => {
        const assistantMessageId = `assistant-${Date.now()}`;

        const assistantMessage: ChatMessage = {
          key: `assistant-${Date.now()}`,
          from: "assistant",
          versions: [
            {
              id: assistantMessageId,
              content: "",
            },
          ],
          name: "AI Assistant",
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (!model) {
          toast.error("No model selected", {
            description: "Please select an AI model to generate a response.",
            duration: 4000,
          });
          setStatus("error");
          return;
        }

        await streamResponse(assistantMessageId, content, model);
        addMessageTimeoutRef.current = null;
      }, 500);
    },
    [streamResponse, model]
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (status === "streaming" || status === "submitted") {
        stop();
        return;
      }

      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      setStatus("submitted");
      addUserMessage(
        message.text || "Processing uploaded files...",
        message.files as File[] | undefined
      );
    },
    [status, stop, addUserMessage]
  );

  return {
    messages,
    status,
    handleSubmit,
    stop,
    setMessages,
    resetProcessedData,
  };
}

