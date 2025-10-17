"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { agentsService } from "@/services/agents-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CopilotCanvasProps } from "@/types/copilot-tool";
import { motion, AnimatePresence } from "framer-motion";

interface AgentCanvasItem {
  id: string;
  name: string;
  description?: string;
  role?: string;
  systemPrompt?: string;
  objective?: string;
  personality?: string;
  backstory?: string;
}

export function AgentsCanvas({
  items,
  onClear,
}: CopilotCanvasProps<AgentCanvasItem>) {
  const [agents, setAgents] = useState<AgentCanvasItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savingAgentId, setSavingAgentId] = useState<string | null>(null);
  const [failedAgents, setFailedAgents] = useState<Map<string, string>>(
    new Map()
  );
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAgents(items);
  }, [items]);

  const toggleExpanded = (agentId: string) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const handleRemoveAgent = (agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId));
    toast.success("Agent removed from preview");
  };

  const handleSaveAgents = async () => {
    if (!agents.length) return;

    setIsSaving(true);
    setFailedAgents(new Map());
    let saved = 0;
    const failures = new Map<string, string>();

    for (const agent of agents) {
      setSavingAgentId(agent.id);
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        await agentsService.createAgent({
          name: agent.name,
          description: agent.description,
          role: agent.role,
          systemPrompt: agent.systemPrompt,
          objective: agent.objective,
          personality: agent.personality,
          backstory: agent.backstory,
          datasets: [],
          greetings: [],
          fallback: [],
          repeatedInput: [],
          repeatedInputConfig: {
            enabled: false,
            tolerance: 3,
            historySize: 5,
            allowOriginalResponse: false,
          },
          objectives: [],
        });

        toast.success("Agent saved", {
          description: agent.name,
          duration: 2000,
        });
        await new Promise(resolve => setTimeout(resolve, 600));
        setAgents(prev => prev.filter(a => a.id !== agent.id));
        saved++;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        failures.set(agent.id, errorMessage);
        toast.error("Failed to save agent", {
          description: `${agent.name}: ${errorMessage}`,
          duration: 4000,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSavingAgentId(null);
    setIsSaving(false);
    setFailedAgents(failures);

    if (failures.size === 0) {
      toast.success("All agents saved!", {
        description: `Successfully saved ${saved} agent(s)`,
        duration: 3000,
      });
      if (onClear) onClear();
    }
  };

  const handleClearAll = () => {
    setAgents([]);
    setFailedAgents(new Map());
    if (onClear) onClear();
    toast.info("Preview cleared");
  };

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-sidebar">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Agents Preview</h2>
          <Badge variant="secondary" className="text-xs">
            {agents.length}
          </Badge>
          {failedAgents.size > 0 && (
            <Badge variant="destructive" className="text-xs">
              {failedAgents.size} failed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {agents.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveAgents}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {failedAgents.size > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Save Errors</AlertTitle>
            <AlertDescription>
              {failedAgents.size} agent(s) failed to save. Review errors below.
            </AlertDescription>
          </Alert>
        )}

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              Generated agents will appear here
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ask the Agent Creator to generate some agents
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {agents.map(agent => {
                const isSaving = savingAgentId === agent.id;
                const hasFailed = failedAgents.has(agent.id);
                const failureMessage = failedAgents.get(agent.id);
                const isExpanded = expandedAgents.has(agent.id);

                return (
                  <motion.div
                    key={agent.id}
                    data-agent-id={agent.id}
                    initial={{
                      opacity: 0,
                      scale: 0.85,
                      y: 40,
                      filter: "blur(4px)",
                    }}
                    animate={{
                      opacity: isSaving ? 0.6 : 1,
                      scale: isSaving ? 0.98 : 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      filter: "blur(8px)",
                      transition: {
                        duration: 0.4,
                        ease: "easeIn",
                      },
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    layout
                    className={`group relative border-2 rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-lg transition-all ${
                      isSaving
                        ? "border-primary/50 ring-2 ring-primary/20 animate-pulse"
                        : hasFailed
                        ? "border-destructive/50 ring-2 ring-destructive/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="relative">
                      {hasFailed && failureMessage && (
                        <Alert variant="destructive" className="m-4 mb-0">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Failed to save</AlertTitle>
                          <AlertDescription className="text-sm">
                            {failureMessage}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpanded(agent.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                hasFailed
                                  ? "bg-destructive/10"
                                  : "bg-gradient-to-br from-primary/10 to-purple-500/10"
                              }`}
                            >
                              {hasFailed ? (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              ) : (
                                <Bot className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">
                                {agent.name}
                              </h3>
                              {agent.role && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {agent.role}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={e => {
                                e.stopPropagation();
                                handleRemoveAgent(agent.id);
                              }}
                              title="Remove agent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <motion.div
                        initial={false}
                        animate={{
                          height: isExpanded ? "auto" : 0,
                          opacity: isExpanded ? 1 : 0,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: "easeInOut",
                        }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 space-y-3 border-t">
                          {agent.description && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Description
                              </span>
                              <p className="text-sm p-2 bg-muted/50 rounded-lg">
                                {agent.description}
                              </p>
                            </div>
                          )}

                          {agent.objective && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Main Objective
                              </span>
                              <p className="text-sm p-2 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 rounded-lg">
                                {agent.objective}
                              </p>
                            </div>
                          )}

                          {agent.personality && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Personality
                              </span>
                              <p className="text-sm p-2 bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 rounded-lg">
                                {agent.personality}
                              </p>
                            </div>
                          )}

                          {agent.backstory && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Backstory
                              </span>
                              <p className="text-sm p-2 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-lg">
                                {agent.backstory}
                              </p>
                            </div>
                          )}

                          {agent.systemPrompt && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                System Prompt
                              </span>
                              <pre className="text-xs p-2 bg-muted/50 rounded-lg whitespace-pre-wrap font-mono">
                                {agent.systemPrompt}
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
