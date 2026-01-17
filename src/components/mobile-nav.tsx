'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Search, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileNav() {
    const pathname = usePathname();

    const tabs = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Read', href: '/read', icon: BookOpen },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Notes', href: '/notes', icon: StickyNote },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
            <div className="flex h-16 items-center justify-around px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.href !== '/' && pathname?.startsWith(tab.href));
                    const Icon = tab.icon;

                    // Material 3 Logic: 
                    // Active -> Filled Icon + Pill Background
                    // Inactive -> Outlined Icon + No Background
                    // NOTE: Lucide doesn't have true 'filled' variants for all icons.
                    // We simulate fill with 'fill="currentColor"' for shapes that support it.
                    // Search usually stays stroked but bolder.
                    const shouldFill = isActive && tab.name !== 'Search' && tab.name !== 'Plans';
                    // Plans (Calendar) usually looks bad filled if it's just a block.

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "group flex flex-col items-center justify-center gap-1 rounded-full px-3 py-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <div className="relative flex h-8 w-16 items-center justify-center rounded-full">
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute inset-0 bg-primary/10 rounded-full"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </AnimatePresence>
                                <Icon
                                    className={cn("h-6 w-6 z-10 relative", isActive && "text-primary")}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    fill={shouldFill ? "currentColor" : "none"}
                                />
                            </div>
                            <span className="text-[10px] font-medium">{tab.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
