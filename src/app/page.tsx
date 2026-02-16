"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Church, Clock, Heart, Share2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getDailyContent, parseVerseRef, getLiturgicalColorClass, DailyContent, FALLBACK_CONTENT } from "@/lib/daily-content"
import { useReadingPreferences } from "@/contexts/reading-preferences"
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
      <motion.div variants={itemVariants} className="space-y-5 border-b border-border/50 pb-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.45em] text-muted-foreground/60 w-full">
            <span className="h-px w-8 bg-border" />
            openwrit
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-mono font-bold text-primary tracking-tight leading-tight">
              {greeting}
            </h1>
            <div className="text-xs font-mono text-muted-foreground/60">
              a quiet place for daily reading
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground/60">
            {todayLabel && (
              <span className={`hidden items-center gap-2 ${isLoading ? "animate-pulse" : ""}`}>
                <Clock className="h-3 w-3" />
                {todayLabel}
              </span>
            )}
            {liturgyLabel && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <Link
                  href="/calendar"
                  className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                  <Church className="h-3 w-3 group-hover:scale-110 transition-transform" />
                  <span>
                    <span className="truncate max-w-[300px] md:max-w-[500px] block">
                      {liturgyLabel}
                      {liturgyRank ? ` · ${liturgyRank}` : ""}
                    </span>
                  </span>
                </Link>
              </>
            )}
          </div>



        </div>
      </motion.div>

      {/* Daily Focus */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Column - Verse of the Day (2/3) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Daily Wisdom Section - Hidden for now */}
            {/* 
            <Section title="Daily wisdom">
              <div className="group space-y-3">
                <blockquote className="max-w-[760px]">
                  <p className={cn(
                    "text-sm md:text-base leading-relaxed text-foreground/80",
                    getFontClass(fontFamily),
                    isLoading && "animate-pulse"
                  )}>
                    "{dailyContent.verse_text}"
                  </p>
                </blockquote>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground/60">
                  {parsedVerse ? (
                    <Link
                      href={`/read/${parsedVerse.book}/${parsedVerse.chapter}?translation=${bibleVersion}`}
                      className="text-primary transition-colors hover:underline underline-offset-4 decoration-primary/40"
                    >
                      {dailyContent.verse_ref}
                    </Link>
                  ) : (
                    <span className="text-primary">
                      {dailyContent.verse_ref}
                    </span>
                  )}
                  <span className="text-muted-foreground/30">·</span>
                  <span className={isLoading ? "animate-pulse" : ""}>
                    {(currentVerseSource || dailyContent.verse_source).toUpperCase()}
                  </span>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-muted-foreground/30 ml-1">·</span>
                    <button
                      onClick={handleHighlight}
                      className="font-mono text-xs text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <BookOpen className="h-3 w-3" />
                      save
                    </button>
                    <span className="text-muted-foreground/30">·</span>
                    <button
                      onClick={handleShareVerse}
                      className="font-mono text-xs text-muted-foreground/60 hover:text-primary transition-all duration-300 flex items-center gap-2"
                    >
                      <Share2 className="h-3 w-3" />
                      share
                    </button>
                  </div>
                </div>
              </div>
            </Section>
            */}

            {/* Daily Readings - Moved here */}
            {dailyReadings && (
              <DailyReadings data={dailyReadings} />
            )}
          </div>

          {/* Side Column - Info cards (1/3) */}
          <div className="space-y-6">
            {streakDays !== null && (
              <Section title="Reading status">
                <Link
                  href="/profile"
                  className="group block p-4 rounded-md border border-border/40 bg-secondary/5 hover:bg-secondary/10 hover:border-primary/20 transition-all duration-300 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground/90">
                          {streakDays} day streak
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-tight">
                          reading daily
                        </div>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          i < (streakDays % 7 || (streakDays > 0 ? 7 : 0)) ? 'bg-primary/60' : 'bg-border/30'
                        )}
                      />
                    ))}
                  </div>
                </Link>
              </Section>
            )}

            {continueReading && (
              <Section title="Continue Reading">
                <Link
                  href={`/read/${encodeURIComponent(continueReading.book)}/${continueReading.chapter}`}
                  className="group flex flex-col gap-2 p-4 rounded-md border border-border/40 bg-secondary/5 hover:bg-secondary/10 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground/90">
                          {continueReading.book} {continueReading.chapter}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-tight">
                          resume reading
                        </div>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                </Link>
              </Section>
            )}
          </div>
        </div>
      </motion.div>

      {/* USCCB Daily Readings - Moved above */}


    </motion.div>
  )
}
