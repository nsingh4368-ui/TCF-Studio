// TCF EE Studio X - Core Application Logic
// Main controller for all features

// ========== GLOBAL STATE ==========
let productions = JSON.parse(localStorage.getItem('tcf_productions') || '[]');
let favorites = JSON.parse(localStorage.getItem('tcf_favorites') || '[]');
let revisits = JSON.parse(localStorage.getItem('tcf_revisits') || '[]');
let history = JSON.parse(localStorage.getItem('tcf_history') || '[]');
let vocabList = JSON.parse(localStorage.getItem('tcf_vocab') || '[]');
let myErrors = JSON.parse(localStorage.getItem('tcf_errors') || '[]');
let profile = JSON.parse(localStorage.getItem('tcf_profile') || '{}');
let streak = JSON.parse(localStorage.getItem('tcf_streak') || '{lastDate:"",cur:0,best:0}');

let combos = [];
let activeMonthSlug = '';
let activeCombIdx = 0;
let activeTask = 1;
let focusMode = false;
let timerInterval = null;
let timerSeconds = 3600;

let currentRdgText = null;
let rdgAnswers = {};
let rdgSubmitted = false;

// ========== UTILITY FUNCTIONS ==========
function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch(e) {
    return defaultValue;
  }
}

// ========== VIEW MANAGEMENT ==========
function showView(view) {
  document.querySelectorAll('[id^="view-"]').forEach(v => v.style.display = 'none');
  const target = document.getElementById(`view-${view}`);
  if (target) target.style.display = 'block';
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById(`nav-${view}`);
  if (nav) nav.classList.add('active');
  
  if (view === 'productions') renderProductions();
  if (view === 'favorites') renderFavorites();
  if (view === 'revisit') renderRevisits();
  if (view === 'history') renderHistory();
  if (view === 'stats') renderStats();
  if (view === 'profile') loadProfileForm();
  if (view === 'reading') renderReadingLibrary();
  
  updateBadges();
}

// ========== STUDIO / SUBJECTS ==========
function loadSubjects(monthSlug) {
  if (typeof DEFAULT_SUBJECT_BANK !== 'undefined') {
    combos = (DEFAULT_SUBJECT_BANK[monthSlug] || []).map((c, i) => ({ ...c, num: c.num || i + 1 }));
    activeMonthSlug = monthSlug;
    
    if (combos.length) {
      document.getElementById('sujetEmpty').style.display = 'none';
      document.getElementById('sujetContent').style.display = 'block';
      const available = getAvailableTasks(combos[0]);
      activeTask = available.includes(activeTask) ? activeTask : (available[0] || 1);
      renderSujet();
      loadDraft();
    } else {
      document.getElementById('sujetEmpty').style.display = 'block';
      document.getElementById('sujetContent').style.display = 'none';
      document.getElementById('sujetEmpty').innerHTML = `Aucun sujet pour ${monthSlug}.`;
    }
  }
}

function getAvailableTasks(combo) {
  const tasks = [];
  if (combo.t1 && combo.t1.consigne) tasks.push(1);
  if (combo.t2 && combo.t2.consigne) tasks.push(2);
  if (combo.t3 && (combo.t3.doc1 || combo.t3.doc2)) tasks.push(3);
  return tasks;
}

