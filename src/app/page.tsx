"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Church, Clock, Heart, Share2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getDailyContent, parseVerseRef, getLiturgicalColorClass, DailyContent, FALLBACK_CONTENT } from "@/lib/daily-content"

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

export default function Home() {
  const [username, setUsername] = useState<string>("")
  const [greeting, setGreeting] = useState<string>("")
  const [todayLabel, setTodayLabel] = useState<string>("")
  const [continueReading, setContinueReading] = useState<{ book: string, chapter: number } | null>(null)
  const [streakDays, setStreakDays] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)
  const [isLoading, setIsLoading] = useState(true)

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
      const [userResult, content, profile, history] = await Promise.all([
        supabase.auth.getUser(),
        getDailyContent(),
        getProfile(),
        getHistory()
      ])

      if (userResult.data.user?.user_metadata?.username) {
        setUsername(userResult.data.user.user_metadata.username)
      }

      setDailyContent(content)
      setIsLoading(false)

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

  const liturgyLabel = dailyContent.feast_name || dailyContent.liturgical_season
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

  const handleSaveWisdom = async () => {
    try {
      const { saveWisdom } = await import("@/lib/persistence")
      await saveWisdom({
        content: dailyContent.wisdom_text,
        source: dailyContent.wisdom_author,
        created_at: new Date().toISOString()
      })

      if (username) {
        toast.success("wisdom saved", {
          description: "added to your collection"
        })
      } else {
        toast.success("saved to device", {
          description: "sign in to sync your collection",
          action: {
            label: "sign in",
            onClick: () => window.location.href = "/profile"
          }
        })
      }
    } catch (error) {
      toast.error("failed to save")
    }
  }

  const handleShare = async (text: string, title: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text })
        return
      }
      await navigator.clipboard.writeText(text)
      toast.success("copied")
    } catch (error) {
      toast.error("couldn't share")
    }
  }

  const handleShareVerse = () => {
    const text = `"${dailyContent.verse_text}" — ${dailyContent.verse_ref}`
    handleShare(text, "Verse of the day")
  }

  const handleShareWisdom = () => {
    const text = `"${dailyContent.wisdom_text}" — ${dailyContent.wisdom_author}`
    handleShare(text, "Daily wisdom")
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
            {streakDays !== null && (
              <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                streak {streakDays} day{streakDays === 1 ? "" : "s"}
              </span>
            )}
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
              <span className={`flex items-center gap-2 ${isLoading ? "animate-pulse" : ""}`}>
                <Clock className="h-3 w-3" />
                {todayLabel}
              </span>
            )}
            {liturgyLabel && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-2">
                  <Church className={`h-3 w-3 ${liturgyColorClass}`} />
                  <span className={`${liturgyColorClass}`}>
                    {liturgyLabel}
                    {liturgyRank ? ` · ${liturgyRank}` : ""}
                  </span>
                </span>
              </>
            )}
          </div>

          {continueReading && (
            <div className="space-y-1 text-xs font-mono text-muted-foreground/60">
              <Link
                href={`/read/${encodeURIComponent(continueReading.book)}/${continueReading.chapter}`}
                className="inline-flex items-center gap-2 hover:text-primary transition-colors"
              >
                <BookOpen className="h-3 w-3" />
                continue reading · {continueReading.book} {continueReading.chapter}
              </Link>
            </div>
          )}

        </div>
      </motion.div>

      {/* Daily Focus */}
      <motion.div variants={itemVariants}>
        <div className="space-y-10">
          <Section title="Verse of the day">
            <div className="group space-y-3">
              <blockquote className="max-w-[760px]">
                <p className={`text-sm md:text-base font-mono leading-relaxed text-foreground/80 ${isLoading ? "animate-pulse" : ""}`}>
                  "{dailyContent.verse_text}"
                </p>
              </blockquote>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground/60">
                {parsedVerse ? (
                  <Link
                    href={`/read/${parsedVerse.book}/${parsedVerse.chapter}`}
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
                  {dailyContent.verse_source}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <button
                  onClick={handleHighlight}
                  className="font-mono text-xs text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  save
                </button>
                <button
                  onClick={handleShareVerse}
                  className="font-mono text-xs text-muted-foreground/60 hover:text-primary transition-all duration-300 flex items-center gap-2 opacity-0 group-hover:opacity-100"
                >
                  <Share2 className="h-3 w-3" />
                  share verse
                </button>
              </div>
            </div>
          </Section>

          <Section title="Daily wisdom">
            <div className="group space-y-3">
              <blockquote>
                <p className={`text-sm md:text-base font-mono leading-relaxed text-foreground/70 ${isLoading ? "animate-pulse" : ""}`}>
                  "{dailyContent.wisdom_text}"
                </p>
              </blockquote>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground/60">
                <span>
                  — {dailyContent.wisdom_author}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <button
                  onClick={handleSaveWisdom}
                  className="font-mono text-xs text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Heart className="h-3 w-3" />
                  save
                </button>
                <button
                  onClick={handleShareWisdom}
                  className="font-mono text-xs text-muted-foreground/60 hover:text-primary transition-all duration-300 flex items-center gap-2 opacity-0 group-hover:opacity-100"
                >
                  <Share2 className="h-3 w-3" />
                  share quote
                </button>
              </div>
            </div>
          </Section>
        </div>
      </motion.div>
    </motion.div>
  )
}
