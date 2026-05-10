"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/persistence";
import { getStoredBibleVersion } from "@/contexts/reading-preferences";
import Loading from "../loading";

export default function ReadPage() {
    const router = useRouter();

    useEffect(() => {
        const checkLastRead = async () => {
            const version = getStoredBibleVersion();
            const profile = await getProfile();
            if (profile?.last_read_book && profile?.last_read_chapter) {
                router.replace(`/read/${encodeURIComponent(profile.last_read_book)}/${profile.last_read_chapter}?translation=${version}`);
                return;
            }
            router.replace(`/read/Genesis/1?translation=${version}`);
        };

        void checkLastRead();
    }, [router]);

    return <Loading />;
}
