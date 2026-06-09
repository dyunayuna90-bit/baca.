// --- APP LOGIC ---
// Mengurus interaksi UI, Tema, Render Library, Fitur In-Book Bookmark, & Manajemen Memori Tingkat Dewa

// 1. GLOBAL STATE & DOM REFERENCES
let library = []; 
let activeBookId = null; 
let observer = null; 
let activePanel = null;
let activeOptsId = null; 
let currentSelection = { text: "", nodeIdx: -1, startOff: 0, endOff: 0 }; 
let isBatchDeleteMode = false;
let selectedForDelete = [];
let activeNoteColor = 'yellow';
let editingAnnotId = null;

let isDark = localStorage.getItem('theme') !== 'light'; 
let currentThemeKey = localStorage.getItem('m3-key') || 'orchid';
let isAmoled = localStorage.getItem('amoled') === 'true';
let wikiLang = localStorage.getItem('wiki_lang') || 'en';

// State baru untuk menyembunyikan judul buku dari rak
let isTitlesHidden = localStorage.getItem('hide_book_titles') === 'true';

// --- CANVAS MODE STATE ---
let currentPdfDoc = null;
let currentCanvasPage = 1;
let currentCanvasScale = 1.0;
let isRenderingCanvas = false;

// Variabel untuk gesture Canvas (upgrade v25: pinch + pan + tap)
let canvasTouchStartScale = 1.0;
let canvasTouchStartDist = 0;
let canvasTranslateX = 0;
let canvasTranslateY = 0;
let canvasPanStartX = 0;
let canvasPanStartY = 0;
let canvasIsPinching = false;
let canvasTapStartX = 0;
let canvasTapStartY = 0;
let canvasTapStartTime = 0;

const DOM = {};

document.addEventListener("DOMContentLoaded", () => {
    // Terapkan state sembunyi judul kalau aktif dari localStorage
    if (isTitlesHidden) {
        document.body.classList.add('hide-book-titles');
    }

    // Inisialisasi DOM Elements
    Object.assign(DOM, {
        libView: document.getElementById('library-view'), 
        readView: document.getElementById('reader-view'),
        mainHeader: document.getElementById('main-header'),
        grid: document.getElementById('book-grid'), 
        empty: document.getElementById('empty-state'),
        topSection: document.getElementById('continue-reading-section'), 
        topSlider: document.getElementById('top-books-slider'),
        load: document.getElementById('loading-state'), 
        loadTxt: document.getElementById('loading-text'), 
        loadBar: document.getElementById('loading-bar'), 
        loadPct: document.getElementById('loading-percent'),
        file: document.getElementById('doc-upload'), 
        backBtn: document.getElementById('btn-back'),
        tocBtn: document.getElementById('btn-toc'), 
        setBtn: document.getElementById('settings-btn'),
        inner: document.getElementById('reader-inner'), 
        title: document.getElementById('reader-title'), 
        count: document.getElementById('library-count'),
        tocPanel: document.getElementById('toc-panel'), 
        tocList: document.getElementById('toc-list'),
        setPanel: document.getElementById('settings-panel'),
        bookmarkPanel: document.getElementById('bookmark-panel'),
        bookmarkList: document.getElementById('bookmark-list'),
        readContent: document.getElementById('reader-content'), 
        progBar: document.getElementById('reading-progress-bar'), 
        progTxt: document.getElementById('reader-progress-text'),
        searchInput: document.getElementById('inbook-search-input'), 
        searchRes: document.getElementById('search-results-panel'),
        globalSearch: document.getElementById('global-search'),
        // DOM Tambahan Canvas Mode
        scrollGrid: document.getElementById('scroll-book-grid'),
        canvasGrid: document.getElementById('canvas-book-grid'),
        scrollSection: document.getElementById('scroll-collection-section'),
        canvasSection: document.getElementById('canvas-collection-section'),
        canvasContainer: document.getElementById('canvas-container'),
        pdfCanvas: document.getElementById('pdf-canvas'),
        canvasWrapper: document.getElementById('canvas-wrapper'),
        canvasPageNum: document.getElementById('canvas-page-num'),
        canvasPageTotal: document.getElementById('canvas-page-total'),
        canvasWarning: document.getElementById('canvas-warning-info')
    });

    setupScrollListeners();
    setupSearchListeners();
    setupCanvasPinchZoom();
    syncWikiLangUI();
    applyLanguage();
    applyTypo();
    applyThemeToDOM();
    loadLibrary();
    setupSwipeToDismiss(); // Nyalain Gestur Aman

    if (!localStorage.getItem('first_time_seen_v5')) {
        setTimeout(() => { openModal('welcome-modal', 'welcome-sheet', true); }, 500);
    }
    
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && document.getElementById('gemini-api-key')) document.getElementById('gemini-api-key').value = savedKey;
    const savedModel = localStorage.getItem('gemini_model');
    if(savedModel && document.getElementById('gemini-model-select')) document.getElementById('gemini-model-select').value = savedModel;

    // Update versi app di layar pengaturan
    const verDisplay = document.getElementById('app-version-display');
    if (verDisplay && window.APP_VERSION) verDisplay.textContent = `v${window.APP_VERSION}`;
});

// Update UI Statistik
window.updateStatistics = function() {
    let totalBooks = library.length;
    let readingBooks = 0;
    let completedBooks = 0;
    let totalNotes = 0;

    library.forEach(book => {
        let pct = parseInt(book.progressPct) || 0;
        
        if (pct > 0 && pct < 100) readingBooks++;
        else if (pct === 100) completedBooks++;
        
        if (book.annotations && Array.isArray(book.annotations)) {
            totalNotes += book.annotations.length;
        }
    });

    const valTotal = document.getElementById('stat-val-total');
    const valReading = document.getElementById('stat-val-reading');
    const valCompleted = document.getElementById('stat-val-completed');
    const valNotes = document.getElementById('stat-val-notes');
    
    if(valTotal) valTotal.textContent = totalBooks;
    if(valReading) valReading.textContent = readingBooks;
    if(valCompleted) valCompleted.textContent = completedBooks;
    if(valNotes) valNotes.textContent = totalNotes;
};

// 2. SCROLL & NAVIGATION LISTENERS
function setupScrollListeners() {
    const libScroll = document.getElementById('library-content-scroll');
    if(libScroll && DOM.mainHeader) {
        libScroll.addEventListener('scroll', () => {
            if (libScroll.scrollTop > 5) { DOM.mainHeader.classList.add('shadow-[0_2px_10px_rgba(0,0,0,0.05)]'); } 
            else { DOM.mainHeader.classList.remove('shadow-[0_2px_10px_rgba(0,0,0,0.05)]'); }
        });
    }

    let lastScrollTop = 0;
    if(DOM.readContent) {
        DOM.readContent.addEventListener('scroll', () => {
            const bottomBar = document.getElementById('reader-bottom-bar');
            if (bottomBar && bottomBar.classList.contains('hidden')) return;

            const currentScroll = DOM.readContent.scrollTop;
            const header = document.getElementById('reader-floating-header');
            
            if (currentScroll > lastScrollTop && currentScroll > 50) {
                header.classList.add('-translate-y-[150%]', 'opacity-0');
                header.classList.remove('translate-y-0', 'opacity-100');
            } else {
                header.classList.remove('-translate-y-[150%]', 'opacity-0');
                header.classList.add('translate-y-0', 'opacity-100');
            }
            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        }, { passive: true });
    }
}

function updateBottomNavUI(activeId) {
    const btns = ['btn-toc', 'btn-bookmarks', 'btn-settings'];
    btns.forEach(id => {
        const b = document.getElementById(id);
        if(b) {
            b.classList.remove('bg-m3-primary', 'text-m3-onPrimary', 'nav-active');
            b.classList.add('text-m3-onSurfaceVariant');
        }
    });
    if(activeId) {
        const act = document.getElementById(activeId);
        if(act) {
            act.classList.add('bg-m3-primary', 'text-m3-onPrimary', 'nav-active');
            act.classList.remove('text-m3-onSurfaceVariant');
        }
    }
}

// 3. HARDWARE BACK BUTTON & HISTORY ROUTING
window.addEventListener('popstate', (e) => {
    if (!document.getElementById('raw-backup-modal').classList.contains('opacity-0')) { _closeModalAction('raw-backup-modal', 'raw-backup-sheet', true, true); }
    else if (!document.getElementById('raw-restore-modal').classList.contains('opacity-0')) { _closeModalAction('raw-restore-modal', 'raw-restore-sheet', true, true); }
    else if (!document.getElementById('custom-dialog').classList.contains('opacity-0')) { window.closeDialog(true); }
    else if (!document.getElementById('ai-modal').classList.contains('opacity-0')) { closeAiModal(true); }
    else if (!document.getElementById('bookmark-modal').classList.contains('opacity-0')) { _closeModalAction('bookmark-modal', 'bookmark-sheet', true, true); }
    else if (!document.getElementById('b-opt-modal').classList.contains('opacity-0')) { _closeModalAction('b-opt-modal', 'b-opt-sheet', false, true); }
    else if (!document.getElementById('edit-modal').classList.contains('opacity-0')) { _closeModalAction('edit-modal', 'edit-sheet', true, true); }
    else if (!document.getElementById('global-settings-modal').classList.contains('opacity-0')) { _closeModalAction('global-settings-modal', 'global-settings-sheet', false, true); }
    else if (!document.getElementById('welcome-modal').classList.contains('opacity-0')) { closeWelcome(true); }
    else if (!document.getElementById('backup-type-modal').classList.contains('opacity-0')) { _closeModalAction('backup-type-modal', 'backup-type-sheet', true, true); }
    else if (!document.getElementById('pdf-mode-modal').classList.contains('opacity-0')) { _closeModalAction('pdf-mode-modal', 'pdf-mode-sheet', true, true); }
    else if (isBatchDeleteMode) { window.toggleBatchDelete(true); }
    else if (activePanel) { _closeSidePanelsAction(true); } 
    else if (document.getElementById('search-area').classList.contains('search-active')) { closeSearch(true); }
    else if (document.getElementById('reader-bottom-bar') && document.getElementById('reader-bottom-bar').classList.contains('hidden')) { window.toggleFullscreenReading(true); }
    else if (DOM.readView && !DOM.readView.classList.contains('translate-y-full')) { _closeReaderAction(true); }
});

function pushAppHistory(stateName) { history.pushState({ state: stateName }, '', `#${stateName}`); }

// 4. SEARCH & I18N
function setupSearchListeners() {
    const searchArea = document.getElementById('search-area');
    const searchCapsule = document.querySelector('.search-capsule');
    
    document.addEventListener('click', (e) => {
        if (searchArea && searchArea.classList.contains('search-active') && !searchArea.contains(e.target)) {
            window.closeSearch(false);
        }
    });

    if(DOM.globalSearch) {
        DOM.globalSearch.addEventListener('focus', () => {
            if (!searchArea.classList.contains('search-active')) {
                searchArea.classList.add('search-active');
                if (window.location.hash !== '#search') pushAppHistory('search');
            }
        });
        DOM.globalSearch.addEventListener('input', (e) => {
            // Auto-hide statistik saat search
            const statSection = document.getElementById('statistics-section');
            if(statSection) {
                if(e.target.value.trim().length > 0) {
                    statSection.style.height = '0px';
                    statSection.style.opacity = '0';
                    statSection.style.marginBottom = '0px';
                } else {
                    statSection.style.height = '';
                    statSection.style.opacity = '1';
                    statSection.style.marginBottom = '';
                }
            }
            renderLibrary(e.target.value);
        });
    }

    if(searchCapsule) {
        searchCapsule.addEventListener('click', (e) => {
            if (searchArea.classList.contains('search-active')) {
                if (e.target !== DOM.globalSearch) { window.closeSearch(false); }
            } else { DOM.globalSearch.focus(); }
        });
    }
}

window.closeSearch = function(fromHistory = false) {
    const searchArea = document.getElementById('search-area');
    const statSection = document.getElementById('statistics-section');

    if (searchArea && searchArea.classList.contains('search-active')) {
        searchArea.classList.remove('search-active');
        DOM.globalSearch.blur(); DOM.globalSearch.value = ''; 
        
        if(statSection) {
             statSection.style.height = '';
             statSection.style.opacity = '1';
             statSection.style.marginBottom = '';
        }

        renderLibrary();
        if (!fromHistory && window.location.hash === '#search') history.back();
    }
};

const setElementText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

