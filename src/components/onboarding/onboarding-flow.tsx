"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useReadingPreferences } from "@/contexts/reading-preferences";
import { useTheme } from "next-themes";
import { Check, ChevronRight, Moon, Sun, Monitor, Search, Mail, BookOpen, Sparkles, AtSign, ArrowLeft, Bug } from "lucide-react";
import { toast } from "sonner";
import { getAllTranslations } from "@/lib/bible-api";
import { cn } from "@/lib/utils";

type Step = 'identity' | 'preferences' | 'content' | 'complete';

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

// ── Subcomponents ──────────────────────────────────────────

/** Header matching the homepage typography */
const StepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="space-y-1 text-center max-w-md mx-auto mb-8">
        <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
            {title}
        </h2>
        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
            {subtitle}
        </p>
    </div>
);

/** Navigation footer — back (ghost) + continue (primary pill) */
const StepNav = ({
    onBack,
    onNext,
    nextLabel = "continue",
    nextDisabled = false,
    loading = false,
    showBack = true,
}: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    loading?: boolean;
    showBack?: boolean;
}) => (
    <div className="flex items-center justify-between pt-8 w-full max-w-md mx-auto">
        {showBack ? (
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60 uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
            >
                <ArrowLeft className="w-3 h-3" /> back
            </button>
        ) : (
            <div />
        )}
        <Button
            onClick={onNext}
            disabled={nextDisabled || loading}
            className="gap-2 text-xs font-mono uppercase tracking-[0.15em] h-10 px-6 rounded-[2px] cursor-pointer"
        >
            {loading ? "saving..." : nextLabel} <ChevronRight className="w-3.5 h-3.5" />
        </Button>
    </div>
);

