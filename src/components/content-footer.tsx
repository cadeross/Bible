"use client"

import Link from "next/link"
import { useFocusMode } from "@/contexts/focus-mode"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { openCommandMenu } from "@/lib/open-command-menu"

export function ContentFooter() {
    const pathname = usePathname()
    const { isFocusMode } = useFocusMode()
    const isReadPage = pathname?.startsWith("/read")

    return (
        <footer className={cn(
            "w-full transition-all duration-500 mt-20",
            isReadPage && isFocusMode && "opacity-0 pointer-events-none"
        )}>
            <div className="flex items-center justify-between border-t border-border/15 py-6 text-xs text-muted-foreground/50">
                <div className="flex items-center gap-5">
                    <a
                        href="https://x.com/cadeross"
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors duration-200 hover:text-foreground"
                    >
                        X
                    </a>
                    <a
                        href="https://form.typeform.com/to/b26fjWPA"
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors duration-200 hover:text-foreground"
                    >
                        Contact
                    </a>
                    <Link href="/how-to" className="transition-colors duration-200 hover:text-foreground">
                        Help
                    </Link>
                </div>

                <Link
                    href="/updates"
                    className="transition-colors duration-200 hover:text-foreground"
                >
                    v1.0.2
                </Link>
            </div>
        </footer>
    )
}
