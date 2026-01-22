"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Heart } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

// Verse of the day - hardcoded for now, could be fetched from an API
const VERSE = {
  text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
  book: "John",
  chapter: 1,
  verse: 1,
  translation: "RSV-CE"
}

// Daily wisdom quote
const WISDOM = {
  text: "Our hearts are restless until they rest in Thee.",
  author: "St. Augustine of Hippo"
}

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
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

  useEffect(() => {
    setMounted(true)
    setGreeting(getGreeting())

    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username)
      }
    }
    getUser()
  }, [])

  const handleHighlight = async () => {
    try {
      const { saveHighlight } = await import("@/lib/persistence")
      await saveHighlight({
        book: VERSE.book,
        chapter: VERSE.chapter,
        verse: VERSE.verse,
        content: VERSE.text,
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
        content: WISDOM.text,
        source: WISDOM.author,
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-0">
      <motion.div
        className="w-full max-w-2xl mx-auto space-y-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-tight">
            {greeting}
          </h1>
          {username ? (
            <p className="font-mono text-lg text-muted-foreground">
              {username}
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2 font-mono text-sm text-muted-foreground/60">
              <Link href="/profile" className="hover:text-primary transition-colors">sign in</Link>
              <span>/</span>
              <Link href="/profile" className="hover:text-primary transition-colors">sign up</Link>
            </div>
          )}
        </motion.div>

        {/* Verse of the Day */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center justify-center gap-3 text-xs font-mono text-muted-foreground/50 uppercase tracking-widest">
            <div className="w-8 h-px bg-border" />
            <span>verse of the day</span>
            <div className="w-8 h-px bg-border" />
          </div>

          <blockquote className="text-center">
            <p className="text-lg md:text-xl font-mono leading-relaxed text-foreground/70">
              "{VERSE.text}"
            </p>
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/read/${VERSE.book}/${VERSE.chapter}`}
              className="font-mono text-sm text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all"
            >
              {VERSE.book} {VERSE.chapter}:{VERSE.verse}
            </Link>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-sm text-muted-foreground/50">
              {VERSE.translation}
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
            <p className="text-lg md:text-xl font-mono leading-relaxed text-foreground/70">
              "{WISDOM.text}"
            </p>
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <span className="font-mono text-sm text-muted-foreground/50">
              — {WISDOM.author}
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
    </div>
  )
}
