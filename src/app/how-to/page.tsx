"use client"

import { useState, useEffect } from "react"
import { Eye, Palette, BookOpen, PenTool, Command, User, Church, Keyboard, Languages } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <Icon className="h-3 w-3" />
            {title}
        </h2>
        <div className="pl-4 border-l border-border/40 space-y-4">
            {children}
        </div>
    </div>
)

const Shortcut = ({ action, keys }: { action: string, keys: string }) => (
    <div className="flex items-center justify-between gap-4 py-1">
        <span className="text-sm font-mono text-muted-foreground">{action}</span>
        <kbd className="bg-muted px-2 py-0.5 rounded border border-border text-xs font-mono whitespace-nowrap">{keys}</kbd>
    </div>
)

const Step = ({ n, children }: { n: number, children: React.ReactNode }) => (
    <li className="flex items-start gap-3 text-sm font-mono text-muted-foreground">
        <span className="mt-px w-5 h-5 rounded-sm bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{n}</span>
        <span className="leading-relaxed">{children}</span>
    </li>
)

const Bullet = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-center gap-2.5 text-sm font-mono text-muted-foreground leading-relaxed">
        <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
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
            <div className="flex flex-col items-center text-center gap-4 opacity-70 hover:opacity-100 transition-opacity mb-12">
                <div className="space-y-1">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        HOW TO USE
                    </h1>
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                        get the most out of openwrit
                    </p>
                </div>
            </div>

            <div className="grid gap-12">

                {/* GETTING STARTED */}
                <Section title="Getting Started" icon={BookOpen}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        OpenWrit is a focused, minimal Bible reader. Navigate to any book and chapter using the reading toolbar or by simply starting to type — the command menu will appear instantly. Your last-read position is remembered and shown on the home screen.
                    </p>
                </Section>

                {/* COMMAND MENU */}
                <Section title="Command Menu" icon={Command}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        Start typing from anywhere in the app to instantly open the command menu. You can navigate to any passage without touching the mouse.
                    </p>
                    <div className="bg-secondary/10 border border-border/50 rounded-[2px] p-4 space-y-3 text-sm font-mono text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Type a book name (e.g. <span className="text-foreground">Genesis</span>) to jump to it.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Type a book and chapter (e.g. <span className="text-foreground">John 3</span>) to jump directly to that chapter.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Include a verse (e.g. <span className="text-foreground">John 3:16</span>) to jump to a specific verse.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Press <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-xs">Tab</kbd> to autocomplete a book name, then add a chapter number.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-primary shrink-0">→</span>
                            <span>Use <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-xs">↑ ↓</kbd> to move through results and <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-xs">Enter</kbd> to navigate. Press <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-xs">Esc</kbd> to close.</span>
                        </div>
                    </div>
                </Section>

                {/* KEYBOARD SHORTCUTS */}
                <Section title="Keyboard Shortcuts" icon={Keyboard}>
                    <div className="bg-secondary/10 border border-border/50 rounded-[2px] p-4 space-y-2">
                        <Shortcut action="Next chapter" keys="→ Right Arrow" />
                        <Shortcut action="Previous chapter" keys="← Left Arrow" />
                        <Shortcut action="Toggle focus mode" keys={focusKey} />
                        <Shortcut action="Open command menu" keys="Start typing" />
                        <Shortcut action="Close command menu" keys="Esc" />
                    </div>
                </Section>

                {/* READING TOOLBAR */}
                <Section title="Reading Toolbar" icon={BookOpen}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        At the top of every chapter you'll find the reading toolbar. From here you can:
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
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        Press <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-xs font-mono">{focusKey}</kbd> while reading to enter focus mode. All navigation and UI elements fade away, leaving only the text. Move your cursor to the edges of the screen to reveal controls when needed.
                    </p>
                </Section>

                {/* HIGHLIGHTS & NOTES */}
                <Section title="Highlights & Notes" icon={PenTool}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        Annotate any verse directly while reading:
                    </p>
                    <ol className="space-y-2.5">
                        <Step n={1}>Click a verse to apply a quick highlight in your default color.</Step>
                        <Step n={2}>Right-click or long-press any verse to open the annotation menu.</Step>
                        <Step n={3}>Choose from five highlight colors: yellow, green, blue, pink, or purple.</Step>
                        <Step n={4}>Add a written note to any verse from the annotation menu.</Step>
                        <Step n={5}>Share a verse or selection as a direct link using the share button in the annotation menu.</Step>
                        <Step n={6}>View all your highlights and notes in your <Link href="/library" className="text-primary hover:underline underline-offset-4">Library</Link>.</Step>
                    </ol>
                    <p className="text-xs font-mono text-muted-foreground/50">
                        Highlights and notes are saved locally and sync across devices when signed in.
                    </p>
                </Section>

                {/* TRANSLATIONS */}
                <Section title="Bible Translations" icon={Languages}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        OpenWrit ships with 14 translations. The default is the New Revised Standard Version, Catholic Edition (NRSVCE). Switch translations at any time using the translation selector in the reading toolbar, or set a permanent default in{" "}
                        <Link href="/settings" className="text-primary hover:underline underline-offset-4">Settings</Link>.
                    </p>
                </Section>

                {/* THEMES & CUSTOMIZATION */}
                <Section title="Themes & Customization" icon={Palette}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        All appearance preferences are managed in{" "}
                        <Link href="/settings" className="text-primary hover:underline underline-offset-4">Settings</Link>:
                    </p>
                    <ul className="space-y-2">
                        <Bullet>Light, dark, or system-synced mode.</Bullet>
                        <Bullet>Eight color palettes: Standard, Terminal, Solarized, Sepia, Midnight, Lavender, Rose, and OLED.</Bullet>
                        <Bullet>Font family: sans, serif, mono, or round.</Bullet>
                        <Bullet>Font size adjustable from 12px to 32px.</Bullet>
                        <Bullet>Toggle verse numbers, red letters, and section titles.</Bullet>
                        <Bullet>Set your default highlight color for one-click annotations.</Bullet>
                    </ul>
                </Section>

                {/* DAILY READINGS */}
                <Section title="Daily Readings" icon={Church}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        The home screen displays today's USCCB Mass readings, the liturgical season, and any feast day. Visit the{" "}
                        <Link href="/calendar" className="text-primary hover:underline underline-offset-4">Calendar</Link> page for the full liturgical calendar. You can also opt in to a daily verse email from{" "}
                        <Link href="/settings" className="text-primary hover:underline underline-offset-4">Settings</Link>.
                    </p>
                </Section>

                {/* ACCOUNT & PROGRESS */}
                <Section title="Account & Progress" icon={User}>
                    <p className="text-sm font-mono text-muted-foreground leading-relaxed">
                        Reading progress is tracked automatically without an account. Sign in to sync your library across devices.
                    </p>
                    <ul className="space-y-2">
                        <Bullet>Your daily reading streak is shown on the home screen.</Bullet>
                        <Bullet>An activity heatmap on your profile shows reading frequency over the past year.</Bullet>
                        <Bullet>Full reading history is logged per chapter with time-on-page tracking.</Bullet>
                        <Bullet>Highlights and notes sync to your account and are accessible from any device.</Bullet>
                    </ul>
                    <Link href="/profile" className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:underline underline-offset-4 mt-2">
                        <User className="h-3 w-3" /> view profile
                    </Link>
                </Section>

            </div>
        </motion.div>
    )
}
