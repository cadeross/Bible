"use client";

import { createContext, useContext } from "react";
import type { Group, GroupMember } from "@/lib/groups";

interface GroupContextValue {
    group: Group;
    membership: GroupMember | null;
    currentUserId: string | null;
    isAdmin: boolean;
    onMembershipChange: (m: GroupMember | null) => void;
}

export const GroupContext = createContext<GroupContextValue | null>(null);

export function useGroupContext() {
    const ctx = useContext(GroupContext);
    if (!ctx) throw new Error("useGroupContext must be used inside GroupLayout");
    return ctx;
}