function applyLanguage() {
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    if (!Object.keys(d).length) return;

    setElementText('str-lib-empty', d.libEmpty); setElementText('str-continue-reading', d.continueReading);
    setElementText('btn-batch-cancel', d.cancel); setElementText('btn-batch-exec', d.delete);
    setElementText('str-opt-select', d.optSelect); setElementText('str-opt-edit', d.optEdit);
    setElementText('str-opt-delete', d.optDelete); setElementText('str-opt-cancel', d.optCancel);
    
    setElementText('str-pinned-books', d.pinnedBooks);
    setElementText('str-nav-bookmark', d.navBookmark);
    if (document.getElementById('str-bookmark-title')) { document.getElementById('str-bookmark-title').innerHTML = `<i data-lucide="bookmark"></i> ${d.bookmarkTitle}`; }
    setElementText('str-bookmark-empty', d.bookmarkEmpty);
    
    setElementText('str-bookmark-cancel', d.bookmarkCancel); setElementText('str-bookmark-save', d.bookmarkSave);
    if (document.getElementById('str-bookmark-modal-title')) { document.getElementById('str-bookmark-modal-title').innerHTML = `<i data-lucide="bookmark" class="w-5 h-5"></i> ${d.bookmarkModalTitle}`; }
    if (document.getElementById('bookmark-input-title')) document.getElementById('bookmark-input-title').placeholder = d.bookmarkTitlePlaceholder;
    if (document.getElementById('bookmark-input-text')) document.getElementById('bookmark-input-text').placeholder = d.bookmarkNotePlaceholder;
    
    setElementText('str-wel-title', d.welcomeTitle); setElementText('str-wel-desc', d.welcomeDesc);
    setElementText('str-wel-backup', d.welBackup); 
    if(document.getElementById('str-wel-backup-desc')) document.getElementById('str-wel-backup-desc').innerHTML = d.welBackupDesc;
    setElementText('str-wel-format', d.welFormat); 
    if(document.getElementById('str-wel-format-desc')) document.getElementById('str-wel-format-desc').innerHTML = d.welFormatDesc;
    setElementText('str-wel-privacy', d.welPrivacy); setElementText('str-wel-privacy-desc', d.welPrivacyDesc);
    setElementText('str-wel-btn', d.welBtn);
    
    setElementText('str-set-main-title', d.setMainTitle); setElementText('str-set-palette', d.setPalette);
    setElementText('str-set-lang', d.setLang); setElementText('str-set-info', d.setInfo);
    setElementText('str-set-data', d.setData); setElementText('str-btn-backup', d.btnBackup); setElementText('str-btn-restore', d.btnRestore);
    setElementText('str-btn-info', d.btnInfo); setElementText('str-btn-donate', d.btnDonate);
    setElementText('str-btn-close', d.btnClose);
    
    setElementText('str-set-ai-config', d.setAiConfig);
    if(document.getElementById('gemini-api-key')) document.getElementById('gemini-api-key').placeholder = d.geminiPlaceholder;
    setElementText('gemini-desc', d.geminiDesc);
    
    setElementText('str-btn-update', d.btnUpdate);
    setElementText('str-btn-clear-covers', d.btnClearCovers);
    setElementText('str-btn-clear-books', d.btnClearAllBooks || 'Hapus Semua Buku');

    setElementText('str-nav-back', d.navBack); setElementText('str-nav-toc', d.navToc);
    setElementText('str-nav-text', d.navText); setElementText('str-nav-full', d.navFull);
    setElementText('str-set-search', d.navSearch);
    
    setElementText('str-reader-loading', d.readerLoading); setElementText('str-toc-title', d.tocTitle);
    setElementText('str-set-title', d.setTitle); setElementText('str-set-theme', d.setTheme);
    setElementText('str-set-size', d.setSize); setElementText('str-set-align', d.setAlign);
    setElementText('str-set-font', d.setFont);
    
    setElementText('str-ai-title', d.aiTitle); setElementText('str-ai-loading', d.aiLoading);
    
    setElementText('str-edit-title', d.editTitle); setElementText('str-edit-book-title', d.editBookTitle);
    setElementText('str-edit-book-cover', d.editBookCover); setElementText('str-edit-book-shape', d.editBookShape);
    setElementText('str-edit-cancel', d.editCancel); setElementText('str-edit-save', d.editSave);
    setElementText('str-amoled-label', d.amoledLabel);
    setElementText('str-hide-titles-label', d.setHideTitles || 'Sembunyikan Judul Buku');
    _syncHideTitlesUI();
    
    setElementText('shape-default', d.shapeDyn);
    setElementText('shape-rounded', d.shapeRound);
    setElementText('shape-square', d.shapeSquare);
   
    setElementText('str-raw-bak-title', d.rawBakTitle); setElementText('str-raw-bak-desc', d.rawBakDesc);
    setElementText('str-raw-bak-btn-close', d.rawBakClose); setElementText('str-raw-bak-btn-copy', d.rawBakCopy);
    setElementText('str-raw-res-title', d.rawResTitle); setElementText('str-raw-res-desc', d.rawResDesc);
    setElementText('str-raw-res-btn-file', d.rawResFile); setElementText('str-raw-res-btn-process', d.rawResProcess);
    setElementText('str-raw-res-btn-close', d.rawResClose);

    // Translasi Tambahan Phase 5
    setElementText('str-scroll-rak-title', d.scrollRakTitle || "Rak Mode Scroll");
    setElementText('str-canvas-rak-title', d.canvasRakTitle || "Rak Mode Canvas (Layout Asli)");
    setElementText('str-pdf-canvas-warning', d.pdfCanvasWarning || "Fitur tipografi dinonaktifkan pada Mode Canvas.");
    setElementText('str-pdf-mode-prompt-title', d.pdfModePromptTitle);
    setElementText('str-pdf-mode-prompt-desc', d.pdfModePromptDesc);
    setElementText('str-pdf-mode-btn-scroll', d.pdfModeBtnScroll);
    setElementText('str-pdf-mode-btn-scroll-desc', d.pdfModeBtnScrollDesc);
    setElementText('str-pdf-mode-btn-canvas', d.pdfModeBtnCanvas);
    setElementText('str-pdf-mode-btn-canvas-desc', d.pdfModeBtnCanvasDesc);
    setElementText('str-pdf-mode-btn-cancel', d.cancel);

    if(document.getElementById('str-bak-modal-title')) {
        setElementText('str-bak-modal-title', d.bakModalTitle);
        setElementText('str-bak-modal-desc', d.bakModalDesc);
        setElementText('str-bak-json-title', d.bakJsonTitle);
        setElementText('str-bak-json-desc', d.bakJsonDesc);
        setElementText('str-bak-zip-title', d.bakZipTitle);
        setElementText('str-bak-zip-desc', d.bakZipDesc);
        setElementText('str-bak-zip-warn', d.bakZipWarn);
        setElementText('str-bak-cancel', d.bakCancel);
    }

    if(DOM.globalSearch) DOM.globalSearch.placeholder = d.searchBooks;
    if(DOM.searchInput) DOM.searchInput.placeholder = d.searchPlaceholder;
    const bmSearchInput = document.getElementById('bookmark-search-input');
    if (bmSearchInput) bmSearchInput.placeholder = d.bookmarkSearchPlaceholder || 'Cari bookmark...';
    if(DOM.count) DOM.count.textContent = `${(library.length)} ${d.booksCount}`;
    
    const themeLabel = document.getElementById('theme-label-text');
    if (themeLabel) themeLabel.textContent = isDark ? d.themeDark : d.themeLight;

    updateBatchSelectionUI();

    setElementText('str-stat-title', d.statTitle || "Statistik");
    setElementText('str-stat-total', d.statTotal || "Koleksi");
    setElementText('str-stat-reading', d.statReading || "Dibaca");
    setElementText('str-stat-completed', d.statCompleted || "Selesai");
    setElementText('str-stat-notes', d.statNotes || "Catatan");

    // TOC canvas warning
    setElementText('str-toc-canvas-warning', d.tocCanvasWarning || 'Untuk mode canvas, daftar isi tidak tersedia.');
}

window.setWikiLang = function(lang) {
    wikiLang = lang; localStorage.setItem('wiki_lang', lang); syncWikiLangUI(); applyLanguage();
    if(activeBookId) renderBookmarkPanel(); 
};

window.saveGeminiModel = function() {
    const model = document.getElementById('gemini-model-select').value;
    localStorage.setItem('gemini_model', model);
};

window.saveGeminiKey = function() {
    const key = document.getElementById('gemini-api-key').value.trim();
    localStorage.setItem('gemini_api_key', key);
    const d = i18n[wikiLang] || i18n['id'];
    showDialog('Info', d.keySaved || "API Key berhasil disimpan.", 'check-circle', [{text: 'Oke', primary: true}]);
};

function syncWikiLangUI() {
    const wid = document.getElementById('wiki-lang-id');
    const wen = document.getElementById('wiki-lang-en');
    const wes = document.getElementById('wiki-lang-es');
    if(wid && wen) {
        [wid, wen, wes].forEach(el => { 
            if(el) {
                el.classList.remove('bg-m3-primary', 'text-m3-onPrimary'); 
                el.classList.add('text-m3-onSurfaceVariant'); 
            }
        });
        if (wikiLang === 'id') { wid.classList.add('bg-m3-primary', 'text-m3-onPrimary'); wid.classList.remove('text-m3-onSurfaceVariant'); }
        else if (wikiLang === 'es') { if (wes) { wes.classList.add('bg-m3-primary', 'text-m3-onPrimary'); wes.classList.remove('text-m3-onSurfaceVariant'); } }
        else { wen.classList.add('bg-m3-primary', 'text-m3-onPrimary'); wen.classList.remove('text-m3-onSurfaceVariant'); }
    }
}

// 5. CUSTOM DIALOG & MODALS
window.showDialog = function(title, message, iconStr, buttons) {
    pushAppHistory('custom-dialog');
    const m = document.getElementById('custom-dialog');
    const s = document.getElementById('custom-dialog-sheet');
    
    document.getElementById('dialog-title').innerText = title;
    document.getElementById('dialog-message').innerHTML = message;
    
    const iconContainer = document.getElementById('dialog-icon-container');
    if(iconContainer) iconContainer.classList.remove('animate-spin');

    const iconEl = document.getElementById('dialog-icon');
    if(iconEl) iconEl.setAttribute('data-lucide', iconStr);
    
    const actionsContainer = document.getElementById('dialog-actions');
    actionsContainer.innerHTML = '';
    
    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.innerText = btn.text;
        if (btn.primary) {
            b.className = "px-6 py-2 bg-m3-primary text-m3-onPrimary font-bold rounded-full btn-morph tracking-wide";
        } else {
            b.className = "px-4 py-2 bg-transparent text-m3-onSurfaceVariant font-bold rounded-full btn-morph tracking-wide";
        }
        b.onclick = () => {
            if(btn.action) btn.action();
            else window.closeDialog();
        };
        actionsContainer.appendChild(b);
    });
    
    if(window.lucide) window.lucide.createIcons();

    m.classList.remove('hidden');
    requestAnimationFrame(() => {
        m.classList.remove('opacity-0');
        s.classList.remove('scale-75');
    });
};

window.closeDialog = function(isFromHistory = false) {
    if (!isFromHistory) { history.back(); return; }
    const m = document.getElementById('custom-dialog');
    const s = document.getElementById('custom-dialog-sheet');
    
    s.scale = '75';
    s.classList.add('scale-75');
    m.classList.add('opacity-0');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.openModal = function(modalId, sheetId, isScale = false) {
    pushAppHistory(`modal-${modalId}`);
    const m = document.getElementById(modalId); const s = document.getElementById(sheetId);
    if(m && s) {
        m.classList.remove('hidden'); 
        requestAnimationFrame(() => { 
            m.classList.remove('opacity-0'); 
            if(isScale) { s.classList.remove('scale-75', 'translate-y-12'); } 
            else { s.classList.remove('translate-y-full'); } 
        });
    }
}

window._closeModalAction = function(modalId, sheetId, isScale = false, isFromHistory = false) {
    if (!isFromHistory) { history.back(); return; }
    const m = document.getElementById(modalId); const s = document.getElementById(sheetId);
    if(m && s) {
        if(isScale) { s.classList.add('scale-75', 'translate-y-12'); } 
        else { s.classList.add('translate-y-full'); }
        m.classList.add('opacity-0'); setTimeout(() => m.classList.add('hidden'), 300);
    }
}

window.closeWelcome = function(isFromHistory = false) {
    _closeModalAction('welcome-modal', 'welcome-sheet', true, isFromHistory || (window.location.hash !== '#modal-welcome'));
    localStorage.setItem('first_time_seen_v5', 'true');
};

// 6. LOGIKA CEK PEMBARUAN & HAPUS SAMPUL
function compareVersions(v1, v2) {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return 1; 
        if (num1 < num2) return -1; 
    }
    return 0; 
}

window.checkForUpdate = async function() {
    const icon = document.getElementById('icon-update-app');
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    
    if(!window.UPDATE_URL) return;
    if(icon) icon.classList.add('animate-spin');
    
    try {
        const res = await fetch(window.UPDATE_URL + '?t=' + new Date().getTime());
        if (!res.ok) throw new Error("Gagal terhubung ke GitHub");
        
        const data = await res.json();
        const latestVersion = data.version;
        const currentVersion = window.APP_VERSION;

        if(icon) icon.classList.remove('animate-spin');

        if (compareVersions(latestVersion, currentVersion) > 0) {
            showDialog(
                d.updateAvailableTitle || "Update Tersedia!",
                (d.updateAvailableDesc || "Versi {v} udah rilis nih. Mau buka halaman download sekarang?").replace('{v}', latestVersion),
                "arrow-up-circle",
                [
                    { text: d.cancel || "Batal", primary: false },
                    { text: d.btnDownload || "Download", primary: true, action: () => {
                        window.closeDialog();
                        if(window.RELEASES_URL) window.open(window.RELEASES_URL, '_blank');
                    }}
                ]
            );
        } else {
            showDialog(
                d.updateLatestTitle || "Sudah Versi Terbaru",
                d.updateLatestDesc || `Aplikasi lu udah pakai versi paling baru (v${currentVersion}).`,
                "check-circle",
                [{ text: "Oke", primary: true }]
            );
        }
    } catch (err) {
        console.error("Cek update gagal:", err);
        if(icon) icon.classList.remove('animate-spin');
        showDialog("Error", d.updateError || "Gagal ngecek update. Pastiin internet lu nyala.", "wifi-off", [{ text: "Tutup", primary: true }]);
    }
};

window.clearAllCoversConfirm = function() {
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    if (!library || library.length === 0) {
        showDialog("Info", d.libEmpty || "Perpustakaan kosong.", "info", [{ text: "Oke", primary: true }]);
        return;
    }

    showDialog(
        d.clearCoversTitle || "Hapus Semua Sampul?",
        d.clearCoversDesc || "Semua gambar sampul akan dihapus permanen untuk menghemat memori. Buku dan progres bacaan tetap aman 100%. Lanjutkan?",
        "image-off",
        [
            { text: d.cancel || "Batal", primary: false },
            { text: d.delete || "Hapus", primary: true, action: async () => {
                window.closeDialog();
                
                for (let book of library) {
                    await localforage.removeItem('cover_' + book.id);
                }
                
                renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : "");
                
                setTimeout(() => {
                    showDialog("Sukses", d.clearCoversSuccess || "Semua sampul berhasil dihapus! Aplikasi sekarang jauh lebih ringan.", "check-circle", [{ text: "Mantap", primary: true }]);
                }, 400);
            }}
        ]
    );
};

// Fix 8: Hapus Semua Buku
window.clearAllBooksConfirm = function() {
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    if (!library || library.length === 0) {
        showDialog("Info", d.libEmpty || "Perpustakaan kosong.", "info", [{ text: d.btnClose || "Oke", primary: true }]);
        return;
    }

    showDialog(
        d.clearAllBooksTitle || "Hapus Semua Buku?",
        d.clearAllBooksDesc || "Semua buku, progres, catatan, sampul, dan konten akan dihapus permanen. Tindakan ini tidak bisa dibatalkan. Lanjutkan?",
        "trash-2",
        [
            { text: d.cancel || "Batal", primary: false },
            { text: d.delete || "Hapus", primary: true, action: async () => {
                window.closeDialog();

                for (let book of library) {
                    await localforage.removeItem('content_' + book.id);
                    await localforage.removeItem('rawpdf_' + book.id);
                    await localforage.removeItem('cover_' + book.id);
                }
                library = [];
                await localforage.setItem('pdf_epub_master', library);

                renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : "");

                setTimeout(() => {
                    showDialog(
                        d.clearAllBooksSuccessTitle || "Semua Buku Dihapus",
                        d.clearAllBooksSuccess || "Semua buku berhasil dihapus. Perpustakaan sekarang kosong.",
                        "check-circle",
                        [{ text: d.btnClose || "Oke", primary: true }]
                    );
                }, 400);
            }}
        ]
    );
};

