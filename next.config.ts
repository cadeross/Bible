import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Account system temporarily disabled. Account-only routes redirect to /read.
  // Files are kept on disk so this can be reverted by removing this block.
  async redirects() {
    return [
      { source: "/auth/:path*",     destination: "/read", permanent: false },
      { source: "/profile",          destination: "/read", permanent: false },
      { source: "/profile/:path*",   destination: "/read", permanent: false },
      { source: "/groups",           destination: "/read", permanent: false },
      { source: "/groups/:path*",    destination: "/read", permanent: false },
      { source: "/onboarding",       destination: "/read", permanent: false },
    ];
  },
};

export default nextConfig;
