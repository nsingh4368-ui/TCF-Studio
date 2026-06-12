// TCF EE Studio X - Complete Application Logic
// All data persists in localStorage (survives PC restarts)

/* ============ UTILITIES ============ */
function escHtml(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function dl(b, n) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = n; a.click(); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function LS(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }
function SV(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function wcOf(t) { return t.trim() ? t.trim().split(/\s+/).length : 0; }

function copyGptPrompt(btnEl, boxId) {
    const txt = document.getElementById(boxId).textContent;
    navigator.clipboard.writeText(txt).then(() => {
        const orig = btnEl.textContent;
        btnEl.textContent = '✅ Copié !';
        btnEl.style.background = '#16a34a';
        setTimeout(() => { btnEl.textContent = orig; btnEl.style.background = ''; }, 2000);
    }).catch(() => { alert('Sélectionnez le texte du prompt et copiez manuellement (Ctrl+C).'); });
}

/* ============ MONTHS + SUJETS BANK ============ */
const allMonths = [
    { slug: 'juin-2026', label: 'Juin 2026' },
    { slug: 'mai-2026', label: 'Mai 2026' },
    { slug: 'avril-2026', label: 'Avril 2026' }
];

const DEFAULT_SUBJECT_BANK = {
    "juin-2026": [
        {
            num: 1, t1: { consigne: "Vous avez vu une annonce en ligne offrant de l'aide aux personnes qui veulent apprendre le français... (60 mots minimum/120 mots maximum)" },
            t2: { consigne: "Vous avez assisté à une fête de famille. Vous envoyez un message à vos amis pour leur parler de cette fête et expliquer ce que vous avez préféré. (120 mots minimum/150 mots maximum)" },
            t3: { titre: "Villes sans voitures : avantages et précautions", doc1: "En raison de la pollution importante...", doc2: "Beaucoup de villes lancent des projets..." }
        }
    ],
    "mai-2026": [],
    "avril-2026": []
};

function mergeBanks(b, s) {
    const m = {};
    Object.keys(b || {}).forEach(k => { m[k] = (b[k] || []).map(c => ({ ...c })); });
    Object.keys(s || {}).forEach(k => {
        m[k] = m[k] || [];
        (s[k] || []).forEach(i => {
            const x = m[k].findIndex(c => String(c.num) === String(i.num));
            if (x >= 0) m[k][x] = i;
            else m[k].push(i);
        });
        m[k].sort((a, b) => (a.num || 0) - (b.num || 0));
    });
    return m;
}

let customBank = mergeBanks(DEFAULT_SUBJECT_BANK, LS('tcf_custom_bank', {}));
let favorites = LS('tcf_favorites', []);
let revisits = LS('tcf_revisits', []);
let history = LS('tcf_history', []);
let productions = LS('tcf_productions', []);
let vocabList = LS('tcf_vocab', []);
let savedSentences = LS('tcf_sentences', []);
let myErrors = LS('tcf_errors', []);
let srs = LS('tcf_srs', {});
let srsV = LS('tcf_srs_vocab', {});
let streak = LS('tcf_streak', { lastDate: '', cur: 0, best: 0, days: [] });
let profile = LS('tcf_profile', {});
let doneCombos = LS('tcf_done_combos', {});
let examAnswers = LS('tcf_exam_answers', { 1: '', 2: '', 3: '' });
let presetAnswers = LS('tcf_presets', []);
let customConns = LS('tcf_custom_conns', []);
let readingDocs = LS('tcf_reading_docs', []);
let activeReadingDoc = 0;
let combos = [], activeCombIdx = 0, activeTask = 1, activeMonthSlug = '', focusMode = false, pendingProduction = null;

/* ============ CONNECTORS DATABASE ============ */
const CONNECTORS = [
    ["Opposition / Concession", [["cependant", "however"], ["pourtant", "yet"], ["néanmoins", "nevertheless"], ["toutefois", "however"], ["en revanche", "on the other hand"], ["par contre", "on the other hand"], ["malgré", "despite"], ["bien que", "although (+subj.)"], ["même si", "even if"], ["quoique", "although (+subj.)"], ["certes", "admittedly"], ["au contraire", "on the contrary"], ["à l'inverse", "conversely"], ["tandis que", "whereas"], ["alors que", "while"], ["en dépit de", "in spite of"], ["au lieu de", "instead of"]]],
    ["Addition", [["de plus", "moreover"], ["en outre", "furthermore"], ["par ailleurs", "besides"], ["également", "also"], ["d'ailleurs", "besides"], ["d'une part", "on the one hand"], ["d'autre part", "on the other hand"], ["non seulement… mais aussi", "not only… but also"], ["aussi", "also"], ["de même", "likewise"]]],
    ["Cause", [["car", "because"], ["parce que", "because"], ["puisque", "since"], ["comme", "as"], ["en raison de", "due to"], ["à cause de", "because of"], ["grâce à", "thanks to"], ["étant donné que", "given that"], ["vu que", "seeing that"], ["faute de", "for lack of"], ["du fait de", "owing to"]]],
    ["Conséquence", [["donc", "therefore"], ["par conséquent", "consequently"], ["ainsi", "thus"], ["c'est pourquoi", "that's why"], ["de ce fait", "as a result"], ["alors", "so"], ["si bien que", "so that"], ["en conséquence", "accordingly"], ["d'où", "hence"], ["du coup", "as a result (fam.)"]]],
    ["But", [["afin de", "in order to"], ["pour que", "so that (+subj.)"], ["de façon à", "so as to"], ["dans le but de", "with the aim of"], ["de manière à", "in such a way as to"], ["en vue de", "with a view to"]]],
    ["Condition", [["à condition que", "provided that"], ["pourvu que", "provided that"], ["à moins que", "unless"], ["en cas de", "in case of"], ["si jamais", "if ever"], ["au cas où", "in case"]]],
    ["Organisation", [["d'abord", "first"], ["tout d'abord", "first of all"], ["ensuite", "then"], ["puis", "then"], ["enfin", "finally"], ["premièrement", "firstly"], ["deuxièmement", "secondly"], ["en premier lieu", "in the first place"], ["en dernier lieu", "lastly"], ["finalement", "in the end"]]],
    ["Conclusion", [["en conclusion", "in conclusion"], ["pour conclure", "to conclude"], ["en résumé", "in summary"], ["en somme", "in short"], ["bref", "in short"], ["dans l'ensemble", "overall"], ["en définitive", "ultimately"], ["tout compte fait", "all considered"]]],
    ["Reformulation / Exemple", [["autrement dit", "in other words"], ["c'est-à-dire", "that is"], ["par exemple", "for example"], ["notamment", "notably"], ["en particulier", "in particular"], ["surtout", "especially"], ["en fait", "in fact"], ["en réalité", "in reality"], ["à vrai dire", "to tell the truth"], ["en d'autres termes", "in other terms"]]],
    ["Opinion", [["à mon avis", "in my opinion"], ["selon moi", "according to me"], ["d'après moi", "in my view"], ["il me semble que", "it seems to me"], ["je suis convaincu(e) que", "I am convinced"], ["il est évident que", "it is obvious"], ["on peut considérer que", "one can consider"], ["certains estiment que", "some believe"], ["il est probable que", "it is likely"], ["sans doute", "probably"]]],
    ["Temps / Cadre", [["de nos jours", "nowadays"], ["actuellement", "currently"], ["autrefois", "formerly"], ["désormais", "from now on"], ["à l'avenir", "in the future"], ["en ce qui concerne", "regarding"], ["quant à", "as for"], ["au sujet de", "concerning"], ["en général", "in general"], ["la plupart du temps", "most of the time"], ["dès que", "as soon as"], ["pendant que", "while"]]]
];

let ALL_CONN = CONNECTORS.flatMap(([cat, l]) => l.map(([w, g]) => ({ w, g, cat })));
let ALL_CONN_WORDS = ALL_CONN.map(c => c.w);

/* ============ ANALYSIS CONSTANTS ============ */
const STOPS = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'en', 'il', 'elle', 'je', 'tu', 'vous', 'nous', 'on', 'que', 'qui', 'à', 'au', 'aux', 'ce', 'se', 'sa', 'son', 'ses', 'leur', 'leurs', 'y', 'ne', 'pas', 'plus', 'mais', 'ou', 'donc', 'or', 'ni', 'car', 'par', 'sur', 'dans', 'avec', 'pour', 'si', 'tout', 'cette', 'cet', 'ces', 'mon', 'ma', 'mes', 'votre', 'vos', 'notre', 'nos', 'lui', 'eux', 'elles', 'ils', 'me', 'te', 'où', 'dont', 'être', 'avoir', 'sont', 'ont', 'était', 'sera']);
const NUANCE = ['cependant', 'pourtant', 'toutefois', 'néanmoins', 'même si', 'malgré', 'bien que', 'en revanche', 'certes', 'quoique', 'en dépit de'];
const OPINION_EXPR = ['à mon avis', 'je pense que', 'selon moi', 'd\'après moi', 'je crois que', 'il faut', 'c\'est important'];
const OPINION_ALTS = ['Il me semble que…', 'On peut considérer que…', 'Certains estiment que…', 'Je suis convaincu(e) que…', 'Il est évident que…'];
const OVERUSED_WORDS = ['important', 'problème', 'solution', 'avantage', 'beaucoup', 'très', 'bien', 'vraiment', 'chose', 'faire', 'bon', 'mauvais', 'grand', 'petit'];
const WORD_ALTS = { important: 'essentiel, majeur, crucial', problème: 'difficulté, défi, enjeu', solution: 'mesure, réponse, remède', avantage: 'bénéfice, atout, intérêt', beaucoup: 'de nombreux, une multitude de', très: 'extrêmement, particulièrement', bien: 'correctement, efficacement', vraiment: 'véritablement, réellement', chose: 'élément, aspect, phénomène', faire: 'réaliser, effectuer, accomplir', bon: 'bénéfique, favorable', mauvais: 'néfaste, nuisible', grand: 'considérable, majeur', petit: 'limité, modeste' };
const CONSEQ = ['donc', 'par conséquent', 'ainsi', 'c\'est pourquoi', 'de ce fait', 'en conséquence'];
const CONCL_M = ['en conclusion', 'pour conclure', 'en somme', 'en résumé', 'bref', 'en définitive', 'finalement'];
const ARG_M = ['d\'une part', 'd\'autre part', 'premièrement', 'deuxièmement', 'de plus', 'en outre', 'ensuite', 'par ailleurs', 'tout d\'abord'];
const TCF_THEMES = ['Travail', 'Éducation', 'Environnement', 'Technologie', 'Santé', 'Société', 'Voyage', 'Logement', 'Alimentation', 'Culture', 'Autre'];
const B2_VOCAB = [["enjeu", "issue, stake"], ["défi", "challenge"], ["atout", "asset"], ["essentiel", "essential"], ["majeur", "major"], ["considérable", "considerable"], ["bénéfique", "beneficial"], ["néfaste", "harmful"], ["susciter", "to arouse"], ["engendrer", "to cause"], ["favoriser", "to promote"], ["nuire à", "to harm"], ["constater", "to observe"], ["envisager", "to consider"], ["privilégier", "to favour"], ["renforcer", "to strengthen"], ["contribuer à", "to contribute"], ["entraîner", "to lead to"], ["démontrer", "to demonstrate"], ["aborder", "to tackle"], ["s'épanouir", "to flourish"], ["équilibre", "balance"], ["comportement", "behaviour"], ["consommation", "consumption"], ["mesure", "measure"], ["autonomie", "autonomy"], ["responsabilité", "responsibility"], ["dépendance", "addiction"], ["sensibiliser", "to raise awareness"], ["précarité", "insecurity"], ["mixité sociale", "social diversity"], ["durable", "sustainable"], ["accroître", "to increase"], ["diminuer", "to decrease"], ["remettre en question", "to question"], ["faire face à", "to face"], ["mettre en place", "to implement"], ["tenir compte de", "to take into account"], ["soutenir", "to support"], ["désormais", "from now on"]];

/* ============ VIEWS ============ */
const views = ['studio', 'browse', 'productions', 'connectors', 'vocab', 'errors', 'reading', 'listening', 'reading_mock', 'favorites', 'revisit', 'history', 'stats', 'profile'];

function showView(v) {
    closeMobileSidebar();
    views.forEach(x => {
        const e = document.getElementById('view-' + x);
        if (e) e.style.display = (x === v ? '' : 'none');
        const n = document.getElementById('nav-' + x);
        if (n) n.classList.toggle('active', x === v);
    });
    const dock = document.querySelector('.accent-dock');
    if (dock && !document.body.classList.contains('exam-active')) {
        dock.style.display = (v === 'studio' || v === 'browse' || v === 'vocab' || v === 'errors' || v === 'connectors') ? 'flex' : 'none';
    }
    if (v === 'browse') buildMonthGrid();
    if (v === 'productions') buildProductions();
    if (v === 'connectors') { buildSRS(); buildConnList(); }
    if (v === 'vocab') { renderVocabList(); renderSentenceChips(); renderSavedSentences(); renderThemeBalance(); initVocabExercise(); }
    if (v === 'errors') buildErrorsList();
    if (v === 'favorites') buildFavList();
    if (v === 'revisit') buildRevList();
    if (v === 'history') buildHistList();
    if (v === 'stats') buildStats();
    if (v === 'profile') { loadProfileForm(); buildReport(); }
}

function switchVocabTab(t) {
    ['list', 'flash', 'sent', 'b2', 'exercise', 'presets'].forEach(x => {
        const el = document.getElementById('vtab-' + x), tab = document.getElementById('vtab-b-' + x);
        if (el) el.classList.toggle('active', x === t);
        if (tab) tab.classList.toggle('active', x === t);
    });
    if (t === 'flash') renderFlashcards();
    if (t === 'b2') buildSRSV();
    if (t === 'presets') renderPresetsList();
}

function switchConnTab(t) {
    ['review', 'list', 'import'].forEach(x => {
        const b = document.getElementById('ctab-b-' + x);
        const p = document.getElementById('ctab-' + x);
        if (b) b.classList.toggle('active', x === t);
        if (p) p.classList.toggle('active', x === t);
    });
    if (t === 'review') buildSRS();
    if (t === 'list') buildConnList();
    if (t === 'import') renderCustomConnList();
}

