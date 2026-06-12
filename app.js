// ============================================
// TCF EE STUDIO - COMPLETE SUITE
// ============================================

// ============ DATA STORES ============
let currentQuestion = 0, score = 0, selectedAnswer = null, quizFinished = false, timer, timeLeft = 30;
let bestScore = localStorage.getItem('tcfBestScore') || 0;
let currentProfile = localStorage.getItem('currentProfile') || 'default';
let profiles = JSON.parse(localStorage.getItem('tcfProfiles')) || { default: {} };
let vocabularyData = [], connectorsData = [], errorsData = [], subjectsData = [], productionsData = [], confidenceHistory = [];
let themeCounts = { Society: 0, Technology: 0, Work: 0, Health: 0, Environment: 0, Education: 0, Immigration: 0, Energy: 0 };

// Accent Keyboard State
let currentCase = 'lowercase';
let currentSetIndex = 0;
const accentSets = [
    { name: 'Standard', lowercase: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'î', 'ï', 'ô', 'ù', 'û', 'ÿ', 'œ'], uppercase: ['É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ä', 'Ç', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'Ÿ', 'Œ'] },
    { name: 'Extended', lowercase: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ç', 'î', 'ï', 'ô', 'ù', 'û', 'ÿ', 'œ', 'á', 'í', 'ó', 'ú', 'ñ', 'ü'], uppercase: ['É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Ä', 'Ç', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'Ÿ', 'Œ', 'Á', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü'] },
    { name: 'Typing', lowercase: ['ain', 'ein', 'oin', 'ien', 'tion', 'age', 'ance', 'ence', 'ment', 'able', 'ible'], uppercase: ['AIN', 'EIN', 'OIN', 'IEN', 'TION', 'AGE', 'ANCE', 'ENCE', 'MENT', 'ABLE', 'IBLE'] }
];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    document.getElementById('totalQ').textContent = questions.length;
    document.getElementById('bestScore').textContent = bestScore;
    loadQuestion();
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Header buttons
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    document.getElementById('importCenterBtn')?.addEventListener('click', openImportModal);
    document.getElementById('exportCenterBtn')?.addEventListener('click', openExportModal);
    document.getElementById('smartResetBtn')?.addEventListener('click', openResetModal);
    document.getElementById('manageProfilesBtn')?.addEventListener('click', openProfileModal);
    document.getElementById('profileSelect')?.addEventListener('change', switchProfile);
    
    // Keyboard tab buttons
    document.getElementById('clearTextBtn')?.addEventListener('click', () => { document.getElementById('mainTextArea').value = ''; updateCharCount(); });
    document.getElementById('copyTextBtn')?.addEventListener('click', () => { document.getElementById('mainTextArea').select(); document.execCommand('copy'); showToast('Copied!'); });
    document.getElementById('mainTextArea')?.addEventListener('input', updateCharCount);
    document.getElementById('lowercaseBtn')?.addEventListener('click', () => setCase('lowercase'));
    document.getElementById('uppercaseBtn')?.addEventListener('click', () => setCase('uppercase'));
    document.getElementById('prevSetBtn')?.addEventListener('click', () => changeSet(-1));
    document.getElementById('nextSetBtn')?.addEventListener('click', () => changeSet(1));
    
    // Writing studio
    document.getElementById('analyzeSpellingBtn')?.addEventListener('click', analyzeSpelling
