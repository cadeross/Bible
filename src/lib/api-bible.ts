"use server";

export interface BibleVersion {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    language: {
        id: string;
        name: string;
    };
}

export interface ApiBibleChapter {
    id: string;
    bibleId: string;
    number: string;
    bookId: string;
    reference: string;
    content: string; // HTML content
    copyright: string;
}

const BASE_URL = 'https://rest.api.bible/v1';

// Server-side only helper to get the key safely
function getApiKey() {
    return process.env.API_BIBLE_KEY || '';
}

export async function getAvailableBibles(): Promise<BibleVersion[]> {
    const key = getApiKey();
    if (!key) throw new Error("API Key missing");

    try {
        // This endpoint (rest.api.bible) seems to reject query params like language=eng
        // So we fetch all and filter manually.
        const res = await fetch(`${BASE_URL}/bibles`, {
            headers: { 'api-key': key }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to fetch bibles: ${res.status} ${res.statusText} - ${errText.substring(0, 100)}`);
        }

        const data = await res.json();

        // Whitelist of allowed versions as per user request
        // "CSB, CNT, NIV, NKJV, New Living Translation, and RV"
        // Note: Assuming "CNT" might be "GNT" (Good News Translation) or "CEV", but stick to likely matches.
        // We match liberally against name or abbreviation.
        const validVersions = [
            'CSB', 'Christian Standard Bible',
            'NIV', 'New International Version',
            'NKJV', 'New King James Version',
            'NLT', 'New Living Translation',
            'RV', 'Revised Version',
            'GNT', 'Good News Translation', // Providing GNT for "CNT" typo
            'CNT' // Just in case it exists and I missed it
        ];

        // Explicit exclusions requested by user
        const excludedAbbrs = ['GNTD', 'GNTDSIR', 'NIVUK11', 'NLTUK', 'WEBBE'];

        return data.data
            .filter((b: any) => b.language.id === 'eng')
            .filter((b: any) => {
                // Check if abbreviation or name contains any of the valid strings
                const abbr = b.abbreviation.toUpperCase();

                if (excludedAbbrs.includes(abbr)) return false;

                const name = b.name;
                return validVersions.some(v =>
                    abbr === v || // strict abbr match
                    (v.length > 3 && name.includes(v)) || // name match
                    (v === 'RV' && abbr === 'engRV') || // RV mapping
                    (v === 'NIV' && abbr.startsWith('NIV')) // Allow NIV variants
                );
            })
            .map((b: any) => ({
                id: b.id,
                name: b.name,
                abbreviation: b.abbreviation,
                description: b.description,
                language: b.language
            }));
    } catch (e) {
        console.error("Error fetching bibles:", e);
        return [];
    }
}

export async function getChapterText(bibleId: string, chapterId: string): Promise<ApiBibleChapter | null> {
    const key = getApiKey();
    if (!key) throw new Error("API Key missing");

    try {
        // chapterId format in API.bible is usually "BOOK.CHAPTER" e.g. "GEN.1"
        const res = await fetch(`${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true`, {
            headers: { 'api-key': key }
        });

        if (!res.ok) {
            console.error(`Failed to fetch chapter ${chapterId} from bible ${bibleId}: ${res.statusText}`);
            return null;
        }

        const data = await res.json();
        const c = data.data;

        return {
            id: c.id,
            bibleId: c.bibleId,
            number: c.number,
            bookId: c.bookId,
            reference: c.reference,
            content: c.content,
            copyright: c.copyright
        };
    } catch (e) {
        console.error("Error fetching chapter text:", e);
        return null;
    }
}
