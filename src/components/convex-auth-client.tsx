"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const configuredConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
/** Allows layouts to call `useQuery` during build/SSG when env is not set. */
const convexUrl = configuredConvexUrl || "https://placeholder.convex.cloud";

// Account system is temporarily disabled. The Convex provider stays mounted so
// non-auth queries (e.g. daily content) continue to work, but the auth-token
// sync and ensureProfile bridges are intentionally pass-through. Persistence
// stays on localStorage because `persistenceCloud.ready` is locked to false.

export function ConvexAuthClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);

  useEffect(() => {
    if (!configuredConvexUrl) {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set; using a placeholder. Set it in .env.local for Convex data."
      );
    }
  }, []);

  return (
    <ConvexAuthNextjsProvider client={client}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
