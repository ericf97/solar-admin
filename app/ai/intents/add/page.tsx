"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntentForm, IntentSubmitData } from "@/components/intent-form";
import { Layout } from "@/components/layout";
import { intentsService } from "@/services/intents-service";
import { FormHeader } from "@/components/form-header";
import { Button } from "@/components/ui/button";

export default function AddIntentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: IntentSubmitData) => {
    setIsSubmitting(true);
    try {
      await intentsService.createIntent(formData);
      router.push("/ai/intents");
    } catch (error) {
      console.error("Error creating intent:", error);
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
        <FormHeader
          title="Add New Intent"
          description="Create a new intent with patterns and responses"
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
                {isSubmitting ? "Creating..." : "Create Intent"}
              </Button>
            </>
          }
        />
        <IntentForm onSubmit={handleSubmit} formId="intent-form" />
      </div>
    </Layout>
  );
}

