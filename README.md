# Baca. 📖

[![GitHub stars](https://img.shields.io/github/stars/dyunayuna90-bit/baca.?style=for-the-badge)](https://github.com/dyunayuna90-bit/baca./stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Download Latest Release](https://img.shields.io/github/v/release/dyunayuna90-bit/baca.?style=for-the-badge&logo=android&color=3DDC84&label=DOWNLOAD%20APK)](https://github.com/dyunayuna90-bit/baca./releases/latest)

**Baca.** is a lightweight, local-first e-book reader (EPUB & PDF) built because I wanted a beautiful reading experience without the bloat. It runs entirely on web-native tech with zero backend. No servers, no tracking, no cloud uploads. Your books are processed and stored 100% locally on your device for absolute privacy.

## Logo
<img width="1920" height="1080" alt="1_20260601_232909_0000" src="https://github.com/user-attachments/assets/bbfff3df-8edc-43be-8813-873ccfd07e92" />



## ✨ Material 3 Expressive Design
The UI of **Baca.** is anything but static. We deeply adopted the **Material 3 Expressive** design principles to provide an organic, dynamic, and engaging user experience:
 * **Fluid Morphing & Animation:** UI elements like buttons and book cards don't just register clicks; they morph and react to your touch with butter-smooth bezier curve transitions.
 * **Immersive Reading Mode:** Navigation elements (headers, search panels) intuitively slide out of the way as you scroll down to focus on reading, giving you a 100% distraction-free canvas.
 * **10 Vibrant Palettes:** Choose from 10 meticulously crafted Material 3 color palettes (including the elegant *Warm Teal*) that dynamically shift the entire app's accent and mood.
 * **True AMOLED Dark Mode:** Features a pitch-black dark mode optimized for OLED/AMOLED screens to save battery, complete with perfectly symmetrical and satisfying toggle switches.

## 📷 Screenshot

<p align="center">
  <img src="https://github.com/user-attachments/assets/46109d7f-68fe-45d4-8166-ff65abb60273" width="300"><br><br>
  <img src="https://github.com/user-attachments/assets/18dabd4d-ce9a-45b5-95aa-64ebc904d128" width="300"><br><br>
  <img src="https://github.com/user-attachments/assets/d5815600-e48c-4498-967c-39dac65612cc" width="300">
</p>




## 🚀 Key Features
 * **Privacy-Focused:** 100% offline and Zero cloud uploads. We utilize localforage (IndexedDB) to parse, render, and save your books and reading progress locally. Your data belongs to you.
 * **Smart Annotations & Highlights:** Highlight crucial texts in multiple colors (Yellow, Green, Pink) and attach your personal notes directly inside the book context.
 * **AI Dictionary & Definition Lookup:** Stumbled upon a difficult word? Just select it, and our AI feature will pull definitions seamlessly from Wikipedia, Wiktionary, and real-time dictionaries via the Gemini API.
 * **In-Book Search Engine:** A highly intuitive search bar integrated right into the side panel. Instantly sweeps through the book and auto-scrolls to the exact highlighted paragraph.
 * **Typography Control:** Ultimate reading comfort. Adjust text size, paragraph alignment, and pick from premium fonts (*Lora, Merriweather, Playfair, Inter, Space Mono*).
 * **Bilingual Support:** Interface is fully available in English and Indonesian.

## 🤔 Why Baca? (And not the others?)

Most e-book readers on the market fall into two frustrating extremes: they are either heavily bloated with ads, expensive cloud subscriptions, and useless features (like robotic text-to-speech that ruins your focus), or they are free but feature a clunky, outdated UI from 2010.

**Baca.** exists to break that compromise. The logic is simple:

* **Zero Feature Creep (~4MB Size):** We don't shove unnecessary tools down your throat. No robotic voices, no social sharing buttons, no bloatware. Just a pure, uncompromised visual reading experience.
* **Open-Source Doesn't Mean Ugly:** Just because an app is free doesn't mean it should look cheap. By deeply integrating Material 3 Expressive, navigating your library actually feels fluid and satisfying.
* **True Local Privacy:** Most "free" apps harvest your reading habits or force you to upload your PDFs to their servers. Baca is strictly local-first. Your academic journals and personal books are parsed and stored locally on your device via IndexedDB. Zero servers involved.
   
## 📦 Download & Installation
[![Download Latest Release](https://img.shields.io/github/v/release/dyunayuna90-bit/baca.?style=for-the-badge&logo=android&color=3DDC84&label=DOWNLOAD%20APK)](https://github.com/dyunayuna90-bit/baca./releases/latest)

## 🛠️ Tech Stack
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

 * **HTML5, CSS3, Vanilla JavaScript** (Zero framework bloat for the core logic).
 * **Tailwind CSS** (Utility-first styling via CDN).
 * **PDF.js** (PDF rendering and text extraction).
 * **JSZip** (Local EPUB file extraction).
 * **LocalForage** (Asynchronous storage management).
 * **Lucide Icons** (Clean and modern iconography).

## 🤝 Contributing (The "Monster Code" Disclaimer)
I focused heavily on the UI/UX and core logic to make this app feel as native and smooth as possible. Because of that, the current codebase is essentially a single-file monolith (a bit of a "monster" HTML file). 

If any developers out there want to help refactor, modularize the code, or improve the architecture, **Pull Requests are highly welcome and deeply appreciated!** Let's build a better open-source reading experience together.

## ☕ Support
This application is developed for the reading community that craves comfort and privacy. If you find this app useful and want to support its ongoing development, consider buying the developer a coffee!

<a href="https://saweria.co/Densl" target="_blank">
  <img src="https://img.shields.io/badge/Saweria-Buy_Me_A_Coffee-FFCE00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Support via Saweria">
</a>
