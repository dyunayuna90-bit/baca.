# Baca. — Zero-Friction Local Offline E-Book Reader

A brilliant, self-contained **single-file Progressive Web App (PWA)** engineered for deep reading, distraction-free literacy, and immediate contextual research. 

`Baca.` (Indonesian for *Read*) strips away the over-engineered bloat of modern e-readers. No logins, no cloud tracking, no paywalls, and absolutely no configuration friction. Just open your file, and start reading.

---

## 📸 Screenshots
*(Add your beautiful screenshots or GIFs here to showcase the stunning Material You interface!)*
<!-- Placeholders for your assets -->
<!-- <p align="center">
  <img src="your-screenshot-library.png" width="45%" alt="Library View" />
  <img src="your-screenshot-reader.png" width="45%" alt="Reader View" />
</p> -->

---

## ⚡ What Makes It Unique? (The Philosophy)

* **Zero-Friction Access:** No complex directory mapping or painful file trees (unlike Moon+ Reader). It leverages native OS file pickers to import files directly into your local database.
* **True PDF Text-Reflow (Anti Pinch-to-Zoom):** Reading standard PDFs on mobile screens is usually a nightmare. `Baca.` forcefully extracts pure text spatial coordinates and rebuilds them into dynamic responsive HTML blocks (`<p>` and `<h1>`). Scroll vertically, adjust fonts, and read naturally.
* **Contextual AI & Dictionary Overlays:** Encounted a complex academic term or historical figure? Simply highlight the text. `Baca.` fetches real-time breakdowns from Wikipedia, Wiktionary, and the public Dictionary API instantly without breaking your reading momentum.
* **The "Frankenstein" Single-File Architecture:** UI layers, Material Design 3 theme engines, custom PDF/EPUB parsers, and local database management are all rolled into **one single `.html` file**. It runs entirely in-memory with zero compilation or build steps needed.

---

## 🛠️ Technical Deep Dive

* **PWA Self-Infection (Blob Trik):** Bypasses traditional server requirements by compiling standard PWA `manifest.json` and `service-worker.js` files *on-the-fly* via JavaScript **Blob Objects** directly inside the RAM.
* **Massive Local Database (IndexedDB):** Bypasses the strict 5MB `localStorage` limit by hijacking **IndexedDB** through `localForage`. You can safely store dozens of heavy books entirely offline.
* **Smart Rendering (Intersection Observer):** Even a 1,200-page book runs smoothly. The DOM doesn't render thousands of paragraphs at once; it dynamically mounts and updates page progression indexes based on exactly what is visible on your screen.

---

## ⚠️ Known Limits (By Design)
* **Pure Text Focus:** This engine is explicitly optimized for literature and text-heavy books. Images inside PDFs are skipped to optimize RAM overhead and maximize text-reflow responsiveness.
* **No Scanned Images / OCR:** PDFs containing raw image scans will trigger a graceful warning notification. `Baca.` is built for pure typography, not heavy machine learning OCR scanning.

---

## 🤝 Open for Contributions & APK Porting (Call to Action!)

This project is fully open-source and welcoming of all optimizations. 

### 🚀 The Big Goal: Native APK Packaging
We are looking for mobile developers to help wrap this single-file HTML app into a native **Android APK** (via **Capacitor**, **Trusted Web Activity (TWA)**, or **Cordova**).

**Crucial Issue to Solve:** Android OS aggressively wipes WebView caches and IndexedDB structures when a phone's storage runs low. We need contributors to help implement a native bridge plugin to duplicate the `localForage` binaries directly into the secure physical local Android directory instead of relying solely on the browser's volatile storage box.

If you love clean code, minimalist software architecture, or want to build a bulletproof Android wrapper for this, feel free to fork, optimize, and submit a Pull Request!

---

## 📄 License
MIT License. Completely free to use, modify, and redistribute. Built with absolute logic.

### 📖 Advanced Reader Engine
* **Immersive Mode:** Full-screen reading capability with a hideable top UI bar[span_10](start_span)[span_10](end_span).
* **Auto-Generated TOC:** Automatically generates a Table of Contents by scanning for H1 and H2 nodes within the parsed document[span_11](start_span)[span_11](end_span).
* **In-Book Search:** Lightning-fast specific text search that highlights results contextually and offers smooth scrolling to the exact paragraph[span_12](start_span)[span_12](end_span).

### 🎨 Ultimate Customization (Material 3)
* **15 Dynamic Color Palettes:** Choose from Purple, Green, Rose, Blue, Orange, Teal, Yellow, Pink, Cyan, Slate, Red, Indigo, Lime, Sepia, or Monochrome[span_13](start_span)[span_13](end_span).
* **Adaptive Viewing Modes:** Switch seamlessly between Light, Dark, and true AMOLED (Pitch Black) modes[span_14](start_span)[span_14](end_span).
* **Typography Control:** Fine-tune font sizes, text alignment (left, center, justify), and choose from curated font families (Lora, Merriweather, Playfair, Inter, Space Mono)[span_15](start_span)[span_15](end_span).

### 🛠️ Interactive Reading Tools
* **Multi-Color Highlighting:** Select text and apply Yellow, Green, Pink, or Blue highlights[span_16](start_span)[span_16](end_span).
* **Personalized Notes:** Attach personal, editable text notes to specific highlights[span_17](start_span)[span_17](end_span).
* **Tanya AI / Wikipedia Lookup:** Highlight any word or phrase to fetch instant summaries using the free Wikipedia API[span_18](start_span)[span_18](end_span). Supports English and Indonesian languages, with a fallback search mechanism if an exact match isn't found[span_19](start_span)[span_19](end_span).

---

## 📸 Screenshots

<img width="1443" height="1522" alt="ResizedImage_2026-05-28_05-01-55_8292" src="https://github.com/user-attachments/assets/d1314cf0-0033-4a55-93f6-ac6f5ed93c4f" />

---

## 🚀 Quick Start

Since Baca. is a 100% client-side application, setup is instant.

1.  **Clone the repository:**
```bash
    git clone [https://github.com/yourusername/baca-reader.git](https://github.com/yourusername/baca-reader.git)
    ```
2.  **Run it locally:**
    Simply open the `index.html` file in any modern web browser.
3.  **Host it online:**
    Host this app for free using GitHub Pages, Vercel, or Netlify. Just deploy the root directory!

## 💻 Tech Stack

* **Frontend:** Vanilla HTML, JavaScript, [Tailwind CSS](https://tailwindcss.com/) (via CDN)
* **Icons:** [Lucide](https://lucide.dev/)
* **Document Parsing:** [PDF.js](https://mozilla.github.io/pdf.js/) (PDF) & [JSZip](https://stuk.github.io/jszip/) (EPUB)
* **Local Storage:** [localForage](https://localforage.github.io/localForage/) (IndexedDB wrapper)
* **APIs:** Public Wikipedia REST API

## 🤝 Contributing

Contributions are heavily encouraged and always welcome! 

Since this is currently a web-based PWA, **I am especially open to pull requests or forks from anyone willing to compile this into a native Android APK** (using tools like Capacitor, Cordova, or a custom Android WebView implementation). 

**How to contribute:**
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
