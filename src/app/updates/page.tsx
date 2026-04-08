"use client"

import { History, BookOpen, Palette, Languages, Navigation, User, Church, Wrench, Zap } from "lucide-react"
import { motion } from "framer-motion"

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            <Icon className="h-3.5 w-3.5" />
            {title}
        </h2>
        <div className="space-y-6">
            {children}
        </div>
    </div>
)

const FeatureGroup = ({ label, items }: { label: string, items: string[] }) => (
    <div className="space-y-2.5">
        <p className="text-xs font-medium text-foreground/60">{label}</p>
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30" />
                    {item}
                </li>
            ))}
        </ul>
    </div>
)

export default function UpdatesPage() {
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
                    Updates
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Version history and changelog
                </p>
            </div>

            <div className="grid gap-12">

                {/* Version 1.0.2 */}
                <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-foreground">v1.0.2</span>
                    <span className="text-xs text-muted-foreground/60">Mar 2026</span>
                    <div className="flex-1 h-px bg-border/20" />
                </div>

                <Section title="Account" icon={User}>
                    <FeatureGroup
                        label="Password reset"
                        items={[
                            "Forgot your password? You can now request a reset link directly from the login page.",
                            "A secure reset email is sent to your address with a one-time link to set a new password.",
                            "After resetting, you are automatically signed in and returned to the app.",
                        ]}
                    />
                </Section>

                <Section title="Profile" icon={User}>
                    <FeatureGroup
                        label="Edit profile"
                        items={[
                            "Editing your username and email now opens in a clean modal dialog instead of replacing your profile header inline.",
                            "Dialog entrance and exit animations are smoother and faster.",
                        ]}
                    />
                    <FeatureGroup
                        label="Stats"
                        items={[
                            "Reading streak now correctly reads \"1 day\" instead of \"1 days\".",
                        ]}
                    />
                </Section>

                <Section title="Fixes" icon={Wrench}>
                    <FeatureGroup
                        label="Navigation"
                        items={[
                            "Active navigation tabs use a soft blue selection state with clear contrast in both light and dark mode.",
                            "Hover effects across the header, footer, and mobile nav are now visually consistent.",
                            "Footer links for How To and Updates now highlight correctly when those pages are active.",
                        ]}
                    />
                </Section>

                {/* Version 1.0.1 */}
                <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-foreground">v1.0.1</span>
                    <span className="text-xs text-muted-foreground/60">Mar 2026</span>
                    <div className="flex-1 h-px bg-border/20" />
                </div>

                <Section title="Personalization" icon={Palette}>
                    <FeatureGroup
                        label="Themes"
                        items={[
                            "Unified Things 3–inspired light and dark appearance (system sync).",
                            "Removed multi-palette themes in favor of a single refined visual language.",
                        ]}
                    />
                    <FeatureGroup
                        label="Legibility"
                        items={[
                            "Full legibility audit across all text in the app.",
                            "Improved contrast, sizing, and spacing throughout for a more comfortable reading experience.",
                        ]}
                    />
                </Section>

                <Section title="Profile" icon={User}>
                    <FeatureGroup
                        label="Stats"
                        items={[
                            "Time read, chapters, and words now show this week's activity instead of all-time totals.",
                            "Week-over-week comparison is now accurate: current week vs. the previous seven days.",
                        ]}
                    />
                </Section>

                <Section title="Performance" icon={Zap}>
                    <FeatureGroup
                        label="Daily readings"
                        items={[
                            "Mass readings are now pre-fetched on the server and cached hourly, with improved loading times across the app.",
                            "If the USCCB is temporarily unreachable, the last successful reading is shown rather than an empty screen.",
                        ]}
                    />
                </Section>

                <Section title="Fixes" icon={Wrench}>
                    <FeatureGroup
                        label="Reading"
                        items={[
                            "Chapter navigation no longer causes a full page reload. Transitions are now handled entirely client-side.",
                        ]}
                    />
                    <FeatureGroup
                        label="General"
                        items={[
                            "Fixed a favicon flash on initial load where the wrong icon briefly appeared before switching to the correct theme-aware version.",
                            "Resolved a hydration mismatch in the reading view that could cause a flicker on first render.",
                        ]}
                    />
                </Section>

                {/* Version 1.0.0 */}
                <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-foreground">v1.0.0</span>
                    <span className="text-xs text-muted-foreground/60">Initial release</span>
                    <div className="flex-1 h-px bg-border/20" />
                </div>

                <Section title="Reading" icon={BookOpen}>
                    <FeatureGroup
                        label="Reader"
                        items={[
                            "Clean, distraction-free reading view with smooth chapter transitions.",
                            "Focus mode (Alt+F) hides all chrome for an uninterrupted reading experience.",
                            "Adjustable font family: sans, serif, mono, and round.",
                            "Adjustable font size from 12px to 32px.",
                            "Adjustable line height for comfortable long-form reading.",
                            "Section titles and headings displayed inline with the text.",
                            "Verse numbers can be toggled on or off.",
                            "Keyboard navigation with arrow keys to move between chapters.",
                        ]}
                    />
                    <FeatureGroup
                        label="Red Letter"
                        items={[
                            "Words of Christ highlighted in red across the New Testament.",
                            "Toggle red letters on or off per your preference.",
                        ]}
                    />
                    <FeatureGroup
                        label="Annotation"
                        items={[
                            "Click any verse to apply a quick highlight in your default color.",
                            "Right-click or long-press to open the annotation menu.",
                            "Six highlight colors: yellow, green, blue, pink, purple, and orange.",
                            "Inline notes attached to any verse or range of verses.",
                            "Share a specific verse or selection via a direct link.",
                            "Highlights and notes persist locally and sync to your account.",
                        ]}
                    />
                </Section>

                <Section title="Translations" icon={Languages}>
                    <FeatureGroup
                        label="Available versions"
                        items={[
                            "New Revised Standard Version, Catholic Edition (NRSVCE), default, full deuterocanon.",
                            "Douay-Rheims 1899 American Edition (DRA), full Catholic canon, served locally.",
                            "Bíblia da CNBB (CNBB), Portuguese Catholic Bible.",
                            "World English Bible (WEB)",
                            "King James Version (KJV)",
                            "American Standard Version (ASV)",
                            "Bible in Basic English (BBE)",
                            "Darby Bible (Darby)",
                            "Christian Standard Bible (CSB)",
                            "New International Version (NIV)",
                            "New King James Version (NKJV)",
                            "New Living Translation (NLT)",
                            "Good News Translation (GNT)",
                            "Revised Version (RV)",
                        ]}
                    />
                </Section>

                <Section title="Personalization" icon={Palette}>
                    <FeatureGroup
                        label="Themes"
                        items={[
                            "Light, dark, and system-synced modes.",
                            "Minimal, Things-inspired interface with no separate color palettes.",
                        ]}
                    />
                    <FeatureGroup
                        label="Settings"
                        items={[
                            "All reading preferences saved locally and restored on every visit.",
                            "Set a default Bible translation applied across the entire app.",
                            "Set a default highlight color for one-click annotations.",
                            "Reset all preferences to defaults at any time.",
                        ]}
                    />
                </Section>

                <Section title="Navigation" icon={Navigation}>
                    <FeatureGroup
                        label="Command menu"
                        items={[
                            "Start typing from anywhere in the app to instantly open the command menu.",
                            "Type any book name or chapter reference to jump directly to it.",
                        ]}
                    />
                    <FeatureGroup
                        label="In-reader toolbar"
                        items={[
                            "Quick book and chapter selectors at the top of every chapter.",
                            "Switch translations inline without leaving the current passage.",
                            "Font and display controls accessible directly from the reading view.",
                        ]}
                    />
                    <FeatureGroup
                        label="Continue reading"
                        items={[
                            "The home screen remembers where you left off and offers a one-tap resume.",
                        ]}
                    />
                </Section>

                <Section title="Liturgical" icon={Church}>
                    <FeatureGroup
                        label="Daily readings"
                        items={[
                            "Today's USCCB Mass readings displayed on the home screen.",
                            "Full liturgical calendar with feast days, seasons, and ranks.",
                            "Optional daily verse email delivered each morning.",
                        ]}
                    />
                </Section>

                <Section title="Profile & Progress" icon={User}>
                    <FeatureGroup
                        label="Tracking"
                        items={[
                            "Daily reading streak based on active reading sessions.",
                            "Activity heatmap showing reading frequency over the past year.",
                            "Full reading history with time-on-page tracking per chapter.",
                        ]}
                    />
                    <FeatureGroup
                        label="Library"
                        items={[
                            "All highlights and notes collected in one place under Library.",
                            "Create an account to sync your library across devices.",
                        ]}
                    />
                </Section>

            </div>
        </motion.div>
    )
}
