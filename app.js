let currentQuestion = 0;
let score = 0;
let selectedAnswer = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('totalQ').textContent = questions.length;
    loadQuestion();
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);
});

function loadQuestion() {
    const q = questions[currentQuestion];
    document.getElementById('question').textContent = q.text;
    document.getElementById('currentQ').textContent = currentQuestion + 1;
    document.getElementById('score').textContent = score;
    
    selectedAnswer = null;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = opt;
        optionDiv.onclick = () => selectAnswer(index);
        optionsDiv.appendChild(optionDiv);
    });
    
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = currentQuestion === questions.length - 1 ? 'Finish ✓' : 'Next →';
}

function selectAnswer(index) {
    selectedAnswer = index;
    const options = document.querySelectorAll('.option');
    options.forEach((opt, i) => {
        if (i === index) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

function nextQuestion() {
    if (selectedAnswer === null) {
        alert('Please select an answer!');
        return;
    }
    
    if (selectedAnswer === questions[currentQuestion].correct) {
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

function finishQuiz() {
    const percentage = Math.round((score / questions.length) * 100);
    document.getElementById('quiz-container').innerHTML = `
        <div class="result-box">
            <h2>🎉 Quiz Complete! 🎉</h2>
            <div class="result-score">${score}/${questions.length}</div>
            <div>Percentage: ${percentage}%</div>
            <button class="restart-btn" onclick="location.reload()">Restart Quiz</button>
        </div>
    `;
    document.getElementById('nextBtn').style.display = 'none';
}
