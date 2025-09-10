import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true
  },
  images: {
    domains: [
      "hosting.renderforestsites.com",
      "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      "imagedelivery.net",
    ],
  },
};

export default nextConfig;
