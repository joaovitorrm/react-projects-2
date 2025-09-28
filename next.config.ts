import type { NextConfig } from "next";

const repoName = "react-projects-2";

const nextConfig: NextConfig = {
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  /* config options here */
};

export default nextConfig;
