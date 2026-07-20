window.APP_VERSION = "2.1.2";
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

// Data Palet Warna Material 3 - Mode Ekspresif (Tabrak Warna / Vibrant)
const EXPRESSIVE_PALETTES = {
    orchid: { 
        light: `--md-sys-color-background:#F3E8FF;--md-sys-color-on-background:#3B0764;--md-sys-color-surface:#FAF5FF;--md-sys-color-on-surface:#3B0764;--md-sys-color-primary:#9333EA;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#EA580C;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#E11D48;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#A855F7;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#6B21A8;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#C084FC;--md-sys-color-on-primary:#3B0764;--md-sys-color-primary-container:#C2410C;--md-sys-color-on-primary-container:#FFEDD5;--md-sys-color-secondary-container:#831843;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#4A044E;--md-sys-color-on-tertiary-container:#FCE7F3;--md-sys-color-background:#0A0314;--md-sys-color-on-background:#F5E0FF;--md-sys-color-surface:#12091F;--md-sys-color-on-surface:#F3E8FF;--md-sys-color-surface-variant:#3B0764;--md-sys-color-on-surface-variant:#F5D0FE;`
    },
    olive: { 
        light: `--md-sys-color-background:#F7FEE7;--md-sys-color-on-background:#1A2E05;--md-sys-color-surface:#F3F4ED;--md-sys-color-on-surface:#1A2E05;--md-sys-color-primary:#65A30D;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#C2410C;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#0F766E;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#9A3412;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#3F6212;--md-sys-color-on-surface-variant:#FFFFFF;`, 
        dark: `--md-sys-color-primary:#A1C986;--md-sys-color-on-primary:#183803;--md-sys-color-primary-container:#7C2D12;--md-sys-color-on-primary-container:#FFEDD5;--md-sys-color-secondary-container:#064E3B;--md-sys-color-on-secondary-container:#D1FAE5;--md-sys-color-tertiary-container:#422006;--md-sys-color-on-tertiary-container:#FEF9C3;--md-sys-color-background:#0B1107;--md-sys-color-on-background:#ECFCCB;--md-sys-color-surface:#11180D;--md-sys-color-on-surface:#ECFCCB;--md-sys-color-surface-variant:#232E1C;--md-sys-color-on-surface-variant:#CCD8C2;` 
    },
    coral: { 
        light: `--md-sys-color-background:#FFF7ED;--md-sys-color-on-background:#431407;--md-sys-color-surface:#FFFBFA;--md-sys-color-on-surface:#431407;--md-sys-color-primary:#EA580C;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#0D9488;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#BE123C;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#475569;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#9A3412;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#FFB5A5;--md-sys-color-on-primary:#5F1605;--md-sys-color-primary-container:#032F30;--md-sys-color-on-primary-container:#CCFBF1;--md-sys-color-secondary-container:#500724;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#1E293B;--md-sys-color-on-tertiary-container:#F1F5F9;--md-sys-color-background:#180C08;--md-sys-color-on-background:#FFD9D4;--md-sys-color-surface:#20120E;--md-sys-color-on-surface:#FFD9D4;--md-sys-color-surface-variant:#533F3A;--md-sys-color-on-surface-variant:#FFB5A5;`
    },
    teal: { 
        light: `--md-sys-color-background:#F0FDFA;--md-sys-color-on-background:#042F2E;--md-sys-color-surface:#FFFFFF;--md-sys-color-on-surface:#042F2E;--md-sys-color-primary:#0D9488;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#BE123C;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#92400E;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#0F766E;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#0F766E;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#5CD5EC;--md-sys-color-on-primary:#003640;--md-sys-color-primary-container:#500724;--md-sys-color-on-primary-container:#FCE7F3;--md-sys-color-secondary-container:#422006;--md-sys-color-on-secondary-container:#FEF08A;--md-sys-color-tertiary-container:#115E59;--md-sys-color-on-tertiary-container:#F0FDFA;--md-sys-color-background:#031417;--md-sys-color-on-background:#B6F0FC;--md-sys-color-surface:#061C20;--md-sys-color-on-surface:#B6F0FC;--md-sys-color-surface-variant:#304D54;--md-sys-color-on-surface-variant:#B6F0FC;`
    },
    lavender: { 
        light: `--md-sys-color-background:#EEF2FF;--md-sys-color-on-background:#1E1B4B;--md-sys-color-surface:#FCFAFF;--md-sys-color-on-surface:#1E1B4B;--md-sys-color-primary:#4F46E5;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#334155;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#9F1239;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#6B21A8;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#3730A3;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#C4B5FD;--md-sys-color-on-primary:#2E1065;--md-sys-color-primary-container:#2D3748;--md-sys-color-on-primary-container:#ECFCCB;--md-sys-color-secondary-container:#4C0519;--md-sys-color-on-secondary-container:#FFE4E6;--md-sys-color-tertiary-container:#3B0764;--md-sys-color-on-tertiary-container:#FDF4FF;--md-sys-color-background:#090412;--md-sys-color-on-background:#EDE9FE;--md-sys-color-surface:#110A1E;--md-sys-color-on-surface:#EDE9FE;--md-sys-color-surface-variant:#3C00A6;--md-sys-color-on-surface-variant:#E8DFFF;`
    },
    rose: { 
        light: `--md-sys-color-background:#FFF1F2;--md-sys-color-on-background:#4C0519;--md-sys-color-surface:#FFFBFB;--md-sys-color-on-surface:#4C0519;--md-sys-color-primary:#E11D48;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#92400E;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#0284C7;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#9F1239;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#BE123C;--md-sys-color-on-surface-variant:#FFFFFF;`, 
        dark: `--md-sys-color-primary:#FCA5A5;--md-sys-color-on-primary:#450A0A;--md-sys-color-primary-container:#422006;--md-sys-color-on-primary-container:#FEF08A;--md-sys-color-secondary-container:#0369A1;--md-sys-color-on-secondary-container:#E0F2FE;--md-sys-color-tertiary-container:#4C0519;--md-sys-color-on-tertiary-container:#FFF1F2;--md-sys-color-background:#1F0505;--md-sys-color-on-background:#FEE2E2;--md-sys-color-surface:#260C0C;--md-sys-color-on-surface:#FEE2E2;--md-sys-color-surface-variant:#7F1D1D;--md-sys-color-on-surface-variant:#FCA5A5;` 
    },
    lime: { 
        light: `--md-sys-color-background:#F0FDF4;--md-sys-color-on-background:#052E16;--md-sys-color-surface:#FCFDF7;--md-sys-color-on-surface:#052E16;--md-sys-color-primary:#16A34A;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#7E22CE;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#BE123C;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#166534;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#15803D;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#C5E85C;--md-sys-color-on-primary:#253600;--md-sys-color-primary-container:#3B0764;--md-sys-color-on-primary-container:#E9D5FF;--md-sys-color-secondary-container:#831843;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#14532D;--md-sys-color-on-tertiary-container:#F0FDF4;--md-sys-color-background:#0A0E02;--md-sys-color-on-background:#E1FF85;--md-sys-color-surface:#0F1404;--md-sys-color-on-surface:#E1FF85;--md-sys-color-surface-variant:#3A5000;--md-sys-color-on-surface-variant:#C5E85C;`
    },
    sand: { 
        light: `--md-sys-color-background:#FFFBEB;--md-sys-color-on-background:#451A03;--md-sys-color-surface:#FFFDF9;--md-sys-color-on-surface:#451A03;--md-sys-color-primary:#D97706;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#1D4ED8;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#BE123C;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#451A03;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#B45309;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#D7CCC8;--md-sys-color-on-primary:#3E2723;--md-sys-color-primary-container:#1E40AF;--md-sys-color-on-primary-container:#DBEAFE;--md-sys-color-secondary-container:#9D174D;--md-sys-color-on-secondary-container:#FCE7F3;--md-sys-color-tertiary-container:#241A17;--md-sys-color-on-tertiary-container:#FFF8E1;--md-sys-color-background:#130E0C;--md-sys-color-on-background:#FFE0B2;--md-sys-color-surface:#1C1412;--md-sys-color-on-surface:#FFE0B2;--md-sys-color-surface-variant:#4E342E;--md-sys-color-on-surface-variant:#D7CCC8;`
    },
    monochrome: { 
        light: `--md-sys-color-background:#F8FAFC;--md-sys-color-on-background:#0F172A;--md-sys-color-surface:#FAFAFA;--md-sys-color-on-surface:#0F172A;--md-sys-color-primary:#475569;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#A16207;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#1E293B;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#171717;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#334155;--md-sys-color-on-surface-variant:#FFFFFF;`, 
        dark: `--md-sys-color-primary:#CFD8DC;--md-sys-color-on-primary:#263238;--md-sys-color-primary-container:#713F12;--md-sys-color-on-primary-container:#FEF08A;--md-sys-color-secondary-container:#0F172A;--md-sys-color-on-secondary-container:#E2E8F0;--md-sys-color-tertiary-container:#212121;--md-sys-color-on-tertiary-container:#F5F5F5;--md-sys-color-background:#101416;--md-sys-color-on-background:#ECEFF1;--md-sys-color-surface:#151A1D;--md-sys-color-on-surface:#ECEFF1;--md-sys-color-surface-variant:#37474F;--md-sys-color-on-surface-variant:#CFD8DC;` 
    },
    blueberry: { 
        light: `--md-sys-color-background:#EFF6FF;--md-sys-color-on-background:#00153B;--md-sys-color-surface:#F4F9FF;--md-sys-color-on-surface:#00153B;--md-sys-color-primary:#2563EB;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#9F1239;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#92400E;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#1E3A8A;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#1D4ED8;--md-sys-color-on-surface-variant:#FFFFFF;`, 
        dark: `--md-sys-color-primary:#80CAFF;--md-sys-color-on-primary:#00153B;--md-sys-color-primary-container:#4C0519;--md-sys-color-on-primary-container:#FCE7F3;--md-sys-color-secondary-container:#422006;--md-sys-color-on-secondary-container:#FEF08A;--md-sys-color-tertiary-container:#001E45;--md-sys-color-on-tertiary-container:#E8EAF6;--md-sys-color-background:#040A1A;--md-sys-color-on-background:#C2ECFF;--md-sys-color-surface:#07122E;--md-sys-color-on-surface:#C2ECFF;--md-sys-color-surface-variant:#1A237E;--md-sys-color-on-surface-variant:#80CAFF;` 
    }
};

