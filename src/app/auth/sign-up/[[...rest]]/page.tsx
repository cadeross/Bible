"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 gap-8">
      <SignUp
        routing="path"
        path="/auth/sign-up"
        signInUrl="/auth/login"
        forceRedirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
      />
      <Link
        href="/"
        className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider hover:text-foreground transition-colors"
      >
        ← back to home
      </Link>
    </div>
  );
}
