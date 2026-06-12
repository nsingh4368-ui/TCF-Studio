// TCF Quiz App - Complete Feature Pack
let currentQuestion = 0;
let score = 0;
let selectedAnswer = null;
let quizFinished = false;
let timer;
let timeLeft = 30;
let timerRunning = false;
let bestScore = localStorage.getItem('tcfBestScore') || 0;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('totalQ').textContent = questions.length;
    document.getElementById('bestScore').textContent = bestScore;
    loadQuestion();
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
    document.getElementById('prevBtn')?.addEventListener('click', previousQuestion);
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    
    // Load saved theme
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
});

function loadQuestion() {
    // Stop any running timer
    if (timer) clearInterval(timer);
    
    const q = questions[currentQuestion];
    document.getElementById('question').textContent = q.text;
    document.getElementById('currentQ').textContent = currentQuestion + 1;
    document.getElementById('score').textContent = score;
    
    // Update progress bar
    const progressPercent = ((currentQuestion) / questions.length) * 100;
    document.getElementById('progressBarFill').style.width = `${progressPercent}%`;
    
    // Show/hide previous button
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.style.display = currentQuestion === 0 ? 'none' : 'block';
    }
    
    selectedAnswer = null;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = opt;
        optionDiv.setAttribute('data-index', index);
        optionDiv.onclick = () => selectAnswer(index);
        optionsDiv.appendChild(optionDiv);
    });
    
    // Reset timer
    timeLeft = 30;
    document.getElementById('timer').textContent = timeLeft;
    startTimer();
    
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = currentQuestion === questions.length - 1 ? '🏆 Finish Quiz' : 'Next →';
    
    // Remove any existing highlights
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('correct-highlight', 'wrong-highlight');
    });
}

function startTimer() {
    if (timer) clearInterval(timer);
    timerRunning = true;
    
    timer = setInterval(() => {
        if (!timerRunning || quizFinished) return;
        
        if (timeLeft <= 0) {
            // Time's up! Auto-move to next question
            clearInterval(timer);
            timerRunning = false;
            showToast("⏰ Time's up!", "warning");
            
            if (selectedAnswer === null) {
                // No answer selected, mark as wrong
                selectedAnswer = -1;
                setTimeout(() => nextQuestion(), 500);
            }
        } else {
            timeLeft--;
            document.getElementById('timer').textContent = timeLeft;
            
            // Update timer circle
            const progress = (timeLeft / 30) * 220;
            const timerProgress = document.querySelector('.timer-progress');
            if (timerProgress) {
                timerProgress.style.strokeDashoffset = 220 - progress;
                timerProgress.style.stroke = timeLeft <= 5 ? '#ef476f' : '#06d6a0';
            }
            
            // Warning color
            if (timeLeft <= 5) {
                document.getElementById('timer').style.color = '#ef476f';
            } else {
                document.getElementById('timer').style.color = '';
            }
        }
    }, 1000);
}

function selectAnswer(index) {
    if (quizFinished) return;
    if (selectedAnswer !== null) return; // Already answered
    
    selectedAnswer = index;
    
    const options = document.querySelectorAll('.option');
    const currentQ = questions[currentQuestion];
    const isCorrect = (index === currentQ.correct);
    
    options.forEach((opt, i) => {
        opt.classList.remove('selected');
        if (i === index) {
            opt.classList.add('selected');
        }
    });
    
    // Visual feedback
    if (isCorrect) {
        showToast("✓ Correct! +1 point", "success");
        // Vibrate on correct (if supported)
        if (navigator.vibrate) navigator.vibrate(50);
    } else {
        showToast(`✗ Incorrect! Correct: ${currentQ.options[currentQ.correct]}`, "error");
        if (navigator.vibrate) navigator.vibrate(100);
        
        // Highlight correct answer in green
        options.forEach((opt, i) => {
            if (i === currentQ.correct) {
                opt.classList.add('correct-highlight');
            }
            if (i === index) {
                opt.classList.add('wrong-highlight');
            }
        });
    }
}

function nextQuestion() {
    if (quizFinished) return;
    
    // Check if answer selected (or auto-failed from timer)
    if (selectedAnswer === null && timeLeft > 0) {
        showToast("Please select an answer!", "warning");
        return;
    }
    
    // Stop timer
    if (timer) clearInterval(timer);
    timerRunning = false;
    
    // Check correctness
    const currentQ = questions[currentQuestion];
    if (selectedAnswer === currentQ.correct) {
        score++;
        document.getElementById('score').textContent = score;
    }
    
    currentQuestion++;
    
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

function finishQuiz() {
    quizFinished = true;
    if (timer) clearInterval(timer);
    
    const percentage = Math.round((score / questions.length) * 100);
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('tcfBestScore', bestScore);
        document.getElementById('bestScore').textContent = bestScore;
    }
    
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
        emoji = '🏆';
        message = 'Excellent! You\'re a French master! 🇫🇷';
    } else if (percentage >= 70) {
        emoji = '🎉';
        message = 'Very good! Keep practicing!';
    } else if (percentage >= 50) {
        emoji = '👍';
        message = 'Good effort! Review and try again.';
    } else {
        emoji = '💪';
        message = 'Keep learning! Practice makes perfect.';
    }
    
    // Celebration for perfect score
    if (percentage === 100) {
        createConfetti();
        showToast("🏆 PERFECT SCORE! 🏆", "success");
    }
    
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `
        <div class="result-box">
            <h2>${emoji} Quiz Complete! ${emoji}</h2>
            <div class="result-score">${score}/${questions.length}</div>
            <div class="result-message">${message}</div>
            <div class="result-percentage">🎯 ${percentage}%</div>
            ${score === bestScore && score > 0 ? '<div class="record-badge">🏅 NEW RECORD! 🏅</div>' : ''}
            <button class="restart-btn" onclick="restartQuiz()">⟳ Restart Quiz</button>
        </div>
    `;
    
    document.getElementById('nextBtn').style.display = 'none';
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.style.display = 'none';
}

function restartQuiz() {
    currentQuestion = 0;
    score = 0;
    selectedAnswer = null;
    quizFinished = false;
    timeLeft = 30;
    
    // Reload the quiz
    location.reload();
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.textContent = message;
    const bgColor = type === 'success' ? '#06d6a0' : type === 'error' ? '#ef476f' : '#ffd166';
    const textColor = type === 'warning' ? '#333' : 'white';
    
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: ${textColor};
        padding: 12px 24px;
        border-radius: 40px;
        font-weight: 500;
        z-index: 2000;
        animation: slideUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 14px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function createConfetti() {
    const colors = ['#4361ee', '#7209b7', '#06d6a0', '#ffd166', '#ef476f'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            opacity: 0.9;
            pointer-events: none;
            z-index: 9999;
            animation: fall ${Math.random() * 2 + 2}s linear forwards;
            border-radius: 2px;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

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

// Add animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .record-badge {
        background: gold;
        color: #333;
        padding: 8px 16px;
        border-radius: 40px;
        margin: 15px auto;
        display: inline-block;
        font-weight: bold;
    }
`;
document.head.appendChild(style);
