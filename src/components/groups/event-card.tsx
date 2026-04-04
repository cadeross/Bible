"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, BookOpen } from "lucide-react";
import { upsertRsvp, type GroupEvent, type RsvpStatus } from "@/lib/groups";
import { SPRING_FAST } from "@/lib/animation";

interface EventCardProps {
    event: GroupEvent;
    currentUserId: string | null;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    });
}

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
    { status: "yes", label: "going" },
    { status: "maybe", label: "maybe" },
    { status: "no", label: "can't go" },
];

export function EventCard({ event: initialEvent, currentUserId }: EventCardProps) {
    const [event, setEvent] = useState(initialEvent);
    const [showMaterials, setShowMaterials] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRsvp = async (status: RsvpStatus) => {
        if (!currentUserId || loading) return;
        setLoading(true);

        const prevStatus = event.user_rsvp;
        const { status: newStatus } = await upsertRsvp(event.id, status, event.user_rsvp_id ?? null, event.user_rsvp);

        // Update counts optimistically
        setEvent((e) => {
            const updated = { ...e };
            if (prevStatus) updated[`rsvp_${prevStatus}_count` as "rsvp_yes_count" | "rsvp_no_count" | "rsvp_maybe_count"] = Math.max(0, updated[`rsvp_${prevStatus}_count` as "rsvp_yes_count" | "rsvp_no_count" | "rsvp_maybe_count"] - 1);
            if (newStatus) updated[`rsvp_${newStatus}_count` as "rsvp_yes_count" | "rsvp_no_count" | "rsvp_maybe_count"] += 1;
            updated.user_rsvp = newStatus;
            return updated;
        });
        setLoading(false);
    };

    return (
        <div className="border border-border/40 rounded p-4 space-y-3">
            {/* Title + date */}
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-mono text-sm font-medium">{event.title}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatDate(event.event_date)}</p>
                </div>
            </div>

            {event.description && (
                <p className="text-sm text-foreground/80 leading-relaxed">{event.description}</p>
            )}

            {/* Bible materials accordion */}
            {event.bible_materials.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowMaterials((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{event.bible_materials.length} reading{event.bible_materials.length > 1 ? "s" : ""}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", showMaterials && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                        {showMaterials && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={SPRING_FAST}
                                className="overflow-hidden mt-2 space-y-2"
                            >
                                {event.bible_materials.map((m, i) => (
                                    <div key={i} className="border-l-2 border-primary/30 pl-3 py-1">
                                        <p className="text-[10px] font-mono text-primary mb-0.5">{m.ref}</p>
                                        <p className="text-xs text-foreground/70 italic">{m.text}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* RSVP counts + buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                    <span>{event.rsvp_yes_count} going</span>
                    <span>{event.rsvp_maybe_count} maybe</span>
                </div>

                {currentUserId && (
                    <div className="flex gap-1">
                        {RSVP_OPTIONS.map((opt) => (
                            <button
                                key={opt.status}
                                onClick={() => handleRsvp(opt.status)}
                                disabled={loading}
                                className={cn(
                                    "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                                    event.user_rsvp === opt.status
                                        ? "bg-primary text-primary-foreground"
                                        : "border border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
