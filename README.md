# Baca. 📖

[![GitHub stars](https://img.shields.io/github/stars/dyunayuna90-bit/baca.?style=for-the-badge)](https://github.com/dyunayuna90-bit/baca./stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Download Latest Release](https://img.shields.io/github/v/release/dyunayuna90-bit/baca.?style=for-the-badge&logo=android&color=3DDC84&label=DOWNLOAD%20APK)](https://github.com/dyunayuna90-bit/baca./releases/latest)

**Baca.** is a lightweight, local-first e-book reader (EPUB & PDF). Now packaged as a native Android app via Capacitor, it runs entirely on optimized web-native tech with zero backend. No servers, no tracking, no cloud uploads, and **zero CDN reliance**. Your books and libraries are processed and stored 100% locally on your device for absolute privacy and complete offline capability.

## Logo
<img width="1920" height="1080" alt="Baca Logo" src="https://github.com/user-attachments/assets/bbfff3df-8edc-43be-8813-873ccfd07e92" />

## 🌟 What's New in v2.1.0?

* **Permanent Dark UI:** Light, dark, and AMOLED mode toggles now apply exclusively to book content — not the app interface. The UI is permanently dark for a cleaner, more consistent look.
* **Expressive Mode:** A new toggle in settings lets you switch between a colorful Expressive UI or a minimal, subdued appearance. Your call.
* **Canvas Mode — Page Slider & Text Search:** Navigate PDFs instantly with a new page slider. Full-text search is now supported for PDFs with embedded text (not applicable to scanned/image-based PDFs).
* **Archive.org Downloads to Device:** Books downloaded from Internet Archive are now saved directly to your device's Downloads folder — not just inside the app. Access them from any file manager or share them freely.

## ✨ Material 3 Expressive Design
The UI of **Baca.** is anything but static. We deeply adopted the **Material 3 Expressive** design principles to provide an organic, dynamic, and engaging user experience:

* **Fluid Morphing & Animation:** UI elements like buttons and book cards don't just register clicks; they morph and react to your touch with butter-smooth bezier curve transitions.
* **Immersive Reading Mode:** Navigation elements intuitively slide out of the way as you scroll down to focus on reading, giving you a 100% distraction-free canvas.
* **10 Vibrant Palettes:** Choose from 10 meticulously crafted Material 3 color palettes (including the elegant *Warm Teal*) that dynamically shift the entire app's accent and mood.
* **Expressive vs. Minimal:** Toggle Expressive Mode in settings to switch between a vibrant, colorful UI and a clean, subdued one.
* **AMOLED Dark for Book Content:** The pitch-black AMOLED theme is available exclusively for book content, optimized for OLED screens to save battery.
* **Minimalist Control:** Want a cleaner shelf? Toggle "Hide Book Titles" to let the book covers speak for themselves.

## 📷 Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/46109d7f-68fe-45d4-8166-ff65abb60273" width="300"><br><br>
  <img src="https://github.com/user-attachments/assets/18dabd4d-ce9a-45b5-95aa-64ebc904d128" width="300"><br><br>
  <img src="https://github.com/user-attachments/assets/d5815600-e48c-4498-967c-39dac65612cc" width="300">
</p>

## 🚀 Key Features

* **100% Offline & Privacy-Focused:** Zero cloud uploads and fully bundled local libraries. We utilize localforage (IndexedDB) and native device storage to parse, render, and save your books locally. Your data belongs to you.
* **Internet Archive Integration:** Discover and download millions of free books directly within the app. Features a smart format picker (EPUB/PDF), real-time native download progress, seamless auto-import to your shelf, and automatic save to your device's Downloads folder.
* **Dual PDF Reading Modes:**
  * **Scroll Mode:** Dynamic text extraction for a continuous, flowing reading experience.
  * **Canvas Mode:** Preserves the original layout and typography of the PDF — perfect for textbooks or image-heavy documents. Includes pinch-to-zoom, a page slider for quick navigation, and full-text search for text-based PDFs.
* **Complete Data Portability:** Backup and restore your entire library locally. Choose between a lightweight JSON export (progress & notes only) or a full ZIP export (including book files and covers).
* **Reading Statistics:** Track your reading habits with a built-in interactive line chart displaying your 7-day reading activity, completed books, and total annotations.
* **Smart Hybrid Bookmarks:** Highlights and notes merged into one powerful side panel. Select text (or tag a page in Canvas Mode) to create a bookmark, add custom notes, and tap the card later to instantly jump back.
* **Built-in Update Checker:** The settings menu includes an auto-update checker that directly routes you to the latest GitHub release.
* **AI Explanations (Gemini API):** Select any word or passage and get instant AI-powered explanations using your own Gemini API key (supports Gemini 2.0 Flash/Lite).
* **In-Book Search Engine:** Integrated right into the side panel. Instantly sweeps through the book and auto-scrolls to the exact highlighted paragraph.
* **Typography Control:** Adjust text size, paragraph alignment, and pick from premium fonts (*Lora, Merriweather, Playfair, Inter, Space Mono, Google Sans*) for Scroll Mode and EPUBs.
* **Batch Management:** Clear RAM by removing all generated book covers, or run batch deletions to keep your library organized.

## 🤔 Why Baca? (And not the others?)

Most e-book readers on the market fall into two frustrating extremes: they are either heavily bloated with ads, expensive cloud subscriptions, and useless features, or they are free but feature a clunky, outdated UI from 2010.

**Baca.** exists to break that compromise. The logic is simple:

* **Zero Feature Creep (~5MB Size):** Just a pure, uncompromised visual reading experience. Nothing more.
* **Open-Source Doesn't Mean Ugly:** By deeply integrating Material 3 Expressive, navigating your library actually feels fluid and satisfying.
* **True Local Privacy:** Most "free" apps harvest your reading habits. Baca is strictly local-first. Zero tracking, zero CDNs, zero servers involved.

## 📦 Download & Installation
[![Download Latest Release](https://img.shields.io/github/v/release/dyunayuna90-bit/baca.?style=for-the-badge&logo=android&color=3DDC84&label=DOWNLOAD%20APK)](https://github.com/dyunayuna90-bit/baca./releases/latest)

## 🛠️ Tech Stack & Architecture
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Capacitor](https://img.shields.io/badge/capacitor-%23119EFF.svg?style=for-the-badge&logo=capacitor&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

Initially built as a rapid prototype, **Baca.** has been fully refactored into a clean, modular architecture running natively on Android via Capacitor.

* **Capacitor & GitHub Actions** (Native Android compilation & bridging).
* **Vanilla Web-Native Tech** (Zero framework bloat for the core logic).
* **Tailwind CSS** (Bundled locally for absolute offline support).
* **PDF.js** (Locally hosted worker for Canvas rendering and text extraction).
* **JSZip** (Local EPUB file extraction & Full ZIP Backup creation).
* **LocalForage** (Asynchronous IndexedDB storage management).
* **Lucide Icons** (Locally bundled modern iconography).

## 🤝 Contributing
With the new modular architecture in place, the codebase is primed for community collaboration. Whether it's optimizing the rendering engine, adding new parsing logic, or refining the UI, **Pull Requests are highly welcome and deeply appreciated!** Let's build a better open-source reading experience together.

## ☕ Support
This application is developed for the reading community that craves comfort and privacy. If you find this app useful and want to support its ongoing development, consider buying the developer a coffee!

<a href="https://saweria.co/Densl" target="_blank">
  <img src="https://img.shields.io/badge/Saweria-Buy_Me_A_Coffee-FFCE00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Support via Saweria">
</a>
