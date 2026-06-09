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
                const langNow = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
                const dNow = typeof i18n !== 'undefined' ? (i18n[langNow] || i18n['id']) : {};
                const noFilesMsg = dNow.folderNoFiles || "Tidak ada file PDF, EPUB, TXT, atau MD di folder ini.";
                showDialog("Info", noFilesMsg, "info", [{text: dNow.btnClose || "Oke", primary: true}]);
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
                if (!book) return;

                // Jika buku adalah Mode Canvas, hentikan fitur pencarian teks dinamis
                if (book.pdfMode === 'canvas') {
                    if(searchResEl) {
                        searchResEl.innerHTML = `<div class="p-4 text-center text-xs opacity-60 font-bold">${i18n[wikiLang].pdfCanvasWarning}</div>`;
                        searchResEl.classList.remove('hidden');
                    }
                    return;
                }

                if (!book.nodes) return;
                
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
                        
                        let contextStr = typeof wikiLang !== 'undefined' ? (wikiLang === 'id' ? "Bab / Seksi" : (wikiLang === 'es' ? "Capítulo / Sección" : "Chapter / Section")) : "Chapter / Section";
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
let _importQueue = [];
let _importRunning = false;
let _importTotalQueued = 0;
let _importDoneCount = 0;

async function processMultipleFiles(files) {
    const lang = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
    const d = typeof i18n !== 'undefined' ? (i18n[lang] || i18n['id']) : {};

    // Helper: ambil ID asli buku dari nama file (sama dengan yang dipakai saat import)
    function _getBookId(file) {
        return btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }

    // Helper: cek mode yang sudah ada di library untuk ID buku tertentu
    function _getExistingModes(bookId) {
        const lib = typeof library !== 'undefined' ? library : [];
        const existing = lib.filter(b => b.id === bookId);
        const hasScroll = existing.some(b => b.type === 'pdf' && (b.pdfMode || 'scroll') !== 'canvas');
        const hasCanvas = existing.some(b => b.type === 'pdf' && b.pdfMode === 'canvas');
        const hasNonPdf = existing.some(b => b.type !== 'pdf');
        return { hasScroll, hasCanvas, both: hasScroll && hasCanvas, hasNonPdf, found: existing.length > 0 };
    }

    // Tahap 1: Pisahkan file PDF dari non-PDF, dan cek duplikat
    let pdfFiles       = [];
    let nonPdfFiles    = [];   // non-PDF yang BELUM ada di library → langsung proses
    let dupBothPdf     = [];   // PDF yang sudah ada di KEDUA mode (scroll & canvas) → tolak total
    // non-PDF yang sudah ada di library → langsung di-skip diam-diam, tanpa dialog

    for (let f of files) {
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext === 'pdf') {
            const bookId = _getBookId(f);
            const em = _getExistingModes(bookId);
            if (em.both) {
                dupBothPdf.push({ file: f, id: bookId, title: f.name.replace(/\.[^/.]+$/, "") });
            } else {
                pdfFiles.push(f);
            }
        } else {
            const bookId = _getBookId(f);
            const em = _getExistingModes(bookId);
            if (!em.found) {
                // Belum ada → proses
                nonPdfFiles.push(f);
            }
            // Sudah ada → diam-diam skip, tidak ada duplikasi
        }
    }

    // Tahap 1b: Tampilkan notif untuk PDF yang sudah ada di kedua rak → tidak bisa ditambahkan
    if (dupBothPdf.length > 0) {
        let dupBothListHtml = `<div class="max-h-40 overflow-y-auto mt-2 mb-2 bg-m3-surfaceVariant/30 rounded-xl p-2 text-left">`;
        dupBothPdf.forEach(dup => {
            dupBothListHtml += `<div class="text-xs text-m3-onSurface opacity-80 mb-1 truncate">📚 ${dup.title}</div>`;
        });
        dupBothListHtml += `</div>`;

        const hasSomethingElse = pdfFiles.length > 0 || nonPdfFiles.length > 0;

        await new Promise((resolve) => {
            let isResolved = false;
            const checkHidden = setInterval(() => {
                if (document.getElementById('custom-dialog').classList.contains('hidden')) {
                    clearInterval(checkHidden);
                    if (!isResolved) resolve();
                }
            }, 300);
            window.showDialog(
                d.pdfBothModesTitle || "Buku Sudah Ada di Rak",
                (d.pdfBothModesDesc || "Buku berikut sudah ada di kedua rak (Scroll & Canvas). Tidak dapat ditambahkan lagi.") + dupBothListHtml,
                "book-x",
                [
                    { text: d.btnClose || "Oke", primary: true, action: () => { isResolved = true; window.closeDialog(); resolve(); } }
                ]
            );
        });

        if (!hasSomethingElse) return;
    }

    // Tahap 2: Gabungkan non-PDF baru + PDF ke antrian
    let filesToProcess = [...nonPdfFiles];

    // Gabungkan PDF ke dalam filesToProcess (PDF akan lewat mode-selection sendiri)
    for (let f of pdfFiles) filesToProcess.push(f);

    if (filesToProcess.length === 0) return;
    
    // Tahap 3: Pre-flight scan (Mendeteksi file PDF)
    const hasPdf = filesToProcess.some(f => f.name.toLowerCase().endsWith('.pdf'));
    let fileModes = []; 
    
    if (hasPdf) {
        // Tampilkan animasi loading analisa
        DOM.load.classList.remove('hidden');
        if(DOM.loadTxt) DOM.loadTxt.textContent = d.loadingDocs || "Menganalisa dokumen...";
        DOM.loadBar.style.width = '100%';
        if(DOM.loadPct) DOM.loadPct.textContent = '...';
        // Juga tampilkan global spinner supaya user tahu
        if (typeof window.showGlobalLoading === 'function') {
            window.showGlobalLoading(d.loadingDocs || 'Menganalisa dokumen...');
        }
        
        for (let f of filesToProcess) {
            const ext = f.name.split('.').pop().toLowerCase();
            const title = f.name.replace(/\.[^/.]+$/, "");
            
            if (ext === 'pdf') {
                let isScannedOrOcr = false;
                let numPages = 1;
                try {
                    const arrayBuffer = await f.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                    numPages = pdf.numPages;
                    let textScanSample = "";
                    const scanLimit = Math.min(numPages, 2);
                    for (let p = 1; p <= scanLimit; p++) {
                        try {
                            const page = await pdf.getPage(p);
                            const content = await page.getTextContent();
                            content.items.forEach(item => { if (item.str) textScanSample += item.str.trim(); });
                        } catch (e) {}
                    }
                    const cleanedScanText = textScanSample.replace(/\s+/g, '').trim();
                    isScannedOrOcr = cleanedScanText.length < 30;
                } catch(err) { console.error("Gagal pre-scan PDF", err); }
                
                fileModes.push({
                    file: f, title: title, ext: ext,
                    type: isScannedOrOcr ? 'pdf-canvas-forced' : 'pdf-choice',
                    pdfNumPages: numPages
                });
            } else {
                fileModes.push({ file: f, title: title, ext: ext, type: 'auto' });
            }
        }
        
        DOM.load.classList.add('hidden');
        if (typeof window.hideGlobalLoading === 'function') window.hideGlobalLoading();
        
        // Tahap 4: Modal Batch Options — tandai setiap PDF dengan info mode yang sudah ada di library
        fileModes.forEach(m => {
            if (m.ext === 'pdf' && !m.file._isDuplicate) {
                const bookId = _getBookId(m.file);
                m._bookId = bookId;
                m._existingModes = _getExistingModes(bookId);
            }
        });

        let batchHtml = `<div class="max-h-[50vh] overflow-y-auto mt-2 mb-2 p-1 text-left flex flex-col gap-3">`;
        const strScroll = d.pdfModeBtnScroll || "Mode Scroll (Teks)";
        const strCanvas = d.pdfModeBtnCanvas || "Mode Canvas (Asli)";
        const strAlreadyInLib = d.alreadyInLib || "Buku sudah ada di rak";
        const strScrollWillDelete = d.pdfScrollWillDelete || "Scroll → Canvas (⚠️ versi Scroll terhapus)";
        const strCanvasWillDelete = d.pdfCanvasWillDelete || "Canvas → Scroll (⚠️ versi Canvas terhapus)";
        
        fileModes.forEach((m, idx) => {
            const shortTitle = m.title.length > 30 ? m.title.substring(0, 30) + '...' : m.title;
            let controlHtml = '';
            let rowOpacity = '';
            let dismissBtn = '';
            
            const em = m._existingModes;

            if (m.type === 'auto') {
                controlHtml = `<span class="text-[10px] bg-m3-surfaceVariant text-m3-onSurfaceVariant px-2 py-1 rounded-md font-bold opacity-70">Otomatis (${m.ext.toUpperCase()})</span>`;
            } else if (m.type === 'pdf-canvas-forced') {
                if (em && em.hasCanvas) {
                    // Canvas forced tapi sudah ada di canvas → skip otomatis
                    m._skipEntry = true;
                    rowOpacity = 'opacity-40';
                    controlHtml = `<span class="text-[10px] bg-m3-surfaceVariant text-m3-onSurfaceVariant px-2 py-1 rounded-md font-bold">${strAlreadyInLib}</span>`;
                } else {
                    controlHtml = `<span class="text-[10px] bg-m3-secondaryContainer text-m3-onSecondaryContainer px-2 py-1 rounded-md font-bold">Canvas (Pindaian)</span>`;
                }
            } else if (m.type === 'pdf-choice') {
                if (em && em.both) {
                    // Sudah ada di kedua mode → abaikan (tidak seharusnya sampai sini tapi sebagai fallback)
                    m._skipEntry = true;
                    rowOpacity = 'opacity-40';
                    controlHtml = `<span class="text-[10px] bg-m3-surfaceVariant text-m3-onSurfaceVariant px-2 py-1 rounded-md font-bold">${strAlreadyInLib}</span>`;
                } else if (em && em.hasCanvas) {
                    // Sudah ada di canvas → kunci ke scroll saja, peringatkan canvas akan terhapus
                    m._lockedMode = 'scroll';
                    controlHtml = `
                        <span class="text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 leading-tight">
                            <i data-lucide="alert-triangle" class="w-3 h-3 shrink-0"></i> ${strCanvasWillDelete}
                        </span>
                    `;
                    dismissBtn = `<button type="button" data-dismiss-idx="${idx}" class="batch-dismiss-btn ml-2 w-6 h-6 rounded-full flex items-center justify-center bg-m3-surfaceVariant text-m3-onSurfaceVariant hover:bg-red-500/20 hover:text-red-500 transition-colors shrink-0" title="${d.batchDismiss || 'Buang dari daftar'}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
                } else if (em && em.hasScroll) {
                    // Sudah ada di scroll → kunci ke canvas saja, peringatkan scroll akan terhapus
                    m._lockedMode = 'canvas';
                    controlHtml = `
                        <span class="text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 leading-tight">
                            <i data-lucide="alert-triangle" class="w-3 h-3 shrink-0"></i> ${strScrollWillDelete}
                        </span>
                    `;
                    dismissBtn = `<button type="button" data-dismiss-idx="${idx}" class="batch-dismiss-btn ml-2 w-6 h-6 rounded-full flex items-center justify-center bg-m3-surfaceVariant text-m3-onSurfaceVariant hover:bg-red-500/20 hover:text-red-500 transition-colors shrink-0" title="${d.batchDismiss || 'Buang dari daftar'}"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
                } else {
                    // Bebas pilih
                    controlHtml = `
                        <select id="mode-select-${idx}" class="text-xs bg-m3-primaryContainer text-m3-onPrimaryContainer px-2 py-1 rounded-md font-bold border-none outline-none">
                            <option value="scroll">${strScroll}</option>
                            <option value="canvas">${strCanvas}</option>
                        </select>
                    `;
                }
            }
            
            batchHtml += `
                <div id="batch-row-${idx}" class="flex flex-col border-b border-m3-surfaceVariant/50 pb-2 ${rowOpacity}">
                    <span class="text-xs font-bold text-m3-onSurface mb-1 truncate">${shortTitle}</span>
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] opacity-60 uppercase">${m.ext}</span>
                        <div class="flex items-center">
                            ${controlHtml}
                            ${dismissBtn}
                        </div>
                    </div>
                </div>
            `;
        });
        batchHtml += `</div>`;
        
        const batchAction = await new Promise((resolve) => {
            let isResolved = false;
            // Deteksi salah gesture/swipe untuk membatalkan seluruh proses
            const checkHidden = setInterval(() => {
                if (document.getElementById('custom-dialog').classList.contains('hidden')) {
                    clearInterval(checkHidden);
                    if (!isResolved) resolve('CANCEL');
                }
            }, 300);

            window.showDialog(
                d.batchPdfTitle || "Pilih Mode PDF",
                (d.batchPdfDesc || "Pilih mode membaca untuk PDF yang baru diunggah:") + batchHtml,
                "settings",
                [
                    { text: d.cancel || "Batal", primary: false, action: () => { isResolved = true; window.closeDialog(); resolve('CANCEL'); } },
                    { text: d.btnStartProcess || "Mulai Proses", primary: true, action: () => { 
                        fileModes.forEach((m, idx) => {
                            if (m._skipEntry) {
                                m.finalMode = null; // akan di-skip
                            } else if (m._lockedMode) {
                                m.finalMode = m._lockedMode;
                            } else if (m.type === 'pdf-choice') {
                                const sel = document.getElementById(`mode-select-${idx}`);
                                if (sel) m.finalMode = sel.value;
                            } else if (m.type === 'pdf-canvas-forced') {
                                m.finalMode = 'canvas';
                            }
                        });
                        isResolved = true; window.closeDialog(); resolve('START'); 
                    } }
                ]
            );
            // Pasang event dismiss setelah DOM dialog render
            setTimeout(() => {
                document.querySelectorAll('.batch-dismiss-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.dataset.dismissIdx);
                        if (!isNaN(idx) && fileModes[idx]) {
                            fileModes[idx]._skipEntry = true;
                            delete fileModes[idx]._lockedMode;
                            const row = document.getElementById(`batch-row-${idx}`);
                            if (row) {
                                row.style.transition = 'opacity 0.2s, max-height 0.25s';
                                row.style.overflow = 'hidden';
                                row.style.opacity = '0';
                                row.style.maxHeight = row.offsetHeight + 'px';
                                setTimeout(() => { row.style.maxHeight = '0'; row.style.paddingBottom = '0'; }, 10);
                                setTimeout(() => row.remove(), 260);
                            }
                        }
                    });
                });
            }, 80);
        });
        
        if (batchAction === 'CANCEL') return;
        // Spinner saat jeda antara modal batch → mulai proses import
        if (typeof window.showGlobalLoading === 'function') {
            const dL = typeof i18n !== 'undefined' ? (i18n[lang] || i18n['id']) : {};
            window.showGlobalLoading(dL.loadingDocs || 'Menyiapkan proses...');
        }
        await new Promise(r => setTimeout(r, 350));
        if (typeof window.hideGlobalLoading === 'function') window.hideGlobalLoading();
        
    } else {
        // Jika tidak ada PDF sama sekali, langsung saja
        for (let f of filesToProcess) {
            fileModes.push({
                file: f, title: f.name.replace(/\.[^/.]+$/, ""), ext: f.name.split('.').pop().toLowerCase(), type: 'auto'
            });
        }
    }
    
    // Tahap 5: Eksekusi Queue Upload & Tarik layar ke atas
    const libScroll = document.getElementById('library-content-scroll');
    if (libScroll) libScroll.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Filter out files yang di-skip karena sudah ada di kedua mode
    const validModes = fileModes.filter(m => !m._skipEntry);
    for (const m of validModes) { _importQueue.push(m); }
    _importTotalQueued += validModes.length;
    
    if (_importRunning) {
        if (DOM.loadTxt) {
            const currentLabel = DOM.loadTxt.textContent;
            const match = currentLabel.match(/\((\d+)\/\d+\)(.*)/);
            if (match) DOM.loadTxt.textContent = `(${match[1]}/${_importTotalQueued})${match[2]}`;
        }
        return;
    }
    
    _importRunning = true;
    _importDoneCount = 0;
    const failed = [];
    let imported = 0;

    DOM.load.classList.remove('hidden');

    while (_importQueue.length > 0) {
        const m = _importQueue.shift();
        const ext = m.ext;
        let bookTitle = m.title;
        const currentIdx = _importDoneCount + 1;
        const totalNow = _importTotalQueued;
        
        // Singkat nama file agar tidak beleber di UI Loading
        const displayTitle = bookTitle.length > 25 ? bookTitle.substring(0, 25) + "..." : bookTitle;
        
        DOM.loadBar.style.width = '0%';
        if(DOM.loadPct) DOM.loadPct.textContent = '0%';
        if (DOM.loadTxt) DOM.loadTxt.textContent = `(${currentIdx}/${totalNow}) ${displayTitle}`;

        try {
            if (ext === 'pdf') {
                await processPdfDirect(m.file, bookTitle, m.finalMode, m.pdfNumPages);
            } else if (ext === 'epub') {
                await handleEpub(m.file, bookTitle);
            } else if (ext === 'txt') {
                await handleTxt(m.file, bookTitle);
            } else if (ext === 'md') {
                await handleMd(m.file, bookTitle);
            }
            imported++;
        } catch (err) {
            console.error(`Gagal import: ${bookTitle}`, err);
            failed.push(displayTitle);
        }
        _importDoneCount++;

        const nextIdx = _importDoneCount + 1;
        if (_importQueue.length > 0 && DOM.loadTxt) {
            const nextM = _importQueue[0];
            const nextTitle = nextM.title.length > 25 ? nextM.title.substring(0, 25) + "..." : nextM.title;
            DOM.loadTxt.textContent = `(${nextIdx}/${totalNow}) ${nextTitle}`;
        }
    }

    _importRunning = false;
    const grandTotal = _importTotalQueued;
    _importTotalQueued = 0;
    _importDoneCount = 0;

    DOM.loadBar.style.width = '100%';
    if(DOM.loadPct) DOM.loadPct.textContent = '100%';
    setTimeout(() => { DOM.load.classList.add('hidden'); }, 900);
    if (DOM.loadTxt) DOM.loadTxt.textContent = d.loadingDocs || 'Reading Document...';

    if (grandTotal > 1 || failed.length > 0) {
        const importedStr = d.importSuccessCount ? d.importSuccessCount.replace('{n}', imported) : `${imported} buku berhasil diimpor.`;
        let summary = importedStr;
        if (failed.length > 0) {
            const failedStr = d.importFailedCount ? d.importFailedCount.replace('{n}', failed.length) : `${failed.length} gagal:`;
            summary += `\n${failedStr} ${failed.join(', ')}`;
        }
        showDialog(d.importDoneTitle || "Selesai Import", summary, "check-circle", [{ text: d.btnClose || "Oke", primary: true }]);
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

    // ID PERMANEN + CEK DUPLIKAT
    let bookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    if (file._isDuplicate) {
        bookId = bookId.substring(0, 20) + Date.now().toString(36);
        bookTitle = bookTitle + " (Copy)";
    }
    const existingIndex = library.findIndex(b => b.id === bookId);

    // OPTIMASI DEWA: Langsung mutilasi data di sumber — teks ke laci sendiri, library cuma KTP
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

    // ID PERMANEN + CEK DUPLIKAT
    let bookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    if (file._isDuplicate) {
        bookId = bookId.substring(0, 20) + Date.now().toString(36);
        bookTitle = bookTitle + " (Copy)";
    }
    const existingIndex = library.findIndex(b => b.id === bookId);

    // OPTIMASI DEWA: Langsung mutilasi data di sumber — teks ke laci sendiri, library cuma KTP
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

// 2. FUNGSI EKSTRAK PDF DENGAN LOGIKA PENUH
async function processPdfDirect(file, bookTitle, finalMode, total) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;

    // --- EKSTRAK COVER ---
    let coverBase64 = null;
    try {
        const coverCanvas = document.createElement('canvas');
        const coverCtx = coverCanvas.getContext('2d');
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 0.5 });
        coverCanvas.width = viewport.width;
        coverCanvas.height = viewport.height;
        await firstPage.render({ canvasContext: coverCtx, viewport: viewport }).promise;
        coverBase64 = coverCanvas.toDataURL('image/jpeg', 0.8);
    } catch(e) { console.error("Gagal cover PDF", e); }

    let newBookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    if (file._isDuplicate) {
        newBookId = newBookId.substring(0, 20) + Date.now().toString(36);
        bookTitle = bookTitle + " (Copy)";
    }

    // Helper untuk menyimpan dokumen PDF asli murni (Mode Canvas)
    const saveAsCanvasMode = async () => {
        DOM.loadBar.style.width = '50%';
        if(DOM.loadPct) DOM.loadPct.textContent = '50%';
        
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        await localforage.setItem('rawpdf_' + newBookId, pdfBlob);
        if(coverBase64) await localforage.setItem('cover_' + newBookId, coverBase64);

        const existingIndex = library.findIndex(b => b.id === newBookId);
        if (existingIndex === -1) {
            library.push({
                id: newBookId,
                type: 'pdf',
                pdfMode: 'canvas',
                title: bookTitle,
                pages: total,
                progressPct: 0,
                lastReadId: 1, 
                shape: 'square'
            });
        } else {
            library[existingIndex].pages = total;
            library[existingIndex].title = bookTitle;
            library[existingIndex].pdfMode = 'canvas';
        }

        await localforage.setItem('pdf_epub_master', library);
        DOM.loadBar.style.width = '100%';
        if(DOM.loadPct) DOM.loadPct.textContent = '100%';
        renderLibrary();
    };

    // Helper untuk memproses ekstraksi teks penuh (Mode Scroll)
    const saveAsScrollMode = async () => {
        let parsedNodes = [];

        // Kebutuhan profiling font & ghost text
        let fontSizeWeights = {};
        let fontSizeLineCounts = {};
        const topZoneTexts = {};
        const bottomZoneTexts = {};

        const profilingSample = Math.min(total, 40);
        for (let i = 1; i <= profilingSample; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pViewport = page.getViewport({ scale: 1 });
            const pageH = pViewport.height;

            textContent.items.forEach(item => {
                if (!item.str || item.str.trim().length === 0) return;
                const h = Math.round(item.height);
                if (h <= 0) return;

                fontSizeWeights[h] = (fontSizeWeights[h] || 0) + item.str.trim().length;
                fontSizeLineCounts[h] = (fontSizeLineCounts[h] || 0) + 1;

                const yRatio = item.transform[5] / pageH;
                const normalizedStr = item.str.trim().toLowerCase().replace(/\s+/g, ' ');
                if (normalizedStr.length < 3) return;

                if (yRatio > 0.92) {
                    topZoneTexts[normalizedStr] = (topZoneTexts[normalizedStr] || 0) + 1;
                } else if (yRatio < 0.08) {
                    bottomZoneTexts[normalizedStr] = (bottomZoneTexts[normalizedStr] || 0) + 1;
                }
            });
        }

        let baseFontSize = 12;
        let maxWeight = 0;
        for (const [size, weight] of Object.entries(fontSizeWeights)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                baseFontSize = parseInt(size);
            }
        }

        const ghostThreshold = Math.max(3, Math.floor(profilingSample * 0.25));
        const ghostSet = new Set();
        for (const [txt, count] of Object.entries(topZoneTexts)) {
            if (count >= ghostThreshold) ghostSet.add(txt);
        }
        for (const [txt, count] of Object.entries(bottomZoneTexts)) {
            if (count >= ghostThreshold) ghostSet.add(txt);
        }
        const bookTitleNorm = bookTitle.toLowerCase().replace(/\s+/g, ' ').trim();
        if (bookTitleNorm.length > 2) ghostSet.add(bookTitleNorm);

        const h1FontThreshold = baseFontSize * 1.35;
        const h2FontThreshold = baseFontSize * 1.10;

        let rawBlocks = [];
        let pendingCarryOver = "";

        for (let i = 1; i <= total; i++) {
            DOM.loadBar.style.width = `${Math.round((i / total) * 100)}%`;
            if(DOM.loadPct) DOM.loadPct.textContent = `${Math.round((i / total) * 100)}%`;

            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pViewport = page.getViewport({ scale: 1 });
            const pageH = pViewport.height;
            const pageW = pViewport.width;

            let items = textContent.items.filter(item => item.str !== undefined);

            let lines = [];
            for (const item of items) {
                const y = Math.round(item.transform[5]);
                const existingLine = lines.find(l => Math.abs(l.y - y) <= 2);
                if (existingLine) {
                    existingLine.items.push(item);
                } else {
                    lines.push({ y, items: [item] });
                }
            }

            lines.sort((a, b) => b.y - a.y);
            const pageXCenter = pageW / 2;

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

                let lineMaxFont = 0;
                let lineStr = "";
                let lineXSum = 0;
                let lineXCount = 0;

                line.items.sort((a, b) => a.transform[4] - b.transform[4]);

                for (const item of line.items) {
                    if (!item.str) continue;
                    const h = item.height || 0;
                    if (h > lineMaxFont) lineMaxFont = h;

                    const x = item.transform[4];
                    const w = item.width || 0;
                    lineXSum += x + w / 2;
                    lineXCount++;

                    if (lineStr.length > 0) {
                        const prevItem = line.items[line.items.indexOf(item) - 1];
                        if (prevItem) {
                            const gapX = x - (prevItem.transform[4] + (prevItem.width || 0));
                            if (gapX > baseFontSize * 0.25 && !lineStr.endsWith(' ')) {
                                lineStr += ' ';
                            }
                        }
                    }

                    if (lineStr.match(/-\s*$/) && item.str.trim().length > 0) {
                        lineStr = lineStr.replace(/-\s*$/, '') + item.str.trimStart();
                    } else {
                        lineStr += item.str;
                    }
                }

                lineStr = lineStr.replace(/\s+/g, ' ').trim();
                if (lineStr.length === 0) continue;

                const lineNorm = lineStr.toLowerCase().replace(/\s+/g, ' ');
                if (ghostSet.has(lineNorm)) continue;
                if (/^\d{1,4}$/.test(lineStr)) continue;
                if (lineStr.length < 4 && (yRatio > 0.90 || yRatio < 0.10)) continue;

                const lineXCenter = lineXCount > 0 ? lineXSum / lineXCount : pageXCenter;

                let shouldFlush = false;
                if (lastLineY !== -1) {
                    const gapY = Math.abs(lastLineY - lineY);
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

            if (currentBlock.trim().length > 0) {
                const trimmed = currentBlock.trim();
                const fontSize = currentBlockMaxFont;
                const wordCount = trimmed.split(/\s+/).length;

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

        const seenHeadings = new Set();

        for (const block of rawBlocks) {
            let text = block.text.replace(/\s+/g, ' ').trim();

            const words = text.split(' ');
            if (words.length >= 4) {
                const shortWords = words.filter(w => w.length <= 2 && /[a-zA-Z\u00C0-\u024F]/.test(w));
                const shortRatio = shortWords.length / words.length;
                if (shortRatio > 0.6) {
                    text = text.replace(/ (?=[a-zA-Z\u00C0-\u024F])/g, (match, offset) => {
                        const prev = text[offset - 1];
                        if (prev && /[.!?,;:0-9]/.test(prev)) return match;
                        return '';
                    });
                }
            }

            text = text.replace(/([A-Z]) (?=[A-Z])/g, '$1');
            text = text.replace(/B\s*A\s*B/gi, 'BAB');

            if (text.length < 2) continue;
            if (!/[a-zA-Z0-9\u00C0-\u024F\u100-\u17E\u4E00-\u9FFF\u0600-\u06FF]/.test(text)) continue;

            const fontSize = block.maxFontSize;
            const len = text.length;

            let score = 0;

            if (/^(bab|chapter|bagian|part|section|pendahuluan|penutup|kesimpulan|daftar\s+pustaka|lampiran|kata\s+pengantar|prakata|prolog|epilog)\b/i.test(text)) {
                score += 5;
            }
            if (/^bab\s+([IVXLCDM]+|\d+)/i.test(text)) {
                score += 3;
            }

            if (fontSize >= h1FontThreshold) {
                score += 4;
            } else if (fontSize >= h2FontThreshold) {
                score += 2;
            }

            if (len < 80) score += 2;
            if (len < 40) score += 1;

            if (block.pageWidth > 0 && block.xCenter > 0) {
                const pageCenter = block.pageWidth / 2;
                const deviation = Math.abs(block.xCenter - pageCenter) / block.pageWidth;
                if (deviation < 0.15) score += 1;
            }

            const textWithoutEnd = text.slice(0, -1);
            if (/[.!?]/.test(textWithoutEnd)) score -= 3;

            if (len > 150) score -= 5;
            if (len > 80) score -= 1;

            let tag = 'p';
            if (score >= 6) tag = 'h1';
            else if (score >= 3) tag = 'h2';

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
                parsedNodes[i + 1] = {
                    tag: 'p',
                    text: node.text.trim() + ' ' + parsedNodes[i + 1].text.trim()
                };
            } else {
                mergedNodes.push(node);
            }
        }

        await localforage.setItem('content_' + newBookId, mergedNodes);
        if(coverBase64) await localforage.setItem('cover_' + newBookId, coverBase64);

        const existingIndex = library.findIndex(b => b.id === newBookId);
        if (existingIndex === -1) {
            library.push({
                id: newBookId,
                type: 'pdf',
                pdfMode: 'scroll', 
                title: bookTitle,
                pages: total,
                progressPct: 0,
                lastReadId: null,
                shape: 'square'
            });
        } else {
            library[existingIndex].pages = total;
            library[existingIndex].title = bookTitle;
            library[existingIndex].pdfMode = 'scroll';
        }

        await localforage.setItem('pdf_epub_master', library);
        renderLibrary();
    };

    if (finalMode === 'canvas') {
        await saveAsCanvasMode();
    } else {
        await saveAsScrollMode();
    }
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
    const seenEpubHeadings = new Set();

    for (const idref of spine) {
        order++;
        DOM.loadBar.style.width = `${Math.round((order / spine.length) * 100)}%`;
        if(DOM.loadPct) DOM.loadPct.textContent = `${Math.round((order / spine.length) * 100)}%`;

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

                text = text.replace(/([A-Z]) (?=[A-Z])/g, '$1');
                text = text.replace(/B\s*A\s*B/gi, 'BAB');

                if (text.length < 2) continue;
                if (!/\w/.test(text) && !/[\u00C0-\u024F\u0600-\u06FF\u4E00-\u9FFF]/.test(text)) continue;

                let finalTag = 'p';

                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
                    const level = parseInt(tag[1]);

                    if (text.length > 200) {
                        finalTag = 'p';
                    } else if (level <= 3) {
                        finalTag = 'h1';
                    } else {
                        finalTag = 'h2';
                    }

                    if (finalTag !== 'p') {
                        const textKey = text.toLowerCase().trim();
                        if (seenEpubHeadings.has(textKey)) {
                            finalTag = 'p';
                        } else {
                            seenEpubHeadings.add(textKey);
                        }
                    }
                } else {
                    const cls = (el.getAttribute('class') || '').toLowerCase();
                    const isHeadingClass = /\b(chapter|heading|title|bab|judul|h[1-6]|header)\b/.test(cls);

                    if (isHeadingClass && text.length < 120) {
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
    
    // ID PERMANEN + CEK DUPLIKAT
    let newBookId = btoa(unescape(encodeURIComponent(file.name))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    if (file._isDuplicate) {
        newBookId = newBookId.substring(0, 20) + Date.now().toString(36);
        bookTitle = bookTitle + " (Copy)";
    }
    const existingIndex = library.findIndex(b => b.id === newBookId);

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
        const modelVersion = localStorage.getItem('gemini_model') || 'gemini-2.5-flash-preview-09-2025';
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
