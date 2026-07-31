import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "qrcode"],
  poweredByHeader: false,
};

export default nextConfig;
