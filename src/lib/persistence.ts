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
    created_at: string;
}

export async function saveHighlight(highlight: Highlight) {
    const supabase = createClient();

    // Check if session exists
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const { error } = await supabase.from('highlights').insert([
            {
                ...highlight,
                user_id: session.user.id
            }
        ]);
        if (error) {
            console.error("Error saving highlight", error);
            throw error;
        }
    } else {
        console.log("User not logged in. Highlight not saved to cloud.");
        // TODO: Implement local storage fallback here if desired
        const local = JSON.parse(localStorage.getItem('local_highlights') || '[]');
        local.push(highlight);
        localStorage.setItem('local_highlights', JSON.stringify(local));
    }
}


export async function removeHighlight(book: string, chapter: number, verse: number) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Cloud delete (mock)
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
        // Mock fetch for now as we don't have the table yet
        // logic: const { data } = await supabase.from('highlights').select('*')...
        return [];
    } else {
        if (typeof window !== 'undefined') {
            const local = JSON.parse(localStorage.getItem('local_highlights') || '[]');
            return local.filter((h: Highlight) => h.book === book && h.chapter === chapter) as Highlight[];
        }
    }
    return [];
}
