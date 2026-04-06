import { NextResponse } from "next/server"
import { getAvailableBibles } from "@/lib/api-bible"

const BASE = "https://rest.api.bible/v1"

export type BibleSearchVerse = {
    reference: string
    text: string
    bookId?: string
    chapterId?: string
    verseId?: string
}

/**
 * Full-text search via API.bible when API_BIBLE_KEY is set.
 * Response shape may vary; we normalize defensively.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() ?? ""
    if (!q) {
        return NextResponse.json({ verses: [] as BibleSearchVerse[], source: "empty" as const })
    }

    const key = process.env.API_BIBLE_KEY
    if (!key) {
        return NextResponse.json({ verses: [] as BibleSearchVerse[], source: "no-api-key" as const })
    }

    const translation = searchParams.get("translation")?.trim() || "web"

    try {
        const bibles = await getAvailableBibles()
        let bibleId =
            bibles.find(
                (b) =>
                    b.id === translation ||
                    b.abbreviation.toLowerCase() === translation.toLowerCase()
            )?.id ?? bibles[0]?.id

        if (!bibleId) {
            return NextResponse.json({ verses: [] as BibleSearchVerse[], source: "no-bible" as const })
        }

        const url = `${BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(q)}&fuzziness=AUTO&limit=30`
        const res = await fetch(url, {
            headers: { "api-key": key },
            next: { revalidate: 0 },
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error("bible-search API error", res.status, errText.slice(0, 200))
            return NextResponse.json({
                verses: [] as BibleSearchVerse[],
                source: "api-error" as const,
                status: res.status,
            })
        }

        const json = await res.json()
        const raw = json.data ?? json
        const passages = raw.passages ?? raw.verses ?? raw.results ?? raw.items ?? []

        const verses: BibleSearchVerse[] = (Array.isArray(passages) ? passages : []).map(
            (item: Record<string, unknown>) => {
                const reference =
                    (item.reference as string) ||
                    (item.verse as string) ||
                    (item.title as string) ||
                    ""
                const text =
                    (item.text as string) ||
                    (item.content as string) ||
                    (item.passage as string) ||
                    ""
                return {
                    reference,
                    text: typeof text === "string" ? text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "",
                    bookId: item.bookId as string | undefined,
                    chapterId: item.chapterId as string | undefined,
                    verseId: item.id as string | undefined,
                }
            }
        )

        return NextResponse.json({ verses, source: "api-bible" as const, bibleId })
    } catch (e) {
        console.error("bible-search route", e)
        return NextResponse.json({
            verses: [] as BibleSearchVerse[],
            source: "exception" as const,
        })
    }
}
