import { ReactNode } from "react";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexAuthClientProvider } from "./convex-auth-client";

export function AppConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexAuthClientProvider>{children}</ConvexAuthClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}
