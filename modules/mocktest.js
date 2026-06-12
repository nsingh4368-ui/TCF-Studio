// ============ MOCK TESTS MODULE ============

// Simulated mock test data
const MOCK_TESTS = {
    listening: [
        { id: 1, title: "Test Écoute 1", audio: "https://example.com/audio1.mp3", questions: [{ text: "Quelle est la couleur du ciel ?", options: ["Bleu", "Rouge", "Vert", "Jaune"], correct: "A" }] }
    ],
    reading: [
        { id: 1, title: "Test Lecture 1", text: "Le français est une belle langue.", questions: [{ text: "Quelle langue est mentionnée ?", options: ["Anglais", "Espagnol", "Français", "Allemand"], correct: "C" }] }
    ]
};

let currentMockTest = null;
let currentMockAnswers = [];

function initMockTests() {
    // Mock tests are ready
}

function startListeningMock(testId) {
    const test = MOCK_TESTS.listening.find(t => t.id === testId) || MOCK_TESTS.listening[0];
    currentMockTest = test;
    currentMockAnswers = new Array(test.questions.length).fill(null);
    
    const container = document.getElementById('listeningFrame');
    if (container) {
        container.srcdoc = renderListeningMockHTML(test);
    }
}

function startReadingMock(testId) {
    const test = MOCK_TESTS.reading.find(t => t.id === testId) || MOCK_TESTS.reading[0];
    currentMockTest = test;
    currentMockAnswers = new Array(test.questions.length).fill(null);
    
    const container = document.getElementById('readingMockFrame');
    if (container) {
        container.srcdoc = renderReadingMockHTML(test);
    }
}

function renderListeningMockHTML(test) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body{background:#0c0e14;color:#dde1ef;font-family:sans-serif;padding:20px}
                .question{margin-bottom:20px;padding:15px;background:#1a1f2e;border-radius:12px}
                .option{padding:10px;margin:5px 0;background:#252d42;border-radius:8px;cursor:pointer}
                .option:hover{background:#3b82f6}
                .btn{background:#3b82f6;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;margin-top:20px}
            </style>
        </head>
        <body>
            <h2>🎧 ${escHtml(test.title)}</h2>
            <p>Audio: "Le texte audio serait joué ici dans la version complète"</p>
            ${test.questions.map((q, i) => `
                <div class="question">
                    <h4>Question ${i+1}: ${escHtml(q.text)}</h4>
                    ${q.options.map(opt => `
                        <div class="option" onclick="alert('Réponse sélectionnée: ${opt}')">${opt}</div>
                    `).join('')}
                </div>
            `).join('')}
            <button class="btn" onclick="alert('Mock test soumis!')">Soumettre</button>
        </body>
        </html>
    `;
}

function renderReadingMockHTML(test) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body{background:#0c0e14;color:#dde1ef;font-family:sans-serif;padding:20px}
                .text-box{background:#1a1f2e;padding:20px;border-radius:12px;margin-bottom:20px}
                .question{margin-bottom:20px;padding:15px;background:#1a1f2e;border-radius:12px}
                .option{padding:10px;margin:5px 0;background:#252d42;border-radius:8px;cursor:pointer}
                .option:hover{background:#3b82f6}
                .btn{background:#3b82f6;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;margin-top:20px}
            </style>
        </head>
        <body>
            <h2>📖 ${escHtml(test.title)}</h2>
            <div class="text-box">${escHtml(test.text)}</div>
            ${test.questions.map((q, i) => `
                <div class="question">
                    <h4>Question ${i+1}: ${escHtml(q.text)}</h4>
                    ${q.options.map(opt => `
                        <div class="option" onclick="alert('Réponse sélectionnée: ${opt}')">${opt}</div>
                    `).join('')}
                </div>
            `).join('')}
            <button class="btn" onclick="alert('Mock test soumis!')">Soumettre</button>
        </body>
        </html>
    `;
}

function submitListeningMock() {
    alert('Mock test soumis! (Version démo)');
}

function submitReadingMock() {
    alert('Mock test soumis! (Version démo)');
}
