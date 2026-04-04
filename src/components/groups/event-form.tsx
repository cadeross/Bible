"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus } from "lucide-react";
import { createEvent, type BibleMaterial } from "@/lib/groups";
import { VersePicker } from "./verse-picker";

interface EventFormProps {
    groupId: string;
}

export function EventForm({ groupId }: EventFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [materials, setMaterials] = useState<(BibleMaterial | null)[]>([null]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addMaterial = () => setMaterials((m) => [...m, null]);
    const removeMaterial = (i: number) => setMaterials((m) => m.filter((_, idx) => idx !== i));
    const updateMaterial = (i: number, val: { ref: string; text: string } | null) => {
        setMaterials((m) => m.map((item, idx) => (idx === i ? (val ? { ref: val.ref, text: val.text } : null) : item)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !eventDate) return;
        setSubmitting(true);
        setError(null);

        const { event, error: err } = await createEvent({
            group_id: groupId,
            title: title.trim(),
            description: description.trim() || undefined,
            event_date: new Date(eventDate).toISOString(),
            bible_materials: materials.filter(Boolean) as BibleMaterial[],
        });

        if (event) {
            router.push(`/groups/${groupId}/events`);
        } else {
            setError(err ?? "Failed to create event.");
        }
        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="Event title"
                    className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">date & time</label>
                <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Optional details…"
                    className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 resize-none"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-muted-foreground">bible readings</label>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                        add
                    </button>
                </div>
                {materials.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <div className="flex-1">
                            <VersePicker
                                value={m}
                                onChange={(v) => updateMaterial(i, v)}
                            />
                        </div>
                        {materials.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeMaterial(i)}
                                className="mt-1 p-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                                aria-label="Remove reading"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <button
                type="submit"
                disabled={submitting || !title.trim() || !eventDate}
                className="w-full py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
                {submitting ? "creating…" : "create event"}
            </button>
        </form>
    );
}
