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
    }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { book, chapter } = await params;
    const bookTitle = decodeURIComponent(book);
    return {
        title: `${bookTitle} ${chapter} - Daily Bread`,
        description: `Read ${bookTitle} chapter ${chapter} on Daily Bread.`,
    };
}

export default async function ChapterPage({ params, searchParams }: Props) {
    const { book, chapter } = await params;
    const { translation = "dra" } = await searchParams;
    const chapterNum = parseInt(chapter, 10);
    const bookName = decodeURIComponent(book);

    try {
        const chapterData = await getChapter(bookName, chapterNum, translation);

        return (
            <ReadingView
                chapter={chapterData}
                book={bookName}
                chapterNum={chapterNum}
                translation={translation}
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
