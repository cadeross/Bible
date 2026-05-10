"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BookOpen, Globe, Heart, Calendar, Highlighter, Sun } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const features = [
  { icon: Calendar, label: "daily readings" },
  { icon: Globe, label: "multiple translations" },
  { icon: Heart, label: "reading streaks" },
  { icon: Highlighter, label: "highlights & notes" },
  { icon: Sun, label: "light & dark" },
  { icon: BookOpen, label: "distraction-free reading" },
];

export default function AuthPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="text-center mb-12 space-y-5">
        <div className="space-y-3">
          <p className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Scripture, thoughtfully presented.
          </p>
        </div>
        <p className="text-[15px] text-muted-foreground max-w-[420px] mx-auto leading-relaxed">
          A modern, beautiful Bible reading experience — designed for focus, built
          for daily devotion.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-14">
        <div className="flex flex-wrap justify-center items-center gap-2.5 max-w-lg mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="group flex items-center gap-2 px-4 py-2 rounded-full border border-border/25 bg-card shadow-[var(--shadow-sm)] transition-all duration-200 cursor-default hover:shadow-[var(--shadow-card)] hover:border-border/40"
              >
                <Icon className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full flex justify-center">
        <div className="glass border border-white/[0.12] dark:border-white/[0.06] rounded-2xl shadow-[var(--shadow-elevated)] w-full max-w-[400px] p-7">
          <p className="text-center text-[13px] font-medium tracking-wide text-muted-foreground/70 mb-5">
            Welcome back
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Link
                  href="/auth/reset-password"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-10">
        <Link
          href="/"
          className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors duration-200"
        >
          ← Back to home
        </Link>
      </motion.div>
    </motion.div>
  );
}