/* ============ SUJETS ============ */
function populateMonthSelect() {
    document.getElementById('monthSel').innerHTML = allMonths.map(m => `<option value="${m.slug}">${m.label}</option>`).join('');
    document.getElementById('bankMonth').innerHTML = allMonths.map(m => `<option value="${m.slug}">${m.label}</option>`).join('');
}

function getMonth(s) { return allMonths.find(m => m.slug === s) || allMonths[0]; }

function availableTasks(c) { return [c.t1 && c.t1.consigne ? 1 : 0, c.t2 && c.t2.consigne ? 2 : 0, (c.t3 && (c.t3.doc1 || c.t3.doc2)) ? 3 : 0].filter(Boolean); }

function loadSujets() {
    const s = document.getElementById('monthSel').value;
    activeMonthSlug = s;
    combos = (customBank[s] || []).map((c, i) => ({ ...c, num: c.num || i + 1 }));
    if (!combos.length) {
        document.getElementById('sujetContent').style.display = 'none';
        document.getElementById('sujetEmpty').style.display = 'block';
        document.getElementById('comboBadge').textContent = '—';
        document.getElementById('sujetEmpty').innerHTML = `Aucun sujet pour <strong>${escHtml(getMonth(s).label)}</strong>.`;
        setFocus(false);
        return;
    }
    document.getElementById('sujetEmpty').style.display = 'none';
    document.getElementById('sujetContent').style.display = 'block';
    activeCombIdx = 0;
    const av = availableTasks(combos[0]);
    activeTask = av.includes(parseInt(document.getElementById('taskActive').value)) ? parseInt(document.getElementById('taskActive').value) : (av[0] || 1);
    renderSujet();
    loadDraft();
    updateFocusBar();
    saveHistory('Sujets chargés : ' + getMonth(s).label + ' (' + combos.length + ')');
}

function onMonthChange() {
    setFocus(false);
    combos = [];
    document.getElementById('sujetContent').style.display = 'none';
    document.getElementById('sujetEmpty').style.display = 'block';
    document.getElementById('comboBadge').textContent = '—';
    document.getElementById('sujetEmpty').innerHTML = 'Cliquez <strong>Charger dans le studio</strong> pour ' + escHtml(getMonth(document.getElementById('monthSel').value).label) + '.';
}

function renderSujet() {
    if (!combos.length) return;
    const c = combos[activeCombIdx];
    const av = availableTasks(c);
    if (!av.includes(activeTask)) activeTask = av[0] || 1;
    document.getElementById('comboBadge').textContent = 'Combinaison ' + c.num;
    document.getElementById('comboList').innerHTML = combos.map((cc, i) => `<button class="combo-pill ${i === activeCombIdx ? 'active' : ''} ${doneCombos[activeMonthSlug + ':' + cc.num] ? 'done' : ''}" onclick="selectCombo(${i})">${doneCombos[activeMonthSlug + ':' + cc.num] ? '✓' : '○'} Combinaison ${cc.num}</button>`).join('');
    document.getElementById('taskTabs').innerHTML = [1, 2, 3].map(n => `<div class="task-tab ${activeTask === n ? 'active' : ''}" onclick="switchTask(${n})">Tâche ${n}</div>`).join('') + `<div style="margin-left:auto;display:flex;gap:6px;align-items:center"><button class="combo-pill" onclick="prevCombo()">‹</button><span class="muted">${activeCombIdx + 1}/${combos.length}</span><button class="combo-pill" onclick="nextCombo()">›</button><button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,#16a34a,#15803d);padding:8px 16px;font-size:13px" onclick="startSujet()">🚀 Commencer</button></div>`;
    renderTaskContent(c, document.getElementById('taskContent'), activeTask);
    document.getElementById('doneToggle').checked = !!doneCombos[activeMonthSlug + ':' + c.num];
    document.getElementById('editorTaskLabel').textContent = '(Tâche ' + activeTask + ')';
    updateFocusBar();
    updateWordCounter();
}

function renderTaskContent(c, el, task) {
    if (task === 1 && c.t1) el.innerHTML = `<div class="task-label">Tâche 1</div><div class="task-text">${escHtml(c.t1.consigne)}</div><div class="task-limit">60 mots min. / 120 mots max.</div>`;
    else if (task === 2 && c.t2) el.innerHTML = `<div class="task-label">Tâche 2</div><div class="task-text">${escHtml(c.t2.consigne)}</div><div class="task-limit">120 mots min. / 150 mots max.</div>`;
    else if (c.t3) el.innerHTML = `<div class="task-label">Tâche 3 — ${escHtml(c.t3.titre || '')}</div><div class="doc-block"><div class="doc-title">Document 1</div><div class="task-text">${escHtml(c.t3.doc1 || '')}</div></div><div class="doc-block"><div class="doc-title">Document 2</div><div class="task-text">${escHtml(c.t3.doc2 || '')}</div></div><div class="task-limit">180 mots maximum</div>`;
    else el.innerHTML = '<div class="muted">Tâche non disponible.</div>';
}

function selectCombo(i) { activeCombIdx = i; activeTask = 1; document.getElementById('taskActive').value = '1'; renderSujet(); loadDraft(); unfreezeSession(); saveHistory('👁 Combo ' + combos[i].num + ' prévisualisé'); }
function prevCombo() { activeCombIdx = Math.max(0, activeCombIdx - 1); renderSujet(); }
function nextCombo() { activeCombIdx = Math.min(combos.length - 1, activeCombIdx + 1); renderSujet(); }

function randomCombo() {
    if (!combos.length) { loadSujets(); return; }
    activeCombIdx = Math.floor(Math.random() * combos.length);
    const av = availableTasks(combos[activeCombIdx]);
    activeTask = av[Math.floor(Math.random() * av.length)] || 1;
    document.getElementById('taskActive').value = String(activeTask);
    renderSujet();
    loadDraft();
}

function toggleDone(ck) {
    if (!combos.length) return;
    const k = activeMonthSlug + ':' + combos[activeCombIdx].num;
    if (ck) {
        doneCombos[k] = { date: new Date().toISOString() };
        SV('tcf_done_combos', doneCombos);
        clearInterval(timerInterval);
        setFocus(false);
        const next = combos.findIndex((c, i) => i > activeCombIdx && !doneCombos[activeMonthSlug + ':' + c.num]);
        if (next >= 0) setTimeout(() => selectCombo(next), 400);
        else renderSujet();
    } else {
        delete doneCombos[k];
        SV('tcf_done_combos', doneCombos);
        renderSujet();
    }
}

function getCurrentSujet() {
    if (!combos.length) return '';
    const c = combos[activeCombIdx];
    if (activeTask === 1 && c.t1) return '[T1 — C' + c.num + '] ' + c.t1.consigne;
    if (activeTask === 2 && c.t2) return '[T2 — C' + c.num + '] ' + c.t2.consigne;
    if (c.t3) return '[T3 — C' + c.num + '] ' + c.t3.titre + '\nDoc 1: ' + c.t3.doc1 + '\nDoc 2: ' + c.t3.doc2;
    return '';
}

function getCurrentTopic() {
    if (!combos.length) return 'Libre';
    const c = combos[activeCombIdx];
    return activeTask === 3 ? (c.t3?.titre || 'T3') : 'Tâche ' + activeTask + ' · C' + c.num;
}

function startSujet() {
    const v = parseInt(document.getElementById('timerSlider').value) || 60;
    timerTotal = v * 60;
    timerRemain = timerTotal;
    clearInterval(timerInterval);
    unfreezeSession();
    runTimer();
    setFocus(true);
    editor.focus();
    saveHistory('▶ Sujet démarré : ' + getCurrentTopic() + ' · ' + v + ' min');
}

/* ============ BANQUE ============ */
function buildMonthGrid() {
    document.getElementById('monthGrid').innerHTML = allMonths.map(m => {
        const n = (customBank[m.slug] || []).length;
        return `<div class="month-card" onclick="loadFromBrowse('${m.slug}')"><div style="font-size:10px;color:var(--sub)">${m.label.split(' ')[1]}</div><div style="font-weight:800">${m.label.split(' ')[0]}</div><div style="font-size:10px;font-weight:700;margin-top:4px">${n} sujet${n > 1 ? 's' : ''}</div></div>`;
    }).join('');
    updateBankCount();
}

function loadFromBrowse(s) { document.getElementById('monthSel').value = s; showView('studio'); loadSujets(); }

function saveCustomSujet() {
    const s = document.getElementById('bankMonth').value;
    const t1 = document.getElementById('bankT1').value.trim(), t2 = document.getElementById('bankT2').value.trim(), d1 = document.getElementById('bankDoc1').value.trim(), d2 = document.getElementById('bankDoc2').value.trim();
    if (!t1 && !t2 && !d1 && !d2) { alert('Remplissez au moins une tâche.'); return; }
    const c = {
        num: parseInt(document.getElementById('bankNum').value || '0') || ((customBank[s] || []).length + 1),
        t1: t1 ? { consigne: t1 } : null, t2: t2 ? { consigne: t2 } : null,
        t3: (d1 || d2) ? { titre: document.getElementById('bankTitle').value.trim() || 'Sujet', doc1: d1, doc2: d2 } : null
    };
    customBank[s] = customBank[s] || [];
    const x = customBank[s].findIndex(q => String(q.num) === String(c.num));
    if (x >= 0) customBank[s][x] = c;
    else customBank[s].push(c);
    customBank[s].sort((a, b) => (a.num || 0) - (b.num || 0));
    SV('tcf_custom_bank', customBank);
    ['bankNum', 'bankTitle', 'bankT1', 'bankT2', 'bankDoc1', 'bankDoc2'].forEach(i => document.getElementById(i).value = '');
    buildMonthGrid();
    saveHistory('Sujet ajouté : ' + getMonth(s).label);
}

function updateBankCount() {
    const n = Object.values(customBank).reduce((a, l) => a + l.length, 0);
    const e = document.getElementById('bankCount');
    if (e) e.textContent = n + ' sujet' + (n > 1 ? 's' : '');
}

function practiceCustomDirect() {
    const t1 = document.getElementById('bankT1').value.trim(), t2 = document.getElementById('bankT2').value.trim(), d1 = document.getElementById('bankDoc1').value.trim(), d2 = document.getElementById('bankDoc2').value.trim();
    if (!t1 && !t2 && !d1 && !d2) { alert('Remplissez au moins une tâche pour pratiquer.'); return; }
    const tempCombo = {
        num: 'perso',
        t1: t1 ? { consigne: t1 } : null, t2: t2 ? { consigne: t2 } : null,
        t3: (d1 || d2) ? { titre: document.getElementById('bankTitle').value.trim() || 'Sujet personnalisé', doc1: d1, doc2: d2 } : null
    };
    activeMonthSlug = 'custom-direct';
    combos = [tempCombo];
    activeCombIdx = 0;
    const av = availableTasks(tempCombo);
    activeTask = av[0] || 1;
    document.getElementById('monthSel').value = allMonths[0].slug;
    document.getElementById('sujetEmpty').style.display = 'none';
    document.getElementById('sujetContent').style.display = 'block';
    document.getElementById('comboBadge').textContent = 'Sujet personnalisé';
    renderSujet();
    loadDraft();
    updateFocusBar();
    showView('studio');
    saveHistory('▶ Sujet perso démarré directement');
}

function exportBank() {
    let lines = [];
    Object.entries(customBank).forEach(([month, combos]) => {
        combos.forEach(c => {
            lines.push('MOIS: ' + month);
            lines.push('COMBO: ' + (c.num || 1));
            if (c.t1 && c.t1.consigne) lines.push('T1: ' + c.t1.consigne);
            if (c.t2 && c.t2.consigne) lines.push('T2: ' + c.t2.consigne);
            if (c.t3 && c.t3.titre) lines.push('TITRE: ' + c.t3.titre);
            if (c.t3 && c.t3.doc1) lines.push('DOC1: ' + c.t3.doc1);
            if (c.t3 && c.t3.doc2) lines.push('DOC2: ' + c.t3.doc2);
            lines.push('---');
        });
    });
    dl(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), 'TCF_banque.txt');
}

function importBankTXT() {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.txt';
    i.onchange = () => {
        const f = i.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            try { parseBankTXT(r.result); } catch (e) { alert('Erreur de lecture TXT : ' + e.message); }
        };
        r.readAsText(f);
    };
    i.click();
}

function parseBankTXT(raw) {
    let currentMonth = '';
    let currentCombo = {};
    let added = 0;
    const lines = raw.split(/\r?\n/);
    const flush = () => {
        if (currentMonth && currentCombo.num) {
            customBank[currentMonth] = customBank[currentMonth] || [];
            customBank[currentMonth].push(currentCombo);
            added++;
        }
        currentCombo = {};
    };
    for (let l of lines) {
        const trimmed = l.trim();
        if (!trimmed) continue;
        if (trimmed === '---') { flush(); continue; }
        if (/^MOIS\s*:/i.test(trimmed)) { flush(); currentMonth = trimmed.replace(/^MOIS\s*:\s*/i, '').trim().toLowerCase(); continue; }
        if (/^COMBO\s*:/i.test(trimmed)) { flush(); currentCombo = { num: parseInt(trimmed.replace(/^COMBO\s*:\s*/i, '')) || 1, t1: {}, t2: {}, t3: {} }; continue; }
        if (/^T1\s*:/i.test(trimmed)) { if (!currentCombo.t1) currentCombo.t1 = {}; currentCombo.t1.consigne = trimmed.replace(/^T1\s*:\s*/i, ''); continue; }
        if (/^T2\s*:/i.test(trimmed)) { if (!currentCombo.t2) currentCombo.t2 = {}; currentCombo.t2.consigne = trimmed.replace(/^T2\s*:\s*/i, ''); continue; }
        if (/^TITRE\s*:/i.test(trimmed)) { if (!currentCombo.t3) currentCombo.t3 = {}; currentCombo.t3.titre = trimmed.replace(/^TITRE\s*:\s*/i, ''); continue; }
        if (/^DOC1\s*:/i.test(trimmed)) { if (!currentCombo.t3) currentCombo.t3 = {}; currentCombo.t3.doc1 = trimmed.replace(/^DOC1\s*:\s*/i, ''); continue; }
        if (/^DOC2\s*:/i.test(trimmed)) { if (!currentCombo.t3) currentCombo.t3 = {}; currentCombo.t3.doc2 = trimmed.replace(/^DOC2\s*:\s*/i, ''); continue; }
    }
    flush();
    SV('tcf_custom_bank', customBank);
    buildMonthGrid();
    alert(added + ' combinaison(s) importée(s) avec succès !');
}

