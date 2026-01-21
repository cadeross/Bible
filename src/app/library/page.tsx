"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllHighlights, getAllWisdom, Highlight, SavedWisdom } from "@/lib/persistence";
import { PenTool, ArrowRight, BookOpen, Heart, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BIBLE_BOOKS } from "@/lib/bible-data";

interface GroupedHighlight extends Highlight {
    verseEnd: number;
}

export default function LibraryPage() {
    const [rawHighlights, setRawHighlights] = useState<Highlight[]>([]);
    const [wisdom, setWisdom] = useState<SavedWisdom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [highlightsData, wisdomData] = await Promise.all([
                getAllHighlights(),
                getAllWisdom()
            ]);
            setRawHighlights(highlightsData);
            setWisdom(wisdomData);
            setLoading(false);
        };

        fetchData();
    }, []);



    const groupedHighlights = useMemo(() => {
        if (rawHighlights.length === 0) return [];

        // 1. Sort Canonically for grouping
        const sorted = [...rawHighlights].sort((a, b) => {
            const bookA = BIBLE_BOOKS.findIndex(book => book.name === a.book);
            const bookB = BIBLE_BOOKS.findIndex(book => book.name === b.book);

            if (bookA !== bookB) return bookA - bookB;
            if (a.chapter !== b.chapter) return a.chapter - b.chapter;
            return a.verse - b.verse;
        });

        // 2. Group adjacent verses
        const grouped: GroupedHighlight[] = [];
        let currentGroup: GroupedHighlight | null = null;

        sorted.forEach((h) => {
            if (!currentGroup) {
                currentGroup = { ...h, verseEnd: h.verse };
                return;
            }

            // Check adhesion: Same Book, Same Chapter, Same Color, Next Verse
            const isNextVerse = h.verse === currentGroup.verseEnd + 1;
            const isSameBook = h.book === currentGroup.book;
            const isSameChapter = h.chapter === currentGroup.chapter;
            const isSameColor = h.color === currentGroup.color;

            if (isSameBook && isSameChapter && isNextVerse && isSameColor) {
                // Merge
                currentGroup.verseEnd = h.verse;
                currentGroup.content = `${currentGroup.content} ${h.content}`;
                // Keep the 'latest' created_at if we want the group to jump to top? 
                // Currently sorting by canonical, but we'll re-sort by time after.
                if (new Date(h.created_at) > new Date(currentGroup.created_at)) {
                    currentGroup.created_at = h.created_at;
                }
            } else {
                // Push current and start new
                grouped.push(currentGroup);
                currentGroup = { ...h, verseEnd: h.verse };
            }
        });

        if (currentGroup) {
            grouped.push(currentGroup);
        }

        // 3. Re-sort by Recency (Newest first)
        return grouped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    }, [rawHighlights]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center font-mono">
                <div className="animate-pulse text-muted-foreground">loading library...</div>
            </div>
        );
    }

    if (rawHighlights.length === 0 && wisdom.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 font-mono">
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
                        <PenTool className="h-8 w-8" />
                    </div>
                    <h1 className="text-xl font-bold text-primary">empty library</h1>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        start reading to highlight verses or save daily wisdom.
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
                        your collection of verses and wisdom
                    </p>
                </div>
            </div>

            <Tabs defaultValue="highlights" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8 bg-transparent p-0">
                    <TabsTrigger
                        value="highlights"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all justify-start px-0 pb-2"
                    >
                        <span className="flex items-center gap-2">
                            <PenTool className="h-4 w-4" /> highlights ({groupedHighlights.length})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="wisdom"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all justify-start px-0 pb-2"
                    >
                        <span className="flex items-center gap-2">
                            <Heart className="h-4 w-4" /> wisdom ({wisdom.length})
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="highlights" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {groupedHighlights.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground italic">no highlights yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {groupedHighlights.map((highlight, idx) => (
                                <Link
                                    key={highlight.id || idx}
                                    href={`/read/${highlight.book}/${highlight.chapter}?translation=dra`}
                                    className={cn(
                                        "group relative block p-6 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all border border-transparent hover:border-primary/20",
                                        // Optional: Add colored border left based on highlight color?
                                        // highlight.color === 'yellow' && "border-l-yellow-500 border-l-4"
                                    )}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors flex items-center gap-2">
                                                {/* Color Dot Indicator */}
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    highlight.color === "yellow" && "bg-yellow-500",
                                                    highlight.color === "green" && "bg-green-500",
                                                    highlight.color === "blue" && "bg-blue-500",
                                                    highlight.color === "pink" && "bg-pink-500",
                                                    highlight.color === "purple" && "bg-purple-500",
                                                )} />
                                                {highlight.book} {highlight.chapter}:{highlight.verse}{highlight.verseEnd > highlight.verse ? `-${highlight.verseEnd}` : ''}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/50">
                                                {new Date(highlight.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-sm md:text-base leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors font-serif italic line-clamp-3">
                                            "{highlight.content || "view verse content"}"
                                        </p>

                                        <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                            <ArrowRight className="h-4 w-4 text-primary" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>



                <TabsContent value="wisdom" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {wisdom.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground italic">no saved wisdom yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {wisdom.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="group relative block p-6 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all border border-transparent hover:border-primary/20"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors flex items-center gap-2">
                                                <Quote className="h-3 w-3" /> daily wisdom
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/50">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-sm md:text-base leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors font-serif italic">
                                            "{item.content}"
                                        </p>

                                        <div className="text-right">
                                            <span className="text-xs font-mono text-primary/60">
                                                — {item.source || "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
