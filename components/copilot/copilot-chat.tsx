"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  Hash,
  ChevronDown,
} from "lucide-react";
import { ChatContainer } from "@/components/ai-chat/chat-container";
import { ChatInput } from "@/components/ai-chat/chat-input";
import { type ChatInputProps } from "@/components/ai-chat/chat-input";
import { AI_MODELS } from "@/config/ai-models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptInputMessage } from "../ai-elements/prompt-input";
import { CopilotCanvas } from "./copilot-canvas";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { COPILOT_TOOLS } from "@/config/copilot-tools";
import type { CopilotTool, CopilotCanvasItem } from "@/types/copilot-tool";
import { useCopilotChat } from "@/hooks/use-copilot-chat";
import { ToolSelector } from "./tool-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { detectToolHybrid } from "@/services/tool-detector-service";
import { toast } from "sonner";
import { useCopilotStore } from "@/store/copilot-store";

interface CopilotChatProps {
  isOpen: boolean;
}

export function CopilotChat({ isOpen }: CopilotChatProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null!);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [isDetectingTool, setIsDetectingTool] = useState(false);

  // Copilot store
  const inputText = useCopilotStore(state => state.inputText);
  const setInputText = useCopilotStore(state => state.setInputText);
  const selectedModel = useCopilotStore(
    state => state.selectedModel || AI_MODELS[0].id
  );
  const setSelectedModel = useCopilotStore(state => state.setSelectedModel);
  const canvasItems = useCopilotStore(state => state.canvasItems);
  const addCanvasItem = useCopilotStore(state => state.addCanvasItem);
  const clearCanvasItems = useCopilotStore(state => state.clearCanvasItems);
  const selectedToolId = useCopilotStore(state => state.selectedToolId);
  const setSelectedToolId = useCopilotStore(state => state.setSelectedToolId);
  const controlsState = useCopilotStore(state => state.controlsState);
  const setControlsState = useCopilotStore(state => state.setControlsState);
  const webSearchEnabled = useCopilotStore(state => state.webSearchEnabled);
  const setWebSearchEnabled = useCopilotStore(
    state => state.setWebSearchEnabled
  );
  const isFullscreen = useCopilotStore(state => state.isFullscreen);
  const toggleFullscreen = useCopilotStore(state => state.toggleFullscreen);
  const setFullscreen = useCopilotStore(state => state.setFullscreen);
  const isCanvasOpen = useCopilotStore(state => state.isCanvasOpen);
  const toggleCanvas = useCopilotStore(state => state.toggleCanvas);
  const setCanvasOpen = useCopilotStore(state => state.setCanvasOpen);

  const selectedTool =
    COPILOT_TOOLS.find(t => t.id === selectedToolId) || COPILOT_TOOLS[0];

  const handleItemGenerated = useCallback(
    (item: CopilotCanvasItem) => {
      addCanvasItem(item);
    },
    [addCanvasItem]
  );

  const {
    messages,
    status,
    handleSubmit: submitMessage,
    stop,
    shouldHideJsonBlocks,
    collapsibleBlocks,
  } = useCopilotChat({
    tool: selectedTool,
    model: selectedModel,
    controlsState,
    onItemGenerated: handleItemGenerated,
    webSearchEnabled,
  });

  useEffect(() => {
    if (canvasItems.length > 0 && !isCanvasOpen && selectedTool.canvasEnabled) {
      setCanvasOpen(true);
      if (!isFullscreen) {
        setFullscreen(true);
      }
    }
  }, [
    canvasItems.length,
    isCanvasOpen,
    selectedTool.canvasEnabled,
    setCanvasOpen,
    isFullscreen,
    setFullscreen,
  ]);

  useEffect(() => {
    setControlsState(selectedTool.initialControlsState || {});
    if (!selectedTool.canvasEnabled) {
      setCanvasOpen(false);
      clearCanvasItems();
    }
  }, [
    selectedTool.canvasEnabled,
    selectedTool.id,
    selectedTool.initialControlsState,
    setCanvasOpen,
    clearCanvasItems,
    setControlsState,
  ]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.startsWith("/")) {
      setShowToolSelector(true);
    } else {
      setShowToolSelector(false);
    }
  };

  const handleToolSelect = (tool: CopilotTool) => {
    setSelectedToolId(tool.id);
    setInputText("");
    setShowToolSelector(false);
    textareaRef.current?.focus();
  };

  const handleInputSubmit = async (message: PromptInputMessage) => {
    if (
      selectedTool.id === "general" &&
      message.text &&
      message.text.length > 10
    ) {
      setIsDetectingTool(true);

      try {
        const detection = await detectToolHybrid(
          message.text,
          selectedModel,
          COPILOT_TOOLS
        );

        if (
          detection.tool &&
          detection.tool.id !== "general" &&
          detection.confidence > 0.7
        ) {
          setSelectedToolId(detection.tool.id);
          setControlsState(detection.tool.initialControlsState || {});

          toast.success(`Switched to ${detection.tool.name}`, {
            description: "You can now use this specialized tool",
            duration: 3000,
          });

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error("[Copilot] Tool detection failed:", error);
      } finally {
        setIsDetectingTool(false);
      }
    }

    submitMessage(message);
    setInputText("");
    setShowToolSelector(false);
  };

  const handleClearCanvas = () => {
    clearCanvasItems();
  };

  const handleWebSearchToggle = () => {
    setWebSearchEnabled(!webSearchEnabled);
    toast.info(
      !webSearchEnabled ? "Web search enabled" : "Web search disabled",
      {
        description: !webSearchEnabled
          ? "Responses will include current information from the web"
          : "Responses will use AI knowledge only",
        duration: 2000,
      }
    );
  };

  if (!isOpen) return null;

  if (!messages || !Array.isArray(messages)) {
    return null;
  }

  const ControlsComponent = selectedTool.ControlsComponent;
  const CanvasComponent = selectedTool.CanvasComponent || CopilotCanvas;

  const chatContent = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden min-h-0">
        <ChatContainer
          messages={messages}
          isProcessing={
            status === "streaming" || status === "submitted" || isDetectingTool
          }
          promptInput={null}
          hideJsonBlocks={shouldHideJsonBlocks}
          collapsibleBlocks={collapsibleBlocks}
        />
      </div>
      <div className="flex-shrink-0 bg-background">
        {ControlsComponent && (
          <div className="px-2 pt-2">
            <ControlsComponent
              value={controlsState}
              onChange={setControlsState}
            />
          </div>
        )}
        <div className="relative p-2">
          {showToolSelector && (
            <ToolSelector
              query={inputText.slice(1)}
              tools={COPILOT_TOOLS}
              onSelect={handleToolSelect}
              onClose={() => setShowToolSelector(false)}
            />
          )}
          <ChatInput
            text={inputText}
            onTextChange={handleInputChange}
            onSubmit={handleInputSubmit}
            onStop={stop}
            placeholder={
              isDetectingTool
                ? "Detecting best tool..."
                : `Ask ${selectedTool.name} anything... (type / for tools)`
            }
            status={
              isDetectingTool
                ? "submitted"
                : (status as ChatInputProps["status"])
            }
            model={selectedModel}
            models={AI_MODELS}
            onModelChange={setSelectedModel}
            textareaRef={textareaRef}
            enableFileUpload={true}
            enableSpeech={true}
            webSearchEnabled={webSearchEnabled}
            onWebSearchToggle={handleWebSearchToggle}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="h-14 px-4 flex items-center justify-between bg-sidebar shrink-0 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 min-w-0">
          <selectedTool.icon className="h-5 w-5 text-primary flex-shrink-0" />
          <h2 className="text-lg font-semibold truncate">
            {selectedTool.name}
          </h2>
          <DropdownMenu
            open={showToolDropdown}
            onOpenChange={setShowToolDropdown}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs font-normal gap-1 hover:bg-accent"
              >
                <Hash className="h-3 w-3" />
                {selectedTool.trigger}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {COPILOT_TOOLS.map(tool => (
                <DropdownMenuItem
                  key={tool.id}
                  onClick={() => {
                    handleToolSelect(tool);
                    setShowToolDropdown(false);
                  }}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
                    <tool.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tool.name}</span>
                      {tool.id === selectedTool.id && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {tool.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {canvasItems.length > 0 && selectedTool.canvasEnabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCanvas}
              className="h-8 w-8 flex-shrink-0"
              title={isCanvasOpen ? "Hide canvas" : "Show canvas"}
            >
              {isCanvasOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 flex-shrink-0"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {isCanvasOpen && selectedTool.canvasEnabled ? (
          isFullscreen ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
                <div className="h-full">
                  <CanvasComponent
                    items={canvasItems}
                    onClear={handleClearCanvas}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={60} minSize={40}>
                {chatContent}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full p-2">
                  <CanvasComponent
                    items={canvasItems}
                    onClear={handleClearCanvas}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} minSize={50}>
                {chatContent}
              </ResizablePanel>
            </ResizablePanelGroup>
          )
        ) : (
          chatContent
        )}
      </div>
    </div>
  );
}

