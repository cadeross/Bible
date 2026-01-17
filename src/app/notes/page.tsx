'use client';

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StickyNote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-4 pt-[env(safe-area-inset-top)]">
                <div className="flex h-16 items-center justify-between">
                    <span className="text-xl font-bold tracking-tight">Notes</span>
                    <div className="flex gap-2">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container max-w-md mx-auto px-4 py-6 space-y-4">
                {/* Empty State / Placeholder */}
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-50">
                    <div className="bg-muted p-4 rounded-full">
                        <StickyNote size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">No Notes Yet</h3>
                        <p className="text-sm">Highlight verses to add annotations.</p>
                    </div>
                </div>

                {/* Example Note Card to show Native Feel */}
                <div className="bg-card border rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">Genesis 1:1</span>
                        <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                    <p className="text-sm leading-relaxed">
                        This verse reminds me of the sheer power of God's word. Creation ex nihilo.
                    </p>
                </div>
            </main>

            {/* FAB for new note (Native Pattern) */}
            <div className="fixed bottom-20 right-4">
                <Button size="icon" className="h-14 w-14 rounded-2xl shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
