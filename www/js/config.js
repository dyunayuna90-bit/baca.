window.APP_VERSION = "2.0.6";
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
        welBackup: "Pencadangan Data", welBackupDesc: "Gunakan fitur Backup di Pengaturan. Tersedia opsi <b>JSON</b> (hanya progres) dan <b>ZIP</b> (full backup isi buku). File disimpan di folder <b>Documents</b> HP lu.",
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
        rawResTitle: "Pulihkan Data", rawResDesc: "Pilih file JSON (untuk progres) atau ZIP (untuk full backup) dari perangkat lu.", rawResFile: "Pilih File", rawResProcess: "Proses Teks", rawResClose: "Batal",
        setAiConfig: "Konfigurasi AI", geminiPlaceholder: "Gemini API Key...", geminiDesc: "Tambahkan API Key untuk mendapatkan penjelasan pintar dari AI. (Saran optimal: gunakan Gemini 2.5 Flash Lite untuk kecepatan maksimal).", keySaved: "API Key berhasil disimpan.",

        statTitle: "Statistik Membaca", statTotal: "Koleksi", statReading: "Dibaca", statCompleted: "Selesai", statNotes: "Catatan",

        // Fitur Hapus Sampul
        btnClearCovers: "Hapus Semua Sampul (Biar Ringan)",
        clearCoversTitle: "Hapus Semua Sampul?",
        clearCoversDesc: "Semua gambar sampul akan dihapus permanen untuk menghemat memori. Buku dan progres bacaan tetap aman 100%. Lanjutkan?",
        clearCoversSuccess: "Semua sampul berhasil dihapus! Aplikasi sekarang jauh lebih ringan.",

        // Fitur Hapus Semua Buku
        btnClearAllBooks: "Hapus Semua Buku (Reset Total)",
        clearAllBooksTitle: "Hapus Semua Buku?",
        clearAllBooksDesc: "Semua buku, progres, catatan, sampul, dan konten akan dihapus permanen. Tindakan ini tidak bisa dibatalkan. Lanjutkan?",
        clearAllBooksSuccessTitle: "Semua Buku Dihapus",
        clearAllBooksSuccess: "Semua buku berhasil dihapus. Perpustakaan sekarang kosong.",

        // Opsi Backup Baru & Status Fallback
        bakModalTitle: "Pilih Jenis Backup", bakModalDesc: "Pilih format backup yang sesuai dengan kebutuhan lu:",
        bakJsonTitle: "JSON (Progres Saja)", bakJsonDesc: "Sangat ringan & cepat. Hanya menyimpan daftar buku, progres, dan catatan. Lu harus upload ulang file bukunya nanti sebelum direstore.",
        bakZipTitle: "ZIP (Paket Lengkap)", bakZipDesc: "Menyimpan seluruh teks buku, sampul, progres, dan catatan jadi satu file ZIP. Lebih besar, tapi bisa langsung dibaca setelah direstore.",
        bakZipWarn: "Peringatan: Proses ZIP butuh memori besar. Bisa bikin ngelag atau crash di HP spesifikasi rendah.",
        bakCancel: "Batal",
        btnBakJson: "Backup JSON", btnBakZip: "Backup ZIP",
        
        bakLoadingTitle: "Memproses Backup",
        bakJsonLoading: "Menyiapkan file backup JSON yang ringan...",
        bakZipLoading: "Menyiapkan file ZIP... (Tunggu sebentar, ini butuh waktu dan tenaga hp ekstra)",
        bakSuccessTitle: "Backup Sukses",
        bakSuccessJson: "File JSON berhasil dibuat dan siap di-save. Aman!",
        bakSuccessZip: "File ZIP berhasil disusun dan siap di-save. Mantap!",

        zipProcess: "Membuat ZIP...", zipWait: "Mohon tunggu, sedang menyusun dan mengompres file lu...",
        zipExtract: "Mengekstrak ZIP...", zipExtractWait: "Sedang membaca dan memulihkan isi buku dari file ZIP...",
        zipRestoreConfirm: "Ada {n} buku paket lengkap di file ZIP ini. Semuanya bakal dipulihkan ke library lu. Lanjut?",

        // --- NEW TRANSLATIONS FOR PHASE 1: DUAL-MODE PDF ---
        scrollRakTitle: "Rak Mode Scroll",
        canvasRakTitle: "Canvas Mode Books",
        pdfModePromptTitle: "Pilih Mode Membaca",
        pdfModePromptDesc: "PDF ini memiliki teks yang dapat diekstrak secara dinamis. Silakan pilih mode membaca yang sesuai dengan kebutuhan Anda:",
        pdfModeBtnScroll: "Mode Scroll (Rekomendasi)",
        pdfModeBtnScrollDesc: "Gaya membaca mengalir, ukuran & jenis font bisa diubah bebas, mendukung text selection, highlight, dan Gemini AI.",
        pdfModeBtnCanvas: "Mode Canvas (Layout Asli)",
        pdfModeBtnCanvasDesc: "Menampilkan halaman asli dokumen seperti cetakan fisik. Mendukung zoom cubit dengan jari, tapi tidak mendukung ubah font, AI, dan text selection.",
        pdfCanvasWarning: "Fitur tipografi (ukuran font, perataan, dll), AI penjelasan, dan text selection dinonaktifkan pada Mode Canvas.",
        pdfPageLabel: "Hal",
        pdfTotalPages: "Total Halaman",
        pdfCanvasBadge: "PDF-CANVAS",
        pdfScrollBadge: "PDF-SCROLL",
        txtPageGo: "Lompat ke Halaman:",
        btnGoPage: "Lompat",
        canvasNoText: "PDF ini terdeteksi sebagai pindaian gambar (scanned/OCR). Otomatis di-import ke Mode Canvas agar format visual aslinya tetap terjaga sempurna.",

        // --- PHASE 3 UI UPDATES & NEW MODALS ---
        tocCanvasWarning: "Untuk mode canvas, daftar isi tidak tersedia.",
        setHideTitles: "Sembunyikan Judul Buku di Rak",
        uploadDuplicateTitle: "Buku Sudah Ada",
        uploadDuplicateDesc: "Buku berikut sudah ada di rakmu. Tambahkan lagi (sebagai file baru) atau lewati saja?",
        btnSkip: "Lewati",
        btnAddAnyway: "Tambahkan Saja",
        batchPdfTitle: "Pilih Mode PDF",
        batchPdfDesc: "Pilih mode membaca untuk PDF yang baru diunggah:",
        btnStartProcess: "Mulai Proses",
        bookmarkSearchPlaceholder: "Cari bookmark...",
        importDoneTitle: "Selesai Import",
        importSuccessCount: "{n} buku berhasil diimpor.",
        importFailedCount: "{n} gagal:",
        folderNoFiles: "Tidak ada file PDF, EPUB, TXT, atau MD di folder ini."
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
        welBackup: "Data Backup", welBackupDesc: "Use the Backup feature in Settings. Available in <b>JSON</b> (progress only) and <b>ZIP</b> (full backup). Files are saved to the <b>Documents</b> folder.",
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
        rawResTitle: "Restore Data", rawResDesc: "Select a JSON file (for progress) or ZIP file (for full backup) from your device.", rawResFile: "Select File", rawResProcess: "Process Text", rawResClose: "Cancel",
        setAiConfig: "AI Configuration", geminiPlaceholder: "Gemini API Key...", geminiDesc: "Add your API Key to get smart definitions from AI. (Optimal setup: use Gemini 2.5 Flash Lite for maximum speed).", keySaved: "API Key saved successfully.",

        statTitle: "Statistics", statTotal: "Collection", statReading: "Reading", statCompleted: "Completed", statNotes: "Notes",

        // Fitur Hapus Sampul
        btnClearCovers: "Clear All Covers (Save Memory)",
        clearCoversTitle: "Clear All Covers?",
        clearCoversDesc: "All book covers will be permanently deleted to save memory. Book text and reading progress are 100% safe. Continue?",
        clearCoversSuccess: "All covers successfully cleared! The app is now lighter.",

        // Fitur Hapus Semua Buku
        btnClearAllBooks: "Clear All Books (Full Reset)",
        clearAllBooksTitle: "Clear All Books?",
        clearAllBooksDesc: "All books, progress, notes, covers, and content will be permanently deleted. This action cannot be undone. Continue?",
        clearAllBooksSuccessTitle: "All Books Cleared",
        clearAllBooksSuccess: "All books have been deleted. Your library is now empty.",

        // Opsi Backup Baru & Status Fallback
        bakModalTitle: "Select Backup Type", bakModalDesc: "Choose the backup format you need:",
        bakJsonTitle: "JSON (Progress Only)", bakJsonDesc: "Very lightweight. Saves only your book list, progress, and notes. You must re-upload the original books later.",
        bakZipTitle: "ZIP (Full Backup)", bakZipDesc: "Complete package. Saves all book texts, covers, progress, and notes. Ready to read immediately after restore.",
        bakZipWarn: "Warning: ZIP process requires high memory. May cause lag or crash on low-end devices.",
        bakCancel: "Cancel",
        btnBakJson: "Backup JSON", btnBakZip: "Backup ZIP",

        bakLoadingTitle: "Processing Backup",
        bakJsonLoading: "Preparing lightweight JSON backup...",
        bakZipLoading: "Preparing ZIP file... (Please wait, this takes time and extra processing power)",
        bakSuccessTitle: "Backup Success",
        bakSuccessJson: "JSON file successfully created and ready to save. Safe!",
        bakSuccessZip: "ZIP file successfully compiled and ready to save. Awesome!",

        zipProcess: "Creating ZIP...", zipWait: "Please wait, compiling and compressing your files...",
        zipExtract: "Extracting ZIP...", zipExtractWait: "Reading and restoring books from the ZIP file...",
        zipRestoreConfirm: "Found {n} complete books in this ZIP. They will be restored to your library. Continue?",

        // --- NEW TRANSLATIONS FOR PHASE 1: DUAL-MODE PDF ---
        scrollRakTitle: "Scroll Mode Books",
        canvasRakTitle: "Canvas Mode Books",
        pdfModePromptTitle: "Choose Reading Mode",
        pdfModePromptDesc: "This PDF contains extractable dynamic text. Please choose your preferred reading style:",
        pdfModeBtnScroll: "Scroll Mode (Recommended)",
        pdfModeBtnScrollDesc: "Flowing text style, adjustable font size/type, supports text selection, highlights, and Gemini AI.",
        pdfModeBtnCanvas: "Canvas Mode (Original Layout)",
        pdfModeBtnCanvasDesc: "Displays the original visual layout of the pages. Supports pinch-to-zoom gestures, but layout/fonts/AI are disabled.",
        pdfCanvasWarning: "Typography, AI definitions, and text selection are disabled in Canvas Mode.",
        pdfPageLabel: "Page",
        pdfTotalPages: "Total Pages",
        pdfCanvasBadge: "PDF-CANVAS",
        pdfScrollBadge: "PDF-SCROLL",
        txtPageGo: "Go to Page:",
        btnGoPage: "Jump",
        canvasNoText: "This PDF is detected as a scanned image document. Automatically imported to Canvas Mode to preserve its original visual layout.",

        // --- PHASE 3 UI UPDATES & NEW MODALS ---
        tocCanvasWarning: "Table of contents is not available in canvas mode.",
        setHideTitles: "Hide Book Titles in Shelf",
        uploadDuplicateTitle: "Book Already Exists",
        uploadDuplicateDesc: "The following book is already in your shelf. Add anyway (as new) or skip?",
        btnSkip: "Skip",
        btnAddAnyway: "Add Anyway",
        batchPdfTitle: "Select PDF Mode",
        batchPdfDesc: "Choose reading mode for the newly uploaded PDFs:",
        btnStartProcess: "Start Processing",
        bookmarkSearchPlaceholder: "Search bookmarks...",
        importDoneTitle: "Import Complete",
        importSuccessCount: "{n} books imported successfully.",
        importFailedCount: "{n} failed:",
        folderNoFiles: "No PDF, EPUB, TXT, or MD files found in this folder."
    },
    es: {
        libEmpty: "La biblioteca está vacía.", searchBooks: "Buscar libros...", loadingDocs: "Leyendo documento...", 
        booksCount: "Libros", continueReading: "Continuar leyendo", bookCollection: "Colección de libros", 
        selected: "Seleccionado", cancel: "Cancelar", delete: "Eliminar", deleteConfirm: "¿Eliminar permanentemente los libros seleccionados?", 
        optSelect: "Seleccionar varios", optEdit: "Editar detalles", optDelete: "Eliminar permanentemente",
        
        pinnedBooks: "Libros fijados",
        optPin: "Fijar libro", optUnpin: "Desfijar libro",
        
        navBookmark: "Marcador",
        bookmarkTitle: "Panel de marcadores",
        bookmarkEmpty: "Aún no hay marcadores.",
        
        bookmarkModalTitle: "Marcador",
        bookmarkTitlePlaceholder: "Título del marcador...",
        bookmarkNotePlaceholder: "Escribe una nota (opcional)...",
        bookmarkCancel: "Cancelar",
        bookmarkSave: "Guardar",

        extractingCover: "Extrayendo portada...", readingPage: "Leyendo página", formattingText: "Formateando texto...",
        extractingEpub: "Extrayendo EPUB...", analyzingStructure: "Analizando estructura...", extractingChapter: "Extrayendo capítulo",
        welcomeTitle: "Bienvenido a Baca.", welcomeDesc: "Por favor, lee estas instrucciones para una experiencia de lectura óptima.",
        welBackup: "Copia de seguridad", welBackupDesc: "Usa la función en Ajustes. Disponible en <b>JSON</b> (solo progreso) y <b>ZIP</b> (completo). Se guardan en la carpeta <b>Documentos</b>.",
        welFormat: "Limitaciones de formato", welFormatDesc: "<b>PDF:</b> Solo texto. Se ignoran las imágenes.<br><b>EPUB:</b> Totalmente compatible.",
        welPrivacy: "Privacidad total", welPrivacyDesc: "Procesado localmente en tu dispositivo.", welBtn: "Entendido",
        setMainTitle: "Ajustes", setPalette: "Paleta de temas", setLang: "Idioma", setInfo: "Información y soporte",
        btnInfo: "Ver instrucciones", btnDonate: "Cómprame un café", btnClose: "Cerrar",
        setData: "Datos de la app", btnBackup: "Copia de seguridad", btnRestore: "Restaurar datos",
        
        // Teks Sistem Cek Update
        btnUpdate: "Buscar actualizaciones",
        updateChecking: "Comprobando versión...",
        updateLatestTitle: "Actualizado",
        updateLatestDesc: `Estás usando la última versión.`,
        updateAvailableTitle: "¡Actualización disponible!",
        updateAvailableDesc: "Hay una nueva versión. ¿Abrir la página de descarga ahora?",
        updateError: "Error al comprobar actualizaciones. Revisa tu conexión a internet.",
        btnDownload: "Descargar",

        navBack: "Atrás", navToc: "Índice", navSearch: "Buscar", navText: "Texto", navFull: "Completo",
        readerLoading: "Cargando libro...", tocTitle: "Índice", setTitle: "Apariencia",
        setTheme: "Modo de tema", setSize: "Tamaño del texto", setAlign: "Alineación", setFont: "Tipo de letra",
        searchPlaceholder: "Buscar en el libro...", searchNotFound: "No encontrado.",
        aiTitle: "Definición", aiLoading: "Buscando referencias...", noInternet: "Problema de conexión a internet.",
        deleteNoteConfirm: "¿Eliminar esta nota/resaltado?",
        editTitle: "Editar detalles", editBookTitle: "Título del libro", editBookCover: "Imagen de portada", editBookShape: "Forma de la tarjeta", editCancel: "Cancelar", editSave: "Guardar", optCancel: "Cancelar", themeLight: "Modo claro", themeDark: "Modo oscuro", amoledLabel: "AMOLED (Negro puro)",
        shapeDyn: "Dinámico", shapeRound: "Redondeado", shapeSquare: "Cuadrado",               
        rawBakTitle: "Datos de copia de seguridad sin procesar", rawBakDesc: "Debido a restricciones del dispositivo, copia el texto a continuación y guárdalo de forma segura en tus Notas.", rawBakCopy: "Copiar texto", rawBakClose: "Cerrar",
        rawResTitle: "Restaurar datos", rawResDesc: "Selecciona un archivo JSON (progreso) o ZIP (completo) desde tu dispositivo.", rawResFile: "Seleccionar archivo", rawResProcess: "Procesar texto", rawResClose: "Cancelar",
        setAiConfig: "Configuración de IA", geminiPlaceholder: "Clave API de Gemini...", geminiDesc: "Añade tu clave API para obtener definiciones inteligentes de la IA. (Configuración óptima: usa Gemini 2.5 Flash Lite para máxima velocidad).", keySaved: "Clave API guardada con éxito.",

        statTitle: "Estadísticas", statTotal: "Colección", statReading: "Leyendo", statCompleted: "Completados", statNotes: "Notas",

        // Fitur Hapus Sampul
        btnClearCovers: "Borrar Todas las Portadas (Ahorrar Memoria)",
        clearCoversTitle: "¿Borrar Todas las Portadas?",
        clearCoversDesc: "Todas las portadas se eliminan permanentemente para ahorrar memoria. El texto y progreso están 100% seguros. ¿Continuar?",
        clearCoversSuccess: "¡Portadas borradas! La aplicación ahora es más ligera.",

        // Fitur Hapus Semua Buku
        btnClearAllBooks: "Borrar Todos los Libros (Reinicio Total)",
        clearAllBooksTitle: "¿Borrar Todos los Libros?",
        clearAllBooksDesc: "Todos los libros, progreso, notas, portadas y contenido se eliminarán permanentemente. Esta acción no se puede deshacer. ¿Continuar?",
        clearAllBooksSuccessTitle: "Todos los Libros Borrados",
        clearAllBooksSuccess: "Todos los libros han sido eliminados. Tu biblioteca está vacía.",

        // Opsi Backup Baru & Status Fallback
        bakModalTitle: "Tipo de copia", bakModalDesc: "Elige el formato de copia de seguridad:",
        bakJsonTitle: "JSON (Solo progreso)", bakJsonDesc: "Muy ligero. Guarda solo la lista, progreso y notas. Debes volver a subir los libros originales después.",
        bakZipTitle: "ZIP (Copia completa)", bakZipDesc: "Paquete completo. Guarda textos, portadas, progreso y notas. Listo para leer al restaurar.",
        bakZipWarn: "Aviso: El proceso ZIP requiere mucha memoria. Puede causar lag en dispositivos de gama baja.",
        bakCancel: "Cancelar",
        btnBakJson: "Copia JSON", btnBakZip: "Copia ZIP",

        bakLoadingTitle: "Procesando Copia",
        bakJsonLoading: "Preparando copia JSON ligera...",
        bakZipLoading: "Preparando archivo ZIP... (No cerrar, esto lleva tiempo)",
        bakSuccessTitle: "Copia Exitosa",
        bakSuccessJson: "Archivo JSON creado y listo para guardar. ¡Seguro!",
        bakSuccessZip: "Archivo ZIP compilado y listo para guardar. ¡Genial!",

        zipProcess: "Creando ZIP...", zipWait: "Por favor espera, comprimiendo tus archivos...",
        zipExtract: "Extrayendo ZIP...", zipExtractWait: "Leyendo y restaurando libros del archivo ZIP...",
        zipRestoreConfirm: "Se encontraron {n} libros completos en este ZIP. Se restaurarán en tu biblioteca. ¿Continuar?",

        // --- NEW TRANSLATIONS FOR PHASE 1: DUAL-MODE PDF ---
        scrollRakTitle: "Libros Modo Desplazamiento",
        canvasRakTitle: "Canvas Mode Books",
        pdfModePromptTitle: "Elegir Modo de Lectura",
        pdfModePromptDesc: "Este PDF contiene texto dinámico extraíble. Elija su estilo de lectura preferido:",
        pdfModeBtnScroll: "Modo Desplazamiento (Recomendado)",
        pdfModeBtnScrollDesc: "Texto fluido, fuentes ajustables, admite selección de texto, resaltados y Gemini AI.",
        pdfModeBtnCanvas: "Modo Canvas (Diseño Original)",
        pdfModeBtnCanvasDesc: "Muestra el diseño visual original de las páginas. Admite zoom, pero las fuentes y la IA están deshabilitadas.",
        pdfCanvasWarning: "Las opciones de tipografía, definiciones de IA y selección de texto están deshabilitadas en el Modo Canvas.",
        pdfPageLabel: "Pág",
        pdfTotalPages: "Total de Páginas",
        pdfCanvasBadge: "PDF-CANVAS",
        pdfScrollBadge: "PDF-SCROLL",
        txtPageGo: "Ir a la Página:",
        btnGoPage: "Saltar",
        canvasNoText: "Este PDF se detecta como un documento de imagen escaneada. Importado automáticamente al Modo Canvas para preservar su diseño visual original.",

        // --- PHASE 3 UI UPDATES & NEW MODALS ---
        tocCanvasWarning: "El índice no está disponible en el modo canvas.",
        setHideTitles: "Ocultar Títulos de Libros en Estante",
        uploadDuplicateTitle: "El Libro Ya Existe",
        uploadDuplicateDesc: "El siguiente libro ya está en tu estante. ¿Añadir de todos modos (nuevo archivo) o saltar?",
        btnSkip: "Saltar",
        btnAddAnyway: "Añadir de Todos Modos",
        batchPdfTitle: "Seleccionar Modo PDF",
        batchPdfDesc: "Elige el modo de lectura para los PDFs recién subidos:",
        btnStartProcess: "Iniciar Proceso",
        bookmarkSearchPlaceholder: "Buscar marcadores...",
        importDoneTitle: "Importación Completa",
        importSuccessCount: "{n} libros importados con éxito.",
        importFailedCount: "{n} fallidos:",
        folderNoFiles: "No se encontraron archivos PDF, EPUB, TXT o MD en esta carpeta."
    }
};
