import { NextResponse } from "next/server";

// Account system temporarily disabled. The previous `convexAuthNextjsMiddleware()`
// throws on missing NEXT_PUBLIC_CONVEX_URL at request time, which breaks deploys.
// Pass-through middleware until auth is restored — `next.config.ts` redirects
// continue to handle the account-only routes (/auth/*, /profile, /groups, etc.).
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
