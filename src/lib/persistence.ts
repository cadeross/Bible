"use client";

import { createClient } from "./supabase/client";

// Types
export interface Highlight {
    id?: number;
    book: string;
    chapter: number;
    verse: number;
    color: string;
    content: string;
    note?: string; // Add note field
    created_at: string;
    user_id?: string;
}

export interface SavedWisdom {
    id?: number;
    content: string;
    source: string; // e.g. "Proverbs 3:5"
    created_at: string;
    user_id?: string;
}

// --- Highlights ---

export async function saveHighlight(highlight: Highlight) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Safe Save: Check existence first to avoid relying on DB Unique Constraints
        // Use .limit(1) to handle potential duplicates (dirty DB) without crashing
        // Explicitly check columns instead of .match to avoid ambiguity
        // ORDER BY DESC: Ensure we find the MOST RECENT entry if duplicates exist
        const { data: existingRows } = await supabase
            .from('highlights')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('book', highlight.book)
            .eq('chapter', highlight.chapter)
            .eq('verse', highlight.verse)
            .order('created_at', { ascending: false })
            .limit(1);

        const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
        console.log("Persistence: Finding existing row for verse", highlight.verse, "Found ID:", existing?.id);

        if (existing) {
            // Update existing (the newest one)
            console.log("Persistence: Updating existing ID", existing.id, "with color:", highlight.color, "note:", highlight.note);
            const { error } = await supabase
                .from('highlights')
                .update({
                    color: highlight.color,
                    note: highlight.note,
                    content: highlight.content // Update content in case it changed
                })
                .eq('id', existing.id);

            if (error) {
                console.error("Error updating highlight", JSON.stringify(error, null, 2));
                throw error;
            }
        } else {
            console.log("Persistence: Inserting new record for", highlight.verse);
            // Insert new
            const { error } = await supabase
                .from('highlights')
                .insert([{
                    user_id: session.user.id,
                    book: highlight.book,
                    chapter: highlight.chapter,
                    verse: highlight.verse,
                    content: highlight.content,
                    color: highlight.color,
                    note: highlight.note
                }]);

            if (error) {
                console.error("Error inserting highlight", JSON.stringify(error, null, 2));
                throw error;
            }
        }
    } else {
        // Local Storage Fallback
        const local = localStorage.getItem("highlights");
        let items: Highlight[] = local ? JSON.parse(local) : [];

        // Remove existing for this verse if any (to update)
        items = items.filter(h => !(h.book === highlight.book && h.chapter === highlight.chapter && h.verse === highlight.verse));

        items.push(highlight);
        localStorage.setItem("highlights", JSON.stringify(items));
    }
}

export async function removeHighlight(book: string, chapter: number, verse: number) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // We delete by matching fields. If multiple exist, this deletes all matches, which is good.
        const { error } = await supabase
            .from('highlights')
            .delete()
            .match({
                user_id: session.user.id,
                book,
                chapter,
                verse
            });

        if (error) {
            console.error("Error removing highlight", error);
        }
    } else {
        const local = localStorage.getItem("highlights");
        if (local) {
            let items: Highlight[] = JSON.parse(local);
            items = items.filter(h => !(h.book === book && h.chapter === chapter && h.verse === verse));
            localStorage.setItem("highlights", JSON.stringify(items));
        }
    }
}

export async function getHighlights(book: string, chapter: number): Promise<Highlight[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { data, error } = await supabase
            .from('highlights')
            .select('*')
            .match({
                user_id: session.user.id,
                book,
                chapter
            })
            // IMPORTANT: Sort by newest first, so iterating (e.g. .find()) hits the latest update
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching highlights", error);
            return [];
        }
        return data || [];
    } else {
        const local = localStorage.getItem("highlights");
        if (local) {
            const items: Highlight[] = JSON.parse(local);
            return items.filter(h => h.book === book && h.chapter === chapter);
        }
        return [];
    }
}

export async function getAllHighlights(): Promise<Highlight[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { data, error } = await supabase
            .from('highlights')
            .select('*')
            .eq('user_id', session.user.id) // security policy usually handles this but good to be explicit
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all highlights", error);
            return [];
        }
        return data || [];
    } else {
        const local = localStorage.getItem("highlights");
        return local ? JSON.parse(local) : [];
    }
}

// --- Wisdom (Saved Quotes) ---

export async function saveWisdom(wisdom: SavedWisdom) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Check for duplicate content to avoid spamming same quote
        const { data: existingRows } = await supabase
            .from('saved_wisdom')
            .select('id')
            .match({
                user_id: session.user.id,
                content: wisdom.content
            })
            .limit(1);

        const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

        if (!existing) {
            const { error } = await supabase
                .from('saved_wisdom')
                .insert([{
                    user_id: session.user.id,
                    content: wisdom.content,
                    source: wisdom.source,
                    created_at: wisdom.created_at
                }]);

            if (error) console.error("Error saving wisdom", error);
        }
    } else {
        // Local
        const local = localStorage.getItem("wisdom");
        let items: SavedWisdom[] = local ? JSON.parse(local) : [];
        if (!items.find(i => i.content === wisdom.content)) {
            items.push(wisdom);
            localStorage.setItem("wisdom", JSON.stringify(items));
        }
    }
}

export async function getAllWisdom(): Promise<SavedWisdom[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { data, error } = await supabase
            .from('saved_wisdom')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching wisdom", error);
            return [];
        }
        return data || [];
    } else {
        const local = localStorage.getItem("wisdom");
        return local ? JSON.parse(local) : [];
    }
}
// --- Reading History ---

export interface ReadingHistory {
    id?: number;
    book: string;
    chapter: number;
    words_read: number;
    duration_seconds?: number; // New field for time tracking
    completed_at: string;
    user_id?: string;
}

export async function saveHistory(history: ReadingHistory) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Just insert. We treat every chapter visit/read as an event.
        const { error } = await supabase
            .from('reading_history')
            .insert([{
                user_id: session.user.id,
                book: history.book,
                chapter: history.chapter,
                words_read: history.words_read,
                duration_seconds: history.duration_seconds || 0, // Ensure value
                completed_at: history.completed_at
            }]);

        if (error) {
            console.error("Error saving history DETAILS:", JSON.stringify(error, null, 2));
        } else {
            console.log("History saved successfully:", history);
        }
    } else {
        const local = localStorage.getItem("reading_history");
        const items: ReadingHistory[] = local ? JSON.parse(local) : [];
        items.push(history);
        localStorage.setItem("reading_history", JSON.stringify(items));
    }
}

export async function getHistory(): Promise<ReadingHistory[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { data, error } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('completed_at', { ascending: false });

        if (error) {
            // Silently fail if table doesn't exist yet (common in dev before migration)
            // console.warn("History fetch failed, likely no table yet.", error.message);
            return [];
        }
        return data || [];
    } else {
        const local = localStorage.getItem("reading_history");
        return local ? JSON.parse(local) : [];
    }
}
