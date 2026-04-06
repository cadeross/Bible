"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

/**
 * Clerk handles password reset via the sign-in flow ("Forgot password").
 * This route remains so old Supabase reset links do not 404.
 */
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 gap-6">
      <p className="text-sm text-muted-foreground text-center max-w-sm font-mono">
        Reset your password using the link below. You will receive an email from
        Clerk if an account exists for your address.
      </p>
      <SignIn routing="path" path="/auth/reset-password" signUpUrl="/auth/sign-up" />
      <Link
        href="/auth/login"
        className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hover:text-foreground"
      >
        ← back to sign in
      </Link>
    </div>
  );
}
