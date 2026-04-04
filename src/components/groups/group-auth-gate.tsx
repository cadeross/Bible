"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface GroupAuthGateProps {
    redirectTo: string;
    children: React.ReactNode;
}

export function GroupAuthGate({ redirectTo, children }: GroupAuthGateProps) {
    const router = useRouter();

    useEffect(() => {
        const check = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace(`/auth/login?redirect_to=${encodeURIComponent(redirectTo)}`);
            }
        };
        check();
    }, [redirectTo, router]);

    return <>{children}</>;
}
