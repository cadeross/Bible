"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock } from "lucide-react";

export function AuthTabs({ onSuccess, showHomeLink = false }: { onSuccess?: () => void, showHomeLink?: boolean }) {
    const [loading, setLoading] = useState(false);

    // Credentials State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const supabase = createClient();

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

        // 2. If Login failed, Try SignUp
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
        } else if (signUpData.user) {
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

    return (
        <div className="w-full max-w-[360px] mx-auto font-mono">
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        account
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">continue here</h2>
                    <p className="text-xs text-muted-foreground">we’ll create an account if you’re new</p>
                </div>
                <form onSubmit={handleContinue} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            email
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 bg-secondary/10 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 text-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 bg-secondary/10 border border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 text-sm"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">minimum 6 characters</p>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs font-mono uppercase tracking-wider" type="submit" disabled={loading}>
                        {loading ? "checking..." : "continue"} <ArrowRight className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
