"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatasetForm } from "@/components/dataset-form";
import { Layout } from "@/components/layout";
import { datasetsService } from "@/services/datasets-service";
import { DatasetFormData } from "@/components/dataset-form";
import { FormHeader } from "@/components/form-header";
import { Button } from "@/components/ui/button";

export default function AddDatasetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: DatasetFormData) => {
    setIsSubmitting(true);
    try {
      await datasetsService.createDataset(formData);
      router.push("/ai/datasets");
    } catch (error) {
      console.error("Error creating dataset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    const form = document.getElementById("dataset-form") as HTMLFormElement;
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
          title="Add New Dataset"
          description="Create a new dataset with selected intents"
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
                {isSubmitting ? "Creating..." : "Create Dataset"}
              </Button>
            </>
          }
        />
        <DatasetForm onSubmit={handleSubmit} formId="dataset-form" />
      </div>
    </Layout>
  );
}
