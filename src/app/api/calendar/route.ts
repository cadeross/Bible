import { NextRequest, NextResponse } from 'next/server'
import { getLiturgicalMonth, getLiturgicalDay } from '@/lib/liturgical-calendar'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    // Single date mode: ?date=2026-02-16
    const dateParam = searchParams.get('date')
    if (dateParam) {
        const day = await getLiturgicalDay(dateParam)
        if (!day) {
            return NextResponse.json({ error: 'Date not found' }, { status: 404 })
        }
        return NextResponse.json(day)
    }

    // Month mode: ?year=2026&month=2
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')

    if (!yearParam || !monthParam) {
        return NextResponse.json(
            { error: 'Missing year and month parameters. Use ?year=2026&month=2 or ?date=2026-02-16' },
            { status: 400 }
        )
    }

    const year = parseInt(yearParam, 10)
    const month = parseInt(monthParam, 10)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
    }

    const days = await getLiturgicalMonth(year, month)
    return NextResponse.json(days)
}
