// --- READER ENGINE ---
// File ini mengurus semua logika berat: Parsing PDF, Ekstrak EPUB, In-Book Search, & Gemini AI.

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
}

// 1. EVENT LISTENER UNTUK UPLOAD BUKU & PENCARIAN
let inbookSearchTimeout;
document.addEventListener("DOMContentLoaded", () => {
    // Listener Upload File (PDF/EPUB/TXT/MD) — support multi-file
    const fileInput = document.getElementById('doc-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            await processMultipleFiles(files);
            e.target.value = '';
        });
    }

    // Listener Scan Folder (input folder picker)
    const folderInput = document.getElementById('folder-scan-upload');
    if (folderInput) {
        folderInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files).filter(f => {
                const ext = f.name.split('.').pop().toLowerCase();
                return ['pdf', 'epub', 'txt', 'md'].includes(ext);
            });
            if (!files.length) {
                showDialog("Info", "Tidak ada file PDF, EPUB, TXT, atau MD di folder ini.", "info", [{text: "Oke", primary: true}]);
                return;
            }
            await processMultipleFiles(files);
            e.target.value = '';
        });
    }

    // Listener Pencarian dalam Buku
    const searchInputEl = document.getElementById('inbook-search-input');
    const searchResEl = document.getElementById('search-results-panel');

    if(searchInputEl) {
        searchInputEl.addEventListener('input', (e) => {
            clearTimeout(inbookSearchTimeout);
            const val = e.target.value.trim().toLowerCase();
            if (!val || val.length < 2) { 
                if(searchResEl) searchResEl.classList.add('hidden'); 
                clearSearchHighlights();
                return; 
            }
            
            inbookSearchTimeout = setTimeout(() => {
                const lib = typeof library !== 'undefined' ? library : [];
                const currentBookId = typeof activeBookId !== 'undefined' ? activeBookId : null;
                const book = lib.find(b => b.id === currentBookId);
                if (!book || !book.nodes) return;
                
                const results = [];
                const regex = new RegExp(`(${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                
                book.nodes.forEach((node, i) => {
                    if (node.tag !== 'img' && node.text && node.text.toLowerCase().includes(val)) {
                        let snippet = node.text;
                        const matchIdx = snippet.toLowerCase().indexOf(val);
                        let start = Math.max(0, matchIdx - 40);
                        let end = Math.min(snippet.length, matchIdx + val.length + 40);
                        let preview = snippet.substring(start, end);
                        if(start > 0) preview = "..." + preview;
                        if(end < snippet.length) preview = preview + "...";
                        
                        preview = preview.replace(regex, '<mark class="bg-m3-primary text-m3-onPrimary rounded px-0.5">$1</mark>');
                        
                        let contextStr = "Chapter / Section";
                        for(let j=i; j>=0; j--){
                            if(book.nodes[j].tag === 'h1' || book.nodes[j].tag === 'h2') {
                                contextStr = book.nodes[j].text.length > 25 ? book.nodes[j].text.substring(0,25)+'...' : book.nodes[j].text;
                                break;
                            }
                        }
                        
                        results.push({ nodeIdx: i, preview: preview, context: contextStr });
                    }
                });

                renderSearchResults(results, val);
            }, 400);
        });
    }
});

// 1b. PROSES BANYAK FILE SEKALIGUS (multi-select atau folder scan)
// Queue system: kalau ada proses yang sedang berjalan, tambahkan ke antrian
let _importQueue = [];
let _importRunning = false;
let _importTotalQueued = 0;
let _importDoneCount = 0;

async function processMultipleFiles(files) {
    // Tambahkan semua file ke queue global
    for (const f of files) _importQueue.push(f);
    _importTotalQueued += files.length;

    // Jika sudah ada runner aktif, cukup tambah ke queue — runner terus drain
    // Update label total supaya angka (1/2) langsung berubah tanpa flicker
    if (_importRunning) {
        if (DOM.loadTxt) {
            const currentLabel = DOM.loadTxt.textContent;
            const match = currentLabel.match(/\((\d+)\/\d+\)(.*)/);
            if (match) DOM.loadTxt.textContent = `(${match[1]}/${_importTotalQueued})${match[2]}`;
        }
        return;
    }

    // Mulai runner
    _importRunning = true;
    _importDoneCount = 0;
    const failed = [];
    let imported = 0;

    // Pastikan card terlihat dan tidak di-hide oleh timeout lama
    DOM.load.classList.remove('hidden');

    while (_importQueue.length > 0) {
        const file = _importQueue.shift();
        const originalFilename = file.name;
        const ext = originalFilename.split('.').pop().toLowerCase();
        const bookTitle = originalFilename.replace(/\.[^/.]+$/, "");

        const currentIdx = _importDoneCount + 1;
        const totalNow = _importTotalQueued;
        DOM.loadBar.style.width = '0%';
        DOM.loadPct.textContent = '0%';
        if (DOM.loadTxt) DOM.loadTxt.textContent = `(${currentIdx}/${totalNow}) ${bookTitle}`;

        try {
            if (ext === 'pdf') await handlePdf(file, bookTitle);
            else if (ext === 'epub') await handleEpub(file, bookTitle);
            else if (ext === 'txt') await handleTxt(file, bookTitle);
            else if (ext === 'md') await handleMd(file, bookTitle);
            else { _importDoneCount++; continue; }
            imported++;
        } catch (err) {
            console.error(`Gagal import: ${bookTitle}`, err);
            failed.push(bookTitle);
        }
        _importDoneCount++;

        // Update label total secara real-time setelah setiap buku selesai
        // (supaya kalau ada buku ditambahkan di tengah jalan, totalnya langsung update)
        const nextIdx = _importDoneCount + 1;
        const nextTotal = _importTotalQueued;
        if (_importQueue.length > 0 && DOM.loadTxt) {
            const nextFile = _importQueue[0];
            const nextTitle = nextFile.name.replace(/\.[^/.]+$/, "");
            DOM.loadTxt.textContent = `(${nextIdx}/${nextTotal}) ${nextTitle}`;
        }
    }

    // Semua selesai — reset state
    _importRunning = false;
    const grandTotal = _importTotalQueued;
    _importTotalQueued = 0;
    _importDoneCount = 0;

    DOM.loadBar.style.width = '100%';
    DOM.loadPct.textContent = '100%';
    // Hide card dengan delay supaya user sempat lihat 100%
    setTimeout(() => { DOM.load.classList.add('hidden'); }, 900);
    if (DOM.loadTxt) DOM.loadTxt.textContent = 'Reading Document...';

    let summary = `${imported} buku berhasil diimpor.`;
    if (failed.length > 0) summary += `\n${failed.length} gagal: ${failed.join(', ')}`;

    if (grandTotal > 1 || failed.length > 0) {
        showDialog("Selesai Import", summary, "check-circle", [{ text: "Oke", primary: true }]);
    }
}

// 1c. HANDLER TXT
async function handleTxt(file, bookTitle) {
    const text = await file.text();
    const parsedNodes = [];

    let paragraphs = text.split(/\n\s*\n/).map(p => p.trim().replace(/\s+/g, ' ')).filter(p => p.length > 0);

    if (paragraphs.length <= 1) {
        paragraphs = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    }

    paragraphs.forEach(para => {
        const isHeading = para.length < 80 && (
            /^(bab|chapter|bagian|part|section)\s/i.test(para) ||
            /^[IVX]+\./i.test(para) ||
            /^\d+[\.\)]\s/.test(para) ||
            para === para.toUpperCase()
        );
        parsedNodes.push({ tag: isHeading ? 'h2' : 'p', text: para });
    });

    if (parsedNodes.length === 0) throw new Error("File TXT kosong atau tidak bisa dibaca.");

    // [ID PERMANEN]: ID dari nama file, bukan timestamp — supaya restore + import ulang nyambung otomatis
    const bookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const existingIndex = library.findIndex(b => b.id === bookId);

    // [OPTIMASI DEWA]: Langsung mutilasi data di sumber — teks ke laci sendiri, library cuma KTP
    await localforage.setItem('content_' + bookId, parsedNodes);

    if (existingIndex === -1) {
        library.push({
            id: bookId,
            type: 'txt',
            title: bookTitle,
            pages: Math.ceil(parsedNodes.length / 10),
            progressPct: 0,
            lastReadId: null,
            shape: 'square'
        });
    } else {
        library[existingIndex].pages = Math.ceil(parsedNodes.length / 10);
        library[existingIndex].title = bookTitle;
    }

    await localforage.setItem('pdf_epub_master', library);
    renderLibrary();
}

// 1d. HANDLER MD (MARKDOWN)
async function handleMd(file, bookTitle) {
    if (typeof marked === 'undefined') throw new Error("Library marked.js tidak ditemukan.");
    
    const text = await file.text();
    const htmlStr = marked.parse(text);
    const doc = (new DOMParser()).parseFromString(htmlStr, "text/html");
    
    let parsedNodes = [];
    const validBlockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre'];

    const allElements = doc.body.querySelectorAll('*');
    for (let el of allElements) {
        let tag = el.tagName.toLowerCase();
        
        if (tag === 'img' || tag === 'image') {
            let src = el.getAttribute('src');
            if (src) parsedNodes.push({ tag: 'img', src: src });
            continue;
        }

        if (validBlockTags.includes(tag)) {
            let hasBlockChild = false;
            const descendants = el.querySelectorAll('*');
            for (let i = 0; i < descendants.length; i++) {
                if (validBlockTags.includes(descendants[i].tagName.toLowerCase())) {
                    hasBlockChild = true;
                    break;
                }
            }
            
            if (hasBlockChild) continue;
            
            let textContent = el.textContent.trim().replace(/\s+/g, ' ');
            if (textContent.length === 0) continue;
            
            let finalTag = 'p';
            if (['h1', 'h2', 'h3', 'h4'].includes(tag)) finalTag = tag === 'h1' ? 'h1' : 'h2';
            
            parsedNodes.push({ tag: finalTag, text: textContent });
        }
    }

    if (parsedNodes.length === 0) throw new Error("File MD kosong atau tidak valid.");

    // [ID PERMANEN]: ID dari nama file, bukan timestamp
    const bookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const existingIndex = library.findIndex(b => b.id === bookId);

    // [OPTIMASI DEWA]: Langsung mutilasi data di sumber — teks ke laci sendiri, library cuma KTP
    await localforage.setItem('content_' + bookId, parsedNodes);

    if (existingIndex === -1) {
        library.push({
            id: bookId,
            type: 'md',
            title: bookTitle,
            pages: Math.ceil(parsedNodes.length / 10),
            progressPct: 0,
            lastReadId: null,
            shape: 'square'
        });
    } else {
        library[existingIndex].pages = Math.ceil(parsedNodes.length / 10);
        library[existingIndex].title = bookTitle;
    }

    await localforage.setItem('pdf_epub_master', library);
    renderLibrary();
}

function clearSearchHighlights() {
    if(!DOM.inner) return;
    const marks = DOM.inner.querySelectorAll('mark.search-hl');
    marks.forEach(m => {
        const parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
    });
}

function renderSearchResults(results, keyword) {
    const searchResEl = document.getElementById('search-results-panel');
    const readContentEl = document.getElementById('reader-content');
    if(!searchResEl) return;
    searchResEl.innerHTML = '';
    const lang = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
    const d = (typeof i18n !== 'undefined' ? (i18n[lang] || i18n['id']) : {});
    
    if(results.length === 0) {
        searchResEl.innerHTML = `<div class="p-6 text-center text-sm opacity-60 font-medium">${d.searchNotFound || 'Tidak ditemukan'}</div>`;
        searchResEl.classList.remove('hidden');
        return;
    }
    
    const countHeader = document.createElement('div');
    countHeader.className = "px-4 pt-3 pb-2 text-xs font-bold uppercase tracking-wider text-m3-primary/80 border-b border-m3-surfaceVariant";
    countHeader.textContent = `${results.length} Found`;
    searchResEl.appendChild(countHeader);

    results.forEach(res => {
        const item = document.createElement('div');
        item.className = "p-4 border-b border-m3-surfaceVariant hover:bg-m3-surface transition-colors cursor-pointer";
        item.innerHTML = `
            <div class="text-[10px] font-bold text-m3-primary mb-1 uppercase tracking-widest">${res.context}</div>
            <div class="text-sm text-m3-onSurface leading-relaxed line-clamp-3">${res.preview}</div>
        `;
        
        item.onclick = () => {
            const lib = typeof library !== 'undefined' ? library : [];
            const currentBookId = typeof activeBookId !== 'undefined' ? activeBookId : null;
            const book = lib.find(b => b.id === currentBookId);
            if(!book) return;
            
            searchResEl.classList.add('hidden');
            const targetEl = document.getElementById(`node-${res.nodeIdx}`);
            const container = readContentEl;
            
            if(targetEl && container) {
                clearSearchHighlights();
                
                const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                
                const walker = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT, null, false);
                const textNodes = [];
                let n;
                while(n = walker.nextNode()) textNodes.push(n);
                
                textNodes.forEach(node => {
                    const text = node.nodeValue;
                    if(regex.test(text)) {
                        const span = document.createElement('span');
                        span.innerHTML = text.replace(regex, '<mark class="search-hl transition-colors duration-1000">$1</mark>');
                        node.parentNode.replaceChild(span, node);
                    }
                });

                const cRect = container.getBoundingClientRect();
                const tRect = targetEl.getBoundingClientRect();
                const offset = tRect.top - cRect.top + container.scrollTop - (cRect.height / 2) + (tRect.height / 2);
                
                container.scrollTo({ top: offset, behavior: 'smooth' });
                
                setTimeout(() => {
                    const marks = targetEl.querySelectorAll('mark.search-hl');
                    marks.forEach(m => {
                        m.style.backgroundColor = 'transparent';
                        m.style.color = 'inherit';
                    });
                    setTimeout(() => clearSearchHighlights(), 1500);
                }, 2000);
            }
        };
        
        searchResEl.appendChild(item);
    });
    searchResEl.classList.remove('hidden');
}

// 2. FUNGSI EKSTRAK PDF — ENGINE GENERASI BARU
// Strategi: Header/Footer Ghost Detection + Multi-Pass Font Profiling + 
//           Heading Scoring System + Cross-Page Stitching + TOC Deduplication
async function handlePdf(file, bookTitle) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let parsedNodes = [];
    const total = pdf.numPages;

    // --- EKSTRAK COVER ---
    const coverCanvas = document.createElement('canvas');
    const coverCtx = coverCanvas.getContext('2d');
    const firstPage = await pdf.getPage(1);
    const viewport = firstPage.getViewport({ scale: 0.5 });
    coverCanvas.width = viewport.width;
    coverCanvas.height = viewport.height;
    await firstPage.render({ canvasContext: coverCtx, viewport: viewport }).promise;
    const coverBase64 = coverCanvas.toDataURL('image/jpeg', 0.8);

    // ===================================================================
    // PASS 1: FULL-DOCUMENT FONT PROFILING + GHOST TEXT DETECTION
    // Tujuan: cari baseFontSize akurat + deteksi header/footer buku 
    //         (teks yang muncul berulang di koordinat Y yg sama lintas halaman)
    // ===================================================================
    let fontSizeWeights = {};    // { fontSize: totalCharCount }
    let fontSizeLineCounts = {}; // { fontSize: jumlah baris }

    // Struktur untuk ghost detection: kumpulkan semua teks per "zona Y relatif"
    // Zona Y: kita normalisasi Y ke persentase tinggi halaman (0.0 - 1.0)
    // Teks di zona < 8% (atas) atau > 92% (bawah) yang PERSIS SAMA di banyak halaman = ghost
    const topZoneTexts = {};    // { normalizedText: count }
    const bottomZoneTexts = {}; // { normalizedText: count }

    // Sample seluruh dokumen untuk profiling (bukan cuma 10 hal)
    const profilingSample = Math.min(total, 40);
    let pageHeights = {};

    for (let i = 1; i <= profilingSample; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pViewport = page.getViewport({ scale: 1 });
        const pageH = pViewport.height;
        pageHeights[i] = pageH;

        textContent.items.forEach(item => {
            if (!item.str || item.str.trim().length === 0) return;
            const h = Math.round(item.height);
            if (h <= 0) return;

            fontSizeWeights[h] = (fontSizeWeights[h] || 0) + item.str.trim().length;
            fontSizeLineCounts[h] = (fontSizeLineCounts[h] || 0) + 1;

            // Ghost zone detection
            const yRatio = item.transform[5] / pageH;
            const normalizedStr = item.str.trim().toLowerCase().replace(/\s+/g, ' ');
            if (normalizedStr.length < 3) return;

            if (yRatio > 0.92) {
                // zona atas (PDF Y-axis terbalik: tinggi = atas)
                topZoneTexts[normalizedStr] = (topZoneTexts[normalizedStr] || 0) + 1;
            } else if (yRatio < 0.08) {
                // zona bawah
                bottomZoneTexts[normalizedStr] = (bottomZoneTexts[normalizedStr] || 0) + 1;
            }
        });
    }

    // Tentukan baseFontSize: font dengan bobot karakter terbanyak
    let baseFontSize = 12;
    let maxWeight = 0;
    for (const [size, weight] of Object.entries(fontSizeWeights)) {
        if (weight > maxWeight) {
            maxWeight = weight;
            baseFontSize = parseInt(size);
        }
    }

    // Tentukan threshold ghost: teks yang muncul di > 25% halaman sample = ghost (header/footer buku)
    const ghostThreshold = Math.max(3, Math.floor(profilingSample * 0.25));
    const ghostSet = new Set();
    for (const [txt, count] of Object.entries(topZoneTexts)) {
        if (count >= ghostThreshold) ghostSet.add(txt);
    }
    for (const [txt, count] of Object.entries(bottomZoneTexts)) {
        if (count >= ghostThreshold) ghostSet.add(txt);
    }
    // Tambahkan judul buku sendiri ke ghost set (cegah judul berulang di TOC)
    const bookTitleNorm = bookTitle.toLowerCase().replace(/\s+/g, ' ').trim();
    if (bookTitleNorm.length > 2) ghostSet.add(bookTitleNorm);

    // ===================================================================
    // PASS 2: TENTUKAN THRESHOLD HEADING BERBASIS DATA NYATA
    // Kita cari distribusi ukuran font: baseFontSize = body, sisanya = kandidat heading
    // ===================================================================

    // Kumpulkan semua ukuran font yang punya line count signifikan
    const significantSizes = Object.entries(fontSizeLineCounts)
        .filter(([, count]) => count >= 2)
        .map(([size]) => parseInt(size))
        .sort((a, b) => a - b);

    // Heading level: font yang lebih besar dari baseFontSize secara bermakna
    // h1Threshold: >= baseFontSize * 1.35 (bab/chapter), h2Threshold: >= baseFontSize * 1.12 (sub-bab)
    const h1FontThreshold = baseFontSize * 1.35;
    const h2FontThreshold = baseFontSize * 1.10;

    // ===================================================================
    // PASS 3: EKSTRAKSI TEKS PER HALAMAN + SMART STITCHING
    // ===================================================================

    // rawBlocks: array of { text, maxFontSize, pageIndex, yRatio, xCenter, pageWidth }
    // Kita kumpulkan dulu semua blok mentah SEBELUM tentukan tag-nya
    let rawBlocks = [];
    let pendingCarryOver = ""; // teks yang belum selesai kalimatnya, dibawa ke halaman berikut

    for (let i = 1; i <= total; i++) {
        DOM.loadBar.style.width = `${Math.round((i / total) * 100)}%`;
        DOM.loadPct.textContent = `${Math.round((i / total) * 100)}%`;

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pViewport = page.getViewport({ scale: 1 });
        const pageH = pViewport.height;
        const pageW = pViewport.width;

        // Kumpulkan items valid di halaman ini
        let items = textContent.items.filter(item => item.str !== undefined);

        // Kelompokkan items ke dalam "baris" berdasarkan Y yang sama (toleransi ±2px)
        let lines = []; // array of { y, items: [...] }
        for (const item of items) {
            const y = Math.round(item.transform[5]);
            const existingLine = lines.find(l => Math.abs(l.y - y) <= 2);
            if (existingLine) {
                existingLine.items.push(item);
            } else {
                lines.push({ y, items: [item] });
            }
        }

        // Urutkan baris dari atas ke bawah (Y descending dalam koordinat PDF)
        lines.sort((a, b) => b.y - a.y);

        // Hitung X center halaman untuk deteksi teks tengah (judul bab sering di tengah)
        const pageXCenter = pageW / 2;

        // Proses setiap baris → susun jadi blok
        let currentBlock = pendingCarryOver;
        let currentBlockMaxFont = 0;
        let currentBlockYRatio = -1;
        let currentBlockXCenter = -1;
        let lastLineY = -1;
        pendingCarryOver = "";

        const flushBlock = () => {
            if (currentBlock.trim().length === 0) return;
            rawBlocks.push({
                text: currentBlock.trim(),
                maxFontSize: currentBlockMaxFont,
                pageIndex: i,
                yRatio: currentBlockYRatio,
                xCenter: currentBlockXCenter,
                pageWidth: pageW
            });
            currentBlock = "";
            currentBlockMaxFont = 0;
            currentBlockYRatio = -1;
            currentBlockXCenter = -1;
        };

        for (const line of lines) {
            const lineY = line.y;
            const yRatio = lineY / pageH;

            // Ambil font terbesar di baris ini
            let lineMaxFont = 0;
            let lineStr = "";
            let lineXSum = 0;
            let lineXCount = 0;

            // Urutkan items dalam baris dari kiri ke kanan
            line.items.sort((a, b) => a.transform[4] - b.transform[4]);

            for (const item of line.items) {
                if (!item.str) continue;
                const h = item.height || 0;
                if (h > lineMaxFont) lineMaxFont = h;

                const x = item.transform[4];
                const w = item.width || 0;
                lineXSum += x + w / 2;
                lineXCount++;

                // Spatial stitching dalam satu baris
                if (lineStr.length > 0) {
                    // Cek gap X
                    const prevItem = line.items[line.items.indexOf(item) - 1];
                    if (prevItem) {
                        const gapX = x - (prevItem.transform[4] + (prevItem.width || 0));
                        if (gapX > baseFontSize * 0.25 && !lineStr.endsWith(' ')) {
                            lineStr += ' ';
                        }
                    }
                }

                // Hyphenation handling
                if (lineStr.match(/-\s*$/) && item.str.trim().length > 0) {
                    lineStr = lineStr.replace(/-\s*$/, '') + item.str.trimStart();
                } else {
                    lineStr += item.str;
                }
            }

            lineStr = lineStr.replace(/\s+/g, ' ').trim();
            if (lineStr.length === 0) continue;

            // Cek apakah ini ghost text (header/footer buku)
            const lineNorm = lineStr.toLowerCase().replace(/\s+/g, ' ');
            if (ghostSet.has(lineNorm)) continue;

            // Cek apakah ini nomor halaman murni (hanya angka, ±1-4 digit)
            if (/^\d{1,4}$/.test(lineStr)) continue;

            // Cek apakah ini teks sangat pendek di zona ghost tanpa "nilai konten" (< 5 char)
            if (lineStr.length < 4 && (yRatio > 0.90 || yRatio < 0.10)) continue;

            const lineXCenter = lineXCount > 0 ? lineXSum / lineXCount : pageXCenter;

            // --- Tentukan apakah baris ini perlu flush block baru ---
            let shouldFlush = false;
            if (lastLineY !== -1) {
                const gapY = Math.abs(lastLineY - lineY);
                // Flush jika:
                // 1. Gap besar (> 1.8x baseFont) = pergantian paragraf/section
                // 2. Font size baris ini berbeda signifikan dengan blok saat ini (kemungkinan heading baru)
                // 3. Blok saat ini adalah heading (font besar) → selalu flush setelah heading selesai
                const isBigGap = gapY > (baseFontSize * 1.8);
                const isFontJump = (lineMaxFont > h2FontThreshold && currentBlockMaxFont <= baseFontSize * 1.05)
                    || (currentBlockMaxFont > h2FontThreshold && lineMaxFont <= baseFontSize * 1.05);

                if (isBigGap || isFontJump) {
                    shouldFlush = true;
                }
            }

            if (shouldFlush) {
                flushBlock();
                currentBlock = lineStr;
                currentBlockMaxFont = lineMaxFont;
                currentBlockYRatio = yRatio;
                currentBlockXCenter = lineXCenter;
            } else {
                if (currentBlock.length > 0) {
                    // Sambung baris: cek hyphenation antar baris
                    if (currentBlock.match(/-\s*$/)) {
                        currentBlock = currentBlock.replace(/-\s*$/, '') + lineStr.trimStart();
                    } else {
                        if (!currentBlock.endsWith(' ')) currentBlock += ' ';
                        currentBlock += lineStr;
                    }
                    if (lineMaxFont > currentBlockMaxFont) currentBlockMaxFont = lineMaxFont;
                } else {
                    currentBlock = lineStr;
                    currentBlockMaxFont = lineMaxFont;
                    currentBlockYRatio = yRatio;
                    currentBlockXCenter = lineXCenter;
                }
            }

            lastLineY = lineY;
        }

        // Di akhir halaman, cek apakah blok terakhir kalimatnya belum selesai
        // Carry-over HANYA untuk paragraf pendek yang jelas terpotong di tengah kata/kalimat
        if (currentBlock.trim().length > 0) {
            const trimmed = currentBlock.trim();
            const fontSize = currentBlockMaxFont;
            const wordCount = trimmed.split(/\s+/).length;

            // Carry-over jika: bukan heading, kalimat SANGAT pendek (< 5 kata),
            // tidak diakhiri tanda kalimat selesai, dan tidak diakhiri titik dua/tanda kutip
            // Batasi carry-over maksimal — jangan gabung paragraf panjang yang kebetulan tidak ada titiknya
            const isLikelyCutOff = fontSize <= baseFontSize * 1.08
                && wordCount < 6
                && !trimmed.match(/[.!?:;»"')\]。！？]+$/)
                && trimmed.length < 120;

            if (isLikelyCutOff) {
                pendingCarryOver = trimmed + ' ';
            } else {
                flushBlock();
            }
        }
    }

    // Flush carry-over terakhir jika ada
    if (pendingCarryOver.trim().length > 0) {
        rawBlocks.push({
            text: pendingCarryOver.trim(),
            maxFontSize: baseFontSize,
            pageIndex: total,
            yRatio: 0.5,
            xCenter: 0,
            pageWidth: 500
        });
        pendingCarryOver = "";
    }

    // ===================================================================
    // PASS 4: HEADING SCORING — TENTUKAN TAG TIAP BLOK
    // Skor dihitung dari beberapa sinyal:
    //   +5  : cocok pattern BAB/CHAPTER/BAGIAN/PART
    //   +4  : font >= h1Threshold
    //   +2  : font >= h2Threshold
    //   +2  : teks pendek (< 80 char) — heading biasanya singkat
    //   +1  : teks sangat pendek (< 40 char)
    //   +1  : teks di tengah halaman (x center dekat center page, toleransi 15%)
    //   -3  : teks punya tanda baca kalimat di tengah (bukan heading)
    //   -5  : teks terlalu panjang (> 150 char) — pasti bukan heading
    // Keputusan: score >= 6 → h1, score >= 3 → h2, else → p
    // ===================================================================

    // Kumpulkan teks heading yang sudah masuk, untuk deduplication
    const seenHeadings = new Set();

    for (const block of rawBlocks) {
        let text = block.text.replace(/\s+/g, ' ').trim();

        // ---------------------------------------------------------------
        // NORMALISASI SPASI ANTAR KARAKTER (kasus PDF encoding aneh)
        // Deteksi: teks yang mayoritas kata-katanya <= 2 huruf = kemungkinan
        // setiap karakter/suku kata dipisah spasi, e.g. "m e n i n g g a l k a n"
        // Strategi: hitung rasio kata pendek. Jika > 60%, gabungkan semua.
        // ---------------------------------------------------------------
        const words = text.split(' ');
        if (words.length >= 4) {
            const shortWords = words.filter(w => w.length <= 2 && /[a-zA-Z\u00C0-\u024F]/.test(w));
            const shortRatio = shortWords.length / words.length;
            if (shortRatio > 0.6) {
                // Teks ini kemungkinan besar scattered — gabungkan semua karakter
                // tapi pertahankan spasi setelah tanda baca
                text = text.replace(/ (?=[a-zA-Z\u00C0-\u024F])/g, (match, offset) => {
                    // Jika karakter sebelumnya adalah tanda baca atau angka, pertahankan spasi
                    const prev = text[offset - 1];
                    if (prev && /[.!?,;:0-9]/.test(prev)) return match;
                    return '';
                });
            }
        }

        // Normalisasi spasi antar huruf kapital scatter (e.g. "B A B" → "BAB")
        text = text.replace(/([A-Z]) (?=[A-Z])/g, '$1');
        text = text.replace(/B\s*A\s*B/gi, 'BAB');

        if (text.length < 2) continue;
        // Buang teks yang cuma simbol/karakter aneh (tidak ada huruf atau angka)
        if (!/[a-zA-Z0-9\u00C0-\u024F\u0100-\u017E\u4E00-\u9FFF\u0600-\u06FF]/.test(text)) continue;

        const fontSize = block.maxFontSize;
        const len = text.length;

        let score = 0;

        // Sinyal kata kunci bab/chapter
        if (/^(bab|chapter|bagian|part|section|pendahuluan|penutup|kesimpulan|daftar\s+pustaka|lampiran|kata\s+pengantar|prakata|prolog|epilog)\b/i.test(text)) {
            score += 5;
        }
        // Sinyal "BAB diikuti angka/romawi" — sangat kuat
        if (/^bab\s+([IVXLCDM]+|\d+)/i.test(text)) {
            score += 3;
        }

        // Sinyal ukuran font
        if (fontSize >= h1FontThreshold) {
            score += 4;
        } else if (fontSize >= h2FontThreshold) {
            score += 2;
        }

        // Sinyal panjang teks
        if (len < 80) score += 2;
        if (len < 40) score += 1;

        // Sinyal posisi tengah halaman
        if (block.pageWidth > 0 && block.xCenter > 0) {
            const pageCenter = block.pageWidth / 2;
            const deviation = Math.abs(block.xCenter - pageCenter) / block.pageWidth;
            if (deviation < 0.15) score += 1;
        }

        // Penalti: ada tanda baca kalimat di TENGAH teks (bukan di ujung)
        const textWithoutEnd = text.slice(0, -1);
        if (/[.!?]/.test(textWithoutEnd)) score -= 3;

        // Penalti: terlalu panjang
        if (len > 150) score -= 5;
        if (len > 80) score -= 1;

        // Tentukan tag
        let tag = 'p';
        if (score >= 6) tag = 'h1';
        else if (score >= 3) tag = 'h2';

        // Deduplication heading: jika heading dengan teks PERSIS SAMA sudah ada, ubah jadi p
        if (tag !== 'p') {
            const textKey = text.toLowerCase().trim();
            if (seenHeadings.has(textKey)) {
                tag = 'p';
            } else {
                seenHeadings.add(textKey);
            }
        }

        parsedNodes.push({ tag, text });
    }

    // ===================================================================
    // PASS 5: POST-PROCESSING — GABUNG FRAGMEN KATA YANG TERPOTONG
    // Hanya gabungkan jika teks sangat pendek (< 4 kata) dan tidak ada tanda kalimat selesai
    // Ini untuk menangkap kata yang terpotong antar halaman, bukan untuk menggabungkan paragraf pendek normal
    // ===================================================================
    const mergedNodes = [];
    for (let i = 0; i < parsedNodes.length; i++) {
        const node = parsedNodes[i];
        const wordCount = node.text.split(/\s+/).length;
        if (
            node.tag === 'p' &&
            wordCount < 4 &&
            node.text.length < 40 &&
            !node.text.match(/[.!?:;»"')\]。！？]+$/) &&
            i + 1 < parsedNodes.length &&
            parsedNodes[i + 1].tag === 'p'
        ) {
            // Gabung dengan node berikutnya
            parsedNodes[i + 1] = {
                tag: 'p',
                text: node.text.trim() + ' ' + parsedNodes[i + 1].text.trim()
            };
            // Skip node ini
        } else {
            mergedNodes.push(node);
        }
    }

    // [ID PERMANEN]: ID dari nama file, bukan timestamp
    const newBookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const existingIndex = library.findIndex(b => b.id === newBookId);

    // [OPTIMASI DEWA]: Langsung mutilasi data di sumber — teks & cover ke laci sendiri, library cuma KTP
    await localforage.setItem('content_' + newBookId, mergedNodes);
    await localforage.setItem('cover_' + newBookId, coverBase64);

    if (existingIndex === -1) {
        library.push({
            id: newBookId,
            type: 'pdf',
            title: bookTitle,
            pages: total,
            progressPct: 0,
            lastReadId: null,
            shape: 'square'
        });
    } else {
        library[existingIndex].pages = total;
        library[existingIndex].title = bookTitle;
    }

    await localforage.setItem('pdf_epub_master', library);
    renderLibrary();
}

// 3. FUNGSI EKSTRAK EPUB
async function handleEpub(file, bookTitle) {
    const zip = await JSZip.loadAsync(file); 
    let parsedNodes = []; 
    let coverBase64 = null;

    const containerXml = await zip.file("META-INF/container.xml").async("text");
    const opfPath = (new DOMParser()).parseFromString(containerXml, "text/xml").getElementsByTagName("rootfile")[0].getAttribute("full-path");
    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : "";
    const opfXml = await zip.file(opfPath).async("text");
    const opfDoc = (new DOMParser()).parseFromString(opfXml, "text/xml");

    const titleEl = opfDoc.getElementsByTagName("dc:title")[0]; 
    if (titleEl && titleEl.textContent) bookTitle = titleEl.textContent;

    const manifest = {};
    Array.from(opfDoc.getElementsByTagName("item")).forEach(item => { 
        manifest[item.getAttribute("id")] = { href: item.getAttribute("href"), mediaType: item.getAttribute("media-type") }; 
    });

    const metaCover = opfDoc.querySelector("meta[name='cover']");
    if (metaCover) {
        const coverId = metaCover.getAttribute("content");
        if (manifest[coverId]) {
            let coverPath = opfDir + manifest[coverId].href;
            const coverFile = zip.file(coverPath);
            if (coverFile) {
                const b64 = await coverFile.async("base64");
                coverBase64 = "data:" + manifest[coverId].mediaType + ";base64," + b64;
            }
        }
    }

    if (!coverBase64) {
        const potentialCover = Object.values(manifest).find(m => m.href.toLowerCase().includes('cover') && m.mediaType.startsWith('image/'));
        if (potentialCover) {
            let coverPath = opfDir + potentialCover.href;
            const coverFile = zip.file(coverPath);
            if (coverFile) {
                const b64 = await coverFile.async("base64");
                coverBase64 = "data:" + potentialCover.mediaType + ";base64," + b64;
            }
        }
    }

    const spine = Array.from(opfDoc.getElementsByTagName("itemref")).map(item => item.getAttribute("idref"));
    let order = 0;
    
    const validBlockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div', 'section', 'article', 'header'];
    // Deduplication heading di luar loop — deteksi duplikat antar chapter juga
    const seenEpubHeadings = new Set();

    for (const idref of spine) {
        order++;
        DOM.loadBar.style.width = `${Math.round((order / spine.length) * 100)}%`;
        DOM.loadPct.textContent = `${Math.round((order / spine.length) * 100)}%`;

        if (!manifest[idref]) continue;
        const htmlPath = opfDir + manifest[idref].href; 
        const htmlFile = zip.file(htmlPath);
        if (!htmlFile) continue;

        let htmlStr;
        try { htmlStr = await htmlFile.async("text"); } catch(e) { continue; }

        let doc;
        try { doc = (new DOMParser()).parseFromString(htmlStr, "text/html"); } catch(e) { continue; }
        if (!doc || !doc.body) continue;

        doc.querySelectorAll('script, style, nav, footer, iframe, svg, button').forEach(el => el.remove());

        const allElements = doc.body.querySelectorAll('*');

        for (let el of allElements) {
            let tag = el.tagName.toLowerCase();
            
            if (tag === 'img' || tag === 'image') {
                let src = el.getAttribute('src') || el.getAttribute('href');
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    let absPath = resolveRelativePath(htmlPath, src); 
                    const imgFile = zip.file(absPath);
                    if (imgFile) { 
                        const b64 = await imgFile.async("base64"); 
                        let mime = "image/jpeg";
                        if(absPath.toLowerCase().endsWith('.png')) mime = "image/png";
                        else if(absPath.toLowerCase().endsWith('.gif')) mime = "image/gif";
                        parsedNodes.push({ tag: 'img', src: `data:${mime};base64,${b64}` }); 
                    }
                } else if (src && src.startsWith('data:')) {
                    parsedNodes.push({ tag: 'img', src: src });
                }
                continue;
            }

            if (validBlockTags.includes(tag)) {
                let hasBlockChild = false;
                const descendants = el.querySelectorAll('*');
                for (let i = 0; i < descendants.length; i++) {
                    if (validBlockTags.includes(descendants[i].tagName.toLowerCase())) {
                        hasBlockChild = true;
                        break;
                    }
                }
                
                if (hasBlockChild) continue; 
                
                let text = el.textContent.trim().replace(/\s+/g, ' ');
                if (text.length === 0) continue;

                // Normalisasi: spasi antar huruf scatter (e.g. "B A B" → "BAB")
                // Pakai pendekatan aman tanpa lookbehind (kompatibel semua WebView)
                text = text.replace(/([A-Z]) (?=[A-Z])/g, '$1');
                text = text.replace(/B\s*A\s*B/gi, 'BAB');

                // Buang teks yang tidak mengandung karakter konten sama sekali
                if (text.length < 2) continue;
                if (!/\w/.test(text) && !/[\u00C0-\u024F\u0600-\u06FF\u4E00-\u9FFF]/.test(text)) continue;

                let finalTag = 'p';

                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
                    // Heading semantik dari HTML EPUB: percaya sepenuhnya, tapi validasi
                    // h1/h2/h3 → h1 (bab), h4/h5/h6 → h2 (sub-bab)
                    const level = parseInt(tag[1]);

                    // Heading yang terlalu panjang kemungkinan salah tag oleh penerbit → turunkan ke p
                    if (text.length > 200) {
                        finalTag = 'p';
                    } else if (level <= 3) {
                        finalTag = 'h1';
                    } else {
                        finalTag = 'h2';
                    }

                    // Deduplication: heading persis sama yang sudah muncul → ubah ke p
                    if (finalTag !== 'p') {
                        const textKey = text.toLowerCase().trim();
                        if (seenEpubHeadings.has(textKey)) {
                            finalTag = 'p';
                        } else {
                            seenEpubHeadings.add(textKey);
                        }
                    }
                } else {
                    // Bukan tag heading → p, tapi cek apakah konten class-nya adalah heading
                    // Beberapa EPUB pake <p class="chapter-title"> dll
                    const cls = (el.getAttribute('class') || '').toLowerCase();
                    const isHeadingClass = /\b(chapter|heading|title|bab|judul|h[1-6]|header)\b/.test(cls);

                    if (isHeadingClass && text.length < 120) {
                        // Cek lebih lanjut: harus punya "nilai heading"
                        const hasChapterKeyword = /^(bab|chapter|bagian|part|section|pendahuluan|penutup|kesimpulan|kata\s+pengantar|prakata|prolog|epilog)\b/i.test(text);
                        finalTag = hasChapterKeyword ? 'h1' : 'h2';

                        const textKey = text.toLowerCase().trim();
                        if (seenEpubHeadings.has(textKey)) {
                            finalTag = 'p';
                        } else if (finalTag !== 'p') {
                            seenEpubHeadings.add(textKey);
                        }
                    }
                }

                parsedNodes.push({ tag: finalTag, text: text });
            }
        }
    }
    
    // [ID PERMANEN]: ID dari nama file, bukan timestamp
    const newBookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    const existingIndex = library.findIndex(b => b.id === newBookId);

    // [OPTIMASI DEWA]: Langsung mutilasi data di sumber — teks & cover ke laci sendiri, library cuma KTP
    await localforage.setItem('content_' + newBookId, parsedNodes);
    if (coverBase64) await localforage.setItem('cover_' + newBookId, coverBase64);

    if (existingIndex === -1) {
        library.push({
            id: newBookId,
            type: 'epub',
            title: bookTitle,
            pages: spine.length,
            progressPct: 0,
            lastReadId: null,
            shape: 'square'
        });
    } else {
        library[existingIndex].pages = spine.length;
        library[existingIndex].title = bookTitle;
    }

    await localforage.setItem('pdf_epub_master', library); 
    renderLibrary();
}

function resolveRelativePath(base, relative) {
    const stack = base.split('/'); stack.pop(); 
    const parts = relative.split('/');
    for (const part of parts) { 
        if (part === '.') continue; 
        if (part === '..') stack.pop(); 
        else stack.push(part); 
    }
    return stack.join('/');
}

// 4. LOOKUP DICTIONARY — Orchestrator Wikipedia + Gemini
window.lookupDictionary = function() {
    const savedText = currentSelection.text;
    if (!savedText) return;

    const apiKey = localStorage.getItem('gemini_api_key');

    window.hideSelectionMenu();
    window.getSelection().removeAllRanges();

    const modal = document.getElementById('ai-modal');
    const termEl = document.getElementById('ai-term');
    const wikiCard = document.getElementById('wiki-card');
    const wikiContent = document.getElementById('wiki-content');
    const wikiLoading = document.getElementById('wiki-loading');
    const geminiCard = document.getElementById('gemini-card');
    const geminiContent = document.getElementById('gemini-content');
    const geminiLoading = document.getElementById('gemini-loading');

    termEl.textContent = savedText.length > 40 ? savedText.substring(0, 40) + '...' : savedText;

    if (wikiCard) wikiCard.classList.remove('hidden');
    if (wikiLoading) wikiLoading.classList.remove('hidden');
    if (wikiContent) { wikiContent.innerHTML = ''; wikiContent.classList.add('hidden'); }

    if (geminiCard) {
        if (apiKey) {
            geminiCard.classList.remove('hidden');
            if (geminiLoading) geminiLoading.classList.remove('hidden');
            if (geminiContent) { geminiContent.innerHTML = ''; geminiContent.classList.add('hidden'); }
        } else {
            geminiCard.classList.add('hidden');
        }
    }

    pushAppHistory('ai-modal');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('ai-sheet').classList.remove('translate-y-full');
    });

    // Fetch Wikipedia
    const wikiLangCode = wikiLang === 'id' ? 'id' : (wikiLang === 'es' ? 'es' : 'en');
    const wikiQuery = encodeURIComponent(savedText.split(' ').slice(0, 4).join(' '));
    fetch(`https://${wikiLangCode}.wikipedia.org/api/rest_v1/page/summary/${wikiQuery}`)
        .then(r => r.json())
        .then(data => {
            if (wikiLoading) wikiLoading.classList.add('hidden');
            if (!wikiContent) return;
            const extract = (data.extract || '').trim();
            if (extract) {
                wikiContent.innerHTML = `
                    <p class="text-sm leading-relaxed text-m3-onSurfaceVariant font-medium">${extract}</p>
                    ${data.content_urls ? `<a href="${data.content_urls.mobile.page}" target="_blank" class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-m3-primary opacity-80">Wikipedia <i data-lucide="external-link" class="w-3 h-3"></i></a>` : ''}
                `;
                if (window.lucide) window.lucide.createIcons();
            } else {
                let notFoundMsg = 'Not found on Wikipedia.';
                if (wikiLang === 'id') notFoundMsg = 'Tidak ditemukan di Wikipedia.';
                else if (wikiLang === 'es') notFoundMsg = 'No encontrado en Wikipedia.';
                wikiContent.innerHTML = `<p class="text-sm opacity-50 font-medium">${notFoundMsg}</p>`;
            }
            wikiContent.classList.remove('hidden');
        })
        .catch(() => {
            if (wikiLoading) wikiLoading.classList.add('hidden');
            if (wikiContent) {
                let failMsg = 'Failed to load Wikipedia.';
                if (wikiLang === 'id') failMsg = 'Gagal memuat Wikipedia.';
                else if (wikiLang === 'es') failMsg = 'Error al cargar Wikipedia.';
                wikiContent.innerHTML = `<p class="text-sm opacity-50 font-medium">${failMsg}</p>`;
                wikiContent.classList.remove('hidden');
            }
        });

    // Fetch Gemini (kalau ada API key)
    if (apiKey) {
        const modelVersion = localStorage.getItem('gemini_model') || 'gemini-2.5-flash-preview-05-20';
        let langInstruction = 'Use English. Explain the meaning, context, and provide a short example sentence. Write in plain paragraphs, no bullet points. No introductory phrases, go straight to the explanation.';
        if (wikiLang === 'id') {
            langInstruction = 'Gunakan bahasa Indonesia. Jelaskan arti, konteks, dan berikan contoh kalimat singkat. Tulis dalam paragraf biasa, tanpa poin atau bullet. Langsung ke penjelasan tanpa kata pembuka.';
        } else if (wikiLang === 'es') {
            langInstruction = 'Usa español. Explica el significado, el contexto y proporciona una breve oración de ejemplo. Escribe en párrafos normales, sin viñetas. Sin frases introductorias, ve directo a la explicación.';
        }
        
        let promptText = `Provide a concise dictionary definition and explanation for: "${savedText}". ${langInstruction}`;

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        })
        .then(r => { if (!r.ok) throw new Error(`API Error: ${r.status}`); return r.json(); })
        .then(data => {
            if (geminiLoading) geminiLoading.classList.add('hidden');
            if (!geminiContent) return;
            const rawText = data.candidates[0].content.parts[0].text;
            const formatted = rawText
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-m3-primary font-bold">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>')
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>');
            geminiContent.innerHTML = formatted;
            geminiContent.classList.remove('hidden');
        })
        .catch((err) => {
            if (geminiLoading) geminiLoading.classList.add('hidden');
            if (geminiContent) {
                geminiContent.innerHTML = `<div class="text-red-500 text-sm font-bold">Error: ${err.message}</div>`;
                geminiContent.classList.remove('hidden');
            }
        });
    }
};

window.closeAiModal = function(isFromHistory = false) {
    if (!isFromHistory) { history.back(); return; }
    const m = document.getElementById('ai-modal');
    const s = document.getElementById('ai-sheet');
    
    s.classList.add('translate-y-full');
    m.classList.add('opacity-0');
    setTimeout(() => m.classList.add('hidden'), 300);
}


