"use client";

import { ReactNode } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from "@/components/ai-elements/branch";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Response,
  CollapsibleBlockConfig,
} from "@/components/ai-elements/response";
import { Loader2 } from "lucide-react";

export interface ChatMessage {
  key: string;
  from: "user" | "assistant";
  versions: {
    id: string;
    content: string;
  }[];
  name: string;
}

interface ChatContainerProps {
  messages: ChatMessage[];
  controls?: ReactNode;
  promptInput: ReactNode;
  isProcessing?: boolean;
  hideJsonBlocks?: boolean;
  collapsibleBlocks?: CollapsibleBlockConfig[];
}

export function ChatContainer({
  messages = [],
  isProcessing,
  promptInput,
  controls,
  hideJsonBlocks = false,
  collapsibleBlocks,
}: ChatContainerProps) {
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="relative flex flex-col h-full divide-y overflow-hidden bg-background">
      <Conversation>
        <ConversationContent>
          {safeMessages.map(({ versions, ...message }) => (
            <Branch defaultBranch={0} key={message.key}>
              <BranchMessages>
                {versions.map(version => (
                  <Message
                    from={message.from}
                    key={`${message.key}-${version.id}`}
                  >
                    <MessageContent
                      variant="flat"
                      className={
                        message.from === "user"
                          ? "!bg-[#323232d9] !rounded-[18px] !text-white border-none"
                          : message.name === "System"
                          ? "!bg-primary/10 !border-primary/20 !rounded-lg"
                          : "!bg-transparent border-none"
                      }
                    >
                      <Response
                        hideJsonBlocks={hideJsonBlocks}
                        collapsibleBlocks={collapsibleBlocks}
                      >
                        {version.content}
                      </Response>
                    </MessageContent>
                  </Message>
                ))}
              </BranchMessages>
              {versions.length > 1 && (
                <BranchSelector from={message.from}>
                  <BranchPrevious />
                  <BranchPage />
                  <BranchNext />
                </BranchSelector>
              )}
            </Branch>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4">
        {controls && <div className="px-4">{controls}</div>}
        <div className="w-full px-4">{promptInput}</div>
      </div>
    </div>
  );
}

