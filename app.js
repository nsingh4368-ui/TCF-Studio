// TCF EE Studio - Complete Application

// ============ STATE ============
let currentMode = 'free'; // 'free' or 'combination'
let timerInterval = null;
let timerSeconds = 1800; // 30 minutes default
let timerRunning = false;
let currentCombination = null;

// Accent Keyboard State
let currentCase = 'lowercase';
let currentSetIndex = 0;
const accentSets = [
    { name: 'Standard', lowercase: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'î', 'ï', 'ô', 'ù', 'û', 'ÿ', 'œ'], uppercase: ['É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ä', 'Ç', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'Ÿ', 'Œ'] },
    { name: 'Extended', lowercase: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'î', 'ï', 'ô', 'ù', 'û', 'ÿ', 'œ', 'á', 'í', 'ó', 'ú', 'ñ', 'ü'], uppercase: ['É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ä', 'Ç', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'Ÿ', 'Œ', 'Á', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü'] },
    { name: 'Typing', lowercase: ['ain', 'ein', 'oin', 'ien', 'tion', 'age', 'ance', 'ence', 'ment', 'able', 'ible'], uppercase: ['AIN', 'EIN', 'OIN', 'IEN', 'TION', 'AGE', 'ANCE', 'ENCE', 'MENT', 'ABLE', 'IBLE'] }
];

// Saved responses
let savedResponses = JSON.parse(localStorage.getItem('tcfResponses')) || [];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initAccentKeyboard();
    initTimer();
    updateWordCounts();
    loadCombinationFilters();
    
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
});

function initEventListeners() {
    // Mode switching
    document.getElementById('freeModeBtn').addEventListener('click', () => switchMode('free'));
    document.getElementById('combinationModeBtn').addEventListener('click', () => switchMode('combination'));
    
    // Timer controls
    document.getElementById('startTimerBtn').addEventListener('click', toggleTimer);
    document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);
    
    // Action buttons
    document.getElementById('analyzeBtn').addEventListener('click', analyzeWriting);
    document.getElementById('saveResponseBtn').addEventListener('click', saveResponse);
    document.getElementById('clearBtn').addEventListener('click', clearText);
    
    // Dark mode
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Combination mode filters
    document.getElementById('monthFilter').addEventListener('change', loadCombinationFilters);
    document.getElementById('combinationFilter').addEventListener('change', loadCombination);
    document.getElementById('randomSubjectBtn').addEventListener('click', loadRandomCombination);
    
    // Word count updates
    document.getElementById('freeResponse').addEventListener('input', () => updateWordCount('free'));
    document.getElementById('combinationResponse').addEventListener('input', () => updateWordCount('combination'));
}

function switchMode(mode) {
    currentMode = mode;
    
    // Update UI
    document.getElementById('freeModeBtn').classList.toggle('active', mode === 'free');
    document.getElementById('combinationModeBtn').classList.toggle('active', mode === 'combination');
    document.getElementById('freeMode').classList.toggle('active', mode === 'free');
    document.getElementById('combinationMode').classList.toggle('active', mode === 'combination');
}

// ============ TIMER ============
function initTimer() {
    updateTimerDisplay();
}

