'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Command } from "lucide-react";

export function DesktopNav() {
    const pathname = usePathname();

    const tabs = [
        { name: 'home', href: '/' },
        { name: 'read', href: '/read' },
        { name: 'search', href: '/search' },
        { name: 'library', href: '/library' },
    ];

    return (
        <nav className="flex w-full items-center justify-between px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
            {/* Logo / Brand */}
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Command className="h-6 w-6" />
                <span className="text-xl font-bold font-mono tracking-tighter">bible</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-8">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.href !== '/' && pathname?.startsWith(tab.href));
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "text-sm font-mono transition-colors relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.name}
                            {/* Active Indicator (optional, minimalist underscore or color is enough usually) */}
                        </Link>
                    )
                })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground font-mono hidden lg:block">
                    v1.0.0
                </div>
                <ThemeToggle />
            </div>
        </nav>
    );
}
