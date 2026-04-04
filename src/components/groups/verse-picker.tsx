"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

interface VersePickerValue {
    ref: string;
    text: string;
    book?: string;
    chapter?: number;
    startVerse?: number;
    endVerse?: number;
}

interface VersePickerProps {
    value: VersePickerValue | null;
    onChange: (value: VersePickerValue | null) => void;
    className?: string;
}

// Simple ref parser: "John 3:16" or "John 3:16-18"
function parseRef(ref: string): { book: string; chapter: number; start: number; end: number } | null {
    const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    return {
        book: match[1].trim(),
        chapter: parseInt(match[2]),
        start: parseInt(match[3]),
        end: parseInt(match[4] ?? match[3]),
    };
}

export function VersePicker({ value, onChange, className }: VersePickerProps) {
    const [refInput, setRefInput] = useState(value?.ref ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = async () => {
        const parsed = parseRef(refInput);
        if (!parsed) {
            setError("Format: Book Chapter:Verse (e.g. John 3:16)");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { getChapter } = await import("@/lib/bible-api");
            const chapter = await getChapter(parsed.book, parsed.chapter, "web");
            if (!chapter) {
                setError("Chapter not found.");
                setLoading(false);
                return;
            }

            const verses = chapter.verses.filter(
                (v) => v.verse >= parsed.start && v.verse <= parsed.end
            );
            if (verses.length === 0) {
                setError("Verses not found.");
                setLoading(false);
                return;
            }

            const text = verses.map((v) => v.text).join(" ");
            onChange({
                ref: refInput,
                text,
                book: parsed.book,
                chapter: parsed.chapter,
                startVerse: parsed.start,
                endVerse: parsed.end,
            });
        } catch {
            setError("Failed to load verse.");
        }
        setLoading(false);
    };

    const clear = () => {
        onChange(null);
        setRefInput("");
        setError(null);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {value ? (
                <div className="border border-primary/30 rounded-md p-3 bg-primary/5 relative">
                    <button
                        onClick={clear}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Remove verse"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-xs font-mono text-primary mb-1">{value.ref}</p>
                    <p className="text-xs text-foreground/80 leading-relaxed pr-4">{value.text}</p>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        value={refInput}
                        onChange={(e) => setRefInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && lookup()}
                        placeholder="e.g. John 3:16"
                        className="flex-1 bg-transparent border border-border/40 rounded px-3 py-1.5 text-xs font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
                    />
                    <button
                        onClick={lookup}
                        disabled={loading || !refInput.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 border border-border/40 rounded text-xs font-mono text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40 transition-colors"
                    >
                        <Search className="h-3 w-3" />
                        {loading ? "…" : "Look up"}
                    </button>
                </div>
            )}
            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
        </div>
    );
}
