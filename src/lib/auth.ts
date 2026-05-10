"use client";

// The account system is temporarily disabled. These hooks return a permanent
// signed-out state so every persistence path falls back to localStorage. The
// real implementations live in git history; restore them when bringing auth
// back online.

type ClerkLikeUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  imageUrl: string | null;
  createdAt: Date | null;
};

const SIGNED_OUT_AUTH = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  orgId: null,
  sessionId: null,
} as const;

const SIGNED_OUT_USER = {
  user: null as ClerkLikeUser | null,
  isLoaded: true,
  isSignedIn: false,
} as const;

export function useAuth() {
  return SIGNED_OUT_AUTH;
}

export function useUser(): { user: ClerkLikeUser | null; isLoaded: boolean; isSignedIn: boolean } {
  return SIGNED_OUT_USER;
}

export function useClerk() {
  return {
    signOut: async (_opts?: { redirectUrl?: string }) => {
      void _opts;
    },
  };
}
