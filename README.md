# Baca. 📖

[![GitHub stars](https://img.shields.io/github/stars/dyunayuna90-bit/baca.?style=for-the-badge)](https://github.com/dyunayuna90-bit/baca./stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Download Latest Release](https://img.shields.io/github/v/release/dyunayuna90-bit/baca.?style=for-the-badge&logo=android&color=3DDC84&label=DOWNLOAD%20APK)](https://github.com/dyunayuna90-bit/baca./releases/latest)

**Baca.** is a lightweight, local-first e-book reader (EPUB & PDF) built because I wanted a beautiful reading experience without the bloat. It runs entirely on web-native tech with zero backend. No servers, no tracking, no cloud uploads, and **zero CDN reliance**. Your books and libraries are processed and stored 100% locally on your device for absolute privacy and complete offline capability.

## Logo
<img width="1920" height="1080" alt="Baca Logo" src="https://github.com/user-attachments/assets/bbfff3df-8edc-43be-8813-873ccfd07e92" />

## ✨ Material 3 Expressive Design
The UI of **Baca.** is anything but static. We deeply adopted the **Material 3 Expressive** design principles to provide an organic, dynamic, and engaging user experience:
 * **Fluid Morphing & Animation:** UI elements like buttons and book cards don't just register clicks; they morph and react to your touch with butter-smooth bezier curve transitions.
 * **Immersive Reading Mode:** Navigation elements intuitively slide out of the way as you scroll down to focus on reading, giving you a 100% distraction-free canvas.
 * **10 Vibrant Palettes:** Choose from 10 meticulously crafted Material 3 color palettes (including the elegant *Warm Teal*) that dynamically shift the entire app's accent and mood.
 * **True AMOLED Dark Mode:** Features a pitch-black dark mode optimized for OLED/AMOLED screens to save battery, complete with perfectly symmetrical and satisfying toggle switches.

## 📷 Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/46109d7f-68fe-45d4-8166-ff65abb60273" width="300"><br><br>
  <img src="https://github.com/user-attachments/assets/18dabd4d-ce9a-45b5-95aa-64ebc904d128" width="300"><br><br>
  <img src="https://github.com/user-attachments/assets/d5815600-e48c-4498-967c-39dac65612cc" width="300">
</p>

## 🚀 Key Features
 * **100% Offline & Privacy-Focused:** Zero cloud uploads and fully bundled local libraries. We utilize localforage (IndexedDB) to parse, render, and save your books and reading progress locally. Your data belongs to you.
 * **Smart Hybrid Bookmarks:** We merged highlights and notes into one powerful side panel. Simply select text to create a bookmark, add your custom notes, and click the bookmark card later to instantly jump back to that exact page.
 * **Built-in Update Checker:** Never miss a patch. The settings menu includes an auto-update checker that directly routes you to the latest GitHub release.
 * **AI Dictionary & Definition Lookup:** Stumbled upon a difficult word? Just select it, and our AI feature will pull definitions seamlessly from Wikipedia, Wiktionary, and real-time dictionaries via the Gemini API.
 * **In-Book Search Engine:** A highly intuitive search bar integrated right into the side panel. Instantly sweeps through the book and auto-scrolls to the exact highlighted paragraph.
 * **Typography Control:** Ultimate reading comfort. Adjust text size, paragraph alignment, and pick from premium fonts (*Lora, Merriweather, Playfair, Inter, Space Mono*).
 * **Bilingual Support:** Interface defaults to English for international users, with Indonesian fully supported.

## 🤔 Why Baca? (And not the others?)

Most e-book readers on the market fall into two frustrating extremes: they are either heavily bloated with ads, expensive cloud subscriptions, and useless features, or they are free but feature a clunky, outdated UI from 2010.

**Baca.** exists to break that compromise. The logic is simple:

* **Zero Feature Creep (~4MB Size):** We don't shove unnecessary tools down your throat. Just a pure, uncompromised visual reading experience.
* **Open-Source Doesn't Mean Ugly:** Just because an app is free doesn't mean it should look cheap. By deeply integrating Material 3 Expressive, navigating your library actually feels fluid and satisfying.
* **True Local Privacy:** Most "free" apps harvest your reading habits. Baca is strictly local-first. Zero tracking, zero CDNs, zero servers involved.
   
## 📦 Download & Installation
[![Download Latest Release](https://img.shields.io/github/v/release/dyunayuna90-bit/baca.?style=for-the-badge&logo=android&color=3DDC84&label=DOWNLOAD%20APK)](https://github.com/dyunayuna90-bit/baca./releases/latest)

## 🛠️ Tech Stack & Architecture
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

Initially built as a rapid prototype, **Baca.** has been fully refactored into a clean, modular architecture for maintainability and performance.

 * **Vanilla Web-Native Tech** (Zero framework bloat for the core logic).
 * **Tailwind CSS** (Bundled locally for absolute offline support).
 * **PDF.js** (Locally hosted worker for PDF rendering and text extraction).
 * **JSZip** (Local EPUB file extraction).
 * **LocalForage** (Asynchronous IndexedDB storage management).
 * **Lucide Icons** (Locally bundled modern iconography).

## 🤝 Contributing
With the new modular architecture in place, the codebase is primed for community collaboration. Whether it's optimizing the rendering engine, adding new parsing logic, or refining the UI, **Pull Requests are highly welcome and deeply appreciated!** Let's build a better open-source reading experience together.

## ☕ Support
This application is developed for the reading community that craves comfort and privacy. If you find this app useful and want to support its ongoing development, consider buying the developer a coffee!

<a href="https://saweria.co/Densl" target="_blank">
  <img src="https://img.shields.io/badge/Saweria-Buy_Me_A_Coffee-FFCE00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Support via Saweria">
</a>
