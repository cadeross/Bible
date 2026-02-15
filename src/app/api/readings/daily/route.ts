import { NextResponse } from 'next/server';
import { getDailyReadings } from '@/lib/daily-readings';

export async function GET() {
    try {
        const readings = await getDailyReadings();

        // Cache the response for 1 hour
        return NextResponse.json(readings, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('API Error fetching daily readings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily readings' },
            { status: 500 }
        );
    }
}
