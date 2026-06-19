import type { NextConfig } from "next";

// Content-Security-Policy is shipped in Report-Only mode first so it cannot
// break wallet connections, NextAuth/Authentik redirects, next/image, or the
// Swagger UI on /api-docs. Watch the browser console / report endpoint, then
// promote to an enforcing `Content-Security-Policy` header once it is quiet.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // next/image serves optimized images same-origin; data: covers inline SVGs.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // Next inlines a hydration bootstrap; Swagger UI needs inline styles.
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  // Same-origin API proxy, the upgrades API, Authentik, and WalletConnect relays.
  "connect-src 'self' https://cosmos-upgrades.bryanlabs.net https://*.bryanlabs.net https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://*.web3modal.com https://*.web3modal.org",
  "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
  "form-action 'self' https://authentik.media.bryanlabs.net",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
