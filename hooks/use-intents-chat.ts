"use client";

import { useCallback, useRef } from "react";
import { useAIChat } from "./use-ai-chat";
import { IIntent } from "@/types/intent";
import { intentsService } from "@/services/intents-service";
import { toast } from "sonner";
import { ChatMessage } from "@/components/ai-chat/chat-container";

interface UseIntentsChatOptions {
  initialMessages?: ChatMessage[];
  onIntentGenerated?: (intent: IIntent) => void;
  model?: string;
  language?: string;
  avgCount?: number;
  forceOptions?: boolean;
  includeInHistory?: boolean;
  contextVariables?: string[];
}

const tagExistsCache = new Map<string, boolean>();

async function checkTagExists(tag: string): Promise<boolean> {
  if (tagExistsCache.has(tag)) {
    return tagExistsCache.get(tag)!;
  }

  try {
    const result = await intentsService.getIntents(
      `tag eq '${tag}'`,
      undefined,
      1,
      1
    );
    const exists = result.count > 0;
    tagExistsCache.set(tag, exists);
    return exists;
  } catch (error) {
    console.error("[useIntentsChat] Error checking tag existence:", error);
    return false;
  }
}

async function generateUniqueTag(baseTag: string): Promise<string> {
  const exists = await checkTagExists(baseTag);
  if (!exists) {
    tagExistsCache.set(baseTag, true);
    return baseTag;
  }

  let counter = 1;
  let uniqueTag = `${baseTag}_${counter}`;

  while (await checkTagExists(uniqueTag)) {
    counter++;
    uniqueTag = `${baseTag}_${counter}`;
  }

  tagExistsCache.set(uniqueTag, true);
  return uniqueTag;
}

export function useIntentsChat({
  initialMessages = [],
  onIntentGenerated,
  model,
  language = "en",
  avgCount = 4,
  forceOptions = false,
  includeInHistory = false,
  contextVariables = [],
}: UseIntentsChatOptions = {}) {
  const processedIntentsRef = useRef<Set<string>>(new Set());

  const extractIntents = useCallback(
    async (text: string): Promise<IIntent[]> => {
      const intents: IIntent[] = [];
      const codeBlockRegex = /```json\s*([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        const jsonContent = match[1].trim();
        const contentKey = `json-${jsonContent.substring(0, 100)}`;

        if (processedIntentsRef.current.has(contentKey)) {
          continue;
        }

        processedIntentsRef.current.add(contentKey);

        try {
          const intentData = JSON.parse(jsonContent);

          if (intentData.tag && intentData.patterns && intentData.responses) {
            const tagKey = `tag-${intentData.tag}`;

            if (processedIntentsRef.current.has(tagKey)) {
              continue;
            }

            processedIntentsRef.current.add(tagKey);

            const originalTag = intentData.tag;
            const uniqueTag = await generateUniqueTag(originalTag);

            if (uniqueTag !== originalTag) {
              toast.info("Tag adjusted", {
                description: `Tag '${originalTag}' was renamed to '${uniqueTag}'`,
              });
            }

            intentData.tag = uniqueTag;
            intents.push(intentData);
          }
        } catch (e) {
          console.error(
            "[useIntentsChat] Error parsing intent from code block:",
            e
          );
        }
      }

      if (!text.includes("```json")) {
        const jsonRegex =
          /\{[\s\S]*?"tag"[\s\S]*?"patterns"[\sS]*?"responses"[\s\S]*?\}/g;

        while ((match = jsonRegex.exec(text)) !== null) {
          const jsonContent = match[0];
          const contentKey = `raw-${jsonContent.substring(0, 100)}`;

          if (processedIntentsRef.current.has(contentKey)) {
            continue;
          }

          processedIntentsRef.current.add(contentKey);

          try {
            const intentData = JSON.parse(jsonContent);

            if (intentData.tag && intentData.patterns && intentData.responses) {
              const tagKey = `tag-${intentData.tag}`;

              if (processedIntentsRef.current.has(tagKey)) {
                continue;
              }

              processedIntentsRef.current.add(tagKey);

              const originalTag = intentData.tag;
              const uniqueTag = await generateUniqueTag(originalTag);

              if (uniqueTag !== originalTag) {
                toast.info("Tag adjusted", {
                  description: `Tag '${originalTag}' was renamed to '${uniqueTag}'`,
                });
              }

              intentData.tag = uniqueTag;
              intents.push(intentData);
            }
          } catch (e) {
            console.error(
              "[useIntentsChat] Error parsing intent from raw JSON:",
              e
            );
          }
        }
      }

      return intents;
    },
    []
  );

  const buildRequestPayload = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message: string, history: any[]) => {
      const serverMessage =
        `GENERATION PARAMETERS\n` +
        `- dataset_language: ${language}\n` +
        `- average_count: ${avgCount}\n` +
        `- force_options: ${forceOptions}\n` +
        `- context_variables: [${contextVariables.join(", ")}]\n\n` +
        `USER REQUEST\n` +
        `${message}`;

      const filteredHistory = includeInHistory
        ? history
        : history.map(entry => {
            if (entry.role === "assistant") {
              const contentWithoutJson = entry.content.replace(
                /```json\s*[\s\S]*?```/g,
                ""
              );
              return {
                ...entry,
                content:
                  contentWithoutJson.trim() ||
                  "[Intent data omitted to save tokens]",
              };
            }
            return entry;
          });

      return {
        message: serverMessage,
        history: filteredHistory,
        model,
        language,
        avgCount,
        forceOptions,
        contextVariables,
      };
    },
    [
      language,
      avgCount,
      forceOptions,
      contextVariables,
      includeInHistory,
      model,
    ]
  );

  const chatHook = useAIChat<IIntent>({
    initialMessages,
    model,
    apiEndpoint: "/api/ai/generate-intents",
    onDataExtracted: onIntentGenerated,
    extractData: extractIntents,
    buildRequestPayload,
    shouldFilterHistory: !includeInHistory,
  });

  const resetProcessedIntents = useCallback(() => {
    processedIntentsRef.current.clear();
    tagExistsCache.clear();
    chatHook.resetProcessedData();
  }, [chatHook]);

  return {
    ...chatHook,
    resetProcessedIntents,
  };
}

