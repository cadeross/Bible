"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Church, Clock, Heart, Share2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getDailyContent, parseVerseRef, getLiturgicalColorClass, DailyContent, FALLBACK_CONTENT } from "@/lib/daily-content"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { useNavMode } from "@/contexts/nav-mode"
import { cn } from "@/lib/utils"
import { getVerseText, getAllTranslations } from "@/lib/bible-api"
import { DailyReadings } from "@/components/daily-readings"
import { DailyReadingsData } from "@/lib/daily-readings"

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
  <div className="space-y-4">
    <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
      {title}
    </h2>
    <div className="pl-4 border-l border-border/40 space-y-4">
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

export default function Home() {
  const [username, setUsername] = useState<string>("")
  const [greeting, setGreeting] = useState<string>("")
  const [todayLabel, setTodayLabel] = useState<string>("")
  const [continueReading, setContinueReading] = useState<{ book: string, chapter: number } | null>(null)
  const [streakDays, setStreakDays] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)
  const [dailyReadings, setDailyReadings] = useState<DailyReadingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentVerseSource, setCurrentVerseSource] = useState<string>("") // Track actual Bible version used
  const { fontFamily, bibleVersion } = useReadingPreferences()
  const { navMode } = useNavMode()

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
      const supabase = createClient()
      const { getProfile, getHistory } = await import("@/lib/persistence")

      // Fetch user, content, and reading context in parallel
      const [userResult, content, profile, history, readingsRes] = await Promise.all([
        supabase.auth.getUser(),
        getDailyContent(),
        getProfile(),
        getHistory(),
        fetch("/api/readings/daily").catch(err => {
          console.error("Failed to fetch daily readings", err);
          return null;
        })
      ])

      if (userResult.data.user?.user_metadata?.username) {
        setUsername(userResult.data.user.user_metadata.username)
      }

      if (readingsRes && readingsRes.ok) {
        try {
          const readingsData = await readingsRes.json();
          setDailyReadings(readingsData);
        } catch (e) {
          console.error("Failed to parse daily readings json", e);
        }
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
        setContinueReading({
          book: profile.last_read_book,
          chapter: profile.last_read_chapter
        })
      } else if (history && history.length > 0) {
        const sorted = [...history].sort((a, b) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )
        const latest = sorted[0]
        if (latest?.book && latest?.chapter) {
          setContinueReading({ book: latest.book, chapter: latest.chapter })
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
            return
          }
        }

        while (presence.has(cursor.toISOString().split("T")[0])) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        }

        setStreakDays(streak)
      }
    }

    loadData()
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
      <div className="flex-1 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      className="w-full max-w-[900px] mx-auto px-6 py-12 space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-12">
        <div className="flex flex-col items-center text-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
          {/*
          {navMode === 'classic' && (
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.45em] text-muted-foreground/60 w-full justify-center">
              openwrit
            </div>
          )}
          */}

          <div className="space-y-1">
            <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
              {greeting}
            </h1>
            {liturgyLabel && (
              <Link
                href="/calendar"
                className="text-[10px] font-mono text-muted-foreground/60 hover:text-foreground transition-colors inline-block"
              >
                <span className="truncate max-w-[300px] md:max-w-[500px] block uppercase tracking-wider">
                  {liturgyLabel}
                </span>
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          {(streakDays !== null || continueReading) && (
            <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
              {streakDays !== null && (
                <Link
                  href="/profile"
                  className="group flex items-center gap-2.5 px-4 py-2 rounded-[2px] border border-border/30 bg-secondary/5 hover:bg-secondary/10 hover:border-foreground/20 transition-all duration-300"
                >
                  <Heart className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                    {streakDays} day streak
                  </span>
                </Link>
              )}
              {continueReading && (
                <Link
                  href={`/read/${encodeURIComponent(continueReading.book)}/${continueReading.chapter}`}
                  className="group flex items-center gap-2.5 px-4 py-2 rounded-[2px] border border-border/30 bg-secondary/5 hover:bg-secondary/10 hover:border-foreground/20 transition-all duration-300"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                    resume {continueReading.book} {continueReading.chapter}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all">
                    →
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Daily Focus */}
      <motion.div variants={itemVariants}>
        <div className="w-full">
          {dailyReadings && (
            <DailyReadings data={dailyReadings} />
          )}
        </div>
      </motion.div>

      {/* USCCB Daily Readings - Moved above */}


    </motion.div>
  )
}
