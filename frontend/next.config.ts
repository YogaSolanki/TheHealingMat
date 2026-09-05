import type { NextConfig } from "next";

const backendOrigin =
  process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Keep the Next.js "N" badge off the mobile menu close button
  devIndicators: {
    position: "bottom-left",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
