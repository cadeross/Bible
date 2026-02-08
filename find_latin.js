const https = require('https');

const apiKey = 'm1DIXpsDhSNOqJCFX_sCd';
const url = 'https://rest.api.bible/v1/bibles';

const options = {
    headers: {
        'api-key': apiKey
    }
};

https.get(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const latinBibles = json.data.filter(b =>
                b.language.id === 'lat' ||
                b.name.toLowerCase().includes('latin') ||
                b.name.toLowerCase().includes('vulgate')
            );
            console.log('--- Latin Bibles ---');
            latinBibles.forEach(b => {
                console.log(`- ${b.name} (${b.abbreviation}) [ID: ${b.id}] Lang: ${b.language.id}`);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