/* ============ EDITOR + DRAFTS ============ */
const editor = document.getElementById('editor');

function draftKey(n) {
    if (combos.length && activeMonthSlug) {
        const c = combos[activeCombIdx];
        return 'tcf_draft_' + activeMonthSlug + '_c' + (c.num || activeCombIdx) + '_t' + n;
    }
    return 'tcf_draft_t' + n;
}

function saveDraft() { localStorage.setItem(draftKey(activeTask), editor.value); }
function loadDraft() { editor.value = localStorage.getItem(draftKey(activeTask)) || ''; updateWordCounter(); }
function onEditorInput() { saveDraft(); updateWordCounter(); }

function switchTask(n) {
    saveDraft();
    activeTask = n;
    document.getElementById('taskActive').value = String(n);
    if (combos.length) renderSujet();
    loadDraft();
    updateFocusBar();
}

function focusSwitchTask(n) {
    saveDraft();
    activeTask = n;
    document.getElementById('taskActive').value = String(n);
    loadDraft();
    document.getElementById('editorTaskLabel').textContent = '(Tâche ' + n + ')';
    const dm = document.getElementById('editorFooterDoneMsg');
    if (dm && !isFocusDone(n)) dm.style.display = 'none';
    if (dm && isFocusDone(n)) { dm.textContent = '✅ Tâche ' + n + ' déjà soumise — vous pouvez continuer à écrire ou passer à la suivante.'; dm.style.display = 'block'; }
    updateWordCounter();
    updateFocusBar();
    editor.focus();
}

const savedFont = parseInt(localStorage.getItem('tcf_font') || '15');
editor.style.fontSize = savedFont + 'px';
document.getElementById('fontSlider').value = savedFont;
document.getElementById('fontVal').textContent = savedFont + 'px';

function onFontSlider() {
    const v = document.getElementById('fontSlider').value;
    document.getElementById('fontVal').textContent = v + 'px';
    editor.style.fontSize = v + 'px';
    const ex = document.getElementById('examEditor');
    if (ex) ex.style.fontSize = v + 'px';
    localStorage.setItem('tcf_font', v);
}

function wordCount() { return wcOf(editor.value); }

function updateWordCounter() {
    const w = wordCount();
    const el = document.getElementById('wordCounter');
    const L = [[60, 120], [120, 150], [0, 180]];
    const [mn, mx] = L[(activeTask || 1) - 1];
    let c = '';
    if (w >= mn && w <= mx) c = 'ok';
    else if (w > mx) c = 'over';
    else if (w >= mn - 20) c = 'warn';
    el.textContent = w + ' mots' + (w >= mn && w <= mx ? ' ✓' : '');
    el.className = 'word-counter ' + c;
    const f = document.getElementById('focusWC');
    if (f) f.textContent = w + ' mots';
}

setInterval(() => {
    saveDraft();
    const n = new Date();
    const l = document.getElementById('autosaveLabel');
    if (l) l.textContent = 'Sauvegardé à ' + String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    if (wordCount() >= 50) bumpStreak();
}, 30000);

/* ============ ACCENTS ============ */
const accents = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'ù', 'û', 'ü', 'î', 'ï', 'ô', 'œ', 'æ', 'É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ç', 'Ù', 'Û', 'Î', 'Ï', 'Ô', 'Œ', 'Æ', '«', '»', '—', '’'];
let accentPage = 0, PAGE = 12;

function renderAccentPage() {
    document.getElementById('accentBar').innerHTML = accents.slice(accentPage * PAGE, accentPage * PAGE + PAGE).map(a => `<button onclick="insertAccent('${a === '\u2019' ? '\\u2019' : a}')">${a}</button>`).join('');
}

function nextAccentPage() { accentPage = (accentPage + 1) % Math.ceil(accents.length / PAGE); renderAccentPage(); }
function prevAccentPage() { accentPage = (accentPage - 1 + Math.ceil(accents.length / PAGE)) % Math.ceil(accents.length / PAGE); renderAccentPage(); }

function insertAccent(ch) {
    if (ch === '\\u2019') ch = '’';
    const t = document.getElementById('examOverlay').classList.contains('active') ? document.getElementById('examEditor') : editor;
    const s = t.selectionStart, e = t.selectionEnd;
    t.value = t.value.slice(0, s) + ch + t.value.slice(e);
    t.selectionStart = t.selectionEnd = s + ch.length;
    t.focus();
    if (t === editor) onEditorInput();
    else onExamInput();
}
renderAccentPage();

/* ============ TIMER ============ */
let timerRemain = parseInt(localStorage.getItem('tcf_timer') || '3600'), timerTotal = timerRemain, timerInterval = null;

function onSlider() { document.getElementById('sliderVal').textContent = document.getElementById('timerSlider').value + ' min'; }

function startTimer() { timerTotal = parseInt(document.getElementById('timerSlider').value) * 60; timerRemain = timerTotal; clearInterval(timerInterval); unfreezeSession(); runTimer(); }

function runTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerRemain > 0) { timerRemain--; drawTimer(); }
        else { clearInterval(timerInterval); freezeSession(); }
    }, 1000);
}

function pauseTimer() { clearInterval(timerInterval); document.getElementById('timerSub').textContent = 'En pause'; }
function resumeTimer() { if (timerRemain > 0) runTimer(); }
function resetTimer() { clearInterval(timerInterval); timerRemain = timerTotal; drawTimer(); }

function drawTimer() {
    const m = Math.floor(timerRemain / 60), s = timerRemain % 60;
    const str = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    const d = document.getElementById('timerDisplay');
    d.textContent = str;
    const f = document.getElementById('focusTimer');
    if (f) f.textContent = str;
    const p = timerTotal > 0 ? timerRemain / timerTotal : 1;
    const b = document.getElementById('timerBar');
    b.style.width = (p * 100) + '%';
    d.className = 'timer-display';
    b.style.background = 'var(--accent2)';
    if (p < .25) { d.classList.add('danger'); b.style.background = '#dc2626'; }
    else if (p < .5) { d.classList.add('warning'); b.style.background = '#d97706'; }
    document.getElementById('timerSub').textContent = p > 0 ? Math.round(p * 100) + '% restant' : '⏰ Temps écoulé !';
    localStorage.setItem('tcf_timer', timerRemain);
}

function freezeSession() { document.getElementById('freezeOverlay').style.display = 'flex'; editor.readOnly = true; saveHistory('Temps écoulé · ' + wordCount() + ' mots'); }
function unfreezeSession() { document.getElementById('freezeOverlay').style.display = 'none'; editor.readOnly = false; }
function copyCurrentWork() { navigator.clipboard.writeText('SUJET\n' + getCurrentSujet() + '\n\nRÉPONSE\n' + editor.value).then(() => unfreezeSession()).catch(() => alert('Copie impossible.')); }
drawTimer();

/* ============ EXPORTS ============ */
function getAllTaskTexts() {
    if (!combos.length) return { t1: '', t2: '', t3: '' };
    const c = combos[activeCombIdx];
    const mk = n => 'tcf_draft_' + activeMonthSlug + '_c' + (c.num || activeCombIdx) + '_t' + n;
    localStorage.setItem(mk(activeTask), editor.value);
    return { t1: localStorage.getItem(mk(1)) || '', t2: localStorage.getItem(mk(2)) || '', t3: localStorage.getItem(mk(3)) || '' };
}

function saveAsTXT() {
    const c = combos[activeCombIdx];
    if (!combos.length) { dl(new Blob([editor.value], { type: 'text/plain;charset=utf-8' }), 'TCF_EE.txt'); return; }
    const tx = getAllTaskTexts();
    const combo = c;
    let out = 'TCF EE — ' + getMonth(activeMonthSlug).label + ' · Combinaison ' + combo.num + '\n';
    out += 'Généré le ' + new Date().toLocaleString('fr-FR') + '\n\n';
    if (combo.t1 && combo.t1.consigne) out += '=== TÂCHE 1 (60-120 mots) ===\n' + combo.t1.consigne + '\n\nRÉPONSE :\n' + (tx.t1 || '(vide)') + '\n\n';
    if (combo.t2 && combo.t2.consigne) out += '=== TÂCHE 2 (120-150 mots) ===\n' + combo.t2.consigne + '\n\nRÉPONSE :\n' + (tx.t2 || '(vide)') + '\n\n';
    if (combo.t3) out += '=== TÂCHE 3 (180 mots max.) — ' + (combo.t3.titre || '') + '\n';
    if (combo.t3 && combo.t3.doc1) out += '[Doc 1] ' + combo.t3.doc1 + '\n';
    if (combo.t3 && combo.t3.doc2) out += '[Doc 2] ' + combo.t3.doc2 + '\n';
    out += '\nRÉPONSE :\n' + (tx.t3 || '(vide)') + '\n';
    dl(new Blob([out], { type: 'text/plain;charset=utf-8' }), 'TCF_EE.txt');
}

function makeDocxParagraphs(label, consigne, reponse, limite) {
    const { Paragraph, TextRun, HeadingLevel } = docx;
    const paras = [];
    paras.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(label)] }));
    if (limite) paras.push(new Paragraph({ children: [new TextRun({ text: limite, italics: true, color: '1d4ed8', size: 20 })] }));
    if (consigne) {
        paras.push(new Paragraph({ children: [new TextRun({ text: 'Sujet :', bold: true, size: 22 })] }));
        consigne.split('\n').forEach(l => paras.push(new Paragraph({ children: [new TextRun({ text: l, size: 22 })], spacing: { after: 60 } })));
    }
    paras.push(new Paragraph({ children: [new TextRun({ text: 'Réponse :', bold: true, size: 22 })], spacing: { before: 200 } }));
    if (reponse && reponse.trim()) {
        reponse.split('\n').forEach(l => paras.push(new Paragraph({ children: [new TextRun({ text: l, size: 22 })], spacing: { after: 80 } })));
    } else paras.push(new Paragraph({ children: [new TextRun({ text: '(vide)', color: '94a3b8', italics: true, size: 22 })] }));
    paras.push(new Paragraph({ children: [new TextRun('')], border: { bottom: { style: 'single', size: 4, color: 'e2e8f0', space: 1 } }, spacing: { before: 200, after: 200 } }));
    return paras;
}

function saveAsDOC() {
    if (!window.docx) { alert('Chargement docx en cours, réessayez.'); return; }
    if (!combos.length) { alert('Chargez un sujet d\'abord.'); return; }
    const tx = getAllTaskTexts();
    const combo = combos[activeCombIdx];
    const month = getMonth(activeMonthSlug).label;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    const children = [];
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('TCF Expression Écrite')] }));
    children.push(new Paragraph({ children: [new TextRun({ text: month + ' · Combinaison ' + combo.num + ' · ' + new Date().toLocaleDateString('fr-FR'), color: '64748b', size: 20 })], spacing: { after: 300 } }));
    if (combo.t1 && combo.t1.consigne) children.push(...makeDocxParagraphs('Tâche 1', combo.t1.consigne, tx.t1, '60 mots min. / 120 mots max.'));
    if (combo.t2 && combo.t2.consigne) children.push(...makeDocxParagraphs('Tâche 2', combo.t2.consigne, tx.t2, '120 mots min. / 150 mots max.'));
    if (combo.t3) {
        let consigne3 = '';
        if (combo.t3.doc1) consigne3 += 'Document 1 :\n' + combo.t3.doc1;
        if (combo.t3.doc2) consigne3 += (consigne3 ? '\n\n' : '') + 'Document 2 :\n' + combo.t3.doc2;
        children.push(...makeDocxParagraphs('Tâche 3 — ' + (combo.t3.titre || ''), consigne3, tx.t3, '180 mots maximum'));
    }
    const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
        sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } }, children }]
    });
    Packer.toBlob(doc).then(blob => dl(blob, 'TCF_EE_C' + combo.num + '.docx'));
}

/* ============ FOCUS MODE ============ */
function setFocus(on) { focusMode = !!on && !!combos.length; document.body.classList.toggle('focus-mode', focusMode); updateFocusBar(); }
function toggleFocusMode() { if (!combos.length) { loadSujets(); if (!combos.length) { alert('Chargez un sujet d\'abord.'); return; } } setFocus(!focusMode); if (focusMode) editor.focus(); }
function getFocusTopicLabel() { if (!combos.length) return 'Mode focus'; const c = combos[activeCombIdx]; const month = getMonth(activeMonthSlug || document.getElementById('monthSel').value).label; return month + ' · C' + c.num + ' · Tâche ' + activeTask; }
function getFocusDoneKey(task) { if (!combos.length || !activeMonthSlug) return null; const c = combos[activeCombIdx]; return 'tcf_focus_done_' + activeMonthSlug + '_c' + (c.num || activeCombIdx) + '_t' + task; }
function markFocusDone(task) { const k = getFocusDoneKey(task); if (k) localStorage.setItem(k, '1'); }
function isFocusDone(task) { const k = getFocusDoneKey(task); return k ? !!localStorage.getItem(k) : false; }

