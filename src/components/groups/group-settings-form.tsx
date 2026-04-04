"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Copy, RefreshCw } from "lucide-react";
import { updateGroup, regenerateInviteCode, type Group, type GroupVisibility } from "@/lib/groups";

interface GroupSettingsFormProps {
    group: Group;
    onUpdate: (updates: Partial<Group>) => void;
}

const VISIBILITY_OPTIONS: { value: GroupVisibility; label: string; desc: string }[] = [
    { value: "public_open", label: "Public Open", desc: "Anyone can join instantly" },
    { value: "public_gated", label: "Public Gated", desc: "Visible to all, join requires approval" },
    { value: "private", label: "Private", desc: "Invite only — not discoverable" },
];

export function GroupSettingsForm({ group, onUpdate }: GroupSettingsFormProps) {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description ?? "");
    const [visibility, setVisibility] = useState<GroupVisibility>(group.visibility);
    const [inviteCode, setInviteCode] = useState(group.invite_code);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError(null);

        const { success, error: err } = await updateGroup(group.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            visibility,
        });

        if (success) {
            onUpdate({ name: name.trim(), description: description.trim() || null, visibility });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } else {
            setError(err ?? "Failed to save.");
        }
        setSaving(false);
    };

    const copyInviteLink = async () => {
        const url = `${window.location.origin}/groups/join/${inviteCode}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = async () => {
        if (!confirm("Regenerate invite link? The old link will stop working.")) return;
        setRegenerating(true);
        const newCode = await regenerateInviteCode(group.id);
        if (newCode) {
            setInviteCode(newCode);
            onUpdate({ invite_code: newCode });
        }
        setRegenerating(false);
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">group name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 resize-none"
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

            {/* Invite link */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground">invite link</label>
                <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 border border-border/40 rounded text-xs font-mono text-muted-foreground truncate">
                        /groups/join/{inviteCode}
                    </code>
                    <button
                        type="button"
                        onClick={copyInviteLink}
                        className="flex items-center gap-1.5 px-3 py-2 border border-border/40 rounded text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? "copied!" : "copy"}
                    </button>
                    <button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="p-2 border border-border/40 rounded text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                        aria-label="Regenerate invite link"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", regenerating && "animate-spin")} />
                    </button>
                </div>
            </div>

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
                {saving ? "saving…" : saved ? "saved!" : "save changes"}
            </button>
        </form>
    );
}
