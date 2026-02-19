// Reading - 일상리딩2 (Daily Reading 2) 로직
// 
// ✅ 컴포넌트화 완료!
// - Daily2Component: 실제 문제 풀이 로직
// - 이 파일: 어댑터 + 결과 화면

// ============================================
// 1. 어댑터 함수 (Component 사용)
// ============================================

let currentDaily2Component = null;

/**
 * 모듈 시스템용 초기화 함수
 */
async function initDaily2Component(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initDaily2Component - setId: ${setId}`);
    
    // 기존 컴포넌트 정리
    if (currentDaily2Component) {
        console.log(`🧹 [모듈] 이전 Daily2 Component 정리`);
        currentDaily2Component._destroyed = true;
        if (currentDaily2Component.cleanup) {
            currentDaily2Component.cleanup();
        }
        currentDaily2Component = null;
    }
    
    currentDaily2Component = new Daily2Component(setId, {
        onComplete: (results) => {
            console.log(`✅ [모듈] Daily2 Component 완료`);
            currentDaily2Component._completed = true;
            if (onCompleteCallback) onCompleteCallback(results);
        },
        onError: (error) => console.error(`❌ [모듈] Daily2 Component 오류:`, error)
    });
    await currentDaily2Component.init();
}

/**
 * 일상리딩2 초기화 - Component 어댑터
 */
async function initReadingDaily2(setNumber) {
    console.log(`📖 [어댑터] initReadingDaily2 - setNumber: ${setNumber}`);
    
    // Component 생성
    currentDaily2Component = new Daily2Component(setNumber, {
        onComplete: (results) => {
            console.log(`✅ [어댑터] Component 완료 콜백 받음`);
            
            // Module 콜백이 있으면 전달
            if (window.moduleCallback) {
                window.moduleCallback(results);
            } else {
                // 일반 모드: sessionStorage에 저장
                if (!sessionStorage.getItem('daily2Results')) {
                    sessionStorage.setItem('daily2Results', JSON.stringify([]));
                }
                const results_list = JSON.parse(sessionStorage.getItem('daily2Results'));
                results_list.push(results);
                sessionStorage.setItem('daily2Results', JSON.stringify(results_list));
                
                // 결과 화면 표시
                showDaily2Results();
            }
        },
        onError: (error) => {
            console.error(`❌ [어댑터] Component 오류:`, error);
            alert(`오류가 발생했습니다: ${error.message}`);
        }
    });
    
    // 초기화
    await currentDaily2Component.init();
}

/**
 * 일상리딩2 제출 - Component 어댑터
 */
function submitDaily2() {
    console.log(`📤 [어댑터] submitDaily2 호출`);
    
    if (currentDaily2Component) {
        currentDaily2Component.submit();
    } else {
        console.error(`❌ Component가 초기화되지 않았습니다`);
    }
}

/**
 * 다음 문제 - Component 어댑터
 * (Module 모드에서는 사용하지 않음)
 */
function daily2NextQuestion() {
    if (currentDaily2Component) {
        const hasNext = currentDaily2Component.nextQuestion();
        if (!hasNext) {
            console.log('⚠️ 세트 내 마지막 문제입니다');
            
            // 모듈 모드일 때는 자동으로 submit
            if (window.isModuleMode) {
                console.log('📦 [모듈 모드] 세트 완료 → 자동 제출');
                // 이미 제출됐는지 확인
                if (!currentDaily2Component._submitted && !currentDaily2Component._completed && !currentDaily2Component._destroyed) {
                    currentDaily2Component._submitted = true;
                    currentDaily2Component.submit();
                }
            }
        }
    } else {
        console.warn(`⚠️ Component가 초기화되지 않았습니다`);
    }
}

/**
 * 이전 문제 - Component 어댑터
 * (Module 모드에서는 사용하지 않음)
 */
function daily2PrevQuestion() {
    if (currentDaily2Component) {
        const hasPrev = currentDaily2Component.previousQuestion();
        if (!hasPrev) {
            console.log('⚠️ 세트 내 첫 문제입니다');
        }
    } else {
        console.warn(`⚠️ Component가 초기화되지 않았습니다`);
    }
}

/**
 * 보기 선택 - 전역 함수로 노출 (HTML에서 호출 가능)
 */
function selectDaily2Option(optionIndex) {
    if (currentDaily2Component) {
        currentDaily2Component.selectOption(optionIndex);
    } else {
        console.warn(`⚠️ Component가 초기화되지 않았습니다`);
    }
}

// 전역으로 노출
window.initDaily2Component = initDaily2Component;
window.initReadingDaily2 = initReadingDaily2;

// ============================================
// 2. 결과 화면 (기존 유지)
// ============================================

// 결과 화면 표시
function showDaily2Results() {
    console.log('📊 [일상리딩2] 결과 화면 표시');
    
    const daily2ResultsStr = sessionStorage.getItem('daily2Results');
    if (!daily2ResultsStr) {
        console.error('❌ 결과 데이터가 없습니다');
        return;
    }
    
    const daily2Results = JSON.parse(daily2ResultsStr);
    
    // 전체 정답/오답 계산
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    daily2Results.forEach(setResult => {
        setResult.answers.forEach(answer => {
            totalQuestions++;
            if (answer.isCorrect) {
                totalCorrect++;
            }
        });
    });
    
    const totalIncorrect = totalQuestions - totalCorrect;
    const totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    console.log('📊 총 문제:', totalQuestions);
    console.log('✅ 정답:', totalCorrect);
    console.log('❌ 오답:', totalIncorrect);
    console.log('💯 점수:', totalScore + '%');
    
    // 결과 UI 업데이트
    document.getElementById('daily2ResultScoreValue').textContent = totalScore + '%';
    document.getElementById('daily2ResultCorrectCount').textContent = totalCorrect;
    document.getElementById('daily2ResultIncorrectCount').textContent = totalIncorrect;
    document.getElementById('daily2ResultTotalCount').textContent = totalQuestions;
    
    // Week/Day 정보
    const currentTest = JSON.parse(sessionStorage.getItem('currentTest') || '{"week":"Week 1","day":"월"}');
    const dayTitle = `${currentTest.week || 'Week 1'}, ${currentTest.day || '월'}요일 - 일상리딩2`;
    document.getElementById('daily2ResultDayTitle').textContent = dayTitle;
    
    // 세부 결과 렌더링
    const detailsContainer = document.getElementById('daily2ResultDetails');
    let detailsHTML = '';
    
    daily2Results.forEach((setResult, setIdx) => {
        detailsHTML += renderDaily2SetResult(setResult, null, null, null, setIdx);
    });
    
    detailsContainer.innerHTML = detailsHTML;
    
    // 결과 화면 표시
    showScreen('readingDaily2ResultScreen');
    
    // 이벤트 바인딩
    bindDaily2ToggleEvents();
    
    // 결과 데이터 정리
    sessionStorage.removeItem('daily2Results');
}

// 세트별 결과 렌더링
// 세트별 결과 렌더링 (2차 결과용)
function renderDaily2SetResult(setResult, secondAttemptData, firstResults, secondResults, startIndex) {
    // 파라미터가 숫자면 1차 결과 화면 (기존 로직)
    if (typeof secondAttemptData === 'number') {
        const setIdx = secondAttemptData;
        return renderDaily2SetResultOriginal(setResult, setIdx);
    }
    
    // 2차 결과 화면 로직
    const setIdx = 0; // 세트 번호는 나중에 필요 시 추가
    let html = `
        <div class="result-set-section">
            <!-- 지문 영역 -->
            <div class="passage-section">
                <h4 class="passage-title">${setResult.passage.title}</h4>
                
                <!-- 원문과 해석을 한 줄씩 표시 -->
                <div class="passage-content-bilingual">
    `;
    
    // 지문 문장 분리
    const sentences = setResult.passage.content.match(/[^.!?]+[.!?]+/g) || [setResult.passage.content];
    const translations = setResult.passage.translations || [];
    
    sentences.forEach((sentence, idx) => {
        const translation = translations[idx] || '';
        
        // 인터랙티브 단어 하이라이트
        let highlightedSentence = sentence.trim();
        if (setResult.passage.interactiveWords) {
            setResult.passage.interactiveWords.forEach(wordObj => {
                const regex = new RegExp(`\\b${wordObj.word}\\b`, 'gi');
                highlightedSentence = highlightedSentence.replace(regex, 
                    `<span class="interactive-word" data-word="${wordObj.word}" data-translation="${wordObj.translation}" data-explanation="${wordObj.explanation}">${wordObj.word}</span>`
                );
            });
        }
        
        html += `
            <div class="sentence-pair">
                <div class="sentence-original">${highlightedSentence}</div>
                <div class="sentence-translation">${translation}</div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- 문제 영역 -->
            <div class="questions-section">
    `;
    
    // 각 문제 렌더링 (3개)
    setResult.answers.forEach((answer, qIdx) => {
        html += renderDaily2Answers(answer, qIdx, startIndex, firstResults, secondResults);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// 문제별 결과 렌더링 (2차 결과용)
function renderDaily2Answers(answer, qIdx, startIndex, firstResults, secondResults) {
    const questionIndex = startIndex !== undefined ? startIndex + qIdx : qIdx;
    
    // 1차, 2차 결과 확인
    const wasCorrectInFirst = firstResults ? firstResults[questionIndex] : answer.isCorrect;
    const isCorrectInSecond = secondResults ? secondResults[questionIndex] : answer.isCorrect;
    
    // 3가지 케이스 구분
    let feedbackClass = '';
    let feedbackMessage = '';
    
    if (wasCorrectInFirst) {
        // 1차 정답
        feedbackClass = 'first-correct';
        feedbackMessage = '👏 1차 때부터 정확하게 맞힌 문제예요! 정말 잘했어요! 👍';
    } else if (isCorrectInSecond) {
        // 1차 오답 → 2차 정답
        feedbackClass = 'improved';
        feedbackMessage = '🎯 1차에는 틀렸지만, 아무 도움 없이 스스로 고쳐 맞혔어요! 정말 대단해요! 다음엔 1차부터 맞힐 수 있을 거예요! 🚀';
    } else {
        // 1차 오답 → 2차 오답
        feedbackClass = 'still-wrong';
        feedbackMessage = '📝 1차, 2차 모두 틀린 문제예요. 조금 어려울 수 있으니 해설을 꼼꼼히 읽어보세요! 💪';
    }
    
    const isCorrect = isCorrectInSecond;
    const correctIcon = isCorrect 
        ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' 
        : '<i class="fas fa-times-circle" style="color: var(--danger-color);"></i>';
    
    const toggleId = `daily2-toggle-${questionIndex}`;
    
    let html = `
        <div class="daily2-result-item ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <span class="question-number">${answer.questionNum}.</span>
            </div>
            
            <div class="question-text">${answer.question}</div>
            ${answer.questionTranslation ? `
            <div class="question-translation">
                <i class="fas fa-comment-dots"></i> 문제 해석: ${answer.questionTranslation}
            </div>
            ` : ''}
            
            <div class="answer-summary">
                <div class="daily2-answer-row">
                    <span class="daily2-answer-label">내 답변:</span>
                    <span class="daily2-answer-value user-answer ${feedbackClass}">
                        ${answer.userAnswer ? answer.options[answer.userAnswer - 1].label + ') ' + answer.options[answer.userAnswer - 1].text : '미응답'}
                    </span>
                </div>
                <div class="daily2-answer-row" style="padding-left: 80px;">
                    <span class="daily1-feedback-message ${feedbackClass}" style="font-size: 10pt;">${feedbackMessage}</span>
                </div>
                ${!isCorrect ? `
                <div class="daily2-answer-row">
                    <span class="daily2-answer-label">정답:</span>
                    <span class="daily2-answer-value correct">
                        ${answer.options[answer.correctAnswer - 1].label}) ${answer.options[answer.correctAnswer - 1].text}
                    </span>
                </div>
                ` : ''}
            </div>
            
            ${renderDaily2OptionsExplanation(answer, toggleId)}
        </div>
    `;
    
    return html;
}

// 보기 상세 해설 렌더링
function renderDaily2OptionsExplanation(answer, toggleId) {
    const userAnswerLabel = getLabelFromIndex(answer.userAnswer);
    const correctAnswerLabel = getLabelFromIndex(answer.correctAnswer);
    
    let html = `
        <div class="options-explanation-section">
            <button class="toggle-explanation-btn" onclick="toggleDaily2Options('${toggleId}')">
                <span class="toggle-text">보기 상세 해설 펼치기</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            
            <div id="${toggleId}" class="options-details" style="display: none;">
    `;
    
    answer.options.forEach((option, idx) => {
        const isCorrect = (idx + 1) === answer.correctAnswer;
        const isUserAnswer = option.label === userAnswerLabel;
        const isCorrectAnswer = option.label === correctAnswerLabel;
        
        let badge = '';
        if (isCorrectAnswer) {
            badge = '<span class="option-badge correct-badge">✓ 정답</span>';
        } else if (isUserAnswer) {
            badge = '<span class="option-badge incorrect-badge">✗ 내가 선택한 오답</span>';
        }
        
        html += `
            <div class="option-detail ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="option-text">${option.label}) ${option.text} ${badge}</div>
                <div class="option-translation">${option.translation}</div>
                <div class="option-explanation ${isCorrect ? 'correct' : 'incorrect'}">
                    <strong>${isCorrect ? '정답 이유:' : '오답 이유:'}</strong>${option.explanation}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// 인덱스를 라벨로 변환 (1=A, 2=B, 3=C, 4=D)
function getLabelFromIndex(index) {
    if (!index) return '';
    return String.fromCharCode(64 + index);
}

// 보기 해설 토글
function toggleDaily2Options(toggleId) {
    const content = document.getElementById(toggleId);
    const btn = content.previousElementSibling;
    const icon = btn.querySelector('i');
    const text = btn.querySelector('.toggle-text');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
        text.textContent = '보기 상세 해설 접기';
    } else {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
        text.textContent = '보기 상세 해설 펼치기';
    }
}

