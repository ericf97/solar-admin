"use client";

import { useRouter } from "next/navigation";
import { IntentForm, IntentSubmitData } from "@/components/intent-form";
import { Layout } from "@/components/layout";
import { intentsService } from "@/services/intents-service";

export default function AddIntentPage() {
  const router = useRouter();

  const handleSubmit = async (formData: IntentSubmitData) => {
    try {
      await intentsService.createIntent(formData);
      router.push("/ai/intents");
    } catch (error) {
      console.error("Error creating intent:", error);
    }
  };

  return (
    <Layout>
      <div className="mx-auto">
        <h1 className="text-3xl font-bold mb-5">Add New Intent</h1>
        <IntentForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}

