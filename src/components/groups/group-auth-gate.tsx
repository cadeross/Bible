"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface GroupAuthGateProps {
  redirectTo: string;
  children: React.ReactNode;
}

export function GroupAuthGate({ redirectTo, children }: GroupAuthGateProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(
        `/auth/login?redirect_url=${encodeURIComponent(redirectTo)}`
      );
    }
  }, [isLoaded, isSignedIn, redirectTo, router]);

  return <>{children}</>;
}
