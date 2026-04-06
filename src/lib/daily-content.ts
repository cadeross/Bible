import { getConvexHttp } from "@/lib/convex/http";
import { api } from "../../convex/_generated/api";

export interface DailyContent {
  id: number;
  date: string;
  verse_ref: string;
  verse_text: string;
  verse_source: string;
  wisdom_text: string;
  wisdom_author: string;
  feast_name: string | null;
  liturgical_season: string | null;
  rank: string | null;
  liturgical_color: string | null;
  created_at: string;
}

export function parseVerseRef(
  ref: string
): { book: string; chapter: number; verse: number } | null {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verse: parseInt(match[3], 10),
  };
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const FALLBACK_CONTENT: DailyContent = {
  id: 0,
  date: getTodayDate(),
  verse_ref: "Genesis 1:1",
  verse_text: "In the beginning God created heaven and earth.",
  verse_source: "DRA",
  wisdom_text: "Our hearts are restless until they rest in Thee.",
  wisdom_author: "St. Augustine of Hippo",
  feast_name: null,
  liturgical_season: null,
  rank: null,
  liturgical_color: null,
  created_at: new Date().toISOString(),
};

function mapRow(row: {
  _id: string;
  date: string;
  verseRef: string;
  verseText: string;
  verseSource: string;
  wisdomText: string;
  wisdomAuthor: string;
  feastName?: string;
  liturgicalSeason?: string;
  rank?: string;
  liturgicalColor?: string;
  createdAt: string;
}): DailyContent {
  return {
    id: 1,
    date: row.date,
    verse_ref: row.verseRef,
    verse_text: row.verseText,
    verse_source: row.verseSource,
    wisdom_text: row.wisdomText,
    wisdom_author: row.wisdomAuthor,
    feast_name: row.feastName ?? null,
    liturgical_season: row.liturgicalSeason ?? null,
    rank: row.rank ?? null,
    liturgical_color: row.liturgicalColor ?? null,
    created_at: row.createdAt,
  };
}

export async function getDailyContent(): Promise<DailyContent> {
  try {
    const today = getTodayDate();
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return { ...FALLBACK_CONTENT, date: today };
    }
    const client = getConvexHttp();
    const data = await client.query(api.dailyContent.getByDate, { date: today });
    if (!data) {
      return { ...FALLBACK_CONTENT, date: today };
    }
    return mapRow(data as Parameters<typeof mapRow>[0]);
  } catch (e) {
    console.error("getDailyContent", e);
    return { ...FALLBACK_CONTENT, date: getTodayDate() };
  }
}

export function getLiturgicalColorClass(color: string | null): string {
  switch (color?.toLowerCase()) {
    case "white":
      return "text-white";
    case "green":
      return "text-green-500";
    case "violet":
    case "purple":
      return "text-purple-500";
    case "red":
      return "text-red-500";
    case "rose":
    case "pink":
      return "text-pink-400";
    case "gold":
      return "text-yellow-500";
    case "black":
      return "text-foreground";
    default:
      return "text-muted-foreground";
  }
}
