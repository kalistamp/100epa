let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const setupContainer = document.getElementById('setup-container');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedback = document.getElementById('feedback');
const scoreDisplay = document.getElementById('score');
const questionNumberDisplay = document.getElementById('question-number');

startBtn.addEventListener('click', () => {
    const section = document.getElementById('section-select').value;
    if (section === 'all') {
        currentQuestions = [...questions.core, ...questions.type1, ...questions.type2, ...questions.type3];
    } else {
        currentQuestions = questions[section];
    }
    
    // Shuffle questions
    currentQuestions.sort(() => Math.random() - 0.5);
    
    setupContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    showQuestion();
});

function showQuestion() {
    resetState();
    const q = currentQuestions[currentQuestionIndex];
    questionNumberDisplay.innerText = `Question ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    questionText.innerText = q.question;

    q.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectOption(button, index, q.answer));
        optionsContainer.appendChild(button);
    });
}

function resetState() {
    nextBtn.classList.add('hidden');
    feedback.classList.add('hidden');
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

function selectOption(button, index, correctIndex) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    if (index === correctIndex) {
        button.classList.add('correct');
        score++;
        feedback.innerText = "Correct!";
        feedback.style.color = "green";
    } else {
        button.classList.add('incorrect');
        allButtons[correctIndex].classList.add('correct');
        feedback.innerText = "Incorrect.";
        feedback.style.color = "red";
    }

    feedback.classList.remove('hidden');
    scoreDisplay.innerText = `Score: ${score}`;
    nextBtn.classList.remove('hidden');
}

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    document.getElementById('final-score').innerText = `You got ${score} out of ${currentQuestions.length} correct.`;
}
