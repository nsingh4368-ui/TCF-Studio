// TCF EE Studio X - Complete Application
// All data persists in localStorage

// ============ UTILITIES ============
function escHtml(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function dl(b, n) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = n; a.click(); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function LS(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }
function SV(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function wcOf(t) { return t.trim() ? t.trim().split(/\s+/).length : 0; }

// ============ SUBJECT BANK ============
const allMonths = [
    { slug: 'juin-2026', label: 'Juin 2026' },
    { slug: 'mai-2026', label: 'Mai 2026' },
    { slug: 'avril-2026', label: 'Avril 2026' }
];

const DEFAULT_SUBJECT_BANK = {
    "juin-2026": [
        { num: 1, t1: { consigne: "Vous avez vu une annonce en ligne offrant de l'aide aux personnes qui veulent apprendre le français. Vous rédigez un courriel pour répondre. (60-120 mots)" }, t2: { consigne: "Vous avez assisté à une fête de famille. Vous envoyez un message à vos amis pour leur parler de cette fête. (120-150 mots)" }, t3: { titre: "Villes sans voitures", doc1: "Document 1: Avantages des villes sans voitures...", doc2: "Document 2: Précautions nécessaires..." } },
        { num: 2, t1: { consigne: "Un de vos proches souhaite partir en voyage. Vous lui envoyez un message pour lui présenter votre pays. (60-120 mots)" }, t2: { consigne: "Vous avez commencé un nouvel emploi. Vous envoyez un courriel à vos proches. (120-150 mots)" }, t3: { titre: "Femmes et hommes au travail", doc1: "Document 1: Égalité au Québec...", doc2: "Document 2: Inégalités persistantes..." } },
        { num: 3, t1: { consigne: "Vous rédigez un message à vos amis pour les convier à une fête d'anniversaire surprise. (60-120 mots)" }, t2: { consigne: "Vous avez pris part à un marché d'occasion. Rédigez un article sur votre blog. (120-150 mots)" }, t3: { titre: "Les vols low-cost", doc1: "Document 1: Avantages des low-cost...", doc2: "Document 2: Inconvénients..." } },
        { num: 4, t1: { consigne: "Écrire un message à un(e) ami(e) pour raconter son week-end à la campagne. (60-120 mots)" }, t2: { consigne: "Rédiger un message à la direction pour informer qu'un lieu a été trouvé. (120-150 mots)" }, t3: { titre: "Nouvelles technologies à l'école", doc1: "Document 1: Pour l'intégration...", doc2: "Document 2: Contre l'excès..." } },
        { num: 5, t1: { consigne: "Dans le cadre d'un reportage sur les activités sportives amateurs, envoyez votre témoignage. (60-120 mots)" }, t2: { consigne: "Vous avez séjourné dans une belle région. Rédigez un message à vos amis. (120-150 mots)" }, t3: { titre: "École privée : quels enjeux ?", doc1: "Document 1: Avantages des écoles privées...", doc2: "Document 2: Inconvénients..." } }
    ],
    "mai-2026": [
        { num: 1, t1: { consigne: "Votre ami(e) veut visiter votre région. Proposez-lui des lieux intéressants. (60-120 mots)" }, t2: { consigne: "Vous avez assisté à un cours de sport. Écrivez un article sur votre blog. (120-150 mots)" }, t3: { titre: "Repas livrés au bureau", doc1: "Document 1: Avantages...", doc2: "Document 2: Limites..." } }
    ],
    "avril-2026": [
        { num: 1, t1: { consigne: "Vous souhaitez organiser un week-end avec vos proches. Expliquez votre plan. (60-120 mots)" }, t2: { consigne: "Partir un an à l'étranger : bonne ou mauvaise idée ? Donnez votre avis. (120-150 mots)" }, t3: { titre: "Le rôle du travail", doc1: "Document 1: Travail et épanouissement...", doc2: "Document 2: Travail et identité sociale..." } }
    ]
};

let customBank = LS('tcf_custom_bank', DEFAULT_SUBJECT_BANK);
let productions = LS('tcf_productions', []);
let vocabList = LS('tcf_vocab', []);
let myErrors = LS('tcf_errors', []);
let favorites = LS('tcf_favorites', []);
let revisits = LS('tcf_revisits', []);
let history = LS('tcf_history', []);
let profile = LS('tcf_profile', {});
let streak = LS('tcf_streak', { lastDate: '', cur: 0, best: 0 });

let combos = [], activeCombIdx = 0, activeTask = 1, activeMonthSlug = '', focusMode = false;
let timerRemain = 3600, timerTotal = 3600, timerInterval = null;
let examRemain = 3600, examInterval = null, examCombo = null, examTask = 1;
let pendingProduction = null;

// ============ ACCENTS ============
const accents = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'ù', 'û', 'ü', 'î', 'ï', 'ô', 'œ', 'æ', 'É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ç', 'Ù', 'Û', 'Î', 'Ï', 'Ô', 'Œ', 'Æ', '«', '»', '—'];
let accentPage = 0, PAGE = 12;

function renderAccentPage() {
    document.getElementById('accentBar').innerHTML = accents.slice(accentPage * PAGE, accentPage * PAGE + PAGE).map(a => `<button onclick="insertAccent('${a}')">${a}</button>`).join('');
}
function nextAccentPage() { accentPage = (accentPage + 1) % Math.ceil(accents.length / PAGE); renderAccentPage(); }
function prevAccentPage() { accentPage = (accentPage - 1 + Math.ceil(accents.length / PAGE)) % Math.ceil(accents.length / PAGE); renderAccentPage(); }

function insertAccent(ch) {
    const t = document.activeElement;
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) {
        const s = t.selectionStart, e = t.selectionEnd;
        t.value = t.value.slice(0, s) + ch + t.value.slice(e);
        t.selectionStart = t.selectionEnd = s + ch.length;
        t.focus();
        if (t.id === 'editor') updateWordCounter();
    }
}
renderAccentPage();