function toggleTimer() {
    if (timerRunning) {
        stopTimer();
        document.getElementById('startTimerBtn').textContent = '▶ Start Timer';
    } else {
        startTimer();
        document.getElementById('startTimerBtn').textContent = '⏸ Pause';
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerRunning = true;
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            stopTimer();
            showToast("⏰ Time's up!", "warning");
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerRunning = false;
}

function resetTimer() {
    stopTimer();
    timerSeconds = 1800; // 30 minutes
    updateTimerDisplay();
    document.getElementById('startTimerBtn').textContent = '▶ Start Timer';
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timerMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timerSeconds').textContent = seconds.toString().padStart(2, '0');
}

// ============ WORD COUNT ============
function updateWordCount(type = 'both') {
    if (type === 'free' || type === 'both') {
        const freeText = document.getElementById('freeResponse').value;
        const freeWords = freeText.trim().split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('freeWordCount').textContent = freeWords;
    }
    if (type === 'combination' || type === 'both') {
        const comboText = document.getElementById('combinationResponse').value;
        const comboWords = comboText.trim().split(/\s+/).filter(w => w.length > 0).length;
        document.getElementById('combinationWordCount').textContent = comboWords;
    }
}

// ============ COMBINATION MODE ============
function loadCombinationFilters() {
    const monthFilter = document.getElementById('monthFilter').value;
    const comboSelect = document.getElementById('combinationFilter');
    
    let combinations = allCombinations;
    if (monthFilter !== 'all') {
        combinations = allCombinations.filter(c => c.monthKey.startsWith(monthFilter));
    }
    
    comboSelect.innerHTML = '<option value="all">🔢 All Combinations</option>';
    combinations.forEach(combo => {
        const option = document.createElement('option');
        option.value = combo.id;
        option.textContent = `${combo.month} - ${combo.name}`;
        comboSelect.appendChild(option);
    });
}

function loadCombination() {
    const comboId = document.getElementById('combinationFilter').value;
    if (comboId === 'all') return;
    
    const combo = allCombinations.find(c => c.id === comboId);
    if (!combo) return;
    
    currentCombination = combo;
    
    document.getElementById('task1Text').textContent = combo.task1 || 'No task specified';
    document.getElementById('task2Text').textContent = combo.task2 || 'No task specified';
    document.getElementById('doc1Text').textContent = combo.doc1 || 'No document provided';
    document.getElementById('doc2Text').textContent = combo.doc2 || 'No document provided';
}

function loadRandomCombination() {
    const randomIndex = Math.floor(Math.random() * allCombinations.length);
    const combo = allCombinations[randomIndex];
    
    // Update the select dropdown
    const comboSelect = document.getElementById('combinationFilter');
    comboSelect.value = combo.id;
    loadCombination();
    
    showToast(`Random subject: ${combo.month} - ${combo.name}`, "success");
}

// ============ ANALYSIS ============
function analyzeWriting() {
    const text = currentMode === 'free' 
        ? document.getElementById('freeResponse').value 
        : document.getElementById('combinationResponse').value;
    
    if (!text.trim()) {
        showToast("Please write something to analyze!", "warning");
        return;
    }
    
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Simple spelling checks (common mistakes)
    const commonMistakes = [
        { pattern: /cest\b/gi, correct: "c'est", desc: "Missing apostrophe: 'c'est' not 'cest'" },
        { pattern: /parce que/gi, correct: "parce que", desc: "Check spelling of 'parce que'" },
        { pattern: /il ya\b/gi, correct: "il y a", desc: "Should be 'il y a'" },
        { pattern: /beacoup\b/gi, correct: "beaucoup", desc: "Misspelling of 'beaucoup'" },
        { pattern: /temp\b/gi, correct: "temps", desc: "Did you mean 'temps' (time)?" },
        { pattern: /se\b(?!uil)/gi, correct: "ce/se", desc: "Check 'ce' vs 'se'" }
    ];
    
    const errors = [];
    commonMistakes.forEach(mistake => {
        if (mistake.pattern.test(text)) {
            errors.push(mistake);
        }
    });
    
    // Vocabulary overuse check
    const freq = {};
    words.forEach(w => {
        const clean = w.toLowerCase().replace(/[.,!?;:]/g, '');
        if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
    });
    const overused = Object.entries(freq).filter(([w, c]) => c > 3);
    
    // Display results
    const wordLimit = currentMode === 'free' ? "60-150" : 
        (wordCount < 120 ? "Tâche 1: 60-120 / Tâche 2-3: 120-150" : "varies");
    
    let wordStatus = '';
    if (currentMode === 'combination') {
        if (wordCount < 60) wordStatus = "⚠️ Below minimum (60 mots)";
        else if (wordCount > 150) wordStatus = "⚠️ Above maximum (150 mots)";
        else wordStatus = "✅ Within limit (60-150 mots)";
    } else {
        if (wordCount < 60) wordStatus = "⚠️ Below minimum (60 mots)";
        else if (wordCount > 150) wordStatus = "⚠️ Above maximum (150 mots)";
        else wordStatus = "✅ Within recommended limit (60-150 mots)";
    }
    
    document.getElementById('wordCountAnalysis').innerHTML = `
        <div class="error-item">📊 Word count: ${wordCount} mots - ${wordStatus}</div>
    `;
    
    document.getElementById('spellingCheck').innerHTML = errors.length > 0
        ? errors.map(e => `<div class="error-item">✍️ ${e.desc}: "${e.pattern.source}" → should be "${e.correct}"</div>`).join('')
        : '<div class="error-item" style="background:rgba(6,214,160,0.1)">✅ No common spelling errors detected!</div>';
    
    document.getElementById('vocabularyCheck').innerHTML = overused.length > 0
        ? `<div class="error-item">📝 Overused words: ${overused.map(([w, c]) => `"${w}" (${c}x)`).join(', ')}</div>`
        : '<div class="error-item" style="background:rgba(6,214,160,0.1)">✅ Good vocabulary variety!</div>';
    
    document.getElementById('analysisResults').style.display = 'block';
}

// ============ SAVE RESPONSE ============
function saveResponse() {
    const text = currentMode === 'free' 
        ? document.getElementById('freeResponse').value 
        : document.getElementById('combinationResponse').value;
    
    if (!text.trim()) {
        showToast("Nothing to save!", "warning");
        return;
    }
    
    const subject = currentMode === 'free' 
        ? "Free Writing" 
        : `${currentCombination?.month} - ${currentCombination?.name}`;
    
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    savedResponses.unshift({
        id: Date.now(),
        date: new Date().toLocaleString(),
        subject: subject,
        text: text,
        wordCount: words,
        mode: currentMode
    });
    
    // Keep only last 50 responses
    if (savedResponses.length > 50) savedResponses.pop();
    
    localStorage.setItem('tcfResponses', JSON.stringify(savedResponses));
    showToast("Response saved!", "success");
}

function clearText() {
    if (currentMode === 'free') {
        document.getElementById('freeResponse').value = '';
        updateWordCount('free');
    } else {
        document.getElementById('combinationResponse').value = '';
        updateWordCount('combination');
    }
    document.getElementById('analysisResults').style.display = 'none';
    showToast("Cleared!", "success");
}

// ============ ACCENT KEYBOARD ============
function initAccentKeyboard() {
    renderAccentGrid();
    
    document.getElementById('lowercaseBtn').addEventListener('click', () => setCase('lowercase'));
    document.getElementById('uppercaseBtn').addEventListener('click', () => setCase('uppercase'));
    document.getElementById('prevSetBtn').addEventListener('click', () => changeSet(-1));
    document.getElementById('nextSetBtn').addEventListener('click', () => changeSet(1));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleAccentShortcut);
}

