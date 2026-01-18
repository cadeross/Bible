"use client";

import { createClient } from "./supabase/client";

// This service will handle saving notes/highlights.
// If Supabase is available (keys exist + user logged in), it syncs.
// Else it could fallback to console warn or local storage.

export interface Highlight {
    id?: string;
    book: string;
    chapter: number;
    verse: number;
    color: string;
    content?: string; // Verse text
    created_at: string;
}

export async function saveHighlight(highlight: Highlight) {
    const supabase = createClient();

    // Check if session exists
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Upsert to avoid duplicates if possible, though ID might be new. 
        // We'll rely on simple insert for now, assuming UI prevents double click spam or handling it gracefully.
        const { error } = await supabase.from('highlights').insert([
            {
                user_id: session.user.id,
                book: highlight.book,
                chapter: highlight.chapter,
                verse: highlight.verse,
                content: highlight.content,
                color: highlight.color
            }
        ]);
        if (error) {
            console.error("Error saving highlight", error);
            throw error;
        }
    } else {
        // Helper to get local data safely
        if (typeof window !== 'undefined') {
            const local = JSON.parse(localStorage.getItem('local_highlights') || '[]');
            local.push(highlight);
            localStorage.setItem('local_highlights', JSON.stringify(local));
        }
    }
}


export async function removeHighlight(book: string, chapter: number, verse: number) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { error } = await supabase.from('highlights').delete().match({ book, chapter, verse, user_id: session.user.id });
        if (error) {
            console.error("Error removing highlight", error);
        }
    } else {
        if (typeof window !== 'undefined') {
            const local = JSON.parse(localStorage.getItem('local_highlights') || '[]');
            const filtered = local.filter((h: Highlight) => !(h.book === book && h.chapter === chapter && h.verse === verse));
            localStorage.setItem('local_highlights', JSON.stringify(filtered));
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
            .eq('book', book)
            .eq('chapter', chapter);

        if (error) {
            console.error("Error fetching highlights", error);
            return [];
        }
        return data || [];
    } else {
        if (typeof window !== 'undefined') {
            const local = JSON.parse(localStorage.getItem('local_highlights') || '[]');
            return local.filter((h: Highlight) => h.book === book && h.chapter === chapter) as Highlight[];
        }
    }
    return [];
}

export async function getAllHighlights(): Promise<Highlight[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { data, error } = await supabase
            .from('highlights')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all highlights", error);
            return [];
        }
        return data || [];
    } else {
        if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('local_highlights') || '[]');
        }
    }
    return [];
}
