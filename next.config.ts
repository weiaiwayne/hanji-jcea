import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  poweredByHeader: false,
  // next/image is unused; disabling the optimizer removes its attack surface
  images: { unoptimized: true },
  // Legacy jceasia.org URLs, so old links keep working after the domain moves
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/cfp2025", destination: "/call-for-papers", permanent: true },
      { source: "/conference-2025", destination: "/conference", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/**": ["./src/lib/schema.sql", "./scripts/py/**"],
  },
};

export default nextConfig;
