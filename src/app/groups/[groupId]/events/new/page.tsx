"use client";

import { useParams } from "next/navigation";
import { EventForm } from "@/components/groups/event-form";
import { GroupAuthGate } from "@/components/groups/group-auth-gate";

export default function NewEventPage() {
    const { groupId } = useParams<{ groupId: string }>();

    return (
        <GroupAuthGate redirectTo={`/groups/${groupId}/events/new`}>
            <div className="space-y-4">
                <h2 className="font-mono text-sm font-medium">new event</h2>
                <EventForm groupId={groupId} />
            </div>
        </GroupAuthGate>
    );
}
