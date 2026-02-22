"use client"

import { useTheme } from "next-themes"
import { useReadingPreferences, FontType, PaletteType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
// Settings page is preferences only for now.
import { Monitor, Moon, Sun, Type, Hash, Palette, User, Settings as SettingsIcon, PenTool, RotateCcw, Languages } from "lucide-react"
import Link from "next/link"
import { QuickSelector } from "@/components/reading/quick-selector"
import { TRANSLATIONS } from "@/lib/bible-api"
import { motion, AnimatePresence } from "framer-motion"

const HIGHLIGHT_COLORS = [
    { id: "yellow", class: "bg-yellow-500/30", border: "border-yellow-500/50" },
    { id: "green", class: "bg-green-500/30", border: "border-green-500/50" },
    { id: "blue", class: "bg-blue-500/30", border: "border-blue-500/50" },
    { id: "pink", class: "bg-pink-500/30", border: "border-pink-500/50" },
    { id: "purple", class: "bg-purple-500/30", border: "border-purple-500/50" },
]

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const {
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        showVerseNumbers,
        setShowVerseNumbers,
        redLetters,
        setRedLetters,
        defaultHighlightColor,
        setDefaultHighlightColor,
        palette,
        setPalette,
        bibleVersion,
        setBibleVersion,
        resetPreferences
    } = useReadingPreferences()


    // User State for Preferences
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

    const handleVerseEmailToggle = async (checked: boolean) => {
        if (!user) {
            toast.error("Please sign in to change this setting");
            return;
        }
        // Optimistic
        const updatedUser = { ...user, user_metadata: { ...user.user_metadata, daily_verse_emails: checked } };
        setUser(updatedUser);

        const { error } = await supabase.auth.updateUser({
            data: { daily_verse_emails: checked }
        });

        if (error) {
            toast.error("Failed to update preference");
            setUser(user); // revert
        } else {
            toast.success(checked ? "Subscribed to daily verses" : "Unsubscribed");
        }
    };

    // Helper for section groups
    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="space-y-4">
            <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {title}
            </h2>
            <div className="grid gap-4 pl-4 border-l border-border/40">
                {children}
            </div>
        </div>
    )

    // Helper for setting row
    const SettingRow = ({ label, description, children }: { label: string, description?: string, children: React.ReactNode }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="space-y-0.5">
                <label className="text-sm font-medium font-mono text-foreground/90">{label}</label>
                {description && <p className="text-[10px] text-muted-foreground font-mono">{description}</p>}
            </div>
            <div className="flex-shrink-0">
                {children}
            </div>
        </div>
    )

    // Toggle Button
    const Toggle = ({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon?: any }) => (
        <button
            onClick={onClick}
            className={cn(
                "group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all text-xs font-mono border select-none",
                active
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
            {active && <span className="absolute inset-0 border border-primary/20 rounded-sm pointer-events-none" />}
        </button>
    )

    // Group Button
    const ButtonGroup = ({ children }: { children: React.ReactNode }) => (
        <div className="flex flex-wrap items-center gap-1 bg-secondary/20 p-1 rounded-md">
            {children}
        </div>
    )

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
                        SETTINGS
                    </h1>
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                        customize your reading experience
                    </p>
                </div>
            </div>

            <div className="grid gap-12">

                {/* ACCOUNT */}
                <Section title="Account">
                    <SettingRow label="Profile" description="manage your account statistics">
                        <Link href="/profile">
                            <button className="flex items-center gap-2 text-xs font-mono text-primary hover:underline underline-offset-4 decoration-primary/50 transition-all">
                                <User className="h-3 w-3" />
                                view stats
                            </button>
                        </Link>
                    </SettingRow>

                    <SettingRow label="Daily Verse Email" description="receive a verse every morning">
                        <Switch
                            checked={user?.user_metadata?.daily_verse_emails ?? false}
                            onCheckedChange={handleVerseEmailToggle}
                            disabled={!user}
                        />
                    </SettingRow>
                </Section>

                {/* APPEARANCE */}
                <Section title="Appearance">
                    <SettingRow label="Theme" description="choose your preferred color scheme">
                        <div className="flex gap-3">
                            {/* Light Theme Card */}
                            <button
                                onClick={() => setTheme('light')}
                                className={cn(
                                    "group relative w-20 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200",
                                    theme === 'light'
                                        ? "border-primary ring-2 ring-primary/20 scale-105"
                                        : "border-border/50 hover:border-border hover:scale-102"
                                )}
                            >
                                {/* Mini preview */}
                                <div className="absolute inset-0 bg-[#fafafa]">
                                    <div className="absolute top-1 left-1 right-1 h-2 bg-[#e5e5e5] rounded-sm" />
                                    <div className="absolute top-4 left-1 w-4 h-1.5 bg-[#3b82f6] rounded-sm" />
                                    <div className="absolute top-6 left-1 right-1 h-1 bg-[#d4d4d4] rounded-sm" />
                                    <div className="absolute top-8 left-1 right-2 h-1 bg-[#d4d4d4] rounded-sm" />
                                    <div className="absolute top-10 left-1 right-3 h-1 bg-[#d4d4d4] rounded-sm" />
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-[#e5e5e5]/80 py-0.5 flex items-center justify-center gap-1">
                                    <Sun className="h-2 w-2 text-[#737373]" />
                                    <span className="text-[8px] font-mono text-[#737373]">light</span>
                                </div>
                            </button>

                            {/* Dark Theme Card */}
                            <button
                                onClick={() => setTheme('dark')}
                                className={cn(
                                    "group relative w-20 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200",
                                    theme === 'dark'
                                        ? "border-primary ring-2 ring-primary/20 scale-105"
                                        : "border-border/50 hover:border-border hover:scale-102"
                                )}
                            >
                                {/* Mini preview */}
                                <div className="absolute inset-0 bg-[#171717]">
                                    <div className="absolute top-1 left-1 right-1 h-2 bg-[#262626] rounded-sm" />
                                    <div className="absolute top-4 left-1 w-4 h-1.5 bg-[#60a5fa] rounded-sm" />
                                    <div className="absolute top-6 left-1 right-1 h-1 bg-[#404040] rounded-sm" />
                                    <div className="absolute top-8 left-1 right-2 h-1 bg-[#404040] rounded-sm" />
                                    <div className="absolute top-10 left-1 right-3 h-1 bg-[#404040] rounded-sm" />
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-[#262626]/80 py-0.5 flex items-center justify-center gap-1">
                                    <Moon className="h-2 w-2 text-[#a3a3a3]" />
                                    <span className="text-[8px] font-mono text-[#a3a3a3]">dark</span>
                                </div>
                            </button>

                            {/* Auto Theme Card */}
                            <button
                                onClick={() => setTheme('system')}
                                className={cn(
                                    "group relative w-20 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200",
                                    theme === 'system'
                                        ? "border-primary ring-2 ring-primary/20 scale-105"
                                        : "border-border/50 hover:border-border hover:scale-102"
                                )}
                            >
                                {/* Split preview - light/dark */}
                                <div className="absolute inset-0">
                                    {/* Left half - light */}
                                    <div className="absolute inset-y-0 left-0 w-1/2 bg-[#fafafa]">
                                        <div className="absolute top-1 left-1 right-0.5 h-2 bg-[#e5e5e5] rounded-sm" />
                                        <div className="absolute top-4 left-1 w-3 h-1.5 bg-[#3b82f6] rounded-sm" />
                                        <div className="absolute top-6 left-1 right-0.5 h-1 bg-[#d4d4d4] rounded-sm" />
                                        <div className="absolute top-8 left-1 right-1 h-1 bg-[#d4d4d4] rounded-sm" />
                                    </div>
                                    {/* Right half - dark */}
                                    <div className="absolute inset-y-0 right-0 w-1/2 bg-[#171717]">
                                        <div className="absolute top-1 left-0.5 right-1 h-2 bg-[#262626] rounded-sm" />
                                        <div className="absolute top-4 right-1 w-3 h-1.5 bg-[#60a5fa] rounded-sm" />
                                        <div className="absolute top-6 left-0.5 right-1 h-1 bg-[#404040] rounded-sm" />
                                        <div className="absolute top-8 left-1 right-1 h-1 bg-[#404040] rounded-sm" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-[#e5e5e5]/80 to-[#262626]/80 py-0.5 flex items-center justify-center gap-1">
                                    <Monitor className="h-2 w-2 text-[#737373]" />
                                    <span className="text-[8px] font-mono text-[#737373]">auto</span>
                                </div>
                            </button>
                        </div>
                    </SettingRow>

                    <SettingRow label="Color Palette" description="accent colors and tones">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'standard', bg: '#18181b', accent: '#3b82f6', muted: '#27272a', text: '#fafafa' },
                                { id: 'terminal', bg: '#0d1117', accent: '#39d353', muted: '#161b22', text: '#c9d1d9' },
                                { id: 'solarized', bg: '#002b36', accent: '#268bd2', muted: '#073642', text: '#839496' },
                                { id: 'sepia', bg: '#f4ecd8', accent: '#8b7355', muted: '#e8dcc8', text: '#5c4a32' },
                                { id: 'midnight', bg: '#0f0f23', accent: '#ffff66', muted: '#10101a', text: '#cccccc' },
                                { id: 'lavender', bg: '#1a1a2e', accent: '#b4a7d6', muted: '#16162a', text: '#e0d8ef' },
                                { id: 'rose', bg: '#1f1a1a', accent: '#f472b6', muted: '#2a1f1f', text: '#fce7f3' },
                                { id: 'oled', bg: '#000000', accent: '#ffffff', muted: '#0a0a0a', text: '#e5e5e5' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPalette(p.id as PaletteType)}
                                    title={p.id}
                                    className={cn(
                                        "w-10 h-12 rounded overflow-hidden p-1 flex flex-col gap-1 transition-all duration-300 hover:scale-105 active:scale-95",
                                        palette === p.id
                                            ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                                            : "opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: p.bg }}
                                >
                                    {/* Header - book/chapter */}
                                    <div className="flex items-center justify-center gap-0.5 pb-0.5" style={{ borderBottom: `0.5px solid ${p.muted}` }}>
                                        <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: p.accent }} />
                                    </div>

                                    {/* Verse lines */}
                                    <div className="flex-1 flex flex-col justify-start gap-0.5">
                                        <div className="h-0.5 w-full rounded-full opacity-60" style={{ backgroundColor: p.text }} />
                                        <div className="h-0.5 w-5/6 rounded-full opacity-40" style={{ backgroundColor: p.text }} />
                                        <div className="h-0.5 w-full rounded-full opacity-40" style={{ backgroundColor: p.text }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </SettingRow>
                </Section>

                {/* READING */}
                <Section title="Reading">
                    <SettingRow label="Default Version" description="preferred Bible translation">
                        <QuickSelector
                            value={bibleVersion}
                            items={TRANSLATIONS}
                            onSelect={setBibleVersion}
                            icon={<Languages className="h-3 w-3" />}
                            placeholder="Select version..."
                            displayFormat="name"
                            popoverWidth="w-[300px]"
                            className="w-[200px]"
                        />
                    </SettingRow>

                    <SettingRow label="Font Family" description="typeface for reading view">
                        <ButtonGroup>
                            <Toggle
                                active={fontFamily === 'sans'}
                                onClick={() => setFontFamily('sans')}
                                label="sans"
                                icon={Type}
                            />
                            <Toggle
                                active={fontFamily === 'serif'}
                                onClick={() => setFontFamily('serif')}
                                label="serif"
                                icon={Type}
                            />
                            <Toggle
                                active={fontFamily === 'mono'}
                                onClick={() => setFontFamily('mono')}
                                label="mono"
                                icon={Type}
                            />
                            <Toggle
                                active={fontFamily === 'pixel'}
                                onClick={() => setFontFamily('pixel')}
                                label="round"
                                icon={Type}
                            />
                        </ButtonGroup>
                    </SettingRow>

                    <SettingRow label="Font Size" description={`adjust text size (${fontSize}px)`}>
                        <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-md">
                            <button
                                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground font-mono transition-colors"
                            >
                                -
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-primary">{fontSize}</span>
                            <button
                                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground font-mono transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </SettingRow>

                    <SettingRow label="Verse Numbers" description="show or hide verse numbers">
                        <Toggle
                            active={showVerseNumbers}
                            onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                            label={showVerseNumbers ? "visible" : "hidden"}
                            icon={Hash}
                        />
                    </SettingRow>

                    <SettingRow label="Red Letters" description="highlight words of Christ">
                        <Toggle
                            active={redLetters}
                            onClick={() => setRedLetters(!redLetters)}
                            label={redLetters ? "on" : "off"}
                            icon={Palette}
                        />
                    </SettingRow>

                    <SettingRow label="Default Highlight" description="quick highlight color">
                        <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
                            <PenTool className="h-4 w-4 text-muted-foreground mr-2" />
                            {HIGHLIGHT_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setDefaultHighlightColor(c.id)}
                                    className={cn(
                                        "w-5 h-5 rounded-full border transition-transform hover:scale-110",
                                        c.class,
                                        c.border,
                                        defaultHighlightColor === c.id && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110"
                                    )}
                                    aria-label={`Select ${c.id}`}
                                />
                            ))}
                        </div>
                    </SettingRow>
                </Section>

                {/* DANGER ZONE */}
                <Section title="Reset">
                    <SettingRow label="Reset to Defaults" description="restore all settings to their original values (RSVCE, serif font, etc.)">
                        <button
                            onClick={() => {
                                resetPreferences()
                                toast.success("Settings reset to defaults")
                            }}
                            className="flex items-center gap-2 text-xs font-mono text-destructive hover:text-destructive/80 transition-colors"
                        >
                            <RotateCcw className="h-3 w-3" />
                            reset all
                        </button>
                    </SettingRow>
                </Section>

            </div>
        </motion.div>
    )
}
