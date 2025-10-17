import { useState, useCallback, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import type { ChatMessage } from "@/components/ai-chat/chat-container";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import type { CopilotTool, CopilotCanvasItem } from "@/types/copilot-tool";

type ChatStatus = "idle" | "submitted" | "streaming" | "completed" | "error";

interface UseCopilotChatOptions {
  tool: CopilotTool;
  model: string;
  controlsState?: Record<string, unknown>;
  onItemGenerated?: (item: CopilotCanvasItem) => void;
  webSearchEnabled?: boolean;
}

function createWelcomeMessage(tool: CopilotTool): ChatMessage {
  const getToolExamples = () => {
    switch (tool.id) {
      case "intents":
        return "\n**Examples:**\n- Create greeting intents\n- Generate help intents\n- Make intents for product inquiries";
      case "agents":
        return "\n**Examples:**\n- Create a customer support agent\n- Generate a sales assistant agent\n- Make a technical support agent";
      default:
        return "";
    }
  };

  return {
    key: nanoid(),
    from: "assistant" as const,
    versions: [
      {
        id: nanoid(),
        content: `# Welcome to ${tool.name}! 👋

${tool.description}

${
  tool.canvasEnabled
    ? "✨ **Generated content will appear in the canvas panel.**\n\n"
    : ""
}${getToolExamples()}

💬 **How can I assist you today?**`,
      },
    ],
    name: tool.name,
  };
}

export function useCopilotChat({
  tool,
  model,
  controlsState,
  onItemGenerated,
  webSearchEnabled = false,
}: UseCopilotChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(tool),
  ]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([createWelcomeMessage(tool)]);
  }, [tool, tool.id]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (status === "streaming" || status === "submitted") {
        return;
      }

      const userMessageKey = nanoid();
      const assistantMessageKey = nanoid();
      const versionId = nanoid();

      const conversationHistory: {
        role: "user" | "assistant";
        content: string;
      }[] = messages.flatMap(
        (msg): { role: "user" | "assistant"; content: string }[] => {
          if (msg.from === "user") {
            const content = msg.versions?.[0]?.content || "";
            return [{ role: "user" as const, content }];
          } else if (msg.from === "assistant") {
            const latestVersion = msg.versions[msg.versions.length - 1];
            return [
              { role: "assistant" as const, content: latestVersion.content },
            ];
          }
          return [];
        }
      );

      const userMessage: ChatMessage = {
        key: userMessageKey,
        from: "user",
        versions: [
          {
            id: nanoid(),
            content: message.text || "",
          },
        ],
        name: "You",
        //files: message.files,
      };

      const assistantMessage: ChatMessage = {
        key: assistantMessageKey,
        from: "assistant",
        versions: [{ id: versionId, content: "" }],
        name: tool.name,
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);

      setStatus("submitted");

      try {
        abortControllerRef.current = new AbortController();

        const result = await tool.handleSubmit({
          userMessage: message.text || "",
          conversationHistory,
          //files: message.files,
          model,
          temperature: 0.7,
          controlsState,
          webSearchEnabled,
        });

        setStatus("streaming");

        const reader = result.stream.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages(prev =>
            prev.map(msg =>
              msg.key === assistantMessageKey
                ? {
                    ...msg,
                    versions: [
                      {
                        id: versionId,
                        content: accumulatedText,
                      },
                    ],
                  }
                : msg
            )
          );
        }

        if (tool.parseCanvasItems && onItemGenerated) {
          const items = tool.parseCanvasItems(accumulatedText);
          items.forEach(item => onItemGenerated(item));
        }

        setStatus("completed");
      } catch (error) {
        console.error("[Copilot Chat] Error:", error);
        setStatus("error");

        setMessages(prev =>
          prev.map(msg =>
            msg.key === assistantMessageKey
              ? {
                  ...msg,
                  versions: [
                    {
                      id: versionId,
                      content: `Sorry, an error occurred: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`,
                    },
                  ],
                }
              : msg
          )
        );
      } finally {
        abortControllerRef.current = null;
        setTimeout(() => setStatus("idle"), 100);
      }
    },
    [
      messages,
      model,
      tool,
      status,
      onItemGenerated,
      controlsState,
      webSearchEnabled,
    ]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus("idle");
    }
  }, []);

  const shouldHideJsonBlocks = tool.id === "intents" || tool.id === "agents";
  const collapsibleBlocks = tool.collapsibleBlocks;

  return {
    messages,
    status,
    handleSubmit,
    stop,
    shouldHideJsonBlocks,
    collapsibleBlocks,
  };
}

