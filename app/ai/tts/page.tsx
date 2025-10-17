"use client";

import dynamic from "next/dynamic";
import { Layout } from "@/components/layout";

const PiperClient = dynamic(() => import("./piper-client"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <p className="text-muted-foreground">Loading voice engine...</p>
    </div>
  ),
});

export default function Page() {
  return (
    <Layout>
      <PiperClient />
    </Layout>
  );
}