function updateFocusBar() {
    const b = document.getElementById('focusToggle');
    if (b) b.classList.toggle('ready', !!combos.length);
    const i = document.getElementById('focusInfo');
    if (i) i.textContent = getFocusTopicLabel();
    const tabs = document.getElementById('focusTaskTabs');
    if (tabs && combos.length) {
        const av = availableTasks(combos[activeCombIdx]);
        tabs.innerHTML = [1, 2, 3].filter(n => av.includes(n)).map(n => `<button class="focus-task-tab${activeTask === n ? ' active' : ''}${isFocusDone(n) ? ' done-tab' : ''}" onclick="focusSwitchTask(${n})">${isFocusDone(n) ? '✓ ' : ''}Tâche ${n}</button>`).join('');
    } else if (tabs) tabs.innerHTML = '';
    const tp = document.getElementById('focusTopics');
    if (tp && combos.length) {
        const c = combos[activeCombIdx];
        let html = '';
        if (activeTask === 1) {
            html = c.t1 && c.t1.consigne ? '<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 1 — 60-120 mots</span>' + escHtml(c.t1.consigne) + '</div>' : '<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 1</span><span style="color:var(--sub)">Non disponible</span></div>';
        } else if (activeTask === 2) {
            html = c.t2 && c.t2.consigne ? '<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 2 — 120-150 mots</span>' + escHtml(c.t2.consigne) + '</div>' : '<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 2</span><span style="color:var(--sub)">Non disponible</span></div>';
        } else {
            let t3html = '<div class="focus-task-block" style="grid-column:1/-1"><span class="ftb-label">Tâche 3 — 180 mots max.' + (c.t3 && c.t3.titre ? ' — ' + escHtml(c.t3.titre) : '') + '</span>';
            if (c.t3 && (c.t3.doc1 || c.t3.doc2)) {
                if (c.t3.doc1) t3html += '<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:800;color:var(--sub)">Document 1</span><br>' + escHtml(c.t3.doc1) + '</div>';
                if (c.t3.doc2) t3html += '<div><span style="font-size:10px;font-weight:800;color:var(--sub)">Document 2</span><br>' + escHtml(c.t3.doc2) + '</div>';
            } else t3html += '<span style="color:var(--sub)">Non disponible</span>';
            t3html += '</div>';
            html = t3html;
        }
        tp.innerHTML = html;
    } else if (tp) tp.innerHTML = '';
}

/* ============ PRODUCTIONS + CONFIDENCE ============ */
function finishProduction() {
    const t = editor.value.trim();
    if (wcOf(t) < 10) { alert('Production trop courte.'); return; }
    pendingProduction = { date: todayStr(), time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), topic: getCurrentTopic(), task: activeTask, month: activeMonthSlug, text: t, words: wcOf(t), confidence: null };
    document.getElementById('confOverlay').style.display = 'flex';
}

function setConfidence(c) {
    if (pendingProduction) {
        pendingProduction.confidence = c;
        productions.unshift(pendingProduction);
        if (productions.length > 500) productions.pop();
        SV('tcf_productions', productions);
        saveHistory('Production : ' + pendingProduction.topic + ' (' + pendingProduction.words + ' mots) ' + c);
        bumpStreak();
        markFocusDone(pendingProduction.task);
        localStorage.removeItem(draftKey(pendingProduction.task));
        const footer = document.getElementById('editorFooterDoneMsg');
        if (footer) { footer.textContent = '✅ Tâche ' + pendingProduction.task + ' soumise (' + pendingProduction.words + ' mots) ' + c; footer.style.display = 'block'; }
        pendingProduction = null;
        refreshBadges();
        updateFocusBar();
        if (focusMode && combos.length) {
            const av = availableTasks(combos[activeCombIdx]);
            const next = av.find(n => n !== activeTask && !isFocusDone(n));
            if (next) setTimeout(() => focusSwitchTask(next), 600);
        }
    }
    document.getElementById('confOverlay').style.display = 'none';
}

function buildProductions() {
    const q = (document.getElementById('prodSearch').value || '').toLowerCase();
    const list = productions.filter(p => !q || p.text.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q));
    const topics = {};
    productions.forEach(p => topics[p.topic] = (topics[p.topic] || 0) + 1);
    const mx = Math.max(1, ...Object.values(topics));
    document.getElementById('topicBalance').innerHTML = Object.keys(topics).length ? Object.entries(topics).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<div class="bar-row"><span class="lbl">${escHtml(t)}</span><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(n / mx * 100)}%"></div></div><b>${n}</b></div>`).join('') : '<div class="empty-state">Aucune production.</div>';
    document.getElementById('confTable').innerHTML = productions.length ? '<table style="width:100%;font-size:12px;border-collapse:collapse">' + productions.slice(0, 30).map(p => `<tr style="border-bottom:1px dashed var(--border)"><td style="padding:5px 4px;color:var(--sub)">${p.date}</td><td style="padding:5px 4px;font-weight:600">${escHtml(p.topic)}</td><td style="padding:5px 4px;font-size:18px;text-align:right">${p.confidence || '—'}</td></tr>`).join('') + '</table>' + confInsight() : '<div class="empty-state">Évaluez votre confiance après chaque production.</div>';
    document.getElementById('prodList').innerHTML = list.length ? list.map((p, idx) => `<div class="prod-card"><div class="prod-head"><span class="prod-topic">${p.confidence || ''} ${escHtml(p.topic)}</span><span class="muted">${p.date} ${p.time || ''} · ${p.words} mots <b class="del-x" onclick="delProd(${productions.indexOf(p)})">×</b></span></div><div class="prod-text" onclick="this.classList.toggle('open')">${escHtml(p.text)}</div></div>`).join('') : '<div class="empty-state">' + (q ? 'Aucun résultat.' : 'Aucune production.') + '</div>';
}

function confInsight() {
    const w = {}, s = {};
    productions.forEach(p => { if (p.confidence === '😬') w[p.topic] = (w[p.topic] || 0) + 1; if (p.confidence === '😎') s[p.topic] = (s[p.topic] || 0) + 1; });
    const W = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    const S = Object.entries(s).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    if (!W.length && !S.length) return '';
    return `<p class="muted" style="margin-top:8px">${S.length ? '😎 Points forts : <b>' + S.join(', ') + '</b>. ' : ''}${W.length ? '😬 Zones de panique : <b>' + W.join(', ') + '</b> — pratiquez-les en priorité.' : ''}</p>`;
}

function delProd(i) { if (confirm('Supprimer ?')) { productions.splice(i, 1); SV('tcf_productions', productions); buildProductions(); refreshBadges(); } }

/* ============ SRS CONNECTEURS ============ */
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30];
let srsQueue = [], srsCur = null;

function buildConnList() {
    document.getElementById('connListArea').innerHTML = CONNECTORS.map(([c, l]) => `<div class="conn-cat">${c}</div>` + l.map(([w, g]) => `<div class="conn-row"><b>${escHtml(w)}</b><span class="muted">${escHtml(g)}</span></div>`).join('')).join('');
}

function buildSRS() {
    const t = todayStr();
    srsQueue = ALL_CONN.map((c, i) => ({ ...c, i })).filter(c => { const e = srs[c.i]; return !e || e.due <= t; });
    const a = document.getElementById('srsArea');
    if (!srsQueue.length) { a.innerHTML = '<div class="empty-state">🎉 Connecteurs à jour ! ' + Object.values(srs).filter(e => e.box >= 4).length + '/100 maîtrisés. Revenez demain.</div>'; return; }
    srsNext();
}
function srsNext() {
    const a = document.getElementById('srsArea');
    if (!srsQueue.length) { buildSRS(); return; }
    srsCur = srsQueue.shift();
    a.innerHTML = `<div class="muted">${srsQueue.length + 1} carte(s) · ${escHtml(srsCur.cat)}</div><div class="flashcard" onclick="this.classList.toggle('flipped')"><div class="flash-inner"><div class="flash-f">${escHtml(srsCur.w)}</div><div class="flash-b"><b>${escHtml(srsCur.g)}</b></div></div></div><div class="srs-actions"><button class="btn btn-ghost" onclick="srsAns(false)">❌ À revoir</button><button class="btn btn-primary" onclick="srsAns(true)">✅ Je connais</button></div>`;
}
function srsAns(k) {
    const e = srs[srsCur.i] || { box: 0 };
    e.box = k ? Math.min(e.box + 1, 5) : 0;
    const d = new Date();
    d.setDate(d.getDate() + SRS_INTERVALS[e.box]);
    e.due = d.toISOString().slice(0, 10);
    srs[srsCur.i] = e;
    SV('tcf_srs', srs);
    srsNext();
}

/* ============ SRS VOCAB B2 ============ */
let srsVQueue = [], srsVCur = null;

function buildSRSV() {
    const t = todayStr();
    srsVQueue = B2_VOCAB.map((v, i) => ({ w: v[0], g: v[1], i })).filter(v => { const e = srsV[v.i]; return !e || e.due <= t; });
    const a = document.getElementById('srsVArea');
    if (!srsVQueue.length) { a.innerHTML = '<div class="empty-state">🎉 Vocab B2 à jour ! ' + Object.values(srsV).filter(e => e.box >= 4).length + '/' + B2_VOCAB.length + ' maîtrisés.</div>'; return; }
    srsVNext();
}
function srsVNext() {
    const a = document.getElementById('srsVArea');
    if (!srsVQueue.length) { buildSRSV(); return; }
    srsVCur = srsVQueue.shift();
    a.innerHTML = `<div class="muted">${srsVQueue.length + 1} carte(s)</div><div class="flashcard" onclick="this.classList.toggle('flipped')"><div class="flash-inner"><div class="flash-f">${escHtml(srsVCur.w)}</div><div class="flash-b">${escHtml(srsVCur.g)}</div></div></div><div class="srs-actions"><button class="btn btn-ghost" onclick="srsVAns(false)">❌ À revoir</button><button class="btn btn-primary" onclick="srsVAns(true)">✅ Je connais</button></div>`;
}
function srsVAns(k) {
    const e = srsV[srsVCur.i] || { box: 0 };
    e.box = k ? Math.min(e.box + 1, 5) : 0;
    const d = new Date();
    d.setDate(d.getDate() + SRS_INTERVALS[e.box]);
    e.due = d.toISOString().slice(0, 10);
    srsV[srsVCur.i] = e;
    SV('tcf_srs_vocab', srsV);
    srsVNext();
}

/* ============ VOCAB + THÈMES ============ */
function addVocabWord() {
    const w = document.getElementById('vocabWord').value.trim(), d = document.getElementById('vocabDef').value.trim();
    const th = document.getElementById('vocabTheme').value || 'Autre';
    if (!w) return;
    vocabList.push({ word: w, def: d, theme: th, addedAt: todayStr() });
    SV('tcf_vocab', vocabList);
    document.getElementById('vocabWord').value = '';
    document.getElementById('vocabDef').value = '';
    renderVocabList();
    renderSentenceChips();
    renderThemeBalance();
    refreshBadges();
}

function autoAddVocab(word, def, theme) {
    if (word && !vocabList.some(v => v.word === word)) {
        vocabList.push({ word, def, theme: theme || 'Autre', auto: true, addedAt: todayStr() });
        SV('tcf_vocab', vocabList);
        refreshBadges();
    }
}

function renderVocabList() {
    const el = document.getElementById('vocabList');
    el.innerHTML = vocabList.length ? [...vocabList].reverse().map((v, ri) => { const i = vocabList.length - 1 - ri; return `<div class="list-item"><div class="list-item-text"><b style="color:var(--accent)">${escHtml(v.word)}</b>${v.def ? ' — <span class="muted">' + escHtml(v.def) + '</span>' : ''} <span class="muted">[${escHtml(v.theme || 'Autre')}${v.auto ? ' · auto' : ''}]</span></div><span class="del-x" onclick="delVocab(${i})">×</span></div>`; }).join('') : '<div class="empty-state">Aucun mot.</div>';
}

function delVocab(i) { vocabList.splice(i, 1); SV('tcf_vocab', vocabList); renderVocabList(); renderSentenceChips(); renderThemeBalance(); refreshBadges(); }

function exportVocabTXT() { dl(new Blob([vocabList.map(v => v.word + (v.def ? ' — ' + v.def : '') + ' [' + (v.theme || 'Autre') + ']').join('\n')], { type: 'text/plain;charset=utf-8' }), 'TCF_vocabulaire.txt'); }

function renderThemeBalance() {
    const el = document.getElementById('vocabThemeBalance');
    if (!el) return;
    const c = {};
    TCF_THEMES.forEach(t => c[t] = 0);
    vocabList.forEach(v => c[v.theme || 'Autre'] = (c[v.theme || 'Autre'] || 0) + 1);
    const mx = Math.max(1, ...Object.values(c));
    el.innerHTML = '<div class="an-title">Vocabulaire par thème TCF</div>' + TCF_THEMES.map(t => `<div class="bar-row"><span class="lbl">${t}</span><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(c[t] / mx * 100)}%"></div></div><b>${c[t]}</b></div>`).join('') + `<p class="muted">💡 Thèmes faibles : <b>${TCF_THEMES.filter(t => c[t] === Math.min(...Object.values(c))).slice(0, 3).join(', ')}</b> — enrichissez-les en priorité.</p>`;
}

let flashIdx = 0;
function renderFlashcards() {
    const el = document.getElementById('flashArea');
    if (!vocabList.length) { el.innerHTML = '<div class="empty-state">Ajoutez des mots d\'abord.</div>'; return; }
    flashIdx = flashIdx % vocabList.length;
    const v = vocabList[flashIdx];
    el.innerHTML = `<div class="muted">${flashIdx + 1}/${vocabList.length}</div><div class="flashcard" onclick="this.classList.toggle('flipped')"><div class="flash-inner"><div class="flash-f">${escHtml(v.word)}</div><div class="flash-b">${escHtml(v.def || '(pas de définition)')}</div></div></div><div class="btn-row"><button class="btn btn-ghost btn-sm" onclick="flashIdx=(flashIdx-1+vocabList.length)%vocabList.length;renderFlashcards()">‹ Précédent</button><button class="btn btn-primary btn-sm" onclick="flashIdx=(flashIdx+1)%vocabList.length;renderFlashcards()">Suivant ›</button></div>`;
}

function renderSentenceChips() {
    const el = document.getElementById('sentenceChips');
    if (el) el.innerHTML = vocabList.length ? vocabList.map(v => `<span class="word-chip" onclick="insertWordInSentence(this.textContent)">${escHtml(v.word)}</span>`).join('') : '<span class="muted">Ajoutez des mots d\'abord.</span>';
}
function insertWordInSentence(w) { const sa = document.getElementById('sentenceArea'); sa.value += (sa.value && !sa.value.endsWith(' ') ? ' ' : '') + w + ' '; sa.focus(); }

