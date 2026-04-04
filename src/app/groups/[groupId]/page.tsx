"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchGroupFeed, type GroupPost } from "@/lib/groups";
import { GroupFeed } from "@/components/groups/group-feed";
import { useGroupContext } from "@/contexts/group-context";

export default function GroupFeedPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { membership, currentUserId, isAdmin } = useGroupContext();
    const [posts, setPosts] = useState<GroupPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!membership || membership.status !== "active") {
            setLoading(false);
            return;
        }
        fetchGroupFeed(groupId).then((feed) => {
            setPosts(feed);
            setLoading(false);
        });
    }, [groupId, membership]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 border border-border/20 rounded animate-pulse bg-muted/20" />
                ))}
            </div>
        );
    }

    if (!currentUserId || !membership || membership.status !== "active") {
        return (
            <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground font-mono">
                    {!currentUserId
                        ? "sign in to see this group's feed"
                        : membership?.status === "pending"
                        ? "your membership is pending approval"
                        : "join this group to see the feed"}
                </p>
            </div>
        );
    }

    return (
        <GroupFeed
            groupId={groupId}
            initialPosts={posts}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
        />
    );
}
