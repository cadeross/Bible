"use client";

import { useEffect, useState } from "react";
import { BookOpen, Highlighter, Type } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { getConvexHttp } from "@/lib/convex/http";
import { api } from "../../../convex/_generated/api";

export function StatsOverview() {
  const [stats, setStats] = useState({
    words: 0,
    chapters: 0,
    highlights: 0,
  });
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        const client = getConvexHttp();
        const [highlights, historyRows] = await Promise.all([
          client.query(api.highlights.listAll, {}),
          client.query(api.history.list, {}),
        ]);

        const totalWords = historyRows.reduce(
          (sum, r) => sum + (r.wordsRead || 0),
          0
        );
        const uniqueChapters = new Set(
          historyRows.map((r) => `${r.book}-${r.chapter}`)
        ).size;

        setStats({
          words: totalWords,
          chapters: uniqueChapters,
          highlights: highlights.length,
        });
      } catch {
        /* Convex not configured or not signed in */
      }
    };

    void fetchStats();
  }, [isAuthenticated]);

  const statItems = [
    {
      label: "words read",
      value: stats.words.toLocaleString(),
      icon: <Type className="h-4 w-4" />,
    },
    {
      label: "chapters",
      value: stats.chapters.toLocaleString(),
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      label: "highlights",
      value: stats.highlights.toLocaleString(),
      icon: <Highlighter className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
      {statItems.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-mono">
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
