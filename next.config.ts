import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH=/journeloom for project-based GitHub Pages.
// Leave it unset for localhost or a custom domain deployed at /.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
