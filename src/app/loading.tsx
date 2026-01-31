"use client"

import { BookOpen } from "lucide-react"
import { motion } from "framer-motion"

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="relative">
                    {/* Glowing effect behind */}
                    <motion.div
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
                    />

                    {/* Icon */}
                    <div className="relative z-10 p-4 rounded-full bg-secondary/10 border border-primary/10">
                        <motion.div
                            animate={{
                                strokeOpacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <BookOpen className="h-8 w-8 text-primary" />
                        </motion.div>
                    </div>
                </div>

                <motion.p
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="text-xs font-mono lowercase tracking-widest text-muted-foreground"
                >
                    loading...
                </motion.p>
            </motion.div>
        </div>
    )
}
