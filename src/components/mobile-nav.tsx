'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function MobileNav() {
    const pathname = usePathname();

    const tabs = [
        { name: 'home', href: '/', icon: Home },
        { name: 'read', href: '/read', icon: BookOpen },
        { name: 'library', href: '/library', icon: Library },
        { name: 'profile', href: '/profile', icon: User },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-24 bg-gradient-to-t from-background via-background/90 to-transparent md:hidden pb-[env(safe-area-inset-bottom)] flex items-end">
            <div className="flex w-full h-16 items-center justify-around pb-2">
                {tabs.map((tab) => {
                    // Check active state
                    const isActive = pathname === tab.href ||
                        (tab.href !== '/' && pathname?.startsWith(tab.href));

                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "group relative flex flex-col items-center justify-center gap-1.5 w-full h-full transition-colors duration-200",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                            <Icon
                                className={cn(
                                    "h-5 w-5 relative z-10 transition-transform duration-200",
                                    isActive && "scale-110"
                                )}
                                strokeWidth={1.5}
                            />
                            <span className={cn(
                                "text-[10px] font-mono tracking-tight relative z-10",
                                isActive && "font-bold"
                            )}>
                                {tab.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
