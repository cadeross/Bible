import { getDailyReadings, DailyReadingsData } from "@/lib/daily-readings"
import { DailyClient } from "@/components/daily/daily-client"

export const revalidate = 3600

export default async function DailyPage() {
    let dailyReadings: DailyReadingsData | null = null
    try {
        dailyReadings = await getDailyReadings()
    } catch (e) {
        console.error("Failed to pre-fetch daily readings:", e)
    }

    return <DailyClient dailyReadings={dailyReadings} />
}
