// --- APP LOGIC ---
// Mengurus interaksi UI, Tema, Render Library, Fitur In-Book Bookmark, & Manajemen Memori Tingkat Dewa

// 1. GLOBAL STATE & DOM REFERENCES
let library = []; 
let activeBookId = null; 
let observer = null; 
let coverObserver = null; 
let activePanel = null;
let activeOptsId = null; 
let currentSelection = { text: "", nodeIdx: -1, startOff: 0, endOff: 0 }; 
let isBatchDeleteMode = false;
let selectedForDelete = [];
let activeNoteColor = 'yellow';
let editingAnnotId = null;

// --- STATE TAB & LAYOUT (Home/Scroll/Canvas + Grid/List) ---
let currentTab = 'home';
let layoutMode = localStorage.getItem('layout_mode') || 'grid';

let isDark = true; // UI selalu Dark Mode (tidak bisa diubah)
let currentThemeKey = localStorage.getItem('m3-key') || 'orchid';
let isAmoled = false; // UI tidak pernah AMOLED â€” hanya untuk konten buku (lihat readerTheme)
let wikiLang = localStorage.getItem('wiki_lang') || 'en';

// Tema khusus untuk KONTEN BUKU (scroll & canvas) â€” terpisah dari tema UI
// Nilai: 'light' | 'dark' | 'amoled'
let readerTheme = localStorage.getItem('reader_theme') || 'dark';

// State baru untuk menyembunyikan judul buku dari rak
let isExpressive = localStorage.getItem('expressive') === 'true';
window.activeCanvasSearchKeyword = "";

// --- ARCHIVE.ORG STATE ---
let _archiveMode = false;
let _archiveLastQuery = '';
let _archiveSearchTimeout = null;
let _archiveDownloading = false;
let archiveAbortController = null;

// --- CANVAS MODE STATE ---
let currentPdfDoc = null;
let currentCanvasPage = 1;
let pageTurnAnimEnabled = localStorage.getItem('page_turn_anim') === 'true'; // opt-in, default nonaktif
let currentCanvasScale = 1.0;
let activeRenderTasks = { main: null, next: null, prev: null };
window.defaultCanvasScale = parseFloat(localStorage.getItem('default_canvas_scale')) || 1.0;

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

// State swipe navigasi halaman (seamless 3-page buffer)
let isSwipingPage = false;
let swipeStartX = 0;

const DOM = {};

document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi DOM Elements
    Object.assign(DOM, {
        libView: document.getElementById('library-view'), 
        readView: document.getElementById('reader-view'),
        mainHeader: document.getElementById('main-header'),
        grid: document.getElementById('book-grid'), 
        empty: document.getElementById('empty-state'),
        scrollTopSection: document.getElementById('scroll-continue-section'), 
        scrollTopSlider: document.getElementById('scroll-top-slider'),
        canvasTopSection: document.getElementById('canvas-continue-section'), 
        canvasTopSlider: document.getElementById('canvas-top-slider'),
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
        canvasPrev: document.getElementById('canvas-prev'),
        canvasNext: document.getElementById('canvas-next'),
        canvasSlider: document.getElementById('canvas-slider'),
        canvasWrapper: document.getElementById('canvas-wrapper'),
        canvasPageNum: document.getElementById('canvas-page-num'),
        canvasPageTotal: document.getElementById('canvas-page-total'),
        canvasWarning: document.getElementById('canvas-warning-info')
    });

    setupScrollListeners();
    setupSearchListeners();
    setupCanvasPinchZoom();
    setupProgressBarDrag();
    syncWikiLangUI();
    applyLanguage();
    applyTypo();
    applyThemeToDOM();

    // Terapkan ikon layout tersimpan (grid/list) sebelum render pertama
    // Ikon menandakan aksi berikutnya (kebalikan dari mode aktif saat ini)
    const layoutIcon = document.querySelector('#layout-btn i');
    if (layoutIcon) layoutIcon.setAttribute('data-lucide', layoutMode === 'grid' ? 'layout-list' : 'layout-grid');

    loadLibrary().finally(() => {
        // Sembunyikan splash screen setelah library siap
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => { splash.style.display = 'none'; }, 500);
        }
    });
    setupSwipeToDismiss(); // Nyalain Gestur Aman

    // Aktifkan tab Home (dashboard Internet Archive) sebagai tampilan awal
    switchTab('home');

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

let _lastActivityLogTime = 0;
// Simpan & ambil data aktivitas membaca harian (1 poin = 1 menit membaca aktif)
function recordReadingActivity() {
    try {
        const now = Date.now();
        // Hanya rekam 1 poin (1 menit) jika sudah berlalu minimal 60 detik dari log terakhir
        if (now - _lastActivityLogTime < 60000) return;
        _lastActivityLogTime = now;

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

        // Animate â€” gunakan height bukan max-height agar browser bisa optimize
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

    // Gambar chart manual (tanpa library) â€” simple line chart M3 style
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
    let isScrolling = false;
    if(DOM.readContent) {
        DOM.readContent.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;

            requestAnimationFrame(() => {
                const bottomBar = document.getElementById('reader-bottom-bar');
                if (bottomBar && bottomBar.classList.contains('hidden')) { isScrolling = false; return; }

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
                isScrolling = false;
            });
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
    else if (document.getElementById('canvas-zoom-slider-container') && !document.getElementById('canvas-zoom-slider-container').classList.contains('hidden')) { _closeZoomSlider(true); }
    else if (!document.getElementById('raw-backup-modal').classList.contains('opacity-0')) { _closeModalAction('raw-backup-modal', 'raw-backup-sheet', true, true); }
    else if (!document.getElementById('raw-restore-modal').classList.contains('opacity-0')) { _closeModalAction('raw-restore-modal', 'raw-restore-sheet', true, true); }
    else if (!document.getElementById('custom-dialog').classList.contains('opacity-0')) { window.closeDialog(true); }
    else if (!document.getElementById('ai-modal').classList.contains('opacity-0')) { closeAiModal(true); }
    else if (!document.getElementById('bookmark-modal').classList.contains('opacity-0')) { _closeModalAction('bookmark-modal', 'bookmark-sheet', true, true); }
    else if (!document.getElementById('b-opt-modal').classList.contains('opacity-0')) { _closeModalAction('b-opt-modal', 'b-opt-sheet', false, true); }
    else if (!document.getElementById('edit-modal').classList.contains('opacity-0')) { _closeModalAction('edit-modal', 'edit-sheet', true, true); }
    else if (!document.getElementById('welcome-modal').classList.contains('opacity-0')) { closeWelcome(true); }
    else if (!document.getElementById('backup-type-modal').classList.contains('opacity-0')) { _closeModalAction('backup-type-modal', 'backup-type-sheet', true, true); }
    else if (!document.getElementById('pdf-mode-modal').classList.contains('opacity-0')) { _closeModalAction('pdf-mode-modal', 'pdf-mode-sheet', true, true); }
    else if (!document.getElementById('global-settings-modal').classList.contains('opacity-0')) { _closeModalAction('global-settings-modal', 'global-settings-sheet', false, true); }
    else if (!document.getElementById('search-fullscreen-modal').classList.contains('hidden')) { window.closeSearchMode(true); }
    else if (isBatchDeleteMode) { window.toggleBatchDelete(true); }
    else if (activePanel) { _closeSidePanelsAction(true); } 
    else if (document.getElementById('reader-bottom-bar') && document.getElementById('reader-bottom-bar').classList.contains('hidden')) { window.toggleFullscreenReading(true); }
    else if (DOM.readView && !DOM.readView.classList.contains('translate-y-full')) { _closeReaderAction(true); }
});

function pushAppHistory(stateName) { history.pushState({ state: stateName }, '', `#${stateName}`); }

// 4. SEARCH & I18N
function _hideRacksForSearch(hide) {
    // Menyembunyikan semua rak buku saat mode archive search aktif
    const rackIds = ['scroll-continue-section', 'canvas-continue-section', 'pinned-books-section', 'scroll-collection-section', 'canvas-collection-section'];
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
    const searchInput = document.getElementById('global-search');
    const clearBtn = document.getElementById('search-clear-btn');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if(clearBtn) clearBtn.classList.toggle('hidden', val.length === 0);
            if (_archiveMode) {
                _archiveOnInput(val);
            } else {
                const query = val.toLowerCase().trim();
                const localPanel = document.getElementById('local-search-results');
                localPanel.innerHTML = '';
                if(query.length === 0) {
                    localPanel.innerHTML = '<div class="col-span-full text-center text-xs opacity-50 mt-10">Ketik judul buku...</div>';
                    return;
                }
                const matchedBooks = library.filter(b => b.title.toLowerCase().includes(query));
                if(matchedBooks.length === 0) {
                    localPanel.innerHTML = '<div class="col-span-full text-center text-xs opacity-50 mt-10">Tidak ditemukan.</div>';
                } else {
                    matchedBooks.forEach((book, idx) => {
                        const card = layoutMode === 'list' ? createBookListItem(book, idx, true) : createBookCard(book, false, idx, true);
                        localPanel.appendChild(card);
                    });
                    initCoverObserver();
                }
            }
        });
    }
}

window.openSearchMode = function() {
    pushAppHistory('search');
    const modal = document.getElementById('search-fullscreen-modal');
    const capsule = document.getElementById('search-capsule');
    const searchInput = document.getElementById('global-search');
    const _dSearch = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    searchInput.placeholder = _archiveMode ? _dSearch.searchArchive : _dSearch.searchLocal;
    searchInput.value = '';
    document.getElementById('search-clear-btn').classList.add('hidden');

    const modalHeader = modal.querySelector('div.flex.items-center.px-2');
    const modalResults = document.getElementById('search-results-wrapper');

    // Hide inner contents before morph starts
    if (modalHeader) { modalHeader.style.transition = 'none'; modalHeader.style.opacity = '0'; }
    if (modalResults) { modalResults.style.transition = 'none'; modalResults.style.opacity = '0'; }

    // Morphing: Start with exact capsule dimensions
    if (capsule) {
        const rect = capsule.getBoundingClientRect();
        modal.style.transition = 'none';
        modal.style.top = rect.top + 'px';
        modal.style.left = rect.left + 'px';
        modal.style.width = rect.width + 'px';
        modal.style.height = rect.height + 'px';
        modal.style.borderRadius = '9999px';
        capsule.style.opacity = '0'; // Hide original capsule instantly
    }
    modal.classList.remove('hidden', 'opacity-0');
    modal.classList.add('flex');
    modal.style.opacity = '1';
    void modal.offsetWidth; // Force layout calc
    modal.style.transition = ''; // Restore CSS transitions

    // Expand physically
    requestAnimationFrame(() => {
        modal.style.top = '0px';
        modal.style.left = '0px';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.borderRadius = '0px';
        // Fade in contents during expansion
        setTimeout(() => {
            if (modalHeader) { modalHeader.style.transition = 'opacity 0.2s ease'; modalHeader.style.opacity = '1'; }
            if (modalResults) { modalResults.style.transition = 'opacity 0.25s ease'; modalResults.style.opacity = '1'; }
            searchInput.focus();
        }, 100);
    });

    const archivePanel = document.getElementById('archive-results-panel');
    const localPanel = document.getElementById('local-search-results');
    if(_archiveMode) {
        if(archivePanel) {
            modalResults.appendChild(archivePanel);
            archivePanel.classList.remove('hidden');
            archivePanel.classList.add('px-5');
        }
        localPanel.classList.add('hidden');
        _archiveShowState('empty');
    } else {
        if(archivePanel) archivePanel.classList.add('hidden');
        localPanel.classList.remove('hidden');
        localPanel.className = layoutMode === 'list' ? 'flex flex-col gap-4 px-5 py-4 w-full' : 'grid grid-cols-2 gap-4 px-5 py-4 w-full';
        localPanel.innerHTML = '<div class="col-span-full text-center text-xs opacity-50 mt-10">Ketik judul buku...</div>';
    }
};

window.closeSearchMode = function(fromHistory = false) {
    if (!fromHistory) history.back();
    const modal = document.getElementById('search-fullscreen-modal');
    const capsule = document.getElementById('search-capsule');
    const searchInput = document.getElementById('global-search');
    // Fix Bug Layout: Reset input value here so background logic doesn't filter empty shelf
    if(searchInput) { searchInput.blur(); searchInput.value = ''; }

    const modalHeader = modal.querySelector('div.flex.items-center.px-2');
    const modalResults = document.getElementById('search-results-wrapper');

    // Fade out inner contents fast
    if (modalHeader) { modalHeader.style.transition = 'opacity 0.15s ease'; modalHeader.style.opacity = '0'; }
    if (modalResults) { modalResults.style.transition = 'opacity 0.15s ease'; modalResults.style.opacity = '0'; }

    // Shrink physically back to capsule size
    if (capsule) {
        const rect = capsule.getBoundingClientRect();
        modal.style.top = rect.top + 'px';
        modal.style.left = rect.left + 'px';
        modal.style.width = rect.width + 'px';
        modal.style.height = rect.height + 'px';
        modal.style.borderRadius = '9999px';
    }
    _hideRacksForSearch(false);
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (capsule) {
            // Matikan transition sesaat agar capsule muncul INSTAN (bukan fade pelan)
            // biar pas persis dengan hilangnya modal, tidak ada jeda/kedip
            capsule.style.transition = 'none';
            capsule.style.opacity = '1'; // Restore original capsule
            void capsule.offsetWidth; // Force reflow biar transition:none diterapkan dulu
            capsule.style.transition = '';
        }
        // Reset modal constraints for next use
        modal.style.top = '0px'; modal.style.left = '0px';
        modal.style.width = '100vw'; modal.style.height = '100vh';
        modal.style.borderRadius = '0px';
        const tabHome = document.getElementById('tab-home');
        const archivePanel = document.getElementById('archive-results-panel');
        if(tabHome && archivePanel) tabHome.appendChild(archivePanel);
        if(archivePanel) archivePanel.classList.add('hidden');
        const archiveDashboard = document.getElementById('archive-dashboard'); if (archiveDashboard) archiveDashboard.classList.remove('hidden');
        ['scroll-continue-section', 'canvas-continue-section', 'pinned-books-section', 'scroll-collection-section', 'canvas-collection-section'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.maxHeight = '';
            el.style.opacity = '';
            el.style.overflow = '';
            el.style.marginBottom = '';
        });
    }, 400);
};

window.clearSearchInput = function() {
    const input = document.getElementById('global-search');
    if(input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.focus();
    }
};

window.closeSearch = function(fromHistory = false) {
    window.closeSearchMode(fromHistory); // Proxy fungsi lama agar aman
};

// --- SCROLL STATE MEMORY: ingat posisi scroll tiap tab (Home/Scroll/Canvas) ---
const tabScrollMemory = { home: 0, scroll: 0, canvas: 0 };

