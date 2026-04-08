"use client";

import { usePathname } from "next/navigation";

export function PageGradients() {
    const pathname = usePathname();

    if (pathname?.startsWith("/read")) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
    );
}
