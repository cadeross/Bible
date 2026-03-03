import * as cheerio from 'cheerio';

export interface DailyReading {
    title: string;
    reference: string;
    text: string;
    link?: string;
}

export interface DailyReadingsData {
    date: string;
    title: string;
    readings: {
        reading1?: DailyReading;
        psalm?: DailyReading;
        reading2?: DailyReading;
        gospel?: DailyReading;
        alleluia?: DailyReading;
    };
    copyright: string;
}

// Module-level cache: survives across requests within the same serverless instance.
// Acts as a fallback when the USCCB scrape fails mid-day (e.g. USCCB is down).
let lastSuccessfulReadings: DailyReadingsData | null = null

export async function getDailyReadings(): Promise<DailyReadingsData> {
    const url = 'https://bible.usccb.org/daily-bible-reading';

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Revalidate every hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch daily readings: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Improve title selection: ignore hidden or menu headers
        let title = $('.node__title span').text().trim();
        if (!title) {
            const potentialTitles = $('h2').map((i, el) => $(el).text().trim()).get();
            title = potentialTitles.find(t =>
                t.length > 5 &&
                !t.includes("Menu") &&
                !t.includes("Main navigation") &&
                !t.includes("Quick Links")
            ) || $('h1').text().trim();
        }

        // ... rest of init ...
        const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const readings: DailyReadingsData['readings'] = {};

        // USCCB structure usually has content in a specific block.
        const contentArea = $('.field-name-body, .node__content, #block-usccb-content').first();
        const $container = contentArea.length ? contentArea : $('body');

        // Helper to extract section
        const extractSection = (headerText: string): DailyReading | undefined => {
            // Find the header that contains the text
            const $header = $container.find('h3').filter((i, el) => $(el).text().trim().includes(headerText)).first();

            if ($header.length === 0) return undefined;

            // Encapsulate scanning logic
            const scanFromNode = (nodeToScan: any): string => {
                let foundText = '';
                const parent = nodeToScan.parent();
                const contents = parent.contents();
                let idx = -1;
                contents.each((i: number, el: any) => { if (el === nodeToScan[0]) { idx = i; return false; } });

                if (idx !== -1) {
                    for (let i = idx + 1; i < contents.length; i++) {
                        const n = contents[i];
                        const $n = $(n);
                        if (n.type === 'tag') {
                            if (n.tagName === 'h3' || $n.find('h3').length > 0 || $n.hasClass('signup-form') || n.tagName === 'footer') break;
                        }

                        const nText = $n.text().trim();
                        if (!nText) continue;

                        if (n.type === 'tag' && ($n.find(`a[href*="/bible/"]`).length > 0)) {
                            // If it's a wrapper for the ref link, check if it ALSO has text
                            const $clone = $n.clone();
                            $clone.find(`a[href*="/bible/"]`).remove();
                            if ($n.is('a')) $clone.remove(); // if node itself is link
                            const content = $clone.text().trim();
                            if (content) foundText += content + '\n';
                            continue;
                        }

                        // Heuristic: if text is short and looks like reference (starts with number or book name), skip?
                        // But we already removed the link.

                        foundText += nText + '\n';
                    }
                }
                return foundText;
            };

            let text = scanFromNode($header);

            // If empty, and header seems wrapped (shallow parent), try going up
            if (!text.trim() && $header.parent().get(0) !== $container.get(0)) {
                text = scanFromNode($header.parent());
            }

            // Get the reference link
            // We do this after scanning to not depend on it for identifying the text block,
            // but we need it for the returned object.
            // Similar logic to scan for link...
            let $refLink = $header.next().find('a').first();
            if (!$refLink.length) {
                // scanning node might need to go up too
                let $scan = $header;
                if ($header.next().length === 0 && $header.parent().get(0) !== $container.get(0)) {
                    $scan = $header.parent();
                }
                $refLink = $scan.next().find('a').first();
                if (!$refLink.length) $refLink = $scan.nextUntil('h3').find('a').first();
            }

            const reference = $refLink.text().trim();
            let link = $refLink.attr('href');
            if (link && !link.startsWith('http')) {
                link = `https://bible.usccb.org${link}`;
            }

            // Clean up text
            text = text.trim();
            if (reference && text.startsWith(reference)) {
                text = text.substring(reference.length).trim();
            }

            return {
                title: headerText,
                reference,
                text,
                link
            };
        };

        readings.reading1 = extractSection('Reading 1') || extractSection('Reading I');
        readings.psalm = extractSection('Responsorial Psalm');
        readings.reading2 = extractSection('Reading 2') || extractSection('Reading II');
        readings.gospel = extractSection('Gospel');
        readings.alleluia = extractSection('Alleluia');

        // Copyright text - try to be specific to avoid grabbing the whole footer
        let copyright = $container.find('.field-name-field-copyright-text').text().trim();

        if (!copyright) {
            const copyrightNode = $container.find('div, p').filter((i, el) => $(el).text().includes("Confraternity of Christian Doctrine")).last();
            if (copyrightNode.length) {
                copyright = copyrightNode.text().trim();
            } else {
                copyright = "Copyright © United States Conference of Catholic Bishops";
            }
        }

        const result = { date, title, readings, copyright }
        lastSuccessfulReadings = result
        return result

    } catch (error) {
        console.error('Error fetching daily readings:', error);
        if (lastSuccessfulReadings) {
            console.warn('Returning last known readings as fallback');
            return lastSuccessfulReadings;
        }
        throw error;
    }
}
