"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/persistence";
import { createClient } from "@/lib/supabase/client";
import { getStoredBibleVersion } from "@/contexts/reading-preferences";
import Loading from "../loading";

export default function ReadPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLastRead = async () => {
            const version = getStoredBibleVersion();
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Try to get last read position from profile
                const profile = await getProfile();
                if (profile?.last_read_book && profile?.last_read_chapter) {
                    router.replace(`/read/${encodeURIComponent(profile.last_read_book)}/${profile.last_read_chapter}?translation=${version}`);
                    return;
                }
            }

            // Default to Genesis 1 if no last read position
            router.replace(`/read/Genesis/1?translation=${version}`);
        };

        checkLastRead();
    }, [router]);

    // Show loading state while checking
    return <Loading />;
}