function renderSujet() {
  if (!combos.length) return;
  const c = combos[activeCombIdx];
  const available = getAvailableTasks(c);
  if (!available.includes(activeTask)) activeTask = available[0] || 1;
  
  document.getElementById('comboBadge').textContent = `Combinaison ${c.num}`;
  
  const comboList = document.getElementById('comboList');
  comboList.innerHTML = combos.map((cc, i) => `
    <button class="combo-pill ${i === activeCombIdx ? 'active' : ''}" onclick="selectCombo(${i})">
      ${cc.num}
    </button>
  `).join('');
  
  const taskTabs = document.getElementById('taskTabs');
  taskTabs.innerHTML = [1, 2, 3].map(n => `
    <div class="task-tab ${activeTask === n ? 'active' : ''} ${!available.includes(n) ? 'missing' : ''}" 
         onclick="switchTask(${n})">Tâche ${n}</div>
  `).join('');
  
  const taskContent = document.getElementById('taskContent');
  if (activeTask === 1 && c.t1) {
    taskContent.innerHTML = `
      <div class="task-label">Tâche 1</div>
      <div class="task-text">${escHtml(c.t1.consigne)}</div>
      <div class="task-limit">60 mots min. / 120 mots max.</div>
    `;
  } else if (activeTask === 2 && c.t2) {
    taskContent.innerHTML = `
      <div class="task-label">Tâche 2</div>
      <div class="task-text">${escHtml(c.t2.consigne)}</div>
      <div class="task-limit">120 mots min. / 150 mots max.</div>
    `;
  } else if (c.t3) {
    taskContent.innerHTML = `
      <div class="task-label">Tâche 3 — ${escHtml(c.t3.titre || '')}</div>
      <div class="doc-block"><div class="doc-title">Document 1</div><div class="task-text">${escHtml(c.t3.doc1 || '')}</div></div>
      <div class="doc-block"><div class="doc-title">Document 2</div><div class="task-text">${escHtml(c.t3.doc2 || '')}</div></div>
      <div class="task-limit">180 mots maximum</div>
    `;
  }
  
  updateWordCounter();
}

function selectCombo(idx) {
  activeCombIdx = idx;
  activeTask = 1;
  renderSujet();
  loadDraft();
}

function switchTask(task) {
  saveDraft();
  activeTask = task;
  renderSujet();
  loadDraft();
  updateWordCounter();
}

function draftKey() {
  if (!combos.length || !activeMonthSlug) return null;
  const c = combos[activeCombIdx];
  return `tcf_draft_${activeMonthSlug}_c${c.num}_t${activeTask}`;
}

function saveDraft() {
  const key = draftKey();
  if (key) localStorage.setItem(key, editor.value);
}

function loadDraft() {
  const key = draftKey();
  if (key) {
    editor.value = localStorage.getItem(key) || '';
  } else {
    editor.value = '';
  }
  updateWordCounter();
}

// ========== EDITOR ==========
const editor = document.getElementById('editor');

function onEditorInput() {
  saveDraft();
  updateWordCounter();
}

function updateWordCounter() {
  const wc = wordCount(editor.value);
  const counter = document.getElementById('wordCounter');
  if (counter) counter.textContent = `${wc} mots`;
  const focusWC = document.getElementById('focusWC');
  if (focusWC) focusWC.textContent = `${wc} mots`;
}

function finishProduction() {
  const text = editor.value.trim();
  if (wordCount(text) < 10) {
    alert('Production trop courte (minimum 50 caractères / 10 mots).');
    return;
  }
  
  const combo = combos[activeCombIdx];
  productions.unshift({
    date: todayStr(),
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    topic: `Tâche ${activeTask} · Combo ${combo.num}`,
    text: text,
    words: wordCount(text),
    confidence: null
  });
  saveToLocalStorage('tcf_productions', productions);
  editor.value = '';
  saveDraft();
  updateWordCounter();
  updateBadges();
  alert('✅ Production sauvegardée !');
  
  if (confirm('Voir toutes vos productions ?')) showView('productions');
}

