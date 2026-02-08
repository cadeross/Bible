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
            const rsvBibles = json.data.filter(b =>
                b.name.toLowerCase().includes('revised standard') ||
                b.name.toLowerCase().includes('rsv') ||
                b.abbreviation.toLowerCase().includes('rsv')
            );
            console.log('--- RSV Bibles ---');
            rsvBibles.forEach(b => {
                console.log(`- ${b.name} (${b.abbreviation}) [ID: ${b.id}]`);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
