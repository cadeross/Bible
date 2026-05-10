"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const configuredConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
/** Allows layouts to call `useQuery` during build/SSG when env is not set. */
const convexUrl = configuredConvexUrl || "https://placeholder.convex.cloud";

// Account system is temporarily disabled. We use the plain Convex provider
// (not ConvexAuthNextjsProvider) so the app boots even without
// NEXT_PUBLIC_CONVEX_URL — the auth providers throw on missing env. Only
// non-auth queries (e.g. daily content) need the client today; those will
// no-op against the placeholder URL until the env var is configured.

export function ConvexAuthClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);

  useEffect(() => {
    if (!configuredConvexUrl) {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set; using a placeholder. Set it in .env.local for Convex data."
      );
    }
  }, []);

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
