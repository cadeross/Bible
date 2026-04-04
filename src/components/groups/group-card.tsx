"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Users, Lock, Globe, ShieldCheck } from "lucide-react";
import type { Group, GroupVisibility } from "@/lib/groups";

const VISIBILITY_CONFIG: Record<GroupVisibility, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    public_open: { label: "open", Icon: Globe },
    public_gated: { label: "gated", Icon: ShieldCheck },
    private: { label: "private", Icon: Lock },
};

interface GroupCardProps {
    group: Group;
    className?: string;
}

export function GroupCard({ group, className }: GroupCardProps) {
    const { label, Icon } = VISIBILITY_CONFIG[group.visibility];

    return (
        <Link
            href={`/groups/${group.id}`}
            className={cn(
                "block border border-border/30 rounded p-4 transition-all hover:border-border/60 hover:bg-muted/10",
                className
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="font-mono text-sm font-medium truncate">{group.name}</h3>
                    {group.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                    )}
                </div>
                {group.avatar_url && (
                    <img src={group.avatar_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                )}
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.member_count}
                </span>
                <span className="flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {label}
                </span>
            </div>
        </Link>
    );
}