function renderAccentGrid() {
    const accents = accentSets[currentSetIndex][currentCase];
    const grid = document.getElementById('accentGrid');
    grid.innerHTML = '';
    
    accents.forEach(accent => {
        const btn = document.createElement('button');
        btn.className = 'accent-btn';
        btn.textContent = accent;
        btn.addEventListener('click', () => insertAccent(accent));
        grid.appendChild(btn);
    });
    
    document.getElementById('currentSetName').textContent = accentSets[currentSetIndex].name;
}

function setCase(caseType) {
    currentCase = caseType;
    document.getElementById('lowercaseBtn').classList.toggle('active', caseType === 'lowercase');
    document.getElementById('uppercaseBtn').classList.toggle('active', caseType === 'uppercase');
    renderAccentGrid();
}

function changeSet(delta) {
    currentSetIndex = (currentSetIndex + delta + accentSets.length) % accentSets.length;
    renderAccentGrid();
}

function insertAccent(accent) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;
        activeElement.value = value.substring(0, start) + accent + value.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + accent.length;
        activeElement.focus();
        updateWordCount();
    } else {
        // If no textarea focused, focus the active one
        const textarea = currentMode === 'free' ? document.getElementById('freeResponse') : document.getElementById('combinationResponse');
        textarea.focus();
        insertAccent(accent);
    }
}

function handleAccentShortcut(e) {
    if (e.altKey) {
        const shortcuts = {
            'e': 'é', 'E': 'É',
            'a': 'à', 'A': 'À',
            'c': 'ç', 'C': 'Ç',
            'i': 'î', 'I': 'Î',
            'u': 'ù', 'U': 'Ù',
            'o': 'ô', 'O': 'Ô'
        };
        if (shortcuts[e.key]) {
            e.preventDefault();
            insertAccent(shortcuts[e.key]);
        }
    }
}

// ============ DARK MODE ============
function toggleDarkMode() {
    const body = document.body;
    const btn = document.getElementById('darkModeToggle');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        btn.textContent = '🌙';
        localStorage.setItem('darkMode', 'disabled');
    } else {
        body.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
        localStorage.setItem('darkMode', 'enabled');
    }
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#06d6a0' : type === 'error' ? '#ef476f' : '#ffd166';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: ${type === 'warning' ? '#333' : 'white'};
        padding: 12px 24px;
        border-radius: 40px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
