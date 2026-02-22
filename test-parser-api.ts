import { getAvailableBibles, getChapterText } from './src/lib/api-bible';
import { getChapter } from './src/lib/bible-api';

async function testModernHeadings() {
    try {
        const bibles = await getAvailableBibles();
        console.log("Available Bibles:", bibles.map(b => b.abbreviation || b.id).join(', '));

        // Pick the first API bible
        const testBibleId = bibles[0]?.id;
        if (!testBibleId) {
            console.log("No API bibles found!");
            return;
        }

        console.log(`\nFetching Genesis 1 with ${bibles[0].name} (${testBibleId})...`);
        const chapter = await getChapter("Genesis", 1, testBibleId);

        let headingCount = 0;
        for (const verse of chapter.verses) {
            if (verse.heading) {
                console.log(`\n[HEADING BEFORE VERSE ${verse.verse}]: ${verse.heading}`);
                headingCount++;
            }
            if (verse.verse <= 5) {
                console.log(`${verse.verse}. ${verse.text}`);
            }
        }

        if (headingCount === 0) {
            console.log("\n❌ NO HEADINGS FOUND. Let's look at the raw HTML.");
            const raw = await getChapterText(testBibleId, 'GEN.1');
            console.log("Raw HTML excerpt:", raw?.content.substring(0, 500));
        } else {
            console.log(`\n✅ Found ${headingCount} headings!`);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testModernHeadings();
