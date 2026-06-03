// --- READER ENGINE ---
// File ini mengurus semua logika berat: Parsing PDF, Ekstrak EPUB, In-Book Search, & Gemini AI.

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';
}

// 1. EVENT LISTENER UNTUK UPLOAD BUKU & PENCARIAN
let inbookSearchTimeout;
document.addEventListener("DOMContentLoaded", () => {
    // Listener Upload File (PDF/EPUB)
    const fileInput = document.getElementById('doc-upload');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const originalFilename = file.name; 
            const ext = originalFilename.split('.').pop().toLowerCase(); 
            const bookTitle = originalFilename.replace(/\.[^/.]+$/, "");
            
            DOM.load.classList.remove('hidden'); 
            DOM.loadBar.style.width = '0%'; 
            DOM.loadPct.textContent = '0%';

            try {
                if (ext === 'pdf') await handlePdf(file, bookTitle);
                else if (ext === 'epub') await handleEpub(file, bookTitle);
                else throw new Error("Hanya PDF/EPUB.");
            } catch (err) { 
                showDialog("Gagal Buka Buku", err.message, "alert-triangle", [{text: "Tutup", primary: true}]);
                console.error(err); 
            } 
            finally { 
                setTimeout(() => { 
                    DOM.load.classList.add('hidden'); 
                    fileInput.value = ''; 
                }, 500); 
            }
        });
    }

    // Listener Pencarian dalam Buku
    const searchInput = document.getElementById('inbook-search-input');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(inbookSearchTimeout);
            inbookSearchTimeout = setTimeout(() => window.executeSearch(), 300);
        });
    }
});

// 2. ENGINE PENCARIAN DALAM BUKU (IN-BOOK SEARCH)
window.executeSearch = function() {
    const query = DOM.searchInput.value.toLowerCase().trim(); 
    DOM.searchRes.innerHTML = '';
    const d = i18n[wikiLang] || i18n['id'];
    
    if(!query) { 
        DOM.searchRes.classList.add('hidden');
        return; 
    }
    
    document.querySelectorAll('mark.search-hl').forEach(m => m.outerHTML = m.innerHTML);

    const book = library.find(b => b.id === activeBookId); let results = [];
    book.nodes.forEach((node, idx) => {
        if(node.tag === 'img') return; 
        if(node.text.toLowerCase().includes(query)) {
            let snippet = node.text;
            if(snippet.length > 60) {
                const matchIdx = snippet.toLowerCase().indexOf(query); const start = Math.max(0, matchIdx - 20);
                snippet = "..." + snippet.substring(start, start + 60) + "...";
            }
            results.push({ id: `node-${idx}`, text: snippet, isTitle: node.tag === 'h1' || node.tag === 'h2' });
        }
    });
    
    if(results.length === 0) {
        DOM.searchRes.innerHTML = `<p class="p-3 text-center opacity-60 text-xs">${d.searchNotFound}</p>`;
    } else {
        results.forEach(res => {
            const btn = document.createElement('button');
            btn.className = `w-full text-left p-3 hover:bg-m3-onSurfaceVariant/10 rounded-xl transition-colors ${res.isTitle ? 'font-bold text-m3-primary' : ''}`;
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const regexUI = new RegExp(`(${escapedQuery})`, 'gi');
            btn.innerHTML = res.text.replace(regexUI, `<mark class="bg-m3-primary/20 text-m3-primary rounded px-1 font-bold">$1</mark>`);
            
            btn.onclick = () => {
                const target = document.getElementById(res.id);
                if(target) {
                    const nodeIdx = parseInt(res.id.split('-')[1]); const activeBook = library.find(b => b.id === activeBookId);
                    const nodeText = activeBook.nodes[nodeIdx].text; const currentAnnots = (activeBook.annotations || []).filter(a => a.nodeIdx === nodeIdx);
                    
                    let hlText = nodeText.replace(regexUI, `|||SRCMARK|||$1|||ENDSRCMARK|||`);
                    let hlHtml = renderNodeText(hlText, currentAnnots);
                    hlHtml = hlHtml.replace(/\|\|\|SRCMARK\|\|\|/g, '<mark class="search-hl">').replace(/\|\|\|ENDSRCMARK\|\|\|/g, '</mark>');
                    
                    target.innerHTML = hlHtml;
                    const markEl = target.querySelector('mark.search-hl');
                    if(markEl) markEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); else target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    setTimeout(() => { 
                        target.querySelectorAll('mark.search-hl').forEach(m => { m.style.backgroundColor = 'transparent'; m.style.color = 'inherit'; m.style.boxShadow = 'none'; }); 
                        setTimeout(() => { target.innerHTML = renderNodeText(nodeText, currentAnnots); }, 1500); 
                    }, 2000);
                }
                history.back();
            };
            DOM.searchRes.appendChild(btn);
        });
    }
    DOM.searchRes.classList.remove('hidden');
}