// 7. BACKUP & RESTORE DATA (JSON PROGRESS & ZIP FULL)
window.executeBackup = async function(type) {
    _closeModalAction('backup-type-modal', 'backup-type-sheet', true, true);
    
    if (!library || library.length === 0) {
        const txt = i18n[wikiLang] || i18n['id'];
        const msg = txt.libEmpty || "Perpustakaan kosong.";
        setTimeout(() => showDialog("Info", msg, "info", [{ text: txt.btnClose || "Oke", primary: true }]), 350);
        return;
    }

    setTimeout(async () => {
        const txt = i18n[wikiLang] || i18n['id'];
        const title = txt.bakLoadingTitle || "Memproses Backup";
        const desc = type === 'zip' ? (txt.bakZipLoading || "Menyiapkan file ZIP...") : (txt.bakJsonLoading || "Menyiapkan file backup JSON...");

        showDialog(title, `
            <div class="flex flex-col items-center justify-center gap-4 py-4">
                <div class="w-8 h-8 border-4 border-m3-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-xs font-bold text-center opacity-80 leading-relaxed">${desc}</p>
            </div>
        `, "info", []);

        try {
            if (type === 'json') {
                const lightLib = library.map(b => ({ ...b })); 
                const dataStr = JSON.stringify(lightLib);
                await saveFileNativeOrWeb(dataStr, `Baca_ProgressOnly_${Date.now()}.json`, 'application/json');
            } else if (type === 'zip') {
                const zip = new JSZip();
                zip.file("library.json", JSON.stringify(library));
                
                const contentsFolder = zip.folder("contents");
                const coversFolder = zip.folder("covers");
                const canvasFolder = zip.folder("canvas_pdf");

                for (const b of library) {
                    if (b.pdfMode === 'canvas') {
                        const rawPdf = await localforage.getItem('rawpdf_' + b.id);
                        if (rawPdf) canvasFolder.file(`${b.id}.pdf`, rawPdf);
                    } else {
                        const nodes = await localforage.getItem('content_' + b.id);
                        if (nodes) contentsFolder.file(`${b.id}.json`, JSON.stringify(nodes));
                    }
                    
                    const cover = await localforage.getItem('cover_' + b.id);
                    if (cover) coversFolder.file(`${b.id}.txt`, cover);
                }

                const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
                await saveFileNativeOrWebBlob(content, `Baca_FullBackup_${Date.now()}.zip`);
            }
        } catch (err) {
            console.error("Backup failed:", err);
            window.closeDialog();
            const btnClose = txt.btnClose || "Tutup";
            setTimeout(() => showDialog("Error", "Backup gagal: " + err.message, "alert-triangle", [{ text: btnClose, primary: true }]), 400);
        }
    }, 350);
};

async function saveFileNativeOrWeb(text, filename, mime) {
    const txt = i18n[wikiLang] || i18n['id'];
    const successTitle = txt.bakSuccessTitle || "Backup Sukses";
    const successDesc = txt.bakSuccessJson || "File JSON berhasil dibuat.";
    const btnOk = txt.btnClose || "Tutup";

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        try {
            await window.Capacitor.Plugins.Filesystem.writeFile({
                path: filename, data: text, directory: 'DOCUMENTS', encoding: 'utf8'
            });
            window.closeDialog();
            setTimeout(() => showDialog(successTitle, `${successDesc}\n\nDocuments:\n${filename}`, "check-circle", [{text: btnOk, primary: true}]), 400);
            return;
        } catch (e) {
            console.log("Capacitor write gagal, beralih ke teks raw.", e);
            document.getElementById('raw-backup-textarea').value = text;
            window.closeDialog(true);
            setTimeout(() => openModal('raw-backup-modal', 'raw-backup-sheet', true), 350);
            return;
        }
    }
    const blob = new Blob([text], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    window.closeDialog();
    setTimeout(() => showDialog(successTitle, `${successDesc}\n\nFile diunduh:\n${filename}`, "check-circle", [{text: btnOk, primary: true}]), 400);
}

async function saveFileNativeOrWebBlob(blob, filename) {
    const txt = i18n[wikiLang] || i18n['id'];
    const successTitle = txt.bakSuccessTitle || "Backup Sukses";
    const successDesc = txt.bakSuccessZip || "File ZIP berhasil disusun.";
    const btnOk = txt.btnClose || "Tutup";

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async function() {
                const base64data = reader.result.split(',')[1];
                await window.Capacitor.Plugins.Filesystem.writeFile({
                    path: filename, data: base64data, directory: 'DOCUMENTS'
                });
                window.closeDialog();
                setTimeout(() => showDialog(successTitle, `${successDesc}\n\nDocuments:\n${filename}`, "check-circle", [{text: btnOk, primary: true}]), 400);
            }
            return;
        } catch (e) { console.log("Capacitor write blob gagal", e); }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    window.closeDialog();
    setTimeout(() => showDialog(successTitle, `${successDesc}\n\nFile diunduh:\n${filename}`, "check-circle", [{text: btnOk, primary: true}]), 400);
}

window.copyRawBackup = function() {
    const textarea = document.getElementById('raw-backup-textarea');
    textarea.select();
    textarea.setSelectionRange(0, 9999999); 
    try {
        document.execCommand('copy');
        const btnSpan = document.getElementById('str-raw-bak-btn-copy');
        const originalText = btnSpan.innerText;
        btnSpan.innerText = wikiLang === 'id' ? "Berhasil Disalin!" : "Copied!";
        setTimeout(() => { btnSpan.innerText = originalText; }, 2000);
    } catch (err) {
        showDialog("Error", "Gagal menyalin otomatis.", "alert-circle", [{ text: "Tutup", primary: true }]);
    }
};

window.openRestoreOptions = function() {
    document.getElementById('raw-restore-textarea').value = '';
    openModal('raw-restore-modal', 'raw-restore-sheet', true);
};

window.processRawRestore = function() {
    const val = document.getElementById('raw-restore-textarea').value.trim();
    if(!val) {
        showDialog("Info", wikiLang === 'id' ? "Kotak teks masih kosong." : "Text box is empty.", "info", [{ text: "Oke", primary: true }]);
        return;
    }
    executeRestoreLogic(val);
};

window.importDataFile = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        if (file.name.toLowerCase().endsWith('.zip')) {
            DOM.load.classList.remove('hidden');
            if(DOM.loadTxt) DOM.loadTxt.innerText = wikiLang === 'id' ? "Mengekstrak ZIP..." : "Extracting ZIP...";
            DOM.loadBar.style.width = '10%';

            const zip = await JSZip.loadAsync(file);
            const metaFile = zip.file("library.json");
            if (!metaFile) throw new Error("File ZIP tidak valid: library.json tidak ditemukan.");
            
            const metaContent = await metaFile.async("string");
            const metadata = JSON.parse(metaContent);

            DOM.load.classList.add('hidden');
            const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
            const confirmMsg = (d.zipRestoreConfirm || "Ditemukan {n} buku paket lengkap di file ZIP ini. Lanjut?").replace('{n}', metadata.length);

            showDialog(
                wikiLang === 'id' ? "Konfirmasi Restore ZIP" : "Confirm ZIP Restore",
                confirmMsg,
                "alert-triangle",
                [
                    { text: d.cancel || "Batal", primary: false },
                    { text: wikiLang === 'id' ? "Lanjut" : "Continue", primary: true, action: async () => {
                        window.closeDialog();
                        DOM.load.classList.remove('hidden');
                        if(DOM.loadTxt) DOM.loadTxt.innerText = wikiLang === 'id' ? "Memulihkan data..." : "Restoring data...";

                        let mergedLibrary = [...library];
                        let count = 0;

                        for (const b of metadata) {
                            if (b.pdfMode === 'canvas') {
                                const pdfFile = zip.file(`canvas_pdf/${b.id}.pdf`);
                                if (pdfFile) {
                                    const pdfBlob = await pdfFile.async("blob");
                                    await localforage.setItem('rawpdf_' + b.id, pdfBlob);
                                }
                            } else {
                                const nodeFile = zip.file(`contents/${b.id}.json`);
                                if (nodeFile) {
                                    const nodesStr = await nodeFile.async("string");
                                    await localforage.setItem('content_' + b.id, JSON.parse(nodesStr));
                                }
                            }
                            
                            const coverFile = zip.file(`covers/${b.id}.txt`);
                            if (coverFile) {
                                const coverStr = await coverFile.async("string");
                                await localforage.setItem('cover_' + b.id, coverStr);
                            }

                            const existingIndex = mergedLibrary.findIndex(lib => lib.id === b.id);
                            if (existingIndex > -1) {
                                mergedLibrary[existingIndex] = { ...mergedLibrary[existingIndex], ...b };
                            } else {
                                mergedLibrary.push(b);
                            }
                            count++;
                            DOM.loadBar.style.width = `${10 + (count / metadata.length * 90)}%`;
                        }

                        library = mergedLibrary;
                        await localforage.setItem('pdf_epub_master', library);
                        renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : "");
                        
                        DOM.load.classList.add('hidden');
                        if (!document.getElementById('raw-restore-modal').classList.contains('hidden')) history.back();
                        setTimeout(() => {
                            if (!document.getElementById('global-settings-modal').classList.contains('hidden')) history.back();
                        }, 300);

                        setTimeout(() => {
                            showDialog(
                                wikiLang === 'id' ? "Restore Berhasil!" : "Restore Success!",
                                wikiLang === 'id' ? "Seluruh isi buku dan progres berhasil dipulihkan." : "All books and progress successfully restored.",
                                "check-circle",
                                [{ text: "Oke", primary: true }]
                            );
                        }, 700);
                    }}
                ]
            );
        } else if (file.name.toLowerCase().endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = function(e) { executeRestoreLogic(e.target.result); };
            reader.readAsText(file);
        } else {
            throw new Error("Format file tidak didukung. Harus .json atau .zip");
        }
    } catch (err) {
        console.error("Import failed:", err);
        DOM.load.classList.add('hidden');
        showDialog("Error", "Gagal memproses file: " + err.message, "alert-circle", [{ text: "Tutup", primary: true }]);
    }
    event.target.value = ''; 
};

async function executeRestoreLogic(jsonString) {
    try {
        const parsedData = JSON.parse(jsonString);
        if (!Array.isArray(parsedData)) throw new Error("Format file/teks tidak valid.");

        const isValid = parsedData.every(b => b.id && b.title);
        if (!isValid) throw new Error("Data backup rusak atau tidak kompatibel.");

        const existingIds = new Set(library.map(b => b.id));
        const matchCount = parsedData.filter(b => existingIds.has(b.id)).length;
        const newCount = parsedData.length - matchCount;

        const confirmMsg = wikiLang === 'id'
            ? `Ditemukan ${matchCount} buku yang cocok (progress & catatan akan dipulihkan) dan ${newCount} buku baru (perlu import ulang file aslinya). Lanjut?`
            : `Found ${matchCount} matching books (progress & notes restored) and ${newCount} new books (re-import original files). Continue?`;

        showDialog(
            wikiLang === 'id' ? "Konfirmasi Restore JSON" : "Confirm JSON Restore",
            confirmMsg,
            "alert-triangle",
            [
                { text: wikiLang === 'id' ? "Batal" : "Cancel", primary: false },
                { text: wikiLang === 'id' ? "Lanjut" : "Continue", primary: true, action: async () => {
                    window.closeDialog();

                    let mergedLibrary = [...library];

                    for (let b of parsedData) {
                        if (b.nodes && b.nodes.length > 0) {
                            await localforage.setItem('content_' + b.id, b.nodes);
                        }

                        let meta = {...b};
                        delete meta.nodes;
                        delete meta.coverBase64;

                        const existingIndex = mergedLibrary.findIndex(lib => lib.id === b.id);
                        if (existingIndex > -1) {
                            mergedLibrary[existingIndex] = {
                                ...mergedLibrary[existingIndex],
                                progressPct: meta.progressPct,
                                lastReadId: meta.lastReadId,
                                annotations: meta.annotations || [],
                                isPinned: meta.isPinned,
                                title: meta.title,
                                pdfMode: meta.pdfMode || 'scroll'
                            };
                        } else {
                            mergedLibrary.push(meta);
                        }
                    }

                    await localforage.setItem('pdf_epub_master', mergedLibrary);
                    library = mergedLibrary;
                    renderLibrary(DOM.globalSearch.value);

                    if (!document.getElementById('raw-restore-modal').classList.contains('hidden')) history.back();
                    setTimeout(() => {
                        if (!document.getElementById('global-settings-modal').classList.contains('hidden')) history.back();
                    }, 300);

                    setTimeout(() => {
                        const successMsg = wikiLang === 'id'
                            ? `Restore selesai! ${matchCount} buku langsung bisa dibaca, ${newCount} buku perlu import ulang file aslinya.`
                            : `Restore done! ${matchCount} books ready to read, ${newCount} books need original files re-imported.`;
                        showDialog(
                            wikiLang === 'id' ? "Restore Berhasil!" : "Restore Success!",
                            successMsg,
                            "check-circle",
                            [{ text: "Oke", primary: true }]
                        );
                    }, 700);
                }}
            ]
        );
    } catch (err) {
        console.error("Restore failed:", err);
        showDialog("Error", (wikiLang === 'id' ? "Gagal memulihkan: " : "Failed to restore: ") + err.message, "alert-circle", [{ text: "Tutup", primary: true }]);
    }
}

// 8. LIBRARY & BOOK MANAGEMENT (AUTO-MIGRASI MEMORY EKSTREM)
async function loadLibrary() { 
    try { 
        library = await localforage.getItem('pdf_epub_master') || []; 
        let needsMigration = false;

        for (let i = 0; i < library.length; i++) {
            let changed = false;
            
            if (library[i].nodes && library[i].nodes.length > 0) {
                await localforage.setItem('content_' + library[i].id, library[i].nodes);
                delete library[i].nodes; 
                changed = true;
            }
            
            if (library[i].coverBase64 && library[i].coverBase64.length > 50) {
                await localforage.setItem('cover_' + library[i].id, library[i].coverBase64);
                delete library[i].coverBase64; 
                changed = true;
            }
            
            if(changed) needsMigration = true;
        }

        if (needsMigration) {
            await localforage.setItem('pdf_epub_master', library);
            console.log("Database Node & Cover dipisah.");
        }

        renderLibrary(); 
    } catch (e) { console.error(e); } 
}

