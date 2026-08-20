import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: generates flat `out/` directory that uploads directly to S3.
  output: "export",
  // Required for static export (no Next.js image optimization server).
  images: { unoptimized: true },
  // Trailing slash so /app/ resolves to /app/index.html in S3.
  trailingSlash: true,
};

export default nextConfig;
