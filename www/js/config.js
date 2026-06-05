window.APP_VERSION = "2.0.5";
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
            borderRadius: { '4xl': '32px', '5xl': '48px', 'inherit': 'inherit' },
            fontFamily: {     
                merriweather: ['Merriweather', 'serif'],
                playfair: ['"Playfair Display"', 'serif'],
                mono: ['"Space Mono"', 'monospace'],
                google: ['"Google Sans Flex"', 'sans-serif']
            }
        }
    }
};

// Data Palet Warna Material 3
const M3_PALETTES = {
    orchid: { // Sunset Orchid
        light: `--md-sys-color-primary:#A855F7;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#FED7AA;--md-sys-color-on-primary-container:#7C2D12;--md-sys-color-secondary-container:#FCE7F3;--md-sys-color-on-secondary-container:#831843;--md-sys-color-tertiary-container:#FCE7F3;--md-sys-color-on-tertiary-container:#701A75;--md-sys-color-background:#F5F0FB;--md-sys-color-on-background:#1F003C;--md-sys-color-surface:#FFFFFF;--md-sys-color-on-surface:#120024;--md-sys-color-surface-variant:#F3E8FF;--md-sys-color-on-surface-variant:#6B21A8;`,
        dark: `--md-sys-color-primary:#C084FC;--md-sys-color-on-primary:#3B0764;--md-sys-color-primary-container:#C2410C;--md-sys-color-on-primary-container:#FFEDD5;--md-sys-color-secondary-container:#831843;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#4A044E;--md-sys-color-on-tertiary-container:#FCE7F3;--md-sys-color-background:#0A0314;--md-sys-color-on-background:#F5E0FF;--md-sys-color-surface:#12091F;--md-sys-color-on-surface:#F3E8FF;--md-sys-color-surface-variant:#3B0764;--md-sys-color-on-surface-variant:#F5D0FE;`
    },
    olive: { // Organic Olive Green
        light: `--md-sys-color-primary:#3F6212;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#FDBA74;--md-sys-color-on-primary-container:#431407;--md-sys-color-secondary-container:#D1FAE5;--md-sys-color-on-secondary-container:#064E3B;--md-sys-color-tertiary-container:#FEF9C3;--md-sys-color-on-tertiary-container:#451A03;--md-sys-color-background:#F3F4ED;--md-sys-color-on-background:#1A2E05;--md-sys-color-surface:#FBFDF9;--md-sys-color-on-surface:#152B05;--md-sys-color-surface-variant:#E1EAD8;--md-sys-color-on-surface-variant:#3F5231;`, 
        dark: `--md-sys-color-primary:#A1C986;--md-sys-color-on-primary:#183803;--md-sys-color-primary-container:#7C2D12;--md-sys-color-on-primary-container:#FFEDD5;--md-sys-color-secondary-container:#064E3B;--md-sys-color-on-secondary-container:#D1FAE5;--md-sys-color-tertiary-container:#422006;--md-sys-color-on-tertiary-container:#FEF9C3;--md-sys-color-background:#0B1107;--md-sys-color-on-background:#ECFCCB;--md-sys-color-surface:#11180D;--md-sys-color-on-surface:#ECFCCB;--md-sys-color-surface-variant:#232E1C;--md-sys-color-on-surface-variant:#CCD8C2;` 
    },
    coral: { // Terracotta Coral
        light: `--md-sys-color-primary:#C2410C;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#CCFBF1;--md-sys-color-on-primary-container:#032F30;--md-sys-color-secondary-container:#FCE7F3;--md-sys-color-on-secondary-container:#500724;--md-sys-color-tertiary-container:#E2E8F0;--md-sys-color-on-tertiary-container:#0F172A;--md-sys-color-background:#FFF7F5;--md-sys-color-on-background:#3E0E00;--md-sys-color-surface:#FFFBFA;--md-sys-color-on-surface:#3E0E00;--md-sys-color-surface-variant:#FFD9D1;--md-sys-color-on-surface-variant:#7C3526;`,
        dark: `--md-sys-color-primary:#FFB5A5;--md-sys-color-on-primary:#5F1605;--md-sys-color-primary-container:#032F30;--md-sys-color-on-primary-container:#CCFBF1;--md-sys-color-secondary-container:#500724;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#1E293B;--md-sys-color-on-tertiary-container:#F1F5F9;--md-sys-color-background:#180C08;--md-sys-color-on-background:#FFD9D4;--md-sys-color-surface:#20120E;--md-sys-color-on-surface:#FFD9D4;--md-sys-color-surface-variant:#533F3A;--md-sys-color-on-surface-variant:#FFB5A5;`
    },
    teal: { // Oceanic Teal
        light: `--md-sys-color-primary:#0F766E;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#FCE7F3;--md-sys-color-on-primary-container:#500724;--md-sys-color-secondary-container:#FEF08A;--md-sys-color-on-secondary-container:#422006;--md-sys-color-tertiary-container:#F0FDFA;--md-sys-color-on-tertiary-container:#0F172A;--md-sys-color-background:#F0FDFA;--md-sys-color-on-background:#002026;--md-sys-color-surface:#FFFFFF;--md-sys-color-on-surface:#002026;--md-sys-color-surface-variant:#CCE7EC;--md-sys-color-on-surface-variant:#004F5D;`,
        dark: `--md-sys-color-primary:#5CD5EC;--md-sys-color-on-primary:#003640;--md-sys-color-primary-container:#500724;--md-sys-color-on-primary-container:#FCE7F3;--md-sys-color-secondary-container:#422006;--md-sys-color-on-secondary-container:#FEF08A;--md-sys-color-tertiary-container:#115E59;--md-sys-color-on-tertiary-container:#F0FDFA;--md-sys-color-background:#031417;--md-sys-color-on-background:#B6F0FC;--md-sys-color-surface:#061C20;--md-sys-color-on-surface:#B6F0FC;--md-sys-color-surface-variant:#304D54;--md-sys-color-on-surface-variant:#B6F0FC;`
    },
    lavender: { // Regal Lavender
        light: `--md-sys-color-primary:#6D28D9;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#ECFCCB;--md-sys-color-on-primary-container:#1E293B;--md-sys-color-secondary-container:#FFE4E6;--md-sys-color-on-secondary-container:#4C0519;--md-sys-color-tertiary-container:#FDF4FF;--md-sys-color-on-tertiary-container:#3B0764;--md-sys-color-background:#FAF5FF;--md-sys-color-on-background:#1D0061;--md-sys-color-surface:#FCFAFF;--md-sys-color-on-surface:#1D0061;--md-sys-color-surface-variant:#E8DFFF;--md-sys-color-on-surface-variant:#5E17EB;`,
        dark: `--md-sys-color-primary:#C4B5FD;--md-sys-color-on-primary:#2E1065;--md-sys-color-primary-container:#2D3748;--md-sys-color-on-primary-container:#ECFCCB;--md-sys-color-secondary-container:#4C0519;--md-sys-color-on-secondary-container:#FFE4E6;--md-sys-color-tertiary-container:#3B0764;--md-sys-color-on-tertiary-container:#FDF4FF;--md-sys-color-background:#090412;--md-sys-color-on-background:#EDE9FE;--md-sys-color-surface:#110A1E;--md-sys-color-on-surface:#EDE9FE;--md-sys-color-surface-variant:#3C00A6;--md-sys-color-on-surface-variant:#E8DFFF;`
    },
    rose: { // Crimson Rosewood
        light: `--md-sys-color-primary:#BE123C;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#FEF08A;--md-sys-color-on-primary-container:#422006;--md-sys-color-secondary-container:#E0F2FE;--md-sys-color-on-secondary-container:#0369A1;--md-sys-color-tertiary-container:#FFF1F2;--md-sys-color-on-tertiary-container:#4C0519;--md-sys-color-background:#FFF5F5;--md-sys-color-on-background:#450A0A;--md-sys-color-surface:#FFFBFB;--md-sys-color-on-surface:#450A0A;--md-sys-color-surface-variant:#FCA5A5;--md-sys-color-on-surface-variant:#B91C1C;`, 
        dark: `--md-sys-color-primary:#FCA5A5;--md-sys-color-on-primary:#450A0A;--md-sys-color-primary-container:#422006;--md-sys-color-on-primary-container:#FEF08A;--md-sys-color-secondary-container:#0369A1;--md-sys-color-on-secondary-container:#E0F2FE;--md-sys-color-tertiary-container:#4C0519;--md-sys-color-on-tertiary-container:#FFF1F2;--md-sys-color-background:#1F0505;--md-sys-color-on-background:#FEE2E2;--md-sys-color-surface:#260C0C;--md-sys-color-on-surface:#FEE2E2;--md-sys-color-surface-variant:#7F1D1D;--md-sys-color-on-surface-variant:#FCA5A5;` 
    },
    lime: { // Forest Lime
        light: `--md-sys-color-primary:#4D7C0F;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#E9D5FF;--md-sys-color-on-primary-container:#3B0764;--md-sys-color-secondary-container:#FCE7F3;--md-sys-color-on-secondary-container:#831843;--md-sys-color-tertiary-container:#F0FDF4;--md-sys-color-on-tertiary-container:#166534;--md-sys-color-background:#F7FEE7;--md-sys-color-on-background:#132000;--md-sys-color-surface:#FCFDF7;--md-sys-color-on-surface:#132000;--md-sys-color-surface-variant:#D1E897;--md-sys-color-on-surface-variant:#4C6A00;`,
        dark: `--md-sys-color-primary:#C5E85C;--md-sys-color-on-primary:#253600;--md-sys-color-primary-container:#3B0764;--md-sys-color-on-primary-container:#E9D5FF;--md-sys-color-secondary-container:#831843;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#14532D;--md-sys-color-on-tertiary-container:#F0FDF4;--md-sys-color-background:#0A0E02;--md-sys-color-on-background:#E1FF85;--md-sys-color-surface:#0F1404;--md-sys-color-on-surface:#E1FF85;--md-sys-color-surface-variant:#3A5000;--md-sys-color-on-surface-variant:#C5E85C;`
    },
    sand: { // Warm Sand
        light: `--md-sys-color-primary:#78350F;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#DBEAFE;--md-sys-color-on-primary-container:#1E40AF;--md-sys-color-secondary-container:#FCE7F3;--md-sys-color-on-secondary-container:#9D174D;--md-sys-color-tertiary-container:#FFF8E1;--md-sys-color-on-tertiary-container:#6D4C41;--md-sys-color-background:#FDFBF7;--md-sys-color-on-background:#3E2723;--md-sys-color-surface:#FFFDF9;--md-sys-color-on-surface:#3E2723;--md-sys-color-surface-variant:#EFEBE9;--md-sys-color-on-surface-variant:#6D4C41;`,
        dark: `--md-sys-color-primary:#D7CCC8;--md-sys-color-on-primary:#3E2723;--md-sys-color-primary-container:#1E40AF;--md-sys-color-on-primary-container:#DBEAFE;--md-sys-color-secondary-container:#9D174D;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#241A17;--md-sys-color-on-tertiary-container:#FFF8E1;--md-sys-color-background:#130E0C;--md-sys-color-on-background:#FFE0B2;--md-sys-color-surface:#1C1412;--md-sys-color-on-surface:#FFE0B2;--md-sys-color-surface-variant:#4E342E;--md-sys-color-on-surface-variant:#D7CCC8;`
    },
    monochrome: { // Monochrome Tech
        light: `--md-sys-color-primary:#1E293B;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#FEF08A;--md-sys-color-on-primary-container:#713F12;--md-sys-color-secondary-container:#E2E8F0;--md-sys-color-on-secondary-container:#0F172A;--md-sys-color-tertiary-container:#F5F5F5;--md-sys-color-on-tertiary-container:#212121;--md-sys-color-background:#F1F5F9;--md-sys-color-on-background:#212121;--md-sys-color-surface:#FAFAFA;--md-sys-color-on-surface:#212121;--md-sys-color-surface-variant:#ECEFF1;--md-sys-color-on-surface-variant:#546E7A;`, 
        dark: `--md-sys-color-primary:#CFD8DC;--md-sys-color-on-primary:#263238;--md-sys-color-primary-container:#713F12;--md-sys-color-on-primary-container:#FEF08A;--md-sys-color-secondary-container:#0F172A;--md-sys-color-on-secondary-container:#E2E8F0;--md-sys-color-tertiary-container:#212121;--md-sys-color-on-tertiary-container:#F5F5F5;--md-sys-color-background:#101416;--md-sys-color-on-background:#ECEFF1;--md-sys-color-surface:#151A1D;--md-sys-color-on-surface:#ECEFF1;--md-sys-color-surface-variant:#37474F;--md-sys-color-on-surface-variant:#CFD8DC;` 
    },
    blueberry: { // Electric Cobalt
        light: `--md-sys-color-primary:#1D4ED8;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#FCE7F3;--md-sys-color-on-primary-container:#4C0519;--md-sys-color-secondary-container:#FEF08A;--md-sys-color-on-secondary-container:#422006;--md-sys-color-tertiary-container:#E8EAF6;--md-sys-color-on-tertiary-container:#1A237E;--md-sys-color-background:#EFF6FF;--md-sys-color-on-background:#00153B;--md-sys-color-surface:#F4F9FF;--md-sys-color-on-surface:#00153B;--md-sys-color-surface-variant:#C2ECFF;--md-sys-color-on-surface-variant:#1A237E;`, 
        dark: `--md-sys-color-primary:#80CAFF;--md-sys-color-on-primary:#00153B;--md-sys-color-primary-container:#4C0519;--md-sys-color-on-primary-container:#FCE7F3;--md-sys-color-secondary-container:#422006;--md-sys-color-on-secondary-container:#FEF08A;--md-sys-color-tertiary-container:#001E45;--md-sys-color-on-tertiary-container:#E8EAF6;--md-sys-color-background:#040A1A;--md-sys-color-on-background:#C2ECFF;--md-sys-color-surface:#07122E;--md-sys-color-on-surface:#C2ECFF;--md-sys-color-surface-variant:#1A237E;--md-sys-color-on-surface-variant:#80CAFF;` 
    }
};

