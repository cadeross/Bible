'use client';

import { Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { openCommandMenu } from '@/lib/open-command-menu';

export function MobileHeader() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md md:hidden supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4">
                <span className="text-lg font-semibold tracking-tight">Bible</span>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        aria-label="Open search palette"
                        onClick={() => openCommandMenu()}
                    >
                        <Search className="h-5 w-5" />
                    </Button>
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
