"use client"

import { useTheme } from "next-themes"
import { useReadingPreferences, FontType, PaletteType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
// Settings page is preferences only for now.
import { Monitor, Moon, Sun, Type, Hash, Palette, User, Settings as SettingsIcon, PenTool, RotateCcw, Languages, Heading } from "lucide-react"
import Link from "next/link"
import { QuickSelector } from "@/components/reading/quick-selector"
import { getAllTranslations, getVerseText } from "@/lib/bible-api"
import { motion, AnimatePresence } from "framer-motion"

const HIGHLIGHT_COLORS = [
    { id: "yellow", class: "bg-yellow-500/30", border: "border-yellow-500/50" },
    { id: "green", class: "bg-green-500/30", border: "border-green-500/50" },
    { id: "blue", class: "bg-blue-500/30", border: "border-blue-500/50" },
    { id: "pink", class: "bg-pink-500/30", border: "border-pink-500/50" },
    { id: "purple", class: "bg-purple-500/30", border: "border-purple-500/50" },
]

const PALETTES: Array<{
    id: PaletteType
    label: string
    light: { bg: string; text: string; accent: string; border: string }
    dark:  { bg: string; text: string; accent: string; border: string }
}> = [
    { id: 'things',   label: 'Munich',    light: { bg:'#ffffff', text:'#1d1d1f', accent:'#007aff', border:'#d1d1d6' }, dark: { bg:'#1c1c1e', text:'#f5f5f7', accent:'#0a84ff', border:'#3a3a3c' } },
    { id: 'standard', label: 'Standard',  light: { bg:'#fdfdfd', text:'#1a1a1a', accent:'#1a1a1a', border:'#e5e5e5' }, dark: { bg:'#18181b', text:'#ededed', accent:'#ededed', border:'#27272a' } },
    { id: 'sepia',    label: 'Sepia',     light: { bg:'#f8f4e5', text:'#433422', accent:'#433422', border:'#dcd6c6' }, dark: { bg:'#1f1812', text:'#d4c5b0', accent:'#d4c5b0', border:'#3d3024' } },
    { id: 'solarized',label: 'Solarized', light: { bg:'#fdf6e3', text:'#657b83', accent:'#b58900', border:'#d3cbb7' }, dark: { bg:'#002b36', text:'#839496', accent:'#b58900', border:'#073642' } },
    { id: 'midnight', label: 'Midnight',  light: { bg:'#f1f5f9', text:'#334155', accent:'#0f172a', border:'#94a3b8' }, dark: { bg:'#0f172a', text:'#e2e8f0', accent:'#38bdf8', border:'#334155' } },
    { id: 'lavender', label: 'Lavender',  light: { bg:'#f3e8ff', text:'#581c87', accent:'#9333ea', border:'#c084fc' }, dark: { bg:'#11001c', text:'#e9d5ff', accent:'#c084fc', border:'#581c87' } },
    { id: 'rose',     label: 'Rose',      light: { bg:'#fff1f2', text:'#881337', accent:'#be123c', border:'#fda4af' }, dark: { bg:'#1c0208', text:'#ffe4e6', accent:'#fb7185', border:'#881337' } },
    { id: 'terminal', label: 'Terminal',  light: { bg:'#ffffff', text:'#003300', accent:'#008800', border:'#33cc33' }, dark: { bg:'#0c0c0c', text:'#00ff41', accent:'#00ff41', border:'#003300' } },
    { id: 'oled',     label: 'OLED',      light: { bg:'#ffffff', text:'#000000', accent:'#000000', border:'#e4e4e7' }, dark: { bg:'#000000', text:'#ffffff', accent:'#ffffff', border:'#27272a' } },
]

// [chapter, verse] pairs for the appearance preview
const PSALM_REFS: Array<[number, number]> = [
    [23, 1], [27, 1], [34, 8], [46, 10], [91, 2],
    [100, 4], [119, 105], [121, 1], [139, 14], [16, 11],
]

import { useEffect, useState } from "react"
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
        showTitles,
        setShowTitles,
        defaultHighlightColor,
        setDefaultHighlightColor,
        palette,
        setPalette,
        bibleVersion,
        setBibleVersion,
        resetPreferences
    } = useReadingPreferences()


    const [translations, setTranslations] = useState<{ id: string; name: string; abbreviation?: string }[]>([])
    const [previewVerse, setPreviewVerse] = useState<string>('')
    const [psalmRef] = useState<[number, number]>(() => PSALM_REFS[Math.floor(Math.random() * PSALM_REFS.length)])

    useEffect(() => {
        getAllTranslations().then(setTranslations)
    }, [])

    useEffect(() => {
        setPreviewVerse('')
        getVerseText('Psalms', psalmRef[0], psalmRef[1], bibleVersion)
            .then(setPreviewVerse)
            .catch(() => setPreviewVerse('The LORD is my shepherd; I shall not want.'))
    }, [bibleVersion, psalmRef])

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
    const SettingRow = ({ label, description, children, stack = false }: { label: string, description?: string, children: React.ReactNode, stack?: boolean }) => (
        <div className={cn("py-2", stack ? "space-y-2" : "flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
            <div className="space-y-0.5">
                <label className="text-sm font-medium font-mono text-foreground/90">{label}</label>
                {description && <p className="text-[10px] text-muted-foreground font-mono">{description}</p>}
            </div>
            <div className={stack ? "w-full" : "flex-shrink-0"}>
                {children}
            </div>
        </div>
    )

    // Toggle Button
    const Toggle = ({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon?: any }) => (
        <button
            onClick={onClick}
            className={cn(
                "group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-mono select-none border border-transparent",
                active
                    ? "bg-muted/60 text-foreground/80 hover:bg-muted/80 hover:text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
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
                    <p className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">
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
                </Section>

                {/* APPEARANCE */}
                <Section title="Appearance">
                    {(() => {
                        const activePalette = PALETTES.find(p => p.id === palette) ?? PALETTES[0]
                        const c = theme === 'dark' ? activePalette.dark : activePalette.light
                        const previewFontFamily = (() => {
                            switch (fontFamily) {
                                case "sans":  return "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
                                case "mono":  return "var(--font-geist-mono), ui-monospace, monospace"
                                case "pixel": return "var(--font-nunito), ui-rounded, sans-serif"
                                case "serif":
                                default: return "Merriweather, Georgia, ui-serif, serif"
                            }
                        })()
                        return (
                            <div className="border border-border/40 rounded-[4px] overflow-hidden">

                                    {/* 1. Live preview — Bible text only, no chrome */}
                                    <div className="px-6 pt-5 pb-5" style={{ backgroundColor: c.bg }}>
                                        <div style={{ color: c.accent, fontSize: '8px', fontFamily: 'monospace', opacity: 0.55, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            Psalm {psalmRef[0]}:{psalmRef[1]}
                                        </div>
                                        {previewVerse ? (
                                            <p style={{ color: c.text, fontSize: '15px', lineHeight: 1.65, opacity: 0.90, fontFamily: previewFontFamily, margin: 0 }}>
                                                {previewVerse}
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingTop: '2px' }}>
                                                <div style={{ height: '3px', borderRadius: '9999px', backgroundColor: c.text, opacity: 0.65 }} />
                                                <div style={{ height: '3px', borderRadius: '9999px', backgroundColor: c.text, opacity: 0.50, width: '88%' }} />
                                                <div style={{ height: '3px', borderRadius: '9999px', backgroundColor: c.text, opacity: 0.50 }} />
                                                <div style={{ height: '3px', borderRadius: '9999px', backgroundColor: c.text, opacity: 0.38, width: '75%' }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Theme strip */}
                                    <div className="flex border-t border-border/30">
                                        {([
                                            { id: 'light',  label: 'light', Icon: Sun     },
                                            { id: 'dark',   label: 'dark',  Icon: Moon    },
                                            { id: 'system', label: 'auto',  Icon: Monitor },
                                        ] as const).map(({ id, label, Icon }, i) => (
                                            <button
                                                key={id}
                                                onClick={() => setTheme(id)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono transition-colors",
                                                    i > 0 && "border-l border-border/30",
                                                    theme === id
                                                        ? "bg-primary/8 text-foreground"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                                                )}
                                            >
                                                <Icon className="h-3 w-3" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 3. Palette swatches */}
                                    <div className="border-t border-border/30 p-3 flex flex-wrap gap-x-3 gap-y-3">
                                        {PALETTES.map(p => {
                                            const sc = theme === 'dark' ? p.dark : p.light
                                            return (
                                                <button key={p.id} onClick={() => setPalette(p.id)}
                                                    className="flex flex-col items-center gap-1 group outline-none">
                                                    <div
                                                        className={cn(
                                                            "w-11 h-14 rounded-[3px] overflow-hidden transition-all duration-150",
                                                            palette === p.id
                                                                ? "ring-[1.5px] ring-primary scale-105"
                                                                : "opacity-55 hover:opacity-100 hover:scale-[1.03]"
                                                        )}
                                                        style={{ backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}
                                                    >
                                                        {/* Top bar with accent */}
                                                        <div className="h-[9px] flex items-center px-1" style={{ borderBottom: `0.5px solid ${sc.border}` }}>
                                                            <div className="h-[2px] w-4 rounded-full" style={{ backgroundColor: sc.accent }} />
                                                        </div>
                                                        {/* Text lines */}
                                                        <div className="px-1 pt-1.5 flex flex-col gap-[3px]">
                                                            <div className="h-[1.5px] rounded-full"       style={{ backgroundColor: sc.text, opacity: 0.80 }} />
                                                            <div className="h-[1.5px] rounded-full w-5/6" style={{ backgroundColor: sc.text, opacity: 0.55 }} />
                                                            <div className="h-[1.5px] rounded-full"       style={{ backgroundColor: sc.text, opacity: 0.55 }} />
                                                            <div className="h-[1.5px] rounded-full w-4/5" style={{ backgroundColor: sc.text, opacity: 0.40 }} />
                                                            <div className="h-[1.5px] rounded-full w-5/6" style={{ backgroundColor: sc.text, opacity: 0.35 }} />
                                                            <div className="h-[1.5px] rounded-full"       style={{ backgroundColor: sc.text, opacity: 0.30 }} />
                                                        </div>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[8px] font-mono leading-none transition-colors",
                                                        palette === p.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                                    )}>
                                                        {p.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                            </div>
                        )
                    })()}
                </Section>

                {/* READING */}
                <Section title="Reading">
                    <SettingRow label="Default Version" description="preferred Bible translation">
                        <QuickSelector
                            value={bibleVersion}
                            items={translations}
                            onSelect={setBibleVersion}
                            icon={<Languages className="h-3 w-3" />}
                            placeholder="Select version..."
                            displayFormat="name"
                            popoverWidth="w-[320px]"
                            className="w-[280px]"
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

                    <SettingRow label="Section Titles" description="show or hide section headings">
                        <Toggle
                            active={showTitles}
                            onClick={() => setShowTitles(!showTitles)}
                            label={showTitles ? "visible" : "hidden"}
                            icon={Heading}
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
                                        defaultHighlightColor === c.id && "ring-1 ring-primary ring-offset-1 ring-offset-background scale-110"
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
