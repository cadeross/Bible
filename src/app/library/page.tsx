"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllHighlights, Highlight } from "@/lib/persistence";
import { PenTool, ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHighlights = async () => {
            const data = await getAllHighlights();
            setHighlights(data);
            setLoading(false);
        };

        fetchHighlights();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center font-mono">
                <div className="animate-pulse text-muted-foreground">loading library...</div>
            </div>
        );
    }

    if (highlights.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 font-mono">
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
                        <PenTool className="h-8 w-8" />
                    </div>
                    <h1 className="text-xl font-bold text-primary">no highlights yet</h1>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        start reading and click on verses to highlight them. they will appear here.
                    </p>
                    <Link href="/read" className="inline-flex items-center gap-2 text-primary hover:underline underline-offset-4 mt-4">
                        start reading <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-24 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-mono">

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/50 pb-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">library</h1>
                    <p className="text-muted-foreground text-sm">
                        {highlights.length} saved highlight{highlights.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 gap-6">
                {highlights.map((highlight, idx) => (
                    <Link
                        key={highlight.id || idx}
                        href={`/read/${highlight.book}/${highlight.chapter}?translation=dra`}
                        className="group relative block p-6 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all border border-transparent hover:border-primary/20"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors">
                                    {highlight.book} {highlight.chapter}:{highlight.verse}
                                </span>
                                <span className="text-[10px] text-muted-foreground/50">
                                    {new Date(highlight.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-sm md:text-base leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors font-serif italic">
                                "{highlight.content || "view verse content"}"
                            </p>

                            <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                <ArrowRight className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
