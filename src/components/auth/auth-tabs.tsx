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
        <Tabs defaultValue="login" className="w-full max-w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>
                            Enter your email below to login to your account.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>Sign Up</CardTitle>
                        <CardDescription>
                            Create an account to sync your highlights and notes.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignup}>
                        <CardContent className="space-y-4">
                            {/* First Name */}
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First Name</Label>
                                <Input
                                    id="first-name"
                                    type="text"
                                    placeholder="John"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="johndoe"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {/* Consolidated Updates & Verse Checkbox */}
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="updates"
                                    checked={receiveUpdates}
                                    onCheckedChange={(checked) => {
                                        const isChecked = checked as boolean;
                                        setReceiveUpdates(isChecked);
                                        setDailyVerseEmails(isChecked);
                                    }}
                                />
                                <label
                                    htmlFor="updates"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                                >
                                    Receive a Daily Verse & Wisdom along with updates
                                </label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? "Signing up..." : "Sign Up"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
