"use client";

import { useRouter } from "next/navigation";
import { PortalForm } from "@/components/portal-form";
import { Layout } from "@/components/layout";

export default function AddPortalPage() {
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      // console.log(formData);
      // await portalService.createPortal(formData);
      router.push("/");
    } catch (error) {
      console.error("Error creating portal:", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Add New Portal</h1>
        <PortalForm onSubmit={handleSubmit} onCancel={() => router.push("/")} />
      </div>
    </Layout>
  );
}

