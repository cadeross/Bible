"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Church, Clock, Heart, HelpCircle, Library, Search } from "lucide-react"
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

const QuickActionCard = ({
  href,
  onClick,
  title,
  description,
  icon: Icon
}: {
  href?: string
  onClick?: () => void
  title: string
  description: string
  icon: React.ElementType
}) => {
  const content = (
    <>
      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-foreground/90">{title}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60 transition-transform group-hover:translate-x-1" />
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/10 p-4 transition-colors hover:bg-secondary/20 hover:border-border"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/10 p-4 transition-colors hover:bg-secondary/20 hover:border-border"
    >
      {content}
    </button>
  )
}

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

      // Fetch user and daily content in parallel
      const [userResult, content] = await Promise.all([
        supabase.auth.getUser(),
        getDailyContent()
      ])

      if (userResult.data.user?.user_metadata?.username) {
        setUsername(userResult.data.user.user_metadata.username)
      }

      setDailyContent(content)
      setIsLoading(false)
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

  const handleOpenQuickSearch = () => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new Event("open-command-menu"))
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
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.45em] text-muted-foreground/60">
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

        </div>
      </motion.div>

      {/* Daily Focus */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                Verse of the day
              </h2>

              <div className="pl-4 border-l border-border/40 space-y-3">
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
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                Daily wisdom
              </h2>

              <div className="pl-4 border-l border-border/40 space-y-3">
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
                </div>
              </div>
            </div>
          </div>

          <Section title="Quick Actions">
            <div className="grid gap-3">
            <QuickActionCard
              href="/read"
              title="Start reading"
              description="Open a book and start reading."
              icon={BookOpen}
            />
              <QuickActionCard
                onClick={handleOpenQuickSearch}
                title="Search scripture"
                description="Open the quick search palette."
                icon={Search}
              />
            <QuickActionCard
              href="/library"
              title="Your library"
              description="Highlights, wisdom, and notes."
              icon={Library}
            />
              <QuickActionCard
                href="/how-to"
                title="How it works"
                description="Shortcuts, tips, and reading tools."
                icon={HelpCircle}
              />
            </div>
          </Section>
        </div>
      </motion.div>
    </motion.div>
  )
}
