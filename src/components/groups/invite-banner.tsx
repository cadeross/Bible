"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { joinGroup, type Group } from "@/lib/groups";

interface InviteBannerProps {
    group: Group;
    currentUserId: string | null;
    alreadyMember: boolean;
}

export function InviteBanner({ group, currentUserId, alreadyMember }: InviteBannerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!currentUserId) {
            router.push(`/auth/login?redirect_to=${encodeURIComponent(`/groups/join/${group.invite_code}`)}`);
            return;
        }
        setLoading(true);
        const { success, error: err } = await joinGroup(group.id, group.visibility, group.invite_code);
        if (success) {
            router.push(`/groups/${group.id}`);
        } else {
            setError(err ?? "Failed to join.");
        }
        setLoading(false);
    };

    return (
        <div className="border border-border/40 rounded p-6 space-y-4 max-w-md mx-auto">
            {group.avatar_url && (
                <img src={group.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover mx-auto" />
            )}
            <div className="text-center space-y-1">
                <h2 className="font-mono font-medium text-lg">{group.name}</h2>
                {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Users className="h-3.5 w-3.5" />
                    {group.member_count} members
                </p>
            </div>

            {alreadyMember ? (
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground font-mono">you&apos;re already a member</p>
                    <button
                        onClick={() => router.push(`/groups/${group.id}`)}
                        className="w-full py-2 border border-primary/50 text-primary rounded text-sm font-mono hover:bg-primary/5 transition-colors"
                    >
                        go to group
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <button
                        onClick={handleJoin}
                        disabled={loading}
                        className="w-full py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                        {loading ? "joining…" : group.visibility === "public_gated" ? "request to join" : "join group"}
                    </button>
                    {error && <p className="text-xs text-red-500 font-mono text-center">{error}</p>}
                </div>
            )}
        </div>
    );
}