// ============ VIEWS ============
function showView(v) {
    closeMobileSidebar();
    const views = ['studio', 'browse', 'productions', 'connectors', 'vocab', 'errors', 'reading', 'listening', 'reading_mock', 'favorites', 'revisit', 'history', 'stats', 'profile'];
    views.forEach(x => {
        const e = document.getElementById('view-' + x);
        if (e) e.style.display = (x === v ? 'block' : 'none');
        const n = document.getElementById('nav-' + x);
        if (n) n.classList.toggle('active', x === v);
    });
    if (v === 'browse') buildMonthGrid();
    if (v === 'productions') buildProductions();
    if (v === 'vocab') renderVocabList();
    if (v === 'history') buildHistList();
    if (v === 'stats') buildStats();
    if (v === 'profile') loadProfileForm();
}

// ============ SUJETS ============
function populateMonthSelect() {
    document.getElementById('monthSel').innerHTML = allMonths.map(m => `<option value="${m.slug}">${m.label}</option>`).join('');
    document.getElementById('bankMonth').innerHTML = allMonths.map(m => `<option value="${m.slug}">${m.label}</option>`).join('');
}

function getMonth(s) { return allMonths.find(m => m.slug === s) || allMonths[0]; }

function availableTasks(c) { return [c.t1 ? 1 : 0, c.t2 ? 2 : 0, c.t3 ? 3 : 0].filter(Boolean); }

function loadSujets() {
    const s = document.getElementById('monthSel').value;
    activeMonthSlug = s;
    combos = (customBank[s] || []).map((c, i) => ({ ...c, num: c.num || i + 1 }));
    if (!combos.length) {
        document.getElementById('sujetContent').style.display = 'none';
        document.getElementById('sujetEmpty').style.display = 'block';
        document.getElementById('comboBadge').textContent = '—';
        return;
    }
    document.getElementById('sujetEmpty').style.display = 'none';
    document.getElementById('sujetContent').style.display = 'block';
    activeCombIdx = 0;
    const av = availableTasks(combos[0]);
    activeTask = av.includes(parseInt(document.getElementById('taskActive').value)) ? parseInt(document.getElementById('taskActive').value) : (av[0] || 1);
    renderSujet();
    loadDraft();
}

