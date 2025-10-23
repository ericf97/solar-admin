"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentForm, AgentFormData } from "@/components/agent-form";
import { Layout } from "@/components/layout";
import { agentsService } from "@/services/agents-service";
import { FormHeader } from "@/components/form-header";
import { Button } from "@/components/ui/button";

export default function AddAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: AgentFormData) => {
    setIsSubmitting(true);
    try {
      await agentsService.createAgent(formData);
      router.push("/ai/agents");
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    const form = document.getElementById("agent-form") as HTMLFormElement;
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
          title="Add New Agent"
          description="Create a new AI agent with custom configuration"
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
                {isSubmitting ? "Creating..." : "Create Agent"}
              </Button>
            </>
          }
        />
        <AgentForm onSubmit={handleSubmit} formId="agent-form" />
      </div>
    </Layout>
  );
}
