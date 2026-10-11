import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
// Project pages live at https://<user>.github.io/personal-site/
const basePath = isProd ? "/personal-site" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
