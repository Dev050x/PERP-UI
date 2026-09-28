import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let devices on the local network (e.g. a phone at http://192.168.1.96:3000) load dev assets and HMR
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
