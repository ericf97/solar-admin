"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IIntent } from "@/types/intent";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { intentsService } from "@/services/intents-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { IntentForm, IntentSubmitData } from "@/components/intent-form";
import { FormHeader } from "@/components/form-header";
import { Button } from "@/components/ui/button";

export default function EditIntentPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const [intent, setIntent] = useState<IIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadIntent() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await intentsService.getIntent(id);
        setIntent(data);
      } catch (error) {
        console.error("Error loading intent:", error);
        setError("Failed to load intent. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadIntent();
  }, [id]);

  const handleSubmit = async (data: IntentSubmitData) => {
    setIsSubmitting(true);
    try {
      await intentsService.updateIntent(id, data);
      router.push("/ai/intents");
    } catch (error) {
      console.error("Error updating intent:", error);
      setError("Failed to update intent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    const form = document.getElementById("intent-form") as HTMLFormElement;
    if (form) {
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <Layout>
      <div className="mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : intent ? (
          <>
            <FormHeader
              title="Edit Intent"
              description={`Update the details for: ${intent.tag}`}
              actions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              }
            />
            <IntentForm
              initialData={intent}
              onSubmit={handleSubmit}
              formId="intent-form"
            />
          </>
        ) : (
          <p className="text-center text-lg text-muted-foreground">
            Intent not found
          </p>
        )}
      </div>
    </Layout>
  );
}