function saveAsTXT() {
  const text = editor.value;
  const combo = combos[activeCombIdx];
  const blob = new Blob([`SUJET: Tâche ${activeTask} - Combo ${combo.num}\n\n${text}`], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `TCF_production_${todayStr()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function runAnalysis() {
  const text = editor.value;
  if (!text.trim()) {
    alert('Rédigez d\'abord un texte à analyser.');
    return;
  }
  
  const wc = wordCount(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const avgWordsPerSentence = sentences ? Math.round(wc / sentences) : 0;
  
  // Detect connectors
  const connectorWords = ['cependant', 'donc', 'en outre', 'par ailleurs', 'néanmoins', 'toutefois', 'à mon avis', 'selon moi'];
  const foundConnectors = connectorWords.filter(c => text.toLowerCase().includes(c));
  
  const panel = document.getElementById('analysisPanel');
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <strong>📊 Analyse du texte</strong>
      <button class="btn-ghost" style="width:auto;padding:4px 12px" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
    </div>
    <div class="an-item"><span class="an-badge">📝</span><div><strong>${wc} mots</strong><br><span>${sentences} phrases · ${avgWordsPerSentence} mots/phrase</span></div></div>
    <div class="an-item"><span class="an-badge">🔗</span><div><strong>Connecteurs détectés</strong><br><span>${foundConnectors.length ? foundConnectors.join(', ') : 'Aucun — essayez : cependant, donc, en outre, à mon avis…'}</span></div></div>
    ${wc < 60 ? '<div class="an-item"><span class="an-badge">⚠️</span><div><strong>Texte court</strong><br><span>Ajoutez plus de contenu pour une meilleure analyse.</span></div></div>' : ''}
  `;
}

// ========== PRODUCTIONS ==========
function renderProductions() {
  const container = document.getElementById('prodList');
  if (!container) return;
  
  if (!productions.length) {
    container.innerHTML = '<div class="card empty-state">Aucune production. Écrivez dans le Studio puis validez.</div>';
    return;
  }
  
  container.innerHTML = productions.map((p, i) => `
    <div class="prod-card">
      <div class="prod-head">
        <span class="prod-topic">${p.confidence || '📝'} ${escHtml(p.topic)}</span>
        <span class="muted">${p.date} ${p.time || ''} · ${p.words} mots</span>
        <span class="del-x" onclick="deleteProduction(${i})">×</span>
      </div>
      <div class="prod-text" onclick="this.classList.toggle('open')">${escHtml(p.text)}</div>
    </div>
  `).join('');
}

function deleteProduction(idx) {
  if (confirm('Supprimer cette production ?')) {
    productions.splice(idx, 1);
    saveToLocalStorage('tcf_productions', productions);
    renderProductions();
    updateBadges();
  }
}

// ========== FAVORITES & REVISITS ==========
function renderFavorites() {
  const container = document.getElementById('favList');
  if (!container) return;
  
  if (!favorites.length) {
    container.innerHTML = '<div class="card empty-state">Aucun favori. Ajoutez-en depuis le Studio.</div>';
    return;
  }
  
  container.innerHTML = favorites.map((f, i) => `
    <div class="list-item">
      <div class="list-item-text">⭐ ${escHtml(f)}</div>
      <span class="del-x" onclick="favorites.splice(${i},1);saveToLocalStorage('tcf_favorites',favorites);renderFavorites();updateBadges()">×</span>
    </div>
  `).join('');
}

function renderRevisits() {
  const container = document.getElementById('revList');
  if (!container) return;
  
  if (!revisits.length) {
    container.innerHTML = '<div class="card empty-state">Rien à réviser.</div>';
    return;
  }
  
  container.innerHTML = revisits.map((r, i) => `
    <div class="list-item">
      <div class="list-item-text">🔄 ${escHtml(r)}</div>
      <span class="del-x" onclick="revisits.splice(${i},1);saveToLocalStorage('tcf_revisits',revisits);renderRevisits();updateBadges()">×</span>
    </div>
  `).join('');
}

function addFav() {
  if (!combos.length) { alert('Chargez un sujet d\'abord.'); return; }
  const c = combos[activeCombIdx];
  const favText = `${activeMonthSlug} - Combo ${c.num} - Tâche ${activeTask}`;
  if (!favorites.includes(favText)) {
    favorites.push(favText);
    saveToLocalStorage('tcf_favorites', favorites);
    updateBadges();
    alert('Ajouté aux favoris ✓');
  }
}

function addRevisit() {
  if (!combos.length) { alert('Chargez un sujet d\'abord.'); return; }
  const c = combos[activeCombIdx];
  const revText = `${activeMonthSlug} - Combo ${c.num} - Tâche ${activeTask}`;
  if (!revisits.includes(revText)) {
    revisits.push(revText);
    saveToLocalStorage('tcf_revisits', revisits);
    updateBadges();
    alert('Ajouté à réviser ✓');
  }
}

// ========== HISTORY ==========
function renderHistory() {
  const container = document.getElementById('histList');
  if (!container) return;
  
  if (!history.length) {
    container.innerHTML = '<div class="card empty-state">Aucun historique.</div>';
    return;
  }
  
  const grouped = {};
  [...history].reverse().forEach(h => {
    grouped[h.date || '—'] = grouped[h.date || '—'] || [];
    grouped[h.date || '—'].push(h);
  });
  
  container.innerHTML = Object.entries(grouped).map(([date, items]) => `
    <div class="hist-date-group">${date}</div>
    ${items.map(h => `<div class="hist-item"><span class="hist-time">${h.time}</span><span>${escHtml(h.text)}</span></div>`).join('')}
  `).join('');
}

function addToHistory(action) {
  history.unshift({
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    date: todayStr(),
    text: action
  });
  if (history.length > 200) history.pop();
  saveToLocalStorage('tcf_history', history);
  updateBadges();
}

// ========== STATS ==========
function renderStats() {
  const totalWords = productions.reduce((sum, p) => sum + (p.words || 0), 0);
  const container = document.getElementById('statsGrid');
  if (!container) return;
  
  container.innerHTML = `
    <div class="stat-card"><div class="stat-val">${productions.length}</div><div class="stat-label">📄 Productions</div></div>
    <div class="stat-card"><div class="stat-val">${totalWords}</div><div class="stat-label">📝 Mots rédigés</div></div>
    <div class="stat-card"><div class="stat-val">${streak.cur || 0}</div><div class="stat-label">🔥 Série actuelle</div></div>
    <div class="stat-card"><div class="stat-val">${streak.best || 0}</div><div class="stat-label">🏆 Record</div></div>
    <div class="stat-card"><div class="stat-val">${vocabList.length}</div><div class="stat-label">📖 Vocabulaire</div></div>
    <div class="stat-card"><div class="stat-val">${myErrors.length}</div><div class="stat-label">♻️ Erreurs</div></div>
    <div class="stat-card"><div class="stat-val">${favorites.length}</div><div class="stat-label">⭐ Favoris</div></div>
    <div class="stat-card"><div class="stat-val">${history.length}</div><div class="stat-label">🕒 Sessions</div></div>
  `;
}

// ========== PROFILE ==========
function loadProfileForm() {
  document.getElementById('profName').value = profile.name || '';
  document.getElementById('profFirst').value = profile.first || '';
  document.getElementById('profObjectif').value = profile.objectif || 'B2';
}

function saveProfile() {
  profile.name = document.getElementById('profName').value;
  profile.first = document.getElementById('profFirst').value;
  profile.objectif = document.getElementById('profObjectif').value;
  saveToLocalStorage('tcf_profile', profile);
  applyProfileToUI();
  alert('Profil enregistré ✓');
}

function applyProfileToUI() {
  const full = [profile.first, profile.name].filter(Boolean).join(' ');
  const brandName = document.getElementById('brandName');
  if (brandName) {
    brandName.textContent = full || 'TCF EE Studio X';
    brandName.style.display = full ? 'block' : 'none';
  }
}

// ========== TIMER ==========
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      document.getElementById('timerDisplay').textContent = `${m}:${s.toString().padStart(2, '0')}`;
      document.getElementById('focusTimer').textContent = `${m}:${s.toString().padStart(2, '0')}`;
      const percent = (timerSeconds / 3600) * 100;
      document.getElementById('timerBar').style.width = `${percent}%`;
      if (percent < 25) document.getElementById('timerBar').style.background = '#dc2626';
      else if (percent < 50) document.getElementById('timerBar').style.background = '#d97706';
      else document.getElementById('timerBar').style.background = 'var(--accent2)';
    } else {
      clearInterval(timerInterval);
      alert('⏰ Temps écoulé !');
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerSeconds = 3600;
  document.getElementById('timerDisplay').textContent = '60:00';
  document.getElementById('focusTimer').textContent = '60:00';
  document.getElementById('timerBar').style.width = '100%';
}

