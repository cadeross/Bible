"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { User, LogOut, BookOpen, PenTool } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            router.refresh(); // Update middleware/server components state if needed
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        toast.success("Signed out successfully");
        router.refresh();
    };

    const handleVerseEmailToggle = async (checked: boolean) => {
        // Optimistic update
        const updatedUser = { ...user, user_metadata: { ...user.user_metadata, daily_verse_emails: checked } };
        setUser(updatedUser);

        const { error } = await supabase.auth.updateUser({
            data: { daily_verse_emails: checked }
        });

        if (error) {
            toast.error("Failed to update preference");
            // Revert
            setUser(user);
        } else {
            toast.success(checked ? "Subscribed to daily verses" : "Unsubscribed from daily verses");
            router.refresh();
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    // Unauthenticated View: Show Auth Tabs
    if (!user) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
                <div className="mb-8 text-center space-y-2">
                    <h1 className="text-3xl font-mono font-bold tracking-tight text-primary">account</h1>
                    <p className="text-muted-foreground">Sign in to sync your progress.</p>
                </div>
                <AuthTabs onSuccess={() => router.refresh()} />
            </div>
        );
    }

    // Authenticated View: Show Profile
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-mono font-bold tracking-tight text-primary">profile</h1>
                    <p className="text-muted-foreground font-mono text-sm">{user.email}</p>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Words Read</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">0</div>
                        <p className="text-xs text-muted-foreground">+0% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highlights</CardTitle>
                        <PenTool className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">0</div>
                        <p className="text-xs text-muted-foreground">Saved verses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Days Active</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">1</div>
                        <p className="text-xs text-muted-foreground">Current streak</p>
                    </CardContent>
                </Card>
            </div>

            {/* Account Settings / Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-medium">Email Notifications</h3>
                            <p className="text-xs text-muted-foreground">Receive daily verse emails.</p>
                        </div>
                        <Switch
                            checked={user?.user_metadata?.daily_verse_emails ?? false}
                            onCheckedChange={handleVerseEmailToggle}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
