"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40 transition-colors">
            <div className="absolute top-24 left-4 md:top-8 md:left-8">
                <Button variant="ghost" asChild>
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Home</Link>
                </Button>
            </div>
            <AuthTabs onSuccess={() => router.push("/")} />
        </div>
    );
}
