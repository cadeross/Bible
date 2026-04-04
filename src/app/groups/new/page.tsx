"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createGroup, type GroupVisibility } from "@/lib/groups";
import { GroupAuthGate } from "@/components/groups/group-auth-gate";

const VISIBILITY_OPTIONS: { value: GroupVisibility; label: string; desc: string }[] = [
    { value: "public_open", label: "Public Open", desc: "Anyone can join instantly" },
    { value: "public_gated", label: "Public Gated", desc: "Visible to all, join requires approval" },
    { value: "private", label: "Private", desc: "Invite only — not discoverable" },
];

export default function NewGroupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState<GroupVisibility>("public_open");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        setError(null);

        const { group, error: err } = await createGroup({ name: name.trim(), description: description.trim(), visibility });
        if (group) {
            router.push(`/groups/${group.id}`);
        } else {
            setError(err ?? "Failed to create group.");
        }
        setSubmitting(false);
    };

    return (
        <GroupAuthGate redirectTo="/groups/new">
            <div className="min-h-screen pt-20 pb-32 px-6 max-w-lg mx-auto">
                <h1 className="font-mono text-lg font-medium mb-6">new group</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-mono text-muted-foreground">name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={100}
                            placeholder="Group name"
                            autoFocus
                            className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-mono text-muted-foreground">description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="What is this group about?"
                            className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-muted-foreground">visibility</label>
                        <div className="space-y-2">
                            {VISIBILITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setVisibility(opt.value)}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 border rounded transition-colors",
                                        visibility === opt.value
                                            ? "border-primary/50 bg-primary/5"
                                            : "border-border/40 hover:border-border"
                                    )}
                                >
                                    <div className="font-mono text-xs font-medium">{opt.label}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting || !name.trim()}
                        className="w-full py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                        {submitting ? "creating…" : "create group"}
                    </button>
                </form>
            </div>
        </GroupAuthGate>
    );
}