function renderLibrary(filterText = "") {
    if(!DOM.grid || !DOM.topSlider) return;
    
    // Clear penampung dynamic grids
    if(DOM.scrollGrid) DOM.scrollGrid.innerHTML = '';
    if(DOM.canvasGrid) DOM.canvasGrid.innerHTML = '';
    if(DOM.grid) DOM.grid.innerHTML = ''; 
    if(DOM.topSlider) DOM.topSlider.innerHTML = '';
    
    const pinnedGrid = document.getElementById('pinned-book-grid');
    if(pinnedGrid) pinnedGrid.innerHTML = '';
    
    let filteredLib = library;
    if(filterText) filteredLib = library.filter(b => b.title.toLowerCase().includes(filterText.toLowerCase()));
    
    const d = i18n[wikiLang] || i18n['id'];
    if(DOM.count) DOM.count.textContent = `${filteredLib.length} ${d.booksCount}`;
    
    const pinnedBooks = filteredLib.filter(b => b.isPinned);
    const regularBooks = filteredLib.filter(b => !b.isPinned);

    let topBooks = [];
    if (!filterText) { topBooks = library.filter(b => b.progressPct > 0).sort((a,b) => b.progressPct - a.progressPct).slice(0, 4); }
    if (topBooks.length > 0) {
        DOM.topSection.classList.remove('hidden');
        topBooks.forEach((book, idx) => { DOM.topSlider.appendChild(createBookCard(book, true, idx)); });
        const spacer = document.createElement('div'); spacer.className = "w-2 shrink-0 snap-align-none"; DOM.topSlider.appendChild(spacer);
    } else { DOM.topSection.classList.add('hidden'); }
    
    const pinnedSection = document.getElementById('pinned-books-section');
    if (pinnedBooks.length > 0) {
        if(pinnedSection) pinnedSection.classList.remove('hidden');
        pinnedBooks.forEach((book, idx) => { if(pinnedGrid) pinnedGrid.appendChild(createBookCard(book, false, idx)); });
    } else {
        if(pinnedSection) pinnedSection.classList.add('hidden');
    }

    // Pilah Regular Books menjadi 2 Rak: Scroll Mode & Canvas Mode
    const scrollBooks = regularBooks.filter(b => b.pdfMode !== 'canvas');
    const canvasBooks = regularBooks.filter(b => b.pdfMode === 'canvas');

    if (scrollBooks.length === 0) {
        if(DOM.scrollSection) DOM.scrollSection.classList.add('hidden');
    } else {
        if(DOM.scrollSection) DOM.scrollSection.classList.remove('hidden');
        scrollBooks.forEach((book, index) => { if(DOM.scrollGrid) DOM.scrollGrid.appendChild(createBookCard(book, false, index)); });
    }

    if (canvasBooks.length === 0) {
        if(DOM.canvasSection) DOM.canvasSection.classList.add('hidden');
    } else {
        if(DOM.canvasSection) DOM.canvasSection.classList.remove('hidden');
        canvasBooks.forEach((book, index) => { if(DOM.canvasGrid) DOM.canvasGrid.appendChild(createBookCard(book, false, index + 100)); });
    }

    // Sembunyikan state kosong jika ada buku di rak mana pun
    if (regularBooks.length === 0 && pinnedBooks.length === 0) { 
        DOM.empty.classList.remove('hidden');
    } else {
        DOM.empty.classList.add('hidden');
    }

    updateStatistics(); 
    if(window.lucide) window.lucide.createIcons();
    window.updateBatchSelectionUI();
}

function createBookCard(book, isSlider = false, index = 0) {
    const progress = book.progressPct || 0; 
    const card = document.createElement('div');
    
    let shapeClass = book.shape === 'rounded' ? 'rounded-[24px]' : (book.shape === 'square' ? 'rounded-xl' : (index % 2 === 0 ? 'rounded-tl-[32px] rounded-br-[32px] rounded-tr-lg rounded-bl-lg' : 'rounded-tr-[32px] rounded-bl-[32px] rounded-tl-lg rounded-br-lg'));

    const colors = [
        'bg-m3-primaryContainer text-m3-onPrimaryContainer', 
        'bg-m3-secondaryContainer text-m3-onSecondaryContainer', 
        'bg-m3-tertiaryContainer text-m3-onTertiaryContainer',
        'bg-m3-surfaceVariant text-m3-onSurfaceVariant'
    ];
    let baseClass = colors[index % colors.length];
    const dimensionClass = isSlider ? "w-64 h-40 shrink-0 snap-start" : "aspect-[3/4.5] w-full shadow-md hover:shadow-xl transition-shadow";

    card.className = `${baseClass} ${shapeClass} ${dimensionClass} p-4 relative cursor-pointer card-morph flex flex-col justify-between overflow-hidden border-none outline-none ring-0`;

    let batchOverlayHTML = !isSlider ? `
        <div class="batch-overlay absolute inset-0 z-20 transition-all duration-300 pointer-events-none rounded-inherit" data-book-id="${book.id}" style="display: none; opacity: 0; background-color: transparent;">
            <div class="batch-icon-box absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors"></div>
        </div>
    ` : '';

    // Badge: PDF ya PDF saja, tidak perlu label mode
    const d = i18n[wikiLang] || i18n['id'];
    let badgeText = book.type.toUpperCase();
    if (book.type === 'pdf') badgeText = 'PDF';

    card.innerHTML = `
        ${batchOverlayHTML}
        <div class="absolute inset-x-0 bottom-0 h-[80%] bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-0 rounded-b-inherit border-none outline-none hidden" id="overlay-${book.id}"></div>
        
        <div class="relative z-10 flex flex-col h-full justify-between pointer-events-none border-none">
            <div class="flex ${isSlider ? 'justify-between items-start' : 'justify-between items-center gap-1'} w-full drop-shadow-md" id="top-icons-${book.id}">
                <span class="book-badge inline-block text-[0.55rem] font-black px-2 py-0.5 bg-black/40 rounded-full text-white uppercase tracking-wider">${badgeText}</span>
                ${book.isPinned ? `<i data-lucide="pin" class="w-3.5 h-3.5 opacity-90 fill-current text-white"></i>` : ''}
            </div>
            <div class="mt-auto flex flex-col border-none">
                ${!isSlider ? `<i data-lucide="book" class="w-6 h-6 mb-2 opacity-80" id="book-icon-${book.id}"></i>` : ''}
                <h3 class="font-bold ${isSlider ? 'text-sm line-clamp-2' : 'text-sm mt-1 line-clamp-3'} leading-tight drop-shadow-md" id="title-${book.id}">${book.title}</h3>
                <div class="w-full ${isSlider ? 'mt-2' : 'mt-2'} border-none">
                    <div class="flex justify-between text-[${isSlider ? '0.65rem' : '0.6rem'}] font-bold opacity-90 mb-1" id="pct-${book.id}"><span>${progress}%</span></div>
                    <div class="h-1.5 w-full bg-black/20 dark:bg-white/20 rounded-full overflow-hidden border-none">
                        <div class="h-full bg-m3-primary dark:bg-m3-primaryContainer rounded-full border-none" style="width: ${progress}%" id="bar-${book.id}"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    localforage.getItem('cover_' + book.id).then(coverData => {
        if (coverData && coverData.length > 50) {
            card.style.backgroundImage = `url('${coverData}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'top center';
            
            card.classList.remove(...baseClass.split(' '));
            card.classList.add('text-white', 'shadow-lg');
            
            const overlay = document.getElementById(`overlay-${book.id}`);
            if(overlay) overlay.classList.remove('hidden');
            
            ['title-', 'top-icons-', 'pct-'].forEach(prefix => {
                const el = document.getElementById(prefix + book.id);
                if(el) el.classList.add('text-white');
            });
            
            const bar = document.getElementById(`bar-${book.id}`);
            if(bar) { bar.classList.remove('bg-m3-primary', 'dark:bg-m3-primaryContainer'); bar.classList.add('bg-white'); }
            
            const icon = document.getElementById(`book-icon-${book.id}`);
            if(icon) icon.classList.add('hidden');
        }
    });

    let pressTimer = null; let isPressing = false; let hasLongPressed = false;
    const handleStart = (e) => {
        if (isBatchDeleteMode) return;
        isPressing = true; hasLongPressed = false;
        pressTimer = setTimeout(() => { if (isPressing) { hasLongPressed = true; window.openBookOptions(book.id); } }, 400);
    };
    const handleEnd = () => { isPressing = false; clearTimeout(pressTimer); };
    const handleMove = () => { isPressing = false; clearTimeout(pressTimer); };

    card.addEventListener('mousedown', handleStart); card.addEventListener('touchstart', handleStart, {passive: true});
    card.addEventListener('mouseup', handleEnd); card.addEventListener('touchend', handleEnd);
    card.addEventListener('mouseleave', handleMove); card.addEventListener('touchmove', handleMove, {passive: true});
    
    card.addEventListener('click', (e) => { 
        if (hasLongPressed) { e.preventDefault(); e.stopPropagation(); return; } 
        if (isBatchDeleteMode && !isSlider) {
            e.preventDefault(); e.stopPropagation();
            const strId = String(book.id);
            const idx = selectedForDelete.findIndex(id => String(id) === strId);
            if (idx > -1) {
                selectedForDelete.splice(idx, 1);
            } else {
                selectedForDelete.push(strId);
            }
            window.updateBatchSelectionUI();
            return;
        }
        window.openBook(book); 
    });

    return card;
}

window.openBookOptions = function(id) {
    activeOptsId = id; const book = library.find(b => b.id === id);
    document.getElementById('opt-title').textContent = book.title;

    const d = i18n[wikiLang] || i18n['id'];
    const pinIcon = document.getElementById('icon-opt-pin');
    const pinText = document.getElementById('str-opt-pin');

    if(book.isPinned) {
        pinText.textContent = d.optUnpin || 'Lepas Sematan';
        pinIcon.setAttribute('data-lucide', 'pin-off');
    } else {
        pinText.textContent = d.optPin || 'Sematkan Buku';
        pinIcon.setAttribute('data-lucide', 'pin');
    }

    if(window.lucide) window.lucide.createIcons();
    openModal('b-opt-modal', 'b-opt-sheet', false); 
}

window.togglePinBook = async function() {
    if(!activeOptsId) return;
    const bookIndex = library.findIndex(b => b.id === activeOptsId);
    if(bookIndex > -1) {
        library[bookIndex].isPinned = !library[bookIndex].isPinned;
        await localforage.setItem('pdf_epub_master', library);
        history.back(); 
        setTimeout(() => renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : ""), 300);
    }
}

window.triggerSelectMode = function() {
    if(!activeOptsId) return;
    const targetId = activeOptsId;
    history.back(); 
    setTimeout(() => { window.toggleBatchDelete(false, targetId); }, 350); 
}

window.toggleBatchDelete = function(isFromHistory = false, initialSelectId = null) {
    if(library.length === 0 && !isBatchDeleteMode) return;
    isBatchDeleteMode = !isBatchDeleteMode;
    
    if (!isBatchDeleteMode) { selectedForDelete = []; } 
    else {
        selectedForDelete = [];
        if (initialSelectId) selectedForDelete.push(String(initialSelectId));
    }
    
    const bar = document.getElementById('batch-delete-bar');
    const fab = document.getElementById('fab-container');
    
    if (isBatchDeleteMode) {
        if(!isFromHistory) pushAppHistory('batch-delete');
        bar.classList.remove('translate-y-32');
        fab.classList.add('translate-y-32', 'opacity-0');
    } else {
        if(!isFromHistory && window.location.hash === '#batch-delete') history.back();
        bar.classList.add('translate-y-32');
        fab.classList.remove('translate-y-32', 'opacity-0');
    }
    
    window.updateBatchSelectionUI();
};

window.updateBatchSelectionUI = function() {
    const countEl = document.getElementById('batch-delete-count');
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    if(countEl) countEl.textContent = `${selectedForDelete.length} ${d.selected || 'Selected'}`;

    document.querySelectorAll('.batch-overlay').forEach(el => {
        const id = String(el.dataset.bookId);
        const idx = selectedForDelete.findIndex(selId => String(selId) === id);
        const icBox = el.querySelector('.batch-icon-box');
        
        if (isBatchDeleteMode) {
            el.style.display = 'block';
            if (idx > -1) {
                el.style.opacity = '1';
                el.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                icBox.className = 'batch-icon-box absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-m3-primary text-m3-onPrimary font-bold text-xs shadow-md border-none';
                icBox.innerHTML = (idx + 1);
            } else {
                el.style.opacity = '1';
                el.style.backgroundColor = 'transparent';
                icBox.className = 'batch-icon-box absolute top-3 left-3 w-7 h-7 rounded-full border-2 border-white/50 flex items-center justify-center transition-colors bg-black/20 shadow-sm font-bold text-xs text-transparent';
                icBox.innerHTML = '';
            }
        } else {
            el.style.opacity = '0';
            setTimeout(() => el.style.display = 'none', 300);
        }
    });
};

window.executeBatchDelete = async function() {
    if(selectedForDelete.length === 0) return;
    const d = i18n[wikiLang] || i18n['id'];
    
    showDialog("Hapus Buku", d.deleteConfirm, "trash-2", [
        { text: "Batal", primary: false },
        { text: "Hapus", primary: true, action: async () => {
            window.closeDialog();
            const toDeleteSet = new Set(selectedForDelete.map(String));
            
            for(let id of selectedForDelete) {
                await localforage.removeItem('content_' + id);
                await localforage.removeItem('rawpdf_' + id);
                await localforage.removeItem('cover_' + id);
            }

            library = library.filter(b => !toDeleteSet.has(String(b.id)));
            await localforage.setItem('pdf_epub_master', library);
            window.toggleBatchDelete(); 
            renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : ""); 
        }}
    ]);
};

window.triggerDeleteView = async function() {
    if(!activeOptsId) return;
    const d = i18n[wikiLang] || i18n['id'];
    showDialog("Hapus Permanen", d.deleteConfirm, "trash-2", [
        { text: "Batal", primary: false },
        { text: "Hapus", primary: true, action: async () => {
            window.closeDialog();
            
            await localforage.removeItem('content_' + activeOptsId);
            await localforage.removeItem('rawpdf_' + activeOptsId);
            await localforage.removeItem('cover_' + activeOptsId);

            library = library.filter(b => !selectedForDelete.includes(b.id) && b.id !== activeOptsId); 
            await localforage.setItem('pdf_epub_master', library); 
            history.back(); setTimeout(() => renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : ""), 350);
        }}
    ]);
};

window.triggerEditView = function() {
    if(!activeOptsId) return;
    const book = library.find(b => b.id === activeOptsId);
    document.getElementById('edit-book-id').value = activeOptsId; 
    document.getElementById('edit-book-title').value = book.title; 
    document.getElementById('edit-book-cover').value = '';
    
    window.selectShape(book.shape || 'square');
    history.back(); setTimeout(() => { openModal('edit-modal', 'edit-sheet', true); }, 400); 
}

