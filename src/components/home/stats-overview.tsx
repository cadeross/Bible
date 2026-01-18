"use client";

import { useEffect, useState } from "react";
import { BookOpen, Highlighter, Type } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function StatsOverview() {
    const [stats, setStats] = useState({
        words: 0,
        chapters: 0,
        highlights: 0
    });
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch Highlights count
            const { count: highlightCount } = await supabase
                .from('highlights')
                .select('*', { count: 'exact', head: true });

            // Fetch generic user_stats (if we had them implemented fully, for now we mock based on other data or just use highlight count as valid data point)
            // Ideally we'd have a user_stats table. Let's assume user_stats exists from our migration.
            const { data: userStats } = await supabase
                .from('user_stats')
                .select('*')
                .single();

            setStats({
                words: userStats?.words_read || 0,
                chapters: userStats?.chapters_read || 0,
                highlights: highlightCount || 0
            });
        };

        fetchStats();
    }, [supabase]);

    const statItems = [
        {
            label: "words read",
            value: stats.words.toLocaleString(),
            icon: <Type className="h-4 w-4" />
        },
        {
            label: "chapters",
            value: stats.chapters.toLocaleString(),
            icon: <BookOpen className="h-4 w-4" />
        },
        {
            label: "highlights",
            value: stats.highlights.toLocaleString(),
            icon: <Highlighter className="h-4 w-4" />
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {statItems.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-primary/50 text-xs font-mono">
                        {stat.icon}
                        <span>{stat.label}</span>
                    </div>
                    <span className="text-3xl md:text-4xl font-mono font-bold text-primary">
                        {stat.value}
                    </span>
                </div>
            ))}
        </div>
    );
}