// Data Kamus / Terjemahan Bahasa (i18n)
const i18n = {
    id: {
        libEmpty: "Perpustakaan Kosong.", searchBooks: "Cari buku...", loadingDocs: "Membaca Dokumen...", 
        booksCount: "Buku", continueReading: "Lanjutkan Membaca", bookCollection: "Koleksi Buku", 
        selected: "Terpilih", cancel: "Batal", delete: "Hapus", deleteConfirm: "Hapus buku yang dipilih secara permanen?", 
        optSelect: "Pilih Beberapa", optEdit: "Edit Detail", optDelete: "Hapus Permanen",
        
        pinnedBooks: "Buku Disematkan",
        optPin: "Sematkan Buku", optUnpin: "Lepas Sematan",
        
        navBookmark: "Bookmark",
        bookmarkTitle: "Panel Bookmark",
        bookmarkEmpty: "Belum ada pembatas buku.",
        
        bookmarkModalTitle: "Bookmark",
        bookmarkTitlePlaceholder: "Judul Bookmark...",
        bookmarkNotePlaceholder: "Tulis catatan (opsional)...",
        bookmarkCancel: "Batal",
        bookmarkSave: "Simpan",

        extractingCover: "Mengekstrak Sampul...", readingPage: "Membaca Halaman", formattingText: "Memformat Teks...",
        extractingEpub: "Mengekstrak EPUB...", analyzingStruct: "Menganalisa Struktur...", extractingChapter: "Mengekstrak Bab",
        welcomeTitle: "Selamat Datang di Baca.", welcomeDesc: "Harap baca instruksi berikut untuk pengalaman membaca yang optimal.",
        welBackup: "Pencadangan Data", welBackupDesc: "Gunakan fitur Backup di Pengaturan. Data di-backup jadi file JSON dan otomatis masuk ke folder <b>Documents</b> di penyimpanan utama HP. Ingat, di folder Documents, bukan di DCIM atau Download! Nanti buat restore, anda tinggal klik 'Pilih File' dan cari file tersebut.",
        welFormat: "Batasan Format", welFormatDesc: "<b>PDF:</b> Hanya teks. Gambar diabaikan.<br><b>EPUB:</b> Didukung penuh.",
        welPrivacy: "Privasi Total", welPrivacyDesc: "Diproses secara lokal di perangkat Anda.", welBtn: "Mengerti",
        setMainTitle: "Pengaturan", setPalette: "Palet Tema", setLang: "Bahasa", setInfo: "Info & Dukungan",
        btnInfo: "Lihat Instruksi", btnDonate: "Traktir Kopi (Donasi)", btnClose: "Tutup",
        setData: "Data Aplikasi", btnBackup: "Backup Data", btnRestore: "Pulihkan",
        
        // Teks Sistem Cek Update
        btnUpdate: "Cek Pembaruan",
        updateChecking: "Mengecek versi...",
        updateLatestTitle: "Sudah Versi Terbaru",
        updateLatestDesc: `Aplikasi lu udah pakai versi paling baru.`,
        updateAvailableTitle: "Update Tersedia!",
        updateAvailableDesc: "Versi terbaru udah rilis nih. Mau buka halaman download sekarang?",
        updateError: "Gagal ngecek update. Pastiin internet lu nyala atau Repo Github lu udah bener.",
        btnDownload: "Download",

        navBack: "Kembali", navToc: "Daftar Isi", navSearch: "Pencarian", navText: "Teks", navFull: "Penuh",
        readerLoading: "Memuat Buku...", tocTitle: "Daftar Isi", setTitle: "Tampilan",
        setTheme: "Mode Tema", setSize: "Ukuran Teks", setAlign: "Perataan Teks", setFont: "Jenis Font",
        searchPlaceholder: "Cari dalam buku...", searchNotFound: "Tidak ditemukan.",
        aiTitle: "Penjelasan", aiLoading: "Mencari referensi...", noInternet: "Koneksi internet bermasalah.",
        deleteNoteConfirm: "Hapus catatan/sorotan ini?",
        editTitle: "Edit Detail", editBookTitle: "Judul Buku", editBookCover: "Gambar Sampul", editBookShape: "Bentuk Kartu", editCancel: "Batal", editSave: "Simpan", optCancel: "Batal", themeLight: "Mode Terang", themeDark: "Mode Gelap", amoledLabel: "AMOLED (Hitam Pekat)",
        shapeDyn: "Dinamis", shapeRound: "Bulat", shapeSquare: "Kotak",                
        rawBakTitle: "Data Backup Mentah", rawBakDesc: "Karena batasan sistem perangkat, silakan salin teks di bawah ini dan simpan ke dalam Note/Pesan WhatsApp/File teks dengan aman.", rawBakCopy: "Salin Teks", rawBakClose: "Tutup",
        rawResTitle: "Pulihkan Data", rawResDesc: "Paste teks mentah (JSON) backup lu di kotak ini, ATAU pilih file JSON dari perangkat.", rawResFile: "Pilih File", rawResProcess: "Proses Teks", rawResClose: "Batal",
        setAiConfig: "Konfigurasi AI", geminiPlaceholder: "Gemini API Key...", geminiDesc: "Tambahkan API Key untuk mendapatkan penjelasan pintar dari AI. (Saran optimal: gunakan Gemini 2.5 Flash Lite untuk kecepatan maksimal).", keySaved: "API Key berhasil disimpan.",

        statTitle: "Statistik Membaca", statTotal: "Koleksi", statReading: "Dibaca", statCompleted: "Selesai", statNotes: "Catatan"
    },
    en: {
        libEmpty: "Library is Empty.", searchBooks: "Search books...", loadingDocs: "Reading Document...", 
        booksCount: "Books", continueReading: "Continue Reading", bookCollection: "Book Collection", 
        selected: "Selected", cancel: "Cancel", delete: "Delete", deleteConfirm: "Permanently delete selected books?", 
        optSelect: "Select Multiple", optEdit: "Edit Details", optDelete: "Delete Permanently",
        
        pinnedBooks: "Pinned Books",
        optPin: "Pin Book", optUnpin: "Unpin Book",
        
        navBookmark: "Bookmark",
        bookmarkTitle: "Bookmarks Panel",
        bookmarkEmpty: "No bookmarks yet.",
        
        bookmarkModalTitle: "Bookmark",
        bookmarkTitlePlaceholder: "Bookmark Title...",
        bookmarkNotePlaceholder: "Write a note (optional)...",
        bookmarkCancel: "Cancel",
        bookmarkSave: "Save",

        extractingCover: "Extracting Cover...", readingPage: "Reading Page", formattingText: "Formatting Text...",
        extractingEpub: "Extracting EPUB...", analyzingStructure: "Analyzing Structure...", extractingChapter: "Extracting Chapter",
        welcomeTitle: "Welcome to Baca.", welcomeDesc: "Please read these instructions for the optimal reading experience.",
        welBackup: "Data Backup", welBackupDesc: "Use the Backup feature in Settings. Data is saved as a JSON file directly to the <b>Documents</b> folder on your device's main storage (not DCIM or Downloads). To restore, simply find and select that backup file from the Documents folder.",
        welFormat: "Format Limitations", welFormatDesc: "<b>PDF:</b> Text only. Images ignored.<br><b>EPUB:</b> Fully supported.",
        welPrivacy: "Total Privacy", welPrivacyDesc: "Processed locally on your device.", welBtn: "Got it",
        setMainTitle: "Settings", setPalette: "Theme Palette", setLang: "Language", setInfo: "Info & Support",
        btnInfo: "View Instructions", btnDonate: "Buy Me a Coffee", btnClose: "Close",
        setData: "App Data", btnBackup: "Backup Data", btnRestore: "Restore Data",
        
        // Teks Sistem Cek Update
        btnUpdate: "Check for Updates",
        updateChecking: "Checking version...",
        updateLatestTitle: "Up to Date",
        updateLatestDesc: `You are running the latest version.`,
        updateAvailableTitle: "Update Available!",
        updateAvailableDesc: "Version is out. Open the download page now?",
        updateError: "Failed to check for updates. Check your internet connection.",
        btnDownload: "Download",

        navBack: "Back", navToc: "Contents", navSearch: "Search", navText: "Text", navFull: "Full",
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

        statTitle: "Statistics", statTotal: "Collection", statReading: "Reading", statCompleted: "Completed", statNotes: "Notes"
    }
};