// --- TAB SYSTEM: Home (Archive) / Scroll / Canvas ---
window.switchTab = function(tabId) {
    if (!['home', 'scroll', 'canvas'].includes(tabId)) return;

    // Simpan posisi scroll tab yang sedang aktif sebelum berpindah
    const scrollContainer = document.getElementById('library-content-scroll');
    if (scrollContainer && tabScrollMemory.hasOwnProperty(currentTab)) {
        tabScrollMemory[currentTab] = scrollContainer.scrollTop;
    }

    const previousTab = currentTab;
    currentTab = tabId;

    // --- Ganti tab secara seamless, tanpa lompatan scroll ---
    // 1. Elemen tab lama langsung disembunyikan (hidden) SEKETIKA, bukan difade lalu
    //    ditunda dengan setTimeout â€” supaya tinggi kontainer scroll berubah instan
    //    dan tidak ada momen di mana tab lama & baru sama-sama memakan ruang (dobel tinggi).
    const prevTabEl = previousTab !== tabId ? document.getElementById('tab-' + previousTab) : null;
    if (prevTabEl) {
        prevTabEl.style.transition = 'none';
        prevTabEl.style.opacity = '0';
        prevTabEl.classList.add('hidden');
    }

    // 2. Tampilkan tab baru (masih transparan) lalu 3. terapkan scroll state SINKRON,
    //    persis setelah hidden dihapus â€” sebelum browser sempat repaint dengan posisi lama.
    const newTabEl = document.getElementById('tab-' + tabId);
    if (newTabEl) {
        newTabEl.style.transition = 'none';
        newTabEl.classList.remove('hidden');
        newTabEl.style.opacity = '0';
    }
    if (scrollContainer) {
        scrollContainer.scrollTop = tabScrollMemory[tabId] || 0;
    }

    // 4. Baru sesudah layout & scroll final ter-set, jalankan fade-in di frame berikutnya.
    //    Tidak ada layout thrashing di antara penutupan dan pembukaan tab.
    requestAnimationFrame(() => {
        if (newTabEl) {
            newTabEl.style.transition = '';
            newTabEl.style.opacity = '1';
        }
        if (prevTabEl) prevTabEl.style.transition = '';
    });

    ['home', 'scroll', 'canvas'].forEach(id => {
        const btn = document.getElementById('nav-tab-' + id);
        if (!btn) return;
        const ind = btn.querySelector('.nav-indicator');
        if (id === tabId) {
            if (ind) ind.classList.add('bg-m3-secondaryContainer', 'text-m3-onSecondaryContainer');
            btn.classList.add('text-m3-onSurface');
            btn.classList.remove('text-m3-onSurfaceVariant');
        } else {
            if (ind) ind.classList.remove('bg-m3-secondaryContainer', 'text-m3-onSecondaryContainer');
            btn.classList.remove('text-m3-onSurface');
            btn.classList.add('text-m3-onSurfaceVariant');
        }
    });

    // Home tab = mode pencarian archive.org otomatis; Scroll/Canvas = pencarian lokal
    _archiveMode = (tabId === 'home');
    if (DOM.globalSearch) {
        const _dTab = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
        DOM.globalSearch.placeholder = _archiveMode ? _dTab.searchArchive : _dTab.searchLocal;
    }
    // Tutup panel hasil pencarian archive & tampilkan dashboard kurasi saat berpindah tab
    const archivePanel = document.getElementById('archive-results-panel');
    const archiveDashboard = document.getElementById('archive-dashboard');
    if (archivePanel) archivePanel.classList.add('hidden');
    if (archiveDashboard) archiveDashboard.classList.remove('hidden');

    if (tabId === 'home' && archiveDashboard && archiveDashboard.innerHTML.trim() === '') {
        loadArchivePlayBooksStyle();
    }

    if (window.lucide) window.lucide.createIcons();
};

// --- LAYOUT TOGGLE: Grid / List (rak lokal Scroll & Canvas) ---
window.toggleLayoutMode = function() {
    layoutMode = layoutMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem('layout_mode', layoutMode);
    const btn = document.getElementById('layout-btn');
    if(btn) {
        // Regenerate ulang sebagai <i data-lucide> segar tiap kali dipanggil.
        // Lucide mengganti tag <i> jadi <svg> begitu ikon dirender pertama kali,
        // jadi querySelector('#layout-btn i') berikutnya tidak akan pernah nemu
        // apa-apa lagi (elemen itu sudah jadi <svg>, bukan <i>) â€” makanya ikon
        // nyangkut di satu gambar selamanya. Bikin ulang <i>-nya tiap toggle
        // supaya Lucide selalu punya elemen segar untuk dikonversi.
        // Ikon menandakan aksi berikutnya (kebalikan dari mode aktif saat ini)
        btn.innerHTML = `<i data-lucide="${layoutMode === 'grid' ? 'layout-list' : 'layout-grid'}"></i>`;
        if(window.lucide) window.lucide.createIcons({nodes: [btn.firstElementChild]});
    }
    // Sinkronkan seluruh rak buku (Beranda/Archive & Scroll/Canvas) secara serentak
    loadArchivePlayBooksStyle();
    renderLibrary(document.getElementById('global-search') ? document.getElementById('global-search').value : '');
};