function saveSentencePractice() {
    const t = document.getElementById('sentenceArea').value.trim();
    if (!t) return;
    savedSentences.unshift({ text: t, date: new Date().toLocaleDateString('fr-FR') });
    if (savedSentences.length > 50) savedSentences.pop();
    SV('tcf_sentences', savedSentences);
    document.getElementById('sentenceArea').value = '';
    renderSavedSentences();
}
function renderSavedSentences() {
    const el = document.getElementById('savedSentences');
    if (el) el.innerHTML = savedSentences.slice(0, 10).map((s, i) => `<div class="list-item"><div class="list-item-text"><span class="muted">${s.date}</span> — ${escHtml(s.text)}</div><span class="del-x" onclick="savedSentences.splice(${i},1);SV('tcf_sentences',savedSentences);renderSavedSentences()">×</span></div>`).join('');
}

/* ============ ERREURS RECYCLÉES ============ */
function addError() {
    const w = document.getElementById('errWrong').value.trim(), r = document.getElementById('errRight').value.trim();
    if (!w) return;
    myErrors.push({ wrong: w, right: r, addedAt: todayStr() });
    SV('tcf_errors', myErrors);
    document.getElementById('errWrong').value = '';
    document.getElementById('errRight').value = '';
    buildErrorsList();
    renderErrorsPanel();
    refreshBadges();
}
function buildErrorsList() {
    const el = document.getElementById('errorsList');
    el.innerHTML = myErrors.length ? myErrors.map((e, i) => `<div class="list-item"><div class="list-item-text">❌ <b style="color:var(--danger)">${escHtml(e.wrong)}</b>${e.right ? ' → ✅ <b style="color:var(--success)">' + escHtml(e.right) + '</b>' : ''}</div><span class="del-x" onclick="delError(${i})">×</span></div>`).join('') : '<div class="empty-state">Aucune erreur notée.</div>';
}
function delError(i) { myErrors.splice(i, 1); SV('tcf_errors', myErrors); buildErrorsList(); renderErrorsPanel(); refreshBadges(); }

function renderErrorsPanel() {
    const p = document.getElementById('errorsPanel');
    if (!myErrors.length) { p.style.display = 'none'; return; }
    p.style.display = 'block';
    document.getElementById('errorsPanelChips').innerHTML = myErrors.slice(-8).map(e => `<span class="err-chip">❌ ${escHtml(e.wrong)}${e.right ? ' → ✅ ' + escHtml(e.right) : ''}</span>`).join('');
}

/* ============ FAV / REV / HISTORIQUE / STATS ============ */
function addFav() { const s = getCurrentSujet(); if (!s) { alert('Chargez un sujet d\'abord.'); return; } if (!favorites.includes(s)) { favorites.push(s); SV('tcf_favorites', favorites); refreshBadges(); } }
function addRevisit() { const s = getCurrentSujet(); if (!s) { alert('Chargez un sujet d\'abord.'); return; } if (!revisits.includes(s)) { revisits.push(s); SV('tcf_revisits', revisits); refreshBadges(); } }
function buildFavList() { const el = document.getElementById('favList'); el.innerHTML = favorites.length ? favorites.map((f, i) => `<div class="list-item"><div class="list-item-text">${escHtml(f)}</div><span class="del-x" onclick="favorites.splice(${i},1);SV('tcf_favorites',favorites);refreshBadges();buildFavList()">×</span></div>`).join('') : '<div class="empty-state">Aucun favori.</div>'; }
function buildRevList() { const el = document.getElementById('revList'); el.innerHTML = revisits.length ? revisits.map((r, i) => `<div class="list-item"><div class="list-item-text">${escHtml(r)}</div><span class="del-x" onclick="revisits.splice(${i},1);SV('tcf_revisits',revisits);refreshBadges();buildRevList()">×</span></div>`).join('') : '<div class="empty-state">Rien à réviser.</div>'; }
function saveHistory(t) { history.push({ time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), date: todayStr(), text: t }); if (history.length > 300) history = history.slice(-300); SV('tcf_history', history); refreshBadges(); }
function buildHistList() {
    const el = document.getElementById('histList');
    if (!history.length) { el.innerHTML = '<div class="empty-state">Aucun historique.</div>'; return; }
    const g = {};
    [...history].reverse().forEach(h => { (g[h.date || '—'] = g[h.date || '—'] || []).push(h); });
    el.innerHTML = Object.entries(g).map(([d, es]) => `<div class="hist-date-group">${d}</div>` + es.map(h => `<div class="hist-item"><span class="hist-time">${h.time}</span><span>${escHtml(h.text)}</span></div>`).join('')).join('');
}
function buildStats() {
    document.getElementById('statProd').textContent = productions.length;
    document.getElementById('statWords').textContent = productions.reduce((a, p) => a + p.words, 0) + wordCount();
    document.getElementById('statStreak').textContent = streak.cur;
    document.getElementById('statBest').textContent = streak.best;
    document.getElementById('statVocab').textContent = vocabList.length;
    document.getElementById('statConn').textContent = Object.values(srs).filter(e => e.box >= 4).length;
    document.getElementById('statFav').textContent = favorites.length;
    document.getElementById('statHist').textContent = history.length;
}
function refreshBadges() {
    const set = (i, n) => { const e = document.getElementById(i); if (e) e.textContent = n; };
    set('fav-badge', favorites.length);
    set('rev-badge', revisits.length);
    set('hist-badge', history.length);
    set('prod-badge', productions.length);
    set('vocab-badge', vocabList.length);
    set('err-badge', myErrors.length);
    set('read-badge', readingDocs.length);
}

/* ============ STREAK ============ */
function bumpStreak() {
    const t = todayStr();
    if (streak.lastDate === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    streak.cur = (streak.lastDate === y) ? streak.cur + 1 : 1;
    streak.best = Math.max(streak.best, streak.cur);
    streak.lastDate = t;
    streak.days = streak.days || [];
    if (!streak.days.includes(t)) streak.days.push(t);
    SV('tcf_streak', streak);
    renderStreak();
}
function renderStreak() { document.getElementById('streakStrip').textContent = '🔥 Série : ' + streak.cur + ' jour' + (streak.cur > 1 ? 's' : '') + (streak.best > 1 ? ' · Record : ' + streak.best : ''); }

/* ============ PROFIL ============ */
function saveProfile() {
    profile = { prenom: document.getElementById('profPrenom').value.trim(), nom: document.getElementById('profNom').value.trim(), objectif: document.getElementById('profObjectif').value, dateExamen: document.getElementById('profDate').value };
    SV('tcf_profile', profile);
    applyProfile();
    buildReport();
    alert('Profil enregistré, ' + (profile.prenom || 'étudiant') + ' ! (conservé même PC éteint)');
}
function loadProfileForm() {
    if (profile.prenom) document.getElementById('profPrenom').value = profile.prenom;
    if (profile.nom) document.getElementById('profNom').value = profile.nom;
    if (profile.objectif) document.getElementById('profObjectif').value = profile.objectif;
    if (profile.dateExamen) document.getElementById('profDate').value = profile.dateExamen;
}
function applyProfile() {
    const full = ((profile.prenom || '') + ' ' + (profile.nom || '')).trim();
    const bn = document.getElementById('brandName');
    if (full) {
        bn.textContent = full;
        bn.style.display = 'block';
        document.getElementById('profileBanner').style.display = 'flex';
        document.getElementById('profileAvatar').textContent = (profile.prenom || '?')[0].toUpperCase();
        document.getElementById('pbName').textContent = full;
        document.getElementById('pbSub').textContent = 'Objectif ' + (profile.objectif || 'B2') + (profile.dateExamen ? ' · Examen le ' + profile.dateExamen : '');
        document.getElementById('studioGreeting').innerHTML = '<p class="muted" style="margin-bottom:12px">Bonjour <b style="color:var(--accent)">' + escHtml(profile.prenom || full) + '</b> 👋 — objectif <b>' + (profile.objectif || 'B2') + '</b>' + (daysLeft() !== null ? ' · <b>' + daysLeft() + ' jours</b> avant l\'examen' : '') + '</p>';
    } else { bn.style.display = 'none'; document.getElementById('profileBanner').style.display = 'none'; document.getElementById('studioGreeting').innerHTML = ''; }
}
function daysLeft() { if (!profile.dateExamen) return null; return Math.max(0, Math.ceil((new Date(profile.dateExamen) - new Date()) / 864e5)); }

function buildReport() {
    const tot = productions.reduce((a, p) => a + p.words, 0);
    const byTask = [1, 2, 3].map(n => productions.filter(p => p.task === n).length);
    const mT = Math.max(1, ...byTask);
    document.getElementById('reportContent').innerHTML =
        `<div class="bar-row"><span class="lbl">📄 Productions</span><b>${productions.length}</b></div>
        <div class="bar-row"><span class="lbl">📝 Mots rédigés</span><b>${tot}</b></div>
        <div class="bar-row"><span class="lbl">🔥 Série / Record</span><b>${streak.cur} / ${streak.best}</b></div>
        <div class="bar-row"><span class="lbl">📆 Jours actifs</span><b>${(streak.days || []).length}</b></div>
        <div class="bar-row"><span class="lbl">📖 Vocabulaire</span><b>${vocabList.length} mots</b></div>
        <div class="bar-row"><span class="lbl">🔗 Connecteurs maîtrisés</span><b>${Object.values(srs).filter(e => e.box >= 4).length}/100</b></div>
        <div class="bar-row"><span class="lbl">🧠 Vocab B2 maîtrisé</span><b>${Object.values(srsV).filter(e => e.box >= 4).length}/${B2_VOCAB.length}</b></div>
        <div class="bar-row"><span class="lbl">♻️ Erreurs suivies</span><b>${myErrors.length}</b></div>
        <div class="an-title">Pratique par tâche</div>
        ${[1, 2, 3].map(n => `<div class="bar-row"><span class="lbl">Tâche ${n}</span><div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(byTask[n - 1] / mT * 100)}%"></div></div><b>${byTask[n - 1]}</b></div>`).join('')}${confInsight()}`;
}
function exportReport() {
    const full = ((profile.prenom || '') + ' ' + (profile.nom || '')).trim() || 'Étudiant';
    dl(new Blob(['RAPPORT TCF EE STUDIO X\nÉtudiant : ' + full + '\nObjectif : ' + (profile.objectif || 'B2') + '\nDate examen : ' + (profile.dateExamen || '—') + '\nProductions : ' + productions.length + '\nMots rédigés : ' + productions.reduce((a, p) => a + p.words, 0) + '\nSérie : ' + streak.cur + ' (record ' + streak.best + ')\nVocabulaire : ' + vocabList.length + ' mots\nConnecteurs maîtrisés : ' + Object.values(srs).filter(e => e.box >= 4).length + '/100\nErreurs suivies : ' + myErrors.length + '\nGénéré le : ' + new Date().toLocaleString('fr-FR')], { type: 'text/plain;charset=utf-8' }), 'TCF_rapport.txt');
}

/* ============ MODE EXAMEN ============ */
let examRemain = 3600, examInterval = null, examCombo = null, examTask = 1;

function launchExamDay() {
    if (!combos.length) loadSujets();
    if (!combos.length) { const s = Object.keys(customBank).filter(k => (customBank[k] || []).length); if (!s.length) { alert('Aucun sujet.'); return; } activeMonthSlug = s[0]; combos = customBank[activeMonthSlug].map((c, i) => ({ ...c, num: c.num || i + 1 })); }
    document.getElementById('examOverlay').classList.add('active');
    document.getElementById('examLaunch').style.display = 'block';
    document.getElementById('examShell').style.display = 'none';
}
function closeExamLaunch() { document.getElementById('examOverlay').classList.remove('active'); }

