document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const loadingMsg = document.getElementById('loading-msg');
    
    const quizForm = document.getElementById('quiz-form');
    const quizContainer = document.getElementById('quiz-container');
    const submitBtn = document.getElementById('submit-btn');
    
    const scoreDisplay = document.getElementById('score-display');
    const scoreValue = document.getElementById('score-value');
    const scoreMessage = document.getElementById('score-message');
    const retryBtn = document.getElementById('retry-btn');
    
    const wrongAnswersContainer = document.getElementById('wrong-answers-container');
    const wrongAnswersList = document.getElementById('wrong-answers-list');

    // Data Storage
    let fullQuestionPool = []; // All questions
    let currentExamQuestions = []; // The 100 selected

    // 1. Fetch and Parse CSV
    // We add a timestamp query parameter (?v=...) to force the browser to download the latest file version
    fetch('questions.csv?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            try {
                fullQuestionPool = parseCSV(csvText);
                
                if (fullQuestionPool.length === 0) {
                    throw new Error("No questions found in CSV.");
                }

                // Enable start button once data is loaded
                loadingMsg.textContent = `Loaded ${fullQuestionPool.length} questions ready.`;
                loadingMsg.style.color = "green";
                startBtn.disabled = false;
            } catch (e) {
                console.error("Parsing Error:", e);
                loadingMsg.innerHTML = `<span style="color:red;">Error parsing questions: ${e.message}</span>`;
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            loadingMsg.innerHTML = `<span style="color:red;">Error loading database: ${error.message}<br>Make sure 'questions.csv' is in the main folder.</span>`;
        });

    // 2. Start Exam Logic
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startNewExam();
        });
    }

    function startNewExam() {
        // Generate 100 random questions (allowing duplicates)
        currentExamQuestions = [];
        const totalQuestions = fullQuestionPool.length;
        
        // Safety check
        if (totalQuestions === 0) {
            alert("No questions loaded.");
            return;
        }

        for (let i = 0; i < 100; i++) {
            const randomIndex = Math.floor(Math.random() * totalQuestions);
            currentExamQuestions.push(fullQuestionPool[randomIndex]);
        }

        renderQuiz();
        
        // Switch Views
        startScreen.classList.add('hidden');
        scoreDisplay.classList.add('hidden');
        quizForm.classList.remove('hidden');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 3. Render Quiz
    function renderQuiz() {
        quizContainer.innerHTML = '';
        currentExamQuestions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.dataset.id = index;

            let optionsHtml = '';
            for (const [key, value] of Object.entries(q.options)) {
                if (value) {
                    optionsHtml += `
                        <label id="label-${index}-${key}">
                            <input type="radio" name="question-${index}" value="${key}">
                            <span class="opt-text">${key}. ${value}</span>
                        </label>
                    `;
                }
            }

            card.innerHTML = `
                <div class="question-text">${index + 1}. ${q.question}</div>
                <div class="options">${optionsHtml}</div>
                <div class="feedback" id="feedback-${index}"></div>
            `;
            quizContainer.appendChild(card);
        });
        
        submitBtn.classList.remove('hidden');
    }

    // 4. Handle Submission
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            let score = 0;
            let wrongAnswers = [];

            currentExamQuestions.forEach((q, index) => {
                const selected = document.querySelector(`input[name="question-${index}"]:checked`);
                const feedbackDiv = document.getElementById(`feedback-${index}`);
                const card = quizContainer.children[index];
                
                // Reset styles
                const labels = card.querySelectorAll('label');
                labels.forEach(l => l.classList.remove('correct-answer-highlight', 'wrong-answer-highlight'));
                feedbackDiv.innerHTML = '';

                let userVal = null;
                if (selected) {
                    userVal = selected.value;
                    if (userVal === q.answer) {
                        score++;
                        document.getElementById(`label-${index}-${userVal}`).classList.add('correct-answer-highlight');
                    } else {
                        document.getElementById(`label-${index}-${userVal}`).classList.add('wrong-answer-highlight');
                        const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
                        if(correctLabel) correctLabel.classList.add('correct-answer-highlight');
                        feedbackDiv.innerHTML = `<span style="color: #721c24;">Incorrect. The correct answer is ${q.answer}.</span>`;
                        
                        wrongAnswers.push({
                            qNum: index + 1,
                            question: q.question,
                            userAnswerText: q.options[userVal],
                            correctAnswerText: q.options[q.answer]
                        });
                    }
                } else {
                    // No Answer
                    feedbackDiv.innerHTML = `<span style="color: #721c24;">You didn't answer this question. Correct answer: ${q.answer}</span>`;
                    const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
                    if(correctLabel) correctLabel.classList.add('correct-answer-highlight');

                    wrongAnswers.push({
                        qNum: index + 1,
                        question: q.question,
                        userAnswerText: "No Answer Selected",
                        correctAnswerText: q.options[q.answer]
                    });
                }
            });

            // Calculate Score
            const percentage = Math.round((score / currentExamQuestions.length) * 100);
            scoreValue.textContent = percentage;
            
            if (percentage >= 80) {
                scoreMessage.textContent = "Great job! You passed.";
                scoreMessage.style.color = "green";
            } else {
                scoreMessage.textContent = "Keep studying and try again.";
                scoreMessage.style.color = "red";
            }

            // Generate Wrong Answer Review List
            if (wrongAnswers.length > 0) {
                wrongAnswersContainer.classList.remove('hidden');
                wrongAnswersList.innerHTML = wrongAnswers.map(item => `
                    <li>
                        <span class="wrong-summary-q">Q${item.qNum}: ${item.question}</span>
                        <div style="color: #721c24;"><strong>Your Answer:</strong> ${item.userAnswerText}</div>
                        <div style="color: #155724;"><strong>Correct Answer:</strong> ${item.correctAnswerText}</div>
                    </li>
                `).join('');
            } else {
                wrongAnswersContainer.classList.add('hidden');
            }

            scoreDisplay.classList.remove('hidden');
            submitBtn.classList.add('hidden');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 5. Handle Retry
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            resetUI();
            startScreen.classList.remove('hidden');
        });
    }

    function resetUI() {
        quizForm.classList.add('hidden');
        scoreDisplay.classList.add('hidden');
        wrongAnswersContainer.classList.add('hidden');
        quizContainer.innerHTML = ''; 
    }

    // Robust CSV Parser
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        // Parse Headers
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        
        // Regex to match CSV fields (handles quotes and commas inside quotes)
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const line = lines[i];
            let matches = [];
            
            // IMPORTANT: Reset regex state for each new line
            regex.lastIndex = 0;
            
            let match = regex.exec(line);
            
            while (match && matches.length < headers.length) {
                // match[1] is the captured group. If undefined, treat as empty string.
                let rawVal = match[1] || "";
                // Remove surrounding quotes and unescape double quotes
                let val = rawVal.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                matches.push(val);
                match = regex.exec(line);
            }

            // Ensure we have enough columns (headers: Question, A, B, C, D, Answer)
            if (matches.length >= 6) {
                result.push({
                    id: i,
                    question: matches[0],
                    options: {
                        A: matches[1],
                        B: matches[2],
                        C: matches[3],
                        D: matches[4]
                    },
                    answer: matches[5].toUpperCase()
                });
            }
        }
        return result;
    }
});
