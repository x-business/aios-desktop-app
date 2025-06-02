import type { NextConfig } from "next";

// Simple config with minimal settings
const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
};

export default nextConfig;
