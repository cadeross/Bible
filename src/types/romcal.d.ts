declare module 'romcal' {
    interface CalendarOptions {
        year?: number
        country?: string
        locale?: string
    }

    interface RomcalDay {
        moment: string
        type: string
        name: string
        key: string
        source: string
        data: {
            season: {
                key: string
                value: string
            }
            meta: {
                titles: string[]
                psalterWeek: {
                    key: number
                    value: string
                }
                liturgicalColor: {
                    key: string
                    value: string
                }
                cycle: {
                    key: number
                    value: string
                }
            }
            calendar: {
                weeks: number
                week: number
                day: number
            }
            prioritized: boolean
        }
    }

    export function calendarFor(options: CalendarOptions): Promise<RomcalDay[]>
}
