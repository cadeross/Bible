
const { getAllTranslations } = require('./src/lib/bible-api');

async function test() {
    try {
        const translations = await getAllTranslations();
        console.log("Total versions:", translations.length);
        const nrsvce = translations.find(t => t.id === 'nrsvce');
        if (nrsvce) {
            console.log("Found NRSVCE:", nrsvce);
        } else {
            console.log("NRSVCE NOT FOUND");
        }

        // Print all IDs to be sure
        console.log("IDs:", translations.map(t => t.id).join(', '));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
