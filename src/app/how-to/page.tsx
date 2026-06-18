"use client"

import { useState, useEffect } from "react"
import { Eye, Palette, BookOpen, PenTool, Command, User, Church, Keyboard, Languages } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            <Icon className="h-3.5 w-3.5" />
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
)

const Shortcut = ({ action, keys }: { action: string, keys: string }) => (
    <div className="flex items-center justify-between gap-4 py-1.5">
        <span className="text-sm text-foreground/80">{action}</span>
        <kbd className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border/30 whitespace-nowrap">{keys}</kbd>
    </div>
)

const Step = ({ n, children }: { n: number, children: React.ReactNode }) => (
    <li className="flex items-start gap-3 text-sm text-foreground/80">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">{n}</span>
        <span className="leading-relaxed">{children}</span>
    </li>
)

const Bullet = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-center gap-2.5 text-sm text-foreground/80 leading-relaxed">
        <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30" />
        {children}
    </li>
)

export default function HowToPage() {
    const [isMac, setIsMac] = useState(false)

    useEffect(() => {
        setIsMac(navigator.platform.toUpperCase().includes("MAC") || /Mac/.test(navigator.userAgent))
    }, [])

    const focusKey = isMac ? "Option + F" : "Alt + F"

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-12"
        >
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    How to Use
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Get the most out of OpenWrit
                </p>
            </div>

            <div className="grid gap-12">

                {/* GETTING STARTED */}
                <Section title="Getting Started" icon={BookOpen}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        OpenWrit is a focused, minimal Bible reader. Navigate to any book and chapter using the reading toolbar or by simply starting to type — the command menu will appear instantly. Your last-read position is remembered and shown on the home screen.
                    </p>
                </Section>

                {/* COMMAND MENU */}
                <Section title="Command Menu" icon={Command}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        Start typing from anywhere in the app to instantly open the command menu. You can navigate to any passage without touching the mouse.
                    </p>
                    <div className="rounded-2xl border border-border/25 bg-card p-5 shadow-[var(--shadow-card)] space-y-3 text-sm text-foreground/80">
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Type a book name (e.g. <span className="font-medium text-foreground">Genesis</span>) to jump to it.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Type a book and chapter (e.g. <span className="font-medium text-foreground">John 3</span>) to jump directly to that chapter.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Include a verse (e.g. <span className="font-medium text-foreground">John 3:16</span>) to jump to a specific verse.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Press <kbd className="rounded-md bg-muted/60 px-1.5 py-0.5 border border-border/30 text-xs font-medium">Tab</kbd> to autocomplete a book name, then add a chapter number.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Use <kbd className="rounded-md bg-muted/60 px-1.5 py-0.5 border border-border/30 text-xs font-medium">↑ ↓</kbd> to move through results and <kbd className="rounded-md bg-muted/60 px-1.5 py-0.5 border border-border/30 text-xs font-medium">Enter</kbd> to navigate.</span>
                        </div>
                    </div>
                </Section>

                {/* KEYBOARD SHORTCUTS */}
                <Section title="Keyboard Shortcuts" icon={Keyboard}>
                    <div className="rounded-2xl border border-border/25 bg-card p-5 shadow-[var(--shadow-card)] space-y-1">
                        <Shortcut action="Next chapter" keys="→ Right Arrow" />
                        <Shortcut action="Previous chapter" keys="← Left Arrow" />
                        <Shortcut action="Toggle focus mode" keys={focusKey} />
                        <Shortcut action="Open command menu" keys="Start typing" />
                        <Shortcut action="Close command menu" keys="Esc" />
                    </div>
                </Section>

                {/* READING TOOLBAR */}
                <Section title="Reading Toolbar" icon={BookOpen}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        At the top of every chapter you&apos;ll find the reading toolbar. From here you can:
                    </p>
                    <ul className="space-y-2">
                        <Bullet>Switch to any book using the book selector.</Bullet>
                        <Bullet>Navigate chapters with the arrow buttons, or click the chapter number and type to jump directly.</Bullet>
                        <Bullet>Switch Bible translations inline without leaving the current passage.</Bullet>
                        <Bullet>Toggle font family (sans, serif, mono, round), font size, verse numbers, red letters, and section titles.</Bullet>
                    </ul>
                </Section>

                {/* FOCUS MODE */}
                <Section title="Focus Mode" icon={Eye}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        Press <kbd className="rounded-md bg-muted/60 px-1.5 py-0.5 border border-border/30 text-xs font-medium">{focusKey}</kbd> while reading to enter focus mode. The main navigation fades away while the book, chapter, and version controls stay docked above the passage.
                    </p>
                </Section>

                {/* HIGHLIGHTS & NOTES */}
                <Section title="Highlights & Notes" icon={PenTool}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        Annotate any verse directly while reading:
                    </p>
                    <ol className="space-y-2.5">
                        <Step n={1}>Click a verse to apply a quick highlight in your default color.</Step>
                        <Step n={2}>Right-click or long-press any verse to open the annotation menu.</Step>
                        <Step n={3}>Choose from six highlight colors: yellow, green, blue, pink, purple, or orange.</Step>
                        <Step n={4}>Add a written note to any verse from the annotation menu.</Step>
                        <Step n={5}>Share a verse or selection as a direct link using the share button in the annotation menu.</Step>
                        <Step n={6}>View all your highlights and notes in your <Link href="/library" className="text-primary hover:underline underline-offset-4">Library</Link>.</Step>
                    </ol>
                    <p className="text-xs text-muted-foreground">
                        Highlights and notes are saved locally and sync across devices when signed in.
                    </p>
                </Section>

                {/* TRANSLATIONS */}
                <Section title="Bible Translations" icon={Languages}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        OpenWrit ships with 14 translations. The default is the New Revised Standard Version, Catholic Edition (NRSVCE). Switch translations at any time using the translation selector in the reading toolbar, or set a permanent default in{" "}
                        <Link href="/settings" className="text-primary hover:text-primary/80 transition-colors">Settings</Link>.
                    </p>
                </Section>

                {/* THEMES & CUSTOMIZATION */}
                <Section title="Themes & Customization" icon={Palette}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        All appearance preferences are managed in{" "}
                        <Link href="/settings" className="text-primary hover:text-primary/80 transition-colors">Settings</Link>:
                    </p>
                    <ul className="space-y-2">
                        <Bullet>Light, dark, or system-synced mode.</Bullet>
                        <Bullet>A clean light or dark interface inspired by Things 3, with system sync.</Bullet>
                        <Bullet>Font family: sans, serif, mono, or round.</Bullet>
                        <Bullet>Font size adjustable from 12px to 32px.</Bullet>
                        <Bullet>Toggle verse numbers, red letters, and section titles.</Bullet>
                        <Bullet>Set your default highlight color for one-click annotations.</Bullet>
                    </ul>
                </Section>

                {/* DAILY READINGS */}
                <Section title="Daily Readings" icon={Church}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        The home screen displays today&apos;s USCCB Mass readings, the liturgical season, and any feast day. Visit the{" "}
                        <Link href="/calendar" className="text-primary hover:text-primary/80 transition-colors">Calendar</Link> page for the full liturgical calendar. You can also opt in to a daily verse email from{" "}
                        <Link href="/settings" className="text-primary hover:text-primary/80 transition-colors">Settings</Link>.
                    </p>
                </Section>

                {/* PROGRESS */}
                <Section title="Progress" icon={User}>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                        Reading progress is tracked automatically on this device.
                    </p>
                    <ul className="space-y-2">
                        <Bullet>Your daily reading streak is shown on the home screen.</Bullet>
                        <Bullet>Full reading history is logged per chapter with time-on-page tracking.</Bullet>
                        <Bullet>Highlights and notes are saved locally and shown in the Library.</Bullet>
                    </ul>
                </Section>

            </div>
        </motion.div>
    )
}
