"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { BookOpen, Globe, Heart, Calendar, Highlighter, Palette } from "lucide-react";
import Link from "next/link";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 25,
        },
    },
};

const features = [
    { icon: Calendar, label: "daily readings" },
    { icon: Globe, label: "multiple translations" },
    { icon: Heart, label: "reading streaks" },
    { icon: Highlighter, label: "highlights & notes" },
    { icon: Palette, label: "beautiful themes" },
    { icon: BookOpen, label: "distraction-free reading" },
];

export default function AuthPage() {
    const router = useRouter();

    return (
        <motion.div
            className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Hero Branding */}
            <motion.div variants={itemVariants} className="text-center mb-12 space-y-4">
                <div className="space-y-2">
                    <h1 className="text-[10px] font-mono uppercase tracking-[0.5em] text-muted-foreground/60">
                        openwrit
                    </h1>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Scripture, thoughtfully presented.
                    </p>
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    A modern, beautiful Bible reading experience — designed for focus, built for daily devotion.
                </p>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div variants={itemVariants} className="mb-14">
                <div className="flex flex-wrap justify-center items-center gap-3 max-w-lg mx-auto">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.label}
                                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] border border-border/30 bg-secondary/5 hover:bg-secondary/10 hover:border-foreground/20 transition-all duration-300 cursor-default"
                            >
                                <Icon className="h-3 w-3 text-primary/50 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                                    {feature.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Auth Form */}
            <motion.div variants={itemVariants} className="w-full">
                <AuthTabs onSuccess={() => router.push("/")} />
            </motion.div>

            {/* Footer Link */}
            <motion.div variants={itemVariants} className="mt-10">
                <Link
                    href="/"
                    className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider hover:text-foreground transition-colors"
                >
                    ← back to home
                </Link>
            </motion.div>
        </motion.div>
    );
}
