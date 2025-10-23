"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IAgent } from "@/types/agent";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { agentsService } from "@/services/agents-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AgentForm, AgentSubmitData } from "@/components/agent-form";
import { FormHeader } from "@/components/form-header";
import { Button } from "@/components/ui/button";

export default function EditAgentPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const [agent, setAgent] = useState<IAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadAgent() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await agentsService.getAgent(id);
        setAgent(data);
      } catch (error) {
        console.error("Error loading agent:", error);
        setError("Failed to load agent. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAgent();
  }, [id]);

  const handleSubmit = async (data: AgentSubmitData) => {
    setIsSubmitting(true);
    try {
      await agentsService.updateAgent(id, data);
      router.push("/ai/agents");
    } catch (error) {
      console.error("Error updating agent:", error);
      setError("Failed to update agent. Please try again.");
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
        ) : agent ? (
          <>
            <FormHeader
              title="Edit Agent"
              description={`Update the details for: ${agent.name}`}
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
            <AgentForm
              initialData={agent}
              onSubmit={handleSubmit}
              formId="agent-form"
            />
          </>
        ) : (
          <p className="text-center text-lg text-muted-foreground">
            Agent not found
          </p>
        )}
      </div>
    </Layout>
  );
}
