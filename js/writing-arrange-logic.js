// Writing - 단어배열 로직 (어댑터)
// ArrangeComponent를 사용하는 어댑터
// v=20250219-002

console.log('✅ writing-arrange-logic.js 로드 시작 (ArrangeComponent 어댑터)');

// 컴포넌트 인스턴스 (전역에서 접근 가능하도록)
window.currentArrangeComponent = null;

async function initArrangeComponent(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initArrangeComponent - setId: ${setId}`);
    
    // ★ 기존 타이머가 있으면 먼저 정리
    if (window._arrangeTimerInterval) {
        clearInterval(window._arrangeTimerInterval);
        window._arrangeTimerInterval = null;
        console.log('🧹 [Arrange] 기존 타이머 정리');
    }
    
    window.currentArrangeComponent = new ArrangeComponent(setId, {
        onComplete: (results) => {
            console.log(`✅ [모듈] Arrange Component 완료`);
            // ★ 타이머 정리
            if (window._arrangeTimerInterval) {
                clearInterval(window._arrangeTimerInterval);
                window._arrangeTimerInterval = null;
            }
            if (onCompleteCallback) onCompleteCallback(results);
        },
        onError: (error) => console.error(`❌ [모듈] Arrange Component 오류:`, error)
    });
    
    try {
        await window.currentArrangeComponent.init();
    } catch (e) {
        console.error('❌ [Arrange] init 실패:', e);
    }
    
    // ★ 타이머 시작 (6분 50초 = 410초) - 2차 리테이크 시에는 스킵
    if (!window.writingFlowNoTimer && !window.isArrangeRetake) {
        console.log('⏱️ [Arrange] 타이머 시작 조건 충족 (1차 모드)');
        startArrangeTimer(410);
    } else {
        console.log('⏱️ [Arrange] 2차 모드 - 타이머 숨김 (writingFlowNoTimer:', window.writingFlowNoTimer, ', isArrangeRetake:', window.isArrangeRetake, ')');
        const timerEl = document.getElementById('arrangeTimer');
        if (timerEl) timerEl.style.display = 'none';
    }
}

/**
 * 단어배열 타이머 시작
 */
function startArrangeTimer(totalSeconds) {
    // ★ 기존 타이머 중복 방지
    if (window._arrangeTimerInterval) {
        clearInterval(window._arrangeTimerInterval);
        window._arrangeTimerInterval = null;
    }
    
    let remaining = totalSeconds;
    
    function updateDisplay() {
        // ★ 매번 요소를 다시 찾아 DOM 갱신에 안전
        const timerEl = document.getElementById('arrangeTimer');
        if (!timerEl) {
            console.warn('⚠️ [Arrange] arrangeTimer 요소를 찾을 수 없음');
            return;
        }
        timerEl.style.display = '';  // 보이도록 강제
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        timerEl.textContent = `${min}:${String(sec).padStart(2, '0')}`;
    }
    
    updateDisplay();
    
    window._arrangeTimerInterval = setInterval(() => {
        remaining--;
        updateDisplay();
        
        if (remaining <= 0) {
            clearInterval(window._arrangeTimerInterval);
            window._arrangeTimerInterval = null;
            console.log('⏰ [Arrange] 시간 종료 → 자동 제출');
            if (window.currentArrangeComponent) {
                window.currentArrangeComponent.submit();
            }
        }
    }, 1000);
    
    console.log(`⏱️ [Arrange] 타이머 시작: ${totalSeconds}초 (${Math.floor(totalSeconds/60)}분 ${totalSeconds%60}초)`);
}

/**
 * 단어배열 초기화
 * Module에서 호출됨 (화면 전환 후)
 */
async function initWritingArrange(setNumber = 1) {
    console.log(`[어댑터] initWritingArrange 호출 - setNumber: ${setNumber}`);
    
    try {
        // ArrangeComponent 생성
        window.currentArrangeComponent = new ArrangeComponent(setNumber, function(resultData) {
            console.log('[어댑터] ArrangeComponent 완료 콜백 호출됨');
            console.log('[어댑터] resultData:', resultData);
            
            // 결과 화면 표시
            showArrangeResult();
        });
        
        // 초기화
        await window.currentArrangeComponent.init();
        
    } catch (error) {
        console.error('[어댑터] initWritingArrange 실패:', error);
        alert('단어배열을 시작할 수 없습니다.');
    }
}

/**
 * 제출 (Module에서 버튼 클릭 시 호출)
 */
function submitWritingArrange() {
    console.log('[어댑터] submitWritingArrange 호출됨');
    
    if (!window.currentArrangeComponent) {
        console.error('[어댑터] currentArrangeComponent가 없습니다');
        return;
    }
    
    // 컴포넌트의 submit() 호출
    window.currentArrangeComponent.submit();
}

window.initArrangeComponent = initArrangeComponent;
window.initWritingArrange = initWritingArrange;

// ========================================
// 🎯 결과 화면 함수 (기존 유지)
// ========================================

/**
 * 결과 화면 표시
 */
function showArrangeResult() {
    console.log('📊 [단어배열 결과] 결과 화면 표시');
    
    const resultsStr = sessionStorage.getItem('arrangeResults');
    if (!resultsStr) {
        console.error('❌ 저장된 결과 없음');
        return;
    }
    
    const resultsData = JSON.parse(resultsStr);
    
    console.log('📊 결과 데이터:', resultsData);
    
    // 점수 표시
    document.getElementById('arrangeResultScoreValue').textContent = resultsData.accuracy + '%';
    document.getElementById('arrangeResultCorrectCount').textContent = resultsData.correct;
    document.getElementById('arrangeResultIncorrectCount').textContent = resultsData.total - resultsData.correct;
    document.getElementById('arrangeResultTotalCount').textContent = resultsData.total;
    
    // Week/Day 정보
    const currentTest = JSON.parse(sessionStorage.getItem('currentTest') || '{"week":"Week 1","day":"월"}');
    const dayTitle = `${currentTest.week || 'Week 1'}, ${currentTest.day || '월'}요일 - Build a Sentence`;
    document.getElementById('arrangeResultDayTitle').textContent = dayTitle;
    
    // 세부 결과 렌더링
    const detailsContainer = document.getElementById('arrangeResultDetails');
    let html = '';
    
    resultsData.results.forEach((result, index) => {
        html += renderArrangeResultItem(result, index);
    });
    
    detailsContainer.innerHTML = html;
    
    // 결과 화면 표시
    showScreen('writingArrangeResultScreen');
}

/**
 * 개별 문제 결과 렌더링
 */
function renderArrangeResultItem(result, index) {
    const isCorrect = result.isCorrect;
    const statusClass = isCorrect ? 'correct' : 'incorrect';
    const statusIcon = isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
    
    // 프로필 이미지 정보
    const profilePair = result.profilePair || {
        first: { gender: 'female', image: '' },
        second: { gender: 'male', image: '' }
    };
    
    let html = `
        <div class="arrange-result-item">
            <div class="arrange-result-header ${statusClass}">
                <div class="arrange-question-number">
                    Question ${result.questionNum}
                </div>
                <div class="arrange-result-status ${statusClass}">
                    ${statusIcon}
                </div>
            </div>
            
            <div class="arrange-result-content">
                <!-- 주어진 문장 -->
                <div class="arrange-given-section">
                    <div class="arrange-result-profile-row">
                        <div class="arrange-result-profile ${profilePair.first.gender}">
                            <img src="${profilePair.first.image}" alt="${profilePair.first.gender}" />
                        </div>
                        <div class="arrange-result-text-area">
                            <div class="arrange-given-text">
                                ${escapeHtml(result.givenSentence)}
                            </div>
                            ${result.givenTranslation ? `
                            <div class="arrange-translation">
                                ${escapeHtml(result.givenTranslation)}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="arrange-divider"></div>
                
                ${!isCorrect ? `
                <!-- 사용자 답변 (오답일 경우) -->
                <div class="arrange-user-answer-section">
                    <div class="arrange-answer-label">내 답변</div>
                    <div class="arrange-result-profile-row">
                        <div class="arrange-result-profile ${profilePair.second.gender}">
                            <img src="${profilePair.second.image}" alt="${profilePair.second.gender}" />
                        </div>
                        <div class="arrange-user-sentence">
                            ${renderAnswerStructure(result, false)}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- 정답 문장 -->
                <div class="arrange-answer-section">
                    <div class="arrange-answer-label">정답</div>
                    <div class="arrange-result-profile-row">
                        <div class="arrange-result-profile ${profilePair.second.gender}">
                            <img src="${profilePair.second.image}" alt="${profilePair.second.gender}" />
                        </div>
                        <div class="arrange-result-text-area">
                            <div class="arrange-correct-sentence">
                                ${renderAnswerStructure(result, true)}
                            </div>
                            ${result.correctTranslation ? `
                            <div class="arrange-correct-translation">
                                ${escapeHtml(result.correctTranslation)}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- 주어진 단어들 -->
                <div class="arrange-options-display">
                    <div class="arrange-options-label">주어진 단어</div>
                    <div class="arrange-options-list">
                        ${result.optionWords ? result.optionWords.map(word => 
                            `<span class="arrange-option-display">${escapeHtml(word)}</span>`
                        ).join('') : ''}
                    </div>
                </div>
                
                ${result.explanation ? `
                <div class="arrange-divider"></div>
                
                <!-- 해설 -->
                <div class="arrange-explanation-section">
                    <div class="arrange-explanation-title">
                        <i class="fas fa-lightbulb"></i>
                        해설
                    </div>
                    <div class="arrange-explanation-text">
                        ${escapeHtml(result.explanation)}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return html;
}

/**
 * 답변 구조 렌더링 (주어진 단어 + 내가 채운 빈칸 구분)
 */
function renderAnswerStructure(result, isCorrectAnswer) {
    if (!result.presentedWords) {
        return escapeHtml(isCorrectAnswer ? result.correctAnswer : result.userAnswer);
    }
    
    const presentedWords = result.presentedWords;
    const userFilledWords = result.userFilledWords || {};
    const correctWords = result.correctAnswerArray || [];
    
    let html = '';
    let correctIndex = 0;
    
    presentedWords.forEach((word, index) => {
        if (word === '_') {
            // 빈칸
            if (isCorrectAnswer) {
                // 정답: 정답 단어 표시 (초록색 배경)
                html += `<span class="arrange-result-blank correct-blank">${escapeHtml(correctWords[correctIndex] || '')}</span> `;
            } else {
                // 내 답변: 내가 채운 단어 표시
                const userWord = userFilledWords[index] || '___';
                const isWrong = (userWord || '').toLowerCase() !== (correctWords[correctIndex] || '').toLowerCase();
                html += `<span class="arrange-result-blank user-blank ${isWrong ? 'wrong-blank' : 'correct-blank'}">${escapeHtml(userWord)}</span> `;
            }
            correctIndex++;
        } else {
            // 주어진 단어 (회색으로 표시)
            html += `<span class="arrange-result-given">${escapeHtml(word)}</span> `;
        }
    });
    
    // 마침표 추가
    if (result.endPunctuation) {
        html += `<span class="arrange-result-punctuation">${result.endPunctuation}</span>`;
    }
    
    return html;
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
 * 스케줄로 돌아가기
 */
function backToScheduleFromArrangeResult() {
    console.log('[결과 화면] 스케줄로 돌아가기');
    showScreen('scheduleScreen');
}

console.log('✅ writing-arrange-logic.js 로드 완료 (ArrangeComponent 어댑터)');
console.log('✅ initWritingArrange 함수:', typeof initWritingArrange);
console.log('✅ submitWritingArrange 함수:', typeof submitWritingArrange);