/** Dot stepper progress at the bottom */
const StepDots = ({ steps, currentIndex }: { steps: Step[]; currentIndex: number }) => {
    // Don't show on welcome or complete
    const innerSteps = steps.slice(1, -1);
    const innerIndex = currentIndex - 1;
    if (currentIndex === 0 || currentIndex === steps.length - 1) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
            {innerSteps.map((s, i) => (
                <div
                    key={s}
                    className={cn(
                        "rounded-[2px] transition-all duration-300",
                        i === innerIndex
                            ? "w-6 h-1.5 bg-primary"
                            : i < innerIndex
                                ? "w-1.5 h-1.5 bg-primary/40"
                                : "w-1.5 h-1.5 bg-border"
                    )}
                />
            ))}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────

export function OnboardingFlow() {
    const [step, setStep] = useState<Step>('identity');
    const [loading, setLoading] = useState(false);
    const [devMode, setDevMode] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Identity
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);

    // Preferences
    const { fontFamily, setFontFamily, palette, setPalette, bibleVersion, setBibleVersion } = useReadingPreferences();
    const { theme, setTheme } = useTheme();

    // Content
    const [versions, setVersions] = useState<any[]>([]);
    const [versionSearch, setVersionSearch] = useState("");
    const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: true });

    // Preview passage — random on mount
    const [previewPassageIndex] = useState(() => Math.floor(Math.random() * PREVIEW_PASSAGES.length));

    // Load translations
    useEffect(() => {
        getAllTranslations().then(setVersions);
    }, []);

    // Debounced username availability check
    useEffect(() => {
        if (devMode) { setUsernameAvailable(true); return; }
        if (!username || username.length < 3) { setUsernameAvailable(null); return; }

        const timer = setTimeout(async () => {
            setCheckingUsername(true);
            const { data } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username.toLowerCase())
                .maybeSingle();
            setCheckingUsername(false);
            setUsernameAvailable(data === null);
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    // Filtered versions
    const filteredVersions = useMemo(() => {
        if (!versionSearch.trim()) return versions;
        const search = versionSearch.toLowerCase();
        return versions.filter(v =>
            v.abbreviation?.toLowerCase().includes(search) ||
            v.name?.toLowerCase().includes(search)
        );
    }, [versions, versionSearch]);

    const steps: Step[] = ['identity', 'preferences', 'content', 'complete'];
    const currentStepIndex = steps.indexOf(step);

    const handleNext = () => { const next = steps[currentStepIndex + 1]; if (next) setStep(next); };
    const handleBack = () => { const prev = steps[currentStepIndex - 1]; if (prev) setStep(prev); };

    const handleComplete = async () => {
        setLoading(true);

        if (devMode) {
            console.log('[DEV MODE] Skipping save for:', { username });
            setStep('complete');
            setLoading(false);
            setTimeout(() => { router.push('/'); router.refresh(); }, 3000);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            data: {
                username,
                daily_verse_emails: false,
                is_onboarded: true,
                onboarded_at: new Date().toISOString()
            }
        });

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
        setTimeout(() => { router.push('/'); router.refresh(); }, 3000);
    };

    const variants = {
        enter: { opacity: 0, y: 16, filter: 'blur(4px)' },
        center: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -16, filter: 'blur(4px)' }
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
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-16 relative font-mono text-sm">

            {/* Dot stepper */}
            <StepDots steps={steps} currentIndex={currentStepIndex} />

            <AnimatePresence mode="wait">



                {/* ── IDENTITY ────────────────────────── */}
                {step === 'identity' && (
                    <motion.div
                        key="identity"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35 }}
                        className="w-full max-w-md space-y-8"
                    >
                        <StepHeader
                            title="choose a username"
                            subtitle="this is how you'll be identified on OpenWrit"
                        />

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">
                                username
                            </Label>
                            <div className="relative group">
                                <AtSign className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="reader"
                                    autoFocus
                                    maxLength={20}
                                    className="w-full pl-6 pr-10 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                                />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    {checkingUsername && (
                                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    )}
                                    {!checkingUsername && usernameAvailable === true && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                    {!checkingUsername && usernameAvailable === false && (
                                        <span className="text-[10px] font-mono text-destructive uppercase tracking-wider">taken</span>
                                    )}
                                </div>
                            </div>
                            {username.length > 0 && username.length < 3 && (
                                <p className="text-[10px] text-muted-foreground/40 pt-1">minimum 3 characters</p>
                            )}
                        </div>

                        <StepNav
                            onBack={handleBack}
                            onNext={handleNext}
                            nextDisabled={!username || username.length < 3 || !usernameAvailable}
                        />
                    </motion.div>
                )}

                {/* ── PREFERENCES ─────────────────────── */}
                {step === 'preferences' && (
                    <motion.div
                        key="preferences"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35 }}
                        className="w-full max-w-3xl space-y-8"
                    >
                        <StepHeader
                            title="make it yours"
                            subtitle="customize your reading experience — you can always change these later in settings."
                        />

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Left — Options */}
                            <div className="space-y-6 w-full md:w-[300px] md:flex-shrink-0">

                                {/* Mode */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">mode</Label>
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
                                                    "flex flex-col items-center justify-center p-3 rounded-[2px] border border-border/20 transition-all duration-200 h-16 cursor-pointer",
                                                    theme === opt.value
                                                        ? 'bg-primary/10 border-primary/50 text-primary'
                                                        : 'bg-secondary/5 border-border/30 text-muted-foreground hover:bg-secondary/10 hover:border-border/60'
                                                )}
                                            >
                                                <opt.icon className="w-4 h-4 mb-1 opacity-70" />
                                                <span className="text-[9px] font-mono uppercase tracking-wider">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Palette */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">palette</Label>
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
                                                    "flex flex-col items-center justify-center p-2 rounded-[2px] border border-border/20 transition-all duration-200 h-16 group cursor-pointer",
                                                    palette === opt.value
                                                        ? 'border-primary/50 shadow-sm'
                                                        : 'border-border/20 hover:border-border/50'
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-7 h-7 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-110 mb-1",
                                                        palette === opt.value && "ring-1 ring-primary ring-offset-2 ring-offset-background"
                                                    )}
                                                    style={{ background: `linear-gradient(135deg, ${opt.bg} 50%, ${opt.fg} 50%)` }}
                                                />
                                                <span className="text-[8px] font-mono text-muted-foreground/70 uppercase tracking-wider">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Typeface */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono">typeface</Label>
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
                                                    "flex flex-col items-center justify-center p-2 rounded-[2px] border border-border/20 transition-all duration-200 h-16 cursor-pointer",
                                                    fontFamily === opt.value
                                                        ? 'bg-primary/10 border-primary/50 text-primary'
                                                        : 'bg-secondary/5 border-border/30 text-muted-foreground hover:bg-secondary/10 hover:border-border/60'
                                                )}
                                            >
                                                <span className={cn("text-xl mb-0.5", opt.className)}>Ag</span>
                                                <span className="text-[8px] font-mono opacity-60 uppercase tracking-wider">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right — Live Preview */}
                            <div className="flex-1 flex flex-col space-y-2.5 w-full">
                                <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-mono flex items-center gap-2">
                                    preview
                                    <span className="text-muted-foreground/30">• {currentPassage.reference}</span>
                                </Label>
                                <div className="p-6 rounded-[2px] border border-border/20 bg-card/30 h-[340px] overflow-y-auto">
                                    <div
                                        className={cn("text-sm leading-[1.9]", getFontClass(fontFamily))}
                                        style={{ fontFamily: fontFamily === 'sans' ? 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' : undefined }}
                                    >
                                        {currentPassage.verses.map(v => (
                                            <span key={v.num}>
                                                <sup className="text-primary/50 text-[10px] mr-0.5">{v.num}</sup>
                                                {v.text}{" "}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <StepNav onBack={handleBack} onNext={handleNext} />
                    </motion.div>
                )}

                {/* ── TRANSLATION ─────────────────────── */}
                {step === 'content' && (
                    <motion.div
                        key="content"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35 }}
                        className="w-full max-w-md space-y-8"
                    >
                        <StepHeader
                            title="pick your version"
                            subtitle="choose your preferred Bible translation — you can switch anytime while reading."
                        />

                        {/* Search — underline style */}
                        <div className="relative group">
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary/60 transition-colors" />
                            <input
                                value={versionSearch}
                                onChange={e => setVersionSearch(e.target.value)}
                                placeholder="search by name or abbreviation..."
                                className="w-full pl-6 pr-0 py-2.5 bg-transparent border-0 border-b border-border/50 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>

                        {/* Version list */}
                        <div className="relative">
                            <div className={cn(
                                "absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-background to-transparent pointer-events-none z-10 transition-opacity",
                                scrollState.canScrollUp ? 'opacity-100' : 'opacity-0'
                            )} />
                            <div className={cn(
                                "absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-background to-transparent pointer-events-none z-10 transition-opacity",
                                scrollState.canScrollDown ? 'opacity-100' : 'opacity-0'
                            )} />

                            <div
                                className="space-y-1.5 h-[260px] overflow-y-auto pr-1 -mr-1 scrollbar-hide py-1"
                                onScroll={(e) => {
                                    const target = e.currentTarget;
                                    setScrollState({
                                        canScrollUp: target.scrollTop > 10,
                                        canScrollDown: target.scrollTop < target.scrollHeight - target.clientHeight - 10
                                    });
                                }}
                            >
                                <div className="grid grid-cols-2 gap-1.5">
                                    {filteredVersions.length > 0 ? filteredVersions.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setBibleVersion(v.id)}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-[2px] border border-border/20 transition-all duration-200 text-left cursor-pointer",
                                                bibleVersion === v.id
                                                    ? 'bg-primary/10 border-primary/50 text-primary'
                                                    : 'bg-secondary/5 border-border/20 text-muted-foreground hover:bg-secondary/10 hover:border-border/50'
                                            )}
                                        >
                                            <div className="w-full min-w-0">
                                                <div className="font-semibold text-xs mb-0.5 font-mono">{v.abbreviation?.toUpperCase() || v.id.toUpperCase()}</div>
                                                <div className="text-[10px] opacity-60 truncate">{v.name}</div>
                                            </div>
                                            {bibleVersion === v.id && <Check className="w-3 h-3 ml-1 shrink-0" />}
                                        </button>
                                    )) : (
                                        <div className="col-span-2 text-center py-10 text-muted-foreground/50 text-xs">
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

                        <StepNav
                            onBack={handleBack}
                            onNext={handleComplete}
                            nextLabel="finish"
                            loading={loading}
                        />
                    </motion.div>
                )}

                {/* ── COMPLETE ────────────────────────── */}
                {step === 'complete' && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="flex flex-col items-center text-center space-y-6 py-20"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="space-y-1"
                        >
                            <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                                you're all set, {username}.
                            </h1>
                            <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                                preparing your reading experience
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                            className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 font-mono"
                        >
                            <BookOpen className="w-3 h-3" />
                            redirecting to home
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
