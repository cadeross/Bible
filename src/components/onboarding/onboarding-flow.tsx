"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useReadingPreferences } from "@/contexts/reading-preferences";
import { useTheme } from "next-themes";
import { ArrowRight, Check, ChevronRight, Moon, Sun, Monitor, Type } from "lucide-react";
import { toast } from "sonner";

import { getAllTranslations } from "@/lib/bible-api";

type Step = 'welcome' | 'identity' | 'preferences' | 'content' | 'review' | 'complete';

export function OnboardingFlow() {
    const [step, setStep] = useState<Step>('welcome');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Identity State
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");

    // Preferences State
    const { fontFamily, setFontFamily, setFontSize, palette, setPalette, bibleVersion, setBibleVersion } = useReadingPreferences();
    const { theme, setTheme } = useTheme();

    // Content State
    const [versions, setVersions] = useState<any[]>([]);
    const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: true });

    useEffect(() => {
        getAllTranslations().then(setVersions);
    }, []);

    const TopScrollFade = ({ visible }: { visible: boolean }) => (
        <div className={`absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none transition-opacity duration-300 z-10 ${visible ? 'opacity-100' : 'opacity-0'}`} />
    );

    const BottomScrollFade = ({ visible }: { visible: boolean }) => (
        <div className={`absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none transition-opacity duration-300 z-10 ${visible ? 'opacity-100' : 'opacity-0'}`} />
    );

    // Review/Commitment State
    const [dailyVerse, setDailyVerse] = useState(true);
    const [updates, setUpdates] = useState(true);

    // Initial Data Load
    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Pre-fill if exists (e.g. from temp signup)
                if (user.user_metadata?.username && !user.user_metadata.username.includes("@")) {
                    setUsername(user.user_metadata.username);
                }
                if (user.user_metadata?.first_name) setFirstName(user.user_metadata.first_name);
            }
        };
        loadUser();
    }, []);

    const steps: Step[] = ['welcome', 'identity', 'preferences', 'content', 'review', 'complete'];
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
        const { error } = await supabase.auth.updateUser({
            data: {
                username,
                first_name: firstName,
                receive_updates: updates,
                daily_verse_emails: dailyVerse,
                is_onboarded: true,
                onboarded_at: new Date().toISOString()
            }
        });

        if (error) {
            toast.error("Failed to save profile", { description: error.message });
            setLoading(false);
            return;
        }

        setStep('complete');
        setLoading(false);

        // Wait a moment then redirect
        setTimeout(() => {
            router.push('/');
            router.refresh();
        }, 1500);
    };

    const variants = {
        enter: { opacity: 0, x: 20, filter: 'blur(4px)' },
        center: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, x: -20, filter: 'blur(4px)' }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono text-sm max-w-2xl mx-auto w-full">

            {/* Progress Indicator */}
            <div className="fixed top-0 left-0 w-full h-1 bg-secondary/20">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                />
            </div>

            {/* Step Counter */}
            <div className="absolute top-8 right-8 text-xs text-muted-foreground">
                step {currentStepIndex + 1} / {steps.length}
            </div>

            <main className="w-full max-w-md z-10">
                <AnimatePresence mode="wait">
                    {step === 'welcome' && (
                        <motion.div
                            key="welcome"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="space-y-8 text-left"
                        >
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight text-primary">welcome.</h1>
                                <p className="text-muted-foreground leading-relaxed">
                                    let's configure your reading environment. <br />
                                    takes less than a minute.
                                </p>
                            </div>
                            <Button onClick={handleNext} className="group gap-2" size="lg">
                                start setup <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    )}

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
                                <h2 className="text-2xl font-bold text-primary">identity</h2>
                                <p className="text-muted-foreground text-xs">how should we call you?</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>username</Label>
                                    <Input
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        placeholder="user"
                                        className="bg-secondary/10 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>display name <span className="text-muted-foreground opacity-50">(optional)</span></Label>
                                    <Input
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="Reader"
                                        className="bg-secondary/10 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleNext} disabled={!username}>continue</Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'preferences' && (
                        <motion.div
                            key="preferences"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">appearance</h2>
                                <p className="text-muted-foreground text-xs">customize your reading experience</p>
                            </div>

                            <div className="space-y-6">
                                {/* Mode */}
                                <div className="space-y-3">
                                    <Label>mode</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'system', icon: Monitor, label: 'system' },
                                            { value: 'light', icon: Sun, label: 'light' },
                                            { value: 'dark', icon: Moon, label: 'dark' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setTheme(opt.value)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all h-20 ${theme === opt.value ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'}`}
                                            >
                                                <opt.icon className="w-4 h-4 mb-2 opacity-70" />
                                                <span className="text-[10px] font-medium">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Palette */}
                                <div className="space-y-3">
                                    <Label>palette</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { value: 'standard', label: 'Standard', color: '#ffffff', primary: '#1a1a1a', border: '#e5e5e5' },
                                            { value: 'terminal', label: 'Terminal', color: '#000000', primary: '#00ff41', border: '#33cc33' },
                                            { value: 'solarized', label: 'Solarized', color: '#fdf6e3', primary: '#b58900', border: '#e5e5e5' },
                                            { value: 'sepia', label: 'Sepia', color: '#f8f4e5', primary: '#433422', border: '#e5e5e5' },
                                            { value: 'midnight', label: 'Midnight', color: '#0f172a', primary: '#38bdf8', border: '#94a3b8' },
                                            { value: 'lavender', label: 'Lavender', color: '#f3e8ff', primary: '#9333ea', border: '#c084fc' },
                                            { value: 'rose', label: 'Rose', color: '#fff1f2', primary: '#be123c', border: '#fda4af' },
                                            { value: 'oled', label: 'OLED', color: '#000000', primary: '#ffffff', border: '#333333' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                // @ts-ignore
                                                onClick={() => setPalette(opt.value)}
                                                className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all h-24 group ${palette === opt.value ? 'bg-primary/5 border-primary shadow-sm' : 'bg-secondary/5 border-transparent hover:bg-secondary/10'}`}
                                            >
                                                {/* Elegant Split Preview */}
                                                <div
                                                    className={`w-8 h-8 rounded-full mb-2 shadow-md ring-2 transition-transform duration-300 group-hover:scale-110 ${palette === opt.value ? 'ring-primary ring-offset-2' : 'ring-transparent'}`}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${opt.color} 50%, ${opt.primary} 50%)`,
                                                        borderColor: opt.border
                                                    }}
                                                />
                                                <span className={`text-[10px] font-medium transition-colors ${palette === opt.value ? 'text-primary' : 'text-muted-foreground'}`}>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Typography */}
                                <div className="space-y-3">
                                    <Label>typography</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setFontFamily('sans')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all h-24 ${fontFamily === 'sans' ? 'bg-primary/5 border-primary text-primary' : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'}`}
                                        >
                                            <span className="font-sans text-2xl mb-1">Ag</span>
                                            <span className="text-[10px] opacity-70">Sans</span>
                                        </button>
                                        <button
                                            onClick={() => setFontFamily('serif')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all h-24 ${fontFamily === 'serif' ? 'bg-primary/5 border-primary text-primary' : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'}`}
                                        >
                                            <span className="font-serif text-2xl mb-1">Ag</span>
                                            <span className="text-[10px] opacity-70">Serif</span>
                                        </button>
                                        <button
                                            onClick={() => setFontFamily('mono')}
                                            className={`flex flex-col items-center justify-center p-3 rounded-md border transition-all h-24 ${fontFamily === 'mono' ? 'bg-primary/5 border-primary text-primary' : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'}`}
                                        >
                                            <span className="font-mono text-2xl mb-1">Ag</span>
                                            <span className="text-[10px] opacity-70">Mono</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleNext}>continue</Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'content' && (
                        <motion.div
                            key="content"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">content</h2>
                                <p className="text-muted-foreground text-xs">choose your preferred translation</p>
                            </div>

                            <div className="relative group">
                                {/* Top Fade Triggered by scroll state (managed by simple CSS classes for now or just stick absolute) */}
                                {/* Let's use simple opacity transition based on JS state if possible, but for now just permanent or sticky? */}
                                {/* User specifically asked for "when you scroll down". Simple way: 
                                    Use a small React state for scroll position? Yes.
                                */}
                                <TopScrollFade visible={scrollState.canScrollUp} />

                                <div
                                    className="space-y-4 h-[320px] overflow-y-auto pr-2 -mr-2 scrollbar-hide pb-12 pt-2"
                                    onScroll={(e) => {
                                        const target = e.currentTarget;
                                        setScrollState({
                                            canScrollUp: target.scrollTop > 10,
                                            canScrollDown: target.scrollTop < target.scrollHeight - target.clientHeight - 10
                                        });
                                    }}
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        {versions.length > 0 ? versions.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setBibleVersion(v.id)}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left h-full ${bibleVersion === v.id ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/5 border-transparent text-muted-foreground hover:bg-secondary/10'}`}
                                            >
                                                <div className="w-full">
                                                    <div className="font-semibold text-xs mb-0.5">{v.abbreviation?.toUpperCase() || v.id.toUpperCase()}</div>
                                                    <div className="text-[10px] opacity-70 truncate w-full">{v.name}</div>
                                                </div>
                                                {bibleVersion === v.id && <Check className="w-3 h-3 ml-1 shrink-0" />}
                                            </button>
                                        )) : (
                                            <div className="col-span-2 text-center py-10 text-muted-foreground animate-pulse">loading versions...</div>
                                        )}
                                    </div>
                                </div>
                                <BottomScrollFade visible={scrollState.canScrollDown} />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleNext}>continue</Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'review' && (
                        <motion.div
                            key="review"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-primary">commitments</h2>
                                <p className="text-muted-foreground text-xs">stay consistent with updates</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3 p-4 bg-secondary/5 border border-border/40 rounded-lg hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setDailyVerse(!dailyVerse)}>
                                    <Checkbox checked={dailyVerse} onCheckedChange={(c) => setDailyVerse(!!c)} />
                                    <div className="space-y-1">
                                        <Label className="cursor-pointer">daily wisdom</Label>
                                        <p className="text-xs text-muted-foreground">receive a thoughtfully curated verse every morning.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-4 bg-secondary/5 border border-border/40 rounded-lg hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setUpdates(!updates)}>
                                    <Checkbox checked={updates} onCheckedChange={(c) => setUpdates(!!c)} />
                                    <div className="space-y-1">
                                        <Label className="cursor-pointer">product updates</Label>
                                        <p className="text-xs text-muted-foreground">occasional emails about new features and improvements.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">back</Button>
                                <Button onClick={handleComplete} disabled={loading} className="w-32">
                                    {loading ? "saving..." : "finish"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'complete' && (
                        <motion.div
                            key="complete"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            className="space-y-8 text-center py-12"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary"
                            >
                                <Check className="w-10 h-10" />
                            </motion.div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-primary">all set.</h2>
                                <p className="text-muted-foreground">redirecting you to the library...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Background Decorations */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        </div>
    );
}
