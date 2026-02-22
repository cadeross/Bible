import { getChapter } from './src/lib/bible-api';

async function testHeadings() {
    try {
        console.log("Fetching Genesis 1 (WEB)...");
        const chapter = await getChapter("Genesis", 1, "web");

        console.log(`\nFound ${chapter.verses.length} verses.`);
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
            console.log("\n❌ NO HEADINGS FOUND in parsed output.");
        } else {
            console.log(`\n✅ Found ${headingCount} headings in parsed output.`);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testHeadings();
