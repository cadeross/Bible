"use client";

import { usePathname } from "next/navigation";

export function PageGradients() {
    const pathname = usePathname();

    // Don't show global gradients on read pages, as they have their own implementation
    if (pathname?.startsWith("/read")) {
        return null;
    }

    return (
        <>
            <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-40 pointer-events-none hidden max-[1500px]:block" />
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-40 pointer-events-none hidden max-[1500px]:block" />
        </>
    );
}
