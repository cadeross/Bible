"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, LogOut, Cloud, Activity, Palette } from "lucide-react";
import { toast } from "sonner";
import { getHistory, getAllHighlights, ReadingHistory } from "@/lib/persistence";
import { motion } from "framer-motion";
import Loading from "../loading";

// Helper for section groups (Matches Settings)
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            {title}
        </h2>
        <div className="grid gap-4 pl-4 border-l border-border/40">
            {children}
        </div>
    </div>
)

// Helper: Get Past 365 Days
const getYearDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
    }
    return days;
};

// Helper: Get Past 12 Months
const getYearMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(d.getMonth() - i);
        months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }
    return months;
};

// Helper: Format Seconds to Time String (e.g. 1h 30m)
const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
    const [stats, setStats] = useState({
        words: 0,
        chapters: 0,
        streak: 0,
        highlights: 0,
        timeSeconds: 0
    });
    const [activityMap, setActivityMap] = useState<Record<string, number>>({});

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Data
                const history = await getHistory();
                const highlights = await getAllHighlights();

                // Process History
                let totalWords = 0;
                let totalTime = 0;
                const uniqueChapters = new Set();
                const dailyActivity: Record<string, number> = {};
                const monthlyActivity: Record<string, number> = {}; // Stores seconds

                history.forEach(h => {
                    totalWords += (h.words_read || 0);
                    const duration = h.duration_seconds || 60;
                    totalTime += duration;

                    const key = `${h.book}-${h.chapter}`;
                    uniqueChapters.add(key);

                    // Daily Aggregation (Seconds)
                    const day = h.completed_at.split('T')[0];
                    dailyActivity[day] = (dailyActivity[day] || 0) + duration;

                    // Monthly Aggregation (Seconds)
                    const month = h.completed_at.slice(0, 7);
                    monthlyActivity[month] = (monthlyActivity[month] || 0) + duration;
                });

                // Calculate Streak (Days with ANY activity)
                const dates = Object.keys(dailyActivity).sort().reverse();
                let streak = 0;
                const presence = new Set(dates);
                let cursor = new Date();

                // Allow today to be missing if yesterday exists (streak pending)
                const todayStr = cursor.toISOString().split('T')[0];
                if (!presence.has(todayStr)) {
                    cursor.setDate(cursor.getDate() - 1); // Check yesterday
                    if (!presence.has(cursor.toISOString().split('T')[0])) {
                        streak = 0;
                    } else {
                        // Start counting from yesterday
                    }
                }

                // Count consecutive
                let tempCursor = new Date();
                if (!presence.has(tempCursor.toISOString().split('T')[0])) {
                    tempCursor.setDate(tempCursor.getDate() - 1);
                }
                while (presence.has(tempCursor.toISOString().split('T')[0])) {
                    streak++;
                    tempCursor.setDate(tempCursor.getDate() - 1);
                }

                setStats({
                    words: totalWords,
                    chapters: uniqueChapters.size,
                    streak: streak,
                    highlights: highlights.length,
                    timeSeconds: totalTime
                });

                setActivityMap(viewMode === 'day' ? dailyActivity : monthlyActivity);
            }
            setLoading(false);
        };
        loadData();

        // Auth Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [router, supabase, viewMode]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        toast.success("Signed out successfully");
        router.refresh();
    };

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return (
            <div className="flex min-h-[85vh] items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">

                    {/* Marketing / Info Side */}
                    <div className="space-y-8 text-left order-2 md:order-1">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-mono font-bold tracking-tight text-primary">account</h1>
                            <p className="text-muted-foreground font-mono text-sm max-w-md leading-relaxed">
                                sign in to access cloud features and track your spiritual journey.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { icon: Cloud, label: "cloud sync", desc: "access highlights & wisdom across all devices" },
                                { icon: Activity, label: "reading stats", desc: "track words read, chapters completed, and streaks" },
                                { icon: Palette, label: "customization", desc: "persist themes and reading preferences" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary/20 flex items-center justify-center border border-border/50 group-hover:border-primary/50 transition-colors">
                                        <item.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">{item.label}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-border/40">
                            <div className="flex gap-8 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                <span>v1.0.0</span>
                                <span>secure</span>
                                <span>privacy focused</span>
                            </div>
                        </div>
                    </div>

                    {/* Auth Form Side */}
                    <div className="order-1 md:order-2 bg-secondary/5 border border-border/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <User className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
                        </div>
                        <AuthTabs onSuccess={() => router.refresh()} />
                    </div>

                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-12"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight font-mono text-primary">{user.user_metadata?.username || "user"}</h1>
                        <p className="text-muted-foreground text-xs font-mono">
                            {user.email} • joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" onClick={handleSignOut} className="h-8 text-xs font-mono text-muted-foreground hover:text-primary gap-2 hover:bg-transparent cursor-pointer group transition-colors px-0">
                    <LogOut className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" /> sign out
                </Button>
            </div>

            <div className="grid gap-12">

                {/* STATS */}
                <Section title="Statistics">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "time read", value: formatTime(stats.timeSeconds) },
                            { label: "chapters", value: stats.chapters.toLocaleString() },
                            { label: "words read", value: stats.words.toLocaleString() },
                            { label: "day streak", value: stats.streak }
                        ].map((stat, i) => (
                            <div key={i} className="bg-secondary/10 p-4 rounded-md space-y-2 border border-border/50">
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-mono font-bold text-primary">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ACTIVITY HEATMAP */}
                <Section title="Activity">
                    <div className="flex items-center justify-end space-x-2 text-xs font-mono mb-2">
                        <span className={viewMode === 'day' ? "text-primary font-bold" : "text-muted-foreground cursor-pointer"} onClick={() => setViewMode('day')}>Day</span>
                        <span className="text-muted-foreground">/</span>
                        <span className={viewMode === 'month' ? "text-primary font-bold" : "text-muted-foreground cursor-pointer"} onClick={() => setViewMode('month')}>Month</span>
                    </div>

                    <div className="p-4 bg-secondary/5 rounded-md border border-border/30 overflow-x-auto">
                        <div className="flex gap-1 min-w-max items-end h-[40px]">
                            {(viewMode === 'day' ? getYearDays() : getYearMonths()).map((date, i) => {
                                const seconds = activityMap[date] || 0;
                                let bg = "bg-secondary/20";

                                if (viewMode === 'day') {
                                    // Scale: 1m, 15m, 30m, 60m
                                    if (seconds > 0) bg = "bg-primary/20";
                                    if (seconds > 60 * 15) bg = "bg-primary/40";
                                    if (seconds > 60 * 30) bg = "bg-primary/70";
                                    if (seconds > 60 * 60) bg = "bg-primary";
                                } else {
                                    // Scale: 15m, 1h, 5h, 10h
                                    if (seconds > 0) bg = "bg-primary/20";
                                    if (seconds > 60 * 60) bg = "bg-primary/40";
                                    if (seconds > 60 * 60 * 5) bg = "bg-primary/70";
                                    if (seconds > 60 * 60 * 10) bg = "bg-primary";
                                }

                                const width = viewMode === 'month' ? "w-8" : "w-2 sm:w-3";

                                return (
                                    <div
                                        key={date}
                                        title={`${date}: ${formatTime(seconds)}`}
                                        className={`${width} h-full max-h-[${seconds > 0 ? '100%' : '10px'}] rounded-[1px] ${bg} transition-colors`}
                                        style={{ height: viewMode === 'month' ? '100%' : undefined }} // For months make them bars? Or simply squares. Let's stick to squares for now for consistency, or boxes.
                                    >
                                        {/* For month view maybe show label? */}
                                        {viewMode === 'month' && (
                                            <div className="flex items-end justify-center h-full pb-1">
                                                {/* Optional: Label */}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                            <span>Less</span>
                            <span>More</span>
                        </div>
                    </div>
                </Section>

            </div>
        </motion.div>
    );
}
