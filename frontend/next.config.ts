import type { NextConfig } from "next";

const backendOrigin =
  process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Keep the Next.js "N" badge off the mobile menu close button
  devIndicators: {
    position: "bottom-left",
  },
  images: {
    qualities: [70, 75, 92],
  },
  async redirects() {
    return [
      {
        source: "/dashboard/resources",
        destination: "/guides",
        permanent: false,
      },
    ];
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
