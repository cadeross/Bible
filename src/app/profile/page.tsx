"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, LogOut, Cloud, Activity, Palette, Camera, PenLine } from "lucide-react";
import { toast } from "sonner";
import { getHistory, getAllHighlights, ReadingHistory, getProfile, uploadAvatar } from "@/lib/persistence";
import { motion } from "framer-motion";
import Loading from "../loading";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent
} from "@/components/ui/chart";
import { CustomHeatmap } from "@/components/ui/custom-heatmap";

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



// Helper: Format Seconds to Time String (e.g. 1h 30m)
const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
}

// Chart Configs
const activityConfig = {
    minutes: {
        label: "Minutes Read",
        color: "var(--primary)",
    },
};

const bookConfig = {
    minutes: {
        label: "Minutes",
    },
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        words: 0,
        chapters: 0,
        streak: 0,
        highestStreak: 0,
        highlights: 0,
        timeSeconds: 0,
        weekTimeSeconds: 0,
        weekWords: 0,
        weekChapters: 0
    });

    // Heatmap State
    const [activityMap, setActivityMap] = useState<Record<string, number>>({});

    // Chart Data States
    const [activityData, setActivityData] = useState<any[]>([]);
    const [bookData, setBookData] = useState<any[]>([]);

    // Previous Period Stats (for comparisons)
    const [prevStats, setPrevStats] = useState({
        words: 0,
        chapters: 0,
        timeSeconds: 0
    });

    // Profile photo state
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);


    const router = useRouter();
    const supabase = createClient();

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            const updates: any = {};

            // Only update email if it changed
            if (editEmail !== user.email) {
                updates.email = editEmail;
            }

            // Only update username if it changed
            if (editUsername !== user.user_metadata?.username) {
                updates.data = { username: editUsername };
            }

            if (Object.keys(updates).length > 0) {
                const { data, error } = await supabase.auth.updateUser(updates);

                if (error) throw error;

                // Update local user state
                setUser(data.user);

                if (updates.email) {
                    toast.success("Profile updated", {
                        description: "Please check your new email address for a confirmation link."
                    });
                } else {
                    toast.success("Profile updated successfully");
                }
            }
            setIsEditing(false);
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Data
                const history = await getHistory();
                const highlights = await getAllHighlights();
                const profile = await getProfile();

                // Load avatar from profile
                if (profile?.avatar_url) {
                    setProfilePhoto(profile.avatar_url);
                }

                // Process History
                let totalWords = 0;
                let totalTime = 0;
                const uniqueChapters = new Set();
                const dailyActivity: Record<string, number> = {};
                const monthlyActivity: Record<string, number> = {};
                const bookStats: Record<string, number> = {};

                history.forEach((h: any) => {
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

                    // Book Aggregation
                    bookStats[h.book] = (bookStats[h.book] || 0) + duration;
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

                // Calculate highest streak ever
                let highestStreak = streak;
                let currentStreakCount = 0;
                const sortedDates = Object.keys(dailyActivity).sort();
                for (let i = 0; i < sortedDates.length; i++) {
                    if (i === 0) {
                        currentStreakCount = 1;
                    } else {
                        const prevDate = new Date(sortedDates[i - 1]);
                        const currDate = new Date(sortedDates[i]);
                        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays === 1) {
                            currentStreakCount++;
                        } else {
                            currentStreakCount = 1;
                        }
                    }
                    highestStreak = Math.max(highestStreak, currentStreakCount);
                }

                // Calculate Previous Period Stats (Last 7 days vs Previous 7 days)
                const now = new Date();
                let last7Words = 0, prev7Words = 0;
                let last7Chapters = new Set(), prev7Chapters = new Set();
                let last7Time = 0, prev7Time = 0;

                history.forEach((h: any) => {
                    const completedAt = new Date(h.completed_at);
                    const daysDiff = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
                    const chapterKey = `${h.book}-${h.chapter}`;
                    const duration = h.duration_seconds || 60;

                    if (daysDiff < 7) {
                        last7Words += h.words_read || 0;
                        last7Chapters.add(chapterKey);
                        last7Time += duration;
                    } else if (daysDiff < 14) {
                        prev7Words += h.words_read || 0;
                        prev7Chapters.add(chapterKey);
                        prev7Time += duration;
                    }
                });

                setStats({
                    words: totalWords,
                    chapters: uniqueChapters.size,
                    streak: streak,
                    highestStreak: highestStreak,
                    highlights: highlights.length,
                    timeSeconds: totalTime,
                    weekTimeSeconds: last7Time,
                    weekWords: last7Words,
                    weekChapters: last7Chapters.size
                });

                setPrevStats({
                    words: prev7Words,
                    chapters: prev7Chapters.size,
                    timeSeconds: prev7Time
                });

                // Set Activity Map for Heatmap
                setActivityMap(dailyActivity);

                // Process Last 30 Days for Bar Chart
                const last30Days = [];
                const today = new Date();
                // Calculate max minutes to determine placeholder height
                let maxMinutes = 0;
                for (let i = 29; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const mins = Math.round((dailyActivity[dateStr] || 0) / 60);
                    if (mins > maxMinutes) maxMinutes = mins;
                }
                // Placeholder is max minutes or a default of 30 for empty charts
                const placeholderHeight = Math.max(maxMinutes, 30);

                for (let i = 29; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    last30Days.push({
                        date: dateStr,
                        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        minutes: Math.round((dailyActivity[dateStr] || 0) / 60),
                        placeholder: placeholderHeight
                    });
                }
                setActivityData(last30Days);

                // Process Book Distribution - show ALL books read
                const sortedBooks = Object.entries(bookStats)
                    .sort(([, a], [, b]) => b - a)
                    .map(([book, seconds]) => ({
                        book,
                        minutes: Math.round(seconds / 60)
                    }));
                setBookData(sortedBooks.slice(0, 10)); // Show top 10 books
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
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        toast.success("Signed out successfully");
        router.refresh();
    };

    if (loading) {
        return <Loading />
    }

    if (!user) {
        router.push("/auth/login");
        return <Loading />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-12"
        >
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4 opacity-70 hover:opacity-100 transition-opacity mb-12">
                <div className="flex flex-col items-center gap-4">
                    {/* Profile Photo with Upload */}
                    <div
                        className="relative h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary cursor-pointer group overflow-hidden"
                        onMouseEnter={() => setIsHoveringAvatar(true)}
                        onMouseLeave={() => setIsHoveringAvatar(false)}
                        onClick={() => document.getElementById('profile-photo-input')?.click()}
                    >
                        {profilePhoto ? (
                            <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-6 w-6" />
                        )}
                        {/* Hover overlay */}
                        <div className={`absolute inset-0 bg-background/80 flex items-center justify-center transition-opacity duration-200 ${isHoveringAvatar ? 'opacity-100' : 'opacity-0'}`}>
                            <Camera className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            id="profile-photo-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Check file size (3MB limit)
                                    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
                                    if (file.size > maxSize) {
                                        toast.error('Image must be under 3MB');
                                        return;
                                    }

                                    // Show preview immediately
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                        setProfilePhoto(e.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);

                                    // Upload to storage
                                    const url = await uploadAvatar(file);
                                    if (url) {
                                        setProfilePhoto(url);
                                        toast.success('Profile photo saved');
                                    } else {
                                        toast.error('Failed to save photo');
                                    }
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        {isEditing ? (
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}
                                className="flex flex-col gap-2 items-center"
                            >
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    placeholder="Username"
                                    className="bg-transparent border border-border/30 rounded-[2px] px-2 py-1 text-sm font-bold tracking-widest uppercase text-muted-foreground text-center focus:outline-none focus:border-primary/50"
                                    disabled={isSaving}
                                />
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="Email"
                                    className="bg-transparent border border-border/30 rounded-[2px] px-2 py-1 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider text-center focus:outline-none focus:border-primary/50"
                                    disabled={isSaving}
                                />
                                <div className="flex gap-2 mt-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                        className="h-6 text-[10px] uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground px-2"
                                    >
                                        CANCEL
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="h-6 text-[10px] uppercase tracking-widest font-mono bg-primary text-primary-foreground hover:bg-primary/90 px-3 rounded-[2px]"
                                    >
                                        {isSaving ? "SAVING..." : "SAVE"}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center gap-1 group/edit">
                                <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                                    {user.user_metadata?.username || "USER"}
                                </h1>
                                <p className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">
                                    {user.email} • joined {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-2 text-center flex justify-center gap-2">
                    {!isEditing && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setEditUsername(user.user_metadata?.username || "");
                                setEditEmail(user.email || "");
                                setIsEditing(true);
                            }}
                            className="h-8 text-xs uppercase tracking-widest font-mono text-muted-foreground hover:text-primary gap-2 hover:bg-transparent cursor-pointer group transition-colors px-4 rounded-[2px] border border-border/30 bg-secondary/5 hover:border-foreground/20"
                        >
                            <PenLine className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" /> EDIT PROFILE
                        </Button>
                    )}
                    <Button variant="ghost" onClick={handleSignOut} className="h-8 text-[10px] uppercase tracking-widest font-mono text-muted-foreground hover:text-primary gap-2 hover:bg-transparent cursor-pointer group transition-colors px-4 rounded-[2px] border border-border/30 bg-secondary/5 hover:border-foreground/20">
                        <LogOut className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" /> SIGN OUT
                    </Button>
                </div>
            </div>

            <div className="grid gap-12">

                {/* STATS */}
                <Section title="Statistics">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(() => {
                            // Helper: Calculate change percentage
                            const calcChange = (current: number, previous: number) => {
                                if (previous === 0) return current > 0 ? 100 : 0;
                                return Math.round(((current - previous) / previous) * 100);
                            };

                            const kpis = [
                                {
                                    label: "time",
                                    value: formatTime(stats.weekTimeSeconds),
                                    change: calcChange(stats.weekTimeSeconds, prevStats.timeSeconds)
                                },
                                {
                                    label: "chapters",
                                    value: stats.weekChapters.toLocaleString(),
                                    change: calcChange(stats.weekChapters, prevStats.chapters)
                                },
                                {
                                    label: "words read",
                                    value: stats.weekWords > 1000 ? `${(stats.weekWords / 1000).toFixed(1)}K` : stats.weekWords.toLocaleString(),
                                    change: calcChange(stats.weekWords, prevStats.words)
                                },
                                {
                                    label: "streak",
                                    value: stats.streak,
                                    change: null, // No comparison for streak
                                    isStreak: true
                                }
                            ];

                            return kpis.map((stat: any, i) => (
                                <div key={i} className="bg-secondary/10 p-4 rounded-[2px] space-y-2 border border-border/50">
                                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-mono font-bold text-primary">
                                        {stat.isStreak ? `${stat.value}` : stat.value}
                                        {stat.isStreak && <span className="text-sm font-normal text-muted-foreground ml-1">days</span>}
                                    </p>
                                    {stat.change !== null && (
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[10px] font-mono font-medium ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 font-mono">vs prev week</span>
                                        </div>
                                    )}
                                    {stat.isStreak && (
                                        <p className="text-xs text-muted-foreground/70 font-mono">
                                            {stats.streak === stats.highestStreak && stats.streak > 0
                                                ? '✨ personal best!'
                                                : `best: ${stats.highestStreak} days`}
                                        </p>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </Section>

                <div className="grid md:grid-cols-[1fr,auto,1fr] gap-0 md:gap-8">
                    {/* ACTIVITY CHART */}
                    <Section title="Activity (Last 30 Days)">
                        <ChartContainer config={activityConfig} className="min-h-[200px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground">
                            <BarChart accessibilityLayer data={activityData}>
                                <XAxis
                                    dataKey="displayDate"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value}
                                    minTickGap={30}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                                <Bar dataKey="minutes" fill="var(--primary)" radius={[1, 1, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </Section>

                    {/* Vertical Separator */}
                    <div className="hidden md:block w-px bg-border/40 self-stretch mx-4" />

                    {/* DISTRIBUTION CHART - Horizontal Bar */}
                    <Section title="Book Distribution">
                        <ChartContainer config={bookConfig} className="min-h-[200px] w-full">
                            <BarChart
                                data={bookData}
                                layout="vertical"
                                margin={{ left: 0, right: 16 }}
                            >
                                <XAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
                                    tickFormatter={(value) => `${value}m`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="book"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'var(--foreground)', fontSize: 10, fontFamily: 'monospace' }}
                                    width={70}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                />
                                <Bar
                                    dataKey="minutes"
                                    fill="var(--primary)"
                                    radius={[0, 1, 1, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </Section>
                </div>

                {/* YEARLY HEATMAP - Custom */}
                <Section title="Yearly Activity">
                    <div className="p-4 bg-secondary/5 rounded-[2px] border border-border/30 overflow-hidden">
                        <CustomHeatmap data={activityMap} />
                    </div>
                </Section>

            </div>
        </motion.div>
    );
}
