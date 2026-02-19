// Listening - 공지사항 로직 (어댑터)
// AnnouncementComponent를 사용하는 어댑터
// v=007

console.log('✅ listening-announcement-logic.js 로드 시작 (AnnouncementComponent 어댑터)');

// 컴포넌트 인스턴스
let currentAnnouncementComponent = null;

async function initAnnouncementComponent(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initAnnouncementComponent - setId: ${setId}`);
    currentAnnouncementComponent = new AnnouncementComponent(setId, {
        onComplete: (results) => {
            console.log(`✅ [모듈] Announcement Component 완료`);
            if (onCompleteCallback) onCompleteCallback(results);
        },
        onError: (error) => console.error(`❌ [모듈] Announcement Component 오류:`, error),
        onTimerStart: () => {
            console.log(`⏰ [모듈] Announcement 타이머 시작 (20초)`);
            if (window.moduleController) {
                window.moduleController.startQuestionTimer(20);
            }
        }
    });
    
    // 전역으로 노출 (ModuleController에서 접근)
    window.currentAnnouncementComponent = currentAnnouncementComponent;
    
    await currentAnnouncementComponent.init();
}

/**
 * 공지사항 초기화
 * Module에서 호출됨 (화면 전환 후)
 */
async function initListeningAnnouncement(setNumber = 1) {
    console.log(`[어댑터] initListeningAnnouncement 호출 - setNumber: ${setNumber}`);
    
    try {
        // AnnouncementComponent 생성
        currentAnnouncementComponent = new AnnouncementComponent(setNumber, function(resultData) {
            console.log('[어댑터] AnnouncementComponent 완료 콜백 호출됨');
            console.log('[어댑터] resultData:', resultData);
            
            // 결과 화면 표시
            showAnnouncementResults();
        });
        
        // 초기화
        await currentAnnouncementComponent.init();
        
    } catch (error) {
        console.error('[어댑터] initListeningAnnouncement 실패:', error);
        alert('공지사항 듣기를 시작할 수 없습니다.');
    }
}

/**
 * 제출 (Module에서 버튼 클릭 시 호출)
 */
function submitListeningAnnouncement() {
    console.log('[어댑터] submitListeningAnnouncement 호출됨');
    
    if (!currentAnnouncementComponent) {
        console.error('[어댑터] currentAnnouncementComponent가 없습니다');
        return;
    }
    
    // 컴포넌트의 submit() 호출
    currentAnnouncementComponent.submit();
}

/**
 * 다음 문제 - Component 어댑터
 */
function nextAnnouncementQuestion() {
    if (currentAnnouncementComponent) {
        const hasNext = currentAnnouncementComponent.nextQuestion();
        if (!hasNext) {
            // 마지막 문제면 자동 제출
            submitListeningAnnouncement();
        }
    }
}

window.initAnnouncementComponent = initAnnouncementComponent;
window.initListeningAnnouncement = initListeningAnnouncement;
window.submitListeningAnnouncement = submitListeningAnnouncement;
window.nextAnnouncementQuestion = nextAnnouncementQuestion;

// ========================================
// 🎯 결과 화면 함수 (기존 유지)
// ========================================

/**
 * 결과 화면 표시
 */
function showAnnouncementResults() {
    console.log('🎯 [결과 화면] showAnnouncementResults() 시작');
    
    // sessionStorage에서 결과 가져오기
    const resultsJson = sessionStorage.getItem('listeningAnnouncementResult');
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
    const totalQuestions = resultData.totalQuestions || 2;
    const score = resultData.score || 0;
    
    console.log(`📊 [결과 화면] 점수: ${score}% (정답: ${totalCorrect}, 오답: ${totalIncorrect})`);
    
    // 점수 표시
    const scoreValueEl = document.getElementById('announcementResultScoreValue');
    if (scoreValueEl) {
        scoreValueEl.textContent = `${score}%`;
    }
    
    const correctCountEl = document.getElementById('announcementResultCorrectCount');
    if (correctCountEl) {
        correctCountEl.textContent = totalCorrect;
    }
    
    const incorrectCountEl = document.getElementById('announcementResultIncorrectCount');
    if (incorrectCountEl) {
        incorrectCountEl.textContent = totalIncorrect;
    }
    
    // 세트별 결과 렌더링
    const setResultsContainer = document.getElementById('announcementSetResults');
    if (setResultsContainer) {
        setResultsContainer.innerHTML = renderAnnouncementSetResult(resultData);
    }
    
    // 결과 화면 표시
    showScreen('announcementResultScreen');
    console.log('✅ [결과 화면] 표시 완료');
}

/**
 * 세트 결과 렌더링
 */
function renderAnnouncementSetResult(resultData) {
    console.log('🖼️ [세트 결과] renderAnnouncementSetResult 시작');
    
    const audioUrl = resultData.audioUrl || '';
    const script = resultData.script || '';
    const scriptHighlight = resultData.scriptHighlight || '';
    const results = resultData.results || [];
    
    // 스크립트 렌더링 (화자 구분 없음)
    const scriptHtml = renderAnnouncementScript(script, scriptHighlight);
    
    // 문제별 답안 렌더링
    const answersHtml = results.map((result, index) => {
        return renderAnnouncementAnswer(result, index);
    }).join('');
    
    return `
        <div class="announcement-set-result">
            <div class="set-header">
                <h3>공지사항 듣기</h3>
            </div>
            
            <!-- 오디오 재생 -->
            <div class="audio-section">
                <h4>오디오 다시듣기</h4>
                <audio id="announcementResultAudio" src="${audioUrl}" controls style="width: 100%; margin-top: 10px;"></audio>
            </div>
            
            <!-- 스크립트 -->
            <div class="script-section">
                <h4>대본 (Script)</h4>
                <div class="script-content">
                    ${scriptHtml}
                </div>
            </div>
            
            <!-- 문제별 답안 -->
            <div class="answers-section">
                <h4>문제별 답안</h4>
                ${answersHtml}
            </div>
        </div>
    `;
}

/**
 * 스크립트 렌더링 (화자 구분 없음)
 */
function renderAnnouncementScript(script, scriptHighlight) {
    console.log('📝 [스크립트] renderAnnouncementScript 시작');
    
    if (!script) {
        return '<p style="color: #999;">스크립트가 없습니다.</p>';
    }
    
    // scriptHighlight가 문자열이면 배열로 변환
    let highlights = [];
    if (typeof scriptHighlight === 'string' && scriptHighlight.trim()) {
        highlights = scriptHighlight.split(',').map(word => ({
            word: word.trim(),
            translation: '',
            explanation: ''
        }));
    } else if (Array.isArray(scriptHighlight)) {
        highlights = scriptHighlight;
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
    
    return `<p>${highlightedScript}</p>`;
}

/**
 * 문제별 답안 렌더링
 */
function renderAnnouncementAnswer(result, index) {
    console.log(`📝 [답안 ${index + 1}] renderAnnouncementAnswer 시작`);
    
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
    const optionsDetailHtml = renderAnnouncementOptionsExplanation(options, translations, explanations, correctAnswer);
    
    return `
        <div class="answer-item">
            <div class="answer-header">
                ${icon}
                <span><strong>문제 ${index + 1}:</strong> ${questionText}</span>
            </div>
            <div class="answer-details">
                <p><strong>내 답:</strong> ${userAnswerText}</p>
                <p><strong>정답:</strong> ${correctAnswerText}</p>
            </div>
            ${optionsDetailHtml}
        </div>
    `;
}

/**
 * 선택지 상세 해설 렌더링
 */
function renderAnnouncementOptionsExplanation(options, translations, explanations, correctAnswer) {
    console.log('📝 [해설] renderAnnouncementOptionsExplanation 시작');
    
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
            <button class="toggle-explanation-btn" onclick="toggleAnnouncementExplanation(this)">
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
function toggleAnnouncementExplanation(button) {
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
function backToScheduleFromAnnouncementResult() {
    console.log('[결과 화면] 스케줄로 돌아가기');
    showScreen('scheduleScreen');
}

console.log('✅ listening-announcement-logic.js 로드 완료 (AnnouncementComponent 어댑터)');
console.log('✅ initListeningAnnouncement 함수:', typeof initListeningAnnouncement);
console.log('✅ submitListeningAnnouncement 함수:', typeof submitListeningAnnouncement);
