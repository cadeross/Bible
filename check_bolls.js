const https = require('https');

const url = 'https://bolls.life/static/translations.json';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const rsv = json.filter(b =>
                b.short_name.toUpperCase() === 'RSV' ||
                b.short_name.toUpperCase() === 'RSVCE' ||
                b.full_name.toUpperCase().includes('REVISED STANDARD')
            );

            console.log('--- Bolls Life RSV matches ---');
            rsv.forEach(b => {
                console.log(`- ${b.full_name} (${b.short_name})`);
            });

            const catholic = json.filter(b => b.full_name.toLowerCase().includes('catholic'));
            console.log('--- Bolls Life Catholic matches ---');
            catholic.forEach(b => {
                console.log(`- ${b.full_name} (${b.short_name})`);
            });

        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