window.selectShape = function(shape) {
    document.getElementById('edit-book-shape').value = shape;
    const btns = document.querySelectorAll('#edit-sheet .btn-morph');
    btns.forEach(b => {
        if(b.id && b.id.startsWith('shape-')) {
            b.classList.remove('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
            b.classList.add('bg-m3-surfaceVariant', 'text-m3-onSurfaceVariant');
        }
    });
    const sel = document.getElementById('shape-' + shape);
    if(sel) {
        sel.classList.remove('bg-m3-surfaceVariant', 'text-m3-onSurfaceVariant');
        sel.classList.add('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
    }
}

window.closeEditModal = function() { history.back(); }

window.saveBookEdit = async function() {
    const id = document.getElementById('edit-book-id').value; 
    const newTitle = document.getElementById('edit-book-title').value; 
    const coverFile = document.getElementById('edit-book-cover').files[0];
    const newShape = document.getElementById('edit-book-shape').value;
    const bookIndex = library.findIndex(b => b.id === id);
    
    if(bookIndex > -1) {
        library[bookIndex].title = newTitle; library[bookIndex].shape = newShape;
        if (coverFile) { 
            const reader = new FileReader(); 
            reader.onload = async function(e) { 
                await localforage.setItem('cover_' + id, e.target.result);
                await localforage.setItem('pdf_epub_master', library); 
                history.back(); renderLibrary(); 
            }; 
            reader.readAsDataURL(coverFile); 
        } else { await localforage.setItem('pdf_epub_master', library); history.back(); renderLibrary(); }
    }
}

// 9. TEMA & TIPOGRAFI
function applyThemeToDOM() {
    document.documentElement.classList.toggle('dark', isDark);
    
    if(typeof M3_PALETTES !== 'undefined') {
        let rootVars = M3_PALETTES[currentThemeKey][isDark ? 'dark' : 'light'];
        if (isDark && isAmoled) {
            rootVars += `--md-sys-color-background:#000000;--md-sys-color-surface:#000000;`;
        }
        const dynamicTheme = document.getElementById('dynamic-theme');
        if(dynamicTheme) dynamicTheme.innerHTML = `:root { ${rootVars} }`;
    }
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if(metaTheme) {
        if(isDark && isAmoled) metaTheme.setAttribute("content", "#000000");
        else if (isDark) metaTheme.setAttribute("content", "#0B0314");
        else metaTheme.setAttribute("content", "#FAF5FF");
    }

    const bg = document.getElementById('theme-switch-bg');
    const knob = document.getElementById('theme-switch-knob');
    const icon = document.getElementById('theme-switch-icon');
    const dLabel = document.getElementById('theme-label-text');
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    
    if (bg && knob && icon && dLabel) {
        dLabel.textContent = isDark ? d.themeDark : d.themeLight;
        if (isDark) {
            bg.classList.replace('bg-m3-onSurfaceVariant/20', 'bg-m3-primary');
            knob.classList.add('translate-x-[32px]');
            icon.setAttribute('data-lucide', 'moon');
            icon.classList.replace('text-m3-onSurface', 'text-m3-primary');
        } else {
            bg.classList.replace('bg-m3-primary', 'bg-m3-onSurfaceVariant/20');
            knob.classList.remove('translate-x-[32px]');
            icon.setAttribute('data-lucide', 'sun');
            icon.classList.replace('text-m3-primary', 'text-m3-onSurface');
        }
    }

    const amoContainer = document.getElementById('amoled-toggle-container');
    const amoBg = document.getElementById('amoled-switch-bg');
    const amoKnob = document.getElementById('amoled-switch-knob');
    if (isDark) {
        if (amoContainer) amoContainer.classList.remove('hidden');
        if (isAmoled && amoBg && amoKnob) {
            amoBg.classList.add('bg-m3-primary');
            amoKnob.classList.add('translate-x-[32px]');
            amoKnob.classList.replace('bg-m3-onSurface', 'bg-m3-onPrimary');
        } else if (amoBg && amoKnob) {
            amoBg.classList.remove('bg-m3-primary');
            amoKnob.classList.remove('translate-x-[32px]');
            amoKnob.classList.replace('bg-m3-onPrimary', 'bg-m3-onSurface');
        }
    } else {
        if (amoContainer) amoContainer.classList.add('hidden');
    }

    const tl = document.getElementById('theme-btn-light');
    const td = document.getElementById('theme-btn-dark');
    const ta = document.getElementById('theme-btn-amoled');
    if (tl && td && ta) {
        [tl, td, ta].forEach(el => {
            el.classList.remove('bg-m3-primary', 'text-m3-onPrimary');
            el.classList.add('text-m3-onSurfaceVariant');
        });
        if (!isDark) { tl.classList.add('bg-m3-primary', 'text-m3-onPrimary'); tl.classList.remove('text-m3-onSurfaceVariant'); }
        else if (isDark && !isAmoled) { td.classList.add('bg-m3-primary', 'text-m3-onPrimary'); td.classList.remove('text-m3-onSurfaceVariant'); }
        else if (isDark && isAmoled) { ta.classList.add('bg-m3-primary', 'text-m3-onPrimary'); ta.classList.remove('text-m3-onSurfaceVariant'); }
        
        // Grey out AMOLED button saat light mode — AMOLED butuh dark mode
        if (!isDark) {
            ta.classList.add('amoled-unavailable');
        } else {
            ta.classList.remove('amoled-unavailable');
        }
    }

    if(window.lucide) window.lucide.createIcons();
    localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
    localStorage.setItem('m3-key', currentThemeKey);
    localStorage.setItem('amoled', isAmoled);

    // Canvas AMOLED: background kertas jadi hitam pekat, teks jadi putih
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) {
        if (isDark && isAmoled) {
            canvasWrapper.style.backgroundColor = '#000000';
            canvasWrapper.style.filter = 'invert(1) hue-rotate(180deg)';
        } else {
            canvasWrapper.style.backgroundColor = '';
            canvasWrapper.style.filter = '';
        }
    }
}

window.setTheme = function(key) { currentThemeKey = key; applyThemeToDOM(); };
window.toggleThemeState = function() { isDark = !isDark; applyThemeToDOM(); };
window.toggleAmoled = function() { isAmoled = !isAmoled; applyThemeToDOM(); };

// ── Global Loading Spinner (untuk jeda antar modal / proses berat) ──
window.showGlobalLoading = function(text) {
    const d    = i18n[wikiLang] || i18n['id'];
    const overlay = document.getElementById('global-loading-overlay');
    const txt  = document.getElementById('global-loading-text');
    if (!overlay) return;
    if (txt) txt.textContent = text || d.loadingDocs || 'Memproses...';
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
};

window.hideGlobalLoading = function() {
    const overlay = document.getElementById('global-loading-overlay');
    if (!overlay) return;
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 220);
};

// Fitur Baru v25: Sembunyikan Judul di Rak Buku
window.toggleHideTitles = function() {
    isTitlesHidden = !isTitlesHidden;
    localStorage.setItem('hide_book_titles', isTitlesHidden.toString());
    
    if (isTitlesHidden) {
        document.body.classList.add('hide-book-titles');
    } else {
        document.body.classList.remove('hide-book-titles');
    }
    
    // Sync toggle UI
    _syncHideTitlesUI();
    renderLibrary(DOM.globalSearch ? DOM.globalSearch.value : '');
};

function _syncHideTitlesUI() {
    const bg   = document.getElementById('hide-titles-switch-bg');
    const knob = document.getElementById('hide-titles-switch-knob');
    if (!bg || !knob) return;
    if (isTitlesHidden) {
        bg.classList.add('bg-m3-primary');
        bg.classList.remove('bg-m3-onSurfaceVariant/20');
        knob.style.transform = 'translateX(32px)';
    } else {
        bg.classList.remove('bg-m3-primary');
        bg.classList.add('bg-m3-onSurfaceVariant/20');
        knob.style.transform = 'translateX(0)';
    }
}

window.setReaderTheme = function(mode) {
    if (mode === 'light') { isDark = false; isAmoled = false; }
    else if (mode === 'dark') { isDark = true; isAmoled = false; }
    else if (mode === 'amoled') { 
        // AMOLED hanya bisa aktif saat dark mode — paksa dark dulu
        isDark = true; 
        isAmoled = true; 
    }
    applyThemeToDOM();
};

let typoPrefs = JSON.parse(localStorage.getItem('typo_prefs')) || { size: '1.2rem', align: 'left', font: 'Lora' };
function applyTypo() {
    document.documentElement.style.setProperty('--reader-size', typoPrefs.size);
    document.documentElement.style.setProperty('--reader-align', typoPrefs.align);
    
    let fontCss = 'serif';
    if(typoPrefs.font === 'Merriweather') fontCss = "'Merriweather', serif";
    else if(typoPrefs.font === 'Playfair Display') fontCss = "'Playfair Display', serif";
    else if(typoPrefs.font === 'Space Mono') fontCss = "'Space Mono', monospace";
    else if(typoPrefs.font === 'Inter') fontCss = "'Inter', sans-serif";
    else if(typoPrefs.font === 'Google Sans Flex') fontCss = "'Google Sans Flex', sans-serif";
    else fontCss = "'Lora', serif";

    document.documentElement.style.setProperty('--reader-font', fontCss);
    localStorage.setItem('typo_prefs', JSON.stringify(typoPrefs)); syncTypoUI();
}
function syncTypoUI() {
    const maps = { size: { '1rem': 'typo-sz-sm', '1.2rem': 'typo-sz-md', '1.5rem': 'typo-sz-lg' }, align: { 'left': 'typo-al-left', 'center': 'typo-al-center', 'justify': 'typo-al-justify' }, font: { 'Lora': 'typo-fn-lora','Merriweather':'typo-fn-merri','Playfair Display':'typo-fn-playfair', 'Inter': 'typo-fn-inter', 'Space Mono': 'typo-fn-mono', 'Google Sans Flex': 'typo-fn-google' } };
    
    Object.values(maps.size).forEach(id => { const el = document.getElementById(id); if(el){ el.classList.remove('bg-m3-primary', 'text-m3-onPrimary'); el.classList.add('text-m3-onSurfaceVariant'); }});
    Object.values(maps.align).forEach(id => { const el = document.getElementById(id); if(el){ el.classList.remove('bg-m3-primary', 'text-m3-onPrimary'); el.classList.add('text-m3-onSurfaceVariant'); }});
    Object.values(maps.font).forEach(id => { const el = document.getElementById(id); if(el){ el.classList.remove('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer'); }});
    
    if(document.getElementById(maps.size[typoPrefs.size])) {
        document.getElementById(maps.size[typoPrefs.size]).classList.add('bg-m3-primary', 'text-m3-onPrimary');
        document.getElementById(maps.size[typoPrefs.size]).classList.remove('text-m3-onSurfaceVariant');
    }
    if(document.getElementById(maps.align[typoPrefs.align])) {
        document.getElementById(maps.align[typoPrefs.align]).classList.add('bg-m3-primary', 'text-m3-onPrimary');
        document.getElementById(maps.align[typoPrefs.align]).classList.remove('text-m3-onSurfaceVariant');
    }
    if(document.getElementById(maps.font[typoPrefs.font])) {
        document.getElementById(maps.font[typoPrefs.font]).classList.add('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer');
    }
}
window.changeTypo = function(type, value) { typoPrefs[type] = value; applyTypo(); }


// 10. READER INTERACTIONS
window.openBook = async function(book) {
    activeBookId = book.id; pushAppHistory(`reader-${book.id}`);
    DOM.libView.style.transform = 'scale(0.95)'; DOM.readView.classList.remove('translate-y-full');
    DOM.title.textContent = book.title; 
    
    const loader = document.getElementById('reader-loading-overlay');
    loader.classList.remove('hidden'); requestAnimationFrame(() => loader.classList.remove('opacity-0'));
    
    DOM.inner.innerHTML = ''; DOM.tocList.innerHTML = '';
    if (observer) observer.disconnect();

    DOM.progBar.style.width = `${book.progressPct || 0}%`; DOM.progTxt.textContent = `${book.progressPct || 0}%`;

    // Ambil preferensi bahasa untuk menu disabled warning
    const currentBook = library.find(b => b.id === book.id);
    const isCanvas = currentBook && currentBook.pdfMode === 'canvas';

    // Tampilkan/sembunyikan TOC canvas warning
    const tocCanvasWarn = document.getElementById('toc-canvas-warning');
    if (tocCanvasWarn) tocCanvasWarn.classList.toggle('hidden', !isCanvas);
    // Terjemahan
    const tocWarnStr = document.getElementById('str-toc-canvas-warning');
    if (tocWarnStr) {
        const dNow = i18n[wikiLang] || i18n['id'];
        tocWarnStr.textContent = dNow.tocCanvasWarning || 'Untuk mode canvas, daftar isi tidak tersedia.';
    }

    // Tampilkan capsule page controller hanya di canvas mode
    const canvasCtrl = document.getElementById('canvas-page-controller');

    // Kelola visibilitas viewport pembaca secara dinamis (Scroll vs Canvas)
    if (isCanvas) {
        DOM.readContent.classList.add('hidden');
        if (DOM.canvasContainer) DOM.canvasContainer.classList.remove('hidden');
        if (DOM.canvasWarning) DOM.canvasWarning.classList.remove('hidden');
        if (canvasCtrl) canvasCtrl.classList.remove('hidden');

        // Terapkan AMOLED ke canvas wrapper jika aktif
        applyThemeToDOM();

        // Redupkan grup setting tipografi & AI secara halus
        ['size', 'align', 'font', 'search'].forEach(grp => {
            const el = document.getElementById('setting-group-' + grp);
            if (el) el.classList.add('ui-disabled-group');
        });

        // Load PDF murni & render
        try {
            const rawPdfBlob = await localforage.getItem('rawpdf_' + book.id);
            if (!rawPdfBlob) throw new Error("File PDF asli rusak atau hilang.");

            const pdfDataUrl = URL.createObjectURL(rawPdfBlob);
            currentPdfDoc = await pdfjsLib.getDocument({ url: pdfDataUrl }).promise;
            
            currentCanvasPage = parseInt(book.lastReadId) || 1;
            currentCanvasScale = 1.0;
            if (DOM.canvasPageTotal) DOM.canvasPageTotal.textContent = currentPdfDoc.numPages;

            // Inisialisasi gesture DULU
            initCanvasGestures();
            // Baru render
            await renderCanvasPage(currentCanvasPage);
        } catch (err) {
            console.error(err);
            showDialog("Error", "Gagal memuat Canvas PDF: " + err.message, "alert-circle", [{ text: "Tutup", primary: true }]);
        } finally {
            loader.classList.add('opacity-0'); 
            setTimeout(() => loader.classList.add('hidden'), 300);
        }

    } else {
        DOM.readContent.classList.remove('hidden');
        if (DOM.canvasContainer) DOM.canvasContainer.classList.add('hidden');
        if (DOM.canvasWarning) DOM.canvasWarning.classList.add('hidden');
        if (canvasCtrl) canvasCtrl.classList.add('hidden');

        // Kembalikan visibilitas grup setting secara utuh
        ['size', 'align', 'font', 'search'].forEach(grp => {
            const el = document.getElementById('setting-group-' + grp);
            if (el) el.classList.remove('ui-disabled-group');
        });

        // Fetch nodes dari storage independen
        if (!book.nodes) {
            const savedNodes = await localforage.getItem('content_' + book.id);
            if(savedNodes) {
                book.nodes = savedNodes;
            } else {
                book.nodes = [{tag: 'p', text: 'Error: Konten teks gagal dimuat atau korup.'}];
            }
        }

        setTimeout(() => {
            let hCounter = 0; const fragment = document.createDocumentFragment(); let currentHeadingId = null;

            book.nodes.forEach((node, i) => {
                let el; const annots = (book.annotations || []).filter(a => a.nodeIdx === i);

                if (node.tag === 'img') {
                    el = document.createElement('img'); el.src = node.src; el.id = `node-${i}`;
                    el.className = "w-full max-w-lg mx-auto rounded-2xl my-8 object-contain shadow-sm"; el.loading = "lazy";
                } else {
                    el = document.createElement(node.tag); 
                    el.innerHTML = window.renderNodeText ? window.renderNodeText(node.text, annots) : node.text; 
                    el.id = `node-${i}`;
                    if (node.tag === 'h1' || node.tag === 'h2') {
                        hCounter++; currentHeadingId = el.id; 
                        el.className = node.tag === 'h1' ? "text-3xl font-bold tracking-tight mt-12 mb-6 text-m3-primary leading-snug break-words" : "text-xl font-bold mt-10 mb-4 text-m3-onSurfaceVariant border-b border-m3-surfaceVariant pb-2 break-words";
                        const tocItem = document.createElement('button'); tocItem.id = `toc-btn-${el.id}`;
                        tocItem.className = `text-left text-sm p-3 rounded-2xl hover:bg-m3-surface transition-all duration-300 ${node.tag==='h1'?'font-bold text-m3-primary':'ml-4 opacity-80'}`;
                        tocItem.textContent = node.text;
                        tocItem.onclick = () => { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.back(); };
                        DOM.tocList.appendChild(tocItem);
                    } else { el.className = "text-m3-onSurface opacity-90 mb-5 tracking-wide"; }
                }
                el.dataset.headingId = currentHeadingId; fragment.appendChild(el);
            });
            DOM.inner.appendChild(fragment);
            
            if(hCounter === 0) DOM.tocList.innerHTML = "<p class='text-sm opacity-50 block p-3'>No Table of Contents.</p>";
            DOM.searchRes.classList.add('hidden'); DOM.searchInput.value = '';

            const header = document.getElementById('reader-floating-header');
            header.classList.remove('-translate-y-[150%]', 'opacity-0');
            header.classList.add('translate-y-0', 'opacity-100');

            renderBookmarkPanel(); 

            requestAnimationFrame(() => {
                if (book.lastReadId) { 
                    const target = document.getElementById(book.lastReadId); 
                    const container = DOM.readContent;
                    if (target && container) {
                        const cRect = container.getBoundingClientRect();
                        const tRect = target.getBoundingClientRect();
                        const offset = tRect.top - cRect.top + container.scrollTop - (cRect.height / 2) + (tRect.height / 2);
                        container.scrollTo({ top: offset, behavior: 'auto' });
                    } 
                } else { 
                    DOM.readContent.scrollTo({ top: 0, behavior: 'auto' }); 
                }
                
                setTimeout(() => {
                    loader.classList.add('opacity-0'); 
                    setTimeout(() => loader.classList.add('hidden'), 300);
                    window.setupIntersectionObserver(); 
                }, 150);
            });

        }, 300); 
    }
}

