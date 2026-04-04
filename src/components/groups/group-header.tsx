"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, Globe, Lock, ShieldCheck, Check, Clock } from "lucide-react";
import { joinGroup, leaveGroup, type Group, type GroupMember } from "@/lib/groups";

interface GroupHeaderProps {
    group: Group;
    membership: GroupMember | null;
    currentUserId: string | null;
    onMembershipChange: (m: GroupMember | null) => void;
}

const VISIBILITY_ICON = {
    public_open: Globe,
    public_gated: ShieldCheck,
    private: Lock,
};

export function GroupHeader({ group, membership, currentUserId, onMembershipChange }: GroupHeaderProps) {
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!currentUserId || loading) return;
        setLoading(true);
        const { success, error } = await joinGroup(group.id, group.visibility);
        if (success) {
            const status = group.visibility === "public_gated" ? "pending" : "active";
            onMembershipChange({
                id: "optimistic",
                group_id: group.id,
                user_id: currentUserId,
                role: "member",
                status,
                joined_at: new Date().toISOString(),
            });
        } else {
            console.error(error);
        }
        setLoading(false);
    };

    const handleLeave = async () => {
        if (loading) return;
        // Optimistic: remove membership immediately
        const prev = membership;
        onMembershipChange(null);
        const { success } = await leaveGroup(group.id);
        if (!success) {
            onMembershipChange(prev);
        }
    };

    const VisibilityIcon = VISIBILITY_ICON[group.visibility];

    return (
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/30">
            <div className="flex items-start gap-3 min-w-0">
                {group.avatar_url ? (
                    <img src={group.avatar_url} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                ) : (
                    <div className="h-12 w-12 rounded bg-muted flex-shrink-0" />
                )}
                <div className="min-w-0">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground leading-tight">
                        {group.name}
                    </h1>
                    {group.description && (
                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{group.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.member_count} members
                        </span>
                        <span className="flex items-center gap-1">
                            <VisibilityIcon className="h-3 w-3" />
                            {group.visibility.replace("_", " ")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Join/Leave button */}
            {currentUserId && (
                <div className="flex-shrink-0">
                    {!membership && (
                        <button
                            onClick={handleJoin}
                            disabled={loading}
                            className="px-4 py-1.5 border border-primary text-primary rounded text-xs font-mono hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
                        >
                            {loading ? "…" : "join"}
                        </button>
                    )}
                    {membership?.status === "pending" && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 border border-border/40 rounded text-xs font-mono text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            pending
                        </span>
                    )}
                    {membership?.status === "active" && membership.role !== "admin" && (
                        <button
                            onClick={handleLeave}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border/40 rounded text-xs font-mono text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-colors disabled:opacity-40"
                        >
                            <Check className="h-3 w-3" />
                            joined
                        </button>
                    )}
                    {membership?.status === "active" && membership.role === "admin" && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded text-xs font-mono text-primary">
                            <Check className="h-3 w-3" />
                            admin
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