function renderSujet() {
    if (!combos.length) return;
    const c = combos[activeCombIdx];
    document.getElementById('comboBadge').textContent = 'Combinaison ' + c.num;
    document.getElementById('comboList').innerHTML = combos.map((cc, i) => `<button class="combo-pill ${i === activeCombIdx ? 'active' : ''}" onclick="selectCombo(${i})">Combinaison ${cc.num}</button>`).join('');
    document.getElementById('taskTabs').innerHTML = [1, 2, 3].map(n => `<div class="task-tab ${activeTask === n ? 'active' : ''}" onclick="switchTask(${n})">Tâche ${n}</div>`).join('');
    
    const taskContent = document.getElementById('taskContent');
    if (activeTask === 1 && c.t1) taskContent.innerHTML = `<div class="task-label">Tâche 1 (60-120 mots)</div><div class="task-text">${escHtml(c.t1.consigne)}</div>`;
    else if (activeTask === 2 && c.t2) taskContent.innerHTML = `<div class="task-label">Tâche 2 (120-150 mots)</div><div class="task-text">${escHtml(c.t2.consigne)}</div>`;
    else if (c.t3) taskContent.innerHTML = `<div class="task-label">Tâche 3 — ${escHtml(c.t3.titre || '')}</div><div class="task-text">${escHtml(c.t3.doc1 || '')}<br><br>${escHtml(c.t3.doc2 || '')}</div><div class="task-limit">180 mots maximum</div>`;
    
    document.getElementById('editorTaskLabel').textContent = '(Tâche ' + activeTask + ')';
    updateWordCounter();
}

function selectCombo(i) { activeCombIdx = i; activeTask = 1; renderSujet(); loadDraft(); }
function prevCombo() { activeCombIdx = Math.max(0, activeCombIdx - 1); renderSujet(); }
function nextCombo() { activeCombIdx = Math.min(combos.length - 1, activeCombIdx + 1); renderSujet(); }
function randomCombo() { if (!combos.length) { loadSujets(); return; } activeCombIdx = Math.floor(Math.random() * combos.length); renderSujet(); loadDraft(); }
function switchTask(n) { saveDraft(); activeTask = n; renderSujet(); loadDraft(); }

// ============ EDITOR ============
const editor = document.getElementById('editor');
function draftKey() { return `tcf_draft_${activeMonthSlug}_${activeCombIdx}_t${activeTask}`; }
function saveDraft() { if (combos.length) localStorage.setItem(draftKey(), editor.value); }
function loadDraft() { editor.value = combos.length ? (localStorage.getItem(draftKey()) || '') : ''; updateWordCounter(); }
function onEditorInput() { saveDraft(); updateWordCounter(); }

function updateWordCounter() {
    const w = wcOf(editor.value);
    const el = document.getElementById('wordCounter');
    const limits = [[60, 120], [120, 150], [0, 180]];
    const [mn, mx] = limits[activeTask - 1];
    el.textContent = w + ' mots' + (w >= mn && w <= mx ? ' ✓' : '');
    el.className = 'word-counter ' + (w >= mn && w <= mx ? 'ok' : (w > mx ? 'over' : 'warn'));
}

function onFontSlider() {
    const v = document.getElementById('fontSlider').value;
    document.getElementById('fontVal').textContent = v + 'px';
    editor.style.fontSize = v + 'px';
    localStorage.setItem('tcf_font', v);
}
const savedFont = parseInt(localStorage.getItem('tcf_font') || '15');
editor.style.fontSize = savedFont + 'px';
document.getElementById('fontSlider').value = savedFont;
document.getElementById('fontVal').textContent = savedFont + 'px';

