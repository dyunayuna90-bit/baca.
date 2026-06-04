window.APP_VERSION = "2.0.3";
window.UPDATE_URL = "https://raw.githubusercontent.com/dyunayuna90-bit/baca./main/package.json";
window.RELEASES_URL = "https://github.com/dyunayuna90-bit/baca./releases/latest";

// Konfigurasi Tailwind CSS untuk kustomisasi warna dan font
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                m3: {
                    primary: 'var(--md-sys-color-primary)', onPrimary: 'var(--md-sys-color-on-primary)',
                    primaryContainer: 'var(--md-sys-color-primary-container)', onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
                    secondaryContainer: 'var(--md-sys-color-secondary-container)', onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',
                    tertiaryContainer: 'var(--md-sys-color-tertiary-container)', onTertiaryContainer: 'var(--md-sys-color-on-tertiary-container)',
                    bg: 'var(--md-sys-color-background)', onBg: 'var(--md-sys-color-on-background)',
                    surface: 'var(--md-sys-color-surface)', onSurface: 'var(--md-sys-color-on-surface)',
                    surfaceVariant: 'var(--md-sys-color-surface-variant)', onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'serif'],
                merriweather: ['Merriweather', 'serif'],
                playfair: ['Playfair Display', 'serif'],
                mono: ['Space Mono', 'monospace'],
                google: ['Google Sans Flex', 'sans-serif']
            }
        }
    }
};