// --- HOME TAB: Dashboard kurasi Internet Archive (gaya Play Books) ---
window.loadArchivePlayBooksStyle = async function() {
    const container = document.getElementById('archive-dashboard');
    if(!container) return;
    const d = i18n[wikiLang] || i18n['id'];
    const isList = layoutMode === 'list';
    const skeletonRow = () => `<div class="flex flex-col gap-3 w-full"><div class="skeleton h-4 w-40 rounded-lg"></div><div class="flex gap-3 overflow-hidden"><div class="skeleton w-28 h-40 shrink-0"></div><div class="skeleton w-28 h-40 shrink-0"></div><div class="skeleton w-28 h-40 shrink-0"></div><div class="skeleton w-28 h-40 shrink-0"></div></div></div>`;
    container.innerHTML = `<div class="flex flex-col gap-6 w-full px-5">${skeletonRow()}${skeletonRow()}${skeletonRow()}</div>`;
    if (!navigator.onLine) {
        container.innerHTML = `<p class="text-center text-xs opacity-50 p-5 w-full">${d.noInternet || 'Tidak ada koneksi internet.'}</p>`;
        return;
    }
    const queries = [
        { title: d.archiveFic || "Fiksi Populer", q: 'subject:("fiction" OR "literature") AND mediatype:texts' },
        { title: d.archiveSci || "Sains & Ilmu Pengetahuan", q: 'subject:("science" OR "physics" OR "chemistry") AND mediatype:texts' },
        { title: d.archiveHis || "Sejarah Dunia", q: 'subject:"history" AND mediatype:texts' },
        { title: d.archiveTech || "Teknologi", q: 'subject:("technology" OR "computer science" OR "engineering") AND mediatype:texts' },
        { title: d.archivePhil || "Filsafat", q: 'subject:("philosophy") AND mediatype:texts' },
        { title: d.archiveFantasy || "Fantasi & Sihir", q: 'subject:("fantasy" OR "magic") AND mediatype:texts' }
    ];
    try {
        let html = '';
        for(let item of queries) {
            const page = Math.floor(Math.random() * 5) + 1;
            const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(item.q)}&fl[]=identifier,title,creator,downloads&sort[]=downloads+desc&rows=8&page=${page}&output=json`;
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (!res.ok) continue;
            const data = await res.json();
            const docs = data.response?.docs || [];
            if(docs.length > 0) {
                let cardsHtml = docs.map(doc => {
                    const id = doc.identifier;
                    const title = doc.title || 'Untitled';
                    const creator = Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown');
                    if (isList) {
                        return `
                            <div class="flex gap-4 items-center w-full mb-4 cursor-pointer outline-none" onclick="window.archiveDownload('${_esc(id)}', '${_esc(title.replace(/'/g, "\\'").replace(/"/g, '&quot;'))}')">
                                <div class="w-[72px] aspect-[2/3] bg-m3-surfaceVariant rounded-xl overflow-hidden shadow-sm shrink-0 relative">
                                    <img src="https://archive.org/services/img/${id}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'">
                                    <div class="absolute inset-0 bg-black/5 pointer-events-none"></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-sm font-bold text-m3-onSurface line-clamp-2 leading-tight">${_esc(title)}</h4>
                                    <p class="text-[10px] text-m3-onSurfaceVariant opacity-70 truncate mt-1">${_esc(creator)}</p>
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="flex flex-col w-[112px] shrink-0 snap-start cursor-pointer outline-none" onclick="window.archiveDownload('${_esc(id)}', '${_esc(title.replace(/'/g, "\\'").replace(/"/g, '&quot;'))}')">
                                <div class="w-full aspect-[2/3] bg-m3-surfaceVariant rounded-xl overflow-hidden shadow-sm mb-2 relative">
                                    <img src="https://archive.org/services/img/${id}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'">
                                    <div class="absolute inset-0 bg-black/5 pointer-events-none"></div>
                                </div>
                                <h4 class="text-xs font-bold text-m3-onSurface line-clamp-2 leading-tight">${_esc(title)}</h4>
                                <p class="text-[10px] text-m3-onSurfaceVariant opacity-70 truncate mt-1">${_esc(creator)}</p>
                            </div>
                        `;
                    }
                }).join('');
                html += `
                    <div class="w-full mb-6">
                        <h3 class="text-[15px] px-5 font-bold text-m3-onSurface mb-3 tracking-wide">${_esc(item.title)}</h3>
                        <div class="${isList ? 'flex flex-col px-5' : 'flex gap-4 overflow-x-auto snap-x snap-proximity hide-scroll pb-2'}" ${isList ? '' : 'style="scroll-padding-left: 1.25rem;"'}>
                            ${!isList ? '<div class="w-4 shrink-0 snap-align-none"></div>' : ''}
                            ${cardsHtml}
                            ${!isList ? '<div class="w-4 shrink-0 snap-align-none"></div>' : ''}
                        </div>
                    </div>
                `;
            }
        }
        container.innerHTML = html || `<p class="text-center text-xs opacity-50 p-5 w-full">${d.archiveFailed || 'Gagal memuat rekomendasi.'}</p>`;

        // "Lanjutkan Membaca" khusus Home: 4 buku dengan progres terbesar dari SELURUH rak (scroll + canvas)
        const homeContinueBooks = (typeof library !== 'undefined' ? library : [])
            .filter(b => b.progressPct > 0)
            .sort((a, b) => b.progressPct - a.progressPct)
            .slice(0, 4);
        if (homeContinueBooks.length > 0) {
            const continueSection = document.createElement('div');
            continueSection.className = 'w-full mb-6';
            continueSection.innerHTML = `
                <h3 class="text-[15px] px-5 font-bold text-m3-onSurface mb-3 tracking-wide" id="str-home-continue-title">${_esc(d.continueReadingHome || 'Lanjutkan Membaca')}</h3>
                <div id="home-continue-slider" class="flex gap-4 overflow-x-auto snap-x snap-proximity hide-scroll pb-2" style="scroll-padding-left: 1.25rem;">
                    <div class="w-4 shrink-0 snap-align-none"></div>
                </div>
            `;
            container.prepend(continueSection);
            const slider = document.getElementById('home-continue-slider');
            homeContinueBooks.forEach((book, idx) => { slider.appendChild(createBookCard(book, true, idx)); });
            const spacer = document.createElement('div'); spacer.className = "w-4 shrink-0 snap-align-none"; slider.appendChild(spacer);
            initCoverObserver();
        }
    } catch(e) {
        container.innerHTML = `<p class="text-center text-xs opacity-50 p-5 w-full">${d.archiveFailed || 'Gagal memuat rekomendasi.'}</p>`;
    }
};

const setElementText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };

function applyLanguage() {
    const d = typeof i18n !== 'undefined' ? (i18n[wikiLang] || i18n['id']) : {};
    if (!Object.keys(d).length) return;

    setElementText('str-nav-home', d.navHome); setElementText('str-nav-scroll', d.navScroll); setElementText('str-nav-canvas', d.navCanvas);
    setElementText('str-jelajah-arsip', d.jelajahArsip); setElementText('str-archive-empty', d.archiveSearchEmpty);
    setElementText('str-lib-empty', d.libEmpty); setElementText('str-continue-reading', d.continueReading);
    setElementText('str-continue-reading-canvas', d.continueReading);
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
    setElementText('str-btn-info', d.btnInfo); setElementText('str-btn-donate', d.btnDonate); setElementText('str-btn-donate-kofi', d.btnDonateKofi);
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
    setElementText('str-set-pageturn', d.setPageturn); setElementText('str-pageturn-on', d.pageturnOn); setElementText('str-pageturn-off', d.pageturnOff);
    
    setElementText('str-ai-title', d.aiTitle); setElementText('str-ai-loading', d.aiLoading);
    
    setElementText('str-edit-title', d.editTitle); setElementText('str-edit-book-title', d.editBookTitle);
    setElementText('str-edit-book-cover', d.editBookCover); setElementText('str-edit-book-shape', d.editBookShape);
    setElementText('str-edit-cancel', d.editCancel); setElementText('str-edit-save', d.editSave);
    setElementText('str-amoled-label', d.amoledLabel);
    setElementText('str-expressive-label', d.expressiveLabel || 'Ekspresif');
    
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
    

    updateBatchSelectionUI();

    setElementText('str-stat-title', d.statTitle || "Statistik");
    setElementText('str-stat-total', d.statTotal || "Koleksi");
    setElementText('str-stat-reading', d.statReading || "Dibaca");
    setElementText('str-stat-completed', d.statCompleted || "Selesai");
    setElementText('str-stat-notes', d.statNotes || "Catatan");

    // TOC canvas warning
    setElementText('str-toc-canvas-warning', d.tocCanvasWarning || 'Untuk mode canvas, daftar isi tidak tersedia.');

    // Indikator PDF Canvas tanpa teks (hanya gambar) â€” pencarian tidak tersedia
    setElementText('str-search-canvas-image-warning', d.pdfCanvasImageOnlyWarning || 'PDF ini hanya berisi gambar, pencarian kata tidak tersedia.');

    // Label & tombol "Lompat ke Halaman" (Canvas Mode, di panel settings)
    setElementText('str-set-jump-label', d.navJumpPage || 'Lompat ke Halaman');
    setElementText('str-set-jump-go', d.btnGo || 'Go');
}

window.setWikiLang = function(lang) {
    wikiLang = lang; localStorage.setItem('wiki_lang', lang); syncWikiLangUI(); applyLanguage();
    if(activeBookId) renderBookmarkPanel();
    renderLibrary(document.getElementById('global-search') ? document.getElementById('global-search').value : '');
    if (currentTab === 'home') loadArchivePlayBooksStyle();
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
    // Bersihkan sisa inline style dari swipe-to-dismiss
    s.style.transform = '';
    s.style.transition = '';
    // Forced reflow
    void m.offsetWidth;
    m.classList.remove('opacity-0');
    s.classList.remove('scale-75');
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
        // Bersihkan sisa inline style dari swipe-to-dismiss
        s.style.transform = '';
        s.style.transition = '';
        // Forced reflow
        void m.offsetWidth;
        m.classList.remove('opacity-0');
        if(sheetId === 'global-settings-sheet') { s.classList.remove('translate-x-full'); }
        else if(isScale && (sheetId === 'raw-backup-sheet' || sheetId === 'raw-restore-sheet' || sheetId === 'backup-type-sheet' || sheetId === 'pdf-mode-sheet' || sheetId === 'custom-dialog-sheet')) { s.classList.remove('scale-75', 'translate-y-12'); }
        else { s.classList.remove('translate-y-full'); }
    }
}

window._closeModalAction = function(modalId, sheetId, isScale = false, isFromHistory = false) {
    if (!isFromHistory) { history.back(); return; }
    const m = document.getElementById(modalId); const s = document.getElementById(sheetId);
    if(m && s) {
        s.style.transform = '';
        s.style.transition = '';
        requestAnimationFrame(() => {
            if(sheetId === 'global-settings-sheet') { s.classList.add('translate-x-full'); }
            else if(isScale && (sheetId === 'raw-backup-sheet' || sheetId === 'raw-restore-sheet' || sheetId === 'backup-type-sheet' || sheetId === 'pdf-mode-sheet' || sheetId === 'custom-dialog-sheet')) { s.classList.add('scale-75', 'translate-y-12'); }
            else { s.classList.add('translate-y-full'); }
            m.classList.add('opacity-0');
            setTimeout(() => m.classList.add('hidden'), 300);
        });
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
                        // PDF sudah terkompresi secara internal â€” DEFLATE ulang cuma makan RAM & CPU
                        // tanpa hasil signifikan, dan inilah penyebab utama force-close di HP RAM kecil.
                        if (rawPdf) canvasFolder.file(`${b.id}.pdf`, rawPdf, { compression: "STORE" });
                    } else {
                        const nodes = await localforage.getItem('content_' + b.id);
                        if (nodes) contentsFolder.file(`${b.id}.json`, JSON.stringify(nodes), { compression: "DEFLATE", compressionOptions: { level: 1 } });
                    }
                    
                    const cover = await localforage.getItem('cover_' + b.id);
                    if (cover) coversFolder.file(`${b.id}.txt`, cover, { compression: "STORE" });
                }

                // Level kompresi diturunkan (6 â†’ 1): jauh lebih hemat memori/CPU saat generate,
                // trade-off ukuran file sedikit lebih besar demi mencegah crash di HP low-RAM.
                const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 1 } });
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
            // PENTING: Filesystem.writeFile Capacitor crash/overflow memori di Android kalau
            // base64 yang dikirim sekali jalan > ~26MB (bug dikenal di Capacitor core).
            // Backup ZIP buku gampang lebih besar dari itu, jadi apa pun kompresinya tetap
            // force-close kalau ditulis sekaligus. Solusi: potong jadi chunk kecil (4MB),
            // tulis pakai writeFile untuk potongan pertama lalu appendFile untuk sisanya.
            const FS = window.Capacitor.Plugins.Filesystem;
            try { await FS.deleteFile({ path: filename, directory: 'DOCUMENTS' }); } catch(_) {} // jaga-jaga sisa file gagal sebelumnya
            const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per potongan â€” jauh di bawah batas crash
            let offset = 0;
            let isFirstChunk = true;
            while (offset < blob.size) {
                const slice = blob.slice(offset, offset + CHUNK_SIZE);
                const base64Chunk = await new Promise((resolve, reject) => {
                    const r = new FileReader();
                    r.onloadend = () => resolve(r.result.split(',')[1]);
                    r.onerror = reject;
                    r.readAsDataURL(slice);
                });
                if (isFirstChunk) {
                    await FS.writeFile({ path: filename, data: base64Chunk, directory: 'DOCUMENTS' });
                    isFirstChunk = false;
                } else {
                    await FS.appendFile({ path: filename, data: base64Chunk, directory: 'DOCUMENTS' });
                }
                offset += CHUNK_SIZE;
            }
            window.closeDialog();
            setTimeout(() => showDialog(successTitle, `${successDesc}\n\nDocuments:\n${filename}`, "check-circle", [{text: btnOk, primary: true}]), 400);
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
                                // Pertahankan pdfMode lokal â€” jangan timpa dengan mode dari backup
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

        // â”€â”€ definisikan dulu sebelum dipanggil â”€â”€

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
                    // Jangan paksa ganti pdfMode â€” pertahankan mode yang sudah ada di library
                    mergedLibrary[existingIndex] = {
                        ...mergedLibrary[existingIndex],
                        progressPct: meta.progressPct,
                        lastReadId: meta.lastReadId,
                        annotations: meta.annotations || [],
                        isPinned: meta.isPinned,
                        title: meta.title
                        // pdfMode TIDAK diubah â€” tetap ikut library lokal
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
    if(!DOM.grid || !DOM.scrollTopSlider || !DOM.canvasTopSlider) return;
    
    // Clear penampung dynamic grids
    if(DOM.scrollGrid) DOM.scrollGrid.innerHTML = '';
    if(DOM.canvasGrid) DOM.canvasGrid.innerHTML = '';
    if(DOM.grid) DOM.grid.innerHTML = ''; 
    if(DOM.scrollTopSlider) DOM.scrollTopSlider.innerHTML = '';
    if(DOM.canvasTopSlider) DOM.canvasTopSlider.innerHTML = '';
    
    const pinnedGrid = document.getElementById('pinned-book-grid');
    if(pinnedGrid) pinnedGrid.innerHTML = '';

    // Terapkan class kontainer sesuai mode Grid / List
    const isListMode = layoutMode === 'list';
    const gridClass = 'grid grid-cols-2 gap-4 w-full';
    const listClass = 'flex flex-col gap-4 w-full';
    [DOM.scrollGrid, DOM.canvasGrid, pinnedGrid].forEach(el => {
        if (!el) return;
        el.className = isListMode ? listClass : gridClass;
    });
    // Fungsi pembuat kartu untuk rak (bukan slider) mengikuti mode aktif
    const makeCard = (book, index) => isListMode ? createBookListItem(book, index) : createBookCard(book, false, index);
    
    let filteredLib = library;
    if(filterText) filteredLib = library.filter(b => b.title.toLowerCase().includes(filterText.toLowerCase()));
    
    const d = i18n[wikiLang] || i18n['id'];
    if(DOM.count) DOM.count.textContent = `${filteredLib.length} ${d.booksCount}`;
    
    const pinnedBooks = filteredLib.filter(b => b.isPinned);
    const regularBooks = filteredLib.filter(b => !b.isPinned);

    // Pilah Regular Books menjadi 2 Rak: Scroll Mode & Canvas Mode
    const scrollBooks = regularBooks.filter(b => b.pdfMode !== 'canvas');
    const canvasBooks = regularBooks.filter(b => b.pdfMode === 'canvas');

    // "Lanjutkan Membaca" dipisah per-tab: masing-masing hanya menampilkan buku dari raknya sendiri
    let scrollTopBooks = [], canvasTopBooks = [];
    if (!filterText) {
        scrollTopBooks = scrollBooks.filter(b => b.progressPct > 0).sort((a,b) => b.progressPct - a.progressPct).slice(0, 4);
        canvasTopBooks = canvasBooks.filter(b => b.progressPct > 0).sort((a,b) => b.progressPct - a.progressPct).slice(0, 4);
    }
    if (scrollTopBooks.length > 0 && DOM.scrollTopSection) {
        DOM.scrollTopSection.classList.remove('hidden');
        scrollTopBooks.forEach((book, idx) => { DOM.scrollTopSlider.appendChild(createBookCard(book, true, idx)); });
        const spacer = document.createElement('div'); spacer.className = "w-2 shrink-0 snap-align-none"; DOM.scrollTopSlider.appendChild(spacer);
    } else if (DOM.scrollTopSection) { DOM.scrollTopSection.classList.add('hidden'); }

    if (canvasTopBooks.length > 0 && DOM.canvasTopSection) {
        DOM.canvasTopSection.classList.remove('hidden');
        canvasTopBooks.forEach((book, idx) => { DOM.canvasTopSlider.appendChild(createBookCard(book, true, idx)); });
        const spacer = document.createElement('div'); spacer.className = "w-2 shrink-0 snap-align-none"; DOM.canvasTopSlider.appendChild(spacer);
    } else if (DOM.canvasTopSection) { DOM.canvasTopSection.classList.add('hidden'); }
    
    const pinnedSection = document.getElementById('pinned-books-section');
    if (pinnedBooks.length > 0) {
        if(pinnedSection) pinnedSection.classList.remove('hidden');
        pinnedBooks.forEach((book, idx) => { if(pinnedGrid) pinnedGrid.appendChild(makeCard(book, idx)); });
    } else {
        if(pinnedSection) pinnedSection.classList.add('hidden');
    }

    if (scrollBooks.length === 0) {
        if(DOM.scrollSection) DOM.scrollSection.classList.add('hidden');
    } else {
        if(DOM.scrollSection) DOM.scrollSection.classList.remove('hidden');
        scrollBooks.forEach((book, index) => { if(DOM.scrollGrid) DOM.scrollGrid.appendChild(makeCard(book, index)); });
    }

    if (canvasBooks.length === 0) {
        if(DOM.canvasSection) DOM.canvasSection.classList.add('hidden');
    } else {
        if(DOM.canvasSection) DOM.canvasSection.classList.remove('hidden');
        canvasBooks.forEach((book, index) => { if(DOM.canvasGrid) DOM.canvasGrid.appendChild(makeCard(book, index + 100)); });
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
    initCoverObserver();
}

function initCoverObserver() {
    if (coverObserver) coverObserver.disconnect();

    coverObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const card = entry.target;
            const id = card.dataset.coverId;
            const baseClass = card.dataset.baseClass || '';
            const isListCover = card.dataset.coverMode === 'list';
            if (!id) { obs.unobserve(card); return; }

            localforage.getItem('cover_' + id).then(coverData => {
                if (!coverData) return;

                // Support format baru (Blob), base64 string, dan URL/object URL string secara bersamaan.
                // Validasi lama (length > 50) terlalu kaku dan bisa menggagalkan cover valid yang pendek
                // (mis. URL relatif atau path singkat). Sekarang cukup pastikan coverData tidak kosong.
                let coverUrl = null;
                if (coverData instanceof Blob) {
                    coverUrl = URL.createObjectURL(coverData);
                } else if (typeof coverData === 'string' && coverData.trim().length > 0) {
                    // Deteksi otomatis: base64 data URI, blob:/http(s) URL, atau path/URL biasa â€” semua diterima
                    coverUrl = coverData.trim();
                } else if (coverData && typeof coverData === 'object' && typeof coverData.url === 'string') {
                    // Format URL object custom { url: '...' }
                    coverUrl = coverData.url;
                }
                if (!coverUrl) return;

                if (isListCover) {
                    // Mode List: cover polos di child div, tanpa overlay teks putih
                    const thumb = card.querySelector('.list-cover-thumb');
                    if (thumb) {
                        thumb.style.opacity = '0';
                        requestAnimationFrame(() => {
                            thumb.style.backgroundImage = `url('${coverUrl}')`;
                            thumb.style.opacity = '1';
                            const icon = thumb.querySelector('[data-lucide="book"]');
                            if (icon) icon.classList.add('hidden');
                        });
                    }
                    if (coverData instanceof Blob) {
                        const mo = new MutationObserver(() => {
                            if (!document.body.contains(card)) { URL.revokeObjectURL(coverUrl); mo.disconnect(); }
                        });
                        mo.observe(document.body, { childList: true, subtree: true });
                    }
                    obs.unobserve(card);
                    return;
                }

                // Transisi transparan -> solid saat gambar sampul diterapkan
                // Cari SEMUA instansi cover buku ini di DOM (rak utama + "Lanjutkan Membaca")
                // sekaligus, karena buku yang sama bisa muncul di lebih dari satu tempat.
                const coverEls = document.querySelectorAll(`.cover-img-target-${id}`);

                requestAnimationFrame(() => {
                    if (coverEls.length > 0) {
                        coverEls.forEach(coverEl => {
                            coverEl.style.backgroundImage = `url('${coverUrl}')`;
                            coverEl.style.backgroundSize = 'cover';
                            coverEl.style.backgroundPosition = 'center';
                            coverEl.style.backgroundRepeat = 'no-repeat';
                            coverEl.classList.remove('opacity-0');
                            coverEl.classList.add('opacity-100');
                        });
                    }

                    if (baseClass) card.classList.remove(...baseClass.split(' '));
                    card.classList.add('text-white', 'shadow-lg');

                    const overlay = document.getElementById(`overlay-${id}`);
                    if(overlay) overlay.classList.remove('hidden');

                    ['title-', 'top-icons-', 'pct-'].forEach(prefix => {
                        const el = document.getElementById(prefix + id);
                        if(el) el.classList.add('text-white');
                    });

                    const bar = document.getElementById(`bar-${id}`);
                    if(bar) { bar.classList.remove('bg-m3-primary', 'dark:bg-m3-primaryContainer'); bar.classList.add('bg-white'); }

                    const icon = document.getElementById(`book-icon-${id}`);
                    if(icon) icon.classList.add('hidden');
                });

                // Revoke ObjectURL saat card dihapus dari DOM agar tidak leak
                if (coverData instanceof Blob) {
                    const mo = new MutationObserver(() => {
                        if (!document.body.contains(card)) { URL.revokeObjectURL(coverUrl); mo.disconnect(); }
                    });
                    mo.observe(document.body, { childList: true, subtree: true });
                }
            });

            obs.unobserve(card);
        });
    }, { root: null, rootMargin: '200px', threshold: 0.01 });

    document.querySelectorAll('.lazy-cover').forEach(el => coverObserver.observe(el));
}

function createBookCard(book, isSlider = false, index = 0, isSearch = false) {
    const progress = book.progressPct || 0;
    const card = document.createElement('div');
    const isList = !isSlider && layoutMode === 'list';
    const widthClass = isSlider ? 'w-[110px] sm:w-[130px] snap-start' : 'w-full';
    card.className = `${isSlider || isSearch ? '' : 'card-morph'} lazy-cover outline-none ring-0 relative ${isList ? 'flex gap-4 items-center w-full mb-4' : `flex flex-col ${widthClass} shrink-0`}`;
    card.dataset.coverId = book.id;
    let batchOverlayHTML = !isSlider ? `
        <div class="batch-overlay absolute inset-0 z-20 transition-all duration-300 pointer-events-none rounded-xl" data-book-id="${book.id}" style="display: none; opacity: 0; background-color: transparent;">
            <div class="batch-icon-box absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"></div>
        </div>
    ` : '';
    card.innerHTML = `
        ${batchOverlayHTML}
        <div class="relative overflow-hidden shadow-sm bg-m3-surfaceVariant rounded-xl flex-shrink-0" style="${isList ? 'width: 80px; aspect-ratio: 2/3;' : 'width: 100%; aspect-ratio: 2/3;'}">
            <div class="cover-img-target-${book.id} bg-cover bg-center bg-no-repeat w-full h-full absolute inset-0 transition-opacity duration-300 opacity-0"></div>
            <div class="absolute inset-0 bg-black/5 pointer-events-none"></div>
            <div class="absolute top-2 left-2 flex gap-1 z-10">
                ${book.isPinned ? `<div class="bg-m3-secondaryContainer/90 rounded-md p-0.5 shadow-sm"><i data-lucide="pin" class="w-3 h-3 text-m3-onSecondaryContainer"></i></div>` : ''}
            </div>
            ${isList ? `<div class="absolute bottom-0 left-0 right-0 h-1 bg-black/20"><div class="h-full bg-m3-primary" style="width: ${progress}%"></div></div>` : ''}
        </div>
        <div class="flex flex-col justify-start ${isList ? 'flex-1 min-w-0' : 'mt-2 w-full'}">
            <div class="${isList ? '' : 'h-[2.5rem] flex items-start'}"><h3 class="font-bold text-m3-onSurface leading-tight line-clamp-2 book-title-text w-full ${isList ? 'text-sm' : 'text-xs'}">${book.title}</h3></div>
            ${!isList ? `<div class="w-full mt-2 h-1 bg-m3-surfaceVariant rounded-full overflow-hidden"><div class="h-full bg-m3-primary" style="width: ${progress}%"></div></div>` : ''}
            <div class="text-[10px] font-bold text-m3-onSurfaceVariant opacity-70 mt-1">${typeof i18n !== 'undefined' ? (i18n[typeof wikiLang !== 'undefined' ? wikiLang : 'id'].readProgress || '{p}% Dibaca').replace('{p}', progress) : progress + '% Dibaca'}</div>
        </div>
    `;
    let pressTimer = null; let isPressing = false; let hasLongPressed = false;
    const handleStart = (e) => {
        hasLongPressed = false;
        if(isBatchDeleteMode || isSlider || isSearch) return;
        isPressing = true;
        pressTimer = setTimeout(() => { if(isPressing){ hasLongPressed = true; window.openBookOptions(book.id); }}, 400);
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
                if (selectedForDelete.length === 0) {
                    window.toggleBatchDelete();
                    return;
                }
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

// --- LIST LAYOUT: baris horizontal (thumbnail 2:3 polos + judul di samping) ---
function createBookListItem(book, index = 0, isSearch = false) {
    const progress = book.progressPct || 0;
    const row = document.createElement('div');
    row.className = `${isSearch ? '' : 'card-morph'} lazy-cover w-full flex items-center gap-3 p-2 pr-3 rounded-2xl bg-m3-surfaceVariant/40 hover:bg-m3-surfaceVariant/70 transition-colors relative cursor-pointer border-none outline-none ring-0`;
    row.dataset.coverId = book.id;
    row.dataset.coverMode = 'list';

    const batchOverlayHTML = `
        <div class="batch-overlay absolute inset-0 z-20 transition-all duration-300 pointer-events-none rounded-2xl" data-book-id="${book.id}" style="display: none; opacity: 0; background-color: transparent;">
            <div class="batch-icon-box absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors"></div>
        </div>
    `;

    row.innerHTML = `
        ${batchOverlayHTML}
        <div class="list-cover-thumb bg-cover bg-center bg-no-repeat w-12 aspect-[2/3] shrink-0 rounded-lg bg-m3-surfaceVariant flex items-center justify-center overflow-hidden opacity-100" style="background-color: var(--md-sys-color-surface-variant);">
            <i data-lucide="book" class="w-5 h-5 opacity-50 pointer-events-none"></i>
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-1.5 pointer-events-none">
            <div class="flex items-center gap-1.5">
                ${book.isPinned ? `<i data-lucide="pin" class="w-3 h-3 text-m3-primary shrink-0"></i>` : ''}
                <h3 class="book-title-text font-bold text-sm text-m3-onSurfaceVariant leading-tight truncate">${book.title}</h3>
            </div>
            <div class="w-full flex items-center gap-2">
                <div class="h-1.5 flex-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-m3-primary rounded-full" style="width: ${progress}%"></div>
                </div>
                <span class="text-[10px] font-bold text-m3-onSurfaceVariant opacity-70 shrink-0">${progress}%</span>
            </div>
        </div>
    `;

    let pressTimer = null; let isPressing = false; let hasLongPressed = false;
    const handleStart = (e) => {
        hasLongPressed = false;
        if (isBatchDeleteMode || isSearch) return;
        isPressing = true;
        pressTimer = setTimeout(() => { if (isPressing) { hasLongPressed = true; window.openBookOptions(book.id); } }, 400);
    };
    const handleEnd = () => { isPressing = false; clearTimeout(pressTimer); };
    const handleMove = () => { isPressing = false; clearTimeout(pressTimer); };

    row.addEventListener('mousedown', handleStart); row.addEventListener('touchstart', handleStart, {passive: true});
    row.addEventListener('mouseup', handleEnd); row.addEventListener('touchend', handleEnd);
    row.addEventListener('mouseleave', handleMove); row.addEventListener('touchmove', handleMove, {passive: true});

    row.addEventListener('click', (e) => {
        if (hasLongPressed) { hasLongPressed = false; e.preventDefault(); e.stopPropagation(); return; }
        if (isBatchDeleteMode) {
            e.preventDefault(); e.stopPropagation();
            const strId = String(book.id);
            const idx = selectedForDelete.findIndex(id => String(id) === strId);
            if (idx > -1) {
                selectedForDelete.splice(idx, 1);
                if (selectedForDelete.length === 0) {
                    window.toggleBatchDelete();
                    return;
                }
            } else {
                selectedForDelete.push(strId);
            }
            window.updateBatchSelectionUI();
            return;
        }
        window.openBook(book);
    });

    return row;
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
        if (initialSelectId && !selectedForDelete.includes(String(initialSelectId))) {
            selectedForDelete.push(String(initialSelectId));
        }
    }
    document.body.classList.toggle('batch-mode-active', isBatchDeleteMode);
    
    const bar = document.getElementById('batch-delete-bar');
    const fab = document.getElementById('fab-container');
    
    if (isBatchDeleteMode) {
        if(!isFromHistory) pushAppHistory('batch-delete');
        bar.classList.remove('translate-y-48', 'opacity-0', 'pointer-events-none');
        fab.classList.add('translate-y-32', 'opacity-0');
    } else {
        if(!isFromHistory && window.location.hash === '#batch-delete') history.back();
        bar.classList.add('translate-y-48', 'opacity-0', 'pointer-events-none');
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
    
    showDialog(d.optDelete || "Hapus Buku", d.deleteConfirm, "trash-2", [
        { text: d.cancel || "Batal", primary: false },
        { text: d.delete || "Hapus", primary: true, action: async () => {
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
    showDialog(d.optDelete || "Hapus Permanen", d.deleteConfirm, "trash-2", [
        { text: d.cancel || "Batal", primary: false },
        { text: d.delete || "Hapus", primary: true, action: async () => {
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
                // Update DOM secara langsung agar cover di galeri berubah seketika, tanpa perlu restart app
                // Target SEMUA instansi (rak utama + "Lanjutkan Membaca") sekaligus, bukan cuma satu.
                document.querySelectorAll(`.cover-img-target-${id}`).forEach(coverEl => {
                    coverEl.style.backgroundImage = 'url(' + e.target.result + ')';
                    coverEl.style.backgroundSize = 'cover';
                    coverEl.style.backgroundPosition = 'center';
                    coverEl.style.backgroundRepeat = 'no-repeat';
                    coverEl.classList.remove('opacity-0');
                    coverEl.classList.add('opacity-100');
                });
                // Elemen versi list mode (thumbnail polos di .list-cover-thumb)
                document.querySelectorAll(`[data-cover-id="${id}"][data-cover-mode="list"] .list-cover-thumb`).forEach(thumb => {
                    thumb.style.backgroundImage = 'url(' + e.target.result + ')';
                    thumb.style.opacity = '1';
                    const icon = thumb.querySelector('[data-lucide="book"]');
                    if (icon) icon.classList.add('hidden');
                });
                history.back(); renderLibrary(); 
            }; 
            reader.readAsDataURL(coverFile); 
        } else { await localforage.setItem('pdf_epub_master', library); history.back(); renderLibrary(); }
    }
}

// 9. TEMA & TIPOGRAFI
// UI (panel, side panel, bottom bar, dll) SELALU Dark Mode â€” tidak bisa diubah user.
// light/dark/amoled HANYA berlaku untuk konten BUKU (scroll & canvas), lihat applyReaderThemeToDOM().
function applyThemeToDOM() {
    document.documentElement.classList.add('dark'); // UI selalu dark

    const _palettes = (typeof EXPRESSIVE_PALETTES !== 'undefined' && typeof STANDARD_PALETTES !== 'undefined')
        ? (isExpressive ? EXPRESSIVE_PALETTES : STANDARD_PALETTES)
        : (typeof EXPRESSIVE_PALETTES !== 'undefined' ? EXPRESSIVE_PALETTES : (typeof M3_PALETTES !== 'undefined' ? M3_PALETTES : null));
    if (_palettes) {
        let rootVars = _palettes[currentThemeKey]['dark'];
        const dynamicTheme = document.getElementById('dynamic-theme');
        if(dynamicTheme) dynamicTheme.innerHTML = `:root { ${rootVars} }`;
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if(metaTheme) metaTheme.setAttribute("content", "#0B0314");

_syncExpressiveUI();
    if(window.lucide) window.lucide.createIcons();
    localStorage.setItem('m3-key', currentThemeKey);

    applyReaderThemeToDOM();
    window.setPageTurnAnim(pageTurnAnimEnabled);
}

window.setTheme = function(key) { currentThemeKey = key; applyThemeToDOM(); };
window.toggleExpressive = function() {
    isExpressive = !isExpressive;
    localStorage.setItem('expressive', isExpressive.toString());
    applyThemeToDOM();
};

function _syncExpressiveUI() {
    const bg   = document.getElementById('expressive-switch-bg');
    const knob = document.getElementById('expressive-switch-knob');
    if (!bg || !knob) return;
    if (isExpressive) {
        bg.classList.add('bg-m3-primary');
        bg.classList.remove('bg-gray-500/40');
        knob.style.transform = 'translateX(32px)';
        knob.classList.replace('bg-m3-onSurface', 'bg-m3-onPrimary');
    } else {
        bg.classList.remove('bg-m3-primary');
        bg.classList.add('bg-gray-500/40');
        knob.style.transform = 'translateX(0)';
        knob.classList.replace('bg-m3-onPrimary', 'bg-m3-onSurface');
    }
    localStorage.setItem('expressive', isExpressive.toString());
}
// â”€â”€ Global Loading Spinner (untuk jeda antar modal / proses berat) â”€â”€
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

// â”€â”€ TEMA KONTEN BUKU (scroll & canvas) â€” light/dark/amoled â”€â”€
// Terpisah total dari tema UI (yang selalu dark). Diterapkan secara scoped
// ke #reader-view lewat CSS variable override + atribut data-reader-theme.
window.setPageTurnAnim = function(enabled) {
    pageTurnAnimEnabled = !!enabled;
    localStorage.setItem('page_turn_anim', pageTurnAnimEnabled ? 'true' : 'false');
    const container = document.getElementById('canvas-container');
    if (container) container.classList.toggle('page-turn-3d', pageTurnAnimEnabled);

    const onBtn = document.getElementById('pageturn-btn-on');
    const offBtn = document.getElementById('pageturn-btn-off');
    if (onBtn && offBtn) {
        [onBtn, offBtn].forEach(el => { el.classList.remove('bg-m3-primary', 'text-m3-onPrimary'); el.classList.add('text-m3-onSurfaceVariant'); });
        const active = pageTurnAnimEnabled ? onBtn : offBtn;
        active.classList.add('bg-m3-primary', 'text-m3-onPrimary');
        active.classList.remove('text-m3-onSurfaceVariant');
    }
};

window.setReaderTheme = function(mode) {
    if (mode !== 'light' && mode !== 'dark' && mode !== 'amoled') mode = 'dark';
    readerTheme = mode;
    localStorage.setItem('reader_theme', readerTheme);
    applyReaderThemeToDOM();
};

function applyReaderThemeToDOM() {
    const readerView = document.getElementById('reader-view');
    if (readerView) readerView.setAttribute('data-reader-theme', readerTheme);

    // Override variabel warna M3 khusus untuk konten buku
    const _palettes = (typeof EXPRESSIVE_PALETTES !== 'undefined' && typeof STANDARD_PALETTES !== 'undefined')
        ? (isExpressive ? EXPRESSIVE_PALETTES : STANDARD_PALETTES)
        : (typeof EXPRESSIVE_PALETTES !== 'undefined' ? EXPRESSIVE_PALETTES : (typeof M3_PALETTES !== 'undefined' ? M3_PALETTES : null));
    let readerCss = '';
    if (_palettes) {
        if (readerTheme === 'light') {
            readerCss = _palettes[currentThemeKey]['light'];
        } else if (readerTheme === 'dark') {
            readerCss = _palettes[currentThemeKey]['dark'];
        } else if (readerTheme === 'amoled') {
            readerCss = _palettes[currentThemeKey]['dark'] + `--md-sys-color-background:#000000;--md-sys-color-surface:#000000;`;
        }
    }
    const readerStyleEl = document.getElementById('reader-theme-style');
    if (readerStyleEl) {
        if (readerCss) {
            readerStyleEl.innerHTML = `
                #reader-content, #reader-inner, #canvas-wrapper { ${readerCss} }
                #reader-content {
                    background-color: var(--md-sys-color-background) !important;
                    color: var(--md-sys-color-on-background) !important;
                }
                #reader-inner { color: var(--md-sys-color-on-background) !important; }
            `;
        } else {
            readerStyleEl.innerHTML = '';
        }
    }

    // Sinkronkan tombol Light/Dark/AMOLED di panel pengaturan buku
    const tl = document.getElementById('theme-btn-light');
    const td = document.getElementById('theme-btn-dark');
    const ta = document.getElementById('theme-btn-amoled');
    if (tl && td && ta) {
        [tl, td, ta].forEach(el => {
            el.classList.remove('bg-m3-primary', 'text-m3-onPrimary');
            el.classList.add('text-m3-onSurfaceVariant');
            el.classList.remove('amoled-unavailable');
        });
        const active = readerTheme === 'light' ? tl : (readerTheme === 'amoled' ? ta : td);
        active.classList.add('bg-m3-primary', 'text-m3-onPrimary');
        active.classList.remove('text-m3-onSurfaceVariant');
    }

    // Canvas: terapkan filter invert berdasarkan tema buku
    // PENTING: filter HANYA diterapkan ke canvas (anak), bukan wrapper â€”
    // jika keduanya difilter, efeknya saling membatalkan (double invert).
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvasPrev = document.getElementById('canvas-prev');
    const canvasNext = document.getElementById('canvas-next');
    const pdfCanvas = document.getElementById('pdf-canvas');
    [canvasPrev, canvasNext, pdfCanvas].forEach(el => {
        if (!el) return;
        if (readerTheme === 'amoled') {
            el.style.filter = 'invert(1) hue-rotate(180deg) contrast(1.1)';
        } else if (readerTheme === 'dark') {
            el.style.filter = 'invert(0.92) hue-rotate(180deg)';
        } else {
            el.style.filter = '';
        }
    });
    if (canvasWrapper) {
        canvasWrapper.style.backgroundColor = (readerTheme === 'amoled') ? '#000000' : '';
    }
}

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
    applyReaderThemeToDOM();
    
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

        // Aktifkan progress bar interaktif (geser/ketuk untuk lompat halaman)
        const progContainerEl = document.getElementById('progress-container');
        const dragHandleEl = document.getElementById('progress-drag-handle');
        if (progContainerEl) progContainerEl.classList.add('progress-draggable');
        if (dragHandleEl) dragHandleEl.classList.remove('hidden');

        // Terapkan AMOLED ke canvas wrapper jika aktif
        applyThemeToDOM();

        // Redupkan grup setting tipografi (ukuran/perataan/font) â€” selalu nonaktif di Canvas Mode
        ['size', 'align', 'font'].forEach(grp => {
            const el = document.getElementById('setting-group-' + grp);
            if (el) el.classList.add('ui-disabled-group');
        });

        // Grup search: aktif jika PDF Canvas punya teks yang bisa diekstrak, abu-abu jika hanya gambar
        const searchGroupEl = document.getElementById('setting-group-search');
        if (searchGroupEl) searchGroupEl.classList.remove('ui-disabled-group');
        await window.updateCanvasSearchAvailability(book.id);

        // Tampilkan area "Lompat ke Halaman" (khusus Canvas Mode)
        const jumpAreaEl = document.getElementById('canvas-jump-area');
        if (jumpAreaEl) jumpAreaEl.classList.remove('hidden');

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

        // Nonaktifkan progress bar interaktif (mode scroll pakai progress scroll biasa)
        const progContainerEl2 = document.getElementById('progress-container');
        const dragHandleEl2 = document.getElementById('progress-drag-handle');
        if (progContainerEl2) progContainerEl2.classList.remove('progress-draggable');
        if (dragHandleEl2) dragHandleEl2.classList.add('hidden');

        // Kembalikan visibilitas grup setting secara utuh
        ['size', 'align', 'font', 'search'].forEach(grp => {
            const el = document.getElementById('setting-group-' + grp);
            if (el) el.classList.remove('ui-disabled-group');
        });
        // Reset indikator PDF Canvas tanpa teks & kapsul pencarian (mode scroll selalu bisa cari)
        const imgWarnEl = document.getElementById('search-canvas-image-warning');
        if (imgWarnEl) imgWarnEl.classList.add('hidden');
        // Sembunyikan area "Lompat ke Halaman" (hanya untuk Canvas Mode)
        const jumpAreaEl2 = document.getElementById('canvas-jump-area');
        if (jumpAreaEl2) jumpAreaEl2.classList.add('hidden');
        const searchCapsuleEl = document.getElementById('inbook-search-capsule');
        if (searchCapsuleEl) searchCapsuleEl.classList.remove('search-disabled-canvas');
        const searchInputEl = document.getElementById('inbook-search-input');
        if (searchInputEl) {
            searchInputEl.disabled = false;
            const dNow = i18n[wikiLang] || i18n['id'];
            searchInputEl.placeholder = dNow.searchPlaceholder || 'Cari dalam buku...';
        }

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

