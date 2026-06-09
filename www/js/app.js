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

// --- ARCHIVE.ORG STATE ---
let _archiveMode = false;
let _archiveLastQuery = '';
let _archiveSearchTimeout = null;
let _archiveDownloading = false;
let archiveAbortController = null;

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
    loadLibrary().finally(() => {
        // Sembunyikan splash screen setelah library siap
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => { splash.style.display = 'none'; }, 500);
        }
    });
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

    // Catat aktivitas hari ini (1 "unit" = setiap kali updateStatistics dipanggil saat membaca)
    recordReadingActivity();
};

// Simpan & ambil data aktivitas membaca harian
function recordReadingActivity() {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const raw = localStorage.getItem('reading_activity_v1');
        const act = raw ? JSON.parse(raw) : {};
        act[today] = (act[today] || 0) + 1;
        // Hapus data lebih dari 30 hari
        const keys = Object.keys(act).sort();
        if (keys.length > 30) keys.slice(0, keys.length - 30).forEach(k => delete act[k]);
        localStorage.setItem('reading_activity_v1', JSON.stringify(act));
    } catch(e) {}
}

function getReadingActivity(days = 7) {
    try {
        const raw = localStorage.getItem('reading_activity_v1');
        const act = raw ? JSON.parse(raw) : {};
        // Map bahasa app ke locale BCP-47
        const localeMap = { id: 'id-ID', en: 'en-US', es: 'es-ES' };
        const lang = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
        const locale = localeMap[lang] || 'id-ID';
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            // Label: nama hari pendek + tanggal, sesuai bahasa aktif
            const label = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
            result.push({ label, value: act[key] || 0 });
        }
        return result;
    } catch(e) { return []; }
}

let _statChartOpen = false;
window.toggleStatChart = function() {
    _statChartOpen = !_statChartOpen;
    const area = document.getElementById('stat-chart-area');
    const icon = document.getElementById('stat-expand-icon');
    const label = document.getElementById('str-stat-expand');
    const lang = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
    const d = typeof i18n !== 'undefined' ? (i18n[lang] || i18n['id']) : {};

    if (_statChartOpen) {
        // Render chart di luar DOM dulu agar scrollHeight akurat
        renderStatChart();

        // Measure
        area.style.transition = 'none';
        area.style.overflow = 'hidden';
        area.style.height = '0px';
        area.style.opacity = '0';
        area.style.willChange = 'height, opacity';
        area.style.display = 'block';

        // Force reflow
        void area.offsetHeight;

        const fullH = area.scrollHeight;

        // Animate — gunakan height bukan max-height agar browser bisa optimize
        area.style.transition = 'height 320ms cubic-bezier(0.4,0,0.2,1), opacity 260ms ease';
        area.style.height  = fullH + 'px';
        area.style.opacity = '1';

        const onEnd = (ev) => {
            if (ev.propertyName !== 'height') return;
            area.style.height = 'auto';
            area.style.overflow = '';
            area.style.willChange = 'auto';
            area.removeEventListener('transitionend', onEnd);
        };
        area.addEventListener('transitionend', onEnd);

        if (icon) { icon.setAttribute('data-lucide', 'chevron-up'); if(window.lucide) window.lucide.createIcons({nodes: [icon]}); }
        if (label) label.textContent = d.statCollapse || 'Tutup Grafik';
    } else {
        // Collapse
        const curH = area.scrollHeight;
        area.style.transition = 'none';
        area.style.overflow = 'hidden';
        area.style.height  = curH + 'px';
        area.style.willChange = 'height, opacity';
        void area.offsetHeight;

        area.style.transition = 'height 280ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease';
        area.style.height  = '0px';
        area.style.opacity = '0';

        const onEnd2 = (ev) => {
            if (ev.propertyName !== 'height') return;
            area.style.willChange = 'auto';
            area.removeEventListener('transitionend', onEnd2);
        };
        area.addEventListener('transitionend', onEnd2);

        if (icon) { icon.setAttribute('data-lucide', 'bar-chart-2'); if(window.lucide) window.lucide.createIcons({nodes: [icon]}); }
        if (label) label.textContent = d.statExpand || 'Lihat Grafik';
    }
};

