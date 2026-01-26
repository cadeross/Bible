"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { HelpCircle, X, Keyboard, Eye, Palette, Command } from "lucide-react"

export function HowToDialog({ children }: { children: React.ReactNode }) {
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
                    <DialogPrimitive.Title className="sr-only">How To Use</DialogPrimitive.Title>

                    <div className="bg-background border-2 border-primary/10 shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[60vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-muted/20">
                            <div className="flex items-center gap-2 text-sm font-mono font-medium opacity-70">
                                <HelpCircle className="h-4 w-4" />
                                <span>how to use</span>
                            </div>
                            <DialogPrimitive.Close className="opacity-50 hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4" />
                            </DialogPrimitive.Close>
                        </div>

                        {/* Content */}
                        <div className="p-6 font-mono text-sm space-y-6 overflow-y-auto">

                            {/* Section: Shortcuts */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 opacity-50 text-xs uppercase tracking-wider">
                                    <Keyboard className="h-3 w-3" />
                                    <span>Keyboard Shortcuts</span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-2 text-muted-foreground text-xs">
                                    <span>Next Chapter</span>
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">Right Arrow</kbd>

                                    <span>Previous Chapter</span>
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">Left Arrow</kbd>

                                    <span>Command Menu</span>
                                    <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">Cmd + K</kbd>
                                </div>
                            </div>

                            {/* Section: Features */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 opacity-50 text-xs uppercase tracking-wider">
                                    <Eye className="h-3 w-3" />
                                    <span>Focus Mode</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-xs">
                                    Toggle <strong>Focus Mode</strong> in the footer to hide all distractions. The interface fades away, leaving only the text. Move your mouse to reveal controls.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 opacity-50 text-xs uppercase tracking-wider">
                                    <Palette className="h-3 w-3" />
                                    <span>Themes</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-xs">
                                    Click the theme name in the footer (e.g., "standard", "sepia") to cycle through available color palettes.
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
