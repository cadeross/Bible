import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, User } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const verseOfTheDay = {
    text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    cisitation: "John 1:1",
    translation: "RSV-CE"
  };

  const quoteOfTheDay = {
    text: "Our hearts are restless until they rest in Thee.",
    author: "St. Augustine of Hippo"
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      {/* MOBILE VIEW */}
      <div className="md:hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md px-4 pt-[env(safe-area-inset-top)]">
          <div className="flex h-16 items-center justify-between">
            <span className="text-xl font-bold tracking-tight">Daily Bread</span>
            <div className="flex gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container max-w-md mx-auto px-4 py-8 space-y-6">
          {/* ... existing mobile content ... */}
          {/* Welcome / Date */}
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold">Good Morning</h1>
            <p className="text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Verse of the Day */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Verse of the Day</h2>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BookOpen size={100} />
              </div>
              <figure className="relative z-10">
                <blockquote className="font-serif text-2xl leading-relaxed">
                  &ldquo;{verseOfTheDay.text}&rdquo;
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <span className="text-primary">{verseOfTheDay.cisitation}</span>
                  <span>•</span>
                  <span>{verseOfTheDay.translation}</span>
                </figcaption>
              </figure>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/read/John/1">Read Chapter</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Quote of the Day */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Catholic Wisdom</h2>
            <div className="rounded-xl border bg-secondary/30 p-6">
              <blockquote className="italic text-lg text-foreground/90">
                "{quoteOfTheDay.text}"
              </blockquote>
              <p className="mt-3 text-right text-sm font-bold text-primary">
                — {quoteOfTheDay.author}
              </p>
            </div>
          </section>

          {/* Continue Reading Shortcut */}
          <section>
            <Button className="w-full h-14 text-lg shadow-md" asChild>
              <Link href="/read">
                <BookOpen className="mr-2 h-5 w-5" />
                Continue Reading
              </Link>
            </Button>
          </section>
        </main>
      </div>

      {/* DESKTOP VIEW (Monkeytype Style) */}
      <div className="hidden md:flex flex-col items-center justify-center min-h-[80vh] w-full max-w-5xl mx-auto px-8">
        <main className="w-full space-y-12">

          {/* Hero / Main Action */}
          <div className="space-y-6 text-center lg:text-left transition-opacity duration-700 animate-in fade-in slide-in-from-bottom-8">
            <h1 className="text-6xl font-serif font-black tracking-tight text-primary">
              The Holy Bible
            </h1>
            <div className="flex flex-col lg:flex-row gap-8 text-muted-foreground font-mono text-lg">
              <Link href="/read" className="group flex items-center gap-2 hover:text-primary transition-colors">
                <span className="text-primary group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-5 w-5 fill-current" />
                </span>
                <span>continue reading</span>
              </Link>
              <Link href="/search" className="group flex items-center gap-2 hover:text-primary transition-colors">
                <span className="text-primary group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-5 w-5" />
                </span>
                <span>search scriptures</span>
              </Link>
              <Link href="/notes" className="group flex items-center gap-2 hover:text-primary transition-colors">
                <span className="text-primary group-hover:scale-110 transition-transform duration-300">
                  <User className="h-5 w-5" />
                </span>
                <span>view notes</span>
              </Link>
            </div>
          </div>

          {/* Quick Content (Verse) */}
          <div className="grid md:grid-cols-2 gap-12 pt-12 border-t border-border/30">
            <div className="space-y-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Verse of the Day</h3>
              <blockquote className="font-serif text-2xl leading-relaxed text-foreground/90">
                &ldquo;{verseOfTheDay.text}&rdquo;
              </blockquote>
              <div className="flex gap-4 font-mono text-xs text-muted-foreground">
                <span className="text-primary">{verseOfTheDay.cisitation}</span>
                <span>{verseOfTheDay.translation}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Daily Wisdom</h3>
              <blockquote className="italic text-xl text-foreground/80">
                "{quoteOfTheDay.text}"
              </blockquote>
              <p className="text-right text-xs font-mono font-bold text-primary">
                — {quoteOfTheDay.author}
              </p>
            </div>
          </div>

          {/* Footer / Stats */}
          <div className="pt-24 flex items-center justify-between text-xs font-mono text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex gap-4">
              <span>words read: 0</span>
              <span>chapters completed: 0</span>
            </div>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-foreground">key bindings</span>
              <span className="cursor-pointer hover:text-foreground">about</span>
              <span className="cursor-pointer hover:text-foreground">donate</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
