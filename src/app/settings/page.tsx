"use client"

import { useTheme } from "next-themes"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
// Settings page is preferences only for now.
import { Monitor, Moon, Sun, Type, Hash, Palette, User, Settings as SettingsIcon, PenTool } from "lucide-react"
import Link from "next/link"

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
        setDefaultHighlightColor
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
        <div className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/50 pb-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <SettingsIcon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight font-mono text-primary">settings</h1>
                    <p className="text-muted-foreground text-xs font-mono">
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
                        <ButtonGroup>
                            <Toggle
                                active={theme === 'light'}
                                onClick={() => setTheme('light')}
                                label="light"
                                icon={Sun}
                            />
                            <Toggle
                                active={theme === 'dark'}
                                onClick={() => setTheme('dark')}
                                label="dark"
                                icon={Moon}
                            />
                            <Toggle
                                active={theme === 'system'}
                                onClick={() => setTheme('system')}
                                label="auto"
                                icon={Monitor}
                            />
                        </ButtonGroup>
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
                        </ButtonGroup>
                    </SettingRow>
                </Section>

                {/* READING */}
                <Section title="Reading">
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

                {/* Version Info */}
                <div className="pt-8 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground font-mono text-center opacity-50">
                        bible-web v0.1.0 • monkeytype inspired
                    </p>
                </div>

            </div>
        </div>
    )
}
