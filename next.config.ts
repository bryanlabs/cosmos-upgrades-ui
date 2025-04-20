import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["raw.githubusercontent.com"], // Allow external images from GitHub
  },
  async rewrites() {
    return [
      {
        source: "/api/cosmos-upgrades/:path*",
        destination: "https://cosmos-upgrades.bryanlabs.net/:path*",
      },
    ];
  },
  allowedDevOrigins: ["http://192.168.1.41:3000"], // Add your network IP here
};

export default nextConfig;
