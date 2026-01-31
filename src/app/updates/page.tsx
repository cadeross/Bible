"use client"

import { GitBranch, History } from "lucide-react"
import { motion } from "framer-motion"

// Reusing Section component for consistency with HowTo page
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

const UpdateItem = ({ version, date, children }: { version: string, date: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-primary">{version}</span>
            <span className="text-xs text-muted-foreground/50 font-mono">{date}</span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed font-mono">
            {children}
        </p>
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
            <div className="flex items-center gap-4 border-b border-border/50 pb-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <GitBranch className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight font-mono text-primary">updates</h1>
                    <p className="text-muted-foreground text-xs font-mono">
                        version history and changelog
                    </p>
                </div>
            </div>

            <div className="grid gap-12">
                <Section title="Version History" icon={History}>
                    <UpdateItem version="v1.0.0" date="Today">
                        Initial release. Includes type-to-search command menu, red letter support for Christ's words, and a polished monkeytype-inspired design system.
                    </UpdateItem>

                    <UpdateItem version="v0.9.0" date="Yesterday">
                        Added offline support and improved reading typography. Implemented smooth scrolling and chapter navigation.
                    </UpdateItem>
                </Section>
            </div>
        </motion.div>
    )
}
