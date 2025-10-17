"use client";

import { RefObject, useState } from "react";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe } from "lucide-react";
import { ModelSelectorModal } from "./model-selector-modal";

export interface ModelOption {
  id: string;
  name: string;
  price: string | { input: string; output: string };
  capacity: number;
  speed: number;
}

export interface ChatInputProps {
  text: string;
  onTextChange: (text: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  onStop?: () => void;
  placeholder?: string;
  status: "submitted" | "streaming" | "ready" | "error";
  model: string;
  models: ModelOption[];
  onModelChange: (model: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement>;
  enableFileUpload?: boolean;
  enableSpeech?: boolean;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: () => void;
}

export function ChatInput({
  text,
  onTextChange,
  onSubmit,
  onStop,
  placeholder = "Type your message...",
  status,
  model,
  models,
  onModelChange,
  textareaRef,
  enableFileUpload = true,
  enableSpeech = true,
  webSearchEnabled = false,
  onWebSearchToggle,
}: ChatInputProps) {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const handleSubmitOrStop = (message: PromptInputMessage) => {
    if (status === "streaming" && onStop) {
      onStop();
    } else {
      onSubmit(message);
    }
  };

  const selectedModel = models.find(m => m.id === model);

  return (
    <>
      <PromptInput globalDrop multiple onSubmit={handleSubmitOrStop}>
        <PromptInputBody>
          {enableFileUpload && (
            <PromptInputAttachments>
              {attachment => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          )}
          <PromptInputTextarea
            onChange={event => onTextChange(event.target.value)}
            placeholder={placeholder}
            ref={textareaRef}
            value={text}
          />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            {enableFileUpload && (
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            )}
            {enableSpeech && (
              <PromptInputSpeechButton
                onTranscriptionChange={onTextChange}
                textareaRef={textareaRef}
              />
            )}
            {onWebSearchToggle && (
              <Button
                type="button"
                variant={webSearchEnabled ? "default" : "outline"}
                size="sm"
                onClick={onWebSearchToggle}
                className={`gap-2 h-9 px-3 ${
                  webSearchEnabled ? "bg-primary text-primary-foreground" : ""
                }`}
                title={
                  webSearchEnabled
                    ? "Web search enabled - Click to disable"
                    : "Web search disabled - Click to enable"
                }
              >
                <Globe className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModelSelectorOpen(true)}
              className="gap-2 h-9 px-3"
            >
              <span className="font-medium truncate max-w-[120px]">
                {selectedModel?.name || "Select Model"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PromptInputTools>
          <PromptInputSubmit
            disabled={!text.trim() && status !== "streaming"}
            status={status}
          />
        </PromptInputToolbar>
      </PromptInput>

      <ModelSelectorModal
        open={isModelSelectorOpen}
        onOpenChange={setIsModelSelectorOpen}
        models={models}
        selectedModel={model}
        onSelectModel={onModelChange}
      />
    </>
  );
}