// --- RENDER STABILO CANVAS (Kotak Highlight atas halaman PDF) ---
window.renderCanvasHighlights = function(pageNum) {
    const hlLayer = document.getElementById('canvas-highlight-layer');
    if (!hlLayer || !activeBookId) return;
    hlLayer.innerHTML = '';

    const book = library.find(b => b.id === activeBookId);
    if (!book || !book.annotations) return;

    const pageAnnots = book.annotations.filter(a => parseInt(a.nodeIdx) === pageNum && a.rects && a.rects.length > 0);
    pageAnnots.forEach(annot => {
        let colorCode = "rgba(103, 80, 164, 0.4)"; // Default ungu (M3 primary)
        if (annot.color === 'yellow') colorCode = "rgba(250, 204, 21, 0.45)";
        if (annot.color === 'green')  colorCode = "rgba(74, 222, 128, 0.45)";
        if (annot.color === 'pink')   colorCode = "rgba(244, 114, 182, 0.45)";

        annot.rects.forEach(r => {
            const box = document.createElement('div');
            box.className = 'canvas-annot-hl absolute rounded-[2px]';
            box.style.left            = r.left + 'px';
            box.style.top             = r.top + 'px';
            box.style.width           = r.width + 'px';
            box.style.height          = r.height + 'px';
            box.style.backgroundColor = colorCode;
            hlLayer.appendChild(box);
        });
    });
};

