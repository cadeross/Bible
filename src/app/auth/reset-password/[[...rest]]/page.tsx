"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Step = "request" | "verify";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, flow: "reset" });
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await signIn("password", {
        email,
        code,
        newPassword,
        flow: "reset-verification",
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16 gap-6">
      <div className="glass border border-white/[0.12] dark:border-white/[0.06] rounded-2xl shadow-[var(--shadow-elevated)] w-full max-w-[400px] p-7">
        <p className="text-center text-[13px] font-medium tracking-wide text-muted-foreground/70 mb-5">
          {step === "request" ? "Reset your password" : "Enter your code"}
        </p>

        {step === "request" ? (
          <form onSubmit={requestReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            ) : null}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyReset} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              We sent a code to <span className="text-foreground">{email}</span>.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-medium">Verification code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs font-medium">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            ) : null}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Resetting…" : "Reset password"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setCode("");
                setNewPassword("");
              }}
              className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>

      <Link
        href="/auth/login"
        className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hover:text-foreground"
      >
        ← back to sign in
      </Link>
    </div>
  );
}
