"use client";

import { useRouter } from "next/navigation";
import { DatasetForm } from "@/components/dataset-form";
import { Layout } from "@/components/layout";
import { datasetsService } from "@/services/datasets-service";
import { DatasetFormData } from "@/components/dataset-form";

export default function AddDatasetPage() {
  const router = useRouter();

  const handleSubmit = async (formData: DatasetFormData) => {
    try {
      await datasetsService.createDataset(formData);
      router.push("/ai/datasets");
    } catch (error) {
      console.error("Error creating dataset:", error);
    }
  };

  return (
    <Layout>
      <div className="mx-auto">
        <h1 className="text-3xl font-bold mb-5">Add New Dataset</h1>
        <DatasetForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
}

