"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface GroupTabsProps {
    groupId: string;
    isAdmin: boolean;
}

export function GroupTabs({ groupId, isAdmin }: GroupTabsProps) {
    const pathname = usePathname();

    const tabs = [
        { label: "feed", href: `/groups/${groupId}` },
        { label: "events", href: `/groups/${groupId}/events` },
        { label: "members", href: `/groups/${groupId}/members` },
        ...(isAdmin ? [{ label: "settings", href: `/groups/${groupId}/settings` }] : []),
    ];

    return (
        <nav className="flex gap-1 border-b border-border/30 pb-px -mx-1">
            {tabs.map((tab) => {
                const active = tab.label === "feed"
                    ? pathname === tab.href
                    : pathname?.startsWith(tab.href);
                return (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className={cn(
                            "px-3 py-2 text-xs font-mono transition-colors border-b-2 -mb-px",
                            active
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
