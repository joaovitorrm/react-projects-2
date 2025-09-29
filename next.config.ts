import type { NextConfig } from "next";

const repoName = "react-projects-2";
const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  output: "export",
  /* config options here */
};

export default nextConfig;