// ============ TIMER ============
function onSlider() { document.getElementById('sliderVal').textContent = document.getElementById('timerSlider').value + ' min'; }
function startTimer() { timerTotal = parseInt(document.getElementById('timerSlider').value) * 60; timerRemain = timerTotal; clearInterval(timerInterval); runTimer(); }
function runTimer() { clearInterval(timerInterval); timerInterval = setInterval(() => { if (timerRemain > 0) { timerRemain--; drawTimer(); } else { clearInterval(timerInterval); alert('⏰ Temps écoulé !'); } }, 1000); }
function pauseTimer() { clearInterval(timerInterval); }
function resumeTimer() { runTimer(); }
function resetTimer() { clearInterval(timerInterval); timerRemain = timerTotal; drawTimer(); }
function drawTimer() { const m = Math.floor(timerRemain / 60), s = timerRemain % 60; document.getElementById('timerDisplay').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
drawTimer();

// ============ PRODUCTIONS ============
function finishProduction() {
    const t = editor.value.trim();
    if (wcOf(t) < 10) { alert('Production trop courte.'); return; }
    pendingProduction = { date: todayStr(), topic: getCurrentTopic(), task: activeTask, text: t, words: wcOf(t), confidence: null };
    document.getElementById('confOverlay').style.display = 'flex';
}
function getCurrentTopic() { return combos.length ? `Tâche ${activeTask} · C${combos[activeCombIdx].num}` : 'Libre'; }
function setConfidence(c) {
    if (pendingProduction) {
        pendingProduction.confidence = c;
        productions.unshift(pendingProduction);
        SV('tcf_productions', productions);
        localStorage.removeItem(draftKey());
        pendingProduction = null;
        refreshBadges();
        buildProductions();
        bumpStreak();
    }
    document.getElementById('confOverlay').style.display = 'none';
}
function buildProductions() {
    const el = document.getElementById('prodList');
    if (!productions.length) { el.innerHTML = '<div class="empty-state">Aucune production.</div>'; return; }
    el.innerHTML = productions.map((p, i) => `<div class="prod-card"><div class="prod-head"><span class="prod-topic">${p.confidence || ''} ${escHtml(p.topic)}</span><span class="del-x" onclick="delProd(${i})">×</span></div><div class="prod-text">${escHtml(p.text)}</div></div>`).join('');
}
function delProd(i) { productions.splice(i, 1); SV('tcf_productions', productions); buildProductions(); refreshBadges(); }

// ============ VOCAB ============
function addVocabWord() {
    const w = document.getElementById('vocabWord').value.trim();
    const d = document.getElementById('vocabDef').value.trim();
    if (!w) return;
    vocabList.push({ word: w, def: d, addedAt: todayStr() });
    SV('tcf_vocab', vocabList);
    document.getElementById('vocabWord').value = '';
    document.getElementById('vocabDef').value = '';
    renderVocabList();
    refreshBadges();
}
function renderVocabList() {
    const el = document.getElementById('vocabList');
    if (!vocabList.length) { el.innerHTML = '<div class="empty-state">Aucun mot.</div>'; return; }
    el.innerHTML = vocabList.map((v, i) => `<div class="list-item"><span><b>${escHtml(v.word)}</b>${v.def ? ' — ' + escHtml(v.def) : ''}</span><span class="del-x" onclick="delVocab(${i})">×</span></div>`).join('');
}
function delVocab(i) { vocabList.splice(i, 1); SV('tcf_vocab', vocabList); renderVocabList(); refreshBadges(); }

// ============ ERRORS ============
function addError() {
    const w = document.getElementById('errWrong').value.trim();
    const r = document.getElementById('errRight').value.trim();
    if (!w) return;
    myErrors.push({ wrong: w, right: r, addedAt: todayStr() });
    SV('tcf_errors', myErrors);
    document.getElementById('errWrong').value = '';
    document.getElementById('errRight').value = '';
    buildErrorsList();
    refreshBadges();
}
function buildErrorsList() {
    const el = document.getElementById('errorsList');
    if (!myErrors.length) { el.innerHTML = '<div class="empty-state">Aucune erreur.</div>'; return; }
    el.innerHTML = myErrors.map((e, i) => `<div class="list-item"><span>❌ ${escHtml(e.wrong)} → ✅ ${escHtml(e.right)}</span><span class="del-x" onclick="delError(${i})">×</span></div>`).join('');
}
function delError(i) { myErrors.splice(i, 1); SV('tcf_errors', myErrors); buildErrorsList(); refreshBadges(); }

// ============ FAV/REV/HIST/STATS ============
function addFav() { const s = getCurrentSujet(); if (s && !favorites.includes(s)) { favorites.push(s); SV('tcf_favorites', favorites); refreshBadges(); } }
function addRevisit() { const s = getCurrentSujet(); if (s && !revisits.includes(s)) { revisits.push(s); SV('tcf_revisits', revisits); refreshBadges(); } }
function getCurrentSujet() { return combos.length ? `T${activeTask} C${combos[activeCombIdx].num}` : ''; }
function buildHistList() { const el = document.getElementById('histList'); if (!history.length) { el.innerHTML = '<div class="empty-state">Aucun historique.</div>'; return; } el.innerHTML = history.slice().reverse().map(h => `<div class="list-item"><span>${h.date} — ${escHtml(h.text)}</span></div>`).join(''); }
function buildStats() { document.getElementById('statProd').textContent = productions.length; document.getElementById('statVocab').textContent = vocabList.length; document.getElementById('statStreak').textContent = streak.cur; }
function saveHistory(t) { history.push({ date: todayStr(), text: t }); if (history.length > 100) history.shift(); SV('tcf_history', history); buildHistList(); refreshBadges(); }
function refreshBadges() {
    document.getElementById('prod-badge').textContent = productions.length;
    document.getElementById('vocab-badge').textContent = vocabList.length;
    document.getElementById('err-badge').textContent = myErrors.length;
    document.getElementById('fav-badge').textContent = favorites.length;
    document.getElementById('rev-badge').textContent = revisits.length;
    document.getElementById('hist-badge').textContent = history.length;
}

// ============ STREAK ============
function bumpStreak() {
    const t = todayStr();
    if (streak.lastDate === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    streak.cur = (streak.lastDate === y) ? streak.cur + 1 : 1;
    streak.best = Math.max(streak.best, streak.cur);
    streak.lastDate = t;
    SV('tcf_streak', streak);
    document.getElementById('streakStrip').textContent = '🔥 Série : ' + streak.cur + ' jour' + (streak.cur > 1 ? 's' : '');
}

// ============ PROFILE ============
function saveProfile() {
    profile = { prenom: document.getElementById('profPrenom').value.trim(), nom: document.getElementById('profNom').value.trim() };
    SV('tcf_profile', profile);
    alert('Profil enregistré !');
}
function loadProfileForm() {
    if (profile.prenom) document.getElementById('profPrenom').value = profile.prenom;
    if (profile.nom) document.getElementById('profNom').value = profile.nom;
}

// ============ BROWSE ============
function buildMonthGrid() {
    document.getElementById('monthGrid').innerHTML = allMonths.map(m => `<div class="month-card" onclick="selectMonth('${m.slug}')">${m.label}</div>`).join('');
}
function selectMonth(s) { document.getElementById('monthSel').value = s; showView('studio'); loadSujets(); }

// ============ EXPORTS ============
function saveAsTXT() { dl(new Blob([editor.value], { type: 'text/plain' }), 'TCF_EE.txt'); }
function saveAsDOC() { if (!window.docx) { alert('Chargement...'); return; } const { Document, Packer, Paragraph } = docx; const doc = new Document({ sections: [{ children: [new Paragraph(editor.value)] }] }); Packer.toBlob(doc).then(blob => dl(blob, 'TCF_EE.docx')); }
function openPDFModal() { document.getElementById('pdfModal').classList.add('active'); }
function closePDFModal() { document.getElementById('pdfModal').classList.remove('active'); }
function exportPDF(mode) { closePDFModal(); const w = window.open('', '_blank'); w.document.write('<html><head><title>TCF Export</title></head><body><pre>' + editor.value + '</pre></body></html>'); w.print(); }
function downloadFullBackup() { dl(new Blob([JSON.stringify({ productions, vocabList, myErrors, favorites, revisits, history, profile }, null, 2)], { type: 'text/plain' }), 'TCF_backup.txt'); }

// ============ ANALYSIS ============
function runAnalysis() {
    const t = editor.value.trim();
    if (!t) { alert('Rien à analyser.'); return; }
    const panel = document.getElementById('analysisPanel');
    panel.classList.add('open');
    const w = wcOf(t);
    const limits = [[60, 120], [120, 150], [0, 180]];
    const [mn, mx] = limits[activeTask - 1];
    document.getElementById('analysisContent').innerHTML = `
        <div class="an-title">📊 Analyse</div>
        <div class="an-item"><strong>${w} mots</strong> — ${w >= mn && w <= mx ? '✅ Dans les limites' : '⚠️ Hors limites (' + mn + '-' + mx + ')'}</div>
        <div class="an-item">💡 Suggestions: relisez votre texte, vérifiez les accords, utilisez des connecteurs variés.</div>
    `;
}

// ============ EXAM MODE ============
function launchExamDay() { if (!combos.length) loadSujets(); document.getElementById('examOverlay').classList.add('active'); document.getElementById('examLaunch').style.display = 'block'; document.getElementById('examShell').style.display = 'none'; }
function closeExamLaunch() { document.getElementById('examOverlay').classList.remove('active'); }
function startExamDay() {
    examCombo = combos[Math.floor(Math.random() * combos.length)];
    examTask = availableTasks(examCombo)[0] || 1;
    examRemain = 3600;
    document.getElementById('examLaunch').style.display = 'none';
    document.getElementById('examShell').style.display = 'block';
    document.getElementById('examComboLabel').textContent = getMonth(activeMonthSlug).label + ' · C' + examCombo.num;
    renderExamTask();
    clearInterval(examInterval);
    examInterval = setInterval(() => { if (examRemain > 0) { examRemain--; document.getElementById('examTimer').textContent = String(Math.floor(examRemain / 60)).padStart(2, '0') + ':' + String(examRemain % 60).padStart(2, '0'); } else { clearInterval(examInterval); alert('⏰ Temps écoulé !'); endExam(); } }, 1000);
}
function renderExamTask() {
    const c = examCombo;
    const taskContent = document.getElementById('examTaskContent');
    if (examTask === 1 && c.t1) taskContent.innerHTML = `<div class="task-label">Tâche 1</div><div class="task-text">${escHtml(c.t1.consigne)}</div>`;
    else if (examTask === 2 && c.t2) taskContent.innerHTML = `<div class="task-label">Tâche 2</div><div class="task-text">${escHtml(c.t2.consigne)}</div>`;
    else if (c.t3) taskContent.innerHTML = `<div class="task-label">Tâche 3 — ${escHtml(c.t3.titre || '')}</div><div class="task-text">${escHtml(c.t3.doc1 || '')}<br><br>${escHtml(c.t3.doc2 || '')}</div>`;
    document.getElementById('examTaskTabs').innerHTML = [1, 2, 3].map(n => `<div class="task-tab" onclick="switchExamTask(${n})">Tâche ${n}</div>`).join('');
}
function switchExamTask(n) { examTask = n; renderExamTask(); document.getElementById('examEditor').value = ''; }
function onExamInput() { }
function endExam() { clearInterval(examInterval); alert('Examen terminé !'); confirmLeaveExam(true); }
function confirmLeaveExam(skip) { clearInterval(examInterval); document.getElementById('examOverlay').classList.remove('active'); }

// ============ CONNECTORS ============
function buildConnList() { document.getElementById('connListArea').innerHTML = '<div class="empty-state">Connecteurs: cependant, donc, en effet, par ailleurs, néanmoins...</div>'; }

// ============ FOCUS MODE ============
function toggleFocusMode() { focusMode = !focusMode; document.body.classList.toggle('focus-mode', focusMode); if (focusMode) editor.focus(); }

// ============ THEME & INIT ============
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('tcf_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); }
if (localStorage.getItem('tcf_theme') === 'dark') document.body.classList.add('dark');

function toggleMobileSidebar() {
    document.querySelector('.sidebar').classList.toggle('mobile-open');
    document.getElementById('sidebarOverlay').classList.toggle('mobile-open');
}
function closeMobileSidebar() {
    document.querySelector('.sidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('mobile-open');
}

// Initialize everything
populateMonthSelect();
refreshBadges();
loadProfileForm();

// Set interval for autosave
setInterval(() => { if (editor.value.trim()) saveDraft(); }, 30000);
