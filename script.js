document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const startScreen = document.getElementById('start-screen');
    const startButtons = document.querySelectorAll('.start-btn');
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
    let fullQuestionPool = [];
    let currentExamQuestions = [];

    // 1. Fetch and Parse CSV
    fetch('questions.csv?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        })
        .then(csvText => {
            try {
                fullQuestionPool = parseCSV(csvText);
                if (fullQuestionPool.length === 0) throw new Error("No questions found in CSV.");

                loadingMsg.textContent = `Loaded ${fullQuestionPool.length} questions ready. Select an option below.`;
                loadingMsg.style.color = "green";
                startButtons.forEach(btn => btn.disabled = false);
            } catch (e) {
                console.error("Parsing Error:", e);
                loadingMsg.innerHTML = `<span style="color:red;">Error parsing questions: ${e.message}</span>`;
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            loadingMsg.innerHTML = `<span style="color:red;">Error loading database: ${error.message}</span>`;
        });

    // 2. Start Exam Logic
    if (startButtons.length > 0) {
        startButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const count = parseInt(e.target.dataset.count);
                startNewExam(count);
            });
        });
    }

    function startNewExam(questionCount) {
        currentExamQuestions = [];
        const totalQuestions = fullQuestionPool.length;
        
        if (totalQuestions === 0) {
            alert("No questions loaded.");
            return;
        }

        const limit = Math.min(questionCount, totalQuestions);
        const shuffled = [...fullQuestionPool].sort(() => 0.5 - Math.random());
        currentExamQuestions = shuffled.slice(0, limit);

        renderQuiz();
        
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

            // Determine if Multi-Select
            // We strip quotes just in case, though the parser handles it.
            // If comma exists, it's multi-select.
            const isMultiSelect = q.answer.includes(',');
            const inputType = isMultiSelect ? 'checkbox' : 'radio';
            const instructionHtml = isMultiSelect 
                ? '<span class="multi-badge">Select all that apply</span>' 
                : '';

            let optionsHtml = '';
            for (const [key, value] of Object.entries(q.options)) {
                if (value) {
                    optionsHtml += `
                        <label id="label-${index}-${key}" class="option-label">
                            <input type="${inputType}" name="question-${index}" value="${key}">
                            <span class="opt-text"><strong>${key}.</strong> ${value}</span>
                        </label>
                    `;
                }
            }

            card.innerHTML = `
                <div class="question-header">
                    <span class="q-number">${index + 1}.</span>
                    <span class="q-text">${q.question}</span>
                </div>
                ${instructionHtml}
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
                const card = quizContainer.children[index];
                const feedbackDiv = document.getElementById(`feedback-${index}`);
                
                // Get User Answers
                const checkedInputs = card.querySelectorAll(`input[name="question-${index}"]:checked`);
                const userValues = Array.from(checkedInputs).map(input => input.value);
                
                // Get Correct Answers (Handle "A,B" -> ["A", "B"])
                const correctValues = q.answer.split(',').map(val => val.trim());

                // Reset styles
                const labels = card.querySelectorAll('label');
                labels.forEach(l => l.classList.remove('correct-highlight', 'wrong-highlight', 'missed-highlight'));
                feedbackDiv.innerHTML = '';

                // Grading Logic (Strict Equality)
                // Sort both arrays to ensure order doesn't matter (A,B == B,A)
                const sortedUser = [...userValues].sort();
                const sortedCorrect = [...correctValues].sort();
                const isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

                // Visual Feedback
                // 1. Highlight ALL correct answers in Green (whether selected or not)
                correctValues.forEach(val => {
                    const lbl = document.getElementById(`label-${index}-${val}`);
                    if(lbl) lbl.classList.add('correct-highlight');
                });

                // 2. Highlight incorrect user selections in Red
                userValues.forEach(val => {
                    if (!correctValues.includes(val)) {
                        const lbl = document.getElementById(`label-${index}-${val}`);
                        if(lbl) lbl.classList.add('wrong-highlight');
                    }
                });

                if (isCorrect) {
                    score++;
                } else {
                    // Generate Wrong Answer Message
                    const userText = userValues.length > 0 ? userValues.join(', ') : "None";
                    feedbackDiv.innerHTML = `<span style="color: #721c24; font-weight:bold;">Incorrect.</span> Correct Answer: ${q.answer}`;
                    
                    wrongAnswers.push({
                        qNum: index + 1,
                        question: q.question,
                        userAnswerText: userValues.map(v => `${v}) ${q.options[v]}`).join(', ') || "No Answer",
                        correctAnswerText: correctValues.map(v => `${v}) ${q.options[v]}`).join(', ')
                    });
                }
            });

            // Calculate Score
            const percentage = Math.round((score / currentExamQuestions.length) * 100);
            scoreValue.textContent = percentage;
            
            if (percentage >= 80) {
                scoreMessage.textContent = "Great job! You passed.";
                scoreMessage.className = "pass-msg";
            } else {
                scoreMessage.textContent = "Keep studying and try again.";
                scoreMessage.className = "fail-msg";
            }

            // Results UI
            if (wrongAnswers.length > 0) {
                wrongAnswersContainer.classList.remove('hidden');
                wrongAnswersList.innerHTML = wrongAnswers.map(item => `
                    <li>
                        <div class="summary-q"><strong>Q${item.qNum}:</strong> ${item.question}</div>
                        <div class="summary-compare">
                            <div class="user-ans"><strong>You:</strong> ${item.userAnswerText}</div>
                            <div class="correct-ans"><strong>Correct:</strong> ${item.correctAnswerText}</div>
                        </div>
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

    // 5. Retry
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

    // Robust CSV Parser (Handle Quotes)
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        
        // Regex to match CSV fields (handles quotes and commas inside quotes)
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const line = lines[i];
            let matches = [];
            regex.lastIndex = 0;
            let match = regex.exec(line);
            
            while (match && matches.length < headers.length) {
                let rawVal = match[1] || "";
                let val = rawVal.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                matches.push(val);
                match = regex.exec(line);
            }

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
                    answer: matches[5].toUpperCase().replace(/\s/g, '') // remove spaces from "A, B"
                });
            }
        }
        return result;
    }
});
