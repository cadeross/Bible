"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Greeting() {
  const [date, setDate] = useState<string>("");
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const profile = useQuery(
    api.profiles.getMyProfile,
    isSignedIn ? {} : "skip"
  );

  const username =
    profile?.username ??
    user?.username ??
    user?.firstName ??
    "guest";

  useEffect(() => {
    setDate(
      new Date()
        .toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
        .toLowerCase()
    );
  }, []);

  return (
    <div className="space-y-1">
      <h1 className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-tight">
        welcome, {username}
      </h1>
      <p className="font-mono text-sm text-muted-foreground">{date || "..."}</p>
    </div>
  );
}
