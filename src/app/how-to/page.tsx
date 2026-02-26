"use client"

import { HelpCircle, Keyboard, Eye, Palette, BookOpen, PenTool, Command, ArrowLeft, ArrowRight, Search, Library, Settings, User, ImageIcon, Church } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

// Section helper (matches Settings/Profile styling)
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

// Keyboard shortcut display
const Shortcut = ({ action, keys }: { action: string, keys: string }) => (
    <div className="flex items-center justify-between gap-4 py-1">
        <span className="text-sm text-muted-foreground">{action}</span>
        <kbd className="bg-muted px-2 py-0.5 rounded border border-border text-xs font-mono">{keys}</kbd>
    </div>
)

// Feature card
const Feature = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => (
    <div className="bg-secondary/10 border border-border/50 rounded-[2px] p-4 space-y-2">
        <div className="flex items-center gap-2 text-primary">
            <Icon className="h-4 w-4" />
            <span className="font-mono text-sm font-bold">{title}</span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
)

// GIF placeholder for future demo recordings
const GifPlaceholder = ({ label }: { label: string }) => (
    <div className="mt-4 rounded-[2px] border border-dashed border-border/50 bg-secondary/5 aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
        <ImageIcon className="h-8 w-8" />
        <span className="text-xs font-mono">{label} demo</span>
    </div>
)

export default function HowToPage() {
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
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        OpenWrit is designed for focused, distraction-free Bible reading. Navigate to any book and chapter using the toolbar or command menu, then simply read. Your progress is automatically saved.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Feature
                            icon={BookOpen}
                            title="Start Reading"
                            description="Click 'Start Reading' on the home page or use the navigation to jump to any book and chapter."
                        />
                        <Feature
                            icon={Library}
                            title="Save Highlights"
                            description="Select any text while reading to highlight it. Your highlights are saved to your library."
                        />
                    </div>
                </Section>

                {/* DAILY READINGS */}
                <Section title="Daily Readings" icon={Church}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Stay connected with the daily liturgical rhythm of the Church:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li><strong className="text-foreground">Liturgical Calendar:</strong> Follow daily feast days, seasons, and liturgical colors displayed directly on your dashboard.</li>
                        <li><strong className="text-foreground">Curated Passages:</strong> Read selected scriptural passages aligned with the Church's daily rhythm right from the home page.</li>
                        <li><strong className="text-foreground">Progress Tracking:</strong> A clean progress indicator helps you track how much of the daily reading you've completed.</li>
                    </ul>
                </Section>

                {/* KEYBOARD SHORTCUTS */}
                <Section title="Keyboard Shortcuts" icon={Keyboard}>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        Navigate quickly with these keyboard shortcuts:
                    </p>
                    <div className="bg-secondary/10 border border-border/50 rounded-[2px] p-4 space-y-2">
                        <Shortcut action="Next Chapter" keys="→ Right Arrow" />
                        <Shortcut action="Previous Chapter" keys="← Left Arrow" />
                        <Shortcut action="Open Command Menu" keys="⌘ + K" />
                        <Shortcut action="Search" keys="⌘ + K → type query" />
                    </div>
                </Section>

                {/* FOCUS MODE */}
                <Section title="Focus Mode" icon={Eye}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Toggle <strong className="text-foreground">Focus Mode</strong> from the footer to hide all UI elements except the text. The interface gracefully fades away, leaving only Scripture. Move your mouse to reveal controls when needed.
                    </p>
                    <div className="text-xs text-muted-foreground/60 font-mono">
                        Tip: Perfect for extended reading sessions without visual distractions.
                    </div>
                </Section>

                {/* THEMES & CUSTOMIZATION */}
                <Section title="Themes & Customization" icon={Palette}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Personalize your reading experience with multiple themes and typography options:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li><strong className="text-foreground">Theme:</strong> Click the theme name in the footer to cycle palettes (standard, sepia, terminal, midnight, etc.)</li>
                        <li><strong className="text-foreground">Font:</strong> Choose between sans, serif, or mono typefaces in Settings</li>
                        <li><strong className="text-foreground">Size:</strong> Adjust font size to your preference</li>
                        <li><strong className="text-foreground">Verse Numbers:</strong> Show or hide verse numbers for cleaner reading</li>
                        <li><strong className="text-foreground">Red Letters:</strong> Highlight the words of Christ in red</li>
                    </ul>
                    <Link href="/settings" className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:underline underline-offset-4 mt-2">
                        <Settings className="h-3 w-3" /> open settings
                    </Link>
                </Section>

                {/* TRANSLATIONS */}
                <Section title="Bible Translations" icon={BookOpen}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        OpenWrit provides access to multiple Bible translations. Switch translations instantly via the command menu or the translation selector on the read page. Set your default preferred translation in settings (e.g. NRSV-CE, ASV, etc.).
                    </p>
                </Section>

                {/* HIGHLIGHTS & LIBRARY */}
                <Section title="Highlights & Library" icon={PenTool}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Build your personal collection of meaningful passages:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Select any verse or passage while reading</li>
                        <li>Choose a highlight color from the popup menu</li>
                        <li>Optionally add a note (coming soon)</li>
                        <li>Access all highlights in your <Link href="/library" className="text-primary hover:underline underline-offset-4">Library</Link></li>
                    </ol>
                    <p className="text-xs text-muted-foreground/60 font-mono mt-2">
                        Highlights sync across devices when signed in.
                    </p>
                </Section>

                {/* COMMAND MENU */}
                <Section title="Command Menu" icon={Command}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Press <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border text-xs font-mono">⌘ + K</kbd> anywhere to open the command menu. From here you can:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>Jump to any book or chapter instantly</li>
                        <li>Search for keywords or phrases</li>
                        <li>Switch translations</li>
                        <li>Access settings and other pages</li>
                    </ul>
                </Section>

                {/* ACCOUNT & PROGRESS */}
                <Section title="Account & Progress" icon={User}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Create an account to unlock cloud sync and track your reading journey:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Feature
                            icon={Library}
                            title="Cloud Sync"
                            description="Access your highlights, wisdom, and reading history across all your devices."
                        />
                        <Feature
                            icon={User}
                            title="Activity Tracking"
                            description="View your reading history through an interactive heatmap and activity chart on your profile."
                        />
                        <Feature
                            icon={BookOpen}
                            title="Reading Streaks"
                            description="Maintain a daily reading streak, visible on your home dashboard."
                        />
                        <Feature
                            icon={ImageIcon}
                            title="Personalization"
                            description="Upload a custom profile photo to make your account your own."
                        />
                    </div>
                    <Link href="/profile" className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:underline underline-offset-4 mt-2">
                        <User className="h-3 w-3" /> view profile
                    </Link>
                </Section>

                {/* Footer */}
                <div className="pt-8 border-t border-border/30 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono opacity-50">
                        openwrit • minimalist bible reader
                    </p>
                </div>

            </div>
        </motion.div>
    )
}
