import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keystatic's GitHub mode moves the local admin from localhost to
  // 127.0.0.1 (GitHub's OAuth callback is registered for that host); let the
  // dev server serve its hot-reload connection there too.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