// Data Palet Warna Material 3 - Mode Standar (Monokromatik Solid)
const STANDARD_PALETTES = {
    orchid: {
        light: `--md-sys-color-background:#F3E8FF;--md-sys-color-on-background:#3B0764;--md-sys-color-surface:#FAF5FF;--md-sys-color-on-surface:#3B0764;--md-sys-color-primary:#7C3AED;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#6D28D9;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#5B21B6;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#4C1D95;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#5B21B6;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#C084FC;--md-sys-color-on-primary:#3B0764;--md-sys-color-primary-container:#4C1D95;--md-sys-color-on-primary-container:#EDE9FE;--md-sys-color-secondary-container:#5B21B6;--md-sys-color-on-secondary-container:#DDD6FE;--md-sys-color-tertiary-container:#4C1D95;--md-sys-color-on-tertiary-container:#F5F3FF;--md-sys-color-background:#0A0314;--md-sys-color-on-background:#F5E0FF;--md-sys-color-surface:#12091F;--md-sys-color-on-surface:#F3E8FF;--md-sys-color-surface-variant:#3B0764;--md-sys-color-on-surface-variant:#F5D0FE;`
    },
    olive: {
        light: `--md-sys-color-background:#F7FEE7;--md-sys-color-on-background:#1A2E05;--md-sys-color-surface:#F3F4ED;--md-sys-color-on-surface:#1A2E05;--md-sys-color-primary:#4D7C0F;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#3F6212;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#2F480D;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#1E3A00;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#3F6212;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#A3E635;--md-sys-color-on-primary:#1A2E05;--md-sys-color-primary-container:#1E3A00;--md-sys-color-on-primary-container:#D9F99D;--md-sys-color-secondary-container:#1E3A00;--md-sys-color-on-secondary-container:#BEF264;--md-sys-color-tertiary-container:#1A2E05;--md-sys-color-on-tertiary-container:#ECFCCB;--md-sys-color-background:#0B1107;--md-sys-color-on-background:#ECFCCB;--md-sys-color-surface:#11180D;--md-sys-color-on-surface:#ECFCCB;--md-sys-color-surface-variant:#232E1C;--md-sys-color-on-surface-variant:#CCD8C2;`
    },
    coral: {
        light: `--md-sys-color-background:#FFF7ED;--md-sys-color-on-background:#431407;--md-sys-color-surface:#FFFBFA;--md-sys-color-on-surface:#431407;--md-sys-color-primary:#DC2626;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#B91C1C;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#991B1B;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#7F1D1D;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#B91C1C;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#FCA5A5;--md-sys-color-on-primary:#7F1D1D;--md-sys-color-primary-container:#991B1B;--md-sys-color-on-primary-container:#FEE2E2;--md-sys-color-secondary-container:#7F1D1D;--md-sys-color-on-secondary-container:#FECACA;--md-sys-color-tertiary-container:#450A0A;--md-sys-color-on-tertiary-container:#FEF2F2;--md-sys-color-background:#180C08;--md-sys-color-on-background:#FFD9D4;--md-sys-color-surface:#20120E;--md-sys-color-on-surface:#FFD9D4;--md-sys-color-surface-variant:#533F3A;--md-sys-color-on-surface-variant:#FFB5A5;`
    },
    teal: {
        light: `--md-sys-color-background:#F0FDFA;--md-sys-color-on-background:#042F2E;--md-sys-color-surface:#FFFFFF;--md-sys-color-on-surface:#042F2E;--md-sys-color-primary:#0F766E;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#0D4B46;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#0A3F3B;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#002D2A;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#0D4B46;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#5EEAD4;--md-sys-color-on-primary:#003D37;--md-sys-color-primary-container:#115E59;--md-sys-color-on-primary-container:#CCFBF1;--md-sys-color-secondary-container:#134E4A;--md-sys-color-on-secondary-container:#99F6E4;--md-sys-color-tertiary-container:#115E59;--md-sys-color-on-tertiary-container:#F0FDFA;--md-sys-color-background:#031417;--md-sys-color-on-background:#B6F0FC;--md-sys-color-surface:#061C20;--md-sys-color-on-surface:#B6F0FC;--md-sys-color-surface-variant:#304D54;--md-sys-color-on-surface-variant:#B6F0FC;`
    },
    lavender: {
        light: `--md-sys-color-background:#EEF2FF;--md-sys-color-on-background:#1E1B4B;--md-sys-color-surface:#FCFAFF;--md-sys-color-on-surface:#1E1B4B;--md-sys-color-primary:#4338CA;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#3730A3;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#312E81;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#1E1B4B;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#3730A3;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#A5B4FC;--md-sys-color-on-primary:#1E1B4B;--md-sys-color-primary-container:#312E81;--md-sys-color-on-primary-container:#E0E7FF;--md-sys-color-secondary-container:#1E1B4B;--md-sys-color-on-secondary-container:#C7D2FE;--md-sys-color-tertiary-container:#1E1B4B;--md-sys-color-on-tertiary-container:#EEF2FF;--md-sys-color-background:#090412;--md-sys-color-on-background:#EDE9FE;--md-sys-color-surface:#110A1E;--md-sys-color-on-surface:#EDE9FE;--md-sys-color-surface-variant:#3C00A6;--md-sys-color-on-surface-variant:#E8DFFF;`
    },
    rose: {
        light: `--md-sys-color-background:#FFF1F2;--md-sys-color-on-background:#4C0519;--md-sys-color-surface:#FFFBFB;--md-sys-color-on-surface:#4C0519;--md-sys-color-primary:#BE123C;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#9F1239;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#881337;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#4C0519;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#9F1239;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#FDA4AF;--md-sys-color-on-primary:#881337;--md-sys-color-primary-container:#9F1239;--md-sys-color-on-primary-container:#FFE4E6;--md-sys-color-secondary-container:#7F1D1D;--md-sys-color-on-secondary-container:#FECDD3;--md-sys-color-tertiary-container:#4C0519;--md-sys-color-on-tertiary-container:#FFF1F2;--md-sys-color-background:#1F0505;--md-sys-color-on-background:#FEE2E2;--md-sys-color-surface:#260C0C;--md-sys-color-on-surface:#FEE2E2;--md-sys-color-surface-variant:#7F1D1D;--md-sys-color-on-surface-variant:#FCA5A5;`
    },
    lime: {
        light: `--md-sys-color-background:#F0FDF4;--md-sys-color-on-background:#052E16;--md-sys-color-surface:#FCFDF7;--md-sys-color-on-surface:#052E16;--md-sys-color-primary:#15803D;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#166534;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#14532D;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#064E3B;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#166534;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#BEF264;--md-sys-color-on-primary:#1A2E05;--md-sys-color-primary-container:#1E3A00;--md-sys-color-on-primary-container:#ECFCCB;--md-sys-color-secondary-container:#1A2E05;--md-sys-color-on-secondary-container:#D9F99D;--md-sys-color-tertiary-container:#14532D;--md-sys-color-on-tertiary-container:#F0FDF4;--md-sys-color-background:#0A0E02;--md-sys-color-on-background:#E1FF85;--md-sys-color-surface:#0F1404;--md-sys-color-on-surface:#E1FF85;--md-sys-color-surface-variant:#3A5000;--md-sys-color-on-surface-variant:#C5E85C;`
    },
    sand: {
        light: `--md-sys-color-background:#FFFBEB;--md-sys-color-on-background:#451A03;--md-sys-color-surface:#FFFDF9;--md-sys-color-on-surface:#451A03;--md-sys-color-primary:#92400E;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#713F12;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#451A03;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#3E2723;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#713F12;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#FCD34D;--md-sys-color-on-primary:#451A03;--md-sys-color-primary-container:#713F12;--md-sys-color-on-primary-container:#FEF3C7;--md-sys-color-secondary-container:#451A03;--md-sys-color-on-secondary-container:#FDE68A;--md-sys-color-tertiary-container:#241A17;--md-sys-color-on-tertiary-container:#FFF8E1;--md-sys-color-background:#130E0C;--md-sys-color-on-background:#FFE0B2;--md-sys-color-surface:#1C1412;--md-sys-color-on-surface:#FFE0B2;--md-sys-color-surface-variant:#4E342E;--md-sys-color-on-surface-variant:#D7CCC8;`
    },
    monochrome: {
        light: `--md-sys-color-background:#F8FAFC;--md-sys-color-on-background:#0F172A;--md-sys-color-surface:#FAFAFA;--md-sys-color-on-surface:#0F172A;--md-sys-color-primary:#334155;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#1E293B;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#0F172A;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#020617;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#1E293B;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#CBD5E1;--md-sys-color-on-primary:#0F172A;--md-sys-color-primary-container:#1E293B;--md-sys-color-on-primary-container:#E2E8F0;--md-sys-color-secondary-container:#1E293B;--md-sys-color-on-secondary-container:#CBD5E1;--md-sys-color-tertiary-container:#0F172A;--md-sys-color-on-tertiary-container:#F1F5F9;--md-sys-color-background:#101416;--md-sys-color-on-background:#ECEFF1;--md-sys-color-surface:#151A1D;--md-sys-color-on-surface:#ECEFF1;--md-sys-color-surface-variant:#37474F;--md-sys-color-on-surface-variant:#CFD8DC;`
    },
    blueberry: {
        light: `--md-sys-color-background:#EFF6FF;--md-sys-color-on-background:#00153B;--md-sys-color-surface:#F4F9FF;--md-sys-color-on-surface:#00153B;--md-sys-color-primary:#1D4ED8;--md-sys-color-on-primary:#FFFFFF;--md-sys-color-primary-container:#1E40AF;--md-sys-color-on-primary-container:#FFFFFF;--md-sys-color-secondary-container:#1E3A8A;--md-sys-color-on-secondary-container:#FFFFFF;--md-sys-color-tertiary-container:#172554;--md-sys-color-on-tertiary-container:#FFFFFF;--md-sys-color-surface-variant:#1E40AF;--md-sys-color-on-surface-variant:#FFFFFF;`,
        dark: `--md-sys-color-primary:#93C5FD;--md-sys-color-on-primary:#1E3A8A;--md-sys-color-primary-container:#1E40AF;--md-sys-color-on-primary-container:#DBEAFE;--md-sys-color-secondary-container:#1E3A8A;--md-sys-color-on-secondary-container:#BFDBFE;--md-sys-color-tertiary-container:#1E3A8A;--md-sys-color-on-tertiary-container:#EFF6FF;--md-sys-color-background:#040A1A;--md-sys-color-on-background:#C2ECFF;--md-sys-color-surface:#07122E;--md-sys-color-on-surface:#C2ECFF;--md-sys-color-surface-variant:#1A237E;--md-sys-color-on-surface-variant:#80CAFF;`
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
        welBackup: "Pencadangan Data", 
        welBackupDesc: "Ada 2 opsi backup di Pengaturan → Data Aplikasi:<br><br><b>JSON (Progres Saja)</b> — Ringan & cepat. Hanya menyimpan bookmark, progres baca, dan catatan. <u>Sebelum restore, wajib upload ulang file buku (PDF/Canvas) sesuai rak yang terakhir di-backup dulu.</u><br><br><b>ZIP (Paket Lengkap)</b> — Lebih superior karena backup <i>semua data</i> termasuk isi buku. Langsung bisa dibaca setelah restore tanpa upload ulang.<br><br><b>Cara backup:</b> Klik Backup → pilih format → file otomatis tersimpan di folder <b>Documents</b> di Android lu (bukan di Google Drive, tapi di penyimpanan internal HP).",
        welFormat: "Batasan Format",
        welFormatDesc: "<b>PDF Mode Scroll:</b> Hanya teks yang diekstrak. Gambar di dalam PDF diabaikan. Mendukung text selection, highlight, dan AI.<br><b>PDF Mode Canvas:</b> Tampilan visual asli PDF seperti cetakan fisik. Gambar tetap muncul. Mendukung zoom cubit. Tidak mendukung ubah font atau AI.<br><b>EPUB:</b> Didukung penuh termasuk gambar.",
        welCanvas: "Mode Canvas PDF",
        welCanvasDesc: "Mode Canvas menampilkan halaman PDF persis seperti aslinya — termasuk gambar. Cocok untuk buku pindaian (scanned). Fitur: cubit untuk zoom, geser halaman. <b>Tidak mendukung</b> ubah ukuran font, perataan teks, AI, atau text selection.",
        welPrivacy: "Privasi Total", welPrivacyDesc: "Semua diproses secara lokal di perangkat lu. Tidak ada data yang dikirim ke server.", welBtn: "Mengerti",
        statExpand: "Lihat Grafik",
        statCollapse: "Tutup Grafik",
        statChartTitle: "Aktivitas Membaca (Menit)",
        statChartDays: "hari terakhir",
        statChartEmpty: "Belum ada data aktivitas membaca.",
        statChartPages: "halaman",
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

        navBack: "Kembali", navToc: "Daftar Isi", navSearch: "Pencarian", navJumpPage: "Lompat ke Halaman", navText: "Teks", navFull: "Penuh",
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
        pdfCanvasImageOnlyWarning: "PDF ini hanya berisi gambar (hasil scan), pencarian kata tidak tersedia karena tidak ada teks yang bisa diekstrak.",
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
        expressiveLabel: "Ekspresif",
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
        folderNoFiles: "Tidak ada file PDF, EPUB, TXT, atau MD di folder ini.",
        pdfBothModesTitle: "Buku Sudah Ada di Rak",
        pdfBothModesDesc: "Buku berikut sudah ada di kedua rak (Scroll & Canvas). Tidak dapat ditambahkan lagi.",
        pdfScrollWillDelete: "Canvas (versi Scroll akan dihapus)",
        pdfCanvasWillDelete: "Scroll (versi Canvas akan dihapus)",
        batchDismiss: "Buang dari daftar",

        // --- ARCHIVE.ORG SEARCH ---
        archiveSearchTitle: "Temukan Buku di Internet Archive",
        archiveSearchPlaceholder: "Cari judul, penulis, subjek...",
        archiveSearchBtn: "Cari",
        archiveSearchLoading: "Mencari di arsip...",
        archiveSearchEmpty: "Tidak ada hasil. Coba kata kunci lain.",
        archiveSearchError: "Gagal mencari. Cek koneksi internet lu.",
        archiveDownloadBtn: "Unduh & Baca",
        archiveDownloading: "Mengunduh buku...",
        archiveDownloadError: "Gagal mengunduh. Mungkin file tidak tersedia.",
        archiveNoFile: "Buku ini tidak punya file PDF atau EPUB yang bisa diunduh.",
        archiveFilterAll: "Semua",
        archiveFilterPdf: "PDF",
        archiveFilterEpub: "EPUB",
        archiveResultCount: "{n} hasil ditemukan",
        archiveSectionTitle: "Temukan & Unduh Buku",

        // --- ARCHIVE DOWNLOAD RESULT TOASTS ---
        toastBookAdded: "Buku berhasil ditambah!",
        toastBookDuplicate: "Buku \"{title}\" udah ada di rak sebelumnya.",
        toastBookFailed: "Gagal diproses, file mungkin rusak."
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
        welBackup: "Data Backup", 
        welBackupDesc: "There are 2 backup options in Settings → App Data:<br><br><b>JSON (Progress Only)</b> — Lightweight & fast. Saves only bookmarks, reading progress, and notes. <u>Before restoring, you must re-upload your book files (PDF/Canvas) matching the shelf from your last backup.</u><br><br><b>ZIP (Full Package)</b> — Superior because it backs up <i>all data</i> including book contents. Immediately readable after restore — no re-upload needed.<br><br><b>How to backup:</b> Tap Backup → choose format → the file is automatically saved to the <b>Documents</b> folder on your Android device (internal storage, not Google Drive).",
        welFormat: "Format Limitations",
        welFormatDesc: "<b>PDF Scroll Mode:</b> Only text is extracted. Images inside PDFs are ignored. Supports text selection, highlights, and AI.<br><b>PDF Canvas Mode:</b> Shows the original visual layout like a physical printout. Images are visible. Supports pinch-to-zoom. Does not support font changes or AI.<br><b>EPUB:</b> Fully supported including images.",
        welCanvas: "PDF Canvas Mode",
        welCanvasDesc: "Canvas Mode displays PDF pages exactly as they appear — including images. Ideal for scanned books. Features: pinch-to-zoom, swipe pages. <b>Does not support</b> font size changes, text alignment, AI, or text selection.",
        welPrivacy: "Total Privacy", welPrivacyDesc: "Everything is processed locally on your device. No data is ever sent to a server.", welBtn: "Got it",
        statExpand: "View Chart",
        statCollapse: "Close Chart",
        statChartTitle: "Reading Activity (Minutes)",
        statChartDays: "last days",
        statChartEmpty: "No reading activity data yet.",
        statChartPages: "pages",
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

        navBack: "Back", navToc: "Contents", navSearch: "Search", navJumpPage: "Jump to Page", navText: "Text", navFull: "Full",
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
        pdfCanvasImageOnlyWarning: "This PDF only contains images (scanned), word search is unavailable because no text could be extracted.",
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
        expressiveLabel: "Expressive",
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
        folderNoFiles: "No PDF, EPUB, TXT, or MD files found in this folder.",
        pdfBothModesTitle: "Book Already in Shelf",
        pdfBothModesDesc: "The following book is already in both shelves (Scroll & Canvas). It cannot be added again.",
        pdfScrollWillDelete: "Canvas (Scroll version will be deleted)",
        pdfCanvasWillDelete: "Scroll (Canvas version will be deleted)",
        batchDismiss: "Remove from list",

        // --- ARCHIVE.ORG SEARCH ---
        archiveSearchTitle: "Find Books on Internet Archive",
        archiveSearchPlaceholder: "Search title, author, subject...",
        archiveSearchBtn: "Search",
        archiveSearchLoading: "Searching the archive...",
        archiveSearchEmpty: "No results found. Try different keywords.",
        archiveSearchError: "Search failed. Check your internet connection.",
        archiveDownloadBtn: "Download & Read",
        archiveDownloading: "Downloading book...",
        archiveDownloadError: "Download failed. The file may not be available.",
        archiveNoFile: "This book has no downloadable PDF or EPUB file.",
        archiveFilterAll: "All",
        archiveFilterPdf: "PDF",
        archiveFilterEpub: "EPUB",
        archiveResultCount: "{n} results found",
        archiveSectionTitle: "Discover & Download Books",

        // --- ARCHIVE DOWNLOAD RESULT TOASTS ---
        toastBookAdded: "Book added successfully!",
        toastBookDuplicate: "Book \"{title}\" is already in your shelf.",
        toastBookFailed: "Processing failed, file may be corrupted."
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
        welBackup: "Copia de seguridad", 
        welBackupDesc: "Hay 2 opciones de copia en Ajustes → Datos de la app:<br><br><b>JSON (Solo progreso)</b> — Ligero y rápido. Guarda solo marcadores, progreso e notas. <u>Antes de restaurar, debes volver a subir los archivos del libro (PDF/Canvas) correspondientes al estante de tu última copia.</u><br><br><b>ZIP (Paquete completo)</b> — Superior porque guarda <i>todos los datos</i> incluyendo el contenido del libro. Listo para leer tras restaurar, sin necesidad de volver a subir.<br><br><b>Cómo hacer copia:</b> Pulsa Copia → elige formato → el archivo se guarda automáticamente en la carpeta <b>Documentos</b> de tu Android (almacenamiento interno, no Google Drive).",
        welFormat: "Limitaciones de formato",
        welFormatDesc: "<b>PDF Modo Desplazamiento:</b> Solo se extrae el texto. Las imágenes se ignoran. Compatible con selección de texto, resaltados e IA.<br><b>PDF Modo Canvas:</b> Muestra el diseño visual original como impresión física. Las imágenes son visibles. Admite zoom. No admite cambio de fuente ni IA.<br><b>EPUB:</b> Totalmente compatible incluyendo imágenes.",
        welCanvas: "Modo Canvas PDF",
        welCanvasDesc: "El Modo Canvas muestra las páginas del PDF exactamente como son, incluyendo imágenes. Ideal para libros escaneados. Funciones: pellizcar para hacer zoom, deslizar páginas. <b>No admite</b> cambios de tamaño de fuente, alineación de texto, IA ni selección de texto.",
        welPrivacy: "Privacidad total", welPrivacyDesc: "Todo se procesa localmente en tu dispositivo. No se envían datos a ningún servidor.", welBtn: "Entendido",
        statExpand: "Ver gráfico",
        statCollapse: "Cerrar gráfico",
        statChartTitle: "Actividad de lectura (Minutos)",
        statChartDays: "últimos días",
        statChartEmpty: "Aún no hay datos de actividad de lectura.",
        statChartPages: "páginas",
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

        navBack: "Atrás", navToc: "Índice", navSearch: "Buscar", navJumpPage: "Ir a Página", navText: "Texto", navFull: "Completo",
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
        pdfCanvasImageOnlyWarning: "Este PDF solo contiene imágenes (escaneado), la búsqueda de palabras no está disponible porque no se pudo extraer texto.",
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
        expressiveLabel: "Expresivo",
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
        folderNoFiles: "No se encontraron archivos PDF, EPUB, TXT o MD en esta carpeta.",
        pdfBothModesTitle: "El Libro Ya Está en el Estante",
        pdfBothModesDesc: "El siguiente libro ya está en ambos estantes (Scroll & Canvas). No se puede añadir de nuevo.",
        pdfScrollWillDelete: "Canvas (versión Scroll se eliminará)",
        pdfCanvasWillDelete: "Scroll (versión Canvas se eliminará)",
        batchDismiss: "Quitar de la lista",

        // --- ARCHIVE.ORG SEARCH ---
        archiveSearchTitle: "Encontrar Libros en Internet Archive",
        archiveSearchPlaceholder: "Buscar título, autor, tema...",
        archiveSearchBtn: "Buscar",
        archiveSearchLoading: "Buscando en el archivo...",
        archiveSearchEmpty: "Sin resultados. Prueba otras palabras clave.",
        archiveSearchError: "Error al buscar. Comprueba tu conexión a internet.",
        archiveDownloadBtn: "Descargar y Leer",
        archiveDownloading: "Descargando libro...",
        archiveDownloadError: "Descarga fallida. El archivo puede no estar disponible.",
        archiveNoFile: "Este libro no tiene archivo PDF o EPUB descargable.",
        archiveFilterAll: "Todos",
        archiveFilterPdf: "PDF",
        archiveFilterEpub: "EPUB",
        archiveResultCount: "{n} resultados encontrados",
        archiveSectionTitle: "Descubrir y Descargar Libros",

        // --- ARCHIVE DOWNLOAD RESULT TOASTS ---
        toastBookAdded: "¡Libro añadido con éxito!",
        toastBookDuplicate: "El libro \"{title}\" ya está en tu estante.",
        toastBookFailed: "Error al procesar, el archivo puede estar dañado."
    }
};
