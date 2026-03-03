import { getDailyReadings, DailyReadingsData } from "@/lib/daily-readings"
import { HomeClient } from "@/components/home/home-client"

export default async function Home() {
    let dailyReadings: DailyReadingsData | null = null
    try {
        dailyReadings = await getDailyReadings()
    } catch (e) {
        console.error("Failed to pre-fetch daily readings:", e)
    }

    return <HomeClient dailyReadings={dailyReadings} />
}
