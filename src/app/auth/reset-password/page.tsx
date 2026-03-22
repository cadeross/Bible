"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Passwords don't match");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) {
            toast.error("Failed to update password", { description: error.message });
        } else {
            setDone(true);
            setTimeout(() => router.push("/"), 2500);
        }
    };

    return (
        <motion.div
            className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <div className="w-full max-w-[360px] mx-auto font-mono space-y-10">
                <div className="space-y-2 text-center">
                    <h1 className="text-[10px] font-mono uppercase tracking-[0.5em] text-muted-foreground/60">
                        openwrit
                    </h1>
                    <p className="text-xl font-bold tracking-tight text-foreground">
                        {done ? "password updated" : "set new password"}
                    </p>
                </div>

                {done ? (
                    <div className="text-center space-y-4">
                        <CheckCircle className="h-8 w-8 text-primary/70 mx-auto" />
                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                            Your password has been updated. Redirecting you home...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <Label htmlFor="new-password" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">
                                new password
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-6 pr-0 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="confirm-password" className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">
                                confirm password
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full pl-6 pr-0 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground/40 pt-1">minimum 6 characters</p>
                        </div>
                        <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs font-mono uppercase tracking-[0.2em] h-11 rounded-[2px] transition-all duration-200 cursor-pointer"
                            type="submit"
                            disabled={loading || !password || !confirm}
                        >
                            {loading ? "updating..." : "update password"} <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </form>
                )}

                <div className="text-center">
                    <Link
                        href="/auth/login"
                        className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                        ← back to login
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
