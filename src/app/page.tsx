import { Greeting } from "@/components/home/greeting"
import { StatsOverview } from "@/components/home/stats-overview"
import { DailyContent } from "@/components/home/daily-content"
import { ActivityHeatmap } from "@/components/home/activity-heatmap"

export default function Home() {
  return (
    <div className="bg-background text-foreground md:pb-0 flex-1 flex flex-col justify-center">
      <div className="flex flex-col w-full max-w-5xl mx-auto px-6 gap-6 md:gap-8">

        {/* Top Section: Greeting & Stats */}
        <section className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-0 animate-in fade-in slide-in-from-top-4 duration-700">
          <Greeting />
          <StatsOverview />
        </section>

        {/* Middle Section: Daily Content */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <DailyContent />
        </section>

        {/* Bottom Section: Heatmap */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <ActivityHeatmap />
        </section>

      </div>
    </div>
  )
}
