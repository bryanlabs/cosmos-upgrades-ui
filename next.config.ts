import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for optimized Node.js server deployment
  output: 'standalone',
  /* TODO: REMOVE THIS AFTER DEMO */
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/cosmos/chain-registry/master/**", // Allow any path within the chain-registry master branch
      },
    ],
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
