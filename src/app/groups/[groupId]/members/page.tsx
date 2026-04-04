"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchGroupMembers, type GroupMember } from "@/lib/groups";
import { MemberList } from "@/components/groups/member-list";
import { useGroupContext } from "@/contexts/group-context";

export default function GroupMembersPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { membership, currentUserId, isAdmin } = useGroupContext();
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (membership?.status !== "active") {
            setLoading(false);
            return;
        }
        fetchGroupMembers(groupId).then((data) => {
            setMembers(data);
            setLoading(false);
        });
    }, [groupId, membership]);

    if (loading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 border-b border-border/20 animate-pulse bg-muted/10" />
                ))}
            </div>
        );
    }

    if (membership?.status !== "active") {
        return (
            <p className="text-sm text-muted-foreground font-mono py-12 text-center">
                join this group to see members
            </p>
        );
    }

    return (
        <MemberList members={members} currentUserId={currentUserId} isAdmin={isAdmin} />
    );
}
