'use client';

import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SearchPage() {
    const [query, setQuery] = useState("");

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Search Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-4 h-16 flex items-center gap-3">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search Bible..."
                        className="pl-9 pr-8 bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all rounded-full h-10"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                {/* Could add 'Cancel' button if we were emulating iOS, but for Material Android usually the back button handles it or distinct Search Screen */}
            </header>

            <main className="container max-w-md mx-auto px-4 py-6">
                {/* Recent Searches / Empty State */}
                {!query && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent</h3>
                        <div className="flex flex-wrap gap-2">
                            {["John 3:16", "Love", "Faith", "Psalms"].map(term => (
                                <button key={term} className="px-3 py-1.5 bg-secondary rounded-lg text-sm font-medium active:scale-95 transition-transform">
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
