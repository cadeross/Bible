"use client"

import Link from "next/link"
import { useFocusMode } from "@/contexts/focus-mode"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { openCommandMenu } from "@/lib/open-command-menu"

const footerLinks = [
    { name: "x.com", href: "https://x.com/cadeross", external: true as const },
    { name: "contact", href: "https://form.typeform.com/to/b26fjWPA", external: true as const },
    { name: "search", palette: true as const },
    { name: "how to", href: "/how-to", external: false as const },
] as const

export function ContentFooter() {
    const pathname = usePathname()
    const { isFocusMode } = useFocusMode()
    const isReadPage = pathname?.startsWith("/read")

    return (
        <footer className={cn(
            "w-full transition-all duration-500 mt-16",
            isReadPage && isFocusMode && "opacity-0 pointer-events-none"
        )}>
            <div className="flex items-center justify-between py-6 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                {/* Left: links */}
                <div className="flex items-center gap-3 md:gap-5 flex-wrap">
                    {footerLinks.map((link, i) => (
                        <span key={link.name} className="flex items-center gap-3 md:gap-5">
                            {i > 0 && <span className="text-muted-foreground/45">·</span>}
                            {"palette" in link && link.palette ? (
                                <button
                                    type="button"
                                    onClick={() => openCommandMenu()}
                                    className="cursor-pointer border-none bg-transparent p-0 font-mono uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary"
                                >
                                    {link.name}
                                </button>
                            ) : "external" in link && link.external ? (
                                <a
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-primary transition-colors"
                                >
                                    {link.name}
                                </a>
                            ) : "href" in link ? (
                                <Link href={link.href} className="hover:text-primary transition-colors">
                                    {link.name}
                                </Link>
                            ) : null}
                        </span>
                    ))}
                </div>

                {/* Right: version */}
                <Link
                    href="/updates"
                    className="hover:text-primary transition-colors"
                >
                    v1.0.0
                </Link>
            </div>
        </footer>
    )
}