// --- ENGINE RENDER CANVAS PDF ---

// Cek apakah PDF Canvas punya teks yang bisa diekstrak (content_<id>).
// Jika ya: kapsul pencarian tetap aktif & placeholder normal.
// Jika tidak (PDF hanya gambar/scan): kapsul pencarian dibuat abu-abu & muncul indikator "PDF hanya gambar".
window.updateCanvasSearchAvailability = async function(bookId) {
    const searchCapsuleEl = document.getElementById('inbook-search-capsule');
    const searchInputEl   = document.getElementById('inbook-search-input');
    const imgWarnEl       = document.getElementById('search-canvas-image-warning');
    const searchResEl     = document.getElementById('search-results-panel');
    const dNow = (typeof i18n !== 'undefined' && i18n[wikiLang]) ? i18n[wikiLang] : (i18n ? i18n['id'] : {});

    let pageTextData = null;
    try { pageTextData = await localforage.getItem('content_' + bookId); } catch(e) { pageTextData = null; }

    const hasText = Array.isArray(pageTextData) && pageTextData.some(p => p && p.text && p.text.trim().length > 0);

    if (hasText) {
        if (searchCapsuleEl) searchCapsuleEl.classList.remove('search-disabled-canvas');
        if (searchInputEl) {
            searchInputEl.disabled = false;
            searchInputEl.placeholder = dNow.searchPlaceholder || 'Cari dalam buku...';
        }
        if (imgWarnEl) imgWarnEl.classList.add('hidden');
    } else {
        if (searchCapsuleEl) searchCapsuleEl.classList.add('search-disabled-canvas');
        if (searchInputEl) {
            searchInputEl.disabled = true;
            searchInputEl.value = '';
        }
        if (searchResEl) searchResEl.classList.add('hidden');
        if (imgWarnEl) imgWarnEl.classList.remove('hidden');
    }
};


// [FIX RACE CONDITION] Token unik per-request render. Jika token berubah saat
// pre-render berjalan, render tersebut dibatalkan agar worker PDF.js tidak bentrok.
let _renderToken = 0;

// [FIX FLICKER] Flag: true jika canvas-current sudah diisi pixel-copy dari buffer
// oleh gesture, sehingga render ulang ke pdf-canvas bisa dilewati.
let _canvasAlreadyCopied = false;

async function renderCanvasPage(pageNum) {
    if (!currentPdfDoc) return;

    // BATALKAN SEMUA RENDER SEBELUMNYA SAAT GESER CEPAT
    if (activeRenderTasks.main) { activeRenderTasks.main.cancel(); activeRenderTasks.main = null; }
    if (activeRenderTasks.next) { activeRenderTasks.next.cancel(); activeRenderTasks.next = null; }
    if (activeRenderTasks.prev) { activeRenderTasks.prev.cancel(); activeRenderTasks.prev = null; }

    // [FIX RACE CONDITION] Naikkan token â€” pre-render lama (jika ada) akan berhenti sendiri
    const myToken = ++_renderToken;

    const canvas  = document.getElementById('pdf-canvas');
    const wrapper = document.getElementById('canvas-wrapper');

    try {
        const vpEl = document.getElementById('canvas-zoom-viewport');
        if (!canvas || !wrapper || !vpEl) return;

        const pixelRatio  = window.devicePixelRatio || 1;
        const renderScale = pixelRatio * 3.0; // Tetap 3.0 (Resolusi HD Terjaga)
        const cW = vpEl.clientWidth;
        const cH = vpEl.clientHeight;

        // Hitung dimensi dari halaman aktif (diperlukan untuk ukuran wrapper)
        const page = await currentPdfDoc.getPage(pageNum);
        if (myToken !== _renderToken) return; // dibatalkan

        const nat = page.getViewport({ scale: 1 });
        const fit = page.getViewport({ scale: cW / nat.width });
        const dW  = Math.floor(fit.width);
        const dH  = Math.floor(fit.height);

        // Selalu sesuaikan ukuran wrapper & metadata (dibutuhkan zoom/pan)
        wrapper.style.width  = dW + 'px';
        wrapper.style.height = dH + 'px';
        wrapper._W  = dW;
        wrapper._H  = dH;
        wrapper._cW = cW;
        wrapper._cH = cH;

        // [FIX FLICKER] Jika canvas sudah diisi oleh pixel-copy dari gesture swipe,
        // lewati render PDF.js ke pdf-canvas â€” gambarnya sudah ada, tidak perlu menggambar ulang.
        if (_canvasAlreadyCopied) {
            _canvasAlreadyCopied = false; // reset flag, hanya berlaku sekali
        } else {
            // Render normal: gambar halaman ke canvas utama
            canvas.width        = dW * renderScale;
            canvas.height       = dH * renderScale;
            canvas.style.width  = dW + 'px';
            canvas.style.height = dH + 'px';
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            activeRenderTasks.main = page.render({
                canvasContext: ctx,
                viewport: fit,
                transform: [renderScale, 0, 0, renderScale, 0, 0]
            });
            try {
                await activeRenderTasks.main.promise;
            } catch (err) {
                if (err.name === 'RenderingCancelledException') return; // Dibatalkan otomatis
            }
            if (myToken !== _renderToken) return;
        }

        // [FIX HALAMAN PUTIH SAAT DRAG] Mulai render buffer next & prev SEDINI MUNGKIN,
        // PARALEL (Promise.all) â€” bukan satu-satu lagi. Tetap nunggu render halaman utama
        // kelar dulu (biar worker PDF.js gak dibebani 3 render bersamaan), tapi setelahnya
        // next & prev jalan BARENG, jadi 2x lebih cepat siap. Jalan di background,
        // gak diblokir/blokir textLayer-highlight-progress bar di bawah.
        Promise.all([
            renderCanvasBuffer(pageNum + 1, 'canvas-next', myToken, 'next'),
            renderCanvasBuffer(pageNum - 1, 'canvas-prev', myToken, 'prev')
        ]);

        // --- RENDER TEXTLAYER TRANSPARAN (untuk text selection di Canvas Mode) ---
        const textLayerDiv = document.getElementById('canvas-text-layer');
        if (textLayerDiv) {
            // Kosongkan layer sebelumnya agar tidak menumpuk dari halaman sebelumnya
            textLayerDiv.innerHTML = '';
            // Sesuaikan ukuran layer agar identik dengan canvas yang ditampilkan
            textLayerDiv.style.width  = dW + 'px';
            textLayerDiv.style.height = dH + 'px';
            textLayerDiv.style.setProperty('--scale-factor', '1'); // FIX AKURASI PDF.JS
            try {
                const textContent = await page.getTextContent();
                if (myToken !== _renderToken) return;
if (typeof pdfjsLib !== 'undefined' && pdfjsLib.renderTextLayer) {
                    const renderTask = pdfjsLib.renderTextLayer({
                        textContent: textContent,
                        container: textLayerDiv,
                        viewport: fit,
                        textDivs: []
                    });
                    // Setelah TextLayer selesai, highlight keyword pencarian jika ada
                    Promise.resolve(renderTask && renderTask.promise ? renderTask.promise : renderTask).then(() => {
                        const kw = window.activeCanvasSearchKeyword;
                        if (!kw || kw.length < 2) return;
                        const spans = textLayerDiv.querySelectorAll('span');
                        const kwLower = kw.toLowerCase();
                        spans.forEach(span => {
                            if (!span.textContent.toLowerCase().includes(kwLower)) return;
                            const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            // Bungkus teks yang cocok dengan <mark>
                            span.innerHTML = span.textContent.replace(regex,
                                '<mark class="search-hl canvas-search-hl">$1</mark>');
                        });

                        // Highlight hanya bertahan sebentar â€” mulai memudar setelah 2 detik,
                        // lalu lepas wrapper <mark> setelah transisi selesai.
                        setTimeout(() => {
                            const marks = textLayerDiv.querySelectorAll('mark.canvas-search-hl');
                            marks.forEach(m => m.classList.add('canvas-search-hl-fade'));
                            setTimeout(() => {
                                textLayerDiv.querySelectorAll('mark.canvas-search-hl').forEach(m => {
                                    const parent = m.parentNode;
                                    if (!parent) return;
                                    parent.replaceChild(document.createTextNode(m.textContent), m);
                                    parent.normalize();
                                });
                            }, 1000);
                        }, 2000);

                        // Reset keyword aktif agar halaman selanjutnya (next/prev/jump) tidak ikut di-highlight
                        window.activeCanvasSearchKeyword = "";
                    }).catch(() => {});
                }
            } catch(tlErr) {
                console.warn('TextLayer render error:', tlErr);
            }
        }
        // Pastikan wrapper kembali ke posisi tengah (transform dikelola _resetCanvasTransform)
        wrapper.style.transition = 'none';
        wrapper.style.transform  = `translate(0px,0px) scale(${window.defaultCanvasScale})`;

        // --- RENDER STABILO: set ukuran layer & gambar highlight untuk halaman ini ---
        const hlLayer = document.getElementById('canvas-highlight-layer');
        if (hlLayer) {
            hlLayer.style.width  = dW + 'px';
            hlLayer.style.height = dH + 'px';
            window.renderCanvasHighlights(pageNum);
        }

        const lbl = document.getElementById('canvas-page-num');
        if (lbl) lbl.textContent = pageNum;
        const total = currentPdfDoc.numPages;
        const pct = total > 1 ? Math.round(((pageNum - 1) / (total - 1)) * 100) : 100;
        if (DOM.progBar) DOM.progBar.style.width = `${pct}%`;
        if (DOM.progTxt) DOM.progTxt.textContent = `${pct}%`;
        const dragHandle = document.getElementById('progress-drag-handle');
        if (dragHandle) dragHandle.style.left = `${pct}%`;
        // Update placeholder input "Lompat ke Halaman" agar menunjukkan posisi saat ini
        const jumpInputEl = document.getElementById('canvas-jump-input');
        if (jumpInputEl && document.activeElement !== jumpInputEl) {
            jumpInputEl.placeholder = `Halaman ${pageNum} / ${total}`;
            jumpInputEl.max = total;
        }
        updateBookProgress(activeBookId, pageNum, pct);
        renderBookmarkPanel();

    } catch (e) {
        console.error('renderCanvasPage:', e);
    }
}

// [PRE-RENDER BUFFER] Fungsi terisolasi untuk merender satu halaman ke canvas buffer.
// Menggunakan scale yang identik dengan render utama (fit-to-viewport-width),
// BUKAN currentCanvasScale â€” agar dimensi fisik canvas selalu benar dan tidak 0Ã—0.
async function renderCanvasBuffer(pageNum, canvasId, token, taskKey) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !currentPdfDoc) return;

    // Out of bounds: kosongkan canvas agar tidak menampilkan sisa halaman lama
    if (pageNum < 1 || pageNum > currentPdfDoc.numPages) {
        canvas.width = 0; canvas.height = 0;
        canvas.style.width = '0px'; canvas.style.height = '0px';
        return;
    }

    // Batalkan jika sudah ada request render utama yang lebih baru
    if (token !== _renderToken) return;

    try {
        const vpEl = document.getElementById('canvas-zoom-viewport');
        if (!vpEl) return;

        const page = await currentPdfDoc.getPage(pageNum);
        if (token !== _renderToken) return; // cek ulang setelah async

        // [KUNCI DIMENSI] Scale identik dengan render utama: fit lebar viewport
        const cW          = vpEl.clientWidth;
        const pixelRatio  = window.devicePixelRatio || 1;
        const renderScale = pixelRatio * 3.0;

        const nat = page.getViewport({ scale: 1 });
        const fit = page.getViewport({ scale: cW / nat.width });
        const dW  = Math.floor(fit.width);
        const dH  = Math.floor(fit.height);

        // [KUNCI DIMENSI] Set dimensi fisik SEBELUM render agar canvas tidak 0Ã—0 saat di-swipe
        canvas.width        = dW * renderScale;
        canvas.height       = dH * renderScale;
        canvas.style.width  = dW + 'px';
        canvas.style.height = dH + 'px';

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        activeRenderTasks[taskKey] = page.render({
            canvasContext: ctx,
            viewport: fit,
            transform: [renderScale, 0, 0, renderScale, 0, 0]
        });
        try {
            await activeRenderTasks[taskKey].promise;
        } catch(err) {
            if (err.name === 'RenderingCancelledException') return; // Dibatalkan otomatis
        }

    } catch(err) {
        console.warn(`[buffer] render gagal halaman ${pageNum}:`, err);
    }
}

window.nextCanvasPage = function() {
    if (!currentPdfDoc || currentCanvasPage >= currentPdfDoc.numPages) return;
    currentCanvasPage++;
    _resetCanvasTransform();
    window.getSelection().removeAllRanges();
    window.hideSelectionMenu();
    renderCanvasPage(currentCanvasPage); // fire & forget â€” tidak pakai await agar tap langsung direspon
};
window.prevCanvasPage = function() {
    if (!currentPdfDoc || currentCanvasPage <= 1) return;
    currentCanvasPage--;
    _resetCanvasTransform();
    window.getSelection().removeAllRanges();
    window.hideSelectionMenu();
    renderCanvasPage(currentCanvasPage);
};

function _resetCanvasTransform() {
    currentCanvasScale = window.defaultCanvasScale;
    canvasTranslateX   = 0;
    canvasTranslateY   = 0;
    canvasIsPinching   = false;
    const w = document.getElementById('canvas-wrapper');
    if (w) { w.style.transition = 'none'; w.style.transform = `translate(0px,0px) scale(${currentCanvasScale})`; }
    // canvas-prev/next kini absolute di dalam wrapper â€” otomatis ikut reset bersama wrapper
    // Jaga-jaga: pastikan page-stage tidak "nyangkut" transparan kalau ada gesture animasi
    // page-turn yang ke-interrupt di tengah jalan (fail-safe untuk trik fade swap).
    const ps = document.getElementById('page-stage');
    if (ps) { ps.style.transition = 'none'; ps.style.opacity = '1'; }
    const cn = document.getElementById('canvas-next');
    const cp = document.getElementById('canvas-prev');
    if (cn) { cn.style.transition = 'none'; cn.style.transform = 'translate(0px, 0px)'; }
    if (cp) { cp.style.transition = 'none'; cp.style.transform = 'translate(0px, 0px)'; }
}