function startExamDay() {
    examCombo = combos[Math.floor(Math.random() * combos.length)];
    examTask = availableTasks(examCombo)[0] || 1;
    examRemain = 3600;
    examAnswers = { 1: '', 2: '', 3: '' };
    SV('tcf_exam_answers', examAnswers);
    document.body.classList.add('exam-active');
    document.getElementById('examLaunch').style.display = 'none';
    document.getElementById('examShell').style.display = 'block';
    document.getElementById('examComboLabel').textContent = getMonth(activeMonthSlug).label + ' · Combinaison ' + examCombo.num;
    document.getElementById('examEditor').value = '';
    document.getElementById('examEditor').style.fontSize = (localStorage.getItem('tcf_font') || '15') + 'px';
    renderExamTask();
    clearInterval(examInterval);
    examInterval = setInterval(() => { if (examRemain > 0) { examRemain--; drawExamTimer(); } else { clearInterval(examInterval); alert('⏰ Temps écoulé !'); endExam(); } }, 1000);
    drawExamTimer();
    saveHistory('🎓 Examen démarré · C' + examCombo.num);
}
function drawExamTimer() { const m = Math.floor(examRemain / 60), s = examRemain % 60; const e = document.getElementById('examTimer'); e.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); e.style.color = examRemain < 600 ? '#fecaca' : '#fff'; }
function renderExamTask() {
    const av = availableTasks(examCombo);
    document.getElementById('examTaskTabs').innerHTML = [1, 2, 3].map(n => `<div class="task-tab ${examTask === n ? 'active' : ''} ${av.includes(n) ? '' : 'missing'}" onclick="switchExamTask(${n})">Tâche ${n}${(examAnswers[n] || '').trim() ? ' ✍' : ''}</div>`).join('');
    renderTaskContent(examCombo, document.getElementById('examTaskContent'), examTask);
    document.getElementById('examTaskName').textContent = 'Tâche ' + examTask;
}
function switchExamTask(n) {
    examAnswers[examTask] = document.getElementById('examEditor').value;
    SV('tcf_exam_answers', examAnswers);
    examTask = n;
    renderExamTask();
    document.getElementById('examEditor').value = examAnswers[n] || '';
    onExamInput();
}
function onExamInput() {
    examAnswers[examTask] = document.getElementById('examEditor').value;
    SV('tcf_exam_answers', examAnswers);
    const w = wcOf(document.getElementById('examEditor').value);
    const L = [[60, 120], [120, 150], [0, 180]];
    const [mn, mx] = L[examTask - 1];
    const el = document.getElementById('examWC');
    el.textContent = w + ' mots' + (w >= mn && w <= mx ? ' ✓' : '');
    el.className = 'word-counter ' + (w >= mn && w <= mx ? 'ok' : (w > mx ? 'over' : ''));
}
function endExam() {
    examAnswers[examTask] = document.getElementById('examEditor').value;
    SV('tcf_exam_answers', examAnswers);
    clearInterval(examInterval);
    [1, 2, 3].forEach(n => {
        const t = (examAnswers[n] || '').trim();
        if (wcOf(t) >= 10) {
            productions.unshift({ date: todayStr(), time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), topic: 'Examen T' + n + ' · C' + examCombo.num, task: n, month: activeMonthSlug, text: t, words: wcOf(t), confidence: null, exam: true });
        }
    });
    SV('tcf_productions', productions);
    bumpStreak();
    refreshBadges();
    let html = '<h3 class="h3">🏁 Analyse complète de l\'examen</h3>';
    [1, 2, 3].forEach(n => {
        const t = (examAnswers[n] || '').trim();
        if (t) { html += '<div class="an-title" style="font-size:15px">Tâche ' + n + ' — ' + wcOf(t) + ' mots</div>' + renderAnalysisHTML(analyzeText(t, n)); }
    });
    html += '<div class="btn-row" style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="saveExamTXT()">💾 Tout en TXT</button><button class="btn btn-ghost btn-sm" onclick="saveExamDOC()">📄 Tout en DOC</button><button class="btn btn-primary btn-sm" onclick="confirmLeaveExam(true)">Fermer</button></div>';
    document.getElementById('examTaskContent').innerHTML = html;
    document.getElementById('examEditorCard').style.display = 'none';
    saveHistory('🏁 Examen terminé · ' + [1, 2, 3].map(n => 'T' + n + ':' + wcOf(examAnswers[n] || '')).join(' '));
}
function allExamText() { return [1, 2, 3].map(n => '=== TÂCHE ' + n + ' ===\n' + (examAnswers[n] || '(vide)')).join('\n\n'); }
function saveExamTXT() {
    examAnswers[examTask] = document.getElementById('examEditor').value;
    let out = 'TCF EE — MODE EXAMEN\n' + getMonth(activeMonthSlug).label + ' · Combinaison ' + examCombo.num + '\nGénéré le ' + new Date().toLocaleString('fr-FR') + '\n\n';
    [1, 2, 3].forEach(n => {
        const t = (examAnswers[n] || '').trim();
        const lbl = ['60-120 mots', '120-150 mots', '180 mots max.'][n - 1];
        out += '=== TÂCHE ' + n + ' (' + lbl + ') ===\n' + (t || '(vide)') + '\n\n';
    });
    dl(new Blob([out], { type: 'text/plain;charset=utf-8' }), 'TCF_examen.txt');
}
function saveExamDOC() {
    if (!window.docx) { alert('Chargement docx en cours, réessayez.'); return; }
    examAnswers[examTask] = document.getElementById('examEditor').value;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    const month = getMonth(activeMonthSlug).label;
    const children = [];
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('TCF EE — Mode Examen')] }));
    children.push(new Paragraph({ children: [new TextRun({ text: month + ' · Combinaison ' + examCombo.num + ' · ' + new Date().toLocaleDateString('fr-FR'), color: '64748b', size: 20 })], spacing: { after: 300 } }));
    const limites = ['60 mots min. / 120 mots max.', '120 mots min. / 150 mots max.', '180 mots maximum'];
    [1, 2, 3].forEach(n => {
        const t = (examAnswers[n] || '').trim();
        let consigne = '';
        if (n === 1 && examCombo.t1) consigne = examCombo.t1.consigne || '';
        if (n === 2 && examCombo.t2) consigne = examCombo.t2.consigne || '';
        if (n === 3 && examCombo.t3) { if (examCombo.t3.doc1) consigne += 'Document 1 :\n' + examCombo.t3.doc1; if (examCombo.t3.doc2) consigne += (consigne ? '\n\n' : '') + 'Document 2 :\n' + examCombo.t3.doc2; }
        children.push(...makeDocxParagraphs('Tâche ' + n, consigne, t, limites[n - 1]));
    });
    const doc = new Document({
        styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
        sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } }, children }]
    });
    Packer.toBlob(doc).then(blob => dl(blob, 'TCF_examen_C' + examCombo.num + '.docx'));
}
function confirmLeaveExam(skip) {
    if (!skip) { if (!confirm('⚠️ Vous êtes en MODE EXAMEN. Voulez-vous vraiment quitter ?')) return; if (!confirm('🛑 Confirmation finale : quitter maintenant ?')) return; examAnswers[examTask] = document.getElementById('examEditor').value; SV('tcf_exam_answers', examAnswers); }
    clearInterval(examInterval);
    document.getElementById('examOverlay').classList.remove('active');
    document.getElementById('examEditorCard').style.display = 'block';
    document.body.classList.remove('exam-active');
}

/* ============ THEME + INIT ============ */
function toggleTheme() { document.body.classList.toggle('dark'); localStorage.setItem('tcf_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); }
if (localStorage.getItem('tcf_theme') === 'dark') document.body.classList.add('dark');
document.getElementById('vocabTheme').innerHTML = TCF_THEMES.map(t => `<option value="${t}">Thème : ${t}</option>`).join('');
populateMonthSelect();
onMonthChange();
refreshBadges();
renderStreak();
applyProfile();
renderErrorsPanel();
loadDraft();
(function () { const dock = document.querySelector('.accent-dock'); if (dock) dock.style.display = 'flex'; })();

/* ============ ANALYSIS ============ */
function runAnalysis() {
    const t = editor.value.trim();
    if (!t) { alert('Rédigez d\'abord un texte à analyser.'); return; }
    const panel = document.getElementById('analysisPanel');
    panel.classList.add('open');
    const content = document.getElementById('analysisContent');
    content.innerHTML = `
        <div class="analysis-tabs">
            <button class="analysis-tab active" id="atab-local" onclick="showAnalysisTab('local')">🔍 Analyse locale</button>
            <button class="analysis-tab" id="atab-ai" onclick="showAnalysisTab('ai')">✨ Analyse IA</button>
        </div>
        <div id="analysis-local-pane">${buildLocalAnalysisHTML(t)}</div>
        <div id="analysis-ai-pane" style="display:none">
            <div class="ai-analysis-loading"><div class="ai-spinner"></div>Cliquez « Lancer l'analyse IA » pour une analyse approfondie par Claude.</div>
            <button class="btn btn-primary" style="margin-top:10px;width:auto;padding:9px 18px" onclick="runAIAnalysis()">✨ Lancer l'analyse IA</button>
        </div>`;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showAnalysisTab(tab) {
    document.getElementById('atab-local').classList.toggle('active', tab === 'local');
    document.getElementById('atab-ai').classList.toggle('active', tab === 'ai');
    document.getElementById('analysis-local-pane').style.display = tab === 'local' ? 'block' : 'none';
    document.getElementById('analysis-ai-pane').style.display = tab === 'ai' ? 'block' : 'none';
}

function buildLocalAnalysisHTML(t) {
    const an = analyzeText(t, activeTask || 1);
    return renderLocalAnalysis(an);
}

function analyzeText(t, taskNum) {
    const words = t.trim().split(/\s+/);
    const wc = words.length;
    const sentences = t.split(/[.!?]+/).filter(s => s.trim().length > 2);
    const avgSentLen = sentences.length ? Math.round(wc / sentences.length) : 0;
    const tLow = t.toLowerCase();
    const connsFound = ALL_CONN_WORDS.filter(c => tLow.includes(c));
    const nuanceFound = NUANCE.filter(c => tLow.includes(c));
    const opinionFound = OPINION_EXPR.filter(c => tLow.includes(c));
    const conseqFound = CONSEQ.filter(c => tLow.includes(c));
    const conclFound = CONCL_M.filter(c => tLow.includes(c));
    const argFound = ARG_M.filter(c => tLow.includes(c));
    const overused = OVERUSED_WORDS.filter(w => { const re = new RegExp('\\b' + w + '\\b', 'gi'); return (t.match(re) || []).length >= 2; });
    const b2Found = B2_VOCAB.filter(([w]) => tLow.includes(w)).map(([w]) => w);
    const limits = [[60, 120], [120, 150], [0, 180]];
    const [mn, mx] = limits[(taskNum || 1) - 1];
    const wcOk = taskNum === 3 ? wc <= mx : wc >= mn && wc <= mx;
    const richScore = Math.min(100, Math.round((connsFound.length / 8) * 60 + (b2Found.length / 5) * 40));
    const structScore = Math.min(100, Math.round((argFound.length >= 1 ? 30 : 0) + (conclFound.length >= 1 ? 30 : 0) + (nuanceFound.length >= 1 ? 20 : 0) + (sentences.length >= 3 ? 20 : 0)));
    const varScore = Math.min(100, Math.round(100 - overused.length * 15));
    const opinionScore = Math.min(100, opinionFound.length >= 1 ? 80 + (nuanceFound.length >= 1 ? 20 : 0) : 0);
    return { wc, wcOk, mn, mx, avgSentLen, connsFound, nuanceFound, opinionFound, conseqFound, conclFound, argFound, overused, b2Found, richScore, structScore, varScore, opinionScore, taskNum };
}

function scoreClass(s) { return s >= 80 ? 'great' : s >= 60 ? 'ok' : s >= 40 ? 'warn' : 'bad'; }

function renderLocalAnalysis(a) {
    let h = '';
    h += `<div class="theme-score-grid">
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.richScore)}">${a.richScore}</div><div class="theme-score-label">Richesse lexicale</div></div>
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.structScore)}">${a.structScore}</div><div class="theme-score-label">Structure</div></div>
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.varScore)}">${a.varScore}</div><div class="theme-score-label">Variété vocab.</div></div>
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.opinionScore)}">${a.opinionScore}</div><div class="theme-score-label">Expression opinion</div></div>
    </div>`;
    const wcColor = a.wcOk ? 'var(--success)' : a.wc > a.mx ? 'var(--danger)' : 'var(--warn)';
    h += `<div class="an-title">📊 Compte de mots</div>
        <div class="an-item"><span class="an-badge" style="color:${wcColor}">⬤</span><div class="an-text"><strong>${a.wc} mots</strong><span>${a.wcOk ? '✅ Dans les limites (' + a.mn + '-' + a.mx + ')' : '⚠️ Objectif : ' + a.mn + '–' + a.mx + ' mots'} · ${a.avgSentLen} mots/phrase en moyenne</span></div></div>`;
    h += `<div class="an-title">🔗 Connecteurs utilisés (${a.connsFound.length})</div>`;
    if (a.connsFound.length) { h += `<div style="margin-bottom:8px">${a.connsFound.slice(0, 15).map(c => `<span class="word-chip">${escHtml(c)}</span>`).join('')}</div>`; }
    else { h += `<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>Aucun connecteur B2 détecté</strong><span>Essayez : cependant, de plus, par conséquent, en outre…</span></div></div>`; }
    h += `<div class="an-title">🏗️ Structure argumentative</div>`;
    const structItems = [
        { found: a.argFound.length > 0, label: 'Marqueurs d\'organisation', ex: a.argFound.join(', '), alt: 'd\'abord, ensuite, enfin' },
        { found: a.nuanceFound.length > 0, label: 'Nuance / concession', ex: a.nuanceFound.join(', '), alt: 'cependant, néanmoins, bien que' },
        { found: a.conseqFound.length > 0, label: 'Conséquence', ex: a.conseqFound.join(', '), alt: 'donc, par conséquent, ainsi' },
        { found: a.conclFound.length > 0, label: 'Conclusion', ex: a.conclFound.join(', '), alt: 'en conclusion, pour conclure, bref' },
        { found: a.opinionFound.length > 0, label: 'Expression d\'opinion', ex: a.opinionFound.join(', '), alt: 'à mon avis, selon moi, il me semble que' }
    ];
    structItems.forEach(s => { h += `<div class="an-item"><span class="an-badge">${s.found ? '✅' : '❌'}</span><div class="an-text"><strong>${s.label}</strong><span>${s.found ? s.ex : 'Absent — suggestion : ' + s.alt}</span></div></div>`; });
    if (a.b2Found.length) { h += `<div class="an-title">🌟 Vocabulaire B2 détecté</div><div style="margin-bottom:8px">${a.b2Found.map(w => `<span class="word-chip" style="background:var(--success)">${escHtml(w)}</span>`).join('')}</div>`; }
    if (a.overused.length) {
        h += `<div class="an-title">🔄 Mots trop répétés</div>`;
        a.overused.forEach(w => { h += `<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>${escHtml(w)}</strong><span>Alternatives B2 : ${escHtml(WORD_ALTS[w] || '—')}</span></div></div>`; });
    }
    if (a.opinionFound.length === 0 && a.taskNum === 3) {
        h += `<div class="an-title">💡 Expressions d'opinion à utiliser</div><div style="margin-bottom:8px">${OPINION_ALTS.map(o => `<span class="word-chip" style="background:#7c3aed;cursor:default">${escHtml(o)}</span>`).join('')}</div>`;
    }
    return h;
}

function renderAnalysisHTML(a) {
    let h = '';
    h += `<div class="stats-grid" style="margin-bottom:8px">
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.richScore)}">${a.richScore}</div><div class="theme-score-label">Richesse lexicale</div></div>
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.structScore)}">${a.structScore}</div><div class="theme-score-label">Structure</div></div>
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.varScore)}">${a.varScore}</div><div class="theme-score-label">Variété vocab.</div></div>
        <div class="theme-score-card"><div class="theme-score-val ${scoreClass(a.opinionScore)}">${a.opinionScore}</div><div class="theme-score-label">Expression opinion</div></div>
    </div>`;
    h += `<div class="an-item"><strong>📊 ${a.wc} mots</strong> ${a.wcOk ? '✅' : '⚠️'} Objectif : ${a.mn}-${a.mx} mots</div>`;
    if (a.connsFound.length) h += `<div class="an-item"><strong>🔗 Connecteurs utilisés</strong> : ${a.connsFound.slice(0, 8).join(', ')}</div>`;
    if (a.b2Found.length) h += `<div class="an-item"><strong>🌟 Vocabulaire B2</strong> : ${a.b2Found.slice(0, 6).join(', ')}</div>`;
    if (a.overused.length) h += `<div class="an-item" style="color:var(--warn)"><strong>⚠️ Mots trop répétés</strong> : ${a.overused.slice(0, 4).join(', ')}</div>`;
    return h;
}

async function runAIAnalysis() {
    const t = editor.value.trim();
    if (!t) { alert('Pas de texte à analyser.'); return; }
    const pane = document.getElementById('analysis-ai-pane');
    pane.innerHTML = '<div class="ai-analysis-loading"><div class="ai-spinner"></div>Analyse en cours… cela peut prendre quelques secondes.</div>';
    const taskNum = activeTask || 1;
    const limits = ['60-120 mots', '120-150 mots', '180 mots maximum'];
    const taskLimit = limits[taskNum - 1];
    const combo = combos[activeCombIdx];
    const consigne = combo ? (taskNum === 1 ? combo.t1?.consigne : taskNum === 2 ? combo.t2?.consigne : combo.t3?.titre) || '' : '';
    const prompt = `Tu es un correcteur expert du TCF (Test de Connaissance du Français) niveau B2. Analyse ce texte d'Expression Écrite (Tâche ${taskNum}, limite : ${taskLimit}).
${consigne ? 'Sujet : ' + consigne + '\n\n' : ''}
Texte de l'étudiant :
"""
${t}
"""
Donne une analyse structurée avec ces sections exactes (utilise des émojis et sois précis) :
1. 🎯 ADÉQUATION AU SUJET
2. 📐 STRUCTURE
3. 🔗 COHÉRENCE & CONNECTEURS
4. 📚 RICHESSE LEXICALE
5. ✏️ GRAMMAIRE
6. 💡 3 CONSEILS PRIORITAIRES
7. ⭐ NIVEAU ESTIMÉ (B1/B1+/B2/B2+)`;
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
        });
        const data = await res.json();
        const text = data.content?.map(b => b.text || '').join('\n') || 'Erreur : réponse vide.';
        pane.innerHTML = `<div class="ai-analysis-box">${escHtml(text)}</div><button class="btn btn-ghost" style="margin-top:10px;width:auto;padding:8px 14px;font-size:12px" onclick="runAIAnalysis()">🔄 Relancer</button>`;
    } catch (err) {
        pane.innerHTML = `<div class="an-item"><span class="an-badge">⚠️</span><div class="an-text"><strong>Connexion impossible</strong><span>L'analyse IA nécessite une connexion à Claude. Erreur : ${escHtml(err.message)}</span></div></div><button class="btn btn-ghost" style="margin-top:10px;width:auto;padding:8px 14px;font-size:12px" onclick="runAIAnalysis()">🔄 Réessayer</button>`;
    }
}

