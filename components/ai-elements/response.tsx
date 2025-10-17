"use client";

import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock, CodeBlockCopyButton } from "./code-block";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CollapsibleBlockConfig {
  language: string;
  hideByDefault: boolean;
  collapsedLabel: string;
  collapsedIcon?: React.ComponentType<{ className?: string }>;
  animate?: boolean;
}

export type ResponseProps = ComponentProps<"div"> & {
  hideJsonBlocks?: boolean;
  collapsibleBlocks?: CollapsibleBlockConfig[];
};

export const Response = memo(
  ({
    className,
    children,
    hideJsonBlocks = false,
    collapsibleBlocks = [],
    ...props
  }: ResponseProps) => {
    const content = String(children || "");
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(
      new Set()
    );

    const toggleBlock = (blockId: string) => {
      setExpandedBlocks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(blockId)) {
          newSet.delete(blockId);
        } else {
          newSet.add(blockId);
        }
        return newSet;
      });
    };

    // Legacy support: convert hideJsonBlocks to collapsibleBlocks
    const effectiveCollapsibleBlocks: CollapsibleBlockConfig[] = [
      ...collapsibleBlocks,
    ];

    if (hideJsonBlocks && !collapsibleBlocks.some(b => b.language === "json")) {
      effectiveCollapsibleBlocks.push({
        language: "json",
        hideByDefault: true,
        collapsedLabel: "Generating intent...",
        collapsedIcon: Sparkles,
        animate: true,
      });
    }

    const blockCountByLanguage: Record<string, number> = {};

    return (
      <div className={cn("prose prose-sm max-w-none", className)} {...props}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const codeContent = String(children).replace(/\n$/, "");

              // Check if this language should be collapsible
              const collapsibleConfig = effectiveCollapsibleBlocks.find(
                config => config.language === language
              );

              if (!inline && collapsibleConfig && collapsibleConfig.hideByDefault) {
                // Track block count for this language
                if (!blockCountByLanguage[language]) {
                  blockCountByLanguage[language] = 0;
                }
                const currentBlockIndex = blockCountByLanguage[language];
                blockCountByLanguage[language]++;

                // Create unique block ID
                const blockId = `${language}-${currentBlockIndex}`;
                const isExpanded = expandedBlocks.has(blockId);

                const Icon = collapsibleConfig.collapsedIcon || Sparkles;

                return (
                  <div className="my-4 border border-primary/10 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleBlock(blockId)}
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon
                          className={cn(
                            "h-4 w-4 text-primary",
                            collapsibleConfig.animate && "animate-pulse"
                          )}
                        />
                        <span>{collapsibleConfig.collapsedLabel}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={e => {
                          e.stopPropagation();
                          toggleBlock(blockId);
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide Data
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show Data
                          </>
                        )}
                      </Button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-primary/10">
                        <CodeBlock code={codeContent} language={language}>
                          <CodeBlockCopyButton />
                        </CodeBlock>
                      </div>
                    )}
                  </div>
                );
              }

              if (!inline && language) {
                return (
                  <CodeBlock code={codeContent} language={language}>
                    <CodeBlockCopyButton />
                  </CodeBlock>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    );
  }
);

Response.displayName = "Response";

