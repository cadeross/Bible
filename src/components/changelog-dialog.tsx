"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { History, X } from "lucide-react"

export function ChangelogDialog({ children }: { children: React.ReactNode }) {
    return (
        <DialogPrimitive.Root>
            <DialogPrimitive.Trigger asChild>
                {children}
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
                {/* Subtle Overlay */}
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-background/20 backdrop-blur-[1px] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                />

                {/* Content Container */}
                <DialogPrimitive.Content
                    className={cn(
                        "fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] outline-none",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[state=closed]:slide-out-to-top-[18%] data-[state=open]:slide-in-from-top-[18%]",
                        "duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">Changelog</DialogPrimitive.Title>

                    <div className="bg-background border-2 border-primary/10 shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[60vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-muted/20">
                            <div className="flex items-center gap-2 text-sm font-mono font-medium opacity-70">
                                <History className="h-4 w-4" />
                                <span>latest updates</span>
                            </div>
                            <DialogPrimitive.Close className="opacity-50 hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4" />
                            </DialogPrimitive.Close>
                        </div>

                        {/* Content */}
                        <div className="p-6 font-mono text-sm space-y-6 overflow-y-auto">

                            {/* Update Item */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between opacity-50 text-xs">
                                    <span>v1.0.0</span>
                                    <span>Today</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    Initial release. includes type-to-search command menu, red letter support for christ's words, and a polished monkeytype-inspired design system.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between opacity-50 text-xs">
                                    <span>v0.9.0</span>
                                    <span>Yesterday</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    Added offline support and improved reading typography. Implemented smooth scrolling and chapter navigation.
                                </p>
                            </div>

                        </div>

                        {/* Footer Hint */}
                        <div className="p-2 bg-muted/20 text-[10px] text-center text-muted-foreground/40 font-mono tracking-widest uppercase border-t border-dashed border-primary/5">
                            esc to close
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
