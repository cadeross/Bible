import { BookOpen, Highlighter, Type } from "lucide-react"

export function StatsOverview() {
    const stats = [
        {
            label: "words read",
            value: "12,403",
            icon: <Type className="h-4 w-4" />
        },
        {
            label: "chapters",
            value: "42",
            icon: <BookOpen className="h-4 w-4" />
        },
        {
            label: "highlights",
            value: "156",
            icon: <Highlighter className="h-4 w-4" />
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-primary/50 text-xs font-mono">
                        {stat.icon}
                        <span>{stat.label}</span>
                    </div>
                    <span className="text-3xl md:text-4xl font-mono font-bold text-primary">
                        {stat.value}
                    </span>
                </div>
            ))}
        </div>
    )
}