/* ============ PDF EXPORT ============ */
function openPDFModal() { document.getElementById('pdfModal').classList.add('active'); }
function closePDFModal() { document.getElementById('pdfModal').classList.remove('active'); }
function exportPDF(mode) {
    closePDFModal();
    const combo = combos[activeCombIdx];
    if (!combo && mode !== 'current') { alert('Chargez un sujet d\'abord.'); return; }
    if (combo) {
        const mk = n => 'tcf_draft_' + activeMonthSlug + '_c' + (combo.num || activeCombIdx) + '_t' + n;
        localStorage.setItem(mk(activeTask), editor.value);
    }
    const monthLabel = activeMonthSlug ? getMonth(activeMonthSlug).label : 'TCF EE';
    if (mode === 'current') { generatePDFFromContent([{ title: 'Tâche ' + activeTask, text: editor.value, task: activeTask, combo, monthLabel }], 'TCF_T' + activeTask + '.pdf'); }
    else if (mode === 'all_combined') {
        const tx = getAllTaskTexts();
        const items = [];
        if (combo.t1 && combo.t1.consigne) items.push({ title: 'Tâche 1 — 60-120 mots', consigne: combo.t1.consigne, text: tx.t1, task: 1, combo, monthLabel });
        if (combo.t2 && combo.t2.consigne) items.push({ title: 'Tâche 2 — 120-150 mots', consigne: combo.t2.consigne, text: tx.t2, task: 2, combo, monthLabel });
        if (combo.t3) items.push({ title: 'Tâche 3 — ' + (combo.t3.titre || ''), consigne: (combo.t3.doc1 ? 'Doc 1: ' + combo.t3.doc1 : '') + (combo.t3.doc2 ? '\nDoc 2: ' + combo.t3.doc2 : ''), text: tx.t3, task: 3, combo, monthLabel });
        generatePDFFromContent(items, 'TCF_EE_C' + combo.num + '_complet.pdf');
    } else if (mode === 'all_separate') {
        const tx = getAllTaskTexts();
        const tasks = [];
        if (combo.t1 && combo.t1.consigne) tasks.push({ title: 'Tâche 1 — 60-120 mots', consigne: combo.t1.consigne, text: tx.t1, task: 1, combo, monthLabel });
        if (combo.t2 && combo.t2.consigne) tasks.push({ title: 'Tâche 2 — 120-150 mots', consigne: combo.t2.consigne, text: tx.t2, task: 2, combo, monthLabel });
        if (combo.t3) tasks.push({ title: 'Tâche 3 — ' + (combo.t3.titre || ''), consigne: (combo.t3.doc1 ? 'Doc 1: ' + combo.t3.doc1 : '') + (combo.t3.doc2 ? '\nDoc 2: ' + combo.t3.doc2 : ''), text: tx.t3, task: 3, combo, monthLabel });
        tasks.forEach((t, i) => { setTimeout(() => generatePDFFromContent([t], 'TCF_T' + t.task + '_C' + combo.num + '.pdf'), i * 400); });
    }
}

