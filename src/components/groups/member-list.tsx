"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Shield, Clock, Ban } from "lucide-react";
import { updateMemberStatus, type GroupMember } from "@/lib/groups";

interface MemberListProps {
    members: GroupMember[];
    currentUserId: string | null;
    isAdmin: boolean;
}

export function MemberList({ members: initialMembers, currentUserId, isAdmin }: MemberListProps) {
    const [members, setMembers] = useState(initialMembers);
    const [activeTab, setActiveTab] = useState<"active" | "pending">("active");

    const activeMembers = members.filter((m) => m.status === "active");
    const pendingMembers = members.filter((m) => m.status === "pending");

    const handleApprove = async (memberId: string) => {
        const ok = await updateMemberStatus(memberId, "active");
        if (ok) setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, status: "active" } : m));
    };

    const handleBan = async (memberId: string) => {
        if (!confirm("Remove this member?")) return;
        const ok = await updateMemberStatus(memberId, "banned");
        if (ok) setMembers((prev) => prev.filter((m) => m.id !== memberId));
    };

    const displayedMembers = activeTab === "active" ? activeMembers : pendingMembers;

    return (
        <div className="space-y-4">
            {isAdmin && pendingMembers.length > 0 && (
                <div className="flex gap-1 border-b border-border/30 pb-px">
                    {(["active", "pending"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={cn(
                                "px-3 py-2 text-xs font-mono transition-colors border-b-2 -mb-px",
                                activeTab === t
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t}
                            {t === "pending" && (
                                <span className="ml-1.5 bg-primary/20 text-primary rounded-full px-1.5 py-0.5 text-[10px]">
                                    {pendingMembers.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                {displayedMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 py-2 border-b border-border/20 last:border-0"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {member.avatar_url ? (
                                <img src={member.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                                <span className="text-sm font-mono truncate">
                                    {member.username ?? "member"}
                                    {member.user_id === currentUserId && (
                                        <span className="ml-1.5 text-muted-foreground/60">(you)</span>
                                    )}
                                </span>
                                {member.role === "admin" && (
                                    <span className="flex items-center gap-0.5 text-[10px] font-mono text-primary mt-0.5">
                                        <Shield className="h-2.5 w-2.5" />
                                        admin
                                    </span>
                                )}
                            </div>
                        </div>

                        {isAdmin && member.user_id !== currentUserId && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {member.status === "pending" && (
                                    <button
                                        onClick={() => handleApprove(member.id)}
                                        className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded text-xs font-mono hover:bg-primary/20 transition-colors"
                                    >
                                        approve
                                    </button>
                                )}
                                <button
                                    onClick={() => handleBan(member.id)}
                                    className="p-1.5 text-muted-foreground/40 hover:text-red-500 transition-colors rounded"
                                    aria-label="Remove member"
                                >
                                    <Ban className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {displayedMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground font-mono py-6 text-center">
                        {activeTab === "pending" ? "no pending requests" : "no members"}
                    </p>
                )}
            </div>
        </div>
    );
}
