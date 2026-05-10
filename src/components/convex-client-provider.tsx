import { ReactNode } from "react";
import { ConvexAuthClientProvider } from "./convex-auth-client";

// Account system temporarily disabled — the previous wrapping
// `ConvexAuthNextjsServerProvider` validated `NEXT_PUBLIC_CONVEX_URL` at
// init and broke deploys missing the env var. Pass-through until auth is
// brought back online.
export function AppConvexProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthClientProvider>{children}</ConvexAuthClientProvider>;
}