// KAMUS BAHASA (Bilingual I18n)
// [MODIFIKASI] Nambahin key buat translate UI Statistik
window.i18n = {
    en: {
        libEmpty: "Library is Empty. Tap + to add.", continueReading: "Continue Reading", bookCollection: "Book Collection", loadingDocs: "Loading Document...", cancel: "Cancel", delete: "Delete",
        optSelect: "Select", optEdit: "Edit Details", optDelete: "Delete",
        pinnedBooks: "Pinned Books", navBookmark: "Bookmarks", bookmarkTitle: "Bookmarks", bookmarkEmpty: "No bookmarks yet.", bookmarkCancel: "Cancel", bookmarkSave: "Save",
        bookmarkModalTitle: "Bookmark", bookmarkTitlePlaceholder: "Title (Optional)", bookmarkNotePlaceholder: "Write a note (optional)...",
        welcomeTitle: "Welcome to Baca. v5", welcomeDesc: "PWA E-Reader designed for ultimate reading comfort. No servers, no ads.",
        welBackup: "Local Data & Backup", welBackupDesc: "All books & notes are stored safely on your browser. <b>Backup regularly</b> to prevent data loss.",
        welFormat: "Supported Formats", welFormatDesc: "Supports <b>EPUB</b> and pure text <b>PDF</b>.",
        welPrivacy: "100% Privacy", welPrivacyDesc: "Processed entirely on your device.", welBtn: "Got it, let's go!",
        setMainTitle: "Settings", setPalette: "Theme Palette", setLang: "Language", setInfo: "Info & Support", setData: "Data Management",
        btnBackup: "Backup JSON", btnRestore: "Restore JSON", btnInfo: "Instructions", btnDonate: "Buy me a coffee", btnClose: "Close",
        btnUpdate: "Check Updates", searchBooks: "Search books...", booksCount: "Books", updateAvailableTitle: "Update Available!",
        updateAvailableDesc: "Version {v} is out. Open download page?", btnDownload: "Download", updateLatestTitle: "Up to Date",
        updateLatestDesc: "You are running the latest version (v{v}).", updateError: "Failed to check update. Check internet connection.",
        navBack: "Back", navToc: "Contents", navText: "Text", navFull: "Full",
        readerLoading: "Loading Book...", tocTitle: "Table of Contents", setTitle: "Appearance",
        setTheme: "Theme Mode", setSize: "Text Size", setAlign: "Text Alignment", setFont: "Font Family",
        searchPlaceholder: "Search in book...", searchNotFound: "Not found.",
        aiTitle: "Definition", aiLoading: "Looking for references...", noInternet: "Internet connection issue.",
        deleteNoteConfirm: "Delete this note/highlight?",
        editTitle: "Edit Details", editBookTitle: "Book Title", editBookCover: "Cover Image", editBookShape: "Card Shape", editCancel: "Cancel", editSave: "Save", optCancel: "Cancel", themeLight: "Light Mode", themeDark: "Dark Mode", amoledLabel: "AMOLED (Pitch Black)",
        shapeDyn: "Dynamic", shapeRound: "Rounded", shapeSquare: "Square",               
        rawBakTitle: "Raw Backup Data", rawBakDesc: "Due to device restrictions, please copy the text below and save it safely in your Notes or a text file.", rawBakCopy: "Copy Text", rawBakClose: "Close",
        rawResTitle: "Restore Data", rawResDesc: "Paste your raw backup JSON text here, OR choose a JSON file from your device.", rawResFile: "Select File", rawResProcess: "Process Text", rawResClose: "Cancel",
        setAiConfig: "AI Configuration", geminiPlaceholder: "Gemini API Key...", geminiDesc: "Add your API Key to get smart definitions from AI. (Optimal setup: use Gemini 2.5 Flash Lite for maximum speed).", keySaved: "API Key saved successfully.",
        
        // Terjemahan Baru buat UI Statistik
        statTitle: "Statistics", statTotal: "Collection", statReading: "Reading", statCompleted: "Completed", statNotes: "Notes" 
    },
    id: {
        libEmpty: "Belum ada buku. Tap + untuk tambah.", continueReading: "Lanjutkan Membaca", bookCollection: "Koleksi Buku", loadingDocs: "Memuat Dokumen...", cancel: "Batal", delete: "Hapus",
        optSelect: "Pilih", optEdit: "Edit Detail", optDelete: "Hapus Permanen",
        pinnedBooks: "Buku Disematkan", navBookmark: "Catatan", bookmarkTitle: "Catatan", bookmarkEmpty: "Belum ada pembatas buku.", bookmarkCancel: "Batal", bookmarkSave: "Simpan",
        bookmarkModalTitle: "Catat", bookmarkTitlePlaceholder: "Judul Catatan (Opsional)", bookmarkNotePlaceholder: "Tulis catatan, pemikiran, atau ringkasan di sini...",
        welcomeTitle: "Selamat Datang di Baca. v5", welcomeDesc: "E-Reader PWA dengan Material Design 3. Didesain untuk kenyamanan membaca mutlak tanpa server, tanpa iklan.",
        welBackup: "Data Lokal & Backup", welBackupDesc: "Semua buku dan catatan disimpan di memori HP lu (Browser). <b>Wajib backup JSON berkala</b> biar data ga hilang kalau clear cache.",
        welFormat: "Format Buku", welFormatDesc: "Mendukung <b>EPUB</b> dan <b>PDF</b> murni (Teks). PDF hasil scan gambar tidak akan bisa diekstrak teksnya.",
        welPrivacy: "Privasi 100%", welPrivacyDesc: "Kami tidak mengumpulkan data lu. Semuanya diproses lokal.", welBtn: "Mengerti, Lanjut!",
        setMainTitle: "Pengaturan", setPalette: "Tema Latar", setLang: "Bahasa", setInfo: "Info & Dukungan", setData: "Data Aplikasi",
        btnBackup: "Backup Data", btnRestore: "Pulihkan", btnInfo: "Lihat Instruksi", btnDonate: "Traktir Kopi (Donasi)", btnClose: "Tutup",
        btnUpdate: "Cek Pembaruan", searchBooks: "Cari buku...", booksCount: "Buku", updateAvailableTitle: "Update Tersedia!",
        updateAvailableDesc: "Versi {v} udah rilis nih. Mau buka halaman download sekarang?", btnDownload: "Download", updateLatestTitle: "Sudah Versi Terbaru",
        updateLatestDesc: "Aplikasi lu udah pakai versi paling baru (v{v}).", updateError: "Gagal ngecek update. Pastiin internet lu nyala.",
        navBack: "Kembali", navToc: "Daftar Isi", navText: "Teks", navFull: "Penuh",
        readerLoading: "Memuat Buku...", tocTitle: "Daftar Isi", setTitle: "Tampilan",
        setTheme: "Mode Tema", setSize: "Ukuran Teks", setAlign: "Perataan Teks", setFont: "Jenis Font",
        searchPlaceholder: "Cari dalam buku...", searchNotFound: "Tidak ditemukan.",
        aiTitle: "Penjelasan", aiLoading: "Mencari referensi...", noInternet: "Tidak ada koneksi internet.",
        deleteNoteConfirm: "Hapus catatan/highlight ini?",
        editTitle: "Edit Detail", editBookTitle: "Judul Buku", editBookCover: "Gambar Sampul", editBookShape: "Bentuk Kartu", editCancel: "Batal", editSave: "Simpan", optCancel: "Batal", themeLight: "Mode Terang", themeDark: "Mode Gelap", amoledLabel: "AMOLED (Hitam Pekat)",
        shapeDyn: "Dinamis", shapeRound: "Bulat", shapeSquare: "Kotak",
        rawBakTitle: "Data Backup Mentah", rawBakDesc: "Karena batasan sistem perangkat, silakan salin teks di bawah ini dan simpan ke dalam Note/Pesan WhatsApp/File teks dengan aman.", rawBakCopy: "Salin Teks", rawBakClose: "Tutup",
        rawResTitle: "Pulihkan Data", rawResDesc: "Paste teks mentah (JSON) backup lu di kotak ini, ATAU pilih file JSON dari perangkat.", rawResFile: "Pilih File", rawResProcess: "Proses Teks", rawResClose: "Batal",
        setAiConfig: "Konfigurasi AI", geminiPlaceholder: "Gemini API Key...", geminiDesc: "Tambahkan API Key untuk mendapatkan penjelasan pintar langsung dari AI Gemini. (Disarankan pakai Gemini 2.5 Flash Lite biar enteng).", keySaved: "API Key berhasil disimpan.",
        
        // Terjemahan Baru buat UI Statistik
        statTitle: "Statistik", statTotal: "Koleksi", statReading: "Dibaca", statCompleted: "Selesai", statNotes: "Catatan"
    }
};