window.toggleZoomSlider = function() {
    const container = document.getElementById('canvas-zoom-slider-container');
    if (!container) return;
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        const sliderEl = document.getElementById('canvas-default-zoom');
        const valEl    = document.getElementById('canvas-zoom-val');
        if (sliderEl) sliderEl.value = window.defaultCanvasScale;
        if (valEl)    valEl.textContent = window.defaultCanvasScale.toFixed(1) + 'x';
        requestAnimationFrame(() => { container.classList.remove('opacity-0', 'translate-y-4'); });
        pushAppHistory('zoom-slider');
    } else {
        _closeZoomSlider();
    }
};

function _closeZoomSlider(fromHistory = false) {
    const container = document.getElementById('canvas-zoom-slider-container');
    if (!container || container.classList.contains('hidden')) return;
    container.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => container.classList.add('hidden'), 300);
    if (!fromHistory && window.location.hash === '#zoom-slider') history.back();
}

// Zoom step: +0.1 atau -0.1 per ketuk
window.stepZoom = function(delta) {
    const sliderEl = document.getElementById('canvas-default-zoom');
    const valEl    = document.getElementById('canvas-zoom-val');
    const min = 0.5, max = 3.0;
    let val = Math.round((window.defaultCanvasScale + delta) * 10) / 10;
    val = Math.max(min, Math.min(max, val));
    window.defaultCanvasScale = val;
    localStorage.setItem('default_canvas_scale', val);
    if (sliderEl) sliderEl.value = val;
    if (valEl)    valEl.textContent = val.toFixed(1) + 'x';
    currentCanvasScale = val;
    canvasTranslateX   = 0;
    canvasTranslateY   = 0;
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
        if (typeof _applyCanvasTransform === 'function') _applyCanvasTransform(wrapper);
        else wrapper.style.transform = `translate(0px,0px) scale(${currentCanvasScale})`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const zoomSlider = document.getElementById('canvas-default-zoom');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const valEl = document.getElementById('canvas-zoom-val');
            if (valEl) valEl.textContent = val.toFixed(1) + 'x';
            window.defaultCanvasScale = val;
            localStorage.setItem('default_canvas_scale', val);

            // Terapkan langsung ke halaman aktif
            currentCanvasScale = val;
            canvasTranslateX   = 0;
            canvasTranslateY   = 0;
            const wrapper = document.getElementById('canvas-wrapper');
            if (wrapper) {
                if (typeof _applyCanvasTransform === 'function') _applyCanvasTransform(wrapper);
                else wrapper.style.transform = `translate(0px,0px) scale(${currentCanvasScale})`;
            }
        });
    }

    // Tutup zoom capsule saat tap di luar (overlay dismiss)
    // Pakai mousedown + touchstart, dan exclude tombol trigger agar tidak langsung tertutup
    function _zoomOutsideHandler(e) {
        const container = document.getElementById('canvas-zoom-slider-container');
        if (!container || container.classList.contains('hidden')) return;
        const pt = e.touches ? e.touches[0] : e;
        const target = document.elementFromPoint ? document.elementFromPoint(pt.clientX, pt.clientY) : e.target;
        // Cek apakah tap di dalam capsule
        if (container.contains(target)) return;
        // Cek apakah tap di tombol trigger zoom
        if (target && target.closest('[onclick*="toggleZoomSlider"]')) return;
        _closeZoomSlider();
    }
    document.addEventListener('mousedown', _zoomOutsideHandler);
    document.addEventListener('touchstart', _zoomOutsideHandler, { passive: true });
});

// Lompat ke halaman tertentu â€” input "#" sekarang berada di panel settings (canvas-jump-area)
window.executeJumpToPage = function() {
    const input = document.getElementById('canvas-jump-input');
    if (!input || !currentPdfDoc) return;
    const p = parseInt(input.value);
    const total = currentPdfDoc.numPages;
    if (p >= 1 && p <= total) {
        currentCanvasPage = p;
        _resetCanvasTransform();
        renderCanvasPage(p);
        input.blur();
    }
};

// --- GESTURE CANVAS ---
function setupCanvasPinchZoom() { /* stub */ }

// --- PROGRESS BAR INTERAKTIF (Canvas Mode: ketuk/geser untuk lompat halaman) ---
let _progressDragging = false;

