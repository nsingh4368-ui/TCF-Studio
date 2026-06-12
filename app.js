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
    document.getElementById('combinationModeBtn').classList.toggle('active', mode ===
