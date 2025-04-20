import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
