import { NextRequest, NextResponse } from "next/server"
import { getDailyReadings } from "@/lib/daily-readings"
import { getLiturgicalDay } from "@/lib/liturgical-calendar"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"

const convex = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud"
)

/** YYYY-MM-DD for today in UTC */
function todayUTC(): string {
    return new Date().toISOString().split("T")[0]
}

/** First non-empty paragraph of a text block, truncated to 300 chars. */
function firstParagraph(text: string, maxLen = 300): string {
    const para = text.split("\n").map(l => l.trim()).find(l => l.length > 20) ?? text.trim()
    return para.length > maxLen ? para.slice(0, maxLen).trimEnd() + "…" : para
}

export async function GET(req: NextRequest) {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const secret = process.env.CRON_SECRET
    const authHeader = req.headers.get("authorization")
    if (secret && authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const date = todayUTC()

    try {
        // ── Fetch data in parallel ────────────────────────────────────────────
        const [readingsResult, liturgyResult] = await Promise.allSettled([
            getDailyReadings(),
            getLiturgicalDay(date),
        ])

        const readings = readingsResult.status === "fulfilled" ? readingsResult.value : null
        const liturgy  = liturgyResult.status  === "fulfilled" ? liturgyResult.value  : null

        // ── Extract verse from Gospel (fall back to Reading I) ────────────────
        const gospelReading  = readings?.readings.gospel
        const reading1       = readings?.readings.reading1
        const primaryReading = gospelReading ?? reading1

        const verseRef  = primaryReading?.reference ?? "Genesis 1:1"
        const verseText = primaryReading?.text
            ? firstParagraph(primaryReading.text)
            : "In the beginning God created heaven and earth."
        const verseSource = "USCCB"

        // ── Wisdom: feast name + saint attribution, or gospel snippet ─────────
        const wisdomText   = readings?.title || liturgy?.name
            ? `${readings?.title ?? liturgy?.name ?? "Daily Reading"}`
            : verseText
        const wisdomAuthor = liturgy?.name ?? readings?.title ?? "Daily Scripture"

        // ── Liturgical metadata ───────────────────────────────────────────────
        const feastName       = readings?.title || liturgy?.name || undefined
        const liturgicalSeason = liturgy?.season || undefined
        const rank            = liturgy?.rank    || undefined
        const liturgicalColor = liturgy?.colorKey || undefined

        // ── Upsert into Convex ────────────────────────────────────────────────
        await convex.mutation(api.dailyContent.upsertForDate, {
            date,
            verseRef,
            verseText,
            verseSource,
            wisdomText,
            wisdomAuthor,
            feastName,
            liturgicalSeason,
            rank,
            liturgicalColor,
        })

        return NextResponse.json({
            ok: true,
            date,
            verseRef,
            feast: feastName ?? null,
            season: liturgicalSeason ?? null,
        })
    } catch (err) {
        console.error("[seed-daily] failed:", err)
        return NextResponse.json(
            { error: "Seed failed", detail: String(err) },
            { status: 500 }
        )
    }
}
