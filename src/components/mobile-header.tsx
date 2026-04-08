'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { openCommandMenu } from '@/lib/open-command-menu';

function OpenWritLogo({ className }: { className?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 370 370" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="185.062" cy="185.062" r="185.062" fill="currentColor" />
            <rect x="168.955" y="102.397" width="31.9991" height="165.755" rx="7" fill="white" />
            <rect x="102.396" y="168.955" width="165.755" height="31.9991" rx="7" fill="white" />
        </svg>
    )
}

export function MobileHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] glass-nav md:hidden">
            <div className="flex h-12 items-center justify-between px-4">
                <Link href="/read" className="group flex items-center gap-1.5 transition-all duration-200">
                    <OpenWritLogo className="rounded-[3px] text-muted-foreground/40 transition-colors duration-200 group-hover:text-primary" />
                    <span className="text-[15px] font-semibold tracking-tight text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                        OpenWrit
                    </span>
                </Link>
                <button
                    type="button"
                    aria-label="Open command menu"
                    onClick={() => openCommandMenu()}
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                    <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
            </div>
        </header>
    );
}
