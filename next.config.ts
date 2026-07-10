import type { NextConfig } from "next";

const LOCAL_BACKEND_ORIGIN = "http://localhost:8080";
const PRODUCTION_BACKEND_ORIGIN = "https://server-spring-production.up.railway.app";

function backendOrigin() {
  return (
    process.env.BACKEND_ORIGIN ??
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ??
    (process.env.VERCEL ? PRODUCTION_BACKEND_ORIGIN : LOCAL_BACKEND_ORIGIN)
  );
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${backendOrigin()}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
