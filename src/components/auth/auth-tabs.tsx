"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthTabs({ onSuccess, showHomeLink = false }: { onSuccess?: () => void, showHomeLink?: boolean }) {
    const [loading, setLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // Credentials State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const supabase = createClient();

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
        });
        setLoading(false);
        if (error) {
            toast.error("Failed to send reset link", { description: error.message });
        } else {
            setResetSent(true);
        }
    };

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1. Try Login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!signInError && signInData.session) {
            // Success: Logged in

            // CHECK METADATA: Did they finish onboarding?
            const meta = signInData.session.user.user_metadata;
            if (meta && meta.is_onboarded === false) {
                // They exist, but haven't finished setup. Force them there.
                toast.success("Welcome back!", { description: "Please finish your setup." });
                router.refresh();
                router.push('/onboarding');
            } else {
                // Done.
                toast.success("Welcome back!", { description: "You are now logged in." });
                router.refresh();
                if (onSuccess) onSuccess();
            }

            setLoading(false);
            return;
        }

        // If sign-in failed with a clear auth error, don't fall through to sign-up
        if (signInError) {
            const msg = signInError.message.toLowerCase();
            if (msg.includes("email not confirmed")) {
                toast.error("Email not confirmed", {
                    description: "Please check your inbox and confirm your email before signing in.",
                });
                setLoading(false);
                return;
            }
            if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
                // Could be wrong password OR account doesn't exist — fall through to sign-up attempt
            } else {
                // Any other auth error — surface it directly
                toast.error("Sign in failed", { description: signInError.message });
                setLoading(false);
                return;
            }
        }

        // 2. If Login failed, Try SignUp (user may be new)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: email.split('@')[0],
                    first_name: "",
                    is_onboarded: false, // Mark as pending
                }
            }
        });

        if (signUpError) {
            if (signUpError.message.includes("already registered") || signUpError.message.includes("User already exists")) {
                toast.error("Incorrect password", { description: "This account exists. Please try again." });
            } else {
                toast.error("Authentication failed", { description: signUpError.message });
            }
            setLoading(false);
        } else if (!signUpData.user) {
            // Supabase returns null user (no error) when email is already pending confirmation
            toast.message("Check your email", { description: "A confirmation link was already sent to this address. Please check your inbox or spam folder." });
            setLoading(false);
        } else {
            // Success: New User Created!
            // Try to proceed to onboarding
            if (signUpData.session) {
                toast.success("Account created", { description: "Let's set up your profile." });
                router.refresh();
                router.push('/onboarding');
            } else {
                // Fallback for missing session
                const { data: loginData } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (loginData.session) {
                    toast.success("Account created", { description: "Let's set up your profile." });
                    router.refresh();
                    router.push('/onboarding');
                } else {
                    toast.message("Check your email", { description: "We sent you a confirmation link." });
                }
            }
            setLoading(false);
        }
    };

    if (forgotPassword) {
        return (
            <div className="w-full max-w-[360px] mx-auto font-mono">
                {resetSent ? (
                    <div className="space-y-6 text-center">
                        <div className="space-y-2">
                            <p className="text-sm text-foreground font-mono">check your email</p>
                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                                We sent a password reset link to <span className="text-foreground/80">{email}</span>.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setForgotPassword(false); setResetSent(false); }}
                            className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
                        >
                            <ArrowLeft className="h-3 w-3" /> back to login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em] mb-4">
                                enter your email to receive a reset link
                            </p>
                            <Label htmlFor="reset-email" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">
                                email
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    id="reset-email"
                                    type="email"
                                    placeholder="name@email.com"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-6 pr-0 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs font-mono uppercase tracking-[0.2em] h-11 rounded-[2px] transition-all duration-200 cursor-pointer"
                                type="submit"
                                disabled={loading || !email}
                            >
                                {loading ? "sending..." : "send reset link"} <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForgotPassword(false)}
                            className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <ArrowLeft className="h-3 w-3" /> back to login
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-[360px] mx-auto font-mono">
            <div>
                <form onSubmit={handleContinue} className="space-y-6">
                    <div className="space-y-1">
                        <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">
                            email
                        </Label>
                        <div className="relative group">
                            <Mail className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                            <input
                                id="email"
                                type="email"
                                placeholder="name@email.com"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-6 pr-0 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">
                                password
                            </Label>
                            <button
                                type="button"
                                onClick={() => setForgotPassword(true)}
                                className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                                forgot?
                            </button>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-6 pr-0 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 pt-1">minimum 6 characters</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs font-mono uppercase tracking-[0.2em] h-11 rounded-[2px] transition-all duration-200 cursor-pointer"
                            type="submit"
                            disabled={loading || !email || !password}
                        >
                            {loading ? "checking..." : "continue"} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
