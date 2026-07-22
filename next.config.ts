import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to accept requests (and Server Actions) coming from the
  // phone over the local Wi-Fi, not just localhost. Without this, Next.js 16
  // blocks cross-origin dev requests, so on the phone the login button does
  // nothing while it works fine on the laptop.
  // ⚠️ Update this to your laptop's current LAN IP if it changes (ipconfig).
  allowedDevOrigins: ["192.168.1.2"],
};

export default nextConfig;
