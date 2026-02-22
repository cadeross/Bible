"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function ContactPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [name, setName] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                setEmail(session.user.email || "");
                // Try to get name from metadata or fallback to username/email
                const metadata = session.user.user_metadata;
                if (metadata?.full_name) {
                    setName(metadata.full_name);
                } else if (metadata?.name) {
                    setName(metadata.name);
                } else if (metadata?.username) {
                    setName(metadata.username);
                }
            }
        };
        checkUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            toast.success("message sent!", {
                description: "thanks for reaching out. i'll get back to you soon.",
            });

            setMessage("");
        } catch (error) {
            toast.error("failed to send message", {
                description: "please try again later or email directly.",
            });
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-32 p-4 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md space-y-12 relative z-10"
            >
                <div className="flex flex-col items-center text-center gap-4 opacity-70 hover:opacity-100 transition-opacity mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                    >
                        <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                            GET IN TOUCH
                        </h1>
                        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                            have a question or feature request?
                        </p>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {!user && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-mono text-muted-foreground ml-1">name</label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="your name"
                                        required
                                        className="bg-transparent border-0 border-b border-border/50 rounded-none px-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-0 focus:border-b focus:border-primary font-sans placeholder:text-muted-foreground/30 transition-colors h-10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-mono text-muted-foreground ml-1">email</label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        className="bg-transparent border-0 border-b border-border/50 rounded-none px-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-0 focus:border-b focus:border-primary font-sans placeholder:text-muted-foreground/30 transition-colors h-10"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <motion.label
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                htmlFor="message"
                                className="text-xs font-mono text-muted-foreground ml-1 block"
                            >
                                message
                            </motion.label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="what's on your mind?"
                                rows={1}
                                required
                                className="min-h-[2.5rem] bg-transparent border-0 border-b border-border/50 rounded-none px-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary font-sans resize-none placeholder:text-muted-foreground/30 transition-colors overflow-hidden"
                            />
                        </div>

                        <div className="flex justify-center pt-2">
                            <Button
                                type="submit"
                                variant="ghost"
                                disabled={isSending}
                                className="gap-2 font-mono text-sm text-muted-foreground hover:text-primary hover:bg-transparent group transition-colors disabled:opacity-50"
                            >
                                <span>
                                    {isSending ? "sending..." : "send message"}
                                </span>
                                <Send className={`h-3 w-3 transition-transform ${isSending ? "" : "group-hover:translate-x-1"}`} />
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
