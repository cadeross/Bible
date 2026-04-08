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

                    <div className="glass border border-white/[0.12] dark:border-white/[0.06] shadow-[var(--shadow-dialog)] rounded-2xl overflow-hidden flex flex-col max-h-[60vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/15">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                <span>How to use</span>
                            </div>
                            <DialogPrimitive.Close className="rounded-lg p-1 text-muted-foreground/50 transition-all duration-200 hover:bg-accent/50 hover:text-foreground">
                                <X className="h-4 w-4" />
                            </DialogPrimitive.Close>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-sm space-y-6 overflow-y-auto">

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                                    <Keyboard className="h-3.5 w-3.5" />
                                    <span>Keyboard Shortcuts</span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-2.5 text-foreground/80 text-sm">
                                    <span>Next Chapter</span>
                                    <kbd className="rounded-lg bg-muted/60 px-2 py-0.5 border border-border/30 text-xs font-medium text-muted-foreground">Right Arrow</kbd>

                                    <span>Previous Chapter</span>
                                    <kbd className="rounded-lg bg-muted/60 px-2 py-0.5 border border-border/30 text-xs font-medium text-muted-foreground">Left Arrow</kbd>

                                    <span>Command Menu</span>
                                    <kbd className="rounded-lg bg-muted/60 px-2 py-0.5 border border-border/30 text-xs font-medium text-muted-foreground">Cmd + K</kbd>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Focus Mode</span>
                                </div>
                                <p className="text-foreground/80 leading-relaxed">
                                    Toggle <strong>Focus Mode</strong> in the footer to hide all distractions. The interface fades away, leaving only the text. Move your mouse to reveal controls.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                                    <Palette className="h-3.5 w-3.5" />
                                    <span>Themes</span>
                                </div>
                                <p className="text-foreground/80 leading-relaxed">
                                    Choose light, dark, or system appearance in Settings.
                                </p>
                            </div>

                        </div>

                        {/* Footer Hint */}
                        <div className="p-2.5 text-xs text-center text-muted-foreground/40 border-t border-border/15">
                            Press Esc to close
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