// 3. ENGINE AI & DICTIONARY (Kamus Pintar)
window.lookupDictionary = async function() {
    if(currentSelection.nodeIdx === -1) return; 
    const term = currentSelection.text; 
    hideSelectionMenu(); // Fungsi ini ada di app.js nanti
    
    const d = i18n[wikiLang] || i18n['id'];
    
    document.getElementById('ai-term').textContent = term;
    document.getElementById('ai-loading').classList.remove('hidden'); 
    document.getElementById('ai-content').innerHTML = '';
    
    pushAppHistory(`ai-modal`);
    const m = document.getElementById('ai-modal'); 
    const s = document.getElementById('ai-sheet');
    m.classList.remove('hidden'); 
    requestAnimationFrame(() => { m.classList.remove('opacity-0'); s.classList.remove('translate-y-full', 'scale-75'); });
    
    try {
        const q = encodeURIComponent(term); let wikiHtml = ''; let dictHtml = ''; let geminiHtml = '';
        const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 12000);

        const apiKey = localStorage.getItem('gemini_api_key') || '';
        const model = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
        const prompt = wikiLang === 'id' 
                     ? `Jelaskan secara singkat dan jelas mengenai konsep atau definisi "${term}". Maksimal 3 kalimat berfokus pada inti makna.`
                     : `Explain briefly and clearly the concept or definition of "${term}". Max 3 sentences focusing on the core meaning.`;

        const geminiPromise = apiKey ? fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 250, temperature: 0.3 }
            }),
            signal: controller.signal
        }) : Promise.resolve(null);

        const [resWiki, resSearch, resDict, resWiktionary, resGemini] = await Promise.allSettled([
            fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${q}`, { signal: controller.signal }),
            fetch(`https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&utf8=&format=json&origin=*`, { signal: controller.signal }),
            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${q}`, { signal: controller.signal }),
            fetch(`https://${wikiLang}.wiktionary.org/api/rest_v1/page/definition/${q}`, { signal: controller.signal }),
            geminiPromise
        ]);
        clearTimeout(timeoutId);

        if (resGemini && resGemini.status === 'fulfilled' && resGemini.value && resGemini.value.ok) {
            try {
                const dataGemini = await resGemini.value.json();
                if (dataGemini.candidates && dataGemini.candidates.length > 0) {
                    const aiText = dataGemini.candidates[0].content.parts[0].text.replace(/\n/g, '<br>');
                    const shortModel = model.replace('gemini-', '');
                    geminiHtml = `<div class="mb-4 p-4 bg-m3-primaryContainer text-m3-onPrimaryContainer rounded-2xl shadow-sm"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-1.5"><span class="font-bold text-xs uppercase tracking-wider text-m3-primary">Gemini AI</span></div><span class="text-[9px] font-bold opacity-70 px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full">${shortModel}</span></div><p class="text-sm font-medium leading-relaxed">${aiText}</p></div>`;
                }
            } catch(e) {}
        }

        if (resWiki.status === 'fulfilled' && resWiki.value.ok) {
            const data = await resWiki.value.json();
            wikiHtml = `<p class="mb-2 text-xs text-m3-onSurfaceVariant/60 font-bold uppercase tracking-wider block">Wikipedia (${wikiLang.toUpperCase()})</p><p class="mb-4 text-sm">${data.extract}</p>`;
        } else if (resSearch.status === 'fulfilled' && resSearch.value.ok) {
            const dataSearch = await resSearch.value.json();
            if(dataSearch.query && dataSearch.query.search.length > 0) {
                const topHit = dataSearch.query.search[0];
                wikiHtml = `<p class="mb-2 text-xs text-m3-onSurfaceVariant/60 font-bold uppercase tracking-wider block">Wikipedia: ${topHit.title}</p><p class="mb-4 text-sm">${topHit.snippet}...</p>`;
            }
        }

        if (resDict.status === 'fulfilled' && resDict.value.ok) {
            try {
                const dataDict = await resDict.value.json();
                if (dataDict && dataDict.length > 0) {
                    const meanings = dataDict[0].meanings;
                    let meaningsHtml = meanings.slice(0, 2).map(m => {
                        const defs = m.definitions.slice(0, 2).map(def => `<li class="mb-1">${def.definition}</li>`).join('');
                        return `<div class="mb-2"><span class="italic text-xs font-bold text-m3-primary">${m.partOfSpeech}</span><ul class="list-disc pl-4 mt-1 text-sm">${defs}</ul></div>`;
                    }).join('');
                    dictHtml += `<div class="mt-4 pt-4"><p class="mb-2 text-xs text-m3-onSurfaceVariant/60 font-bold uppercase tracking-wider block">Dictionary (EN)</p>${meaningsHtml}</div>`;
                }
            } catch(e) {}
        }

        if (resWiktionary.status === 'fulfilled' && resWiktionary.value.ok) {
            try {
                const dataWikt = await resWiktionary.value.json(); let wiktMeanings = '';
                Object.keys(dataWikt).forEach(langCode => {
                    const entries = dataWikt[langCode];
                    entries.slice(0, 2).forEach(entry => {
                        if(entry.definitions && entry.definitions.length > 0) {
                            const defs = entry.definitions.slice(0, 2).map(def => { let text = def.definition.replace(/<[^>]*>?/gm, ''); return `<li class="mb-1">${text}</li>`; }).join('');
                            wiktMeanings += `<div class="mb-2"><span class="italic text-xs font-bold text-m3-primary">${entry.partOfSpeech || 'Word'}</span><ul class="list-disc pl-4 mt-1 text-sm">${defs}</ul></div>`;
                        }
                    });
                });
                if(wiktMeanings) { dictHtml += `<div class="mt-4 pt-4"><p class="mb-2 text-xs text-m3-onSurfaceVariant/60 font-bold uppercase tracking-wider block">Wiktionary (${wikiLang.toUpperCase()})</p>${wiktMeanings}</div>`; }
            } catch(e) {}
        }

        const extLinks = `
            <div class="mt-4 pt-4 flex gap-2 flex-wrap items-center">
                <span class="text-xs font-bold opacity-50 uppercase tracking-wider w-full mb-1">External Search:</span>
                <a href="https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${q}" target="_blank" class="text-m3-primary/90 hover:text-m3-primary font-bold inline-flex items-center gap-1 text-xs bg-m3-primary/10 hover:bg-m3-primary/20 transition-all px-3 py-1.5 rounded-full">Wiki <i data-lucide="external-link" class="w-3 h-3"></i></a>
                <a href="https://kbbi.web.id/${q}" target="_blank" class="text-m3-primary/90 hover:text-m3-primary font-bold inline-flex items-center gap-1 text-xs bg-m3-primary/10 hover:bg-m3-primary/20 transition-all px-3 py-1.5 rounded-full">KBBI <i data-lucide="external-link" class="w-3 h-3"></i></a>
            </div>
        `;

        if(!wikiHtml && !dictHtml && !geminiHtml) {
            document.getElementById('ai-content').innerHTML = `
                <div class="flex flex-col items-center justify-center p-4 opacity-50 mb-2">
                    <i data-lucide="ghost" class="w-10 h-10 mb-3"></i>
                    <p class="text-center font-medium">${d.searchNotFound}</p>
                </div>
                ${extLinks}
            `;
        } else {
            document.getElementById('ai-content').innerHTML = geminiHtml + wikiHtml + dictHtml + extLinks;
        }
        if(window.lucide) window.lucide.createIcons();
    } catch(e) {
        document.getElementById('ai-content').innerHTML = `<p class="text-red-500 font-bold">${d.noInternet}</p>`;
    } finally {
        window.getSelection().removeAllRanges(); 
        document.getElementById('ai-loading').classList.add('hidden');
    }
};

