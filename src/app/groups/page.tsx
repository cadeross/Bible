"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { fetchPublicGroups, fetchMyGroups, type Group } from "@/lib/groups";
import { GroupCard } from "@/components/groups/group-card";
import { useAuth } from "@/lib/auth";
import { SPRING_FAST } from "@/lib/animation";

export default function GroupsPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const [publicGroups, setPublicGroups] = useState<Group[]>([]);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        const load = async () => {
            const [pub, mine] = await Promise.all([
                fetchPublicGroups(),
                isSignedIn ? fetchMyGroups() : Promise.resolve([]),
            ]);
            setPublicGroups(pub);
            setMyGroups(mine);
            setLoading(false);
        };
        void load();
    }, [isLoaded, isSignedIn]);

    const filtered = publicGroups.filter((g) =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        (g.description ?? "").toLowerCase().includes(query.toLowerCase())
    );

    // Exclude already-joined groups from discovery
    const myGroupIds = new Set(myGroups.map((g) => g.id));
    const discovery = filtered.filter((g) => !myGroupIds.has(g.id));

    return (
        <div className="min-h-screen pt-20 pb-32 px-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center gap-4 opacity-70 hover:opacity-100 transition-opacity mb-12">
                <div className="space-y-1">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        GROUPS
                    </h1>
                    <p className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">
                        your communities
                    </p>
                </div>
                {isSignedIn && (
                    <Link
                        href="/groups/new"
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-border/40 rounded text-xs font-mono text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        new group
                    </Link>
                )}
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search groups…"
                    className="w-full pl-9 pr-3 py-2 bg-transparent border border-border/40 rounded text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
                />
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 border border-border/20 rounded animate-pulse bg-muted/20" />
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* My Groups */}
                    {myGroups.length > 0 && (
                        <section>
                            <h2 className="text-xs font-mono text-muted-foreground mb-3">my groups</h2>
                            <div className="space-y-2">
                                {myGroups.map((group, i) => (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ ...SPRING_FAST, delay: i * 0.06 }}
                                    >
                                        <GroupCard group={group} />
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Discovery */}
                    <section>
                        <h2 className="text-xs font-mono text-muted-foreground mb-3">
                            {query ? "results" : "discover"}
                        </h2>
                        {discovery.length > 0 ? (
                            <div className="space-y-2">
                                {discovery.map((group, i) => (
                                    <motion.div
                                        key={group.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ ...SPRING_FAST, delay: i * 0.06 }}
                                    >
                                        <GroupCard group={group} />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground font-mono">
                                {query ? "no groups found" : "no public groups yet"}
                            </p>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
