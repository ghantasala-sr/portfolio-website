import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // drei is a large barrel export. Without this, one deep component drags
    // three-mesh-bvh, troika-three-text, hls.js and @mediapipe/tasks-vision
    // into the chunk. Keeps the lazy scene chunk honest.
    optimizePackageImports: ["@react-three/drei"],
  },
};

export default bundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  nextConfig,
);
