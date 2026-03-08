import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel mendukung Next.js secara native (SSR/SSG/ISR)
  // Tidak perlu output: 'export' - itu hanya untuk hosting statis seperti Hawkhost
  images: {
    unoptimized: true,
  },
};

export default nextConfig;