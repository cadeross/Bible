"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Church, Clock, Heart, Share2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useAuth, useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { getDailyContent, parseVerseRef, getLiturgicalColorClass, DailyContent, FALLBACK_CONTENT } from "@/lib/daily-content"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { useNavMode } from "@/contexts/nav-mode"
import { cn } from "@/lib/utils"
import { getVerseText, getAllTranslations } from "@/lib/bible-api"
import { DailyReadings } from "@/components/daily-readings"
import { DailyReadingsData } from "@/lib/daily-readings"

interface HomeClientProps {
  dailyReadings: DailyReadingsData | null
}

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-5">
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
      {title}
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
)

// Dynamic greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "good morning"
  if (hour >= 12 && hour < 17) return "good afternoon"
  if (hour >= 17 && hour < 22) return "good evening"
  return "good night"
}

const getFontClass = (font: string) => {
  switch (font) {
    case "sans": return "font-sans";
    case "mono": return "font-mono";
    case "pixel": return "font-pixel";
    case "serif":
    default: return "font-serif";
  }
};

export function HomeClient({ dailyReadings }: HomeClientProps) {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const convexProfile = useQuery(
    api.profiles.getMyProfile,
    isSignedIn ? {} : "skip"
  )
  const [username, setUsername] = useState<string>("")
  const [greeting, setGreeting] = useState<string>("")
  const [todayLabel, setTodayLabel] = useState<string>("")
  const [continueReading, setContinueReading] = useState<{ book: string, chapter: number } | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const cached = localStorage.getItem("openwrit-continue-reading")
      return cached ? JSON.parse(cached) : null
    } catch { return null }
  })
  const [streakDays, setStreakDays] = useState<number | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const cached = localStorage.getItem("openwrit-streak-days")
      return cached !== null ? Number(cached) : null
    } catch { return null }
  })
  const [mounted, setMounted] = useState(false)
  const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)
  const [isLoading, setIsLoading] = useState(true)
  const [currentVerseSource, setCurrentVerseSource] = useState<string>("") // Track actual Bible version used
  const { fontFamily, bibleVersion } = useReadingPreferences()
  const { navMode } = useNavMode()

  useEffect(() => {
    const name =
      convexProfile?.username ??
      user?.username ??
      user?.firstName ??
      ""
    setUsername(name)
  }, [convexProfile, user])

  useEffect(() => {
    setMounted(true)
    setGreeting(getGreeting())
    setTodayLabel(
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).format(new Date())
    )

    const loadData = async () => {
      const { getProfile, getHistory } = await import("@/lib/persistence")

      let content, profile, history
      try {
        ;[content, profile, history] = await Promise.all([
          getDailyContent(),
          getProfile(),
          getHistory(),
        ])
      } catch (err) {
        console.error("Failed to load page data:", err)
        setIsLoading(false)
        return
      }

      setDailyContent(content)
      setCurrentVerseSource(content.verse_source) // Initialize with database value
      setIsLoading(false)

      // Feature flag: Set to false to disable dynamic verse fetching
      const ENABLE_DYNAMIC_VERSE_FETCH = true

      // Fetch dynamic verse text based on user's Bible version
      const parsedVerse = parseVerseRef(content.verse_ref)
      if (parsedVerse && ENABLE_DYNAMIC_VERSE_FETCH) {
        try {
          console.log(`Fetching verse: ${content.verse_ref} in version ${bibleVersion}`)
          const dynamicVerseText = await getVerseText(
            parsedVerse.book,
            parsedVerse.chapter,
            parsedVerse.verse,
            bibleVersion
          )
          // Update content with dynamic verse text
          console.log(`Successfully fetched dynamic verse text`)
          setDailyContent(prev => ({
            ...prev,
            verse_text: dynamicVerseText
          }))

          // Get the abbreviation for the Bible version used
          const allTranslations = await getAllTranslations()
          const translation = allTranslations.find(t => t.id === bibleVersion)
          if (translation) {
            const abbrev = (translation as any).abbreviation || translation.id.toUpperCase()
            setCurrentVerseSource(abbrev)
          }
        } catch (error) {
          console.warn(`Failed to fetch dynamic verse text for ${content.verse_ref}:`, error)
          console.log(`Falling back to database verse_text: "${content.verse_text}"`)
          // Fall back to static verse_text from database (already set above)
          // Keep the database verse_source as well
        }
      } else {
        console.log(`Dynamic verse fetching disabled or could not parse reference`)
      }

      if (profile?.last_read_book && profile?.last_read_chapter) {
        const val = { book: profile.last_read_book, chapter: profile.last_read_chapter }
        setContinueReading(val)
        localStorage.setItem("openwrit-continue-reading", JSON.stringify(val))
      } else if (history && history.length > 0) {
        const sorted = [...history].sort((a, b) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )
        const latest = sorted[0]
        if (latest?.book && latest?.chapter) {
          const val = { book: latest.book, chapter: latest.chapter }
          setContinueReading(val)
          localStorage.setItem("openwrit-continue-reading", JSON.stringify(val))
        }
      }

      if (history) {
        const dailyActivity: Record<string, number> = {}
        history.forEach((h) => {
          const day = h.completed_at.split("T")[0]
          dailyActivity[day] = (dailyActivity[day] || 0) + (h.duration_seconds || 0)
        })

        const presence = new Set(Object.keys(dailyActivity))
        let streak = 0
        const cursor = new Date()
        const todayStr = cursor.toISOString().split("T")[0]

        if (!presence.has(todayStr)) {
          cursor.setDate(cursor.getDate() - 1)
          const yesterdayStr = cursor.toISOString().split("T")[0]
          if (!presence.has(yesterdayStr)) {
            setStreakDays(0)
            localStorage.setItem("openwrit-streak-days", "0")
            return
          }
        }

        while (presence.has(cursor.toISOString().split("T")[0])) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        }

        setStreakDays(streak)
        localStorage.setItem("openwrit-streak-days", String(streak))
      }
    }

    loadData().catch(err => {
      console.error("Unhandled loadData error:", err)
      setIsLoading(false)
    })
  }, [])

  const liturgyLabel = dailyReadings?.title || dailyContent.feast_name || dailyContent.liturgical_season
  const liturgyRank = dailyContent.rank && dailyContent.rank !== "Weekday" ? dailyContent.rank : ""
  const liturgyColorClass = getLiturgicalColorClass(dailyContent.liturgical_color)

  // Parse the verse reference for linking
  const parsedVerse = parseVerseRef(dailyContent.verse_ref)

  const handleHighlight = async () => {
    if (!parsedVerse) {
      toast.error("Invalid verse reference")
      return
    }

    try {
      const { saveHighlight } = await import("@/lib/persistence")
      await saveHighlight({
        book: parsedVerse.book,
        chapter: parsedVerse.chapter,
        verse: parsedVerse.verse,
        content: dailyContent.verse_text,
        color: "yellow",
        created_at: new Date().toISOString()
      })

      if (username) {
        toast.success("verse highlighted", {
          description: "added to your library"
        })
      } else {
        toast.success("saved to device", {
          description: "sign in to sync your library",
          action: {
            label: "sign in",
            onClick: () => window.location.href = "/profile"
          }
        })
      }
    } catch (error) {
      console.error(error)
      toast.error("failed to save")
    }
  }



  const handleShare = async (text: string, title: string, url?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url || text)
      toast.success(url ? "link copied" : "copied")
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error("couldn't share")
      }
    }
  }

  const handleShareVerse = () => {
    const text = `"${dailyContent.verse_text}" — ${dailyContent.verse_ref}`

    if (parsedVerse) {
      const url = `${window.location.origin}/read/${encodeURIComponent(parsedVerse.book)}/${parsedVerse.chapter}?v=${parsedVerse.verse}`
      handleShare(text, "Daily wisdom", url)
    } else {
      handleShare(text, "Daily wisdom")
    }
  }



  if (!mounted) {
    return (
      <div className="w-full max-w-[860px] mx-auto px-6 py-16 space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            OpenWrit
          </h1>
          <p className="text-[15px] text-muted-foreground max-w-[520px] mx-auto leading-relaxed">
            Read Scripture with clarity and focus. Daily readings,
            liturgical calendar, and your reading journey — all in one place.
          </p>
        </header>

        <nav className="flex flex-wrap justify-center gap-3 text-sm font-medium tracking-tight">
          <Link
            href="/read/Genesis/1"
            className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Start reading
          </Link>
          <Link
            href="/calendar"
            className="rounded-full border border-border/40 bg-background px-5 py-2.5 text-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-accent active:scale-[0.98]"
          >
            Liturgical calendar
          </Link>
        </nav>
      </div>
    )
  }

  return (
    <>
    <motion.div
      className="w-full max-w-[860px] mx-auto px-6 py-16 space-y-14"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col items-center text-center gap-5">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground capitalize sm:text-4xl">
              {greeting}
            </h1>
            {liturgyLabel && (
              <Link
                href="/calendar"
                className="inline-block max-w-[min(100%,480px)] truncate text-[15px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {liturgyLabel}
              </Link>
            )}
          </div>

          {/* Quick Action Pills */}
          {(isLoading && streakDays === null && !continueReading) ? (
            <div className="flex flex-wrap justify-center items-center gap-3 mt-1">
              <div className="flex items-center gap-2.5 rounded-full border border-border/30 bg-card px-5 py-2.5 shadow-[var(--shadow-sm)]">
                <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-muted-foreground/15" />
                <div className="h-2.5 w-20 animate-pulse rounded-full bg-muted-foreground/15" />
              </div>
              <div className="flex items-center gap-2.5 rounded-full border border-border/30 bg-card px-5 py-2.5 shadow-[var(--shadow-sm)]">
                <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-muted-foreground/15" />
                <div className="h-2.5 w-28 animate-pulse rounded-full bg-muted-foreground/15" />
              </div>
            </div>
          ) : (streakDays !== null || continueReading) ? (
            <div className="flex flex-wrap justify-center items-center gap-3 mt-1">
              {streakDays !== null && (
                <Link
                  href="/profile"
                  className="group flex items-center gap-2.5 rounded-full border border-border/30 bg-card px-5 py-2.5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:border-border/50"
                >
                  <Heart className="h-3.5 w-3.5 text-heart/70 transition-colors group-hover:text-heart" />
                  <span className="text-[13px] font-medium tracking-tight text-foreground/80 transition-colors group-hover:text-foreground">
                    {streakDays} day streak
                  </span>
                </Link>
              )}
              {continueReading && (
                <Link
                  href={`/read/${encodeURIComponent(continueReading.book)}/${continueReading.chapter}?translation=${bibleVersion}`}
                  className="group flex items-center gap-2.5 rounded-full border border-border/30 bg-card px-5 py-2.5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:border-border/50"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary/70 transition-colors group-hover:text-primary" />
                  <span className="text-[13px] font-medium tracking-tight text-foreground/80 transition-colors group-hover:text-foreground">
                    Resume {continueReading.book} {continueReading.chapter}
                  </span>
                  <span className="text-[13px] text-muted-foreground/60 transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Daily Readings */}
      <motion.div variants={itemVariants}>
        <div className="w-full">
          {dailyReadings ? (
            <DailyReadings data={dailyReadings} />
          ) : (
            <div className="w-full max-w-[720px] mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center">
              <p className="text-sm text-muted-foreground max-w-[320px] leading-relaxed">
                Today&apos;s readings could not be loaded. Check back shortly or visit usccb.org directly.
              </p>
              <a
                href="https://bible.usccb.org/daily-bible-reading"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                usccb.org →
              </a>
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
    </>
  )
}
