"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchGroupEvents, type GroupEvent } from "@/lib/groups";
import { EventList } from "@/components/groups/event-list";
import { useGroupContext } from "@/contexts/group-context";

export default function GroupEventsPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { membership, currentUserId, isAdmin } = useGroupContext();
    const [events, setEvents] = useState<GroupEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (membership?.status !== "active") {
            setLoading(false);
            return;
        }
        fetchGroupEvents(groupId).then((data) => {
            setEvents(data);
            setLoading(false);
        });
    }, [groupId, membership]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2].map((i) => (
                    <div key={i} className="h-28 border border-border/20 rounded animate-pulse bg-muted/20" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {isAdmin && (
                <div className="flex justify-end">
                    <Link
                        href={`/groups/${groupId}/events/new`}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-border/40 rounded text-xs font-mono text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        new event
                    </Link>
                </div>
            )}

            {membership?.status !== "active" ? (
                <p className="text-sm text-muted-foreground font-mono py-12 text-center">
                    join this group to see events
                </p>
            ) : (
                <EventList events={events} currentUserId={currentUserId} />
            )}
        </div>
    );
}
