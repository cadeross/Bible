"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    ChevronUp,
    Plus,
    Sparkles,
    Rocket,
    Send,
    X,
    CheckCircle2,
    Clock,
    Code2,
    Filter,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Feature {
    id: number;
    user_id: string;
    title: string;
    description: string | null;
    status: string;
    category: string;
    created_at: string;
    vote_count: number;
    voter_ids: string[] | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: "Pending", icon: Clock, color: "text-muted-foreground" },
    planned: { label: "Planned", icon: Star, color: "text-yellow-500" },
    "in-progress": { label: "Building", icon: Code2, color: "text-blue-500" },
    completed: { label: "Done", icon: CheckCircle2, color: "text-green-500" },
};

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string }> = {
    general: { label: "General", emoji: "✨" },
    reading: { label: "Reading", emoji: "📖" },
    highlights: { label: "Highlights", emoji: "🖍️" },
    ui: { label: "Interface", emoji: "🎨" },
    sync: { label: "Sync", emoji: "☁️" },
    other: { label: "Other", emoji: "💡" },
};

// Section helper (matches Settings/Profile styling)
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            {title}
        </h2>
        <div className="pl-4 border-l border-border/40 space-y-4">
            {children}
        </div>
    </div>
)

export default function FeaturesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newCategory, setNewCategory] = useState("general");
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState<string>("all");
    const [votingIds, setVotingIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const supabase = createClient();

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        const fetchFeatures = async () => {
            const { data, error } = await supabase
                .from("features_with_votes")
                .select("*")
                .order("vote_count", { ascending: false });

            if (error) {
                console.error("Error fetching features:", error);
                // Don't toast on initial load - table may not exist yet
            } else {
                setFeatures(data || []);
            }
            setLoading(false);
        };

        checkUser();
        fetchFeatures();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleVote = async (featureId: number, hasVoted: boolean) => {
        if (!user) {
            toast.error("Sign in to vote", { description: "Create an account to vote on features" });
            return;
        }

        setVotingIds(prev => new Set([...prev, featureId]));
        const supabase = createClient();

        try {
            if (hasVoted) {
                await supabase.from("feature_votes").delete().eq("feature_id", featureId).eq("user_id", user.id);
            } else {
                await supabase.from("feature_votes").insert({ feature_id: featureId, user_id: user.id });
            }

            const { data } = await supabase.from("features_with_votes").select("*").order("vote_count", { ascending: false });
            setFeatures(data || []);
        } catch (error) {
            console.error("Vote error:", error);
            toast.error("Couldn't save vote");
        } finally {
            setVotingIds(prev => {
                const next = new Set(prev);
                next.delete(featureId);
                return next;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Sign in to submit ideas");
            return;
        }
        if (!newTitle.trim()) return;

        setSubmitting(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.from("features").insert({
                user_id: user.id,
                title: newTitle.trim(),
                description: newDescription.trim() || null,
                category: newCategory,
            });

            if (error) throw error;

            toast.success("Idea submitted! 🎉", { description: "Thanks for helping make the app better" });
            setNewTitle("");
            setNewDescription("");
            setNewCategory("general");
            setShowForm(false);

            const { data } = await supabase.from("features_with_votes").select("*").order("vote_count", { ascending: false });
            setFeatures(data || []);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Couldn't submit idea");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredFeatures = filter === "all" ? features : features.filter(f => f.status === filter);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-12"
        >
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/50 pb-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Lightbulb className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight font-mono text-primary">features</h1>
                    <p className="text-muted-foreground text-xs font-mono">
                        vote on ideas or submit your own
                    </p>
                </div>
            </div>

            <div className="grid gap-12">
                {/* Submit Section */}
                <Section title="Submit an Idea">
                    <AnimatePresence mode="wait">
                        {showForm ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleSubmit}
                                className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-mono text-sm font-medium flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        new idea
                                    </h3>
                                    <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <Input
                                    placeholder="What feature would you love?"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="bg-transparent border-border/50"
                                    required
                                />

                                <Textarea
                                    placeholder="Tell us more (optional)..."
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    rows={3}
                                    className="bg-transparent border-border/50 resize-none"
                                />

                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CATEGORY_CONFIG).map(([key, { label, emoji }]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setNewCategory(key)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-mono transition-all",
                                                newCategory === key
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                                            )}
                                        >
                                            {emoji} {label}
                                        </button>
                                    ))}
                                </div>

                                <Button type="submit" disabled={submitting || !newTitle.trim()} className="w-full gap-2">
                                    {submitting ? "Submitting..." : "Submit Idea"}
                                    <Send className="w-4 h-4" />
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {user ? (
                                    <Button onClick={() => setShowForm(true)} variant="outline" className="w-full gap-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5">
                                        <Plus className="w-4 h-4" />
                                        Submit an idea
                                    </Button>
                                ) : (
                                    <div className="text-center py-4 px-6 bg-secondary/10 rounded-lg border border-border/50">
                                        <p className="text-sm text-muted-foreground font-mono">
                                            <Link href="/profile" className="text-primary hover:underline">Sign in</Link> to submit and vote on ideas
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Section>

                {/* Feature Requests */}
                <Section title="Feature Requests">
                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                        {["all", "pending", "planned", "in-progress", "completed"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-all",
                                    filter === status ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                                )}
                            >
                                {status === "all" ? "All" : STATUS_CONFIG[status]?.label || status}
                            </button>
                        ))}
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 bg-secondary/10 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : filteredFeatures.length === 0 ? (
                            <div className="text-center py-12">
                                <Rocket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-mono text-sm">
                                    {filter === "all" ? "No ideas yet. Be the first!" : `No ${filter} features`}
                                </p>
                            </div>
                        ) : (
                            filteredFeatures.map((feature) => {
                                const hasVoted = user && feature.voter_ids?.includes(user.id);
                                const StatusIcon = STATUS_CONFIG[feature.status]?.icon || Clock;
                                const statusColor = STATUS_CONFIG[feature.status]?.color || "text-muted-foreground";
                                const category = CATEGORY_CONFIG[feature.category];

                                return (
                                    <div key={feature.id} className="group bg-secondary/10 border border-border/50 rounded-lg p-4 hover:border-border transition-all">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleVote(feature.id, !!hasVoted)}
                                                disabled={votingIds.has(feature.id)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center min-w-[60px] py-2 rounded-lg transition-all",
                                                    hasVoted ? "bg-primary/10 text-primary" : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50",
                                                    votingIds.has(feature.id) && "opacity-50"
                                                )}
                                            >
                                                <ChevronUp className={cn("w-5 h-5 transition-transform", hasVoted && "text-primary")} />
                                                <span className="text-sm font-mono font-medium">{feature.vote_count}</span>
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                                                    <div className={cn("flex items-center gap-1 shrink-0", statusColor)}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span className="text-xs font-mono">{STATUS_CONFIG[feature.status]?.label}</span>
                                                    </div>
                                                </div>
                                                {feature.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs bg-secondary/30 px-2 py-0.5 rounded-full text-muted-foreground">
                                                        {category?.emoji} {category?.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-border/30 text-center">
                <p className="text-[10px] text-muted-foreground font-mono opacity-50">
                    your voice shapes the future of this app ✨
                </p>
            </div>
        </motion.div>
    );
}
