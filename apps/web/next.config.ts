import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bank-agent/contracts"],
};

export default nextConfig;
