"use client";

import { motion } from "framer-motion";
import {
    BookOpen,
    Heart,
    Sparkles,
    Code2,
    Coffee,
    Zap,
    Info
} from "lucide-react";
import Link from "next/link";

// Section helper (matches Settings/Profile styling)
const Section = ({ title, icon: Icon, children }: { title: string, icon?: React.ElementType, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            {Icon ? <Icon className="h-3 w-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />}
            {title}
        </h2>
        <div className="pl-4 border-l border-border/40 space-y-4">
            {children}
        </div>
    </div>
)

export default function AboutPage() {
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
                        ABOUT
                    </h1>
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                        the story behind openwrit
                    </p>
                </div>
            </div>

            <div className="grid gap-12">
                {/* Story */}
                <Section title="The Story" icon={BookOpen}>
                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                        <p>
                            OpenWrit was born from a simple desire: to read Scripture without distractions.
                            No cluttered interfaces, no overwhelming features—just the timeless words
                            that have guided humanity for millennia, presented with the care they deserve.
                        </p>
                        <p>
                            We believe that reading the Bible should feel like a sacred moment, not
                            a wrestling match with technology. Every pixel, every interaction has been
                            thoughtfully designed to get out of your way and let the text speak.
                        </p>
                        <p>
                            Built with love by a small team who believes that the best tools are the ones
                            you forget you're using. OpenWrit is our gift to fellow readers who crave
                            simplicity and beauty in their daily reading.
                        </p>
                    </div>

                    {/* Quote */}
                    <blockquote className="border-l-2 border-primary/30 pl-4 py-2 italic text-muted-foreground">
                        "Your word is a lamp to my feet and a light to my path."
                        <footer className="mt-2 text-xs font-mono text-muted-foreground/60 not-italic">
                            — Psalm 119:105
                        </footer>
                    </blockquote>
                </Section>

                {/* Values */}
                <Section title="What We Believe" icon={Heart}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[
                            { icon: Zap, title: "Simplicity first", description: "Less is more. Every feature earns its place." },
                            { icon: BookOpen, title: "Content is king", description: "The text is the hero. Everything else supports it." },
                            { icon: Coffee, title: "Craft matters", description: "Details aren't details—they make the product." },
                            { icon: Code2, title: "Always improving", description: "We listen, learn, and iterate constantly." },
                        ].map((value) => (
                            <div key={value.title} className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-primary">
                                    <value.icon className="h-4 w-4" />
                                    <span className="font-mono text-sm font-bold">{value.title}</span>
                                </div>
                                <p className="text-muted-foreground text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Get Involved */}
                <Section title="Get Involved" icon={Sparkles}>
                    <p className="text-sm text-muted-foreground">
                        Have ideas? We're all ears. Your feedback shapes the future of OpenWrit.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/features"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-mono text-sm hover:bg-primary/90 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Vote on features
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/30 text-muted-foreground rounded-lg font-mono text-sm hover:bg-secondary/50 transition-colors"
                        >
                            Say hello
                        </Link>
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-border/30 text-center">
                <p className="text-[10px] text-muted-foreground font-mono opacity-50">
                    made with ❤️ for readers everywhere
                </p>
            </div>
        </motion.div>
    );
}
