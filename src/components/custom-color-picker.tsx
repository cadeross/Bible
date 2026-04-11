"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ─── Color math ──────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number) {
    const s1 = s / 100, v1 = v / 100
    const c = v1 * s1
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v1 - c
    let r = 0, g = 0, b = 0
    if      (h < 60)  { r = c; g = x; b = 0 }
    else if (h < 120) { r = x; g = c; b = 0 }
    else if (h < 180) { r = 0; g = c; b = x }
    else if (h < 240) { r = 0; g = x; b = c }
    else if (h < 300) { r = x; g = 0; b = c }
    else              { r = c; g = 0; b = x }
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    }
}

function hsvToHex(h: number, s: number, v: number): string {
    const { r, g, b } = hsvToRgb(h, s, v)
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const delta = max - min
    let h = 0
    if (delta !== 0) {
        if (max === r)      h = ((g - b) / delta) % 6
        else if (max === g) h = (b - r) / delta + 2
        else                h = (r - g) / delta + 4
        h = Math.round(h * 60)
        if (h < 0) h += 360
    }
    return {
        h,
        s: max === 0 ? 0 : Math.round((delta / max) * 100),
        v: Math.round(max * 100),
    }
}

function isValidHex(hex: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(hex)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    value: string
    onChange: (hex: string) => void
}

export function CustomColorPicker({ value, onChange }: Props) {
    const [hsv, setHsv] = useState(() => hexToHsv(isValidHex(value) ? value : "#2488f2"))
    const [hexInput, setHexInput] = useState(value)
    const pickerAreaRef = useRef<HTMLDivElement>(null)

    // Sync when external value changes (e.g. preset selected then back to custom)
    useEffect(() => {
        if (isValidHex(value) && value !== hsvToHex(hsv.h, hsv.s, hsv.v)) {
            const next = hexToHsv(value)
            setHsv(next)
            setHexInput(value)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    const commit = useCallback((h: number, s: number, v: number) => {
        const hex = hsvToHex(h, s, v)
        setHexInput(hex)
        onChange(hex)
    }, [onChange])

    // ── 2D picker ──────────────────────────────────────────────────────────

    const updateFromPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
        const s = Math.round(x * 100)
        const v = Math.round((1 - y) * 100)
        setHsv(prev => ({ ...prev, s, v }))
        commit(hsv.h, s, v)
    }, [hsv.h, commit])

    const onPickerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        updateFromPointer(e)
    }
    const onPickerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return
        updateFromPointer(e)
    }

    // ── Hue slider ─────────────────────────────────────────────────────────

    const onHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const h = Number(e.target.value)
        setHsv(prev => ({ ...prev, h }))
        commit(h, hsv.s, hsv.v)
    }

    // ── Hex input ──────────────────────────────────────────────────────────

    const onHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const val = raw.startsWith("#") ? raw : `#${raw}`
        setHexInput(raw)
        if (isValidHex(val)) {
            const next = hexToHsv(val)
            setHsv(next)
            onChange(val)
        }
    }

    const onHexBlur = () => {
        // Normalise on blur
        const val = hexInput.startsWith("#") ? hexInput : `#${hexInput}`
        if (isValidHex(val)) {
            setHexInput(val)
        } else {
            // Revert to current color
            setHexInput(hsvToHex(hsv.h, hsv.s, hsv.v))
        }
    }

    const pureHue = hsvToHex(hsv.h, 100, 100)
    const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v)

    return (
        <div className="flex flex-col gap-2.5">

            {/* ── 2D saturation / value area ─────────────────────────── */}
            <div
                ref={pickerAreaRef}
                className="relative w-full rounded-xl overflow-hidden select-none"
                style={{ height: 148, touchAction: "none", cursor: "crosshair" }}
                onPointerDown={onPickerDown}
                onPointerMove={onPickerMove}
            >
                {/* White → pure hue */}
                <div className="absolute inset-0" style={{ background: `linear-gradient(to right, #fff, ${pureHue})` }} />
                {/* Transparent → black */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, #000)" }} />
                {/* Cursor */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        left: `${hsv.s}%`,
                        top: `${100 - hsv.v}%`,
                        transform: "translate(-50%, -50%)",
                    }}
                >
                    <div
                        className="w-[18px] h-[18px] rounded-full border-2 border-white"
                        style={{
                            background: currentHex,
                            boxShadow: "0 0 0 1px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.35)",
                        }}
                    />
                </div>
            </div>

            {/* ── Hue slider ─────────────────────────────────────────── */}
            <div className="relative h-3 rounded-full overflow-hidden">
                <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
                />
                <input
                    type="range"
                    min={0}
                    max={359}
                    value={hsv.h}
                    onChange={onHueChange}
                    className="hue-range absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ margin: 0 }}
                />
                {/* Thumb indicator */}
                <div
                    className="absolute top-1/2 pointer-events-none"
                    style={{
                        left: `calc(${(hsv.h / 359) * 100}% - 8px)`,
                        transform: "translateY(-50%)",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: pureHue,
                        border: "2.5px solid white",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.3)",
                    }}
                />
            </div>

            {/* ── Hex input ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 rounded-lg border border-foreground/[0.1] bg-foreground/[0.03] px-3 py-2">
                <div
                    className="w-4 h-4 rounded-full shrink-0 border border-foreground/[0.15]"
                    style={{ background: currentHex }}
                />
                <input
                    type="text"
                    value={hexInput}
                    onChange={onHexChange}
                    onBlur={onHexBlur}
                    className="flex-1 bg-transparent text-[13px] font-mono text-foreground/80 outline-none uppercase"
                    placeholder="#000000"
                    spellCheck={false}
                    maxLength={7}
                />
            </div>
        </div>
    )
}