let _statChartInstance = null;
function renderStatChart() {
    const canvas = document.getElementById('stat-chart-canvas');
    const emptyEl = document.getElementById('stat-chart-empty');
    if (!canvas) return;

    const data = getReadingActivity(7);
    const hasData = data.some(d => d.value > 0);

    if (!hasData) {
        canvas.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    canvas.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');

    // Ambil warna dari CSS variable
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--md-sys-color-primary').trim() || '#6750A4';
    const onSecCont = style.getPropertyValue('--md-sys-color-on-secondary-container').trim() || '#1C1B1F';

    // Destroy chart lama kalau ada
    if (_statChartInstance) { try { _statChartInstance.destroy(); } catch(e) {} _statChartInstance = null; }

    const ctx = canvas.getContext('2d');
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values, 1);

    // Gambar chart manual (tanpa library) — simple line chart M3 style
    const W = canvas.parentElement.clientWidth || 300;
    const H = 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 12, bottom: 28, left: 12 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const n = data.length;
    const stepX = cW / Math.max(n - 1, 1);

    const toX = (i) => pad.left + i * stepX;
    const toY = (v) => pad.top + cH - (v / maxVal) * cH;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    grad.addColorStop(0, primary + '55');
    grad.addColorStop(1, primary + '00');

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < n; i++) {
        const cpx = (toX(i - 1) + toX(i)) / 2;
        ctx.bezierCurveTo(cpx, toY(values[i - 1]), cpx, toY(values[i]), toX(i), toY(values[i]));
    }
    ctx.lineTo(toX(n - 1), pad.top + cH);
    ctx.lineTo(toX(0), pad.top + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < n; i++) {
        const cpx = (toX(i - 1) + toX(i)) / 2;
        ctx.bezierCurveTo(cpx, toY(values[i - 1]), cpx, toY(values[i]), toX(i), toY(values[i]));
    }
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dots
    for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(toX(i), toY(values[i]), values[i] > 0 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = values[i] > 0 ? primary : primary + '60';
        ctx.fill();
        if (values[i] > 0) {
            ctx.strokeStyle = '#ffffff88';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // X labels
    ctx.fillStyle = onSecCont;
    ctx.globalAlpha = 0.5;
    ctx.font = `bold ${9 * (W > 250 ? 1 : 0.85)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
        ctx.fillText(labels[i], toX(i), H - 6);
    }
    ctx.globalAlpha = 1;
}

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
    const fmtOverlay = document.getElementById('archive-fmt-overlay');
    const dlOverlay  = document.getElementById('archive-dl-overlay');
    if (fmtOverlay && fmtOverlay.style.display !== 'none' && fmtOverlay.innerHTML !== '') {
        fmtOverlay.style.opacity = '0';
        setTimeout(() => { fmtOverlay.innerHTML = ''; fmtOverlay.style.display = 'none'; }, 220);
        return;
    }
    else if (dlOverlay && dlOverlay.style.display !== 'none' && dlOverlay.innerHTML !== '') {
        if (archiveAbortController) archiveAbortController.abort();
        return;
    }
    else if (!document.getElementById('raw-backup-modal').classList.contains('opacity-0')) { _closeModalAction('raw-backup-modal', 'raw-backup-sheet', true, true); }
    else if (!document.getElementById('raw-restore-modal').classList.contains('opacity-0')) { _closeModalAction('raw-restore-modal', 'raw-restore-sheet', true, true); }
    else if (!document.getElementById('custom-dialog').classList.contains('opacity-0')) { window.closeDialog(true); }
    else if (!document.getElementById('ai-modal').classList.contains('opacity-0')) { closeAiModal(true); }
    else if (!document.getElementById('bookmark-modal').classList.contains('opacity-0')) { _closeModalAction('bookmark-modal', 'bookmark-sheet', true, true); }
    else if (!document.getElementById('b-opt-modal').classList.contains('opacity-0')) { _closeModalAction('b-opt-modal', 'b-opt-sheet', false, true); }
    else if (!document.getElementById('edit-modal').classList.contains('opacity-0')) { _closeModalAction('edit-modal', 'edit-sheet', true, true); }
    else if (!document.getElementById('welcome-modal').classList.contains('opacity-0')) { closeWelcome(true); }
    else if (!document.getElementById('global-settings-modal').classList.contains('opacity-0')) { _closeModalAction('global-settings-modal', 'global-settings-sheet', false, true); }
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
function _hideRacksForSearch(hide) {
    // Menyembunyikan semua rak buku saat mode archive search aktif
    const rackIds = ['continue-reading-section', 'pinned-books-section', 'scroll-collection-section', 'canvas-collection-section'];
    rackIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (hide) {
            el.style.transition = 'opacity 0.25s ease, max-height 0.35s cubic-bezier(0.4,0,0.2,1)';
            el.style.overflow = 'hidden';
            el.style.maxHeight = '0px';
            el.style.opacity = '0';
            el.style.marginBottom = '0';
        } else {
            el.style.transition = 'opacity 0.3s ease, max-height 0.4s cubic-bezier(0.2,0,0,1)';
            el.style.maxHeight = '';
            el.style.opacity = '';
            el.style.overflow = '';
            el.style.marginBottom = '';
        }
    });
}

function setupSearchListeners() {
    const searchArea = document.getElementById('search-area');
    const searchCapsule = document.querySelector('.search-capsule');
    
    document.addEventListener('click', (e) => {
        if (searchArea && searchArea.classList.contains('search-active') && !searchArea.contains(e.target)) {
            const modeRow = document.getElementById('search-mode-row');
            const archivePanel = document.getElementById('archive-results-panel');
            const archiveFmtOverlay = document.getElementById('archive-fmt-overlay');
            const archiveDlOverlay = document.getElementById('archive-dl-overlay');
            if ((modeRow && modeRow.contains(e.target)) || (archivePanel && archivePanel.contains(e.target))) return;
            if ((archiveFmtOverlay && archiveFmtOverlay.contains(e.target)) || (archiveDlOverlay && archiveDlOverlay.contains(e.target))) return;
            window.closeSearch(false);
        }
    });

    if(DOM.globalSearch) {
        DOM.globalSearch.addEventListener('focus', () => {
            if (!searchArea.classList.contains('search-active')) {
                searchArea.classList.add('search-active');
                if (window.location.hash !== '#search') pushAppHistory('search');
            }
            const modeRow = document.getElementById('search-mode-row');
            if (modeRow) modeRow.classList.remove('hidden');
            _syncOfflineBadge();
        });
        DOM.globalSearch.addEventListener('input', (e) => {
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
            if (_archiveMode) {
                _archiveOnInput(e.target.value);
            } else {
                renderLibrary(e.target.value);
            }
        });
    }

    if(searchCapsule) {
        searchCapsule.addEventListener('click', (e) => {
            if (searchArea.classList.contains('search-active')) {
                if (e.target !== DOM.globalSearch) { window.closeSearch(false); }
            } else { DOM.globalSearch.focus(); }
        });
    }

    window.addEventListener('online', _syncOfflineBadge);
    window.addEventListener('offline', _syncOfflineBadge);
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

        // Reset archive mode
        _archiveMode = false;
        _archiveLastQuery = '';
        const modeRow = document.getElementById('search-mode-row');
        const archivePanel = document.getElementById('archive-results-panel');
        if (modeRow) modeRow.classList.add('hidden');
        if (archivePanel) archivePanel.classList.add('hidden');
        _hideRacksForSearch(false);
        _syncSearchModeUI();

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
    setElementText('str-wel-canvas', d.welCanvas);
    if(document.getElementById('str-wel-canvas-desc')) document.getElementById('str-wel-canvas-desc').innerHTML = d.welCanvasDesc;
    setElementText('str-wel-format', d.welFormat); 
    if(document.getElementById('str-wel-format-desc')) document.getElementById('str-wel-format-desc').innerHTML = d.welFormatDesc;
    setElementText('str-wel-privacy', d.welPrivacy); setElementText('str-wel-privacy-desc', d.welPrivacyDesc);
    setElementText('str-wel-btn', d.welBtn);
    setElementText('str-stat-expand', d.statExpand || 'Lihat Grafik');
    setElementText('str-stat-chart-title', d.statChartTitle || 'Aktivitas Membaca');
    if(document.getElementById('str-stat-chart-days')) document.getElementById('str-stat-chart-days').textContent = '7 ' + (d.statChartDays || 'hari terakhir');
    if(document.getElementById('stat-chart-empty')) document.getElementById('stat-chart-empty').textContent = d.statChartEmpty || 'Belum ada data aktivitas membaca.';
    
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
                                // Pertahankan pdfMode lokal — jangan timpa dengan mode dari backup
                                const existingPdfMode = mergedLibrary[existingIndex].pdfMode;
                                mergedLibrary[existingIndex] = { ...mergedLibrary[existingIndex], ...b };
                                if (existingPdfMode) mergedLibrary[existingIndex].pdfMode = existingPdfMode;
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

        // Set berisi id buku yang user minta skip (abaikan)
        const skippedIds = new Set();

        // ── definisikan dulu sebelum dipanggil ──

        const _doRestore = async () => {
            window.closeDialog();

            const existingIds = new Set(library.map(b => b.id));
            const toRestore   = parsedData.filter(b => !skippedIds.has(b.id));
            const matchCount  = toRestore.filter(b => existingIds.has(b.id)).length;
            const newCount    = toRestore.length - matchCount;

            let mergedLibrary = [...library];

            for (let b of toRestore) {
                if (b.nodes && b.nodes.length > 0) {
                    await localforage.setItem('content_' + b.id, b.nodes);
                }

                let meta = {...b};
                delete meta.nodes;
                delete meta.coverBase64;

                const existingIndex = mergedLibrary.findIndex(lib => lib.id === b.id);
                if (existingIndex > -1) {
                    // Jangan paksa ganti pdfMode — pertahankan mode yang sudah ada di library
                    mergedLibrary[existingIndex] = {
                        ...mergedLibrary[existingIndex],
                        progressPct: meta.progressPct,
                        lastReadId: meta.lastReadId,
                        annotations: meta.annotations || [],
                        isPinned: meta.isPinned,
                        title: meta.title
                        // pdfMode TIDAK diubah — tetap ikut library lokal
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
        };

        const _showMainConfirm = () => {
            const existingIds = new Set(library.map(b => b.id));
            const toRestore   = parsedData.filter(b => !skippedIds.has(b.id));
            const matchCount  = toRestore.filter(b => existingIds.has(b.id)).length;
            const newCount    = toRestore.length - matchCount;

            const confirmMsg = wikiLang === 'id'
                ? `Ditemukan ${matchCount} buku yang cocok (progress & catatan akan dipulihkan) dan ${newCount} buku baru (perlu import ulang file aslinya). Lanjut?`
                : `Found ${matchCount} matching books (progress & notes restored) and ${newCount} new books (re-import original files). Continue?`;

            showDialog(
                wikiLang === 'id' ? "Konfirmasi Restore JSON" : "Confirm JSON Restore",
                confirmMsg,
                "alert-triangle",
                [
                    { text: wikiLang === 'id' ? "Batal" : "Cancel", primary: false },
                    { text: wikiLang === 'id' ? "Lanjut" : "Continue", primary: true, action: _doRestore }
                ]
            );
        };

        // Tampilkan dialog konfirmasi utama
        _showMainConfirm();

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
        if (!coverData) return;

        // Support format baru (Blob) dan format lama (base64 string) secara bersamaan
        let coverUrl = null;
        if (coverData instanceof Blob) {
            coverUrl = URL.createObjectURL(coverData);
        } else if (typeof coverData === 'string' && coverData.length > 50) {
            coverUrl = coverData;
        }
        if (!coverUrl) return;

        card.style.backgroundImage = `url('${coverUrl}')`;
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

        // Revoke ObjectURL saat card dihapus dari DOM agar tidak leak
        if (coverData instanceof Blob) {
            const mo = new MutationObserver(() => {
                if (!document.body.contains(card)) { URL.revokeObjectURL(coverUrl); mo.disconnect(); }
            });
            mo.observe(document.body, { childList: true, subtree: true });
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
        if (DOM.canvasContainer) DOM.canvasContainer.style.paddingTop = '56px'; // reset saat buka buku
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
            const CHUNK_SIZE = 50;
            let hCounter = 0;
            let currentHeadingId = null;
            const allNodes = book.nodes;
            const totalNodes = allNodes.length;

            // Helper: buat satu elemen DOM dari node data
            function _buildNodeEl(node, i) {
                let el;
                const annots = (book.annotations || []).filter(a => a.nodeIdx === i);
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
                        tocItem.className = `text-left text-sm p-3 rounded-2xl hover:bg-m3-surface transition-all duration-300 ${node.tag === 'h1' ? 'font-bold text-m3-primary' : 'ml-4 opacity-80'}`;
                        tocItem.textContent = node.text;
                        tocItem.onclick = () => { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.back(); };
                        DOM.tocList.appendChild(tocItem);
                    } else { el.className = "text-m3-onSurface opacity-90 mb-5 tracking-wide"; }
                }
                el.dataset.headingId = currentHeadingId;
                return el;
            }

            // Render satu chunk node ke DOM, pasang sentinel di akhir jika masih ada
            let _chunkObserver = null;
            function _renderChunk(startIdx) {
                // Putus sentinel observer lama sebelum pasang yang baru
                if (_chunkObserver) { _chunkObserver.disconnect(); _chunkObserver = null; }

                const endIdx = Math.min(startIdx + CHUNK_SIZE, totalNodes);
                const fragment = document.createDocumentFragment();
                for (let i = startIdx; i < endIdx; i++) {
                    fragment.appendChild(_buildNodeEl(allNodes[i], i));
                }
                DOM.inner.appendChild(fragment);

                // Jika masih ada node tersisa, pasang IntersectionObserver pada elemen terakhir
                if (endIdx < totalNodes) {
                    const lastRendered = DOM.inner.lastElementChild;
                    if (lastRendered) {
                        _chunkObserver = new IntersectionObserver((entries) => {
                            if (entries[0].isIntersecting) {
                                _renderChunk(endIdx);
                            }
                        }, { root: DOM.readContent, rootMargin: '0px 0px 200px 0px', threshold: 0 });
                        _chunkObserver.observe(lastRendered);
                    }
                }
            }

            // Mulai render chunk pertama
            _renderChunk(0);

            if (hCounter === 0) DOM.tocList.innerHTML = "<p class='text-sm opacity-50 block p-3'>No Table of Contents.</p>";
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

    const canvas  = document.getElementById('pdf-canvas');
    const wrapper = document.getElementById('canvas-wrapper');

    try {
        const page = await currentPdfDoc.getPage(pageNum);
        const vpEl = document.getElementById('canvas-zoom-viewport');
        if (!canvas || !wrapper || !vpEl) { isRenderingCanvas = false; return; }

        const pixelRatio = window.devicePixelRatio || 1;
        // 2.5× dpr tanpa cap — tajam di zoom, tidak ada batas buatan
        const renderScale = pixelRatio * 2.5;

        const cW = vpEl.clientWidth;
        const cH = vpEl.clientHeight;

        const nat = page.getViewport({ scale: 1 });
        const fit = page.getViewport({ scale: cW / nat.width });
        const dW  = Math.floor(fit.width);
        const dH  = Math.floor(fit.height);

        canvas.width        = dW * renderScale;
        canvas.height       = dH * renderScale;
        canvas.style.width  = dW + 'px';
        canvas.style.height = dH + 'px';
        wrapper.style.width  = dW + 'px';
        wrapper.style.height = dH + 'px';

        wrapper._W  = dW;
        wrapper._H  = dH;
        wrapper._cW = cW;
        wrapper._cH = cH;

        const ctx = canvas.getContext('2d');
        // Smoothing OFF — teks PDF jadi solid, tidak blur/anti-alias berlebihan
        ctx.imageSmoothingEnabled = false;

        await page.render({
            canvasContext: ctx,
            viewport: fit,
            transform: [renderScale, 0, 0, renderScale, 0, 0]
        }).promise;

        const lbl = document.getElementById('canvas-page-num');
        if (lbl) lbl.textContent = pageNum;
        const pct = Math.round((pageNum / currentPdfDoc.numPages) * 100);
        if (DOM.progBar) DOM.progBar.style.width = `${pct}%`;
        if (DOM.progTxt) DOM.progTxt.textContent = `${pct}%`;
        updateBookProgress(activeBookId, pageNum, pct);
        renderBookmarkPanel();

    } catch (e) {
        console.error('renderCanvasPage:', e);
    } finally {
        isRenderingCanvas = false;
    }
}

window.nextCanvasPage = function() {
    if (!currentPdfDoc || currentCanvasPage >= currentPdfDoc.numPages || isRenderingCanvas) return;
    currentCanvasPage++;
    _resetCanvasTransform();
    renderCanvasPage(currentCanvasPage); // fire & forget — tidak pakai await agar tap langsung direspon
};
window.prevCanvasPage = function() {
    if (!currentPdfDoc || currentCanvasPage <= 1 || isRenderingCanvas) return;
    currentCanvasPage--;
    _resetCanvasTransform();
    renderCanvasPage(currentCanvasPage);
};

function _resetCanvasTransform() {
    currentCanvasScale = 1.0;
    canvasTranslateX   = 0;
    canvasTranslateY   = 0;
    canvasIsPinching   = false;
    const w = document.getElementById('canvas-wrapper');
    if (w) { w.style.transition = 'none'; w.style.transform = 'translate(0px,0px) scale(1)'; }
}

window.toggleJumpBar = function() {
    const bar = document.getElementById('canvas-jump-bar');
    const input = document.getElementById('canvas-jump-input');
    if (!bar) return;
    if (bar.classList.contains('hidden')) {
        bar.classList.remove('hidden');
        if (input) { input.value = ''; input.focus(); }
    } else {
        window.hideJumpBar();
    }
};

window.hideJumpBar = function() {
    const bar = document.getElementById('canvas-jump-bar');
    if (bar) bar.classList.add('hidden');
};

window.executeJumpToPage = function() {
    const input = document.getElementById('canvas-jump-input');
    if (!input || !currentPdfDoc) return;
    const p = parseInt(input.value);
    const total = currentPdfDoc.numPages;
    if (p >= 1 && p <= total) {
        currentCanvasPage = p;
        _resetCanvasTransform();
        renderCanvasPage(p);
        window.hideJumpBar();
    }
};

window.showJumpToPageDialog = function() {
    window.toggleJumpBar();
};

// --- GESTURE CANVAS ---
function setupCanvasPinchZoom() { /* stub */ }

// State double-tap
let _canvasLastTapTime = 0;
let _canvasLastTapX    = 0;
let _canvasLastTapY    = 0;

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

    wrapper.style.transformOrigin = 'center center';
    wrapper.style.willChange      = 'transform';
    wrapper.style.transition      = 'none';
    _resetCanvasTransform();

    // State internal gesture — semua di sini, tidak pakai variabel global yang bisa
    // terpolusi antar-gesture
    let isPinching    = false;
    let pinchStartDist  = 0;
    let pinchStartScale = 1;
    // Titik focal cubit di koordinat KONTEN (bukan layar) — pre-transform
    // Ini yang membuat zoom tidak meloncat: focal point di konten harus diam.
    let pinchFocalContentX = 0;
    let pinchFocalContentY = 0;
    // Translate saat pinch dimulai
    let pinchStartTX = 0;
    let pinchStartTY = 0;

    let isPanning   = false;
    let panStartX   = 0;
    let panStartY   = 0;

    let tapStartX   = 0;
    let tapStartY   = 0;
    let tapStartTime = 0;

    // Helper: konversi koordinat layar → koordinat konten wrapper (tanpa transform)
    // Dengan transform-origin center: titik layar P dalam konten =
    //   (P - naturalCenter - translate) / scale
    // naturalCenter = pusat wrapper di layar TANPA translate (= center viewport karena flex center)
    function screenToContent(sx, sy) {
        const rect = newVP.getBoundingClientRect();
        const natCX = rect.left + rect.width  / 2;
        const natCY = rect.top  + rect.height / 2;
        return {
            cx: (sx - natCX - canvasTranslateX) / currentCanvasScale,
            cy: (sy - natCY - canvasTranslateY) / currentCanvasScale
        };
    }

    // Helper: terapkan zoom ke titik focal konten (fx, fy) dengan scale baru
    function zoomToContentPoint(newScale, fx, fy, startTX, startTY, startScale) {
        // Saat scale berubah dari startScale → newScale,
        // focal point konten (fx, fy) harus tetap di posisi layar yang sama.
        // Posisi layar focal = natCenter + tx + fx * scale
        // Agar sama: startTX + fx*startScale = newTX + fx*newScale
        // → newTX = startTX + fx*(startScale - newScale)
        canvasTranslateX = startTX + fx * (startScale - newScale);
        canvasTranslateY = startTY + fy * (startScale - newScale);
        currentCanvasScale = newScale;
    }

    // ── touchstart ──
    newVP.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Masuk mode pinch — batalkan semua state pan/tap
            isPinching = true;
            isPanning  = false;

            pinchStartDist  = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            pinchStartScale = currentCanvasScale;
            pinchStartTX    = canvasTranslateX;
            pinchStartTY    = canvasTranslateY;

            // Titik focal di tengah dua jari, dikonversi ke koordinat konten
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const fc   = screenToContent(midX, midY);
            pinchFocalContentX = fc.cx;
            pinchFocalContentY = fc.cy;

        } else if (e.touches.length === 1 && !isPinching) {
            tapStartX    = e.touches[0].clientX;
            tapStartY    = e.touches[0].clientY;
            tapStartTime = Date.now();

            if (currentCanvasScale > 1.01) {
                isPanning = true;
                panStartX = e.touches[0].clientX - canvasTranslateX;
                panStartY = e.touches[0].clientY - canvasTranslateY;
            }
        }
    }, { passive: true });

    // ── touchmove ──
    newVP.addEventListener('touchmove', (e) => {
        if (isPinching && e.touches.length === 2) {
            e.preventDefault();

            const dist     = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const rawScale = pinchStartScale * (dist / pinchStartDist);
            const newScale = Math.max(1.0, Math.min(5.0, rawScale));

            if (newScale <= 1.0) {
                currentCanvasScale = 1.0;
                canvasTranslateX   = 0;
                canvasTranslateY   = 0;
            } else {
                // Zoom ke focal point konten — tidak pakai mid layar sekarang
                // karena mid bisa bergeser saat jari bergerak lateral.
                // Focal point KONTEN tetap konstan sejak touchstart.
                zoomToContentPoint(newScale,
                    pinchFocalContentX, pinchFocalContentY,
                    pinchStartTX, pinchStartTY, pinchStartScale);
            }
            _applyCanvasTransform(wrapper);

        } else if (e.touches.length === 1 && isPanning) {
            e.preventDefault();
            canvasTranslateX = e.touches[0].clientX - panStartX;
            canvasTranslateY = e.touches[0].clientY - panStartY;
            _applyCanvasTransform(wrapper);
        }
    }, { passive: false });

    // Timer untuk menunda navigasi halaman — dibatalkan jika tap kedua datang
    let _navTimer = null;

    // ── touchend ──
    newVP.addEventListener('touchend', (e) => {
        // Jari ke-2 terangkat → akhiri pinch, perbarui anchor pan agar tidak loncat
        if (e.touches.length === 1 && isPinching) {
            isPinching = false;
            if (currentCanvasScale > 1.01) {
                isPanning = true;
                panStartX = e.touches[0].clientX - canvasTranslateX;
                panStartY = e.touches[0].clientY - canvasTranslateY;
            }
            return;
        }

        if (e.touches.length === 0) {
            isPinching = false;
            isPanning  = false;

            // Snap balik ke scale 1 jika terlalu kecil
            if (currentCanvasScale <= 1.01) {
                currentCanvasScale = 1.0;
                canvasTranslateX   = 0;
                canvasTranslateY   = 0;
                wrapper.style.transition = 'transform 0.2s cubic-bezier(0.2,0,0,1)';
                _applyCanvasTransform(wrapper);
                setTimeout(() => { wrapper.style.transition = 'none'; }, 220);
            } else {
                _applyCanvasTransform(wrapper);
            }

            const dt    = Date.now() - tapStartTime;
            const ex    = e.changedTouches[0].clientX;
            const ey    = e.changedTouches[0].clientY;
            const moved = Math.hypot(ex - tapStartX, ey - tapStartY);

            // Bukan tap yang valid (geser terlalu jauh atau terlalu lama tekan)
            if (dt >= 300 || moved >= 18) return;

            const now          = Date.now();
            const dtDoubleTap  = now - _canvasLastTapTime;
            const doubleMoved  = Math.hypot(ex - _canvasLastTapX, ey - _canvasLastTapY);

            if (dtDoubleTap < 320 && doubleMoved < 40) {
                // ── DOUBLE TAP — batalkan timer navigasi yang mungkin sedang pending ──
                clearTimeout(_navTimer);
                _navTimer = null;
                _canvasLastTapTime = 0; // reset agar tidak triple-tap

                if (currentCanvasScale > 1.01) {
                    // Zoom OUT ke 1× dengan animasi
                    wrapper.style.transition = 'transform 0.3s cubic-bezier(0.2,0,0,1)';
                    currentCanvasScale = 1.0;
                    canvasTranslateX   = 0;
                    canvasTranslateY   = 0;
                    _applyCanvasTransform(wrapper);
                    setTimeout(() => { wrapper.style.transition = 'none'; }, 320);
                } else {
                    // Zoom IN 2.5× ke titik yang di-tap
                    const fc = screenToContent(ex, ey);
                    wrapper.style.transition = 'transform 0.3s cubic-bezier(0.2,0,0,1)';
                    zoomToContentPoint(2.5, fc.cx, fc.cy,
                        canvasTranslateX, canvasTranslateY, currentCanvasScale);
                    _applyCanvasTransform(wrapper);
                    setTimeout(() => { wrapper.style.transition = 'none'; }, 320);
                }
            } else {
                // ── SINGLE TAP — catat dulu, tunda navigasi sampai window double-tap berakhir ──
                _canvasLastTapTime = now;
                _canvasLastTapX    = ex;
                _canvasLastTapY    = ey;

                // Navigasi halaman hanya saat scale = 1
                // Ditunda 320ms agar double-tap bisa membatalkannya
                if (currentCanvasScale <= 1.01) {
                    const sw      = window.innerWidth;
                    const isLeft  = ex < sw * 0.30;
                    const isRight = ex > sw * 0.70;
                    if (isLeft || isRight) {
                        clearTimeout(_navTimer);
                        _navTimer = setTimeout(() => {
                            _navTimer = null;
                            // Cek ulang: pastikan belum di-zoom oleh double-tap yang datang
                            if (currentCanvasScale <= 1.01) {
                                if (isLeft)  window.prevCanvasPage();
                                if (isRight) window.nextCanvasPage();
                            }
                        }, 180);
                    }
                }
            }
        }
    }, { passive: true });
}

// Clamp & apply transform.
// transform-origin: center center → translate 0,0 = wrapper pas di tengah viewport.
// Saat scale S: wrapper melebar. Maksimum pan = separuh overflow tiap sisi.
function _applyCanvasTransform(wrapper) {
    if (wrapper._W && wrapper._cW) {
        const scaledW = wrapper._W * currentCanvasScale;
        const scaledH = wrapper._H * currentCanvasScale;
        // Berapa piksel wrapper menonjol keluar viewport di tiap sisi (bisa 0 jika belum zoom)
        const maxTX = Math.max(0, (scaledW - wrapper._cW) / 2);
        const maxTY = Math.max(0, (scaledH - wrapper._cH) / 2);
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
    // Destroy PDF.js document sebelum null-kan untuk mencegah memory leak
    if (currentPdfDoc) {
        try { currentPdfDoc.destroy(); } catch(e) { console.warn('PDFDocumentProxy.destroy():', e); }
    }
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
    window.hideJumpBar();
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
    const canvasContainer = document.getElementById('canvas-container');
    
    if (bottomBar.classList.contains('hidden')) {
        // Keluar immersive
        if (!isFromHistory && window.location.hash === '#immersive') { history.back(); }
        bottomBar.classList.remove('hidden');
        progContainer.classList.remove('hidden');
        floatHeader.classList.remove('-translate-y-[150%]', 'opacity-0');
        floatHeader.classList.add('translate-y-0', 'opacity-100');
        // Kembalikan padding canvas ke normal (ada floating header)
        if (canvasContainer) canvasContainer.style.paddingTop = '56px';
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
        // Di immersive, hapus padding atas canvas agar PDF mulai dari atas layar
        if (canvasContainer) canvasContainer.style.paddingTop = '0px';
        // Sembunyikan capsule canvas saat immersive
        if (canvasCtrl) canvasCtrl.classList.add('hidden');
        window.hideJumpBar(); // sembunyikan jump bar saat immersive
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

// 13. ARCHIVE.ORG INTEGRATION
function _syncOfflineBadge() {
    const badge = document.getElementById('offline-badge');
    if (badge) {
        if (!navigator.onLine) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

function _syncSearchModeUI() {
    const btnLocal = document.getElementById('search-mode-local');
    const btnArchive = document.getElementById('search-mode-archive');
    if (!btnLocal || !btnArchive) return;
    if (_archiveMode) {
        btnLocal.className = btnLocal.className.replace('bg-m3-primary text-m3-onPrimary', 'bg-m3-surfaceVariant text-m3-onSurfaceVariant');
        btnArchive.className = btnArchive.className.replace('bg-m3-surfaceVariant text-m3-onSurfaceVariant', 'bg-m3-primary text-m3-onPrimary');
    } else {
        btnLocal.className = btnLocal.className.replace('bg-m3-surfaceVariant text-m3-onSurfaceVariant', 'bg-m3-primary text-m3-onPrimary');
        btnArchive.className = btnArchive.className.replace('bg-m3-primary text-m3-onPrimary', 'bg-m3-surfaceVariant text-m3-onSurfaceVariant');
    }
}

window.setSearchMode = function(mode) {
    _archiveMode = (mode === 'archive');
    _syncSearchModeUI();

    const archivePanel = document.getElementById('archive-results-panel');
    const query = DOM.globalSearch ? DOM.globalSearch.value.trim() : '';

    if (_archiveMode) {
        if (archivePanel) archivePanel.classList.remove('hidden');
        _hideRacksForSearch(true);
        if (query.length >= 2) _archiveSearch(query);
        else _archiveShowState('empty');
    } else {
        if (archivePanel) archivePanel.classList.add('hidden');
        _hideRacksForSearch(false);
        renderLibrary(query);
    }
};

function _archiveOnInput(query) {
    clearTimeout(_archiveSearchTimeout);
    const archivePanel = document.getElementById('archive-results-panel');
    if (!archivePanel) return;
    archivePanel.classList.remove('hidden');
    _hideRacksForSearch(true);
    if (query.trim().length < 2) {
        _archiveShowState('empty');
        return;
    }
    _archiveSearchTimeout = setTimeout(() => { _archiveSearch(query.trim()); }, 600);
}

async function _archiveSearch(query) {
    if (!navigator.onLine) { _archiveShowState('offline'); return; }
    if (query === _archiveLastQuery) return;
    _archiveLastQuery = query;
    _archiveShowState('loading');
    try {
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:texts&fl[]=identifier,title,creator,downloads,format&sort[]=downloads+desc&rows=10&page=1&output=json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const docs = (data.response && data.response.docs) || [];
        if (docs.length === 0) { _archiveShowState('empty'); return; }
        _archiveRenderCards(docs);
    } catch (e) {
        if (e.name === 'AbortError') { _archiveShowState('error', 'Request timeout. Coba lagi.'); }
        else { _archiveShowState('error', e.message || 'Gagal mencari.'); }
    }
}

function _archiveRenderCards(docs) {
    const container = document.getElementById('archive-cards');
    if (!container) return;
    container.innerHTML = '';
    docs.forEach(doc => {
        const id = doc.identifier;
        const title = doc.title || 'Untitled';
        const creator = Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || '');
        const fmts = doc.format ? (Array.isArray(doc.format) ? doc.format : [doc.format]) : [];
        const hasPdf = fmts.some(f => f.toLowerCase().includes('pdf'));
        const hasEpub = fmts.some(f => f.toLowerCase().includes('epub'));
        const badge = hasPdf && hasEpub ? 'PDF + EPUB' : hasPdf ? 'PDF' : hasEpub ? 'EPUB' : '?';
        const downloads = doc.downloads ? parseInt(doc.downloads).toLocaleString('id') : '—';
        const card = document.createElement('div');
        card.className = 'flex items-start gap-3 bg-m3-surfaceVariant rounded-[20px] p-3';
        card.innerHTML = `
            <img src="https://archive.org/services/img/${id}" alt="" class="w-9 h-12 object-cover rounded-xl shrink-0 bg-m3-surface" onerror="this.style.display='none'" loading="lazy">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-m3-onSurfaceVariant leading-snug line-clamp-2 mb-0.5">${_esc(title)}</p>
                ${creator ? `<p class="text-[10px] text-m3-onSurfaceVariant opacity-55 truncate mb-1">${_esc(creator)}</p>` : ''}
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-black bg-m3-primary/15 text-m3-primary px-1.5 py-0.5 rounded-full">${badge}</span>
                    <span class="text-[9px] opacity-40 font-bold">↓${downloads}</span>
                </div>
            </div>
            <button class="shrink-0 w-9 h-9 rounded-full bg-m3-primary text-m3-onPrimary flex items-center justify-center btn-morph shadow-sm" onclick="window.archiveDownload('${_esc(id)}', '${_esc(title.replace(/'/g, "\\'").replace(/"/g, '&quot;'))}')">
                <i data-lucide="download" class="w-4 h-4 pointer-events-none"></i>
            </button>
        `;
        container.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons({ nodes: Array.from(container.querySelectorAll('[data-lucide]')) });
    _archiveShowState('cards');
}

function _archiveShowState(state, errMsg) {
    ['archive-state-loading','archive-state-offline','archive-state-empty','archive-state-error','archive-cards'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const map = { loading:'archive-state-loading', offline:'archive-state-offline', empty:'archive-state-empty', error:'archive-state-error', cards:'archive-cards' };
    const target = map[state];
    if (target) { const el = document.getElementById(target); if (el) el.classList.remove('hidden'); }
    if (state === 'error' && errMsg) { const el = document.getElementById('archive-error-text'); if (el) el.textContent = errMsg; }
}

// --- ARCHIVE FORMAT PICKER (inline overlay, tidak pakai history stack) ---
function _showArchiveFormatPicker(epubFile, pdfFile, epubSizeMb, pdfSizeMb, onChoose) {
    let overlay = document.getElementById('archive-fmt-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'archive-fmt-overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);opacity:0;transition:opacity 0.2s ease;';
    overlay.innerHTML = `
        <div id="archive-fmt-sheet" style="background:var(--md-sys-color-surface);border-radius:28px;padding:24px 20px 20px;max-width:320px;width:90%;display:flex;flex-direction:column;gap:16px;transform:scale(0.85);transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1);">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-weight:800;font-size:1rem;color:var(--md-sys-color-on-surface);">Pilih Format</span>
            </div>
            <p style="font-size:0.75rem;color:var(--md-sys-color-on-surface-variant);opacity:0.75;line-height:1.5;margin:0;">Buku ini tersedia dalam dua format. Pilih yang kamu inginkan:</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button id="archive-fmt-epub" style="padding:14px 20px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);border:none;border-radius:16px;font-weight:700;font-size:0.85rem;cursor:pointer;">
                    EPUB &nbsp;<span style="opacity:0.6;font-size:0.75rem;font-weight:600;">(${epubSizeMb})</span>
                </button>
                <button id="archive-fmt-pdf" style="padding:14px 20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);border:none;border-radius:16px;font-weight:700;font-size:0.85rem;cursor:pointer;">
                    PDF &nbsp;<span style="opacity:0.75;font-size:0.75rem;font-weight:600;">(${pdfSizeMb})</span>
                </button>
                <button id="archive-fmt-cancel" style="padding:10px 20px;background:transparent;color:var(--md-sys-color-on-surface-variant);border:none;border-radius:16px;font-weight:700;font-size:0.8rem;cursor:pointer;opacity:0.6;">Batal</button>
            </div>
        </div>`;

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        const sheet = document.getElementById('archive-fmt-sheet');
        if (sheet) sheet.style.transform = 'scale(1)';
    });

    // Push history HANYA untuk back gesture/hardware — tombol di dalam tidak menyentuh history sama sekali
    history.pushState({ state: 'archive-fmt' }, '', '#archive-fmt');

    const _close = () => {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.innerHTML = ''; overlay.style.display = 'none'; }, 220);
    };

    document.getElementById('archive-fmt-epub').onclick   = () => { _close(); onChoose({ file: epubFile, type: 'epub' }); };
    document.getElementById('archive-fmt-pdf').onclick    = () => { _close(); onChoose({ file: pdfFile,  type: 'pdf'  }); };
    document.getElementById('archive-fmt-cancel').onclick = () => { _close(); onChoose(null); };
}

window.archiveDownload = async function(identifier, title) {
    if (_archiveDownloading) return;
    _archiveDownloading = true;
    if (!navigator.onLine) {
        _archiveDownloading = false;
        showDialog('Offline', 'Tidak ada koneksi internet.', 'wifi-off', [{ text: 'Oke', primary: true }]);
        return;
    }

    // Inisialisasi AbortController baru tiap unduhan
    archiveAbortController = new AbortController();
    const signal = archiveAbortController.signal;

    // Kamus i18n lokal berdasarkan wikiLang
    const lang = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
    const txtMap = {
        id: { meta: 'Mengambil metadata...', downloading: 'Mengunduh', merging: 'Menyatukan file...', cancel: 'Batal', canceled: 'Unduhan dibatalkan', preparing: 'Menyiapkan unduhan...' },
        en: { meta: 'Fetching metadata...', downloading: 'Downloading', merging: 'Merging file...', cancel: 'Cancel', canceled: 'Download canceled', preparing: 'Preparing download...' },
        es: { meta: 'Obteniendo metadatos...', downloading: 'Descargando', merging: 'Fusionando archivo...', cancel: 'Cancelar', canceled: 'Descarga cancelada', preparing: 'Preparando descarga...' }
    };
    const txt = txtMap[lang] || txtMap['id'];

    const _showDlOverlay = (msg) => {
        let ov = document.getElementById('archive-dl-overlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'archive-dl-overlay';
            document.body.appendChild(ov);
        }
        ov.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);opacity:0;transition:opacity 0.2s ease;pointer-events:all;';
        ov.innerHTML = `
            <div style="background:var(--md-sys-color-surface);border-radius:24px;padding:28px 24px;max-width:280px;width:88%;display:flex;flex-direction:column;align-items:center;gap:16px;box-shadow:0 4px 24px rgba(0,0,0,0.2);">
                <p id="archive-dl-msg" style="font-size:0.82rem;font-weight:700;text-align:center;color:var(--md-sys-color-on-surface);opacity:0.85;max-width:220px;line-height:1.5;margin:0;white-space:pre-line;">${_esc(msg)}</p>
                <button id="archive-dl-cancel" style="padding:10px 20px;background:var(--md-sys-color-error-container,#FADBD8);color:var(--md-sys-color-on-error-container,#78281F);border:none;border-radius:16px;font-weight:700;font-size:0.8rem;cursor:pointer;width:100%;transition:transform 0.1s ease;">${txt.cancel}</button>
            </div>`;
        document.getElementById('archive-dl-cancel').onclick = () => {
            if (archiveAbortController) archiveAbortController.abort();
        };
        // Push history HANYA untuk back gesture/hardware — tombol Cancel tidak menyentuh history
        history.pushState({ state: 'archive-dl' }, '', '#archive-dl');
        requestAnimationFrame(() => { ov.style.opacity = '1'; });
    };
    const _updateDlMsg = (msg) => {
        const el = document.getElementById('archive-dl-msg');
        if (el) el.textContent = msg;
    };
    const _hideDlOverlay = () => {
        const ov = document.getElementById('archive-dl-overlay');
        if (!ov) return;
        ov.style.opacity = '0';
        setTimeout(() => { ov.innerHTML = ''; ov.style.display = 'none'; }, 220);
    };

    _showDlOverlay(txt.meta);

    try {
        // Step 1: ambil metadata
        const metaRes = await fetch(`https://archive.org/metadata/${identifier}`, { signal });
        if (!metaRes.ok) throw new Error('Metadata gagal (HTTP ' + metaRes.status + ')');
        const meta = await metaRes.json();
        const files = meta.files || [];

        const epubCandidates = files.filter(f => f.name && f.name.toLowerCase().endsWith('.epub'));
        const pdfCandidates  = files.filter(f => {
            if (!f.name) return false;
            const n = f.name.toLowerCase();
            return n.endsWith('.pdf') && !n.includes('_text') && !n.includes('_djvu');
        });

        if (epubCandidates.length === 0 && pdfCandidates.length === 0)
            throw new Error('Tidak ada file PDF atau EPUB yang tersedia untuk buku ini.');

        let chosen = null, chosenType = null;

        if (epubCandidates.length > 0 && pdfCandidates.length > 0) {
            _hideDlOverlay();
            const epubFile   = epubCandidates[0];
            const pdfFile    = pdfCandidates.sort((a, b) => parseInt(a.size || 0) - parseInt(b.size || 0))[0];
            const epubSizeMb = epubFile.size ? (parseInt(epubFile.size) / 1024 / 1024).toFixed(1) + ' MB' : '?';
            const pdfSizeMb  = pdfFile.size  ? (parseInt(pdfFile.size)  / 1024 / 1024).toFixed(1) + ' MB' : '?';

            const userChoice = await new Promise((resolve) => {
                _showArchiveFormatPicker(epubFile, pdfFile, epubSizeMb, pdfSizeMb, resolve);
            });

            if (!userChoice) {
                _archiveDownloading = false;
                // Pastikan state abort controller dikembalikan ke null tanpa memicu history back
                archiveAbortController = null;
                return;
            }
            chosen     = userChoice.file;
            chosenType = userChoice.type;
            _showDlOverlay(txt.preparing);

        } else if (epubCandidates.length > 0) {
            chosen = epubCandidates[0]; chosenType = 'epub';
        } else {
            chosen = pdfCandidates.sort((a, b) => parseInt(a.size || 0) - parseInt(b.size || 0))[0];
            chosenType = 'pdf';
        }

        // Step 2: download file menggunakan XMLHttpRequest (Bypass CORS + Realtime Progress via CapacitorHttp)
        const fileUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(chosen.name)}`;
        const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '').trim().substring(0, 60) || identifier;
        const fileName   = `${cleanTitle}.${chosenType}`;
        const mimeType   = chosenType === 'epub' ? 'application/epub+zip' : 'application/pdf';

        let file = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'blob'; 
            
            let lastUpdate = 0;
            
            xhr.onprogress = (event) => {
                const now = Date.now();
                if (now - lastUpdate > 150) { 
                    const receivedMB = (event.loaded / 1024 / 1024).toFixed(1);
                    if (event.lengthComputable && event.total > 0) {
                        const totalMB = (event.total / 1024 / 1024).toFixed(1);
                        let pct = Math.round((event.loaded / event.total) * 100);
                        if (pct > 100) pct = 100;
                        _updateDlMsg(`${txt.downloading} ${chosenType.toUpperCase()}...\n${receivedMB} MB / ${totalMB} MB (${pct}%)`);
                    } else {
                        _updateDlMsg(`${txt.downloading} ${chosenType.toUpperCase()}...\n${receivedMB} MB terunduh...`);
                    }
                    lastUpdate = now;
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    _updateDlMsg(`${txt.downloading} ${chosenType.toUpperCase()}...\nSelesai (100%)`);
                    resolve(new File([xhr.response], fileName, { type: mimeType }));
                } else {
                    reject(new Error(`Gagal mengunduh file (HTTP ${xhr.status})`));
                }
            };

            xhr.onerror = () => reject(new Error('Koneksi terputus atau diblokir CORS.'));
            
            signal.addEventListener('abort', () => {
                xhr.abort();
                reject(new DOMException('Aborted', 'AbortError'));
            });

            xhr.send();
        });

        _hideDlOverlay();
        _archiveDownloading = false;

        // Step 3: tutup search, tunggu animasi, proses ke library
        const _doProcess = async () => {
            const d = typeof i18n !== 'undefined' ? (i18n[lang] || i18n['id']) : {};
            try {
                if (typeof window._processFilesFromArchive === 'function') {
                    await window._processFilesFromArchive([file]);
                } else {
                    throw new Error('Engine pemroses belum siap. Coba restart aplikasi.');
                }
            } catch (procErr) {
                console.error('archiveDownload process error:', procErr);
                const failMsg = d.toastBookFailed || 'Gagal diproses, file mungkin rusak.';
                if (typeof window.showPersistentToast === 'function') {
                    window.showPersistentToast(failMsg, 'error', 4000);
                } else {
                    showDialog('Gagal Memproses', procErr.message, 'alert-circle', [{ text: 'Tutup', primary: true }]);
                }
            }
        };

        setTimeout(async () => {
            if (typeof window.closeSearch === 'function') window.closeSearch(false);
            const libScroll = document.getElementById('library-content-scroll');
            if (libScroll) libScroll.scrollTo({ top: 0, behavior: 'smooth' });
            await new Promise(r => setTimeout(r, 480));
            await _doProcess();
        }, 400);

    } catch (err) {
        console.error('archiveDownload error:', err);
        _hideDlOverlay();
        _archiveDownloading = false;
        archiveAbortController = null;

        if (err.name === 'AbortError') {
            // Dibatalkan oleh user — tampilkan toast bersih tanpa dialog
            if (typeof window.showPersistentToast === 'function') {
                window.showPersistentToast(txt.canceled, 'duplicate', 3000);
            }
            return;
        }

        setTimeout(() => {
            showDialog(
                lang === 'en' ? 'Download Failed' : (lang === 'es' ? 'Descarga Fallida' : 'Gagal Mengunduh'),
                err.message || 'Terjadi kesalahan. Pastikan koneksi internet stabil.',
                'alert-circle',
                [{ text: 'Oke', primary: true }]
            );
        }, 300);
    }
};

function _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── PERSISTENT TOAST ────────────────────────────────────────────────────────
// Toast yang kebal dari history.back() / efek penutupan search.
// Pakai z-index 99999 (di atas semua overlay) dan TIDAK menyentuh history stack.
// type: 'success' | 'duplicate' | 'error'
let _toastQueue = [];
let _toastActive = false;

window.showPersistentToast = function(message, type = 'success', duration = 3500) {
    _toastQueue.push({ message, type, duration });
    if (!_toastActive) _processToastQueue();
};

function _processToastQueue() {
    if (_toastQueue.length === 0) { _toastActive = false; return; }
    _toastActive = true;
    const { message, type, duration } = _toastQueue.shift();

    // Warna berdasarkan tipe
    const colorMap = {
        success:   { bg: 'var(--md-sys-color-primary)',          fg: 'var(--md-sys-color-on-primary)' },
        duplicate: { bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)' },
        error:     { bg: '#C0392B',                               fg: '#FFFFFF' }
    };
    const color = colorMap[type] || colorMap['success'];

    // Buat atau reuse elemen toast
    let toast = document.getElementById('_persistent-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = '_persistent-toast';
        toast.style.cssText = [
            'position:fixed',
            'bottom:88px',
            'left:50%',
            'transform:translateX(-50%) translateY(20px)',
            'z-index:99999',
            'max-width:88vw',
            'min-width:200px',
            'padding:12px 18px',
            'border-radius:16px',
            'font-size:0.78rem',
            'font-weight:700',
            'line-height:1.45',
            'text-align:center',
            'pointer-events:none',
            'opacity:0',
            'transition:opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.3,0.64,1)',
            'box-shadow:0 4px 24px rgba(0,0,0,0.22)',
            'word-break:break-word'
        ].join(';');
        document.body.appendChild(toast);
    }

    toast.style.background = color.bg;
    toast.style.color = color.fg;
    toast.textContent = message;

    // Paksa reflow sebelum animasi masuk
    void toast.offsetHeight;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => _processToastQueue(), 260);
    }, duration);
}
// ─────────────────────────────────────────────────────────────────────────────

// 14. PWA & CAPACITOR SETUP
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
