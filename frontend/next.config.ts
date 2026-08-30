import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Next.js "N" badge off the mobile menu close button
  devIndicators: {
    position: "bottom-left",
  },
};

export default nextConfig;