// ========== FOCUS MODE ==========
function toggleFocusMode() {
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode', focusMode);
  if (focusMode) editor.focus();
}

// ========== MOCK TESTS ==========
function loadListeningMock(mode) {
  const frame = document.getElementById('listeningFrame');
  if (mode === 'full') {
    frame.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head><style>
        body{background:#0c0e14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .container{text-align:center;padding:20px;max-width:600px}
        button{background:#1d4ed8;color:#fff;border:none;border-radius:12px;padding:12px 24px;margin:10px;cursor:pointer}
        .test-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-top:20px}
        .test-card{background:#1a1f2e;padding:12px;border-radius:10px;cursor:pointer}
        .test-card:hover{background:#1d4ed8}
      </style></head>
      <body>
        <div class="container">
          <h1>🎧 Tests d'écoute TCF</h1>
          <p>40 tests complets · 20 questions chacun</p>
          <div class="test-grid" id="testGrid"></div>
          <button onclick="parent.postMessage('closeMock','*')">Fermer</button>
        </div>
        <script>
          const tests = ${JSON.stringify(LISTENING_TESTS ? LISTENING_TESTS.slice(0, 40) : [])};
          const grid = document.getElementById('testGrid');
          if(grid && tests.length){
            tests.forEach((_,i)=>{
              const div = document.createElement('div');
              div.className = 'test-card';
              div.innerHTML = 'Test ' + (i+1);
              div.onclick = () => alert('Test ' + (i+1) + ' - ' + tests[i].length + ' questions');
              grid.appendChild(div);
            });
          } else {
            grid.innerHTML = '<p>Chargement des tests...</p>';
          }
        <\/script>
      </body>
      </html>
    `;
  }
}

function loadReadingMock(mode) {
  const frame = document.getElementById('readingMockFrame');
  if (mode === 'full') {
    frame.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head><style>
        body{background:#0c0e14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
        .container{text-align:center;padding:20px;max-width:600px}
        button{background:#1d4ed8;color:#fff;border:none;border-radius:12px;padding:12px 24px;margin:10px;cursor:pointer}
      </style></head>
      <body>
        <div class="container">
          <h1>📖 Tests de lecture TCF</h1>
          <p>424 questions Q20-Q39 · 40 tests</p>
          <button onclick="alert('Démarrer le quiz')">Commencer</button>
          <button onclick="parent.postMessage('closeMock','*')">Fermer</button>
        </div>
      </body>
      </html>
    `;
  }
}

// ========== READING LIBRARY ==========
function renderReadingLibrary() {
  const container = document.getElementById('readingDocsPanel');
  if (!container) return;
  
  const docs = loadFromLocalStorage('tcf_reading_docs', []);
  if (!docs.length) {
    container.innerHTML = '<div class="card empty-state">📂 Importez des textes de lecture/écoute via le menu Banque.</div>';
    return;
  }
  
  container.innerHTML = docs.map((doc, i) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>${doc.type === 'ÉCOUTE' ? '🎙' : '📄'} ${escHtml(doc.title)}</strong><br><span class="muted">${doc.questions?.length || 0} questions</span></div>
        <button class="btn-primary btn-sm" style="width:auto;padding:6px 12px" onclick="startRdgPractice(${i})">📖 Lire</button>
      </div>
    </div>
  `).join('');
}

function startRdgPractice(idx) {
  const docs = loadFromLocalStorage('tcf_reading_docs', []);
  currentRdgText = docs[idx];
  rdgAnswers = {};
  rdgSubmitted = false;
  document.getElementById('rdgModal').classList.add('active');
  renderRdgModal();
}

function renderRdgModal() {
  const container = document.getElementById('rdgModalContent');
  if (!container || !currentRdgText) return;
  
  let html = `<div class="rdg-text-box">${escHtml(currentRdgText.text)}</div>`;
  
  if (currentRdgText.questions && currentRdgText.questions.length) {
    currentRdgText.questions.forEach((q, i) => {
      html += `
        <div class="rdg-qblock">
          <div class="rdg-question">${i+1}. ${escHtml(q.question)}</div>
          <div class="rdg-options">
            ${(q.options || []).map(opt => `
              <div class="rdg-option" onclick="selectRdgOption(${i}, '${opt.key}')">
                ${opt.key}) ${escHtml(opt.text)}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    html += `<button class="btn-primary" style="margin-top:12px" onclick="submitRdgAnswers()">✅ Vérifier mes réponses</button>`;
  }
  
  container.innerHTML = html;
}

// ========== VOCABULARY ==========
function addVocabWord() {
  const word = document.getElementById('vocabWord')?.value.trim();
  const def = document.getElementById('vocabDef')?.value.trim();
  if (!word) return;
  
  vocabList.push({ word, def, addedAt: todayStr() });
  saveToLocalStorage('tcf_vocab', vocabList);
  document.getElementById('vocabWord').value = '';
  document.getElementById('vocabDef').value = '';
  renderVocabList();
  updateBadges();
}

function renderVocabList() {
  const container = document.getElementById('vocabList');
  if (!container) return;
  
  if (!vocabList.length) {
    container.innerHTML = '<div class="card empty-state">Ajoutez des mots via le formulaire ci-dessus.</div>';
    return;
  }
  
  container.innerHTML = vocabList.map((v, i) => `
    <div class="list-item">
      <div class="list-item-text"><strong>${escHtml(v.word)}</strong> — ${escHtml(v.def || '(pas de définition)')}</div>
      <span class="del-x" onclick="deleteVocab(${i})">×</span>
    </div>
  `).join('');
}

function deleteVocab(idx) {
  vocabList.splice(idx, 1);
  saveToLocalStorage('tcf_vocab', vocabList);
  renderVocabList();
  updateBadges();
}

// ========== ERRORS ==========
function addError() {
  const wrong = document.getElementById('errWrong')?.value.trim();
  const right = document.getElementById('errRight')?.value.trim();
  if (!wrong) return;
  
  myErrors.push({ wrong, right, addedAt: todayStr() });
  saveToLocalStorage('tcf_errors', myErrors);
  document.getElementById('errWrong').value = '';
  document.getElementById('errRight').value = '';
  renderErrorsList();
  updateBadges();
}

function renderErrorsList() {
  const container = document.getElementById('errorsList');
  if (!container) return;
  
  if (!myErrors.length) {
    container.innerHTML = '<div class="card empty-state">Aucune erreur enregistrée.</div>';
    return;
  }
  
  container.innerHTML = myErrors.map((e, i) => `
    <div class="list-item">
      <div class="list-item-text">❌ ${escHtml(e.wrong)} → ✅ ${escHtml(e.right || '—')}</div>
      <span class="del-x" onclick="deleteError(${i})">×</span>
    </div>
  `).join('');
}

function deleteError(idx) {
  myErrors.splice(idx, 1);
  saveToLocalStorage('tcf_errors', myErrors);
  renderErrorsList();
  updateBadges();
}

// ========== BACKUP ==========
function downloadFullBackup() {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    productions, favorites, revisits, history, vocabList, myErrors, profile, streak
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `TCF_backup_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  addToHistory('💾 Sauvegarde téléchargée');
}

function restoreFromBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.productions) productions = data.productions;
        if (data.favorites) favorites = data.favorites;
        if (data.revisits) revisits = data.revisits;
        if (data.history) history = data.history;
        if (data.vocabList) vocabList = data.vocabList;
        if (data.myErrors) myErrors = data.myErrors;
        if (data.profile) profile = data.profile;
        if (data.streak) streak = data.streak;
        
        saveToLocalStorage('tcf_productions', productions);
        saveToLocalStorage('tcf_favorites', favorites);
        saveToLocalStorage('tcf_revisits', revisits);
        saveToLocalStorage('tcf_history', history);
        saveToLocalStorage('tcf_vocab', vocabList);
        saveToLocalStorage('tcf_errors', myErrors);
        saveToLocalStorage('tcf_profile', profile);
        saveToLocalStorage('tcf_streak', streak);
        
        alert('✅ Restauration réussie ! La page va se recharger.');
        location.reload();
      } catch (err) {
        alert('Erreur: fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ========== BADGES & STREAK ==========
function updateBadges() {
  const badges = {
    prodBadge: productions.length,
    favBadge: favorites.length,
    histBadge: history.length,
    vocabBadge: vocabList.length,
    errBadge: myErrors.length,
    readBadge: loadFromLocalStorage('tcf_reading_docs', []).length
  };
  Object.entries(badges).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
  
  const streakEl = document.getElementById('streakStrip');
  if (streakEl) streakEl.innerHTML = `🔥 Série : ${streak.cur || 0} jour${streak.cur !== 1 ? 's' : ''}`;
}

function bumpStreak() {
  const today = todayStr();
  if (streak.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  streak.cur = streak.lastDate === yesterday ? (streak.cur + 1) : 1;
  streak.best = Math.max(streak.best, streak.cur);
  streak.lastDate = today;
  saveToLocalStorage('tcf_streak', streak);
  updateBadges();
}

// ========== THEME & ACCENTS ==========
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'ù', 'û', 'î', 'ï', 'ô', 'É', 'È', 'À', 'Ç'];
let accentPage = 0;

function renderAccents() {
  const bar = document.getElementById('accentBar');
  if (!bar) return;
  const start = accentPage * 8;
  const pageAccents = ACCENTS.slice(start, start + 8);
  bar.innerHTML = pageAccents.map(a => `<button onclick="insertAccent('${a}')">${a}</button>`).join('');
}

function insertAccent(ch) {
  const start = editor.selectionStart;
  const val = editor.value;
  editor.value = val.slice(0, start) + ch + val.slice(start);
  editor.focus();
  onEditorInput();
}

function nextAccentPage() {
  accentPage = Math.min(Math.floor(ACCENTS.length / 8), accentPage + 1);
  renderAccents();
}

function prevAccentPage() {
  accentPage = Math.max(0, accentPage - 1);
  renderAccents();
}

// ========== MOBILE ==========
function toggleMobileSidebar() {
  document.querySelector('.sidebar').classList.toggle('mobile-open');
  document.getElementById('sidebarOverlay').classList.toggle('mobile-open');
}

function closeMobileSidebar() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('mobile-open');
}

// ========== INITIALIZATION ==========
function init() {
  // Load theme
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  
  // Load saved drafts
  const savedDraft = localStorage.getItem('tcf_last_draft');
  if (savedDraft && editor) editor.value = savedDraft;
  
  // Apply profile to UI
  applyProfileToUI();
  
  // Render accents
  renderAccents();
  
  // Update badges
  updateBadges();
  
  // Set up message listener for mock iframes
  window.addEventListener('message', (e) => {
    if (e.data === 'closeMock') {
      document.getElementById('view-listening').style.display = 'none';
      document.getElementById('view-reading_mock').style.display = 'none';
      showView('studio');
    }
  });
  
  // Initial view
  showView('studio');
  
  addToHistory('🎬 Application démarrée');
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
