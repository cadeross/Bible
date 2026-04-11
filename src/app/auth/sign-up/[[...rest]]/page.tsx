"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 gap-8">
      <div className="glass border rounded-2xl overflow-hidden w-full max-w-[400px]">
        <p className="pt-5 text-center text-[13px] font-medium tracking-wide text-muted-foreground/60">
          Create your account
        </p>
        <SignUp
          routing="path"
          path="/auth/sign-up"
          signInUrl="/auth/login"
          forceRedirectUrl="/onboarding"
          fallbackRedirectUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: { boxShadow: "none", border: "none", background: "transparent", width: "100%" },
              cardBox: { boxShadow: "none", width: "100%" },
              footer: { background: "transparent" },
            },
          }}
        />
      </div>
      <Link
        href="/"
        className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider hover:text-foreground transition-colors"
      >
        ← back to home
      </Link>
    </div>
  );
}
