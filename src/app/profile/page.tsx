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
        <div className="container max-w-4xl mx-auto py-24 px-4 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 font-mono">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/50 pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-primary">{user.user_metadata?.username || "user"}</h1>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                {user.email} <span className="text-border">|</span> joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive gap-2 hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" /> sign out
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">words read</p>
                    <div className="text-4xl font-bold text-primary">0</div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">chapters</p>
                    <div className="text-4xl font-bold text-primary">0</div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">highlights</p>
                    <div className="text-4xl font-bold text-primary">0</div>
                </div>
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">streak</p>
                    <div className="text-4xl font-bold text-primary">1</div>
                </div>
            </div>

            {/* Account Settings / Info */}
            <div className="space-y-8 pt-8">
                <h2 className="text-xl font-bold text-primary">settings</h2>

                <div className="grid gap-4 max-w-xl">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-foreground">Verse of the Day Email</h3>
                            <p className="text-xs text-muted-foreground">Receive a daily verse & wisdom.</p>
                        </div>
                        <Switch
                            checked={user?.user_metadata?.daily_verse_emails ?? false}
                            onCheckedChange={handleVerseEmailToggle}
                        />
                    </div>
                    {/* Placeholder for future specific "Updates" toggle if user wants to separate them again */}
                </div>
            </div>
        </div>
    );
}
