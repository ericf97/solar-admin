"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IDataset } from "@/types/dataset";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { datasetsService } from "@/services/datasets-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DatasetForm, DatasetFormData } from "@/components/dataset-form";

export default function EditDatasetPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const [dataset, setDataset] = useState<IDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    try {
      await datasetsService.updateDataset(id, data);
      router.push("/ai/datasets");
    } catch (error) {
      console.error("Error updating dataset:", error);
      setError("Failed to update dataset. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Edit Dataset</CardTitle>
            <CardDescription>
              Update the details of the selected dataset
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
            ) : dataset ? (
              <DatasetForm initialData={dataset} onSubmit={handleSubmit} />
            ) : (
              <p className="text-center text-lg text-muted-foreground">
                Dataset not found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

