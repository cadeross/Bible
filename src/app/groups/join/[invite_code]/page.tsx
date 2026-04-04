"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchGroupByInviteCode, fetchMyMembership, type Group, type GroupMember } from "@/lib/groups";
import { InviteBanner } from "@/components/groups/invite-banner";
import { createClient } from "@/lib/supabase/client";

export default function JoinGroupPage() {
    const { invite_code } = useParams<{ invite_code: string }>();
    const [group, setGroup] = useState<Group | null>(null);
    const [membership, setMembership] = useState<GroupMember | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUserId(session?.user.id ?? null);

            const g = await fetchGroupByInviteCode(invite_code);
            if (!g) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            setGroup(g);

            if (session) {
                const m = await fetchMyMembership(g.id);
                setMembership(m);
            }
            setLoading(false);
        };
        load();
    }, [invite_code]);

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-mono">loading…</p>
            </div>
        );
    }

    if (notFound || !group) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-mono">invite link not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-32 px-6 flex items-start justify-center">
            <div className="w-full max-w-sm mt-8">
                <p className="text-center text-xs font-mono text-muted-foreground mb-6">you&apos;ve been invited to</p>
                <InviteBanner
                    group={group}
                    currentUserId={currentUserId}
                    alreadyMember={membership?.status === "active"}
                />
            </div>
        </div>
    );
}
