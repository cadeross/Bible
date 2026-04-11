"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { syncConvexHttpAuth, getConvexHttp } from "@/lib/convex/http";
import { persistenceCloud } from "@/lib/persistence-cloud";
import { api } from "../../convex/_generated/api";

const configuredConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
/** Allows layouts to call `useQuery` during build/SSG when env is not set. Point `NEXT_PUBLIC_CONVEX_URL` at your real deployment for data. */
const convexUrl =
  configuredConvexUrl || "https://placeholder.convex.cloud";

function ClerkConvexAuthSync({ children }: { children: ReactNode }) {
  const { getToken, isLoaded: clerkLoaded } = useAuth();

  useEffect(() => {
    if (!clerkLoaded) return;
    void syncConvexHttpAuth(() =>
      getToken({ template: "convex" }).catch(() => null)
    );
  }, [clerkLoaded, getToken]);

  return <>{children}</>;
}

function ConvexPersistenceBridge({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    persistenceCloud.ready = !isLoading && isAuthenticated;
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!configuredConvexUrl || isLoading || !isAuthenticated) return;
    try {
      const client = getConvexHttp();
      void client.mutation(api.profiles.ensureProfile, {}).catch(() => {
        /* ignore */
      });
    } catch {
      /* Convex URL missing */
    }
  }, [isLoading, isAuthenticated]);

  return <>{children}</>;
}

function ConvexClerkTree({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);

  useEffect(() => {
    if (!configuredConvexUrl) {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set; using a placeholder. Set it in .env.local for Convex data and auth."
      );
    }
  }, []);

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      <ClerkConvexAuthSync>
        <ConvexPersistenceBridge>{children}</ConvexPersistenceBridge>
      </ClerkConvexAuthSync>
    </ConvexProviderWithClerk>
  );
}

export function AppConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        layout: { logoPlacement: "none" },
        variables: {
          fontFamily: "var(--font-geist-sans)",
          fontFamilyButtons: "var(--font-geist-sans)",
          spacingUnit: "0.875rem",
          borderRadius: "0.75rem",
        },
        elements: {
          formFieldInput: {
            backgroundColor: "var(--muted)",
            borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
            color: "var(--foreground)",
            fontSize: "0.875rem",
          },
          formButtonPrimary: {
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          },
          socialButtonsBlockButton: {
            borderColor: "color-mix(in srgb, var(--border) 50%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--muted) 60%, transparent)",
            color: "var(--foreground)",
          },
          logoBox: { display: "none" },
          headerTitle: { display: "none" },
          headerSubtitle: { display: "none" },
          footerActionLink: { color: "var(--primary)" },
          formFieldLabel: { color: "var(--foreground)" },
          dividerText: { color: "var(--muted-foreground)" },
          dividerLine: { backgroundColor: "color-mix(in srgb, var(--border) 50%, transparent)" },
        },
      }}
    >
      <ConvexClerkTree>{children}</ConvexClerkTree>
    </ClerkProvider>
  );
}
