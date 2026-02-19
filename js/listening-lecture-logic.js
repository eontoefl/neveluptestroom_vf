// Listening - 렉쳐 로직 (어댑터)
// LectureComponent를 사용하는 어댑터
// v=006

console.log('✅ listening-lecture-logic.js 로드 시작 (LectureComponent 어댑터)');

// 컴포넌트 인스턴스
let currentLectureComponent = null;

async function initLectureComponent(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initLectureComponent - setId: ${setId}`);
    currentLectureComponent = new LectureComponent(setId, {
        onComplete: (results) => {
            console.log(`✅ [모듈] Lecture Component 완료`);
            if (onCompleteCallback) onCompleteCallback(results);
        },
        onError: (error) => console.error(`❌ [모듈] Lecture Component 오류:`, error),
        onTimerStart: () => {
            console.log(`⏰ [모듈] Lecture 타이머 시작 (30초)`);
            if (window.moduleController) {
                window.moduleController.startQuestionTimer(30);
            }
        }
    });
    
    // 전역으로 노출 (ModuleController에서 접근)
    window.currentLectureComponent = currentLectureComponent;
    
    await currentLectureComponent.init();
}

/**
 * 렉쳐 초기화
 * Module에서 호출됨 (화면 전환 후)
 */
async function initListeningLecture(setNumber = 1) {
    console.log(`[어댑터] initListeningLecture 호출 - setNumber: ${setNumber}`);
    
    try {
        // LectureComponent 생성
        currentLectureComponent = new LectureComponent(setNumber, function(resultData) {
            console.log('[어댑터] LectureComponent 완료 콜백 호출됨');
            console.log('[어댑터] resultData:', resultData);
            
            // 결과 화면 표시
            showLectureResults();
        });
        
        // 초기화
        await currentLectureComponent.init();
        
    } catch (error) {
        console.error('[어댑터] initListeningLecture 실패:', error);
        alert('렉쳐 듣기를 시작할 수 없습니다.');
    }
}

/**
 * 제출 (Module에서 버튼 클릭 시 호출)
 */
function submitListeningLecture() {
    console.log('[어댑터] submitListeningLecture 호출됨');
    
    if (!currentLectureComponent) {
        console.error('[어댑터] currentLectureComponent가 없습니다');
        return;
    }
    
    // 컴포넌트의 submit() 호출
    currentLectureComponent.submit();
}

/**
 * 다음 문제 - Component 어댑터
 */
function nextLectureQuestion() {
    if (currentLectureComponent) {
        const hasNext = currentLectureComponent.nextQuestion();
        if (!hasNext) {
            // 마지막 문제면 자동 제출
            submitListeningLecture();
        }
    }
}

window.initLectureComponent = initLectureComponent;
window.initListeningLecture = initListeningLecture;
window.submitListeningLecture = submitListeningLecture;
window.nextLectureQuestion = nextLectureQuestion;

// ========================================
// 🎯 결과 화면 함수 (기존 유지)
// ========================================

/**
 * 결과 화면 표시
 * ✅ 활성화: 예전 버전 (제대로 작동하던 버전)
 * listeningLectureResult 키를 사용
 */
function showLectureResults() {
    console.log('🎯 [결과 화면] showLectureResults() 시작 (예전 버전 복구)');
    
    // sessionStorage에서 결과 가져오기
    const resultsJson = sessionStorage.getItem('listeningLectureResult');
    console.log('📦 [결과 화면] sessionStorage에서 가져온 JSON:', resultsJson);
    
    if (!resultsJson) {
        console.error('❌ [결과 화면] 결과 데이터가 없습니다');
        alert('결과 데이터를 찾을 수 없습니다.');
        return;
    }
    
    let resultData;
    try {
        resultData = JSON.parse(resultsJson);
        console.log('✅ [결과 화면] 파싱된 resultData:', resultData);
    } catch (e) {
        console.error('❌ [결과 화면] JSON 파싱 실패:', e);
        alert('결과 데이터를 읽을 수 없습니다.');
        return;
    }
    
    // 점수 계산
    const totalCorrect = resultData.totalCorrect || 0;
    const totalIncorrect = resultData.totalIncorrect || 0;
    const totalQuestions = resultData.totalQuestions || 4;
    const score = resultData.score || 0;
    
    console.log(`📊 [결과 화면] 점수: ${score}% (정답: ${totalCorrect}, 오답: ${totalIncorrect})`);
    
    // 점수 표시
    const scoreValueEl = document.getElementById('lectureResultScoreValue');
    if (scoreValueEl) {
        scoreValueEl.textContent = `${score}%`;
    }
    
    const correctCountEl = document.getElementById('lectureResultCorrectCount');
    if (correctCountEl) {
        correctCountEl.textContent = totalCorrect;
    }
    
    const incorrectCountEl = document.getElementById('lectureResultIncorrectCount');
    if (incorrectCountEl) {
        incorrectCountEl.textContent = totalIncorrect;
    }
    
    const totalCountEl = document.getElementById('lectureResultTotalCount');
    if (totalCountEl) {
        totalCountEl.textContent = totalQuestions;
    }
    
    // 세트별 결과 렌더링
    const detailsContainer = document.getElementById('lectureResultDetails');
    if (detailsContainer) {
        detailsContainer.innerHTML = renderLectureSetResult(resultData);
    }
    
    // 결과 화면 표시
    showScreen('listeningLectureResultScreen');
    console.log('✅ [결과 화면] 표시 완료');
}

/**
 * 세트 결과 렌더링
 */
function renderLectureSetResult(resultData) {
    console.log('🖼️ [세트 결과] renderLectureSetResult 시작');
    
    const audioUrl = resultData.audioUrl || '';
    const script = resultData.script || '';
    const scriptHighlights = resultData.scriptHighlights || [];
    const results = resultData.results || [];
    
    // 스크립트 렌더링 (화자 구분 없음)
    const scriptHtml = renderLectureScript(script, scriptHighlights);
    
    // 문제별 답안 렌더링
    const answersHtml = results.map((result, index) => {
        return renderLectureAnswer(result, index);
    }).join('');
    
    return `
        <div class="result-set-section">
            <div class="result-set-header">
                <span class="section-icon">🎧</span>
                <span class="section-title">렉처 결과</span>
            </div>
            
            <!-- 오디오 재생 -->
            <div class="audio-replay-section">
                <div class="audio-replay-header">
                    <span class="audio-icon">🔊</span>
                    <span>렉처 오디오 다시 듣기</span>
                </div>
                <audio id="lectureResultAudio" src="${audioUrl}" controls style="width: 100%; margin-top: 10px;"></audio>
            </div>
            
            <!-- 스크립트 -->
            <div class="audio-script">
                ${scriptHtml}
            </div>
            
            <!-- 문제별 답안 -->
            <div class="questions-section">
                ${answersHtml}
            </div>
        </div>
    `;
}

/**
 * 스크립트 렌더링 (화자 구분 없음)
 */
function renderLectureScript(script, scriptHighlights) {
    console.log('📝 [스크립트] renderLectureScript 시작');
    
    if (!script) {
        return '<p style="color: #999;">스크립트가 없습니다.</p>';
    }
    
    let highlights = [];
    if (Array.isArray(scriptHighlights)) {
        highlights = scriptHighlights;
    }
    
    console.log('📝 [스크립트] highlights:', highlights);
    
    // 키워드 하이라이트
    let highlightedScript = escapeHtml(script);
    
    highlights.forEach(highlight => {
        const word = highlight.word;
        const translation = highlight.translation || '';
        const explanation = highlight.explanation || '';
        
        // 정규식으로 단어 찾기 (대소문자 구분 없이)
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
        highlightedScript = highlightedScript.replace(regex, match => {
            return `<span class="keyword-highlight" data-translation="${escapeHtml(translation)}" data-explanation="${escapeHtml(explanation)}">${match}</span>`;
        });
    });
    
    return `<div class="script-turn"><div class="script-text">${highlightedScript}</div></div>`;
}

/**
 * 문제별 답안 렌더링
 */
function renderLectureAnswer(result, index) {
    console.log(`📝 [답안 ${index + 1}] renderLectureAnswer 시작`);
    
    const questionText = result.questionText || '';
    const userAnswer = result.userAnswer;
    const correctAnswer = result.correctAnswer;
    const isCorrect = result.isCorrect;
    const options = result.options || [];
    const translations = result.translations || [];
    const explanations = result.explanations || [];
    
    const icon = isCorrect 
        ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' 
        : '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
    
    const userAnswerText = userAnswer !== undefined ? options[userAnswer] : '(답안 없음)';
    const correctAnswerText = options[correctAnswer] || '(정답 없음)';
    
    // 선택지 상세 해설
    const optionsDetailHtml = renderLectureOptionsExplanation(options, translations, explanations, correctAnswer);
    
    return `
        <div class="conver-result-item ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <span class="question-number">문제 ${index + 1}</span>
                <span class="result-status">
                    ${isCorrect ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : '<i class="fas fa-times-circle" style="color: #ef4444;"></i>'}
                </span>
            </div>
            
            <div class="question-text">${questionText}</div>
            ${result.questionTrans ? `<div class="question-translation">${result.questionTrans}</div>` : ''}
            
            <div class="answer-details" style="margin-top: 12px;">
                <div class="conver-answer-row">
                    <span class="conver-answer-label">내 답:</span>
                    <span class="conver-answer-value ${isCorrect ? '' : 'incorrect'}">${userAnswerText}</span>
                </div>
                <div class="conver-answer-row">
                    <span class="conver-answer-label">정답:</span>
                    <span class="conver-answer-value correct">${correctAnswerText}</span>
                </div>
            </div>
            ${optionsDetailHtml}
        </div>
    `;
}

/**
 * 선택지 상세 해설 렌더링
 */
function renderLectureOptionsExplanation(options, translations, explanations, correctAnswer) {
    console.log('📝 [해설] renderLectureOptionsExplanation 시작');
    
    const optionsHtml = options.map((option, index) => {
        const translation = translations[index] || '';
        const explanation = explanations[index] || '';
        const isCorrect = index === correctAnswer;
        const icon = isCorrect 
            ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' 
            : '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
        
        return `
            <div class="option-detail">
                <div class="option-header">
                    ${icon}
                    <strong>${option}</strong>
                </div>
                <div class="option-body">
                    <p><strong>번역:</strong> ${translation}</p>
                    <p><strong>해설:</strong> ${explanation}</p>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="options-explanation">
            <button class="toggle-explanation-btn" onclick="toggleLectureExplanation(this)">
                선택지 상세 해설 보기 <i class="fas fa-chevron-down"></i>
            </button>
            <div class="explanation-content" style="display: none;">
                ${optionsHtml}
            </div>
        </div>
    `;
}

/**
 * 해설 토글
 */
function toggleLectureExplanation(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.innerHTML = '선택지 상세 해설 숨기기 <i class="fas fa-chevron-up"></i>';
    } else {
        content.style.display = 'none';
        button.innerHTML = '선택지 상세 해설 보기 <i class="fas fa-chevron-down"></i>';
    }
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 정규식 이스케이프
 */
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 스케줄로 돌아가기
 */
function backToScheduleFromLectureResult() {
    console.log('[결과 화면] 스케줄로 돌아가기');
    showScreen('scheduleScreen');
}

console.log('✅ listening-lecture-logic.js 로드 완료 (LectureComponent 어댑터)');
console.log('✅ initListeningLecture 함수:', typeof initListeningLecture);
console.log('✅ submitListeningLecture 함수:', typeof submitListeningLecture);
