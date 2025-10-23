"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IDataset } from "@/types/dataset";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { datasetsService } from "@/services/datasets-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DatasetForm, DatasetFormData } from "@/components/dataset-form";
import { FormHeader } from "@/components/form-header";
import { Button } from "@/components/ui/button";

export default function EditDatasetPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const [dataset, setDataset] = useState<IDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadDataset() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await datasetsService.getDataset(id);
        setDataset(data);
      } catch (error) {
        console.error("Error loading dataset:", error);
        setError("Failed to load dataset. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDataset();
  }, [id]);

  const handleSubmit = async (data: DatasetFormData) => {
    setIsSubmitting(true);
    try {
      await datasetsService.updateDataset(id, data);
      router.push("/ai/datasets");
    } catch (error) {
      console.error("Error updating dataset:", error);
      setError("Failed to update dataset. Please try again.");
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
        ) : dataset ? (
          <>
            <FormHeader
              title="Edit Dataset"
              description={`Update the details for: ${dataset.name}`}
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
            <DatasetForm
              initialData={dataset}
              onSubmit={handleSubmit}
              formId="dataset-form"
            />
          </>
        ) : (
          <p className="text-center text-lg text-muted-foreground">
            Dataset not found
          </p>
        )}
      </div>
    </Layout>
  );
}
