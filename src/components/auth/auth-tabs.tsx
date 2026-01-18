"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function AuthTabs({ onSuccess, showHomeLink = false }: { onSuccess?: () => void, showHomeLink?: boolean }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // New Signup State
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [receiveUpdates, setReceiveUpdates] = useState(true);
    const [dailyVerseEmails, setDailyVerseEmails] = useState(false);

    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple email check
        if (!email.includes("@")) {
            toast.error("Username login supported soon", { description: "Please use your email address to login for now." });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            toast.error("Login failed", { description: error.message });
        } else {
            toast.success("Welcome back!", { description: "You are now logged in." });
            router.refresh(); // Refresh to update global state
            if (onSuccess) onSuccess();
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    username,
                    first_name: firstName,
                    receive_updates: receiveUpdates,
                    daily_verse_emails: dailyVerseEmails
                }
            },
        });
        setLoading(false);

        if (error) {
            toast.error("Signup failed", { description: error.message });
        } else {
            toast.message("Check your email", { description: "We sent you a confirmation link." });
        }
    };

    return (
        <div className="w-full max-w-[320px] mx-auto font-mono">
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent">
                    <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all"
                    >
                        login
                    </TabsTrigger>
                    <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all"
                    >
                        register
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email" className="text-xs text-muted-foreground">email</Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password" >password</Label>
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                        </div>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={loading}>
                            {loading ? "logging in..." : "login"}
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-xs text-muted-foreground">username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs text-muted-foreground">email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs text-muted-foreground">password</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                placeholder="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            />
                        </div>

                        {/* Consolidated Updates & Verse Checkbox */}
                        <div className="flex items-start space-x-3 pt-2">
                            <Checkbox
                                id="updates"
                                checked={receiveUpdates}
                                onCheckedChange={(checked) => {
                                    const isChecked = checked as boolean;
                                    setReceiveUpdates(isChecked);
                                    setDailyVerseEmails(isChecked);
                                }}
                                className="mt-1"
                            />
                            <label
                                htmlFor="updates"
                                className="text-xs leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                send me a daily verse, wisdom, and development updates
                            </label>
                        </div>

                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={loading}>
                            {loading ? "creating account..." : "sign up"}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );
}
