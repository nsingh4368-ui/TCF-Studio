// ============ PRESET ANSWERS MODULE ============

let presetAnswers = LS('tcf_presets', []);

function initPresetsModule() {
    renderPresetsList();
}

function renderPresetsList() {
    const el = document.getElementById('presetsList');
    if (!el) return;
    if (!presetAnswers.length) {
        el.innerHTML = '<div class="empty-state">📂 Importez des réponses modèles via le menu "Vocabulaire" → "Réponses types"</div>';
        return;
    }
    el.innerHTML = presetAnswers.map((a, i) => `
        <div class="preset-answer-card">
            <div class="preset-answer-head">
                <span class="preset-answer-label">Tâche ${a.task}${a.title ? ' — ' + escHtml(a.title) : ''}</span>
                <span class="del-x" onclick="deletePresetAnswer(${i})">×</span>
            </div>
            <div class="preset-answer-text" onclick="this.classList.toggle('open')">${escHtml(a.text)}</div>
            <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="usePresetAnswer(${i})">📋 Utiliser</button>
        </div>
    `).join('');
}

function usePresetAnswer(idx) {
    const a = presetAnswers[idx];
    if (confirm(`Charger cette réponse modèle dans l'éditeur ?`)) {
        showView('studio');
        setTimeout(() => {
            editor.value = a.text;
            updateWordCounter();
            saveDraft();
        }, 100);
    }
}

function deletePresetAnswer(i) {
    if (confirm('Supprimer cette réponse modèle ?')) {
        presetAnswers.splice(i, 1);
        SV('tcf_presets', presetAnswers);
        renderPresetsList();
    }
}

function importPresetAnswers(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const parsed = parsePresetTXT(text);
        presetAnswers.push(...parsed);
        SV('tcf_presets', presetAnswers);
        renderPresetsList();
        alert(`${parsed.length} réponse(s) modèle(s) importée(s) !`);
    };
    reader.readAsText(file);
}

function parsePresetTXT(content) {
    const results = [];
    const blocks = content.split(/###\s*TÂCHE\s*(\d+)/i);
    for (let i = 1; i < blocks.length; i += 2) {
        const task = parseInt(blocks[i]);
        const text = blocks[i + 1]?.trim();
        if (text) results.push({ task, text, addedAt: todayStr() });
    }
    return results;
}

function exportPresetsTXT() {
    if (!presetAnswers.length) { alert('Aucune réponse modèle.'); return; }
    const txt = presetAnswers.map(a => `### TÂCHE ${a.task}\n${a.text}`).join('\n\n');
    dl(new Blob([txt], { type: 'text/plain' }), 'TCF_reponses_modeles.txt');
}
