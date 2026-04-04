export const BRAND_NAME = "OpenWrit";
export const SITE_NAME = "OpenWrit Bible";
export const SITE_DESCRIPTION =
  "Read Scripture with clarity and focus. OpenWrit is a modern Bible reading app with daily readings, a liturgical calendar, highlights, notes, and translations.";

function normalizeSiteUrl(rawUrl: string | undefined): string {
  const fallback = "http://localhost:3000";

  if (!rawUrl) return fallback;

  const withProtocol = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
    ? rawUrl
    : `https://${rawUrl}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const primary = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  // Prefer explicit site URL, but avoid using localhost canonicals in production.
  if (primary) {
    const normalizedPrimary = normalizeSiteUrl(primary);
    const hostname = new URL(normalizedPrimary).hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (process.env.NODE_ENV === "production" && isLocalhost && vercelProduction) {
      return normalizeSiteUrl(vercelProduction);
    }

    return normalizedPrimary;
  }

  if (vercelProduction) return normalizeSiteUrl(vercelProduction);

  return normalizeSiteUrl(undefined);
}
