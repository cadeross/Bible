"use client";

import { api } from "../../convex/_generated/api";
import { getConvexHttp } from "@/lib/convex/http";
import { persistenceCloud } from "@/lib/persistence-cloud";

function cloudPersistenceReady(): boolean {
  return persistenceCloud.ready;
}

function mapHighlight(row: {
  _id: string;
  userId: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  content: string;
  note?: string;
  createdAt: number;
}): Highlight {
  return {
    id: row._id,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    color: row.color,
    content: row.content,
    note: row.note,
    created_at: new Date(row.createdAt).toISOString(),
    user_id: row.userId,
  };
}

export interface Highlight {
  id?: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  content: string;
  note?: string;
  created_at: string;
  user_id?: string;
}

export interface SavedWisdom {
  id?: string;
  content: string;
  source: string;
  created_at: string;
  user_id?: string;
}

export interface ReadingHistory {
  id?: string;
  book: string;
  chapter: number;
  words_read: number;
  duration_seconds?: number;
  completed_at: string;
  user_id?: string;
}

export interface Profile {
  id: string;
  username?: string | null;
  last_read_book: string | null;
  last_read_chapter: number | null;
  avatar_url: string | null;
  updated_at: string;
}

export async function saveHighlight(highlight: Highlight) {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("highlights");
    let items: Highlight[] = local ? JSON.parse(local) : [];
    items = items.filter(
      (h) =>
        !(
          h.book === highlight.book &&
          h.chapter === highlight.chapter &&
          h.verse === highlight.verse
        )
    );
    items.push(highlight);
    localStorage.setItem("highlights", JSON.stringify(items));
    return;
  }

  const client = getConvexHttp();
  await client.mutation(api.highlights.save, {
    book: highlight.book,
    chapter: highlight.chapter,
    verse: highlight.verse,
    color: highlight.color,
    content: highlight.content,
    note: highlight.note,
    createdAt: Date.parse(highlight.created_at) || undefined,
  });
}

export async function removeHighlight(
  book: string,
  chapter: number,
  verse: number
) {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("highlights");
    if (local) {
      let items: Highlight[] = JSON.parse(local);
      items = items.filter(
        (h) => !(h.book === book && h.chapter === chapter && h.verse === verse)
      );
      localStorage.setItem("highlights", JSON.stringify(items));
    }
    return;
  }

  const client = getConvexHttp();
  await client.mutation(api.highlights.remove, { book, chapter, verse });
}

export async function getHighlights(
  book: string,
  chapter: number
): Promise<Highlight[]> {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("highlights");
    if (local) {
      const items: Highlight[] = JSON.parse(local);
      return items.filter((h) => h.book === book && h.chapter === chapter);
    }
    return [];
  }

  const client = getConvexHttp();
  const rows = await client.query(api.highlights.listForChapter, {
    book,
    chapter,
  });
  return rows.map(mapHighlight);
}

export async function getAllHighlights(): Promise<Highlight[]> {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("highlights");
    return local ? JSON.parse(local) : [];
  }

  const client = getConvexHttp();
  const rows = await client.query(api.highlights.listAll, {});
  return rows.map(mapHighlight);
}

export async function saveWisdom(wisdom: SavedWisdom) {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("wisdom");
    const items: SavedWisdom[] = local ? JSON.parse(local) : [];
    if (!items.find((i) => i.content === wisdom.content)) {
      items.push(wisdom);
      localStorage.setItem("wisdom", JSON.stringify(items));
    }
    return;
  }

  const client = getConvexHttp();
  await client.mutation(api.wisdom.save, {
    content: wisdom.content,
    source: wisdom.source,
    createdAt: Date.parse(wisdom.created_at) || undefined,
  });
}

export async function getAllWisdom(): Promise<SavedWisdom[]> {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("wisdom");
    return local ? JSON.parse(local) : [];
  }

  const client = getConvexHttp();
  const rows = await client.query(api.wisdom.listAll, {});
  return rows.map((row) => ({
    id: row._id,
    content: row.content,
    source: row.source ?? "",
    created_at: new Date(row.createdAt).toISOString(),
    user_id: row.userId,
  }));
}

export async function saveHistory(history: ReadingHistory) {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("reading_history");
    const items: ReadingHistory[] = local ? JSON.parse(local) : [];
    items.push(history);
    localStorage.setItem("reading_history", JSON.stringify(items));
    return;
  }

  const client = getConvexHttp();
  await client.mutation(api.history.add, {
    book: history.book,
    chapter: history.chapter,
    wordsRead: history.words_read,
    durationSeconds: history.duration_seconds ?? 0,
    completedAt: history.completed_at,
  });
}

export async function getHistory(): Promise<ReadingHistory[]> {
  if (!cloudPersistenceReady()) {
    const local = localStorage.getItem("reading_history");
    return local ? JSON.parse(local) : [];
  }

  const client = getConvexHttp();
  const rows = await client.query(api.history.list, {});
  return rows.map((row) => ({
    id: row._id,
    book: row.book,
    chapter: row.chapter,
    words_read: row.wordsRead,
    duration_seconds: row.durationSeconds,
    completed_at: row.completedAt,
    user_id: row.userId,
  }));
}

export async function getProfile(): Promise<Profile | null> {
  if (!cloudPersistenceReady()) return null;

  const client = getConvexHttp();
  const row = await client.query(api.profiles.getMyProfile, {});
  if (!row) return null;
  return {
    id: row.clerkUserId,
    username: row.username ?? null,
    last_read_book: row.lastReadBook ?? null,
    last_read_chapter: row.lastReadChapter ?? null,
    avatar_url: row.avatarUrl ?? null,
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

export async function updateLastRead(book: string, chapter: number) {
  if (!cloudPersistenceReady()) return;

  const client = getConvexHttp();
  await client.mutation(api.profiles.updateLastRead, { book, chapter });
}

export async function uploadAvatar(file: File): Promise<string | null> {
  if (!cloudPersistenceReady()) return null;

  try {
    const client = getConvexHttp();
    const uploadUrl = await client.mutation(
      api.profiles.generateAvatarUploadUrl,
      {}
    );
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) return null;
    const { storageId } = (await res.json()) as { storageId: string };
    return await client.mutation(api.profiles.setAvatarFromStorage, {
      storageId: storageId as unknown as import("../../convex/_generated/dataModel").Id<"_storage">,
    });
  } catch (e) {
    console.error("uploadAvatar", e);
    return null;
  }
}
