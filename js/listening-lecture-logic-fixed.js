/**
 * ===================================
 * Listening - Lecture Component Logic
 * 예전 버전 (작동하던 버전) + CSS 완전 매칭
 * ===================================
 */

console.log('✅ listening-lecture-logic-fixed.js 로드 시작');

/**
 * 렉처 결과 화면 표시 (예전 버전 복구)
 */
function showLectureResults() {
    console.log('🎯 [결과 화면] showLectureResults() 시작');
    
    // sessionStorage에서 결과 가져오기 (두 가지 키 모두 확인)
    let resultsJson = sessionStorage.getItem('lectureResults');
    let isMultiSet = true;
    
    if (!resultsJson) {
        // fallback: 단일 세트 키
        resultsJson = sessionStorage.getItem('listeningLectureResult');
        isMultiSet = false;
        console.log('📦 [결과 화면] listeningLectureResult 키 사용 (단일 세트)');
    } else {
        console.log('📦 [결과 화면] lectureResults 키 사용 (복수 세트)');
    }
    
    if (!resultsJson) {
        console.error('❌ [결과 화면] 결과 데이터가 없습니다');
        alert('결과 데이터를 찾을 수 없습니다.');
        return;
    }
    
    let parsedData;
    try {
        parsedData = JSON.parse(resultsJson);
        console.log('✅ [결과 화면] 파싱된 데이터:', parsedData);
    } catch (e) {
        console.error('❌ [결과 화면] JSON 파싱 실패:', e);
        alert('결과 데이터를 읽을 수 없습니다.');
        return;
    }
    
    // 데이터를 배열로 통일
    let setsArray;
    if (isMultiSet && Array.isArray(parsedData)) {
        // lectureResults: [{세트1}, {세트2}] 형태
        setsArray = parsedData;
    } else if (Array.isArray(parsedData)) {
        setsArray = parsedData;
    } else {
        // listeningLectureResult: {단일 세트} 형태
        setsArray = [parsedData];
    }
    
    console.log(`📊 [결과 화면] 총 ${setsArray.length}개 세트`);
    
    // 전체 통계 계산
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalQuestions = 0;
    
    setsArray.forEach(setData => {
        const answers = setData.answers || setData.results || [];
        answers.forEach(answer => {
            totalQuestions++;
            if (answer.isCorrect) {
                totalCorrect++;
            } else {
                totalIncorrect++;
            }
        });
    });
    
    const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    console.log(`📊 [결과 화면] 점수: ${score}% (정답: ${totalCorrect}, 오답: ${totalIncorrect}, 총: ${totalQuestions})`);
    
    // 점수 표시
    const scoreValueEl = document.getElementById('lectureResultScoreValue');
    if (scoreValueEl) scoreValueEl.textContent = `${score}%`;
    
    const correctCountEl = document.getElementById('lectureResultCorrectCount');
    if (correctCountEl) correctCountEl.textContent = totalCorrect;
    
    const incorrectCountEl = document.getElementById('lectureResultIncorrectCount');
    if (incorrectCountEl) incorrectCountEl.textContent = totalIncorrect;
    
    const totalCountEl = document.getElementById('lectureResultTotalCount');
    if (totalCountEl) totalCountEl.textContent = totalQuestions;
    
    // 세트별 결과 렌더링
    const detailsContainer = document.getElementById('lectureResultDetails');
    if (detailsContainer) {
        let allHtml = '';
        setsArray.forEach((setData, setIdx) => {
            // answers/results 통일
            const normalizedSet = {
                ...setData,
                results: setData.answers || setData.results || []
            };
            allHtml += renderLectureSetResult(normalizedSet, setIdx);
        });
        detailsContainer.innerHTML = allHtml;
    }
    
    // 결과 화면 표시
    showScreen('listeningLectureResultScreen');
    console.log('✅ [결과 화면] 표시 완료');
}

/**
 * 세트 결과 렌더링 (Announcement와 동일한 구조)
 */
