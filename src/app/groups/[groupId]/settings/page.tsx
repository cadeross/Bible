"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GroupSettingsForm } from "@/components/groups/group-settings-form";
import { GroupAuthGate } from "@/components/groups/group-auth-gate";
import { useGroupContext } from "@/contexts/group-context";

export default function GroupSettingsPage() {
    const router = useRouter();
    const { group: contextGroup, isAdmin } = useGroupContext();
    const [group, setGroup] = useState(contextGroup);

    useEffect(() => {
        if (!isAdmin) {
            router.replace(`/groups/${contextGroup.id}`);
        }
    }, [isAdmin, contextGroup.id, router]);

    if (!isAdmin) return null;

    return (
        <GroupAuthGate redirectTo={`/groups/${group.id}/settings`}>
            <div className="space-y-4">
                <h2 className="font-mono text-sm font-medium">settings</h2>
                <GroupSettingsForm
                    group={group}
                    onUpdate={(updates) => setGroup((g) => ({ ...g, ...updates }))}
                />
            </div>
        </GroupAuthGate>
    );
}
