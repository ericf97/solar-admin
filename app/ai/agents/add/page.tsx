"use client";

import { useRouter } from "next/navigation";
import { AgentForm, AgentFormData } from "@/components/agent-form";
import { Layout } from "@/components/layout";
import { agentsService } from "@/services/agents-service";

export default function AddAgentPage() {
  const router = useRouter();

  const handleSubmit = async (formData: AgentFormData) => {
    try {
      await agentsService.createAgent(formData);
      router.push("/ai/agents");
    } catch (error) {
      console.error("Error creating agent:", error);
    }
  };

  return (
    <Layout>
      <div className="mx-auto">
        <h1 className="text-3xl font-bold mb-5">Add New Agent</h1>
        <AgentForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}