function setupProgressBarDrag() {
    const container = document.getElementById('progress-container');
    const handle = document.getElementById('progress-drag-handle');
    const tooltip = document.getElementById('progress-drag-tooltip');
    if (!container) return;

    function _isCanvasActive() {
        const book = library.find(b => b.id === activeBookId);
        return !!(book && book.pdfMode === 'canvas' && currentPdfDoc);
    }

    function _pageFromClientX(clientX) {
        const rect = container.getBoundingClientRect();
        let ratio = (clientX - rect.left) / rect.width;
        ratio = Math.max(0, Math.min(1, ratio));
        const total = currentPdfDoc.numPages;
        let page = Math.round(ratio * (total - 1)) + 1;
        page = Math.max(1, Math.min(total, page));
        return { page, ratio };
    }

    function _updateVisual(ratio, page) {
        const pct = Math.round(ratio * 100);
        if (DOM.progBar) DOM.progBar.style.width = `${pct}%`;
        if (DOM.progTxt) DOM.progTxt.textContent = `${pct}%`;
        if (handle) handle.style.left = `${pct}%`;
        if (tooltip) {
            tooltip.style.left = `${pct}%`;
            tooltip.textContent = `${page} / ${currentPdfDoc.numPages}`;
        }
    }

    function _onStart(e) {
        if (!_isCanvasActive()) return;
        _progressDragging = true;
        container.classList.add('progress-draggable');
        if (DOM.progBar) DOM.progBar.classList.remove('progress-smooth');
        if (handle) handle.classList.remove('hidden');
        if (tooltip) tooltip.classList.remove('hidden');
        _onMove(e);
        if (e.cancelable) e.preventDefault();
    }

    function _onMove(e) {
        if (!_progressDragging || !_isCanvasActive()) return;
        const pt = e.touches ? e.touches[0] : e;
        const { ratio, page } = _pageFromClientX(pt.clientX);
        _updateVisual(ratio, page);
        if (e.cancelable) e.preventDefault();
    }

    function _onEnd(e) {
        if (!_progressDragging) return;
        _progressDragging = false;
        if (DOM.progBar) DOM.progBar.classList.add('progress-smooth');
        if (tooltip) tooltip.classList.add('hidden');
        if (!_isCanvasActive()) return;

        const pt = e.changedTouches ? e.changedTouches[0] : e;
        const { page } = _pageFromClientX(pt.clientX);

        if (page !== currentCanvasPage) {
            currentCanvasPage = page;
            if (typeof _resetCanvasTransform === 'function') _resetCanvasTransform();
            window.getSelection().removeAllRanges();
            if (typeof hideSelectionMenu === 'function') window.hideSelectionMenu();
            renderCanvasPage(page);
        }
    }

    container.addEventListener('mousedown', _onStart);
    document.addEventListener('mousemove', _onMove);
    document.addEventListener('mouseup', _onEnd);

    container.addEventListener('touchstart', _onStart, { passive: false });
    container.addEventListener('touchmove', _onMove, { passive: false });
    container.addEventListener('touchend', _onEnd);
}

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

    // FIX BUG "KUBIK": hanya page-stage (halaman aktif) yang boleh di-translate/rotateY.
    // wrapper tetap dipakai untuk pinch-zoom/pan (scale seluruh area), TAPI untuk
    // gesture page-turn (drag/tilt/commit) targetnya harus pageStage, bukan wrapper,
    // supaya canvas-prev/canvas-next diam total di belakang.
    const pageStage  = document.getElementById('page-stage');
    const foldShadow = document.getElementById('fold-shadow');
    const seamShadow = document.getElementById('seam-shadow');
    const canvasNextEl = document.getElementById('canvas-next');
    const canvasPrevEl = document.getElementById('canvas-prev');

    // z-index toggle: pastikan halaman statis yang SEDANG dibuka (sesuai arah drag)
    // ada DI ATAS halaman statis satunya, karena sekarang keduanya numpuk di posisi yang sama.
    function _setRevealDirection(deltaX) {
        if (!canvasNextEl || !canvasPrevEl) return;
        if (deltaX < 0) { canvasNextEl.style.zIndex = 2; canvasPrevEl.style.zIndex = 1; }
        else if (deltaX > 0) { canvasPrevEl.style.zIndex = 2; canvasNextEl.style.zIndex = 1; }
    }

    // Update shading dinamis: fold-shadow (di atas halaman yg ditarik, biar kesan lengkung)
    // + seam-shadow (jatuh di halaman statis di baliknya, biar kesan halaman aktif "terangkat")
    function _updateTurnShade(progress) {
        if (!foldShadow || !seamShadow) return;
        const absP = Math.min(1, Math.abs(progress));
        // Kurva "bell": shadow membesar di pertengahan drag, lalu MENGECIL LAGI saat halaman
        // sudah hampir edge-on (menghadap sisi/atas). Ini meniru kertas fisik yang bayangannya
        // makin tipis begitu nyaris tak terlihat dari depan, dan yang lebih penting: dengan ini
        // shadow sudah otomatis mendekati 0 SEBELUM animasi commit selesai, jadi tidak ada lagi
        // efek "kedip/pop" saat halaman di-swap instan di akhir animasi.
        const bell = Math.sin(absP * Math.PI); // 0 di awal â†’ puncak di tengah â†’ 0 lagi di akhir
        const shadeP = bell * 0.8;
        foldShadow.style.opacity = shadeP.toFixed(2);
        seamShadow.style.opacity = (shadeP * 0.9).toFixed(2);
        // Box-shadow dinamis di pageStage: kesan kertas terangkat dari permukaan (depth cue),
        // ikut kurva bell yang sama supaya menghilang mulus, bukan dipotong tiba-tiba
        if (pageStage) {
            pageStage.style.boxShadow = `0 ${6 + bell * 16}px ${16 + bell * 28}px rgba(0,0,0,${(0.12 + bell * 0.18).toFixed(2)})`;
            const curveStr = (bell * 28).toFixed(1) + '%';
            if (progress < 0) {
                pageStage.style.borderRadius = `0 ${curveStr} ${curveStr} 0`;
            } else if (progress > 0) {
                pageStage.style.borderRadius = `${curveStr} 0 0 ${curveStr}`;
            } else {
                pageStage.style.borderRadius = '0px';
            }
        }
        if (progress < 0) {
            // ditarik ke kiri â†’ pivot kanan, seam nempel di canvas-next (kanan)
            foldShadow.style.background = 'radial-gradient(ellipse at right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.1) 45%, transparent 80%)';
            seamShadow.style.left = '100%'; seamShadow.style.right = 'auto';
            seamShadow.style.background = 'linear-gradient(to right, rgba(0,0,0,.45) 0%, rgba(0,0,0,.15) 25%, transparent 100%)';
        } else if (progress > 0) {
            // ditarik ke kanan â†’ pivot kiri, seam nempel di canvas-prev (kiri)
            foldShadow.style.background = 'radial-gradient(ellipse at left, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.1) 45%, transparent 80%)';
            seamShadow.style.right = '100%'; seamShadow.style.left = 'auto';
            seamShadow.style.background = 'linear-gradient(to left, rgba(0,0,0,.45) 0%, rgba(0,0,0,.15) 25%, transparent 100%)';
        }
    }
    function _resetTurnShade() {
        if (foldShadow) foldShadow.style.opacity = 0;
        if (seamShadow) seamShadow.style.opacity = 0;
        if (pageStage) {
            pageStage.style.boxShadow = 'none';
            pageStage.style.borderRadius = '0px';
        }
    }

    wrapper.style.transformOrigin = 'center center';
    wrapper.style.willChange      = 'transform';
    wrapper.style.transition      = 'none';
    if (pageStage) { pageStage.style.willChange = 'transform'; pageStage.style.transition = 'none'; }
    _resetCanvasTransform();

    // State internal gesture â€” semua di sini, tidak pakai variabel global yang bisa
    // terpolusi antar-gesture
    let isAnimatingPage = false; // Gembok pelindung animasi
    let forceFinishTurn = null; // Fungsi penuntas animasi instan
    let isPinching    = false;
    let pinchStartDist  = 0;
    let pinchStartScale = 1;
    // Titik focal cubit di koordinat KONTEN (bukan layar) â€” pre-transform
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

    // Helper: konversi koordinat layar â†’ koordinat konten wrapper (tanpa transform)
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
        // Saat scale berubah dari startScale â†’ newScale,
        // focal point konten (fx, fy) harus tetap di posisi layar yang sama.
        // Posisi layar focal = natCenter + tx + fx * scale
        // Agar sama: startTX + fx*startScale = newTX + fx*newScale
        // â†’ newTX = startTX + fx*(startScale - newScale)
        canvasTranslateX = startTX + fx * (startScale - newScale);
        canvasTranslateY = startTY + fy * (startScale - newScale);
        currentCanvasScale = newScale;
    }

    // â”€â”€ touchstart â”€â”€
    newVP.addEventListener('touchstart', (e) => {
        // FAST SWIPE: Jika user buru-buru tap/geser saat kertas masih terbang,
        // langsung selesaikan animasi secara instan tanpa menunggu.
        if (isAnimatingPage && forceFinishTurn) forceFinishTurn();
        // FIX BUG DRAG SELECTION: Matikan gesture aplikasi kalau ada teks yang lagi diblok
        if (window.getSelection().toString().trim().length > 0) {
            isPinching    = false;
            isPanning     = false;
            isSwipingPage = false;
            return;
        }

        if (e.touches.length === 2) {
            // Masuk mode pinch â€” batalkan semua state pan/tap & swipe halaman
            isPinching    = true;
            isPanning     = false;
            isSwipingPage = false;

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

            if (currentCanvasScale <= window.defaultCanvasScale + 0.02) {
                // Mode swipe halaman â€” wrapper akan digeser langsung (canvas-prev/next absolute ikut)
                isSwipingPage = true;
                swipeStartX   = e.touches[0].clientX;
                // Pastikan tidak ada transisi saat dragging
                wrapper.style.transition = 'none';
                isPanning = false;
            } else {
                // Mode pan konten (sudah zoom)
                isSwipingPage = false;
                isPanning = true;
                panStartX = e.touches[0].clientX - canvasTranslateX;
                panStartY = e.touches[0].clientY - canvasTranslateY;
            }
        }
    }, { passive: true });

    // â”€â”€ touchmove â”€â”€
    newVP.addEventListener('touchmove', (e) => {
        // FIX BUG DRAG SELECTION: Cegah halaman ikutan bergeser saat user menarik gagang seleksi
        if (window.getSelection().toString().trim().length > 0) {
            return;
        }

        if (isPinching && e.touches.length === 2) {
            e.preventDefault();

            const dist     = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const rawScale = pinchStartScale * (dist / pinchStartDist);
            const newScale = Math.max(window.defaultCanvasScale, Math.min(5.0, rawScale));

            if (newScale <= window.defaultCanvasScale) {
                currentCanvasScale = window.defaultCanvasScale;
                canvasTranslateX   = 0;
                canvasTranslateY   = 0;
            } else {
                // Zoom ke focal point konten â€” tidak pakai mid layar sekarang
                // karena mid bisa bergeser saat jari bergerak lateral.
                // Focal point KONTEN tetap konstan sejak touchstart.
                zoomToContentPoint(newScale,
                    pinchFocalContentX, pinchFocalContentY,
                    pinchStartTX, pinchStartTY, pinchStartScale);
            }
            _applyCanvasTransform(wrapper);

        } else if (isSwipingPage && e.touches.length === 1) {
            // [LAYOUT NUMPUK] Geser page-stage saja â€” canvas-prev/next statis, numpuk PAS di posisi
            // yang sama di belakang (bukan di samping lagi), jadi otomatis kebuka tanpa celah.
            const deltaX = e.touches[0].clientX - swipeStartX;
            _setRevealDirection(deltaX);
            if (pageTurnAnimEnabled && pageStage) {
                // Tilt 3D ala Play Books: makin jauh drag, makin miring & sedikit mengecil.
                // HANYA pageStage yang gerak â€” canvas-prev/next diam total di belakang.
                const progress = Math.max(-1, Math.min(1, deltaX / window.innerWidth));
                const rotateY  = -progress * 85; // derajat maksimum (lebih besar = lebih 3D)
                const liftZ    = -Math.abs(progress) * 80; // "terangkat" menjauh sedikit
                // PENTING: tinggi kertas TIDAK boleh ikut menyusut â€” hanya scaleX (lebar) yang
                // sedikit mengecil untuk mempertegas kesan lengkung 3D, scaleY tetap 1 (tinggi asli).
                const scaleXTo = 1 - Math.abs(progress) * 0.15;
                pageStage.style.transformOrigin = deltaX < 0 ? 'right center' : 'left center';
                pageStage.style.transform = `translate(${deltaX}px, 0px) perspective(1400px) rotateY(${rotateY}deg) translateZ(${liftZ}px) scale3d(${scaleXTo}, 1, 1)`;
                _updateTurnShade(progress);
            } else if (pageStage) {
                pageStage.style.transform = `translate(${deltaX}px, 0px) scale(1)`;
                // Animasi off: halaman tujuan ikut digeser masuk dari sisi (bukan diam numpuk),
                // biar keliatan slide kanan-kiri asli kayak versi lama.
                if (deltaX < 0 && canvasNextEl) {
                    canvasNextEl.style.transition = 'none';
                    canvasNextEl.style.transform = `translate(${window.innerWidth + deltaX}px, 0px)`;
                } else if (deltaX > 0 && canvasPrevEl) {
                    canvasPrevEl.style.transition = 'none';
                    canvasPrevEl.style.transform = `translate(${deltaX - window.innerWidth}px, 0px)`;
                }
            }

        } else if (e.touches.length === 1 && isPanning) {
            e.preventDefault();
            canvasTranslateX = e.touches[0].clientX - panStartX;
            canvasTranslateY = e.touches[0].clientY - panStartY;
            _applyCanvasTransform(wrapper);
        }
    }, { passive: false });

    // Timer untuk menunda navigasi halaman â€” dibatalkan jika tap kedua datang
    let _navTimer = null;

    // Helper: snap wrapper kembali ke posisi tengah dengan animasi singkat
    function _snapSliderToCenter() {
        if (!pageStage) return;
        pageStage.style.transition = 'transform 0.28s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.28s ease';
        pageStage.style.transform  = 'translate(0px, 0px) scale(1)';
        _resetTurnShade();
        if (canvasNextEl) { canvasNextEl.style.transition = pageStage.style.transition; canvasNextEl.style.transform = 'translate(0px, 0px)'; }
        if (canvasPrevEl) { canvasPrevEl.style.transition = pageStage.style.transition; canvasPrevEl.style.transform = 'translate(0px, 0px)'; }
        setTimeout(() => {
            pageStage.style.transition = 'none';
            pageStage.style.transformOrigin = 'center center';
            if (canvasNextEl) canvasNextEl.style.transition = 'none';
            if (canvasPrevEl) canvasPrevEl.style.transition = 'none';
        }, 300);
    }

    // â”€â”€ touchend â”€â”€
    newVP.addEventListener('touchend', (e) => {
        // Jari ke-2 terangkat â†’ akhiri pinch, perbarui anchor pan agar tidak loncat
        if (e.touches.length === 1 && isPinching) {
            isPinching = false;
            isSwipingPage = false;
            if (currentCanvasScale > window.defaultCanvasScale + 0.02) {
                isPanning = true;
                panStartX = e.touches[0].clientX - canvasTranslateX;
                panStartY = e.touches[0].clientY - canvasTranslateY;
            }
            return;
        }

        if (e.touches.length === 0) {
            isPinching = false;
            isPanning  = false;

            // â”€â”€ SWIPE NAVIGASI HALAMAN â”€â”€
            if (isSwipingPage) {
                isSwipingPage = false;
                const deltaX = e.changedTouches[0].clientX - swipeStartX;
                const absDX  = Math.abs(deltaX);
                // (slider variable dihapus â€” wrapper digeser langsung)

                if (absDX < 15) {
                    // TAP â€” snap kembali ke tengah, teruskan ke logika tap di bawah
                    _snapSliderToCenter();
                    // Jangan return â€” biarkan logika tap/double-tap di bawah berjalan

                } else if (deltaX < -80) {
                    // SWIPE KIRI â†’ halaman berikutnya
                    if (currentPdfDoc && currentCanvasPage < currentPdfDoc.numPages) {
                        isAnimatingPage = true;
                        _setRevealDirection(-1);
                        if (pageStage) pageStage.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s ease';
                        if (pageTurnAnimEnabled && pageStage) {
                            pageStage.style.transformOrigin = 'right center';
                            pageStage.style.transform = `translate(-${window.innerWidth * 1.6}px, 0px) perspective(1400px) rotateY(-75deg) translateZ(-100px) scale3d(0.85, 1, 1)`;
                            _updateTurnShade(-1);
                        } else if (pageStage) {
                            pageStage.style.transform = `translate(-${window.innerWidth}px, 0px) scale(1)`;
                            if (canvasNextEl) {
                                canvasNextEl.style.transition = pageStage.style.transition;
                                canvasNextEl.style.transform  = 'translate(0px, 0px)';
                            }
                        }

                        let _swapped = false;
                        let _swapTimer = null;
                        const finishSwap = () => {
                            if (_swapped) return; _swapped = true;
                            clearTimeout(_swapTimer);
                            if (canvasNextEl) { canvasNextEl.style.transition = 'none'; canvasNextEl.style.transform = 'translate(0px, 0px)'; }
                            if (canvasPrevEl) { canvasPrevEl.style.transition = 'none'; canvasPrevEl.style.transform = 'translate(0px, 0px)'; }
                            const cnNext = document.getElementById('canvas-next');
                            const cnCurr = document.getElementById('pdf-canvas');
                            if (cnNext && cnNext.width > 1 && cnCurr) {
                                cnCurr.width        = cnNext.width;
                                cnCurr.height       = cnNext.height;
                                cnCurr.style.width  = cnNext.style.width;
                                cnCurr.style.height = cnNext.style.height;
                                const ctxCurr = cnCurr.getContext('2d');
                                ctxCurr.imageSmoothingEnabled = false;
                                ctxCurr.drawImage(cnNext, 0, 0);
                                _canvasAlreadyCopied = true;
                            }
                            if (pageStage) {
                                pageStage.style.transition = 'none';
                                pageStage.style.transform  = 'translate(0px, 0px) scale(1)';
                                pageStage.style.transformOrigin = 'center center';
                                pageStage.style.opacity = '1';
                            }
                            _resetTurnShade();
                            currentCanvasPage++;
                            _resetCanvasTransform();
                            renderCanvasPage(currentCanvasPage);
                            isAnimatingPage = false;
                            forceFinishTurn = null;
                        };
                        forceFinishTurn = () => {
                            if (pageStage) pageStage.style.transition = 'none';
                            finishSwap();
                        };
                        const _doSwap = () => {
                            _swapTimer = setTimeout(finishSwap, 450);
                        };
                        if (pageStage) {
                            pageStage.addEventListener('transitionend', function _te(ev) {
                                if (ev.target !== pageStage || ev.propertyName !== 'transform') return;
                                pageStage.removeEventListener('transitionend', _te);
                                _doSwap();
                            });
                        }
                        setTimeout(_doSwap, 650); // fallback
                    } else {
                        _snapSliderToCenter();
                    }
                    return;

                } else if (deltaX > 80) {
                    // SWIPE KANAN â†’ halaman sebelumnya
                    if (currentPdfDoc && currentCanvasPage > 1) {
                        isAnimatingPage = true;
                        _setRevealDirection(1);
                        if (pageStage) pageStage.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s ease';
                        if (pageTurnAnimEnabled && pageStage) {
                            pageStage.style.transformOrigin = 'left center';
                            pageStage.style.transform = `translate(${window.innerWidth * 1.6}px, 0px) perspective(1400px) rotateY(75deg) translateZ(-100px) scale3d(0.85, 1, 1)`;
                            _updateTurnShade(1);
                        } else if (pageStage) {
                            pageStage.style.transform = `translate(${window.innerWidth}px, 0px) scale(1)`;
                            if (canvasPrevEl) {
                                canvasPrevEl.style.transition = pageStage.style.transition;
                                canvasPrevEl.style.transform  = 'translate(0px, 0px)';
                            }
                        }

                        let _swapped = false;
                        let _swapTimer = null;
                        const finishSwap = () => {
                            if (_swapped) return; _swapped = true;
                            clearTimeout(_swapTimer);
                            if (canvasNextEl) { canvasNextEl.style.transition = 'none'; canvasNextEl.style.transform = 'translate(0px, 0px)'; }
                            if (canvasPrevEl) { canvasPrevEl.style.transition = 'none'; canvasPrevEl.style.transform = 'translate(0px, 0px)'; }
                            const cnPrev = document.getElementById('canvas-prev');
                            const cnCurr = document.getElementById('pdf-canvas');
                            if (cnPrev && cnPrev.width > 1 && cnCurr) {
                                cnCurr.width        = cnPrev.width;
                                cnCurr.height       = cnPrev.height;
                                cnCurr.style.width  = cnPrev.style.width;
                                cnCurr.style.height = cnPrev.style.height;
                                const ctxCurr = cnCurr.getContext('2d');
                                ctxCurr.imageSmoothingEnabled = false;
                                ctxCurr.drawImage(cnPrev, 0, 0);
                                _canvasAlreadyCopied = true;
                            }
                            if (pageStage) {
                                pageStage.style.transition = 'none';
                                pageStage.style.transform  = 'translate(0px, 0px) scale(1)';
                                pageStage.style.transformOrigin = 'center center';
                                pageStage.style.opacity = '1';
                            }
                            _resetTurnShade();
                            currentCanvasPage--;
                            _resetCanvasTransform();
                            renderCanvasPage(currentCanvasPage);
                            isAnimatingPage = false;
                            forceFinishTurn = null;
                        };
                        forceFinishTurn = () => {
                            if (pageStage) pageStage.style.transition = 'none';
                            finishSwap();
                        };
                        const _doSwap = () => {
                            _swapTimer = setTimeout(finishSwap, 450);
                        };
                        if (pageStage) {
                            pageStage.addEventListener('transitionend', function _te(ev) {
                                if (ev.target !== pageStage || ev.propertyName !== 'transform') return;
                                pageStage.removeEventListener('transitionend', _te);
                                _doSwap();
                            });
                        }
                        setTimeout(_doSwap, 650); // fallback
                    } else {
                        _snapSliderToCenter();
                    }
                    return;

                } else {
                    // BATAL (15â€“80px) â€” snap kembali ke tengah
                    _snapSliderToCenter();
                    return;
                }
                // Jika absDX < 15 (tap), jatuh ke logika tap di bawah
            }

            // Snap balik ke scale default jika terlalu kecil
            if (currentCanvasScale <= window.defaultCanvasScale + 0.02) {
                currentCanvasScale = window.defaultCanvasScale;
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
                // â”€â”€ DOUBLE TAP â€” batalkan timer navigasi yang mungkin sedang pending â”€â”€
                clearTimeout(_navTimer);
                _navTimer = null;
                _canvasLastTapTime = 0; // reset agar tidak triple-tap

                if (currentCanvasScale > window.defaultCanvasScale + 0.02) {
                    // Zoom OUT ke default dengan animasi
                    wrapper.style.transition = 'transform 0.3s cubic-bezier(0.2,0,0,1)';
                    currentCanvasScale = window.defaultCanvasScale;
                    canvasTranslateX   = 0;
                    canvasTranslateY   = 0;
                    _applyCanvasTransform(wrapper);
                    setTimeout(() => { wrapper.style.transition = 'none'; }, 320);
                } else {
                    // Zoom IN 2.5Ã— ke titik yang di-tap
                    const fc = screenToContent(ex, ey);
                    wrapper.style.transition = 'transform 0.3s cubic-bezier(0.2,0,0,1)';
                    zoomToContentPoint(2.5, fc.cx, fc.cy,
                        canvasTranslateX, canvasTranslateY, currentCanvasScale);
                    _applyCanvasTransform(wrapper);
                    setTimeout(() => { wrapper.style.transition = 'none'; }, 320);
                }
            } else {
                // â”€â”€ SINGLE TAP â€” catat dulu, tunda navigasi sampai window double-tap berakhir â”€â”€
                _canvasLastTapTime = now;
                _canvasLastTapX    = ex;
                _canvasLastTapY    = ey;

                // Navigasi halaman hanya saat scale = default
                // Ditunda 320ms agar double-tap bisa membatalkannya
                if (currentCanvasScale <= window.defaultCanvasScale + 0.02) {
                    const sw      = window.innerWidth;
                    const isLeft  = ex < sw * 0.30;
                    const isRight = ex > sw * 0.70;
                    if (isLeft || isRight) {
                        clearTimeout(_navTimer);
                        _navTimer = setTimeout(() => {
                            _navTimer = null;
                            // Cek ulang: pastikan belum di-zoom oleh double-tap yang datang
                            if (currentCanvasScale <= window.defaultCanvasScale + 0.02) {
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
// transform-origin: center center â†’ translate 0,0 = wrapper pas di tengah viewport.
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

    // 1. Eksekusi murni visual (Animasi)
    DOM.readView.classList.add('translate-y-full');
    DOM.libView.style.transform = 'scale(1)';
    updateBottomNavUI(null);

    // 2. Tunda pemrosesan memori yang berat agar animasi 60fps selesai dulu
    setTimeout(() => {
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

        // Render ulang library (murah, cuma manipulasi DOM lokal) supaya progress terbaru
        // langsung real-time di Home/Scroll/Canvas â€” termasuk saat buku baru masuk/naik
        // urutan "Lanjutkan Membaca", yang sebelumnya cuma bisa muncul setelah restart app.
        if (activeBookId) {
            renderLibrary(document.getElementById('global-search') ? document.getElementById('global-search').value : '');
        }
        activeBookId = null;
        window.getSelection().removeAllRanges();
        const menu = document.getElementById('selection-menu');
        if(menu) { menu.classList.add('opacity-0', 'scale-75'); setTimeout(() => menu.classList.add('hidden'), 200); }
        // Kosongkan TextLayer saat reader ditutup
        const textLayerDiv = document.getElementById('canvas-text-layer');
        if (textLayerDiv) textLayerDiv.innerHTML = '';
    }, 350); // Waktu eksekusi setelah animasi transisi selesai
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
        updateBottomNavUI(null);
        if (activePanel) { _closeSidePanelsAction(); }
    }
};

window.setupIntersectionObserver = function() {
    if (observer) observer.disconnect();
    const book = library.find(b => b.id === activeBookId);
    const totalNodes = (book && book.nodes) ? book.nodes.length : DOM.inner.children.length;
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
    
    const book = library.find(b => b.id === activeBookId);
    const sel = window.getSelection(); const text = sel.toString().trim(); const menu = document.getElementById('selection-menu');

    if (text.length > 0 && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const textLayerDiv = document.getElementById('canvas-text-layer');

        // Deteksi: apakah seleksi berasal dari TextLayer (Canvas Mode)?
        if (book && book.pdfMode === 'canvas') {
            if (!textLayerDiv || !textLayerDiv.contains(range.commonAncestorContainer)) {
                // Seleksi bukan dari TextLayer â€” abaikan
                if (!_isTouchDragging) window.hideSelectionMenu();
                return;
            }
            // Ekstrak posisi kotak (rectangles) murni dari teks yang diblok
            const wrapperRect = textLayerDiv.getBoundingClientRect();
            const rects = Array.from(range.getClientRects()).map(r => ({
                left: (r.left - wrapperRect.left) / currentCanvasScale,
                top: (r.top - wrapperRect.top) / currentCanvasScale,
                width: r.width / currentCanvasScale,
                height: r.height / currentCanvasScale
            }));

            // Izinkan capsule menu muncul & simpan array rects
            currentSelection = { text: text, nodeIdx: currentCanvasPage, startOff: 0, endOff: 0, rects: rects };
            menu.classList.remove('hidden');
            const rect = range.getBoundingClientRect(); const menuWidth = menu.offsetWidth || 220; const padding = 16;
            let targetLeft = rect.left + (rect.width / 2) - (menuWidth / 2);
            if (targetLeft < padding) targetLeft = padding;
            if (targetLeft + menuWidth > window.innerWidth - padding) targetLeft = window.innerWidth - menuWidth - padding;
            let targetTop = rect.top - 55;
            if (targetTop < 80) targetTop = rect.bottom + 15;
            menu.style.top = `${targetTop}px`; menu.style.left = `${targetLeft}px`;
            requestAnimationFrame(() => { menu.classList.remove('opacity-0', 'scale-75'); });
            return;
        }

        // Scroll Mode: deteksi normal via reader-inner
        if (!DOM.inner) return;
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
    } else {
        // Canvas Mode: gambar ulang stabilo agar langsung muncul
        if (typeof window.renderCanvasHighlights === 'function') window.renderCanvasHighlights(currentCanvasPage);
    }

    window.renderBookmarkPanel();
    updateStatistics(); 
}

window.openBookmarkModal = function(color) {
    // Di Canvas Mode dengan TextLayer: nodeIdx diisi currentCanvasPage oleh _handleSelectionChange
    // Di Scroll Mode: nodeIdx diisi via getAbsoluteOffsets
    const book = library.find(b => b.id === activeBookId);
    const isCanvasWithSelection = book && book.pdfMode === 'canvas' && currentSelection.text && currentSelection.text.trim().length > 0;
    
    if (!isCanvasWithSelection && currentSelection.nodeIdx === -1) return;
    
    activeNoteColor = color; 
    editingAnnotId = null; 
    
    // Prefill judul dari snippet jika ada di Canvas Mode
    const d_bm = i18n[wikiLang] || i18n['id'];
    if (isCanvasWithSelection) {
        const snippet = currentSelection.text;
        document.getElementById('bookmark-input-title').value = snippet.length > 40 ? snippet.substring(0, 40) + '...' : snippet;
    } else {
        document.getElementById('bookmark-input-title').value = '';
    }
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
            const d_bm = i18n[wikiLang] || i18n['id'];
            // Cek apakah ada teks yang diseleksi dari TextLayer â€” jika ada, gunakan snippet teks tersebut
            const hasTextSnippet = currentSelection.text && 
                                   currentSelection.text.trim().length > 0 && 
                                   currentSelection.text !== `${d_bm.pdfPageLabel || 'Hal'} ${currentCanvasPage}`;
            const snippetText = hasTextSnippet ? currentSelection.text : `${d_bm.pdfPageLabel || 'Hal'} ${currentCanvasPage}`;
            const newAnnot = { 
                id: 'BM_' + Date.now().toString(), 
                nodeIdx: currentCanvasPage, // menyimpan index halaman canvas
                startOff: 0, 
                endOff: 0,
                text: snippetText, 
                isCanvasMode: true, // flag untuk render di panel bookmark
                color: activeNoteColor, 
                rects: currentSelection.rects || [], // KOORDINAT STABILO
                title: titleVal || (hasTextSnippet ? (snippetText.length > 30 ? snippetText.substring(0, 30) + '...' : snippetText) : `${d_bm.pdfPageLabel || 'Hal'} ${currentCanvasPage}`), 
                note: noteVal,
                meta: `${d_bm.pdfPageLabel || 'Hal'} ${currentCanvasPage} / ${book.pages}`
            };
            setTimeout(() => { registerAnnotation(newAnnot); }, 300);
        } else {
            if (!book.nodes) return;
            const totalNodes = book.nodes.length;
            const pct = Math.round(((currentSelection.nodeIdx + 1) / totalNodes) * 100);

            let closestChapterName = wikiLang === 'id' ? "Bagian Buku" : (wikiLang === 'es' ? "SecciÃ³n del libro" : "Book Section");
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
                meta: `${chapterPreview} â€” ${pct}%`
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
    } else {
        // Canvas Mode: hapus stabilo langsung dari layer
        if (typeof window.renderCanvasHighlights === 'function') window.renderCanvasHighlights(currentCanvasPage);
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
            
            let quoteHtml = '';
            // Tampilkan snippet teks jika:
            // - Scroll Mode (selalu tampil)
            // - Canvas Mode dengan snippet teks yang diseleksi (bukan sekadar "Hal X")
            const d_bm2 = i18n[wikiLang] || i18n['id'];
            const isCanvasPageOnly = isCanvas && (!bm.isCanvasMode || bm.text === `${d_bm2.pdfPageLabel || 'Hal'} ${bm.nodeIdx}`);
            if (!isCanvasPageOnly && bm.text && bm.text.trim().length > 0) {
                quoteHtml = `
                    <div class="mt-2 p-3 rounded-2xl ${quoteBgCls}">
                        <span class="text-[11px] font-medium opacity-90 italic line-clamp-2 leading-relaxed">"${bm.text}"</span>
                    </div>
                `;
            }
            
            const d_bm = i18n[wikiLang] || i18n['id'];
            let metaText = bm.meta || (wikiLang === 'id' ? 'Bab' : (wikiLang === 'es' ? 'CapÃ­tulo' : 'Chapter'));
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
    // 'welcome-sheet' (view Instruksi) sengaja TIDAK dimasukkan â€” tidak boleh ditutup dengan swipe ke bawah
    const sheets = ['b-opt-sheet', 'edit-sheet', 'bookmark-sheet', 'raw-backup-sheet', 'raw-restore-sheet', 'backup-type-sheet', 'pdf-mode-sheet', 'ai-sheet'];
    
    sheets.forEach(sheetId => {
        const sheet = document.getElementById(sheetId);
        if (!sheet) return;
        let touchStartY = 0; let isPulling = false; let rafPending = false;
        
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
                
                if (!rafPending) {
                    rafPending = true;
                    requestAnimationFrame(() => {
                        if (sheetId === 'global-settings-sheet' || sheetId === 'b-opt-sheet' || sheetId === 'ai-sheet') {
                            sheet.style.transform = `translateY(${deltaY * 0.5}px)`; 
                        } else {
                            sheet.style.transform = `scale(0.75) translateY(${12 + (deltaY * 0.5)}px)`;
                        }
                        rafPending = false;
                    });
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
        let touchStartX = 0; let touchStartY = 0; let isSwipingPanel = false; let rafPendingPanel = false;
        panel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; panel.style.transition = 'none';
        }, { passive: true });
        panel.addEventListener('touchmove', (e) => {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            if (deltaX > 0 && deltaX > deltaY) { 
                isSwipingPanel = true;
                if(e.cancelable) e.preventDefault();
                if (!rafPendingPanel) {
                    rafPendingPanel = true;
                    requestAnimationFrame(() => {
                        panel.style.transform = `translateX(${deltaX}px)`;
                        rafPendingPanel = false;
                    });
                }
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
        const downloads = doc.downloads ? parseInt(doc.downloads).toLocaleString('id') : 'â€”';
        const card = document.createElement('div');
        card.className = 'flex items-start gap-3 bg-m3-surface rounded-[20px] p-3 shadow-sm';
        card.innerHTML = `
            <img src="https://archive.org/services/img/${id}" alt="" class="w-9 h-12 object-cover rounded-xl shrink-0 bg-m3-surface" onerror="this.style.display='none'" loading="lazy">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-m3-onSurfaceVariant leading-snug line-clamp-2 mb-0.5">${_esc(title)}</p>
                ${creator ? `<p class="text-[10px] text-m3-onSurfaceVariant opacity-55 truncate mb-1">${_esc(creator)}</p>` : ''}
                <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-black bg-m3-primary/15 text-m3-primary px-1.5 py-0.5 rounded-full">${badge}</span>
                    <span class="text-[9px] opacity-40 font-bold">â†“${downloads}</span>
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
    const d = i18n[wikiLang] || i18n['id'];
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
                <span style="font-weight:800;font-size:1rem;color:var(--md-sys-color-on-surface);">${d.archiveFmtTitle || "Pilih Format"}</span>
            </div>
            <p style="font-size:0.75rem;color:var(--md-sys-color-on-surface-variant);opacity:0.75;line-height:1.5;margin:0;">${d.archiveFmtDesc || "Buku ini tersedia dalam dua format. Pilih yang kamu inginkan:"}</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button id="archive-fmt-epub" style="padding:14px 20px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);border:none;border-radius:16px;font-weight:700;font-size:0.85rem;cursor:pointer;">
                    EPUB &nbsp;<span style="opacity:0.6;font-size:0.75rem;font-weight:600;">(${epubSizeMb})</span>
                </button>
                <button id="archive-fmt-pdf" style="padding:14px 20px;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);border:none;border-radius:16px;font-weight:700;font-size:0.85rem;cursor:pointer;">
                    PDF &nbsp;<span style="opacity:0.75;font-size:0.75rem;font-weight:600;">(${pdfSizeMb})</span>
                </button>
                <button id="archive-fmt-cancel" style="padding:10px 20px;background:transparent;color:var(--md-sys-color-on-surface-variant);border:none;border-radius:16px;font-weight:700;font-size:0.8rem;cursor:pointer;opacity:0.6;">${d.archiveFmtCancel || "Batal"}</button>
            </div>
        </div>`;

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        const sheet = document.getElementById('archive-fmt-sheet');
        if (sheet) sheet.style.transform = 'scale(1)';
    });

    // Push history HANYA untuk back gesture/hardware â€” tombol di dalam tidak menyentuh history sama sekali
    history.pushState({ state: 'archive-fmt' }, '', '#archive-fmt');

    const _close = () => {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.innerHTML = ''; overlay.style.display = 'none'; }, 220);
    };

    document.getElementById('archive-fmt-epub').onclick   = () => { _close(); onChoose({ file: epubFile, type: 'epub' }); };
    document.getElementById('archive-fmt-pdf').onclick    = () => { _close(); onChoose({ file: pdfFile,  type: 'pdf'  }); };
    document.getElementById('archive-fmt-cancel').onclick = () => { _close(); onChoose(null); };
}

// â”€â”€â”€ SIMPAN FILE KE PENYIMPANAN HP (Capacitor Filesystem) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function _saveFileToDevice(file, fileName) {
    const langNow = typeof wikiLang !== 'undefined' ? wikiLang : 'id';
    const FS = window.Capacitor?.Plugins?.Filesystem;
    
    const _toast = (msg, type) => {
        if (typeof window.showPersistentToast === 'function') {
            window.showPersistentToast(msg, type || 'success', 4500);
        }
    };

    if (!FS) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click();
        setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 2000);
        return;
    }

    try { await FS.requestPermissions(); } catch (e) {}

    // OPTIMASI DEWA: BLOB SLICING (Mencincang File Anti-OOM)
    // Potong Blob raksasa jadi ~2MB per bagian. Ukuran dibikin kelipatan 3 murni (2097150 bytes) 
    // agar konversi Base64 tetap presisi dan tidak korup di area perbatasan blok.
    const CHUNK_SIZE = 2097150; 
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    const _chunkToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const res = reader.result;
            resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

    const directories = ['DOWNLOADS', 'DOCUMENTS', 'EXTERNAL_STORAGE', 'DATA'];
    let saved = false;

    for (const dir of directories) {
        try {
            const targetPath = dir === 'EXTERNAL_STORAGE' ? `Download/${fileName}` : fileName;

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);
                const base64Chunk = await _chunkToBase64(chunk);

                if (i === 0) {
                    await FS.writeFile({ path: targetPath, data: base64Chunk, directory: dir, recursive: true });
                } else {
                    await FS.appendFile({ path: targetPath, data: base64Chunk, directory: dir });
                }
            }

            saved = true;
            _toast(langNow === 'en' ? `Saved to Downloads âœ“` : `Tersimpan di perangkat âœ“`, 'success');
            break; 
        } catch (err) {
            console.warn(`[saveFileToDevice] Gagal di ${dir}:`, err);
        }
    }
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        // Push history HANYA untuk back gesture/hardware â€” tombol Cancel tidak menyentuh history
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

        // Step 2: download file langsung ke native storage via CapacitorHttp.downloadFile
        // (menghindari OOM karena file tidak dimuat ke RAM JavaScript sebagai blob utuh)
        const fileUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(chosen.name)}`;
        const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '').trim().substring(0, 60) || identifier;
        const fileName   = `${cleanTitle}.${chosenType}`;
        const mimeType   = chosenType === 'epub' ? 'application/epub+zip' : 'application/pdf';

        // â”€â”€ XHR DOWNLOADER: Mengambil file murni tanpa korup â”€â”€
        const _downloadViaXHR = () => new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'blob'; // Pastikan formatnya mentah (binary)
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
                    _updateDlMsg(`${txt.downloading} ${chosenType.toUpperCase()}...\nMenyimpan file...`);
                    resolve(new File([xhr.response], fileName, { type: mimeType }));
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Koneksi terputus.'));
            signal.addEventListener('abort', () => { xhr.abort(); reject(new DOMException('Aborted', 'AbortError')); });
            xhr.send();
        });

        let file = null;
        try {
            file = await _downloadViaXHR();
            // File murni diumpankan ke Blob Slicing, menjamin 0% korup dan RAM stabil
            await _saveFileToDevice(file, fileName);
        } catch (dlErr) {
            throw dlErr;
        }

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
            // Dibatalkan oleh user â€” tampilkan toast bersih tanpa dialog
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

// â”€â”€â”€ PERSISTENT TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// ===================================================================
// EFEK RIPPLE (Material Design) â€” global listener untuk .btn-morph, .card-morph, dan tombol
// ===================================================================
function _spawnRipple(target, clientX, clientY) {
    if (!target) return;
    // Pastikan elemen bisa menampung ripple (posisi relative + overflow hidden)
    target.classList.add('ripple-container');
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const x = (clientX != null ? clientX - rect.left : rect.width / 2) - size / 2;
    const y = (clientY != null ? clientY - rect.top : rect.height / 2) - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    target.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    // Safety net kalau animationend tidak terpanggil (mis. elemen dihapus dari DOM lebih dulu)
    setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 700);
}

function _handleGlobalRippleTrigger(e) {
    // Kecualikan nav bar bawah â€” ripple tidak boleh muncul di dalamnya
    if (e.target.closest('#bottom-nav-bar, .nav-bar, nav')) return;
    const target = e.target.closest('.btn-morph, .card-morph, button');
    if (!target) return;
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    _spawnRipple(target, point.clientX, point.clientY);
}

document.addEventListener('mousedown', _handleGlobalRippleTrigger, true);
document.addEventListener('touchstart', _handleGlobalRippleTrigger, { capture: true, passive: true });
