"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/persistence";
import { useAuth } from "@clerk/nextjs";
import { getStoredBibleVersion } from "@/contexts/reading-preferences";
import Loading from "../loading";

export default function ReadPage() {
    const router = useRouter();
    const { isLoaded, isSignedIn } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        const checkLastRead = async () => {
            const version = getStoredBibleVersion();

            if (isSignedIn) {
                const profile = await getProfile();
                if (profile?.last_read_book && profile?.last_read_chapter) {
                    router.replace(`/read/${encodeURIComponent(profile.last_read_book)}/${profile.last_read_chapter}?translation=${version}`);
                    return;
                }
            }

            router.replace(`/read/Genesis/1?translation=${version}`);
        };

        void checkLastRead();
    }, [router, isLoaded, isSignedIn]);

    // Show loading state while checking
    return <Loading />;
}
