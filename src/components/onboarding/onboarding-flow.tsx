"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useReadingPreferences } from "@/contexts/reading-preferences";
import { useTheme } from "next-themes";
import { Check, ChevronRight, Moon, Sun, Monitor, Search, Mail, BookOpen, Sparkles, Bug } from "lucide-react";
import { toast } from "sonner";
import { ParticlesBackground } from "./particles-background";
import { getAllTranslations } from "@/lib/bible-api";
import { cn } from "@/lib/utils";

// DEV MODE - Set to true to skip saving and bypass username checks
// const DEV_MODE = true;

type Step = 'welcome' | 'identity' | 'preferences' | 'content' | 'daily-wisdom' | 'complete';

// Sample Bible passages for preview
const PREVIEW_PASSAGES = [
    {
        reference: "John 1:1-5",
        verses: [
            { num: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
            { num: 2, text: "The same was in the beginning with God." },
            { num: 3, text: "All things were made by him; and without him was not any thing made that was made." },
            { num: 4, text: "In him was life; and the life was the light of men." },
            { num: 5, text: "And the light shineth in darkness; and the darkness comprehended it not." },
        ]
    },
    {
        reference: "Psalm 23:1-4",
        verses: [
            { num: 1, text: "The Lord is my shepherd; I shall not want." },
            { num: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
            { num: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
            { num: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me." },
        ]
    },
    {
        reference: "Romans 8:28-31",
        verses: [
            { num: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
            { num: 29, text: "For whom he did foreknow, he also did predestinate to be conformed to the image of his Son, that he might be the firstborn among many brethren." },
            { num: 30, text: "Moreover whom he did predestinate, them he also called: and whom he called, them he also justified: and whom he justified, them he also glorified." },
            { num: 31, text: "What shall we then say to these things? If God be for us, who can be against us?" },
        ]
    },
    {
        reference: "Philippians 4:6-7",
        verses: [
            { num: 6, text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." },
            { num: 7, text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
        ]
    },
];

export function OnboardingFlow() {
    const [step, setStep] = useState<Step>('welcome');
    const [loading, setLoading] = useState(false);
    const [devMode, setDevMode] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Identity State
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    // Preferences State
    const { fontFamily, setFontFamily, palette, setPalette, bibleVersion, setBibleVersion } = useReadingPreferences();
    const { theme, setTheme } = useTheme();

    // Content State
    const [versions, setVersions] = useState<any[]>([]);
    const [versionSearch, setVersionSearch] = useState("");
    const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: true });

    // Daily Wisdom State
    const [dailyWisdom, setDailyWisdom] = useState(true);

    // Preview State - random passage on mount only
    const [previewPassageIndex] = useState(() => Math.floor(Math.random() * PREVIEW_PASSAGES.length));

    // Load versions
    useEffect(() => {
        getAllTranslations().then(setVersions);
    }, []);

    // Debounced username availability check
    useEffect(() => {
        if (devMode) {
            setUsernameAvailable(true);
            return;
        }
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingUsername(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username.toLowerCase())
                .maybeSingle();

            setCheckingUsername(false);
            setUsernameAvailable(data === null);
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    // Filter versions by search
    const filteredVersions = useMemo(() => {
        if (!versionSearch.trim()) return versions;
        const search = versionSearch.toLowerCase();
        return versions.filter(v =>
            v.abbreviation?.toLowerCase().includes(search) ||
            v.name?.toLowerCase().includes(search)
        );
    }, [versions, versionSearch]);

    const steps: Step[] = ['welcome', 'identity', 'preferences', 'content', 'daily-wisdom', 'complete'];
    const currentStepIndex = steps.indexOf(step);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const handleNext = () => {
        const next = steps[currentStepIndex + 1];
        if (next) setStep(next);
    };

    const handleBack = () => {
        const prev = steps[currentStepIndex - 1];
        if (prev) setStep(prev);
    };

    const handleComplete = async () => {
        setLoading(true);

        if (devMode) {
            console.log('[DEV MODE] Skipping save - would have saved:', { username, dailyWisdom });
            setStep('complete');
            setLoading(false);
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 3000);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            data: {
                username,
                daily_verse_emails: dailyWisdom,
                is_onboarded: true,
                onboarded_at: new Date().toISOString()
            }
        });

        // Also update profile username
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from("profiles")
                .update({ username: username.toLowerCase() })
                .eq("id", user.id);
        }

        if (error) {
            toast.error("Failed to save profile", { description: error.message });
            setLoading(false);
            return;
        }

        setStep('complete');
        setLoading(false);

        // Slow transition to home
        setTimeout(() => {
            router.push('/');
            router.refresh();
        }, 3000);
    };

    const variants = {
        enter: { opacity: 0, x: 20, filter: 'blur(4px)' },
        center: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, x: -20, filter: 'blur(4px)' }
    };

    const getFontClass = (font: string) => {
        switch (font) {
            case "sans": return "font-sans";
            case "mono": return "font-mono";
            case "pixel": return "font-pixel";
            case "serif":
            default: return "font-serif";
        }
    };

    const currentPassage = PREVIEW_PASSAGES[previewPassageIndex];

    return (
        <div className="min-h-screen flex flex-col p-6 relative overflow-hidden font-mono text-sm max-w-2xl mx-auto w-full pt-24">

            {/* Progress Indicator */}
            <div className="fixed top-0 left-0 w-full h-1 bg-secondary/20 z-50">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                />
            </div>

            {/* Step Counter */}
            {step !== 'welcome' && step !== 'complete' && (
                <div className="fixed top-6 right-8 text-xs text-muted-foreground z-50">
                    step {currentStepIndex} / {steps.length - 1}
                </div>
            )}

            {/* Particles only on welcome */}
            {step === 'welcome' && <ParticlesBackground />}

            <main className={cn(
                "w-full z-10 transition-all duration-300",
                step === 'preferences' ? 'max-w-4xl' : 'max-w-lg'
            )}>
                <AnimatePresence mode="wait">
                    {/* WELCOME */}
                    {step === 'welcome' && (
                        <motion.div
                            key="welcome"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4 }}
                            className="space-y-10 text-left"
                        >
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.45em] text-muted-foreground/60"
                                >
                                    <span className="h-px w-8 bg-border" />
                                    openwrit
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl md:text-4xl font-semibold tracking-tight text-primary"
                                >
                                    Welcome to a focused scripture experience.
                                </motion.h1>

                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-muted-foreground leading-relaxed max-w-sm"
                                >
                                    let's set up your personal reading experience, it takes less than a minute.
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center gap-3"
                            >
                                <Button onClick={handleNext} size="lg" className="group gap-2 px-6">
                                    get started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <button
                                    onClick={() => setDevMode(!devMode)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono transition-all",
                                        devMode
                                            ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
                                            : "text-muted-foreground/30 hover:text-muted-foreground/50"
                                    )}
                                >
                                    <Bug className="w-3 h-3" />
                                    {devMode && "dev"}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* IDENTITY */}
                    {step === 'identity' && (
                        <motion.div
                            key="identity"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">choose your username</h2>
                                <p className="text-muted-foreground text-xs">this is how you'll be identified on OpenWrit</p>
                            </div>

                            <div className="space-y-2">
                                <Label>username</Label>
                                <div className="relative">
                                    <Input
                                        value={username}
                                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        placeholder="reader"
                                        className="bg-secondary/10 border-none focus-visible:ring-1 focus-visible:ring-primary/50 pr-10"
                                        autoFocus
                                        maxLength={20}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {checkingUsername && (
                                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        )}
                                        {!checkingUsername && usernameAvailable === true && (
                                            <Check className="w-4 h-4 text-green-500" />
                                        )}
                                        {!checkingUsername && usernameAvailable === false && (
                                            <span className="text-xs text-destructive">taken</span>
                                        )}
                                    </div>
                                </div>
                                {username.length > 0 && username.length < 3 && (
                                    <p className="text-xs text-muted-foreground">minimum 3 characters</p>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleNext} disabled={!username || username.length < 3 || !usernameAvailable}>continue</Button>
                            </div>
                        </motion.div>
                    )}

                    {/* PREFERENCES / APPEARANCE */}
                    {step === 'preferences' && (
                        <motion.div
                            key="preferences"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">appearance</h2>
                                <p className="text-muted-foreground text-xs">
                                    customize your reading experience. you can always change these in settings.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left Column - Options (fixed width) */}
                                <div className="space-y-5 w-full md:w-[320px] md:flex-shrink-0">
                                    {/* Mode */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">mode</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'system', icon: Monitor, label: 'system' },
                                                { value: 'light', icon: Sun, label: 'light' },
                                                { value: 'dark', icon: Moon, label: 'dark' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setTheme(opt.value)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-16",
                                                        theme === opt.value
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'
                                                    )}
                                                >
                                                    <opt.icon className="w-4 h-4 mb-1 opacity-70" />
                                                    <span className="text-[10px] font-medium">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Palette */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">palette</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { value: 'standard', label: 'Standard', bg: '#ffffff', fg: '#1a1a1a' },
                                                { value: 'terminal', label: 'Terminal', bg: '#000000', fg: '#00ff41' },
                                                { value: 'solarized', label: 'Solar', bg: '#fdf6e3', fg: '#b58900' },
                                                { value: 'sepia', label: 'Sepia', bg: '#f8f4e5', fg: '#433422' },
                                                { value: 'midnight', label: 'Midnight', bg: '#0f172a', fg: '#38bdf8' },
                                                { value: 'lavender', label: 'Lavender', bg: '#f3e8ff', fg: '#9333ea' },
                                                { value: 'rose', label: 'Rose', bg: '#fff1f2', fg: '#be123c' },
                                                { value: 'oled', label: 'OLED', bg: '#000000', fg: '#ffffff' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    // @ts-ignore
                                                    onClick={() => setPalette(opt.value)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16 group",
                                                        palette === opt.value
                                                            ? 'border-primary shadow-sm'
                                                            : 'border-transparent hover:border-border'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-8 h-8 rounded-full shadow-md transition-transform group-hover:scale-110 mb-1",
                                                            palette === opt.value && "ring-2 ring-primary ring-offset-2"
                                                        )}
                                                        style={{
                                                            background: `linear-gradient(135deg, ${opt.bg} 50%, ${opt.fg} 50%)`
                                                        }}
                                                    />
                                                    <span className="text-[9px] text-muted-foreground">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Typography */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">typeface</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { value: 'sans', label: 'Sans', className: 'font-sans' },
                                                { value: 'serif', label: 'Serif', className: 'font-serif' },
                                                { value: 'mono', label: 'Mono', className: 'font-mono' },
                                                { value: 'pixel', label: 'Round', className: 'font-pixel' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    // @ts-ignore
                                                    onClick={() => setFontFamily(opt.value)}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16",
                                                        fontFamily === opt.value
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'
                                                    )}
                                                >
                                                    <span className={cn("text-xl mb-0.5", opt.className)}>Ag</span>
                                                    <span className="text-[9px] opacity-70">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Preview */}
                                <div className="flex-1 flex flex-col space-y-2">
                                    <Label className="text-xs flex items-center gap-2">
                                        preview
                                        <span className="text-muted-foreground/50">• {currentPassage.reference}</span>
                                    </Label>
                                    <div className="p-5 rounded-lg border border-border/50 bg-card/50 h-[340px] overflow-y-auto">
                                        <div
                                            className={cn("text-sm leading-relaxed", getFontClass(fontFamily))}
                                            style={{ fontFamily: fontFamily === 'sans' ? 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' : undefined }}
                                        >
                                            {currentPassage.verses.map(v => (
                                                <span key={v.num}>
                                                    <sup className="text-primary/60 text-[10px] mr-0.5">{v.num}</sup>
                                                    {v.text}{" "}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleNext}>continue</Button>
                            </div>
                        </motion.div>
                    )}

                    {/* CONTENT / VERSION PICKER */}
                    {step === 'content' && (
                        <motion.div
                            key="content"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">translation</h2>
                                <p className="text-muted-foreground text-xs">
                                    pick your preferred version. you can switch anytime while reading.
                                </p>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={versionSearch}
                                    onChange={e => setVersionSearch(e.target.value)}
                                    placeholder="search by name or abbreviation..."
                                    className="pl-10 bg-secondary/10 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                />
                            </div>

                            <div className="relative">
                                {/* Scroll fades */}
                                <div className={cn(
                                    "absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10 transition-opacity",
                                    scrollState.canScrollUp ? 'opacity-100' : 'opacity-0'
                                )} />
                                <div className={cn(
                                    "absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10 transition-opacity",
                                    scrollState.canScrollDown ? 'opacity-100' : 'opacity-0'
                                )} />

                                <div
                                    className="space-y-2 h-[280px] overflow-y-auto pr-1 -mr-1 scrollbar-hide py-1"
                                    onScroll={(e) => {
                                        const target = e.currentTarget;
                                        setScrollState({
                                            canScrollUp: target.scrollTop > 10,
                                            canScrollDown: target.scrollTop < target.scrollHeight - target.clientHeight - 10
                                        });
                                    }}
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredVersions.length > 0 ? filteredVersions.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setBibleVersion(v.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                                                    bibleVersion === v.id
                                                        ? 'bg-primary/10 border-primary text-primary'
                                                        : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'
                                                )}
                                            >
                                                <div className="w-full min-w-0">
                                                    <div className="font-semibold text-xs mb-0.5">{v.abbreviation?.toUpperCase() || v.id.toUpperCase()}</div>
                                                    <div className="text-[10px] opacity-70 truncate">{v.name}</div>
                                                </div>
                                                {bibleVersion === v.id && <Check className="w-3 h-3 ml-1 shrink-0" />}
                                            </button>
                                        )) : (
                                            <div className="col-span-2 text-center py-10 text-muted-foreground">
                                                {versions.length === 0 ? (
                                                    <span className="animate-pulse">loading versions...</span>
                                                ) : (
                                                    "no versions match your search"
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleNext}>continue</Button>
                            </div>
                        </motion.div>
                    )}

                    {/* DAILY WISDOM */}
                    {step === 'daily-wisdom' && (
                        <motion.div
                            key="daily-wisdom"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">daily wisdom</h2>
                                <p className="text-muted-foreground text-xs">start each day with Scripture</p>
                            </div>

                            {/* Email Preview Mockup */}
                            <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
                                <div className="px-4 py-3 border-b border-border/40 bg-secondary/5">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>Daily Wisdom from OpenWrit</span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                        <span>Your verse for today</span>
                                    </div>
                                    <blockquote className="text-sm leading-relaxed border-l-2 border-primary/40 pl-4 italic">
                                        "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."
                                    </blockquote>
                                    <p className="text-xs text-muted-foreground">— Jeremiah 29:11</p>
                                    <div className="pt-2 border-t border-border/30">
                                        <p className="text-xs text-muted-foreground/70">
                                            Take a moment to reflect on these words as you begin your day.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Opt-in */}
                            <div
                                className="flex items-start space-x-3 p-4 bg-secondary/5 border border-border/40 rounded-lg hover:border-primary/40 transition-colors cursor-pointer"
                                onClick={() => setDailyWisdom(!dailyWisdom)}
                            >
                                <Checkbox checked={dailyWisdom} onCheckedChange={(c) => setDailyWisdom(!!c)} />
                                <div className="space-y-1">
                                    <Label className="cursor-pointer">receive daily wisdom emails</Label>
                                    <p className="text-xs text-muted-foreground">a thoughtfully curated verse delivered to your inbox each morning.</p>
                                </div>
                            </div>

                            <div className="flex justify-between pt-2">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleComplete} disabled={loading} className="w-28">
                                    {loading ? "saving..." : "finish"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* COMPLETE */}
                    {step === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="space-y-8 text-center py-20"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="space-y-4"
                            >
                                <h1 className="text-4xl font-bold tracking-tight text-primary">
                                    welcome to OpenWrit
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    {username}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5, duration: 1 }}
                                className="text-xs text-muted-foreground/50"
                            >
                                preparing your library...
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Background gradient */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        </div >
    );
}
