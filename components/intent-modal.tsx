"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { intentsService } from "@/services/intents-service";
import { IIntent } from "@/types/intent";
import {
  IntentForm,
  IntentSubmitData,
  IntentFormActions,
} from "@/components/intent-form";
import { FormModal } from "@/components/form-modal";
import { toast } from "sonner";

interface IntentModalProps {
  intentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function IntentModal({
  intentId,
  isOpen,
  onClose,
  onUpdate,
}: IntentModalProps) {
  const [intent, setIntent] = useState<IIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadIntent() {
      if (intentId && isOpen) {
        setIsLoading(true);
        try {
          const data = await intentsService.getIntent(intentId);
          setIntent(data);
        } catch (error) {
          console.error("Error loading intent:", error);
          toast.error("Failed to load intent");
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadIntent();
  }, [intentId, isOpen]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      onClose();
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    const formElement = document.querySelector("form");
    if (formElement) {
      formElement.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleUpdate = async (data: IntentSubmitData) => {
    if (!intent) return;
    setIsSubmitting(true);
    try {
      await intentsService.updateIntent(intent.id, data);
      toast.success("Intent updated successfully");

      if (onUpdate) {
        onUpdate();
      }

      onClose();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating intent:", error);
      toast.error("Failed to update intent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!intentId || !isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="space-y-4">
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-32" />
        </div>
      </FormModal>
    );
  }

  if (!intent) {
    return (
      <FormModal isOpen={isOpen} onClose={onClose} title="Intent not found">
        <p>Unable to load intent details.</p>
      </FormModal>
    );
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setIsEditing(false);
      }}
      title={`Intent: ${intent.tag}`}
      actions={
        <IntentFormActions
          isViewMode={true}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onCancel={handleCancelEdit}
          onSave={handleSave}
          hasInitialData={!!intent}
        />
      }
    >
      <IntentForm
        initialData={intent}
        onSubmit={handleUpdate}
        mode={isEditing ? "edit" : "view"}
      />
    </FormModal>
  );
}