window.closeAiModal = function(isFromHistory = false) {
    if (!isFromHistory) { history.back(); return; }
    const m = document.getElementById('ai-modal'); 
    const s = document.getElementById('ai-sheet');
    s.classList.add('translate-y-full', 'scale-75'); 
    m.classList.add('opacity-0'); 
    setTimeout(() => m.classList.add('hidden'), 300);
};

// 4. ENGINE PDF PARSER
async function handlePdf(file, bookTitle) {
    const d = i18n[wikiLang] || i18n['id'];
    DOM.loadTxt.textContent = "Opening PDF...";
    const arrayBuffer = await file.arrayBuffer(); 
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; 
    const numPages = pdf.numPages;
    
    if(numPages === 0) throw new Error("Document is empty.");
    
    let allItems = []; let coverBase64 = null;
    
    try {
        DOM.loadTxt.textContent = d.extractingCover;
        const page1 = await pdf.getPage(1); 
        const viewport = page1.getViewport({ scale: 0.8 });
        const canvas = document.createElement('canvas'); 
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page1.render({ canvasContext: ctx, viewport: viewport }).promise; 
        coverBase64 = canvas.toDataURL('image/jpeg', 0.6);
    } catch(e) {}

    for (let i = 1; i <= numPages; i++) {
        const pct = Math.round((i / numPages) * 100);
        if(i % 5 === 0 || i === numPages) await new Promise(r => setTimeout(r, 0));
        
        DOM.loadBar.style.width = `${pct}%`; 
        DOM.loadPct.textContent = `${pct}%`; 
        DOM.loadTxt.textContent = `${d.readingPage} ${i}`;

        const page = await pdf.getPage(i); 
        const viewport = page.getViewport({ scale: 1.0 }); 
        const pageHeight = viewport.height;
        const textContent = await page.getTextContent();
        
        textContent.items.forEach(item => {
            const str = item.str.trim(); if (str === '') return;
            const yPos = item.transform[5];
            if (yPos < pageHeight * 0.10 || yPos > pageHeight * 0.90) return;
            if (/^\d+$/.test(str) || str.toLowerCase() === bookTitle.toLowerCase()) return;
            allItems.push({ text: item.str, height: item.transform[0], y: yPos });
        });
    }
    
    DOM.loadTxt.textContent = d.formattingText; 
    await new Promise(r => setTimeout(r, 50));
    if(allItems.length === 0) throw new Error("This PDF only contains images.");

    const avgHeight = allItems.reduce((acc, i) => acc + i.height, 0) / allItems.length;
    let parsedNodes = [], currentPar = "", lastY = -1;

    allItems.forEach(item => {
        if (lastY !== -1 && Math.abs(item.y - lastY) > avgHeight * 1.5) {
            if (currentPar.trim() !== "") { 
                const lastChar = currentPar.trim().slice(-1);
                if (['.', '?', '!', '"', '”', '’', ':'].includes(lastChar)) { 
                    parsedNodes.push({ tag: 'p', text: currentPar.trim() }); currentPar = ""; 
                } else { 
                    currentPar += " "; 
                }
            }
        }
        if (item.height > avgHeight * 1.4) {
            if (currentPar.trim() !== "") { parsedNodes.push({ tag: 'p', text: currentPar.trim() }); currentPar = ""; }
            parsedNodes.push({ tag: 'h1', text: item.text.trim() });
        } else if (item.height > avgHeight * 1.15) {
            if (currentPar.trim() !== "") { parsedNodes.push({ tag: 'p', text: currentPar.trim() }); currentPar = ""; }
            parsedNodes.push({ tag: 'h2', text: item.text.trim() });
        } else { 
            currentPar += item.text + " "; 
        }
        lastY = item.y;
    });
    
    if (currentPar.trim() !== "") parsedNodes.push({ tag: 'p', text: currentPar.trim() });

    let cleanedNodes = [];
    parsedNodes.forEach(curr => {
        if (cleanedNodes.length > 0) {
            let prev = cleanedNodes[cleanedNodes.length-1];
            if (curr.tag === prev.tag && (curr.tag === 'h1' || curr.tag === 'h2')) { 
                prev.text += " " + curr.text; return; 
            }
        }
        cleanedNodes.push(curr);
    });
    
    library.push({ id: Date.now().toString(), type: 'pdf', title: bookTitle, nodes: cleanedNodes, pages: numPages, progressPct: 0, lastReadId: null, coverBase64: coverBase64, shape: 'square' });
    await localforage.setItem('pdf_epub_master', library); 
    renderLibrary();
}

