import { createClient } from "@/lib/supabase/client"

export interface DailyContent {
    id: number
    date: string
    verse_ref: string
    verse_text: string
    verse_source: string
    wisdom_text: string
    wisdom_author: string
    feast_name: string | null
    liturgical_season: string | null
    rank: string | null
    liturgical_color: string | null
    created_at: string
}

// Parse verse reference like "Genesis 1:1" or "John 3:16-17"
export function parseVerseRef(ref: string): { book: string; chapter: number; verse: number } | null {
    // Match patterns like "Genesis 1:1", "1 John 3:16", "Song of Solomon 2:1"
    const match = ref.match(/^(.+?)\s+(\d+):(\d+)/)
    if (!match) return null

    return {
        book: match[1].trim(),
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10)
    }
}

// Get today's date in YYYY-MM-DD format (local timezone)
function getTodayDate(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Fallback content when no daily content is available
export const FALLBACK_CONTENT: DailyContent = {
    id: 0,
    date: getTodayDate(),
    verse_ref: "Genesis 1:1",
    verse_text: "In the beginning God created heaven and earth.",
    verse_source: "DRA",
    wisdom_text: "Our hearts are restless until they rest in Thee.",
    wisdom_author: "St. Augustine of Hippo",
    feast_name: null,
    liturgical_season: null,
    rank: null,
    liturgical_color: null,
    created_at: new Date().toISOString()
}

/**
 * Fetch today's daily content from Supabase
 * Returns fallback content if no entry exists for today
 */
export async function getDailyContent(): Promise<DailyContent> {
    try {
        const supabase = createClient()
        const today = getTodayDate()

        const { data, error } = await supabase
            .from('daily_content')
            .select('*')
            .eq('date', today)
            .maybeSingle()  // Returns null instead of error when no row found

        if (error) {
            console.error('Error fetching daily content:', error)
            return FALLBACK_CONTENT
        }

        if (!data) {
            console.log('No daily content for today, using fallback')
            return FALLBACK_CONTENT
        }

        return data as DailyContent
    } catch (error) {
        console.error('Error fetching daily content:', error)
        return FALLBACK_CONTENT
    }
}

/**
 * Get liturgical color as a CSS-compatible color
 */
export function getLiturgicalColorClass(color: string | null): string {
    switch (color?.toLowerCase()) {
        case 'white':
            return 'text-white'
        case 'green':
            return 'text-green-500'
        case 'violet':
        case 'purple':
            return 'text-purple-500'
        case 'red':
            return 'text-red-500'
        case 'rose':
        case 'pink':
            return 'text-pink-400'
        case 'gold':
            return 'text-yellow-500'
        case 'black':
            return 'text-foreground'
        default:
            return 'text-muted-foreground'
    }
}
