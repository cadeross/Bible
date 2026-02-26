"use client"

import { History, BookOpen, Palette, Languages, Navigation, User, Church } from "lucide-react"
import { motion } from "framer-motion"

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <Icon className="h-3 w-3" />
            {title}
        </h2>
        <div className="pl-4 border-l border-border/40 space-y-6">
            {children}
        </div>
    </div>
)

const FeatureGroup = ({ label, items }: { label: string, items: string[] }) => (
    <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">{label}</p>
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm font-mono text-muted-foreground leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
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
            <div className="flex flex-col items-center text-center gap-4 opacity-70 hover:opacity-100 transition-opacity mb-12">
                <div className="space-y-1">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        UPDATES
                    </h1>
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                        version history and changelog
                    </p>
                </div>
            </div>

            <div className="grid gap-12">

                {/* Version header */}
                <div className="flex items-center gap-4">
                    <span className="font-mono text-lg font-bold text-primary">v1.0.0</span>
                    <span className="text-xs text-muted-foreground/50 font-mono">initial release</span>
                    <div className="flex-1 h-px bg-border/30" />
                </div>

                <Section title="Reading" icon={BookOpen}>
                    <FeatureGroup
                        label="Reader"
                        items={[
                            "Clean, distraction-free reading view with smooth chapter transitions.",
                            "Focus mode (Alt+F) hides all chrome for an uninterrupted reading experience.",
                            "Adjustable font family — sans, serif, mono, and round.",
                            "Adjustable font size from 12px to 32px.",
                            "Adjustable line height for comfortable long-form reading.",
                            "Section titles and headings displayed inline with the text.",
                            "Verse numbers can be toggled on or off.",
                            "Keyboard navigation — arrow keys to move between chapters.",
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
                            "Five highlight colors: yellow, green, blue, pink, and purple.",
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
                            "New Revised Standard Version, Catholic Edition (NRSVCE) — default, full deuterocanon.",
                            "Douay-Rheims 1899 American Edition (DRA) — full Catholic canon, served locally.",
                            "Bíblia da CNBB (CNBB) — Portuguese Catholic Bible.",
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
                            "Eight color palettes: Standard, Terminal, Solarized, Sepia, Midnight, Lavender, Rose, and OLED.",
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