// 5. ENGINE EPUB PARSER (XML & JSZip)
async function handleEpub(file, bookTitle) {
    const d = i18n[wikiLang] || i18n['id'];
    DOM.loadTxt.textContent = d.extractingEpub; 
    DOM.loadBar.style.width = '10%'; 
    DOM.loadPct.textContent = '10%';
    
    const zip = await JSZip.loadAsync(file);
    const containerData = await zip.file("META-INF/container.xml").async("string");
    const containerDom = new DOMParser().parseFromString(containerData, "text/xml");
    const rootfile = containerDom.querySelector("rootfile"); 
    if (!rootfile) throw new Error("Invalid or corrupted EPUB file.");
    
    const opfPath = rootfile.getAttribute("full-path"); 
    const basePath = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

    DOM.loadTxt.textContent = d.analyzingStruct;
    const opfData = await zip.file(opfPath).async("string"); 
    const opfDom = new DOMParser().parseFromString(opfData, "text/xml");
    const manifest = {}; 
    opfDom.querySelectorAll("manifest > item").forEach(item => { manifest[item.getAttribute("id")] = item.getAttribute("href"); });
    const spine = []; 
    opfDom.querySelectorAll("spine > itemref").forEach(ref => { spine.push(manifest[ref.getAttribute("idref")]); });

    let coverBase64 = null; 
    const coverMeta = opfDom.querySelector("meta[name='cover']");
    if (coverMeta && manifest[coverMeta.getAttribute("content")]) {
        const coverPath = basePath + manifest[coverMeta.getAttribute("content")]; 
        const coverFile = zip.file(coverPath);
        if (coverFile) { 
            const base64Str = await coverFile.async("base64"); 
            coverBase64 = "data:image/jpeg;base64," + base64Str; 
        }
    }

    let parsedNodes = [];
    for (let i = 0; i < spine.length; i++) {
        const pct = Math.round(((i+1) / spine.length) * 80) + 20;
        DOM.loadBar.style.width = `${pct}%`; 
        DOM.loadPct.textContent = `${pct}%`; 
        DOM.loadTxt.textContent = `${d.extractingChapter} ${i+1}/${spine.length}`;
        await new Promise(r => setTimeout(r, 0));

        const htmlPath = basePath + spine[i]; 
        const htmlFile = zip.file(htmlPath); if(!htmlFile) continue;
        const htmlString = await htmlFile.async("string"); 
        const doc = new DOMParser().parseFromString(htmlString, "text/html");
        const elements = doc.body.querySelectorAll('h1, h2, h3, p, img');
        
        for (const el of elements) {
            const tag = el.tagName.toLowerCase();
            if (tag === 'img' || tag === 'image') {
                let src = el.getAttribute('src') || el.getAttribute('href');
                if (src && !src.startsWith('http')) {
                    let absPath = resolveRelativePath(htmlPath, src); 
                    const imgFile = zip.file(absPath);
                    if (imgFile) { 
                        const b64 = await imgFile.async("base64"); 
                        parsedNodes.push({ tag: 'img', src: "data:image/jpeg;base64," + b64 }); 
                    }
                }
            } else {
                const text = el.textContent.trim();
                if (text) { 
                    let cleanTag = tag; 
                    if (tag === 'h3') cleanTag = 'h2'; 
                    parsedNodes.push({ tag: cleanTag, text: text }); 
                }
            }
        }
    }
    
    library.push({ id: Date.now().toString(), type: 'epub', title: bookTitle, nodes: parsedNodes, pages: spine.length, progressPct: 0, lastReadId: null, coverBase64: coverBase64, shape: 'square' });
    await localforage.setItem('pdf_epub_master', library); 
    renderLibrary();
}

function resolveRelativePath(base, relative) {
    const stack = base.split('/'); stack.pop(); 
    const parts = relative.split('/');
    for (const part of parts) { 
        if (part === '.') continue; 
        if (part === '..') stack.pop(); 
        else stack.push(part); 
    }
    return stack.join('/');
}
