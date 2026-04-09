import { getDailyReadings } from "@/lib/daily-readings"
import { getLiturgicalDay } from "@/lib/liturgical-calendar"
import { DailyClient } from "@/components/daily/daily-client"

export const revalidate = 3600

export default async function DailyPage() {
    const today = new Date().toISOString().split("T")[0]

    const [readingsResult, liturgyResult] = await Promise.allSettled([
        getDailyReadings(),
        getLiturgicalDay(today),
    ])

    const dailyReadings = readingsResult.status === "fulfilled" ? readingsResult.value : null
    const liturgicalDay = liturgyResult.status === "fulfilled" ? liturgyResult.value : null

    return <DailyClient dailyReadings={dailyReadings} liturgicalDay={liturgicalDay} />
}
