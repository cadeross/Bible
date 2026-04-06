"use client";

import { ConvexHttpClient } from "convex/browser";

const configuredUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const url = configuredUrl || "https://placeholder.convex.cloud";

export const convexHttp = new ConvexHttpClient(url);

export async function syncConvexHttpAuth(
  getToken: () => Promise<string | null | undefined>
) {
  const t = await getToken();
  if (t) {
    convexHttp.setAuth(t);
  } else {
    convexHttp.clearAuth();
  }
}

export function getConvexHttp(): ConvexHttpClient {
  if (!configuredUrl) {
    throw new Error(
      "Set NEXT_PUBLIC_CONVEX_URL in .env.local to use Convex-backed sync."
    );
  }
  return convexHttp;
}
