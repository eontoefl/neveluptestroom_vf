// Reading - 아카데믹리딩 (Academic Reading) 로직 v=008
// 
// ✅ 컴포넌트화 완료!
// - AcademicComponent: 실제 문제 풀이 로직
// - 이 파일: 어댑터 + 결과 화면

// ============================================
// 1. 어댑터 함수 (Component 사용)
// ============================================

let currentAcademicComponent = null;

/**
 * 모듈 시스템용 초기화 함수
 */
async function initAcademicComponent(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initAcademicComponent - setId: ${setId}`);
    
    // 기존 컴포넌트 정리
    if (currentAcademicComponent) {
        console.log(`🧹 [모듈] 이전 Academic Component 정리`);
        currentAcademicComponent._destroyed = true;
        if (currentAcademicComponent.cleanup) {
            currentAcademicComponent.cleanup();
        }
        currentAcademicComponent = null;
    }
    
    currentAcademicComponent = new AcademicComponent(setId);
    currentAcademicComponent.onComplete = (results) => {
        console.log(`✅ [모듈] Academic Component 완료`);
        currentAcademicComponent._completed = true;
        if (onCompleteCallback) onCompleteCallback(results);
    };
    await currentAcademicComponent.init();
}

/**
 * 아카데믹리딩 초기화 - Component 어댑터
 */
async function initReadingAcademic(setNumber) {
    console.log(`📖 [어댑터] initReadingAcademic - setNumber: ${setNumber}`);
    
    // Component 생성 (setNumber만 전달)
    currentAcademicComponent = new AcademicComponent(setNumber);
    
    // 완료 콜백 설정
    currentAcademicComponent.onComplete = (results) => {
        console.log(`✅ [어댑터] Component 완료 콜백 받음`);
        
        // Module 콜백이 있으면 전달
        if (window.moduleCallback) {
            window.moduleCallback(results);
        } else {
            // 일반 모드: sessionStorage에 저장
            if (!sessionStorage.getItem('academicResults')) {
                sessionStorage.setItem('academicResults', JSON.stringify([]));
            }
            const results_list = JSON.parse(sessionStorage.getItem('academicResults'));
            results_list.push(results);
            sessionStorage.setItem('academicResults', JSON.stringify(results_list));
            
            // 결과 화면 표시
            showAcademicResults();
        }
    };
    
    // 초기화
    await currentAcademicComponent.init();
}

/**
 * 아카데믹리딩 제출 - Component 어댑터
 */
function submitAcademic() {
    console.log(`📤 [어댑터] submitAcademic 호출`);
    
    if (currentAcademicComponent) {
        currentAcademicComponent.submit();
    } else {
        console.error(`❌ Component가 초기화되지 않았습니다`);
    }
}

/**
 * 다음 문제 - Component 어댑터
 * (Module 모드에서는 사용하지 않음)
 */
function academicNextQuestion() {
    if (currentAcademicComponent) {
        const hasNext = currentAcademicComponent.nextQuestion();
        if (!hasNext) {
            console.log('⚠️ 세트 내 마지막 문제입니다');
            
            // 모듈 모드일 때는 자동으로 submit
            if (window.isModuleMode) {
                console.log('📦 [모듈 모드] 세트 완료 → 자동 제출');
                // 이미 제출됐는지 확인
                if (!currentAcademicComponent._submitted && !currentAcademicComponent._completed && !currentAcademicComponent._destroyed) {
                    currentAcademicComponent._submitted = true;
                    currentAcademicComponent.submit();
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
function academicPrevQuestion() {
    if (currentAcademicComponent) {
        const hasPrev = currentAcademicComponent.previousQuestion();
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
function selectAcademicOption(value) {
    if (currentAcademicComponent) {
        currentAcademicComponent.selectOption(value);
    } else {
        console.warn(`⚠️ Component가 초기화되지 않았습니다`);
    }
}

// 전역으로 노출
window.initAcademicComponent = initAcademicComponent;
window.initReadingAcademic = initReadingAcademic;

// ============================================
// 2. 결과 화면 (기존 유지)
// ============================================

// 결과 화면 표시
function showAcademicResults() {
    console.log('📊 [아카데믹리딩] 결과 화면 표시');
    
    const academicResultsStr = sessionStorage.getItem('academicResults');
    if (!academicResultsStr) {
        console.error('❌ 결과 데이터가 없습니다');
        return;
    }
    
    const academicResults = JSON.parse(academicResultsStr);
    
    // 전체 정답/오답 계산
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    academicResults.forEach(setResult => {
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
    document.getElementById('academicResultScoreValue').textContent = totalScore + '%';
    document.getElementById('academicResultCorrectCount').textContent = totalCorrect;
    document.getElementById('academicResultIncorrectCount').textContent = totalIncorrect;
    document.getElementById('academicResultTotalCount').textContent = totalQuestions;
    
    // Week/Day 정보
    const currentTest = JSON.parse(sessionStorage.getItem('currentTest') || '{"week":"Week 1","day":"월"}');
    const dayTitle = `${currentTest.week || 'Week 1'}, ${currentTest.day || '월'}요일 - 아카데믹리딩`;
    document.getElementById('academicResultDayTitle').textContent = dayTitle;
    
    // 세부 결과 렌더링
    const detailsContainer = document.getElementById('academicResultDetails');
    let detailsHTML = '';
    
    academicResults.forEach((setResult, setIdx) => {
        detailsHTML += renderAcademicSetResult(setResult, null, null, null, setIdx);
    });
    
    detailsContainer.innerHTML = detailsHTML;
    
    // 결과 화면 표시
    showScreen('readingAcademicResultScreen');
    
    // 이벤트 바인딩
    bindAcademicToggleEvents();
    
    // 결과 데이터 정리
    sessionStorage.removeItem('academicResults');
}

// 세트별 결과 렌더링
// 세트별 결과 렌더링 (2차 결과용)
function renderAcademicSetResult(setResult, secondAttemptData, firstResults, secondResults, startIndex) {
    // 파라미터가 숫자면 1차 결과 화면 (기존 로직)
    if (typeof secondAttemptData === 'number') {
        const setIdx = secondAttemptData;
        return renderAcademicSetResultOriginal(setResult, setIdx);
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
    
    // 각 문제 렌더링 (5개)
    setResult.answers.forEach((answer, qIdx) => {
        html += renderAcademicAnswers(answer, qIdx, startIndex, firstResults, secondResults);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// 문제별 결과 렌더링 (2차 결과용)
function renderAcademicAnswers(answer, qIdx, startIndex, firstResults, secondResults) {
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
    
    // 문제 번호 생성 (questionNum이 없으면 qIdx 사용)
    const questionNum = answer.questionNum || `Q${qIdx + 1}`;
    const toggleId = `academic-toggle-${questionIndex}`;
    
    // userAnswer를 숫자로 변환 (문자 'A', 'B', 'C', 'D' → 1, 2, 3, 4)
    let userAnswerIndex = answer.userAnswer;
    if (typeof userAnswerIndex === 'string') {
        const label = userAnswerIndex.toUpperCase();
        userAnswerIndex = label.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    }
    
    let html = `
        <div class="academic-result-item ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <span class="question-number">${questionNum}</span>
                <span class="result-status">${correctIcon}</span>
            </div>
            
            <div class="question-text">${answer.question}</div>
            <div class="question-translation">${answer.questionTranslation}</div>
            
            <div class="answer-summary">
                <div class="academic-answer-row">
                    <span class="academic-answer-label">내 답변:</span>
                    <span class="academic-answer-value user-answer ${feedbackClass}">
                        ${userAnswerIndex && answer.options && answer.options[userAnswerIndex - 1] 
                            ? answer.options[userAnswerIndex - 1].label + ') ' + answer.options[userAnswerIndex - 1].text 
                            : '미응답'}
                    </span>
                </div>
                <div class="academic-answer-row" style="padding-left: 80px;">
                    <span class="daily1-feedback-message ${feedbackClass}" style="font-size: 10pt;">${feedbackMessage}</span>
                </div>
                ${!isCorrect ? `
                <div class="academic-answer-row">
                    <span class="academic-answer-label">정답:</span>
                    <span class="academic-answer-value correct">
                        ${answer.options && answer.options[answer.correctAnswer - 1] 
                            ? answer.options[answer.correctAnswer - 1].label + ') ' + answer.options[answer.correctAnswer - 1].text
                            : '정답 없음'}
                    </span>
                </div>
                ` : ''}
            </div>
            
            ${renderAcademicOptionsExplanation(answer, toggleId)}
        </div>
    `;
    
    return html;
}

// 보기 상세 해설 렌더링
function renderAcademicOptionsExplanation(answer, toggleId) {
    // userAnswer를 숫자로 변환 (문자 'A', 'B', 'C', 'D' → 1, 2, 3, 4)
    let userAnswerIndex = answer.userAnswer;
    if (typeof userAnswerIndex === 'string') {
        const label = userAnswerIndex.toUpperCase();
        userAnswerIndex = label.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    }
    
    const userAnswerLabel = getLabelFromIndex(userAnswerIndex);
    const correctAnswerLabel = getLabelFromIndex(answer.correctAnswer);
    
    let html = `
        <div class="options-explanation-section">
            <button class="toggle-explanation-btn" onclick="toggleAcademicOptions('${toggleId}')">
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
function toggleAcademicOptions(toggleId) {
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

// 세트별 결과 렌더링 (1차 결과 화면용 - 기존 로직)
function renderAcademicSetResultOriginal(setResult, setIdx) {
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
    
    // 각 문제 렌더링 (5개) - 기존 로직
    setResult.answers.forEach((answer, qIdx) => {
        html += renderAcademicAnswersOriginal(answer, qIdx);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

// 문제별 결과 렌더링 (1차 결과 화면용 - 기존 로직)
function renderAcademicAnswersOriginal(answer, qIdx) {
    const isCorrect = answer.isCorrect;
    const correctIcon = isCorrect 
        ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' 
        : '<i class="fas fa-times-circle" style="color: var(--danger-color);"></i>';
    
    let html = `
        <div class="academic-result-item ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <span class="question-number">${answer.questionNum}</span>
                <span class="result-status">${correctIcon}</span>
            </div>
            
            <div class="question-text">${answer.question}</div>
            <div class="question-translation">${answer.questionTranslation}</div>
            
            <div class="answer-summary">
                <div class="academic-answer-row">
                    <span class="academic-answer-label">내 답변:</span>
                    <span class="academic-answer-value ${isCorrect ? 'correct' : 'incorrect'}">
                        ${answer.userAnswer ? answer.options[answer.userAnswer - 1].label + ') ' + answer.options[answer.userAnswer - 1].text : '미응답'}
                    </span>
                </div>
                ${!isCorrect ? `
                <div class="academic-answer-row">
                    <span class="academic-answer-label">정답:</span>
                    <span class="academic-answer-value correct">
                        ${answer.correctAnswer ? answer.options[answer.correctAnswer - 1].label + ') ' + answer.options[answer.correctAnswer - 1].text : ''}
                    </span>
                </div>
                ` : ''}
            </div>
            
            ${renderAcademicOptionsExplanation(answer)}
        </div>
    `;
    
    return html;
}

// 인터랙티브 단어 툴팁 이벤트 바인딩
function bindAcademicToggleEvents() {
    // 인터랙티브 단어 툴팁
    const interactiveWords = document.querySelectorAll('.interactive-word');
    interactiveWords.forEach(word => {
        word.addEventListener('mouseenter', showAcademicTooltip);
        word.addEventListener('mouseleave', hideAcademicTooltip);
    });
}

// 툴팁 표시
function showAcademicTooltip(event) {
    const word = event.target;
    const translation = word.getAttribute('data-translation');
    const explanation = word.getAttribute('data-explanation');
    
    // 기존 툴팁 제거
    const existingTooltip = document.querySelector('.academic-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // 새 툴팁 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'academic-tooltip';
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
function hideAcademicTooltip() {
    const tooltip = document.querySelector('.academic-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// 학습 일정으로 돌아가기
function backToScheduleFromAcademicResult() {
    sessionStorage.removeItem('academicResults');
    backToScheduleFromResult();
}

// ============================================
// 3. 전역 노출 (최종 해설 화면용)
// ============================================
window.showAcademicResults = showAcademicResults;
window.renderAcademicSetResult = renderAcademicSetResult;
window.renderAcademicAnswers = renderAcademicAnswers;
window.renderAcademicOptionsExplanation = renderAcademicOptionsExplanation;
window.toggleAcademicOptions = toggleAcademicOptions;
window.bindAcademicToggleEvents = bindAcademicToggleEvents;

console.log('✅ [아카데믹 리딩] 전역 함수 노출 완료');