// --- ENGINE RENDER CANVAS PDF ---
async function renderCanvasPage(pageNum) {
    if (!currentPdfDoc || isRenderingCanvas) return;
    isRenderingCanvas = true;
    try {
        const page       = await currentPdfDoc.getPage(pageNum);
        const vpEl       = document.getElementById('canvas-zoom-viewport');
        const canvas     = document.getElementById('pdf-canvas');
        const wrapper    = document.getElementById('canvas-wrapper');
        if (!canvas || !wrapper || !vpEl) { isRenderingCanvas = false; return; }

        const pixelRatio = window.devicePixelRatio || 1;
        const cW         = vpEl.clientWidth;
        const cH         = vpEl.clientHeight;

        // Fit lebar canvas = lebar container
        const nat     = page.getViewport({ scale: 1 });
        const fit     = page.getViewport({ scale: cW / nat.width });
        const dW      = Math.floor(fit.width);
        const dH      = Math.floor(fit.height);

        canvas.width        = dW * pixelRatio;
        canvas.height       = dH * pixelRatio;
        canvas.style.width  = dW + 'px';
        canvas.style.height = dH + 'px';
        wrapper.style.width  = dW + 'px';
        wrapper.style.height = dH + 'px';

        // Simpan ukuran untuk clamp — tidak perlu offX/offY karena flex yang centering
        wrapper._W  = dW;
        wrapper._H  = dH;
        wrapper._cW = cW;
        wrapper._cH = cH;

        await page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: fit,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0]
        }).promise;

        const lbl = document.getElementById('canvas-page-num');
        if (lbl) lbl.textContent = pageNum;
        const pct = Math.round((pageNum / currentPdfDoc.numPages) * 100);
        if (DOM.progBar) DOM.progBar.style.width = `${pct}%`;
        if (DOM.progTxt) DOM.progTxt.textContent = `${pct}%`;
        updateBookProgress(activeBookId, pageNum, pct);
        renderBookmarkPanel();

    } catch (e) { console.error('renderCanvasPage:', e); }
    finally     { isRenderingCanvas = false; }
}

window.nextCanvasPage = async function() {
    if (!currentPdfDoc || currentCanvasPage >= currentPdfDoc.numPages) return;
    currentCanvasPage++;
    _resetCanvasTransform();
    await renderCanvasPage(currentCanvasPage);
};
window.prevCanvasPage = async function() {
    if (!currentPdfDoc || currentCanvasPage <= 1) return;
    currentCanvasPage--;
    _resetCanvasTransform();
    await renderCanvasPage(currentCanvasPage);
};

function _resetCanvasTransform() {
    currentCanvasScale = 1.0;
    canvasTranslateX   = 0;
    canvasTranslateY   = 0;
    canvasIsPinching   = false;
    const w = document.getElementById('canvas-wrapper');
    if (w) { w.style.transition = 'none'; w.style.transform = 'translate(0px,0px) scale(1)'; }
}

window.showJumpToPageDialog = function() {
    const d     = i18n[wikiLang] || i18n['id'];
    const total = currentPdfDoc ? currentPdfDoc.numPages : 1;
    const pStr  = prompt(`${d.txtPageGo || 'Pergi ke halaman'} (1-${total}):`, currentCanvasPage);
    if (pStr) {
        const p = parseInt(pStr);
        if (p >= 1 && p <= total) { currentCanvasPage = p; _resetCanvasTransform(); renderCanvasPage(p); }
    }
};

// --- GESTURE CANVAS ---
function setupCanvasPinchZoom() { /* stub */ }

function initCanvasGestures() {
    const vp = document.getElementById('canvas-zoom-viewport');
    if (!vp) return;

    // Clone viewport agar listener lama terbuang
    const newVP = vp.cloneNode(false);
    const oldW  = document.getElementById('canvas-wrapper');
    if (oldW) newVP.appendChild(oldW);
    vp.parentNode.replaceChild(newVP, vp);

    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    // transform-origin: center center — di-set dari HTML, pastikan tidak berubah
    wrapper.style.transformOrigin = 'center center';
    wrapper.style.willChange      = 'transform';
    wrapper.style.transition      = 'none';
    _resetCanvasTransform();

    // ── touchstart ──
    newVP.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            canvasIsPinching     = true;
            canvasTouchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            canvasTouchStartScale = currentCanvasScale;

            // Tengah cubit dalam koordinat layar
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            // Posisi wrapper di layar saat ini (setelah transform)
            const rect = wrapper.getBoundingClientRect();

            // Titik cubit dalam koordinat wrapper (pre-scale, dari center)
            // rect.left + rect.width/2 = center wrapper di layar
            wrapper._pinchMidX = midX - (rect.left + rect.width  / 2);
            wrapper._pinchMidY = midY - (rect.top  + rect.height / 2);
            wrapper._pinchTX   = canvasTranslateX;
            wrapper._pinchTY   = canvasTranslateY;

        } else if (e.touches.length === 1) {
            canvasTapStartX    = e.touches[0].clientX;
            canvasTapStartY    = e.touches[0].clientY;
            canvasTapStartTime = Date.now();
            if (currentCanvasScale > 1.01) {
                canvasPanStartX = e.touches[0].clientX - canvasTranslateX;
                canvasPanStartY = e.touches[0].clientY - canvasTranslateY;
            }
        }
    }, { passive: true });

    // ── touchmove ──
    newVP.addEventListener('touchmove', (e) => {
        if (canvasIsPinching && e.touches.length === 2) {
            e.preventDefault();
            const dist     = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const newScale = Math.max(1.0, Math.min(4.0,
                canvasTouchStartScale * (dist / canvasTouchStartDist)
            ));

            if (newScale <= 1.0) {
                currentCanvasScale = 1.0;
                canvasTranslateX   = 0;
                canvasTranslateY   = 0;
            } else {
                // Tengah cubit sekarang di layar
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                // Posisi center wrapper saat scale = newScale
                // Center alami wrapper = rect center saat translate=0, scale=1
                // Dengan translate (TX,TY) dan scale S: center di layar = naturalCenter + TX
                // (karena transform-origin center, translate langsung geser center)
                // Titik cubit di konten (pre-scale) = _pinchMidX / startScale  (offset dari center)
                // Kita mau: midX_screen = centerWrapper_screen + _pinchMidX_content * newScale
                // centerWrapper_screen = naturalCenterX + TX
                // TX = midX - naturalCenterX - _pinchMidX_content * newScale
                
                // naturalCenter dari rect saat start (simpan di touchstart)
                const scaleFactor = newScale / canvasTouchStartScale;
                canvasTranslateX = wrapper._pinchTX + wrapper._pinchMidX * (1 - scaleFactor) + (midX - (e.touches[0].clientX + e.touches[1].clientX) / 2 * 0);
                canvasTranslateY = wrapper._pinchTY + wrapper._pinchMidY * (1 - scaleFactor);

                // Lebih simpel dan proven: rumus standard pinch-zoom
                canvasTranslateX = wrapper._pinchTX - wrapper._pinchMidX * (scaleFactor - 1);
                canvasTranslateY = wrapper._pinchTY - wrapper._pinchMidY * (scaleFactor - 1);
                currentCanvasScale = newScale;
            }
            _applyCanvasTransform(wrapper);

        } else if (e.touches.length === 1 && currentCanvasScale > 1.01) {
            e.preventDefault();
            canvasTranslateX = e.touches[0].clientX - canvasPanStartX;
            canvasTranslateY = e.touches[0].clientY - canvasPanStartY;
            _applyCanvasTransform(wrapper);
        }
    }, { passive: false });

    // ── touchend ──
    newVP.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) canvasIsPinching = false;
        if (e.touches.length === 0) {
            if (currentCanvasScale <= 1.01) {
                currentCanvasScale = 1.0;
                canvasTranslateX   = 0;
                canvasTranslateY   = 0;
                wrapper.style.transition = 'transform 0.18s ease';
                _applyCanvasTransform(wrapper);
                setTimeout(() => { wrapper.style.transition = 'none'; }, 200);

                const dt   = Date.now() - canvasTapStartTime;
                const ex   = e.changedTouches[0].clientX;
                const ey   = e.changedTouches[0].clientY;
                const dist = Math.hypot(ex - canvasTapStartX, ey - canvasTapStartY);
                if (dt < 300 && dist < 15) {
                    const sw = window.innerWidth;
                    if      (ex < sw * 0.30) window.prevCanvasPage();
                    else if (ex > sw * 0.70) window.nextCanvasPage();
                }
            } else {
                _applyCanvasTransform(wrapper);
            }
        }
    }, { passive: true });
}

// Clamp & apply transform. Dengan transform-origin center, translate 0,0 = wrapper di tengah.
// Saat scale S: wrapper melebar ke semua arah. Batas pan = separuh overflow di tiap sisi.
function _applyCanvasTransform(wrapper) {
    if (wrapper._W && currentCanvasScale > 1.01) {
        const extraW = (wrapper._W * currentCanvasScale - wrapper._cW) / 2;
        const extraH = (wrapper._H * currentCanvasScale - wrapper._cH) / 2;
        // extraW/H = seberapa jauh wrapper bisa dipan ke satu arah
        const maxTX  = Math.max(0, extraW);
        const maxTY  = Math.max(0, extraH);
        canvasTranslateX = Math.max(-maxTX, Math.min(maxTX, canvasTranslateX));
        canvasTranslateY = Math.max(-maxTY, Math.min(maxTY, canvasTranslateY));
    }
    wrapper.style.transform = `translate(${canvasTranslateX}px,${canvasTranslateY}px) scale(${currentCanvasScale})`;
}

window._closeReaderAction = function(isFromHistory = false) {
    if (!isFromHistory) { history.back(); return; }
    DOM.readView.classList.add('translate-y-full'); DOM.libView.style.transform = 'scale(1)';
    if(observer) observer.disconnect(); 
    
    // Reset Canvas State (v25: termasuk translate)
    currentPdfDoc = null;
    currentCanvasPage = 1;
    currentCanvasScale = 1.0;
    canvasTranslateX = 0;
    canvasTranslateY = 0;
    canvasIsPinching = false;
    if (DOM.canvasWrapper) DOM.canvasWrapper.style.transform = '';

    if (activeBookId) {
        let bIdx = library.findIndex(b => b.id === activeBookId);
        if (bIdx > -1 && library[bIdx].nodes) {
            delete library[bIdx].nodes;
        }
    }

    renderLibrary(DOM.globalSearch.value); activeBookId = null;
    window.getSelection().removeAllRanges();
    const menu = document.getElementById('selection-menu');
    if(menu) { menu.classList.add('opacity-0', 'scale-75'); setTimeout(() => menu.classList.add('hidden'), 200); }
    updateBottomNavUI(null);
}

if(document.getElementById('btn-back')) {
    document.getElementById('btn-back').addEventListener('click', () => history.back());
}

window._closeSidePanelsAction = function(isFromHistory = false) { 
    if (!isFromHistory) { history.back(); return; }
    if(DOM.tocPanel) DOM.tocPanel.classList.add('translate-x-full', 'opacity-0'); 
    if(DOM.setPanel) DOM.setPanel.classList.add('translate-x-full', 'opacity-0'); 
    if(DOM.bookmarkPanel) DOM.bookmarkPanel.classList.add('translate-x-full', 'opacity-0');
    const overlay = document.getElementById('side-panel-overlay'); if(overlay) overlay.classList.add('hidden');
    activePanel = null;
    updateBottomNavUI(null);
}

