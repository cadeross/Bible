import { calendarFor } from 'romcal'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiturgicalDay {
    date: string          // YYYY-MM-DD
    name: string          // Celebration name
    type: string          // SOLEMNITY, FEAST, MEMORIAL, OPT_MEMORIAL, COMMEMORATION, FERIA
    rank: string          // Human-readable rank label
    season: string        // Liturgical season
    seasonKey: string     // Season key for styling
    color: string         // Human-readable color name
    colorHex: string      // Hex color for UI
    colorKey: string      // Raw key (WHITE, GREEN, RED, etc.)
    cycle: string         // Year A, B, or C
    week: number          // Week number within season
    key: string           // Unique romcal key
}

// ─── Rank Mapping ────────────────────────────────────────────────────────────

const RANK_LABELS: Record<string, string> = {
    'SOLEMNITY': 'Solemnity',
    'FEAST': 'Feast',
    'MEMORIAL': 'Memorial',
    'OPT_MEMORIAL': 'Optional Memorial',
    'COMMEMORATION': 'Commemoration',
    'FERIA': 'Weekday',
    'SUNDAY': 'Sunday',
}

// ─── Color Mapping ───────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { name: string; hex: string; css: string }> = {
    'WHITE': { name: 'White', hex: '#F5F5F5', css: 'text-foreground/80' },
    'GREEN': { name: 'Green', hex: '#22c55e', css: 'text-green-500' },
    'RED': { name: 'Red', hex: '#ef4444', css: 'text-red-500' },
    'VIOLET': { name: 'Violet', hex: '#a855f7', css: 'text-purple-500' },
    'PURPLE': { name: 'Violet', hex: '#a855f7', css: 'text-purple-500' },
    'ROSE': { name: 'Rose', hex: '#f472b6', css: 'text-pink-400' },
    'PINK': { name: 'Rose', hex: '#f472b6', css: 'text-pink-400' },
    'GOLD': { name: 'Gold', hex: '#eab308', css: 'text-yellow-500' },
    'BLACK': { name: 'Black', hex: '#1a1a1a', css: 'text-foreground' },
}

const DEFAULT_COLOR = { name: 'Green', hex: '#22c55e', css: 'text-muted-foreground' }

// ─── Season Mapping ──────────────────────────────────────────────────────────

const SEASON_LABELS: Record<string, string> = {
    'Christmastide': 'Christmas',
    'OrdinaryTime': 'Ordinary Time',
    'Lent': 'Lent',
    'EasterTriduum': 'Easter Triduum',
    'Eastertide': 'Easter',
    'Advent': 'Advent',
}

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

const calendarCache = new Map<number, LiturgicalDay[]>()

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Generate the full liturgical calendar for a given year.
 * Results are cached in-memory.
 */
export async function getLiturgicalCalendar(year: number): Promise<LiturgicalDay[]> {
    if (calendarCache.has(year)) {
        return calendarCache.get(year)!
    }

    const rawCalendar = await calendarFor({ year })

    const days: LiturgicalDay[] = rawCalendar.map((entry: any) => {
        const date = entry.moment.split('T')[0] // YYYY-MM-DD
        const colorKey = entry.data?.meta?.liturgicalColor?.key || 'GREEN'
        const colorInfo = COLOR_MAP[colorKey] || DEFAULT_COLOR
        const seasonKey = entry.data?.season?.key || 'OrdinaryTime'

        return {
            date,
            name: entry.name || 'Weekday',
            type: entry.type || 'FERIA',
            rank: RANK_LABELS[entry.type] || entry.type || 'Weekday',
            season: SEASON_LABELS[seasonKey] || entry.data?.season?.value || seasonKey,
            seasonKey,
            color: colorInfo.name,
            colorHex: colorInfo.hex,
            colorKey,
            cycle: entry.data?.meta?.cycle?.value || '',
            week: entry.data?.calendar?.week || 0,
            key: entry.key || '',
        }
    })

    calendarCache.set(year, days)
    return days
}

/**
 * Get liturgical data for a specific month.
 */
export async function getLiturgicalMonth(year: number, month: number): Promise<LiturgicalDay[]> {
    const calendar = await getLiturgicalCalendar(year)
    return calendar.filter(day => {
        const [y, m] = day.date.split('-').map(Number)
        return y === year && m === month
    })
}

/**
 * Get liturgical data for a specific date.
 */
export async function getLiturgicalDay(dateStr: string): Promise<LiturgicalDay | null> {
    const [yearStr] = dateStr.split('-')
    const year = parseInt(yearStr, 10)
    const calendar = await getLiturgicalCalendar(year)
    return calendar.find(d => d.date === dateStr) || null
}

/**
 * Get CSS class for a liturgical color key.
 */
export function getLiturgicalColorCSS(colorKey: string): string {
    return (COLOR_MAP[colorKey] || DEFAULT_COLOR).css
}

/**
 * Get a background class for a liturgical color (used for dots/badges).
 */
export function getLiturgicalColorBg(colorKey: string): string {
    const map: Record<string, string> = {
        'WHITE': 'bg-foreground/20',
        'GREEN': 'bg-green-500',
        'RED': 'bg-red-500',
        'VIOLET': 'bg-purple-500',
        'PURPLE': 'bg-purple-500',
        'ROSE': 'bg-pink-400',
        'PINK': 'bg-pink-400',
        'GOLD': 'bg-yellow-500',
        'BLACK': 'bg-foreground',
    }
    return map[colorKey] || 'bg-green-500'
}
