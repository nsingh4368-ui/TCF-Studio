// ============ READING COMPREHENSION MODULE ============

let readingDocs = LS('tcf_reading_docs', []);
let activeReadingDoc = 0;
let currentRdgText = null;
let rdgAnswers = {};
let rdgSubmitted = false;

function initReadingModule() {
    renderReadingLibrary();
}

function renderReadingLibrary() {
    const panel = document.getElementById('readingDocsPanel');
    const empty = document.getElementById('readingEmptyState');
    if (!readingDocs.length) {
        if (panel) panel.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';
    if (panel) panel.style.display = 'block';
    
    const tabs = document.getElementById('readingDocTabs');
    if (tabs) {
        tabs.innerHTML = readingDocs.map((d, i) => `
            <div class="comp-tab ${i === activeReadingDoc ? 'active' : ''}" onclick="selectReadingDoc(${i})">
                ${d.type === 'ÉCOUTE' ? '🎙' : '📄'} ${escHtml(d.title.slice(0, 20))}
            </div>
        `).join('');
    }
    renderActiveReadingDoc();
}

function selectReadingDoc(idx) {
    activeReadingDoc = idx;
    renderReadingLibrary();
}

function renderActiveReadingDoc() {
    const el = document.getElementById('readingActiveDoc');
    if (!el || !readingDocs.length) return;
    const doc = readingDocs[activeReadingDoc] || readingDocs[0];
    el.innerHTML = `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <div>
                    <div style="font-weight:800">${doc.type === 'ÉCOUTE' ? '🎙' : '📄'} ${escHtml(doc.title)}</div>
                    <div class="muted">${doc.type} · ${doc.questions?.length || 0} questions</div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="startReadingPractice(${activeReadingDoc})">🚀 Pratiquer</button>
            </div>
            <div class="comp-text">${escHtml(doc.text)}</div>
        </div>
    `;
}

function startReadingPractice(idx) {
    currentRdgText = readingDocs[idx];
    rdgAnswers = {};
    rdgSubmitted = false;
    document.getElementById('rdgModalTitle').textContent = (currentRdgText.type === 'ÉCOUTE' ? '🎙 ' : '📄 ') + escHtml(currentRdgText.title);
    renderReadingModal();
    document.getElementById('rdgModal').classList.add('active');
}

function renderReadingModal() {
    const area = document.getElementById('rdgModalContent');
    if (!currentRdgText) return;
    
    let html = `<div class="rdg-text-box">${escHtml(currentRdgText.text)}</div>`;
    
    if (currentRdgText.questions && currentRdgText.questions.length) {
        currentRdgText.questions.forEach((q, i) => {
            html += `
                <div class="rdg-qblock">
                    <div class="rdg-question">${i + 1}. ${escHtml(q.question)}</div>
                    <div class="rdg-options">
                        ${q.options ? q.options.map(opt => `
                            <div class="rdg-option" onclick="selectReadingAnswer(${i}, '${opt.key}')">
                                ${opt.key}) ${escHtml(opt.text)}
                            </div>
                        `).join('') : ''}
                    </div>
                    ${q.answer ? `<div class="muted" style="margin-top:8px">✅ Réponse: ${q.answer}</div>` : ''}
                </div>
            `;
        });
    }
    
    area.innerHTML = html;
}

function selectReadingAnswer(qIdx, answer) {
    // Store answer if needed
    console.log(`Selected ${answer} for question ${qIdx}`);
}

function closeRdgModal() {
    document.getElementById('rdgModal').classList.remove('active');
    currentRdgText = null;
}

function importReadingTXT(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const parsed = parseReadingTXT(text);
        readingDocs.push(...parsed);
        SV('tcf_reading_docs', readingDocs);
        renderReadingLibrary();
        alert(`${parsed.length} texte(s) importé(s) !`);
    };
    reader.readAsText(file);
}

function parseReadingTXT(content) {
    // Simple parser - expects ### TITLE then TEXT: then QUESTIONS:
    const results = [];
    const blocks = content.split(/###\s+/);
    for (let block of blocks) {
        if (!block.trim()) continue;
        const lines = block.split('\n');
        const title = lines[0].trim();
        let type = 'LECTURE';
        if (title.includes('[ÉCOUTE]')) type = 'ÉCOUTE';
        const textMatch = block.match(/TEXTE:\s*\n([\s\S]*?)(?=QUESTIONS:|$)/i);
        const text = textMatch ? textMatch[1].trim() : '';
        if (text) {
            results.push({ title: title.replace(/\[.*\]/, '').trim(), type, text, questions: [] });
        }
    }
    return results;
}

function exportReadingTXT() {
    if (!readingDocs.length) { alert('Aucun texte à exporter.'); return; }
    const txt = readingDocs.map(d => `### ${d.title} [${d.type}]\nTEXTE:\n${d.text}`).join('\n\n---\n\n');
    dl(new Blob([txt], { type: 'text/plain' }), 'TCF_lecture.txt');
}

function clearReadingDocs() {
    if (confirm('Effacer tous les textes ?')) {
        readingDocs = [];
        SV('tcf_reading_docs', readingDocs);
        renderReadingLibrary();
    }
}
