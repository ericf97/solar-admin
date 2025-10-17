"use client";

import { Badge } from "@/components/ui/badge";
import { IIntent } from "@/types/intent";
import {
  MessageSquare,
  MousePointerClick,
  Sparkles,
  Zap,
  Trash2,
  Edit,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import {
  IntentForm,
  IntentSubmitData,
  IntentFormActions,
} from "@/components/intent-form";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormModal } from "@/components/form-modal";

interface IntentPreviewProps {
  intents: IIntent[];
  onRemoveIntent?: (intentId: string) => void;
  onUpdateIntent?: (intentId: string, data: IntentSubmitData) => void;
  savingIntentId?: string | null;
  failedIntents?: Map<string, string>;
}

export function IntentPreview({
  intents,
  onRemoveIntent,
  onUpdateIntent,
  savingIntentId,
  failedIntents,
}: IntentPreviewProps) {
  const [editingIntent, setEditingIntent] = useState<IIntent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedIntents, setExpandedIntents] = useState<Set<string>>(
    new Set()
  );
  const latestIntentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevIntentsLengthRef = useRef(intents.length);

  useEffect(() => {
    if (intents.length > prevIntentsLengthRef.current) {
      setTimeout(() => {
        latestIntentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }, 700);
    }
    prevIntentsLengthRef.current = intents.length;
  }, [intents.length]);

  useEffect(() => {
    if (savingIntentId) {
      const element = document.querySelector(
        `[data-intent-id="${savingIntentId}"]`
      );
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, [savingIntentId]);

  const handleEditClick = (intent: IIntent) => {
    setEditingIntent(intent);
    setIsEditModalOpen(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditModalOpen(false);
      setEditingIntent(null);
      setIsEditing(false);
    }
  };

  const handleSaveEdit = () => {
    const formId = editingIntent
      ? `intent-edit-form-${editingIntent.id}`
      : "intent-edit-form";
    const formElement = document.getElementById(
      formId
    ) as HTMLFormElement | null;
    if (formElement) {
      formElement.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleEditSubmit = (data: IntentSubmitData) => {
    if (editingIntent && onUpdateIntent) {
      onUpdateIntent(editingIntent.id, data);
      setIsEditModalOpen(false);
      setEditingIntent(null);
      setIsEditing(false);
    }
  };

  const toggleExpanded = (intentId: string) => {
    setExpandedIntents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(intentId)) {
        newSet.delete(intentId);
      } else {
        newSet.add(intentId);
      }
      return newSet;
    });
  };

  if (!intents || intents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Intents preview will appear here
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Start creating intents to see the preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="space-y-3 h-full overflow-y-auto pr-2 pb-4"
      >
        <AnimatePresence mode="popLayout">
          {intents.map((intent, index) => {
            const isSaving = savingIntentId === intent.id;
            const hasFailed = failedIntents?.has(intent.id);
            const failureMessage = failedIntents?.get(intent.id);
            const isExpanded = expandedIntents.has(intent.id);

            return (
              <motion.div
                key={intent.id}
                ref={index === intents.length - 1 ? latestIntentRef : null}
                data-intent-id={intent.id}
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
                  opacity: { duration: 0.4 },
                  filter: { duration: 0.3 },
                }}
                layout
                layoutId={intent.id}
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
                    onClick={() => toggleExpanded(intent.id)}
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
                            <Zap className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {intent.tag}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-blue-500" />
                              {intent.patterns.length} patterns
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-green-500" />
                              {intent.responses.length} responses
                            </span>
                            {intent.options && intent.options.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MousePointerClick className="h-3 w-3 text-purple-500" />
                                {intent.options.length} options
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={e => {
                            e.stopPropagation();
                            handleEditClick(intent);
                          }}
                          title="Edit intent"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {onRemoveIntent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={e => {
                              e.stopPropagation();
                              onRemoveIntent(intent.id);
                            }}
                            title="Remove intent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
                    <div className="px-4 pb-4 pt-2 space-y-4 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-muted rounded-lg">
                              <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-semibold">
                              Patterns
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {intent.patterns.length}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {intent.patterns.map((pattern, index) => (
                            <div
                              key={index}
                              className="text-sm p-2.5 bg-muted/50 border rounded-lg"
                            >
                              {pattern}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-muted rounded-lg">
                              <MessageSquare className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-semibold">
                              Responses
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {intent.responses.length}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {intent.responses.map((response, index) => (
                            <div
                              key={index}
                              className="p-2.5 bg-muted/50 border rounded-lg space-y-1"
                            >
                              <p className="text-sm">{response.text}</p>
                              {response.alt && (
                                <p className="text-xs text-muted-foreground italic">
                                  Alt: {response.alt}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {intent.options && intent.options.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-muted rounded-lg">
                                <MousePointerClick className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-sm font-semibold">
                                Options
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {intent.options.length}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {intent.options.map((option, index) => (
                              <div
                                key={index}
                                className="p-2.5 bg-muted/50 border rounded-lg space-y-1.5"
                              >
                                <p className="text-xs font-medium truncate">
                                  {option.label}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-xs w-full justify-center"
                                >
                                  → {option.tag}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {intent.visualCue &&
                        intent.visualCue.face &&
                        intent.visualCue.body && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-muted rounded-lg">
                                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <span className="text-sm font-semibold">
                                Visual Cues
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {intent.visualCue.face &&
                                intent.visualCue.face.id && (
                                  <div className="p-2.5 bg-muted/50 border rounded-lg space-y-2">
                                    <span className="text-xs font-semibold">
                                      Face
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs w-full justify-center truncate"
                                    >
                                      {intent.visualCue.face.id}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary rounded-full transition-all"
                                          style={{
                                            width: `${
                                              (intent.visualCue.face
                                                .intensity || 0) * 100
                                            }%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium tabular-nums">
                                        {Math.round(
                                          (intent.visualCue.face.intensity ||
                                            0) * 100
                                        )}
                                        %
                                      </span>
                                    </div>
                                  </div>
                                )}
                              {intent.visualCue.body &&
                                intent.visualCue.body.id && (
                                  <div className="p-2.5 bg-muted/50 border rounded-lg space-y-2">
                                    <span className="text-xs font-semibold">
                                      Body
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs w-full justify-center truncate"
                                    >
                                      {intent.visualCue.body.id}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary rounded-full transition-all"
                                          style={{
                                            width: `${
                                              (intent.visualCue.body
                                                .intensity || 0) * 100
                                            }%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium tabular-nums">
                                        {Math.round(
                                          (intent.visualCue.body.intensity ||
                                            0) * 100
                                        )}
                                        %
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>
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

      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingIntent(null);
          setIsEditing(false);
        }}
        title={editingIntent ? `Intent: ${editingIntent.tag}` : "Edit Intent"}
        actions={
          <IntentFormActions
            isViewMode={true}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onEdit={handleEdit}
            onCancel={handleCancelEdit}
            onSave={handleSaveEdit}
            hasInitialData={!!editingIntent}
          />
        }
      >
        {editingIntent && (
          <IntentForm
            initialData={editingIntent}
            onSubmit={handleEditSubmit}
            mode={isEditing ? "edit" : "view"}
            formId={
              editingIntent
                ? `intent-edit-form-${editingIntent.id}`
                : "intent-edit-form"
            }
          />
        )}
      </FormModal>
    </>
  );
}

