import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to accept requests (and Server Actions) coming from the
  // phone over the local Wi-Fi, not just localhost. Without this, Next.js
  // blocks cross-origin dev requests, so on the phone the login button does
  // nothing while it works fine on the laptop.
  allowedDevOrigins: [
    "192.168.1.6",
    "192.168.1.6:3000",
    "192.168.1.4",
    "192.168.1.4:3000",
    "192.168.1.3",
    "192.168.1.3:3000",
    "192.168.1.2",
    "192.168.1.2:3000",
  ],
};

export default nextConfig;
