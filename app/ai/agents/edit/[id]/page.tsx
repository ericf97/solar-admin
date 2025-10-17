"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IAgent } from "@/types/agent";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { agentsService } from "@/services/agents-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AgentForm, AgentSubmitData } from "@/components/agent-form";

export default function EditAgentPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const [agent, setAgent] = useState<IAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    try {
      await agentsService.updateAgent(id, data);
      router.push("/ai/agents");
    } catch (error) {
      console.error("Error updating agent:", error);
      setError("Failed to update agent. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Edit Agent</CardTitle>
            <CardDescription>
              Update the details of the selected agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : agent ? (
              <AgentForm initialData={agent} onSubmit={handleSubmit} />
            ) : (
              <p className="text-center text-lg text-muted-foreground">
                Agent not found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

