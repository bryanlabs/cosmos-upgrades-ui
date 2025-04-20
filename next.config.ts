import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["raw.githubusercontent.com"], // Add this line to allow external images from GitHub
  },
  async rewrites() {
    return [
      {
        source: "/api/cosmos-upgrades/:path*",
        destination: "https://cosmos-upgrades.bryanlabs.net/:path*",
      },
    ];
  },
};

export default nextConfig;