window.togglePanel = function(panelEl, name, btnId) { 
    if(activePanel === name) { history.back(); return; } 
    if(activePanel) { 
        _closeSidePanelsAction(true); 
        history.replaceState({ state: `panel-${name}` }, '', `#panel-${name}`); 
    } else { 
        pushAppHistory(`panel-${name}`); 
    }
    panelEl.classList.remove('translate-x-full', 'opacity-0'); 
    const overlay = document.getElementById('side-panel-overlay'); 
    if(overlay) {
        overlay.classList.remove('hidden');
        // Fix 6: Klik di luar side panel (di overlay) untuk nutup panel
        overlay.onclick = (e) => {
            if (e.target === overlay) { history.back(); }
        };
    }
    activePanel = name; 
    updateBottomNavUI(btnId);

    if (name === 'toc' && DOM.tocList) {
        setTimeout(() => {
            const activeTocItem = DOM.tocList.querySelector('.bg-m3-primaryContainer');
            if (activeTocItem) {
                const offset = activeTocItem.offsetTop - (DOM.tocList.clientHeight / 2) + (activeTocItem.clientHeight / 2);
                DOM.tocList.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
            }
        }, 250);
    }
}

if(document.getElementById('btn-toc')) document.getElementById('btn-toc').onclick = () => togglePanel(DOM.tocPanel, 'toc', 'btn-toc'); 
if(document.getElementById('btn-settings')) document.getElementById('btn-settings').onclick = () => togglePanel(DOM.setPanel, 'set', 'btn-settings');

window.toggleFullscreenReading = function(isFromHistory = false) {
    const bottomBar  = document.getElementById('reader-bottom-bar');
    const progContainer = document.getElementById('progress-container');
    const floatHeader   = document.getElementById('reader-floating-header');
    const canvasCtrl    = document.getElementById('canvas-page-controller');
    
    if (bottomBar.classList.contains('hidden')) {
        // Keluar immersive
        if (!isFromHistory && window.location.hash === '#immersive') { history.back(); }
        bottomBar.classList.remove('hidden');
        progContainer.classList.remove('hidden');
        floatHeader.classList.remove('-translate-y-[150%]', 'opacity-0');
        floatHeader.classList.add('translate-y-0', 'opacity-100');
        // Tampilkan kembali capsule canvas jika sedang di canvas mode
        if (canvasCtrl && !document.getElementById('canvas-container').classList.contains('hidden')) {
            canvasCtrl.classList.remove('hidden');
        }
    } else {
        if (!isFromHistory) { pushAppHistory('immersive'); }
        bottomBar.classList.add('hidden');
        floatHeader.classList.add('-translate-y-[150%]', 'opacity-0');
        floatHeader.classList.remove('translate-y-0', 'opacity-100');
        progContainer.classList.add('hidden');
        // Sembunyikan capsule canvas saat immersive
        if (canvasCtrl) canvasCtrl.classList.add('hidden');
        updateBottomNavUI(null);
        if (activePanel) { _closeSidePanelsAction(); }
    }
};

window.setupIntersectionObserver = function() {
    if (observer) observer.disconnect(); const totalNodes = DOM.inner.children.length;
    observer = new IntersectionObserver((entries) => {
        let visibleEntry = entries.find(e => e.isIntersecting);
        if (visibleEntry) {
            const el = visibleEntry.target; const id = el.id; const index = parseInt(id.split('-')[1]);
            const pct = Math.round(((index + 1) / totalNodes) * 100);
            DOM.progBar.style.width = `${pct}%`; DOM.progTxt.textContent = `${pct}%`;

            const activeHeadingId = el.dataset.headingId;
            Array.from(DOM.tocList.children).forEach(btn => { btn.classList.remove('bg-m3-primaryContainer', 'text-m3-onPrimaryContainer', 'font-bold', 'translate-x-2', '!opacity-100', '!text-m3-onPrimaryContainer'); });
            if(activeHeadingId) { 
                const tocActiveBtn = document.getElementById(`toc-btn-${activeHeadingId}`); 
                if (tocActiveBtn) { tocActiveBtn.classList.add('bg-m3-primaryContainer', '!text-m3-onPrimaryContainer', 'font-bold', 'translate-x-2', '!opacity-100'); }
            }
            updateBookProgress(activeBookId, id, pct);
        }
    }, { root: DOM.readContent, rootMargin: '-45% 0px -45% 0px', threshold: 0 }); 
    Array.from(DOM.inner.children).forEach(el => observer.observe(el));
}

let progressSaveTimeout = null;
async function updateBookProgress(bookId, lastNodeId, pct) {
    let bookIndex = library.findIndex(b => b.id === bookId);
    if(bookIndex > -1) { 
        library[bookIndex].lastReadId = String(lastNodeId); library[bookIndex].progressPct = pct; 
        if (progressSaveTimeout) clearTimeout(progressSaveTimeout);
        progressSaveTimeout = setTimeout(() => { localforage.setItem('pdf_epub_master', library); updateStatistics(); }, 1500);
    }
}

// 11. ANNOTATIONS & IN-BOOK BOOKMARK LOGIC

function getAbsoluteOffsets(element) {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return { start: 0, end: 0 };
    const range = sel.getRangeAt(0);
    
    function getTextOffset(node, offset) {
        let len = 0;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while ((n = walker.nextNode())) {
            if (n === node) { len += offset; break; }
            len += n.nodeValue.length;
        }
        return len;
    }

    let start = getTextOffset(range.startContainer, range.startOffset);
    let end = getTextOffset(range.endContainer, range.endOffset);
    
    if (start > end) { let t = start; start = end; end = t; }
    return { start, end };
}

window.renderNodeText = function(text, annots) {
    if (!text) return "";
    let html = text;
    
    if (annots && annots.length > 0) {
        let validAnnots = [...annots].filter(a => typeof a.startOff !== 'undefined').sort((a,b) => b.startOff - a.startOff);
        
        validAnnots.forEach(a => {
            const s = Math.min(a.startOff, html.length);
            const e = Math.min(a.endOff, html.length);
            const before = html.substring(0, s);
            const middle = html.substring(s, e);
            const after = html.substring(e);
            html = before + `|||ST_${a.id}|||` + middle + `|||EN_${a.id}|||` + after;
        });

        let legacyAnnots = [...annots].filter(a => typeof a.startOff === 'undefined').sort((a,b) => b.text.length - a.text.length);
        legacyAnnots.forEach(a => {
            const esc = a.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            html = html.replace(new RegExp(esc, ''), `|||ST_${a.id}|||${a.text}|||EN_${a.id}|||`);
        });
    }

    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/"([^"]+)"/g, '<i class="italic font-serif opacity-90">"$1"</i>');

    if (annots && annots.length > 0) {
        annots.forEach(a => {
            let colorClass = "";
            if(a.color === 'yellow') colorClass = "text-yellow-600 bg-yellow-400/20 dark:text-yellow-400 dark:bg-yellow-400/20";
            else if(a.color === 'green') colorClass = "text-green-600 bg-green-500/20 dark:text-green-400 dark:bg-green-400/20";
            else if(a.color === 'pink') colorClass = "text-pink-600 bg-pink-500/20 dark:text-pink-400 dark:bg-pink-400/20";
            else colorClass = "text-m3-primary bg-m3-primary/10";

            let markHtml = `<mark class="annot-hl ${colorClass} font-medium cursor-pointer transition-all hover:opacity-80 px-1 mx-0.5 rounded-md" data-id="${a.id}" onclick="window.showAnnotationDetails('${a.id}')">`;
            html = html.replace(`|||ST_${a.id}|||`, markHtml).replace(`|||EN_${a.id}|||`, '</mark>');
        });
    }
    return html;
}

let _selChangeDebounce = null;
let _isTouchDragging = false;

document.addEventListener('touchstart', () => { _isTouchDragging = true; }, { passive: true });
document.addEventListener('touchend', () => {
    _isTouchDragging = false;
    if (activeBookId) {
        clearTimeout(_selChangeDebounce);
        _selChangeDebounce = setTimeout(_handleSelectionChange, 80);
    }
}, { passive: true });

function _handleSelectionChange() {
    if(!activeBookId) return;
    
    // Skip deteksi selection jika buku saat ini adalah Canvas Mode
    const book = library.find(b => b.id === activeBookId);
    if(book && book.pdfMode === 'canvas') return;

    const sel = window.getSelection(); const text = sel.toString().trim(); const menu = document.getElementById('selection-menu');

    if (text.length > 0 && sel.rangeCount > 0 && DOM.inner) {
        const range = sel.getRangeAt(0);
        if (!DOM.inner.contains(range.commonAncestorContainer)) return;

        let curr = range.commonAncestorContainer;
        if (curr.nodeType === 3) curr = curr.parentNode;
        const nodeEl = curr.closest('[id^="node-"]'); if (!nodeEl) return;

        const nodeIdx = parseInt(nodeEl.id.split('-')[1]);
        const offsets = getAbsoluteOffsets(nodeEl);
        currentSelection = { text: text, nodeIdx: nodeIdx, startOff: offsets.start, endOff: offsets.end };

        menu.classList.remove('hidden');
        const rect = range.getBoundingClientRect(); const menuWidth = menu.offsetWidth || 220; const padding = 16;
        let targetLeft = rect.left + (rect.width / 2) - (menuWidth / 2);
        if (targetLeft < padding) targetLeft = padding;
        if (targetLeft + menuWidth > window.innerWidth - padding) targetLeft = window.innerWidth - menuWidth - padding;
        let targetTop = rect.top - 55;
        if (targetTop < 80) targetTop = rect.bottom + 15;

        menu.style.top = `${targetTop}px`; menu.style.left = `${targetLeft}px`;
        requestAnimationFrame(() => { menu.classList.remove('opacity-0', 'scale-75'); });
    } else {
        if (!_isTouchDragging) window.hideSelectionMenu();
    }
}

document.addEventListener('selectionchange', () => {
    if(!activeBookId) return;
    clearTimeout(_selChangeDebounce);
    _selChangeDebounce = setTimeout(_handleSelectionChange, _isTouchDragging ? 300 : 50);
});

if(document.getElementById('reader-content')) {
    document.getElementById('reader-content').addEventListener('mousedown', (e) => { 
        const menu = document.getElementById('selection-menu');
        if(menu && !menu.classList.contains('hidden') && menu.contains(e.target)) return;
        if(!window.getSelection().toString().trim()) { window.hideSelectionMenu(); } 
    });
}

window.hideSelectionMenu = function() {
    const menu = document.getElementById('selection-menu');
    if (menu) { menu.classList.add('opacity-0', 'scale-75'); setTimeout(() => menu.classList.add('hidden'), 200); }
}

function showToast(msg) {
    let t = document.getElementById('copy-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'copy-toast';
        t.className = 'fixed bottom-28 left-1/2 -translate-x-1/2 z-[999] px-5 py-2.5 rounded-full bg-m3-onSurface text-m3-surface text-xs font-bold shadow-lg transition-all duration-300 opacity-0';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove('opacity-0');
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.add('opacity-0'), 1500);
}

window.copySelection = function() {
    const text = currentSelection.text;
    if (!text) return;
    window.hideSelectionMenu();
    window.getSelection().removeAllRanges();
    showToast(wikiLang === 'id' ? 'Tersalin!' : 'Copied!');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy');
            document.body.removeChild(ta);
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
    }
}

async function registerAnnotation(annotObj) {
    window.hideSelectionMenu(); const bookIndex = library.findIndex(b => b.id === activeBookId); if(bookIndex === -1) return;
    const book = library[bookIndex]; if(!book.annotations) book.annotations = [];
    book.annotations.push(annotObj); await localforage.setItem('pdf_epub_master', library);
    
    // Hanya render ulang node jika bukan Canvas Mode
    if (book.pdfMode !== 'canvas') {
        const nodeEl = document.getElementById(`node-${annotObj.nodeIdx}`);
        if(nodeEl && book.nodes && book.nodes[annotObj.nodeIdx]) {
            const currentAnnots = book.annotations.filter(a => a.nodeIdx === annotObj.nodeIdx);
            nodeEl.innerHTML = window.renderNodeText(book.nodes[annotObj.nodeIdx].text, currentAnnots);
        }
        window.getSelection().removeAllRanges();
    }

    window.renderBookmarkPanel();
    updateStatistics(); 
}

window.openBookmarkModal = function(color) {
    // Tombol bookmark floating di index.html (tapi di Mode Canvas, bookmark dibuat via panel kanan)
    if(currentSelection.nodeIdx === -1) return;
    
    activeNoteColor = color; 
    editingAnnotId = null; 
    
    document.getElementById('bookmark-input-title').value = '';
    document.getElementById('bookmark-input-text').value = '';
    document.getElementById('btn-delete-bookmark').classList.add('hidden');
    
    openModal('bookmark-modal', 'bookmark-sheet', true);
};

// --- SHORTCUT UNTUK MEMBUAT BOOKMARK HALAMAN PADA CANVAS MODE ---
window.createCanvasPageBookmark = function() {
    const book = library.find(b => b.id === activeBookId);
    if (!book) return;

    activeNoteColor = 'yellow';
    editingAnnotId = null;

    const d = i18n[wikiLang] || i18n['id'];

    // Prefill data bookmark berdasarkan nomor halaman canvas murni
    document.getElementById('bookmark-input-title').value = `${d.pdfPageLabel || 'Hal'} ${currentCanvasPage}`;
    document.getElementById('bookmark-input-text').value = '';
    document.getElementById('btn-delete-bookmark').classList.add('hidden');

    // Paksa set target seleksi ke index halaman murni agar di-save dengan selamat
    currentSelection = {
        text: `${d.pdfPageLabel || 'Hal'} ${currentCanvasPage}`,
        nodeIdx: currentCanvasPage,
        startOff: 0,
        endOff: 0
    };

    openModal('bookmark-modal', 'bookmark-sheet', true);
};