function generatePDFFromContent(items, filename) {
    const isDark = document.body.classList.contains('dark');
    let body = `<style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1.7;color:#0f172a;background:#fff;padding:0}
        .page{max-width:720px;margin:0 auto;padding:36px 48px}
        .header{border-bottom:3px solid #1d4ed8;padding-bottom:14px;margin-bottom:24px}
        .header h1{font-size:22px;font-weight:800;color:#1d4ed8}
        .header .sub{font-size:12px;color:#64748b;margin-top:4px}
        .task-block{margin-bottom:32px;page-break-inside:avoid}
        .task-title{font-size:15px;font-weight:800;color:#1d4ed8;border-left:4px solid #1d4ed8;padding-left:10px;margin-bottom:10px}
        .consigne-box{background:#f6f8fc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:12px;color:#334155;margin-bottom:12px;white-space:pre-wrap}
        .consigne-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
        .response-label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
        .response-text{font-size:14px;line-height:1.85;white-space:pre-wrap;color:#0f172a;min-height:80px}
        .word-count{font-size:11px;color:#94a3b8;margin-top:8px;font-style:italic}
        .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
        @media print{.no-print{display:none}.page{padding:20px 30px}}
    </style>
    <div class="page">
        <div class="header">
            <h1>TCF EE Studio X — Expression Écrite</h1>
            <div class="sub">${items[0]?.monthLabel || 'TCF EE'} ${items[0]?.combo ? '· Combinaison ' + items[0].combo.num : ''} · Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
        </div>`;
    items.forEach(item => {
        const wc = item.text ? (item.text.trim() ? item.text.trim().split(/\s+/).length : 0) : 0;
        body += `<div class="task-block">
            <div class="task-title">${item.title}</div>
            ${item.consigne ? `<div class="consigne-label">Sujet</div><div class="consigne-box">${item.consigne.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
            <div class="response-label">Réponse</div>
            <div class="response-text">${(item.text || '(vide)').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="word-count">${wc} mot${wc !== 1 ? 's' : ''}</div>
        </div>`;
    });
    body += `<div class="footer"><span>TCF EE Studio X</span><span>Export PDF — ${filename}</span></div></div>`;
    const w = window.open('', '_blank', 'width=800,height=900');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + filename + '</title></head><body>' + body + `<div class="no-print" style="position:fixed;top:12px;right:12px;display:flex;gap:8px"><button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer">🖨 Imprimer / Enregistrer PDF</button><button onclick="window.close()" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:9px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer">✕ Fermer</button></div></body></html>`);
    w.document.close();
}

/* ============ VOCAB EXERCISES ============ */
let vocabExMode = 'gap';
let vocabExIdx = 0;
let vocabExScore = { ok: 0, err: 0 };
let vocabExTotal = 0;
let vocabQuizShuffled = [];

function switchVocabExMode(mode) {
    vocabExMode = mode;
    vocabExIdx = 0;
    vocabExScore = { ok: 0, err: 0 };
    document.getElementById('vex-gap-tab').classList.toggle('active', mode === 'gap');
    document.getElementById('vex-quiz-tab').classList.toggle('active', mode === 'quiz');
    renderVocabExercise();
}
function initVocabExercise() {
    vocabExIdx = 0;
    vocabExScore = { ok: 0, err: 0 };
    const pool = vocabList.filter(v => v.def && v.def.trim());
    vocabQuizShuffled = [...pool].sort(() => Math.random() - 0.5);
    vocabExTotal = pool.length;
    renderVocabExercise();
}
function renderVocabExercise() {
    const area = document.getElementById('vocabExArea');
    if (!area) return;
    const pool = vocabList.filter(v => v.def && v.def.trim());
    if (!pool.length) { area.innerHTML = '<div class="empty-state">Ajoutez des mots avec des définitions pour commencer les exercices.</div>'; return; }
    const pct = vocabExTotal > 0 ? Math.round((vocabExScore.ok + vocabExScore.err) / vocabExTotal * 100) : 0;
    const progressHtml = `<div class="vocab-ex-progress"><div class="ex-progress-bar"><div class="ex-progress-fill" style="width:${pct}%"></div></div><span class="qs-ok" style="color:var(--success)">✅ ${vocabExScore.ok}</span><span class="qs-err" style="color:var(--danger)">❌ ${vocabExScore.err}</span></div>`;
    if (vocabExMode === 'gap') {
        const idx = vocabExIdx % pool.length;
        const v = pool[idx];
        area.innerHTML = progressHtml + `<div class="vocab-ex-card"><div class="ex-hint">📝 Remplissez la lacune :</div><div class="vocab-ex-sentence">« ${escHtml(v.word)} » signifie : <input class="vocab-gap" id="gapInput" onkeydown="if(event.key==='Enter')checkGap()"></div><div class="btn-row"><button class="btn btn-primary btn-sm" onclick="checkGap()">✔ Vérifier</button><button class="btn btn-ghost btn-sm" onclick="skipGap()">⏩ Passer</button></div><div class="ex-feedback" id="gapFeedback"></div></div><div class="muted" style="font-size:11.5px;margin-top:6px">Mot ${idx + 1}/${pool.length} · ${escHtml(v.theme || 'Autre')}</div>`;
        document.getElementById('gapInput')?.focus();
    } else {
        if (vocabQuizShuffled.length === 0) vocabQuizShuffled = [...pool].sort(() => Math.random() - 0.5);
        const v = vocabQuizShuffled[vocabExIdx % vocabQuizShuffled.length];
        area.innerHTML = progressHtml + `<div class="vocab-quiz-card"><div class="quiz-word">${escHtml(v.word)}</div><input class="quiz-input" id="quizInput" placeholder="Définition..." onkeydown="if(event.key==='Enter')checkQuiz()"><div class="btn-row"><button class="btn btn-primary btn-sm" onclick="checkQuiz()">✔ Vérifier</button><button class="btn btn-ghost btn-sm" onclick="skipQuiz()">⏩ Passer</button></div><div class="ex-feedback" id="quizFeedback"></div></div>`;
        document.getElementById('quizInput')?.focus();
    }
}
function checkGap() {
    const pool = vocabList.filter(v => v.def && v.def.trim());
    const idx = vocabExIdx % pool.length;
    const v = pool[idx];
    const inp = document.getElementById('gapInput');
    const fb = document.getElementById('gapFeedback');
    if (!inp || !fb) return;
    const answer = inp.value.trim().toLowerCase();
    const correct = v.def.toLowerCase();
    if (answer === correct || correct.includes(answer) && answer.length > 3) {
        inp.classList.add('correct');
        fb.className = 'ex-feedback ok';
        fb.textContent = '✅ Correct ! « ' + v.def + ' »';
        vocabExScore.ok++;
        setTimeout(() => { vocabExIdx++; renderVocabExercise(); }, 1200);
    } else {
        inp.classList.add('wrong');
        fb.className = 'ex-feedback err';
        fb.textContent = '❌ La définition était : ' + v.def;
        vocabExScore.err++;
        setTimeout(() => { vocabExIdx++; renderVocabExercise(); }, 2000);
    }
}
function skipGap() { vocabExIdx++; renderVocabExercise(); }
function checkQuiz() {
    if (vocabQuizShuffled.length === 0) return;
    const v = vocabQuizShuffled[vocabExIdx % vocabQuizShuffled.length];
    const inp = document.getElementById('quizInput');
    const fb = document.getElementById('quizFeedback');
    if (!inp || !fb) return;
    const answer = inp.value.trim().toLowerCase();
    const correct = v.def.toLowerCase();
    if (answer === correct || correct.includes(answer) && answer.length > 3) {
        fb.className = 'ex-feedback ok';
        fb.textContent = '✅ Bien ! Définition : ' + v.def;
        vocabExScore.ok++;
        setTimeout(() => { vocabExIdx++; renderVocabExercise(); }, 1800);
    } else {
        fb.className = 'ex-feedback err';
        fb.textContent = '❌ La définition était : ' + v.def;
        vocabExScore.err++;
        setTimeout(() => { vocabExIdx++; renderVocabExercise(); }, 2400);
    }
}
function skipQuiz() { vocabExIdx++; renderVocabExercise(); }

/* ============ ERROR QUIZ ============ */
let errQuizIdx = 0, errQuizScore = { ok: 0, err: 0 }, errQuizMode = 'list', errQuizShuffled = [];

function switchErrTab(mode) {
    errQuizMode = mode;
    document.getElementById('etab-list').classList.toggle('active', mode === 'list');
    document.getElementById('etab-quiz').classList.toggle('active', mode === 'quiz');
    if (mode === 'list') buildErrorsList();
    else { errQuizIdx = 0; errQuizScore = { ok: 0, err: 0 }; errQuizShuffled = [...myErrors].sort(() => Math.random() - 0.5); renderErrQuiz(); }
    const listPane = document.getElementById('errListPane');
    const quizPane = document.getElementById('errQuizPane');
    if (listPane) listPane.style.display = mode === 'list' ? 'block' : 'none';
    if (quizPane) quizPane.style.display = mode === 'quiz' ? 'block' : 'none';
}
function renderErrQuiz() {
    const area = document.getElementById('errQuizArea');
    if (!area) return;
    if (!myErrors.length) { area.innerHTML = '<div class="empty-state">Aucune erreur enregistrée.</div>'; return; }
    const pool = errQuizShuffled.filter(e => e.right && e.right.trim());
    if (!pool.length) { area.innerHTML = '<div class="empty-state">Ajoutez des corrections pour pratiquer le quiz.</div>'; return; }
    const idx = errQuizIdx % pool.length;
    const e = pool[idx];
    area.innerHTML = `<div class="err-quiz-stats">Score : ✅ ${errQuizScore.ok} | ❌ ${errQuizScore.err} | ${idx + 1}/${pool.length}</div>
        <div class="err-quiz-wrap"><div class="err-quiz-prompt">Corrigez :</div><div class="err-wrong-display">${escHtml(e.wrong)}</div>
        <input class="err-quiz-input" id="errQuizInput" onkeydown="if(event.key==='Enter')checkErrQuiz()" placeholder="Votre correction...">
        <div class="btn-row"><button class="btn btn-primary btn-sm" onclick="checkErrQuiz()">✔ Vérifier</button><button class="btn btn-ghost btn-sm" onclick="skipErrQuiz()">⏩ Passer</button></div>
        <div class="err-quiz-fb" id="errQuizFb"></div></div>`;
    document.getElementById('errQuizInput')?.focus();
}
function checkErrQuiz() {
    const pool = errQuizShuffled.filter(e => e.right && e.right.trim());
    const e = pool[errQuizIdx % pool.length];
    const inp = document.getElementById('errQuizInput');
    const fb = document.getElementById('errQuizFb');
    if (!inp || !fb) return;
    const ans = inp.value.trim().toLowerCase();
    const cor = e.right.trim().toLowerCase();
    if (ans === cor) {
        fb.className = 'err-quiz-fb ok';
        fb.textContent = '✅ Parfait ! « ' + e.right + ' »';
        errQuizScore.ok++;
        setTimeout(() => { errQuizIdx++; renderErrQuiz(); }, 1200);
    } else {
        fb.className = 'err-quiz-fb err';
        fb.textContent = '❌ Correction : « ' + e.right + ' »';
        errQuizScore.err++;
        setTimeout(() => { errQuizIdx++; renderErrQuiz(); }, 2000);
    }
}
function skipErrQuiz() { errQuizIdx++; renderErrQuiz(); }

/* ============ PRESET ANSWERS ============ */
function renderPresetsList() {
    const el = document.getElementById('presetsList');
    if (!el) return;
    if (!presetAnswers.length) { el.innerHTML = '<div class="card"><div class="empty-state">Importez des réponses modèles.</div></div>'; return; }
    el.innerHTML = presetAnswers.map((a, i) => `<div class="preset-answer-card"><div class="preset-answer-head"><span class="preset-answer-label">Tâche ${a.task}${a.title ? ' — ' + escHtml(a.title) : ''}</span><div><span class="muted">${wcOf(a.text)} mots</span><span class="del-x" onclick="deletePresetAnswer(${i})">×</span></div></div><div class="preset-answer-text" onclick="this.classList.toggle('open')">${escHtml(a.text)}</div></div>`).join('');
}
function deletePresetAnswer(i) { if (!confirm('Supprimer ?')) return; presetAnswers.splice(i, 1); SV('tcf_presets', presetAnswers); renderPresetsList(); }
function exportPresetsTXT() { if (!presetAnswers.length) { alert('Aucune réponse modèle.'); return; } const txt = presetAnswers.map(a => '### TÂCHE ' + a.task + (a.title ? ' — ' + a.title : '') + '\n' + a.text).join('\n\n'); dl(new Blob([txt], { type: 'text/plain;charset=utf-8' }), 'TCF_reponses_modeles.txt'); }
function clearPresets() { if (!confirm('Effacer toutes les réponses modèles ?')) return; presetAnswers = []; SV('tcf_presets', presetAnswers); renderPresetsList(); }

/* ============ CUSTOM CONNECTORS ============ */
function renderCustomConnList() {
    const el = document.getElementById('customConnList');
    if (!el) return;
    if (!customConns.length) { el.innerHTML = '<div class="card"><div class="empty-state">Aucun connecteur personnalisé.</div></div>'; return; }
    const byCategory = {};
    customConns.forEach(c => { (byCategory[c.cat || 'Personnels'] = byCategory[c.cat || 'Personnels'] || []).push(c); });
    el.innerHTML = Object.entries(byCategory).map(([cat, items]) => `<div class="card"><div class="conn-cat">${escHtml(cat)} (${items.length})</div>${items.map(c => `<div class="custom-conn-item"><span class="custom-conn-word">${escHtml(c.w)}</span><span class="custom-conn-guide">${escHtml(c.g || '—')}</span><span class="del-x" onclick="deleteCustomConn(${customConns.indexOf(c)})">×</span></div>`).join('')}</div>`).join('');
}
function deleteCustomConn(idx) { customConns.splice(idx, 1); SV('tcf_custom_conns', customConns); rebuildCustomConnsSRS(); renderCustomConnList(); }
function exportCustomConnsTXT() { if (!customConns.length) { alert('Aucun connecteur personnalisé.'); return; } const cats = {}; customConns.forEach(c => { (cats[c.cat || 'Personnels'] = cats[c.cat || 'Personnels'] || []).push(c); }); const txt = Object.entries(cats).map(([cat, items]) => '[' + cat + ']\n' + items.map(c => c.w + (c.g ? ' — ' + c.g : '')).join('\n')).join('\n\n'); dl(new Blob([txt], { type: 'text/plain;charset=utf-8' }), 'TCF_connecteurs_perso.txt'); }
function clearCustomConns() { if (!confirm('Effacer tous les connecteurs importés ?')) return; customConns = []; SV('tcf_custom_conns', customConns); renderCustomConnList(); }
function rebuildCustomConnsSRS() { if (!customConns || !customConns.length) return; customConns.forEach((c, i) => { const existing = ALL_CONN.find(x => x.w === c.w); if (!existing) ALL_CONN.push({ ...c, customIdx: i }); }); }

/* ============ READING COMPREHENSION ============ */
function renderReadingView() {
    const panel = document.getElementById('readingDocsPanel');
    const empty = document.getElementById('readingEmptyState');
    if (!readingDocs.length) { if (panel) panel.style.display = 'none'; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    if (panel) panel.style.display = 'block';
    const tabs = document.getElementById('readingDocTabs');
    if (tabs) { tabs.innerHTML = readingDocs.map((d, i) => `<div class="comp-tab${i === activeReadingDoc ? ' active' : ''}" onclick="selectReadingDoc(${i})">${d.type === 'ÉCOUTE' ? '🎙' : '📄'} ${escHtml(d.title.slice(0, 22))}</div>`).join('') + `<div class="comp-tab" onclick="clearReadingDocs()" style="color:var(--danger);border-style:dashed">🗑</div>`; }
    renderActiveReadingDoc();
}
function selectReadingDoc(idx) { activeReadingDoc = idx; renderReadingView(); }
function renderActiveReadingDoc() {
    const el = document.getElementById('readingActiveDoc');
    if (!el || !readingDocs.length) return;
    const doc = readingDocs[activeReadingDoc] || readingDocs[0];
    el.innerHTML = `<div class="card"><div><div style="font-weight:800">${doc.type === 'ÉCOUTE' ? '🎙' : '📄'} ${escHtml(doc.title)}</div><div class="muted">${doc.type} · ${doc.questions.length} questions</div></div><div class="comp-text">${escHtml(doc.text)}</div><button class="btn btn-primary btn-sm" onclick="startRdgPractice(${activeReadingDoc})">🚀 Pratiquer</button></div>`;
}
function startRdgPractice(idx) {
    const doc = readingDocs[idx];
    const area = document.getElementById('rdgModalContent');
    document.getElementById('rdgModalTitle').textContent = (doc.type === 'ÉCOUTE' ? '🎙 ' : '📄 ') + escHtml(doc.title);
    let html = `<div class="rdg-text-box">${escHtml(doc.text)}</div>`;
    doc.questions.forEach((q, i) => {
        html += `<div class="rdg-qblock"><div class="rdg-question">${i + 1}. ${escHtml(q.question)}</div><div class="rdg-options">`;
        if (q.options && q.options.length) {
            q.options.forEach(opt => { html += `<div class="rdg-option" onclick="alert('Réponse: ${opt.key}')">${opt.key}) ${escHtml(opt.text)}</div>`; });
        }
        html += `<div class="muted" style="margin-top:5px">✅ Réponse: ${q.answer || '?'}</div></div></div>`;
    });
    area.innerHTML = html;
    document.getElementById('rdgModal').classList.add('active');
}
function closeRdgModal() { document.getElementById('rdgModal').classList.remove('active'); }
function exportReadingTXT() { if (!readingDocs.length) { alert('Aucun texte.'); return; } const txt = readingDocs.map(d => '### ' + d.title + '\nTEXTE:\n' + d.text + '\n\nQUESTIONS:\n' + d.questions.map((q, i) => 'Q' + (i + 1) + ': ' + q.question + '\nRÉPONSE: ' + q.answer).join('\n')).join('\n---\n'); dl(new Blob([txt], { type: 'text/plain;charset=utf-8' }), 'TCF_lecture.txt'); }
function clearReadingDocs() { if (!confirm('Effacer tous les textes ?')) return; readingDocs = []; activeReadingDoc = 0; SV('tcf_reading_docs', readingDocs); renderReadingView(); refreshBadges(); }

/* ============ IMPORT/EXPORT MODAL ============ */
const IMPORT_CONFIGS = {
    vocab: { parse: (text) => text.split('\n').filter(l => l.trim()).map(l => ({ word: l.trim(), def: '', theme: 'Autre' })), apply: (data) => { data.forEach(v => { if (!vocabList.some(x => x.word === v.word)) vocabList.push({ ...v, addedAt: todayStr() }); }); SV('tcf_vocab', vocabList); renderVocabList(); renderSentenceChips(); renderThemeBalance(); refreshBadges(); } },
    connectors: { parse: (text) => text.split('\n').filter(l => l.trim()).map(l => ({ w: l.trim(), g: '', cat: 'Importé' })), apply: (data) => { customConns.push(...data); SV('tcf_custom_conns', customConns); rebuildCustomConnsSRS(); renderCustomConnList(); } },
    answers: { parse: (text) => text.split('\n').filter(l => l.trim()).map(l => ({ task: 1, text: l.trim() })), apply: (data) => { presetAnswers.push(...data); SV('tcf_presets', presetAnswers); renderPresetsList(); } }
};
function openImportModal(type) {
    const cfg = IMPORT_CONFIGS[type];
    document.getElementById('importModalTitle').textContent = '📥 Importer ' + type;
    document.getElementById('importModalDesc').textContent = cfg.desc || 'Importez un fichier TXT.';
    document.getElementById('importModal').classList.add('active');
    window.importCallback = () => {
        const file = document.getElementById('importFileInput').files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = () => { try { const data = cfg.parse(r.result); cfg.apply(data); alert('Import réussi !'); } catch (e) { alert('Erreur: ' + e.message); } };
        r.readAsText(file);
    };
}
function closeImportModal() { document.getElementById('importModal').classList.remove('active'); }
function handleImportFile(file) { if (window.importCallback) window.importCallback(file); }

/* ============ FULL BACKUP ============ */
function downloadFullBackup() {
    const backup = { version: 'v6', exportedAt: new Date().toISOString(), data: {} };
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tcf_')) backup.data[k] = localStorage.getItem(k);
    }
    dl(new Blob([JSON.stringify(backup, null, 2)], { type: 'text/plain;charset=utf-8' }), 'TCF_backup_' + new Date().toISOString().slice(0, 10) + '.txt');
    saveHistory('💾 Sauvegarde complète téléchargée');
}
function restoreFromBackup() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.txt';
    inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            try {
                const bk = JSON.parse(r.result);
                const data = bk.data || bk;
                let count = 0;
                Object.keys(data).forEach(k => { if (k.startsWith('tcf_')) { localStorage.setItem(k, data[k]); count++; } });
                alert('✅ Restauration réussie ! ' + count + ' clés restaurées. La page va se recharger.');
                location.reload();
            } catch (e) { alert('❌ Fichier invalide.'); }
        };
        r.readAsText(f);
    };
    inp.click();
}

/* ============ MOBILE SIDEBAR ============ */
function toggleMobileSidebar() {
    const s = document.querySelector('.sidebar');
    const o = document.getElementById('sidebarOverlay');
    s.classList.toggle('mobile-open');
    o.classList.toggle('mobile-open', s.classList.contains('mobile-open'));
}
function closeMobileSidebar() {
    document.querySelector('.sidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('mobile-open');
}

/* ============ AUTO BACKUP REMINDER ============ */
if (productions.length > 100 || history.length > 200) {
    setTimeout(() => {
        if (!sessionStorage.getItem('backup_reminded')) {
            sessionStorage.setItem('backup_reminded', '1');
            console.log('💡 Pensez à sauvegarder vos données (menu latéral → Sauvegarder tout l\'historique)');
        }
    }, 3000);
}
