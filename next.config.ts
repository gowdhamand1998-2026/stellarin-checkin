import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project so Turbopack generates
    // correct relative symlinks under .next/dev/node_modules.
    // Without this it can auto-detect a parent dir as the root and
    // produce broken symlinks (e.g. @swc/helpers "Cannot find module").
    root: path.join(__dirname),
  },
};

export default nextConfig;