window.saveBookmarkAnnotation = function() {
    const titleVal = document.getElementById('bookmark-input-title').value.trim();
    const noteVal = document.getElementById('bookmark-input-text').value.trim();
    history.back(); 
    
    const book = library.find(b => b.id === activeBookId);
    if (!book) return;

    if(editingAnnotId) {
        const bookIndex = library.findIndex(b => b.id === activeBookId);
        if(bookIndex > -1) {
            const annotIndex = library[bookIndex].annotations.findIndex(a => a.id === editingAnnotId);
            if(annotIndex > -1) {
                library[bookIndex].annotations[annotIndex].title = titleVal;
                library[bookIndex].annotations[annotIndex].note = noteVal;
                localforage.setItem('pdf_epub_master', library).then(() => {
                    window.renderBookmarkPanel();
                });
            }
        }
    } else {
        const d = i18n[wikiLang] || i18n['id'];
        
        if (book.pdfMode === 'canvas') {
            const newAnnot = { 
                id: 'BM_' + Date.now().toString(), 
                nodeIdx: currentCanvasPage, // menyimpan index halaman canvas murni
                startOff: 0, 
                endOff: 0,
                text: `${d.pdfPageLabel || 'Hal'} ${currentCanvasPage}`, 
                color: activeNoteColor, 
                title: titleVal || `${d.pdfPageLabel || 'Hal'} ${currentCanvasPage}`, 
                note: noteVal,
                meta: `${d.pdfPageLabel || 'Hal'} ${currentCanvasPage} / ${book.pages}`
            };
            setTimeout(() => { registerAnnotation(newAnnot); }, 300);
        } else {
            if (!book.nodes) return;
            const totalNodes = book.nodes.length;
            const pct = Math.round(((currentSelection.nodeIdx + 1) / totalNodes) * 100);

            let closestChapterName = wikiLang === 'id' ? "Bagian Buku" : (wikiLang === 'es' ? "Sección del libro" : "Book Section");
            for (let i = currentSelection.nodeIdx; i >= 0; i--) {
                if (book.nodes[i].tag === 'h1' || book.nodes[i].tag === 'h2') {
                    closestChapterName = book.nodes[i].text;
                    break;
                }
            }
            const chapterPreview = closestChapterName.length > 15 ? closestChapterName.substring(0, 15) + '...' : closestChapterName;

            const newAnnot = { 
                id: 'BM_' + Date.now().toString(), 
                nodeIdx: currentSelection.nodeIdx, 
                startOff: currentSelection.startOff, 
                endOff: currentSelection.endOff,
                text: currentSelection.text, 
                color: activeNoteColor, 
                title: titleVal || (wikiLang === 'id' ? "Bookmark Baru" : (wikiLang === 'es' ? "Nuevo Marcador" : "New Bookmark")), 
                note: noteVal,
                meta: `${chapterPreview} — ${pct}%`
            };
            setTimeout(() => { registerAnnotation(newAnnot); }, 300);
        }
    }
};

window.showAnnotationDetails = function(annotId) {
    event.preventDefault(); event.stopPropagation();
    const book = library.find(b => b.id === activeBookId); if(!book || !book.annotations) return;
    const annot = book.annotations.find(a => a.id === annotId); if(!annot) return;
    
    editingAnnotId = annotId;
    currentSelection = { nodeIdx: annot.nodeIdx, text: annot.text };
    
    document.getElementById('bookmark-input-title').value = annot.title || '';
    document.getElementById('bookmark-input-text').value = annot.note || '';
    document.getElementById('btn-delete-bookmark').classList.remove('hidden');
    
    openModal('bookmark-modal', 'bookmark-sheet', true);
};

window.deleteBookmarkInsideModal = function() {
    const d = i18n[wikiLang] || i18n['id'];
    showDialog("Hapus Bookmark", d.deleteNoteConfirm, "trash-2", [
        { text: d.bookmarkCancel || "Batal", primary: false },
        { text: d.delete || "Hapus", primary: true, action: () => {
            window.closeDialog();
            window.deleteAnnotationById(editingAnnotId);
            history.back(); 
        }}
    ]);
}

window.deleteAnnotationById = async function(annotId) {
    if(!annotId || !activeBookId) return; 
    const bookIndex = library.findIndex(b => b.id === activeBookId); if(bookIndex === -1) return;
    const book = library[bookIndex]; 
    const annotIndex = book.annotations.findIndex(a => a.id === annotId); if(annotIndex === -1) return;
    
    const nodeIdx = book.annotations[annotIndex].nodeIdx; 
    book.annotations.splice(annotIndex, 1);
    await localforage.setItem('pdf_epub_master', library);
    
    if (book.pdfMode !== 'canvas') {
        const nodeEl = document.getElementById(`node-${nodeIdx}`);
        if(nodeEl && book.nodes && book.nodes[nodeIdx]) {
            const currentAnnots = book.annotations.filter(a => a.nodeIdx === nodeIdx);
            nodeEl.innerHTML = window.renderNodeText(book.nodes[nodeIdx].text, currentAnnots);
        }
    }

    window.renderBookmarkPanel();
    updateStatistics(); 
};

window.renderBookmarkPanel = function() {
    if(!DOM.bookmarkList || !DOM.bookmarkPanel || !activeBookId) return;
    const book = library.find(b => b.id === activeBookId);
    if (!book) return;

    const searchInput = document.getElementById('bookmark-search-input');
    if (searchInput) searchInput.value = '';

    _renderBookmarkList(book.annotations || []);
};

function _renderBookmarkList(annotations) {
    if(!DOM.bookmarkList) return;
    DOM.bookmarkList.innerHTML = '';
    const emptyState = document.getElementById('bookmark-empty');

    const bookmarks = [...annotations].sort((a,b) => a.nodeIdx - b.nodeIdx);

    const book = library.find(b => b.id === activeBookId);
    const isCanvas = book && book.pdfMode === 'canvas';

    // Jika mode Canvas, tambahkan tombol Pintasan "Tambah Bookmark Halaman Ini" di baris paling atas
    if (isCanvas) {
        const d = i18n[wikiLang] || i18n['id'];
        const quickAddBtn = document.createElement('button');
        quickAddBtn.className = "w-full p-4 mb-4 rounded-3xl bg-m3-primary text-m3-onPrimary font-bold text-xs flex items-center justify-center gap-2 btn-morph shadow-sm sticky top-0 z-10";
        quickAddBtn.innerHTML = `<i data-lucide="plus-circle" class="w-4 h-4"></i> ${d.bookmarkModalTitle || 'Bookmark'} ${d.pdfPageLabel || 'Hal'} ${currentCanvasPage}`;
        quickAddBtn.onclick = () => window.createCanvasPageBookmark();
        DOM.bookmarkList.appendChild(quickAddBtn);
    }

    if(bookmarks.length === 0) {
        if(emptyState) emptyState.classList.remove('hidden');
    } else {
        if(emptyState) emptyState.classList.add('hidden');
        
        bookmarks.forEach(bm => {
            const btn = document.createElement('div');
            btn.className = "group relative flex flex-col p-4 mb-3 rounded-3xl bg-m3-surface shadow-sm overflow-hidden text-left transition-all hover:shadow-md cursor-pointer";
            
            btn.onclick = async () => {
                if (isCanvas) {
                    currentCanvasPage = parseInt(bm.nodeIdx) || 1;
                    await renderCanvasPage(currentCanvasPage);
                } else {
                    const markTarget = document.querySelector(`mark[data-id="${bm.id}"]`);
                    const paragraphTarget = document.getElementById(`node-${bm.nodeIdx}`);
                    const container = DOM.readContent;
                    
                    if (container) {
                        let targetEl = markTarget || paragraphTarget;
                        if (targetEl) {
                            const cRect = container.getBoundingClientRect();
                            const tRect = targetEl.getBoundingClientRect();
                            const offset = tRect.top - cRect.top + container.scrollTop - (cRect.height / 2) + (tRect.height / 2);
                            container.scrollTo({ top: offset, behavior: 'smooth' });
                        }
                    }
                }
                history.back(); 
            };
            
            let iconColorCls = "text-yellow-600 bg-yellow-500/20 dark:text-yellow-400 dark:bg-yellow-400/20";
            let quoteBgCls = "bg-yellow-500/10 text-yellow-800 dark:bg-yellow-400/10 dark:text-yellow-100";
            
            if (bm.color === 'green') { 
                iconColorCls = "text-green-600 bg-green-500/20 dark:text-green-400 dark:bg-green-400/20"; 
                quoteBgCls = "bg-green-500/10 text-green-800 dark:bg-green-400/10 dark:text-green-100";
            }
            else if (bm.color === 'pink') { 
                iconColorCls = "text-pink-600 bg-pink-500/20 dark:text-pink-400 dark:bg-pink-400/20"; 
                quoteBgCls = "bg-pink-500/10 text-pink-800 dark:bg-pink-400/10 dark:text-pink-100";
            }

            let noteHtml = bm.note ? `
                <div class="mt-3 p-3 rounded-2xl bg-m3-surfaceVariant text-m3-onSurfaceVariant font-bold text-xs leading-relaxed">
                    ${bm.note}
                </div>` : '';
            
            let quoteHtml = !isCanvas ? `
                <div class="mt-2 p-3 rounded-2xl ${quoteBgCls}">
                    <span class="text-[11px] font-medium opacity-90 italic line-clamp-2 leading-relaxed">"${bm.text}"</span>
                </div>
            ` : '';
            
            const d_bm = i18n[wikiLang] || i18n['id'];
            let metaText = bm.meta || (wikiLang === 'id' ? 'Bab' : (wikiLang === 'es' ? 'Capítulo' : 'Chapter'));
            if (metaText.length > 15) metaText = metaText.substring(0, 15) + '...';

            btn.innerHTML = `
                <div class="flex items-start justify-between gap-2 mb-2 w-full">
                    <span class="text-sm font-bold text-m3-onSurface leading-tight line-clamp-2 pr-6">${bm.title}</span>
                </div>
                
                <div class="flex items-center gap-1.5 w-max px-2.5 py-1 rounded-lg ${iconColorCls}">
                    <i data-lucide="bookmark" class="w-3 h-3 fill-current"></i>
                    <span class="text-[9px] font-bold uppercase tracking-wider">${metaText}</span>
                </div>
                
                ${noteHtml}
                ${quoteHtml}
            `;

            const delBtn = document.createElement('button');
            delBtn.className = "absolute top-4 right-4 w-7 h-7 rounded-full text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center";
            delBtn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i>`;
            delBtn.onclick = (e) => {
                e.stopPropagation(); 
                window.deleteAnnotationById(bm.id);
            };

            btn.appendChild(delBtn);
            DOM.bookmarkList.appendChild(btn);
        });
        if(window.lucide) window.lucide.createIcons();
    }
}

window.filterBookmarkPanel = function(query) {
    const book = library.find(b => b.id === activeBookId);
    if (!book) return;
    const all = book.annotations || [];
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter(bm => (bm.title || '').toLowerCase().includes(q)) : all;
    _renderBookmarkList(filtered);
};

// 12. SWIPE TO DISMISS LOGIC & SCROLL LOCK
function setupSwipeToDismiss() {
    const sheets = ['global-settings-sheet', 'b-opt-sheet', 'edit-sheet', 'bookmark-sheet', 'raw-backup-sheet', 'raw-restore-sheet', 'welcome-sheet', 'backup-type-sheet', 'pdf-mode-sheet', 'ai-sheet'];
    
    sheets.forEach(sheetId => {
        const sheet = document.getElementById(sheetId);
        if (!sheet) return;
        let touchStartY = 0; let isPulling = false;
        
        sheet.addEventListener('touchstart', (e) => {
            let target = e.target;
            let isScrollableArea = false;
            
            while (target && target !== document.body) {
                const style = window.getComputedStyle(target);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    if (target.scrollTop > 0) {
                        isScrollableArea = true;
                        break;
                    }
                }
                if (target === sheet) break;
                target = target.parentNode;
            }
            
            sheet.dataset.preventSwipe = isScrollableArea ? "true" : "false";
            touchStartY = e.touches[0].clientY; 
            sheet.style.transition = 'none'; 
        }, { passive: true });

        sheet.addEventListener('touchmove', (e) => {
            if (sheet.dataset.preventSwipe === "true") return;
            
            const deltaY = e.touches[0].clientY - touchStartY;
            if (deltaY > 0) { 
                isPulling = true; if(e.cancelable) e.preventDefault(); 
                
                if (sheetId === 'global-settings-sheet' || sheetId === 'b-opt-sheet' || sheetId === 'ai-sheet') {
                    sheet.style.transform = `translateY(${deltaY * 0.5}px)`; 
                } else {
                    sheet.style.transform = `scale(0.75) translateY(${12 + (deltaY * 0.5)}px)`;
                }
            }
        }, { passive: false });

        sheet.addEventListener('touchend', (e) => {
            if (sheet.dataset.preventSwipe === "true") return;
            if (!isPulling) return; isPulling = false;
            
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            sheet.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)';
            
            if (deltaY > 100) { 
                if (sheetId === 'global-settings-sheet' || sheetId === 'b-opt-sheet' || sheetId === 'ai-sheet') {
                    sheet.style.transform = 'translateY(100%)'; 
                } else {
                    sheet.style.transform = 'scale(0.75) translateY(100vh)'; 
                }
                setTimeout(() => { history.back(); setTimeout(() => { sheet.style.transform = ''; }, 100); }, 10);
            } else { 
                sheet.style.transform = ''; 
            }
        });
    });

    const panels = ['toc-panel', 'settings-panel', 'bookmark-panel'];
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if(!panel) return;
        let touchStartX = 0; let touchStartY = 0; let isSwipingPanel = false;
        panel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; panel.style.transition = 'none';
        }, { passive: true });
        panel.addEventListener('touchmove', (e) => {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            if (deltaX > 0 && deltaX > deltaY) { 
                isSwipingPanel = true;
                if(e.cancelable) e.preventDefault();
                panel.style.transform = `translateX(${deltaX}px)`;
            }
        }, { passive: false }); 
        panel.addEventListener('touchend', (e) => {
            if (!isSwipingPanel) return; isSwipingPanel = false;
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            panel.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease';
            if (deltaX > 80) { 
                panel.style.transform = 'translateX(100%)';
                setTimeout(() => { history.back(); setTimeout(() => { panel.style.transform = ''; }, 100); }, 100);
            } else { 
                panel.style.transform = 'translateX(0)';
            }
        });
    });
}

// 13. PWA & CAPACITOR SETUP
if ('serviceWorker' in navigator) {
    const swCode = `
    const CACHE_NAME = 'baca-pwa-v6';
    self.addEventListener('install', (e) => {
        self.skipWaiting();
        e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll([
            '/', 'libs/tailwindcss.js', 'libs/pdf.min.js', 'libs/pdf.worker.min.js', 'libs/localforage.min.js', 'libs/jszip.min.js', 'libs/lucide.js',
            'css/style.css', 'js/config.js', 'js/reader.js', 'js/app.js'
       ])));
    });
    self.addEventListener('fetch', (e) => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
    `;
    const blob = new Blob([swCode], {type: 'application/javascript'});
    navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(err => console.log("SW Error:", err));
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (window.Capacitor && window.Capacitor.Plugins) {
            const capApp = window.Capacitor.Plugins.App;
            const capStatusBar = window.Capacitor.Plugins.StatusBar;
            
            if (capApp) capApp.addListener('backButton', ({canGoBack}) => { 
                if (window.history.length > 1) {
                    window.history.back(); 
                } else {
                    capApp.exitApp();
                }
            });
            if (capStatusBar) capStatusBar.hide().catch(()=>{});
        }
    }, 500);
});
