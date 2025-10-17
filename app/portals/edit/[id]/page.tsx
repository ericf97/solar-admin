"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IPortal } from "@/types/portal";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { portalService } from "@/services/portals-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ViewForm } from "@/components/view-form";

export default function EditPortalPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const [portal, setPortal] = useState<IPortal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadPortal() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await portalService.getPortal(id);
        setPortal(data);
      } catch (error) {
        console.error("Error loading portal:", error);
        setError("Failed to load portal. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPortal();
  }, [id]);

  const handleSubmit = async (data: Partial<IPortal>) => {
    try {
      await portalService.updatePortal(id, data);
      router.push("/portals");
    } catch (error) {
      console.error("Error updating portal:", error);
      setError("Failed to update portal. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Edit Portal</CardTitle>
            <CardDescription>
              Update the details of the selected portal
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
            ) : portal ? (
              <ViewForm
                initialData={portal}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/portals")}
              />
            ) : (
              <p className="text-center text-lg text-muted-foreground">
                Portal not found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
