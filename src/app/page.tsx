"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Heart, Church } from "lucide-react"
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

// Dynamic greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours()
  const greetings = [
    "good morning",
    "good afternoon",
    "good evening",
    "welcome back",
    "hello again",
    "greetings"
  ]

  if (hour >= 5 && hour < 12) return greetings[0] // morning
  if (hour >= 12 && hour < 17) return greetings[1] // afternoon
  if (hour >= 17 && hour < 22) return greetings[2] // evening

  // Late night/random variation
  return greetings[Math.floor(Math.random() * 3) + 3]
}

export default function Home() {
  const [username, setUsername] = useState<string>("")
  const [greeting, setGreeting] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    setGreeting(getGreeting())

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

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
      </div>
    )
  }

  return (
    <motion.div
      className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-tight">
          {greeting}
        </h1>
        {username ? (
          <Link href="/profile" className="font-mono text-lg text-muted-foreground hover:text-primary transition-colors">
            {username}
          </Link>
        ) : (
          <div className="flex items-center justify-center font-mono text-sm text-muted-foreground/60">
            <Link href="/profile" className="hover:text-primary transition-colors">
              sign in / sign up
            </Link>
          </div>
        )}
      </motion.div>

      {/* Liturgical Info (if available) */}
      {(dailyContent.feast_name || dailyContent.liturgical_season) && (
        <motion.div variants={itemVariants} className="text-center space-y-2">
          {dailyContent.feast_name && (
            <div className="flex items-center justify-center gap-2">
              <Church className={`h-4 w-4 ${getLiturgicalColorClass(dailyContent.liturgical_color)}`} />
              <span className={`font-mono text-sm ${getLiturgicalColorClass(dailyContent.liturgical_color)}`}>
                {dailyContent.feast_name}
              </span>
            </div>
          )}
          {dailyContent.liturgical_season && !dailyContent.feast_name && (
            <span className={`font-mono text-xs text-muted-foreground/60`}>
              {dailyContent.liturgical_season}
              {dailyContent.rank && dailyContent.rank !== 'Weekday' && ` · ${dailyContent.rank}`}
            </span>
          )}
        </motion.div>
      )}

      {/* Verse of the Day */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-center gap-3 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
          <div className="w-8 h-px bg-border" />
          <span>verse of the day</span>
          <div className="w-8 h-px bg-border" />
        </div>

        <blockquote className="text-center">
          <p className={`text-lg md:text-xl font-mono leading-relaxed text-foreground/70 ${isLoading ? 'animate-pulse' : ''}`}>
            "{dailyContent.verse_text}"
          </p>
        </blockquote>

        {/* Unified hover container */}
        <div className="group flex items-center justify-center gap-4 transition-opacity duration-300 hover:opacity-100 opacity-60">
          {parsedVerse ? (
            <Link
              href={`/read/${parsedVerse.book}/${parsedVerse.chapter}`}
              className="font-mono text-sm text-primary transition-colors"
            >
              {dailyContent.verse_ref}
            </Link>
          ) : (
            <span className="font-mono text-sm text-primary">
              {dailyContent.verse_ref}
            </span>
          )}
          <span className="text-muted-foreground/30">·</span>
          <span className="font-mono text-sm text-muted-foreground/50">
            {dailyContent.verse_source}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <button
            onClick={handleHighlight}
            className="font-mono text-sm text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
          >
            <BookOpen className="h-3 w-3" />
            save
          </button>
        </div>
      </motion.div>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="w-1 h-1 rounded-full bg-primary/20" />
      </motion.div>

      {/* Daily Wisdom */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-center gap-3 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
          <div className="w-8 h-px bg-border" />
          <span>daily wisdom</span>
          <div className="w-8 h-px bg-border" />
        </div>

        <blockquote className="text-center">
          <p className={`text-lg md:text-xl font-mono leading-relaxed text-foreground/70 ${isLoading ? 'animate-pulse' : ''}`}>
            "{dailyContent.wisdom_text}"
          </p>
        </blockquote>

        <div className="flex items-center justify-center gap-4">
          <span className="font-mono text-sm text-muted-foreground/50">
            — {dailyContent.wisdom_author}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <button
            onClick={handleSaveWisdom}
            className="font-mono text-sm text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
          >
            <Heart className="h-3 w-3" />
            save
          </button>
        </div>
      </motion.div>

      {/* Start Reading CTA */}
      <motion.div variants={itemVariants} className="flex justify-center pt-4">
        <Link
          href="/read"
          className="group flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <span>start reading</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.div>
  )
}