function renderLectureSetResult(resultData, setIdx = 0) {
    console.log(`🖼️ [세트 결과] renderLectureSetResult 시작 - 세트 ${setIdx + 1}`);
    
    const audioUrl = resultData.audioUrl || '';
    const script = resultData.script || '';
    const scriptTrans = resultData.scriptTrans || '';
    const scriptHighlights = resultData.scriptHighlights || [];
    const results = resultData.results || [];
    const setTitle = resultData.lectureTitle || resultData.setId || `세트 ${setIdx + 1}`;
    
    const audioId = `lecture-main-audio-${setIdx}`;
    
    let html = `
        <div class="result-set-section">
            <div class="result-set-header">
                <span class="section-icon">🎧</span>
                <span class="section-title">렉처 ${setIdx + 1} - ${setTitle}</span>
            </div>
    `;
    
    // 오디오 + 스크립트
    if (audioUrl || script) {
        html += `
            <div class="audio-section">
                <div class="audio-title">
                    <i class="fas fa-volume-up"></i>
                    <span>렉처 오디오 다시 듣기</span>
                </div>
                <div class="audio-player-container">
                    <button class="audio-play-btn" onclick="toggleLectureAudio('${audioId}')">
                        <i class="fas fa-play" id="${audioId}-icon"></i>
                    </button>
                    <div class="audio-seek-container">
                        <div class="audio-seek-bar" id="${audioId}-seek" onclick="seekLectureAudio('${audioId}', event)">
                            <div class="audio-seek-progress" id="${audioId}-progress" style="width: 0%">
                                <div class="audio-seek-handle"></div>
                            </div>
                        </div>
                        <div class="audio-time">
                            <span id="${audioId}-current">0:00</span> / <span id="${audioId}-duration">0:00</span>
                        </div>
                    </div>
                    <audio id="${audioId}" src="${audioUrl}"></audio>
                </div>
                ${script ? renderLectureScript(script, scriptTrans, scriptHighlights) : ''}
            </div>
        `;
    }
    
    html += `
            <div class="questions-section">
    `;
    
    // 각 문제 렌더링
    results.forEach((result, index) => {
        html += renderLectureAnswer(result, index);
    });
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * 스크립트 렌더링 (Announcement와 동일)
 */
function renderLectureScript(script, scriptTrans, scriptHighlights = []) {
    if (!script) return '';
    
    console.log('=== 스크립트 파싱 디버깅 ===');
    console.log('script:', script);
    console.log('scriptTrans:', scriptTrans);
    console.log('scriptHighlights:', scriptHighlights);
    
    // "Professor:" 제거
    let cleanScript = script.replace(/^(Professor|Woman|Man):\s*/i, '').trim();
    
    // 영어 스크립트를 문장 단위로 분리
    const sentences = cleanScript.split(/(?<=[.!?])\s+/);
    
    // 한국어 번역도 문장 단위로 분리
    const translations = scriptTrans ? scriptTrans.replace(/^(Professor|Woman|Man):\s*/i, '').split(/(?<=[.!?])\s+/) : [];
    
    console.log('  → 영어 문장 수:', sentences.length);
    console.log('  → 한국어 번역 수:', translations.length);
    
    let html = '<div class="audio-script">';
    
    // 각 문장마다 영어 → 한국어 순서로 표시
    sentences.forEach((sentence, index) => {
        const translation = translations[index] || '';
        
        html += `
            <div class="script-turn">
                <div class="script-text">
                    ${highlightLectureScript(sentence, scriptHighlights)}
                </div>
                ${translation ? `
                <div class="script-translation">
                    ${translation}
                </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * 스크립트 하이라이트 (Announcement와 동일)
 */
function highlightLectureScript(scriptText, highlights) {
    if (!highlights || highlights.length === 0) {
        return escapeHtml(scriptText);
    }
    
    let highlightedText = escapeHtml(scriptText);
    
    highlights.forEach((highlight) => {
        const word = highlight.word || '';
        const translation = highlight.translation || '';
        const explanation = highlight.explanation || '';
        
        if (!word) return;
        
        const regex = new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, (match) => {
            return `<span class="lecture-keyword-highlight" data-translation="${escapeHtml(translation)}" data-explanation="${escapeHtml(explanation)}">${match}</span>`;
        });
    });
    
    return highlightedText;
}

/**
 * 문제별 답안 렌더링 (Announcement와 유사한 구조)
 */
function renderLectureAnswer(result, index) {
    console.log(`📝 [답안 ${index + 1}] renderLectureAnswer 시작`);
    
    const questionText = result.questionText || '';
    const questionTrans = result.questionTrans || '';
    const userAnswer = result.userAnswer;
    const correctAnswer = result.correctAnswer;
    const isCorrect = result.isCorrect;
    const options = result.options || [];
    const translations = result.translations || [];
    const explanations = result.explanations || [];
    
    const statusClass = isCorrect ? 'correct' : 'incorrect';
    const statusIcon = isCorrect ? 'fa-check-circle' : 'fa-times-circle';
    const statusText = isCorrect ? '정답' : '오답';
    
    const userAnswerText = userAnswer !== undefined ? options[userAnswer] : '(답안 없음)';
    const correctAnswerText = options[correctAnswer] || '(정답 없음)';
    
    // 옵션 상세 해설
    const optionsDetailHtml = renderLectureOptionsExplanation(options, translations, explanations, correctAnswer);
    
    return `
        <div class="conver-result-item ${statusClass}">
            <div class="question-header">
                <span class="question-number">
                    <i class="fas ${statusIcon}"></i>
                    문제 ${index + 1} - ${statusText}
                </span>
            </div>
            
            <div class="question-content">
                <div class="question-text">${questionText}</div>
                ${questionTrans ? `<div class="question-translation">${questionTrans}</div>` : ''}
            </div>
            
            <div class="answer-details" style="margin-top: 12px;">
                <div class="conver-answer-row">
                    <span class="conver-answer-label">내 답변:</span>
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
    const optionsHtml = options.map((option, index) => {
        const translation = translations[index] || '';
        const explanation = explanations[index] || '';
        const isCorrect = index === correctAnswer;
        const explanationClass = isCorrect ? 'correct' : 'incorrect';
        const icon = isCorrect 
            ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' 
            : '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
        
        return `
            <div class="option-detail">
                <div class="option-text">${icon} ${option}</div>
                ${translation ? `<div class="option-translation">번역: ${translation}</div>` : ''}
                ${explanation ? `<div class="option-explanation ${explanationClass}"><strong>해설:</strong> ${explanation}</div>` : ''}
            </div>
        `;
    }).join('');
    
    return `
        <div class="options-explanation-section">
            <button class="toggle-explanation-btn" onclick="toggleLectureExplanation(this)">
                선택지 상세 해설 보기 <i class="fas fa-chevron-down"></i>
            </button>
            <div class="options-details" style="display: none;">
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
    
    if (content.style.display === 'none') {
        content.style.display = 'flex';
        button.innerHTML = '선택지 상세 해설 숨기기 <i class="fas fa-chevron-up"></i>';
    } else {
        content.style.display = 'none';
        button.innerHTML = '선택지 상세 해설 보기 <i class="fas fa-chevron-down"></i>';
    }
}

/**
 * 오디오 플레이어 컨트롤 함수들
 */
function toggleLectureAudio(audioId) {
    const audio = document.getElementById(audioId);
    const icon = document.getElementById(`${audioId}-icon`);
    
    if (audio.paused) {
        audio.play();
        icon.className = 'fas fa-pause';
    } else {
        audio.pause();
        icon.className = 'fas fa-play';
    }
}

function seekLectureAudio(audioId, event) {
    const audio = document.getElementById(audioId);
    const seekBar = document.getElementById(`${audioId}-seek`);
    const rect = seekBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 정규식 이스케이프
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================================
// 🎯 어댑터 함수 (listening-lecture-logic.js에서 복구)
// initLectureComponent, nextLectureQuestion, submitListeningLecture 등
// ========================================

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
    
    window.currentLectureComponent = currentLectureComponent;
    await currentLectureComponent.init();
}

async function initListeningLecture(setNumber = 1) {
    console.log(`[어댑터] initListeningLecture 호출 - setNumber: ${setNumber}`);
    
    try {
        currentLectureComponent = new LectureComponent(setNumber, function(resultData) {
            console.log('[어댑터] LectureComponent 완료 콜백 호출됨');
            showLectureResults();
        });
        
        await currentLectureComponent.init();
        
    } catch (error) {
        console.error('[어댑터] initListeningLecture 실패:', error);
        alert('렉쳐 듣기를 시작할 수 없습니다.');
    }
}

function submitListeningLecture() {
    console.log('[어댑터] submitListeningLecture 호출됨');
    
    if (!currentLectureComponent) {
        console.error('[어댑터] currentLectureComponent가 없습니다');
        return;
    }
    
    currentLectureComponent.submit();
}

function nextLectureQuestion() {
    if (currentLectureComponent) {
        const hasNext = currentLectureComponent.nextQuestion();
        if (!hasNext) {
            submitListeningLecture();
        }
    }
}

function backToScheduleFromLectureResult() {
    console.log('[결과 화면] 스케줄로 돌아가기');
    showScreen('scheduleScreen');
}

window.initLectureComponent = initLectureComponent;
window.initListeningLecture = initListeningLecture;
window.submitListeningLecture = submitListeningLecture;
window.nextLectureQuestion = nextLectureQuestion;
window.backToScheduleFromLectureResult = backToScheduleFromLectureResult;

console.log('✅ listening-lecture-logic-fixed.js 로드 완료 (어댑터 함수 포함)');
