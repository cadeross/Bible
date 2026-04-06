"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchGroup, fetchMyMembership, type Group, type GroupMember } from "@/lib/groups";
import { GroupHeader } from "@/components/groups/group-header";
import { GroupTabs } from "@/components/groups/group-tabs";
import { useAuth } from "@clerk/nextjs";
import { GroupContext } from "@/contexts/group-context";

export default function GroupLayout({ children }: { children: React.ReactNode }) {
    const { groupId } = useParams<{ groupId: string }>();
    const { isLoaded, isSignedIn, userId } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [membership, setMembership] = useState<GroupMember | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        const load = async () => {
            const [g, m] = await Promise.all([
                fetchGroup(groupId),
                isSignedIn ? fetchMyMembership(groupId) : Promise.resolve(null),
            ]);
            setGroup(g);
            setMembership(m);
            setLoading(false);
        };
        void load();
    }, [groupId, isLoaded, isSignedIn]);

    const isAdmin = membership?.role === "admin" && membership?.status === "active";

    if (loading) {
        return (
            <div className="min-h-screen pt-20 pb-32 px-6 max-w-2xl mx-auto">
                <div className="h-20 bg-muted/20 rounded animate-pulse mb-4" />
                <div className="h-8 bg-muted/20 rounded animate-pulse" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-mono">group not found</p>
            </div>
        );
    }

    return (
        <GroupContext.Provider value={{ group, membership, currentUserId: userId ?? null, isAdmin, onMembershipChange: setMembership }}>
            <div className="min-h-screen pt-20 pb-32 px-6 max-w-2xl mx-auto">
                <GroupHeader
                    group={group}
                    membership={membership}
                    currentUserId={userId ?? null}
                    onMembershipChange={setMembership}
                />
                <div className="mt-4 mb-6">
                    <GroupTabs groupId={groupId} isAdmin={isAdmin} />
                </div>
                {children}
            </div>
        </GroupContext.Provider>
    );
}