// PALET WARNA MATERIAL 3
window.M3_PALETTES = {
    'orchid': {
        light: '--md-sys-color-primary: 104, 52, 226; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 233, 221, 255; --md-sys-color-on-primary-container: 34, 0, 93; --md-sys-color-secondary-container: 232, 222, 248; --md-sys-color-on-secondary-container: 29, 25, 43; --md-sys-color-tertiary-container: 255, 216, 228; --md-sys-color-on-tertiary-container: 49, 17, 29; --md-sys-color-background: 254, 247, 255; --md-sys-color-on-background: 29, 27, 32; --md-sys-color-surface: 254, 247, 255; --md-sys-color-on-surface: 29, 27, 32; --md-sys-color-surface-variant: 231, 224, 236; --md-sys-color-on-surface-variant: 73, 69, 79;',
        dark: '--md-sys-color-primary: 208, 188, 255; --md-sys-color-on-primary: 56, 30, 114; --md-sys-color-primary-container: 79, 55, 139; --md-sys-color-on-primary-container: 233, 221, 255; --md-sys-color-secondary-container: 74, 68, 88; --md-sys-color-on-secondary-container: 232, 222, 248; --md-sys-color-tertiary-container: 99, 59, 72; --md-sys-color-on-tertiary-container: 255, 216, 228; --md-sys-color-background: 20, 18, 24; --md-sys-color-on-background: 230, 224, 233; --md-sys-color-surface: 20, 18, 24; --md-sys-color-on-surface: 230, 224, 233; --md-sys-color-surface-variant: 73, 69, 79; --md-sys-color-on-surface-variant: 202, 196, 208;'
    },
    'olive': {
        light: '--md-sys-color-primary: 76, 102, 43; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 205, 237, 163; --md-sys-color-on-primary-container: 17, 32, 0; --md-sys-color-secondary-container: 217, 226, 203; --md-sys-color-on-secondary-container: 21, 25, 17; --md-sys-color-tertiary-container: 191, 234, 223; --md-sys-color-on-tertiary-container: 0, 32, 28; --md-sys-color-background: 254, 252, 245; --md-sys-color-on-background: 26, 28, 24; --md-sys-color-surface: 254, 252, 245; --md-sys-color-on-surface: 26, 28, 24; --md-sys-color-surface-variant: 228, 227, 219; --md-sys-color-on-surface-variant: 68, 72, 63;',
        dark: '--md-sys-color-primary: 177, 208, 137; --md-sys-color-on-primary: 31, 55, 1; --md-sys-color-primary-container: 45, 78, 15; --md-sys-color-on-primary-container: 205, 237, 163; --md-sys-color-secondary-container: 61, 74, 54; --md-sys-color-on-secondary-container: 217, 226, 203; --md-sys-color-tertiary-container: 30, 78, 70; --md-sys-color-on-tertiary-container: 191, 234, 223; --md-sys-color-background: 26, 28, 24; --md-sys-color-on-background: 227, 227, 220; --md-sys-color-surface: 26, 28, 24; --md-sys-color-on-surface: 227, 227, 220; --md-sys-color-surface-variant: 68, 72, 63; --md-sys-color-on-surface-variant: 196, 200, 187;'
    },
    'coral': {
        light: '--md-sys-color-primary: 161, 62, 42; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 255, 218, 211; --md-sys-color-on-primary-container: 62, 8, 0; --md-sys-color-secondary-container: 255, 218, 211; --md-sys-color-on-secondary-container: 45, 21, 18; --md-sys-color-tertiary-container: 247, 224, 166; --md-sys-color-on-tertiary-container: 36, 26, 0; --md-sys-color-background: 255, 251, 255; --md-sys-color-on-background: 32, 26, 25; --md-sys-color-surface: 255, 251, 255; --md-sys-color-on-surface: 32, 26, 25; --md-sys-color-surface-variant: 245, 221, 218; --md-sys-color-on-surface-variant: 83, 67, 65;',
        dark: '--md-sys-color-primary: 255, 180, 168; --md-sys-color-on-primary: 96, 21, 5; --md-sys-color-primary-container: 125, 41, 23; --md-sys-color-on-primary-container: 255, 218, 211; --md-sys-color-secondary-container: 119, 87, 82; --md-sys-color-on-secondary-container: 255, 218, 211; --md-sys-color-tertiary-container: 85, 69, 25; --md-sys-color-on-tertiary-container: 247, 224, 166; --md-sys-color-background: 32, 26, 25; --md-sys-color-on-background: 236, 224, 223; --md-sys-color-surface: 32, 26, 25; --md-sys-color-on-surface: 236, 224, 223; --md-sys-color-surface-variant: 83, 67, 65; --md-sys-color-on-surface-variant: 216, 194, 191;'
    },
    'teal': {
        light: '--md-sys-color-primary: 0, 106, 96; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 116, 248, 229; --md-sys-color-on-primary-container: 0, 32, 28; --md-sys-color-secondary-container: 204, 228, 224; --md-sys-color-on-secondary-container: 5, 32, 29; --md-sys-color-tertiary-container: 219, 228, 249; --md-sys-color-on-tertiary-container: 10, 28, 43; --md-sys-color-background: 250, 253, 251; --md-sys-color-on-background: 24, 28, 27; --md-sys-color-surface: 250, 253, 251; --md-sys-color-on-surface: 24, 28, 27; --md-sys-color-surface-variant: 218, 229, 226; --md-sys-color-on-surface-variant: 63, 73, 71;',
        dark: '--md-sys-color-primary: 83, 219, 201; --md-sys-color-on-primary: 0, 55, 49; --md-sys-color-primary-container: 0, 80, 72; --md-sys-color-on-primary-container: 116, 248, 229; --md-sys-color-secondary-container: 51, 75, 72; --md-sys-color-on-secondary-container: 204, 228, 224; --md-sys-color-tertiary-container: 60, 72, 88; --md-sys-color-on-tertiary-container: 219, 228, 249; --md-sys-color-background: 24, 28, 27; --md-sys-color-on-background: 225, 227, 225; --md-sys-color-surface: 24, 28, 27; --md-sys-color-on-surface: 225, 227, 225; --md-sys-color-surface-variant: 63, 73, 71; --md-sys-color-on-surface-variant: 190, 201, 198;'
    },
    'lavender': {
        light: '--md-sys-color-primary: 112, 70, 185; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 236, 220, 255; --md-sys-color-on-primary-container: 37, 0, 89; --md-sys-color-secondary-container: 236, 221, 245; --md-sys-color-on-secondary-container: 33, 24, 42; --md-sys-color-tertiary-container: 255, 217, 227; --md-sys-color-on-tertiary-container: 49, 17, 30; --md-sys-color-background: 255, 251, 255; --md-sys-color-on-background: 28, 27, 30; --md-sys-color-surface: 255, 251, 255; --md-sys-color-on-surface: 28, 27, 30; --md-sys-color-surface-variant: 232, 224, 235; --md-sys-color-on-surface-variant: 74, 69, 78;',
        dark: '--md-sys-color-primary: 212, 187, 255; --md-sys-color-on-primary: 63, 8, 140; --md-sys-color-primary-container: 87, 43, 161; --md-sys-color-on-primary-container: 236, 220, 255; --md-sys-color-secondary-container: 74, 67, 84; --md-sys-color-on-secondary-container: 236, 221, 245; --md-sys-color-tertiary-container: 99, 59, 73; --md-sys-color-on-tertiary-container: 255, 217, 227; --md-sys-color-background: 28, 27, 30; --md-sys-color-on-background: 230, 225, 229; --md-sys-color-surface: 28, 27, 30; --md-sys-color-on-surface: 230, 225, 229; --md-sys-color-surface-variant: 74, 69, 78; --md-sys-color-on-surface-variant: 203, 196, 206;'
    },
    'rose': {
        light: '--md-sys-color-primary: 172, 50, 68; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 255, 218, 215; --md-sys-color-on-primary-container: 65, 0, 11; --md-sys-color-secondary-container: 255, 218, 214; --md-sys-color-on-secondary-container: 44, 21, 20; --md-sys-color-tertiary-container: 255, 221, 185; --md-sys-color-on-tertiary-container: 39, 25, 0; --md-sys-color-background: 255, 251, 255; --md-sys-color-on-background: 32, 26, 25; --md-sys-color-surface: 255, 251, 255; --md-sys-color-on-surface: 32, 26, 25; --md-sys-color-surface-variant: 245, 221, 219; --md-sys-color-on-surface-variant: 83, 67, 66;',
        dark: '--md-sys-color-primary: 255, 179, 177; --md-sys-color-on-primary: 104, 0, 22; --md-sys-color-primary-container: 139, 21, 46; --md-sys-color-on-primary-container: 255, 218, 215; --md-sys-color-secondary-container: 119, 86, 83; --md-sys-color-on-secondary-container: 255, 218, 214; --md-sys-color-tertiary-container: 90, 67, 24; --md-sys-color-on-tertiary-container: 255, 221, 185; --md-sys-color-background: 32, 26, 25; --md-sys-color-on-background: 236, 224, 223; --md-sys-color-surface: 32, 26, 25; --md-sys-color-on-surface: 236, 224, 223; --md-sys-color-surface-variant: 83, 67, 66; --md-sys-color-on-surface-variant: 216, 194, 192;'
    },
    'lime': {
        light: '--md-sys-color-primary: 82, 102, 0; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 211, 238, 126; --md-sys-color-on-primary-container: 22, 30, 0; --md-sys-color-secondary-container: 224, 228, 209; --md-sys-color-on-secondary-container: 24, 29, 21; --md-sys-color-tertiary-container: 200, 234, 219; --md-sys-color-on-tertiary-container: 3, 32, 26; --md-sys-color-background: 254, 252, 244; --md-sys-color-on-background: 27, 28, 23; --md-sys-color-surface: 254, 252, 244; --md-sys-color-on-surface: 27, 28, 23; --md-sys-color-surface-variant: 230, 228, 218; --md-sys-color-on-surface-variant: 70, 72, 63;',
        dark: '--md-sys-color-primary: 184, 209, 100; --md-sys-color-on-primary: 41, 53, 0; --md-sys-color-primary-container: 61, 77, 0; --md-sys-color-on-primary-container: 211, 238, 126; --md-sys-color-secondary-container: 64, 73, 58; --md-sys-color-on-secondary-container: 224, 228, 209; --md-sys-color-tertiary-container: 50, 75, 68; --md-sys-color-on-tertiary-container: 200, 234, 219; --md-sys-color-background: 27, 28, 23; --md-sys-color-on-background: 228, 226, 221; --md-sys-color-surface: 27, 28, 23; --md-sys-color-on-surface: 228, 226, 221; --md-sys-color-surface-variant: 70, 72, 63; --md-sys-color-on-surface-variant: 198, 199, 189;'
    },
    'sand': {
        light: '--md-sys-color-primary: 129, 85, 67; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 255, 219, 206; --md-sys-color-on-primary-container: 50, 18, 5; --md-sys-color-secondary-container: 255, 218, 211; --md-sys-color-on-secondary-container: 45, 22, 16; --md-sys-color-tertiary-container: 230, 240, 179; --md-sys-color-on-tertiary-container: 28, 33, 0; --md-sys-color-background: 255, 251, 255; --md-sys-color-on-background: 32, 26, 24; --md-sys-color-surface: 255, 251, 255; --md-sys-color-on-surface: 32, 26, 24; --md-sys-color-surface-variant: 245, 224, 219; --md-sys-color-on-surface-variant: 83, 67, 63;',
        dark: '--md-sys-color-primary: 246, 185, 161; --md-sys-color-on-primary: 76, 39, 24; --md-sys-color-primary-container: 102, 61, 45; --md-sys-color-on-primary-container: 255, 219, 206; --md-sys-color-secondary-container: 119, 87, 80; --md-sys-color-on-secondary-container: 255, 218, 211; --md-sys-color-tertiary-container: 74, 82, 33; --md-sys-color-on-tertiary-container: 230, 240, 179; --md-sys-color-background: 32, 26, 24; --md-sys-color-on-background: 236, 224, 221; --md-sys-color-surface: 32, 26, 24; --md-sys-color-on-surface: 236, 224, 221; --md-sys-color-surface-variant: 83, 67, 63; --md-sys-color-on-surface-variant: 216, 194, 189;'
    },
    'monochrome': {
        light: '--md-sys-color-primary: 43, 49, 52; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 218, 226, 230; --md-sys-color-on-primary-container: 12, 24, 27; --md-sys-color-secondary-container: 218, 226, 229; --md-sys-color-on-secondary-container: 24, 28, 30; --md-sys-color-tertiary-container: 226, 225, 236; --md-sys-color-on-tertiary-container: 26, 27, 33; --md-sys-color-background: 250, 252, 253; --md-sys-color-on-background: 25, 28, 29; --md-sys-color-surface: 250, 252, 253; --md-sys-color-on-surface: 25, 28, 29; --md-sys-color-surface-variant: 223, 227, 229; --md-sys-color-on-surface-variant: 66, 71, 74;',
        dark: '--md-sys-color-primary: 191, 199, 203; --md-sys-color-on-primary: 38, 49, 53; --md-sys-color-primary-container: 56, 74, 78; --md-sys-color-on-primary-container: 218, 226, 230; --md-sys-color-secondary-container: 66, 72, 75; --md-sys-color-on-secondary-container: 218, 226, 229; --md-sys-color-tertiary-container: 71, 70, 78; --md-sys-color-on-tertiary-container: 226, 225, 236; --md-sys-color-background: 25, 28, 29; --md-sys-color-on-background: 224, 227, 228; --md-sys-color-surface: 25, 28, 29; --md-sys-color-on-surface: 224, 227, 228; --md-sys-color-surface-variant: 66, 71, 74; --md-sys-color-on-surface-variant: 195, 200, 202;'
    },
    'blueberry': {
        light: '--md-sys-color-primary: 31, 80, 169; --md-sys-color-on-primary: 255, 255, 255; --md-sys-color-primary-container: 214, 227, 255; --md-sys-color-on-primary-container: 0, 27, 61; --md-sys-color-secondary-container: 216, 226, 255; --md-sys-color-on-secondary-container: 14, 28, 54; --md-sys-color-tertiary-container: 255, 218, 224; --md-sys-color-on-tertiary-container: 51, 17, 24; --md-sys-color-background: 253, 252, 255; --md-sys-color-on-background: 26, 28, 30; --md-sys-color-surface: 253, 252, 255; --md-sys-color-on-surface: 26, 28, 30; --md-sys-color-surface-variant: 224, 226, 236; --md-sys-color-on-surface-variant: 67, 71, 78;',
        dark: '--md-sys-color-primary: 167, 199, 255; --md-sys-color-on-primary: 0, 46, 106; --md-sys-color-primary-container: 12, 59, 137; --md-sys-color-on-primary-container: 214, 227, 255; --md-sys-color-secondary-container: 59, 72, 102; --md-sys-color-on-secondary-container: 216, 226, 255; --md-sys-color-tertiary-container: 102, 58, 67; --md-sys-color-on-tertiary-container: 255, 218, 224; --md-sys-color-background: 26, 28, 30; --md-sys-color-on-background: 227, 226, 230; --md-sys-color-surface: 26, 28, 30; --md-sys-color-on-surface: 227, 226, 230; --md-sys-color-surface-variant: 67, 71, 78; --md-sys-color-on-surface-variant: 196, 198, 207;'
    }
};

