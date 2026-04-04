"use client";

import { EventCard } from "./event-card";
import type { GroupEvent } from "@/lib/groups";

interface EventListProps {
    events: GroupEvent[];
    currentUserId: string | null;
}

export function EventList({ events, currentUserId }: EventListProps) {
    if (events.length === 0) {
        return (
            <p className="text-center text-sm text-muted-foreground font-mono py-12">
                no upcoming events
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((event) => (
                <EventCard key={event.id} event={event} currentUserId={currentUserId} />
            ))}
        </div>
    );
}