// 인터랙티브 단어 툴팁 이벤트 바인딩
function bindDaily2ToggleEvents() {
    // 인터랙티브 단어 툴팁
    const interactiveWords = document.querySelectorAll('.interactive-word');
    interactiveWords.forEach(word => {
        word.addEventListener('mouseenter', showDaily2Tooltip);
        word.addEventListener('mouseleave', hideDaily2Tooltip);
    });
}

// 툴팁 표시
function showDaily2Tooltip(event) {
    const word = event.target;
    const translation = word.getAttribute('data-translation');
    const explanation = word.getAttribute('data-explanation');
    
    // 기존 툴팁 제거
    const existingTooltip = document.querySelector('.daily2-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // 새 툴팁 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'daily2-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-translation">${translation}</div>
        ${explanation ? `<div class="tooltip-explanation">${explanation}</div>` : ''}
    `;
    
    document.body.appendChild(tooltip);
    
    // 위치 계산
    const rect = word.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
}

// 툴팁 숨기기
function hideDaily2Tooltip() {
    const tooltip = document.querySelector('.daily2-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// 세트별 결과 렌더링 (1차 결과 화면용 - 기존 로직)
function renderDaily2SetResultOriginal(setResult, setIdx) {
    let html = `
        <div class="result-set-section">
            <div class="result-set-header">
                <h3>Set ${setIdx + 1}: ${setResult.mainTitle}</h3>
            </div>
            
            <!-- 지문 영역 -->
            <div class="passage-section">
                <h4 class="passage-title">${setResult.passage.title}</h4>
                
                <!-- 원문과 해석을 한 줄씩 표시 -->
                <div class="passage-content-bilingual">
    `;
    
    // 지문 문장 분리
    const sentences = setResult.passage.content.match(/[^.!?]+[.!?]+/g) || [setResult.passage.content];
    const translations = setResult.passage.translations || [];
    
    sentences.forEach((sentence, idx) => {
        const translation = translations[idx] || '';
        
        // 인터랙티브 단어 하이라이트
        let highlightedSentence = sentence.trim();
        if (setResult.passage.interactiveWords) {
            setResult.passage.interactiveWords.forEach(wordObj => {
                const regex = new RegExp(`\\b${wordObj.word}\\b`, 'gi');
                highlightedSentence = highlightedSentence.replace(regex, 
                    `<span class="interactive-word" data-word="${wordObj.word}" data-translation="${wordObj.translation}" data-explanation="${wordObj.explanation}">${wordObj.word}</span>`
                );
            });
        }
        
        html += `
            <div class="sentence-pair">
                <div class="sentence-original">${highlightedSentence}</div>
                <div class="sentence-translation">${translation}</div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <!-- 문제 영역 -->
            <div class="questions-section">
    `;
    
    // 각 문제 렌더링 (3개) - 기존 로직
    setResult.answers.forEach((answer, qIdx) => {
        html += renderDaily2AnswersOriginal(answer, qIdx);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// 문제별 결과 렌더링 (1차 결과 화면용 - 기존 로직)
function renderDaily2AnswersOriginal(answer, qIdx) {
    const isCorrect = answer.isCorrect;
    const correctIcon = isCorrect 
        ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' 
        : '<i class="fas fa-times-circle" style="color: var(--danger-color);"></i>';
    
    let html = `
        <div class="daily2-result-item ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <span class="question-number">${answer.questionNum}</span>
                <span class="result-status">${correctIcon}</span>
            </div>
            
            <div class="question-text">${answer.question}</div>
            <div class="question-translation">${answer.questionTranslation}</div>
            
            <div class="answer-summary">
                <div class="daily2-answer-row">
                    <span class="daily2-answer-label">내 답변:</span>
                    <span class="daily2-answer-value ${isCorrect ? 'correct' : 'incorrect'}">
                        ${answer.userAnswer ? answer.options[answer.userAnswer - 1].label + ') ' + answer.options[answer.userAnswer - 1].text : '미응답'}
                    </span>
                </div>
                ${!isCorrect ? `
                <div class="daily2-answer-row">
                    <span class="daily2-answer-label">정답:</span>
                    <span class="daily2-answer-value correct">
                        ${answer.correctAnswer ? answer.options[answer.correctAnswer - 1].label + ') ' + answer.options[answer.correctAnswer - 1].text : ''}
                    </span>
                </div>
                ` : ''}
            </div>
            
            ${renderDaily2OptionsExplanation(answer)}
        </div>
    `;
    
    return html;
}

// 학습 일정으로 돌아가기
function backToScheduleFromDaily2Result() {
    sessionStorage.removeItem('daily2Results');
    backToScheduleFromResult();
}

// ============================================
// 3. 전역 노출 (최종 해설 화면용)
// ============================================
window.showDaily2Results = showDaily2Results;
window.renderDaily2SetResult = renderDaily2SetResult;
window.renderDaily2Answers = renderDaily2Answers;
window.renderDaily2OptionsExplanation = renderDaily2OptionsExplanation;
window.toggleDaily2Options = toggleDaily2Options;
window.bindDaily2ToggleEvents = bindDaily2ToggleEvents;

console.log('✅ [일상리딩2] 전역 함수 노출 완료');
