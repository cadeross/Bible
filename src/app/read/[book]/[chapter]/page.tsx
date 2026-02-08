import { getChapter } from "@/lib/bible-api";
import { ReadingView } from "@/components/reading/reading-view";
import { Metadata } from "next";

type Props = {
    params: Promise<{
        book: string;
        chapter: string;
    }>;
    searchParams: Promise<{
        translation?: string;
        v?: string; // Verse parameter for shared links (e.g., "16" or "16-18")
    }>;
};

// Parse verse parameter into array of verse numbers
function parseVerseParam(v?: string): number[] {
    if (!v) return [];

    // Single verse: "16" -> [16]
    // Range: "16-18" -> [16, 17, 18]
    if (v.includes('-')) {
        const [start, end] = v.split('-').map(n => parseInt(n, 10));
        if (isNaN(start) || isNaN(end)) return [];
        const verses: number[] = [];
        for (let i = start; i <= end; i++) {
            verses.push(i);
        }
        return verses;
    }

    const num = parseInt(v, 10);
    return isNaN(num) ? [] : [num];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { book, chapter } = await params;
    const bookTitle = decodeURIComponent(book);
    return {
        title: `${bookTitle} ${chapter} - OpenWrit`,
        description: `Read ${bookTitle} chapter ${chapter} on OpenWrit.`,
    };
}

export default async function ChapterPage({ params, searchParams }: Props) {
    const { book, chapter } = await params;
    const { translation = "dra", v } = await searchParams;
    const chapterNum = parseInt(chapter, 10);
    const bookName = decodeURIComponent(book);
    const sharedVerses = parseVerseParam(v);

    try {
        const chapterData = await getChapter(bookName, chapterNum, translation);

        return (
            <ReadingView
                chapter={chapterData}
                book={bookName}
                chapterNum={chapterNum}
                translation={translation}
                sharedVerses={sharedVerses}
                isExplicitTranslation={!!(await searchParams).translation}
            />
        );
    } catch (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Failed to load chapter.</p>
                    <p className="text-muted-foreground text-sm">Please check the reference and try again.</p>
                </div>
            </div>
        );
    }
}
