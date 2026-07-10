import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${backendOrigin}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
