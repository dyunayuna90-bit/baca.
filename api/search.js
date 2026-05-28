const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
    // 1. Setup CORS Mutlak agar browser lu ga nge-blokir request ini
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Logika lu miss: parameter ?q= wajib diisi.' });
    }

    // 2. Fungsi Ekstraksi LibGen (Sang Raksasa)
    const fetchLibGen = async () => {
        const libgenUrl = `https://libgen.is/search.php?req=${encodeURIComponent(query)}&res=10&view=simple&phrase=1&column=def`;
        const { data } = await axios.get(libgenUrl, { timeout: 10000 });
        const $ = cheerio.load(data);
        const results = [];
        
        $('table.c tr').each((i, el) => {
            if (i === 0) return; // Skip header tabel
            const tds = $(el).find('td');
            if (tds.length < 10) return;

            const author = $(tds[1]).text().trim();
            const titleRaw = $(tds[2]).find('a[id^="title"]').text().trim() || $(tds[2]).text().trim().replace(/\[.*?\]/g, '');
            const ext = $(tds[8]).text().trim().toLowerCase();
            const mirrorUrl = $(tds[9]).find('a').attr('href'); 
            
            // Logika pragmatis: Cuma ambil format yang didukung app lu (PDF & EPUB)
            if ((ext === 'pdf' || ext === 'epub') && mirrorUrl) {
                results.push({
                    title: titleRaw,
                    author: author,
                    source: 'Library Genesis',
                    format: ext,
                    link_download: mirrorUrl // Link ini nanti bakal di-resolve lagi waktu user klik download
                });
            }
        });
        return results;
    };

    // 3. Fungsi Ekstraksi Project Gutenberg (Arsip Klasik)
    const fetchGutenberg = async () => {
        const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { timeout: 8000 });
        
        return data.results.slice(0, 5).map(book => {
            let dlUrl = '';
            let format = '';
            // Prioritaskan EPUB karena format ini paling bersih untuk text-reader
            if (book.formats['application/epub+zip']) {
                dlUrl = book.formats['application/epub+zip'];
                format = 'epub';
            } else if (book.formats['application/pdf']) {
                dlUrl = book.formats['application/pdf'];
                format = 'pdf';
            }

            return {
                title: book.title,
                author: book.authors.map(a => a.name).join(', '),
                source: 'Project Gutenberg',
                format: format,
                link_download: dlUrl
            };
        }).filter(b => b.link_download !== ''); // Buang yang ga ada link downloadnya
    };

    // 4. Fungsi Ekstraksi Open Library (Katalog)
    const fetchOpenLibrary = async () => {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
        const { data } = await axios.get(url, { timeout: 8000 });
        
        return data.docs.map(doc => ({
            title: doc.title,
            author: doc.author_name ? doc.author_name.join(', ') : 'Unknown',
            source: 'Open Library',
            format: 'preview/read', // Realitasnya Open Library jarang ngasih file raw PDF/EPUB
            link_download: `https://openlibrary.org${doc.key}`
        }));
    };

    // 5. Eksekusi Brutal Paralel (Nembak 3 API Bersamaan)
    try {
        const [libgenRes, gutenRes, openLibRes] = await Promise.allSettled([
            fetchLibGen(),
            fetchGutenberg(),
            fetchOpenLibrary()
        ]);

        let combinedResults = [];

        // Kalau status sukses (fulfilled), gabungkan datanya. Kalau gagal (rejected/timeout), lewati.
        if (libgenRes.status === 'fulfilled') combinedResults.push(...libgenRes.value);
        if (gutenRes.status === 'fulfilled') combinedResults.push(...gutenRes.value);
        if (openLibRes.status === 'fulfilled') combinedResults.push(...openLibRes.value);

        // Kirim hasil akhir ke frontend
        res.status(200).json({
            success: true,
            total: combinedResults.length,
            query: query,
            data: combinedResults
        });

    } catch (error) {
        // Fallback error logika
        res.status(500).json({ success: false, error: 'Mesin server collapse saat menarik data.', details: error.message });
    }
}
