/**
 * ======================================
 * 📚 Listening - Lecture 채점 결과 화면
 * ======================================
 * 
 * 컨버/공지사항과 동일한 구조
 * - 나레이션 + 렉처 오디오
 * - 4개 문제
 * - 스크립트 + 번역 + 하이라이트
 * - 채점 결과 표시
 */

console.log('✅ listening-lecture-result.js 로드 시작');

/**
 * 렉처 채점 결과 화면 표시
 * ⚠️ 비활성화: listening-lecture-logic.js의 예전 버전 사용
 */
/*
function showLectureResults() {
    console.log('🎯 [렉처 채점] 결과 화면 표시 시작');
    
    // sessionStorage에서 결과 가져오기
    const resultsData = sessionStorage.getItem('lectureResults');
    if (!resultsData) {
        console.error('❌ [렉처 채점] sessionStorage에서 lectureResults를 찾을 수 없습니다');
        alert('채점 결과를 찾을 수 없습니다.');
        return;
    }
    
    const results = JSON.parse(resultsData);
    console.log('📊 [렉처 채점] 파싱된 결과:', results);
    
    // 전체 통계 계산
    let totalQuestions = 0;
    let totalCorrect = 0;
    
    results.forEach(setResult => {
        setResult.answers.forEach(answer => {
            totalQuestions++;
            if (answer.isCorrect) {
                totalCorrect++;
            }
        });
    });
    
    const totalIncorrect = totalQuestions - totalCorrect;
    const totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    
    console.log('📈 [렉처 채점] 전체 통계:');
    console.log('  → 총 문제 수:', totalQuestions);
    console.log('  → 정답 수:', totalCorrect);
    console.log('  → 오답 수:', totalIncorrect);
    console.log('  → 총점:', totalScore + '%');
    
    // UI 업데이트
    document.getElementById('lectureResultScoreValue').textContent = totalScore + '%';
    document.getElementById('lectureResultCorrectCount').textContent = totalCorrect;
    document.getElementById('lectureResultIncorrectCount').textContent = totalIncorrect;
    document.getElementById('lectureResultTotalCount').textContent = totalQuestions;
    
    // Week/Day 정보
    const currentTestData = sessionStorage.getItem('currentTest');
    let weekDay = 'Week 1 - 월요일';
    if (currentTestData) {
        const currentTest = JSON.parse(currentTestData);
        const week = currentTest.currentWeek || 1;
        const day = currentTest.currentDay || '월요일';
        weekDay = `Week ${week} - ${day}`;
    }
    
    document.getElementById('lectureResultDayTitle').textContent = `${weekDay} - 렉처`;
    
    // 상세 결과 렌더링
    console.log('🖼️ [렉처 채점] 상세 결과 렌더링 시작');
    const detailsContainer = document.getElementById('lectureResultDetails');
    detailsContainer.innerHTML = '';
    
    results.forEach((setResult, setIdx) => {
        const setHtml = renderLectureSetResult(setResult, setIdx);
        detailsContainer.innerHTML += setHtml;
    });
    
    // 화면 표시
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const lectureResultScreen = document.getElementById('listeningLectureResultScreen');
    lectureResultScreen.classList.add('active');
    lectureResultScreen.style.display = 'block';
    
    console.log('✅ [렉처 채점] 화면 표시 완료');
    
    // 오디오 리스너 초기화 (300ms → 500ms로 변경)
    setTimeout(() => {
        initLectureResultAudioListeners();
    }, 500);
    
    // sessionStorage 정리
    // sessionStorage.removeItem('lectureResults');
}
*/

/**
 * 세트별 결과 렌더링
 */
function renderLectureSetResult(setResult, setIdx) {
    const audioId = `lecture-main-audio-${setIdx}`;
    
    let html = `
    <div class="result-set-section">
        <div class="result-set-header">
            <span class="section-icon">🎧</span>
            <span class="section-title">렉처 결과</span>
        </div>
    `;
    
    // 오디오 재생 (setResult의 audioUrl 사용)
    if (setResult.audioUrl) {
        const audioUrl = convertGoogleDriveUrl(setResult.audioUrl);
        html += `
        <div class="audio-replay-section">
            <div class="audio-replay-header">
                <span class="audio-icon">🔊</span>
                <span>렉처 오디오 다시 듣기</span>
            </div>
            <div class="audio-player-container">
                <button class="audio-play-btn" data-audio-id="${audioId}">
                    <i class="fas fa-play"></i>
                </button>
                <div class="audio-seek-bar" data-audio-id="${audioId}">
                    <div class="audio-progress" id="${audioId}-progress"></div>
                </div>
                <div class="audio-time-display">
                    <span id="${audioId}-current">0:00</span>
                    <span>/</span>
                    <span id="${audioId}-duration">0:00</span>
                </div>
            </div>
            <audio id="${audioId}" preload="metadata">
                <source src="${audioUrl}" type="audio/mpeg">
            </audio>
        </div>
        `;
    }
    
    // 스크립트 렌더링 (setResult의 스크립트 사용)
    html += renderLectureScript(
        setResult.script,
        setResult.scriptTrans,
        setResult.scriptHighlights || []
    );
    
    // 문제별 결과
    html += `<div class="questions-section">`;
    setResult.answers.forEach((answer, qIdx) => {
        html += renderLectureAnswer(answer, qIdx, setIdx);
    });
    html += `</div>`;
    
    html += `</div>`;
    
    return html;
}

/**
 * 스크립트 렌더링 (공지사항과 동일)
 */
function renderLectureScript(script, scriptTrans, scriptHighlights = []) {
    console.log('📝 [렉처 스크립트] 렌더링 시작');
    console.log('  → script:', script);
    console.log('  → scriptTrans:', scriptTrans);
    console.log('  → scriptHighlights:', scriptHighlights);
    
    let html = `<div class="audio-script">`;
    
    // "Professor:"나 "Woman:" 같은 화자 표시 제거
    const cleanScript = script ? script.replace(/^(Professor|Woman|Man):\s*/i, '').trim() : '';
    const cleanScriptTrans = scriptTrans ? scriptTrans.trim() : '';
    
    console.log('🧹 [렉처 스크립트] 화자 제거 후:', cleanScript);
    
    // 문장 단위로 분리 (. ! ? 기준)
    const sentences = cleanScript.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    const sentencesTrans = cleanScriptTrans.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    
    console.log('📊 [렉처 스크립트] 파싱 디버깅:');
    console.log('  → 영어 문장 수:', sentences.length);
    console.log('  → 한국어 문장 수:', sentencesTrans.length);
    console.log('  → 영어 문장들:', sentences);
    console.log('  → 한국어 문장들:', sentencesTrans);
    
    // 각 문장마다 영어 → 한국어 순서로 표시
    sentences.forEach((sentence, idx) => {
        const translation = sentencesTrans[idx] || '';
        
        html += `<div class="script-turn">`;
        
        // 영어 스크립트 (하이라이트 적용)
        html += `
            <div class="script-text">
                ${highlightLectureScript(sentence, scriptHighlights)}
            </div>
        `;
        
        // 한국어 번역
        if (translation) {
            html += `
                <div class="script-translation">
                    ${escapeHtml(translation)}
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    html += `</div>`;
    
    return html;
}

/**
 * 스크립트 하이라이트 적용
 */
function highlightLectureScript(scriptText, highlights) {
    console.log('🎨 [highlightLectureScript] 호출됨');
    console.log('  → scriptText:', scriptText);
    console.log('  → highlights:', highlights);
    console.log('  → highlights 길이:', highlights ? highlights.length : 'null');
    
    if (!highlights || highlights.length === 0) {
        console.log('  → 하이라이트 없음, 원본 텍스트 반환');
        return escapeHtml(scriptText);
    }
    
    let result = scriptText;
    
    highlights.forEach((highlight, idx) => {
        const { word, translation, explanation } = highlight;
        
        console.log(`  → [${idx}] 하이라이트 처리:`, { word, translation, explanation });
        
        // 대소문자 구분 없이 단어 찾기
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
        
        const replacement = `<span class="lecture-keyword-highlight" 
            data-word="${escapeHtml(word)}" 
            data-translation="${escapeHtml(translation)}" 
            data-explanation="${escapeHtml(explanation)}">$&</span>`;
        
        result = result.replace(regex, replacement);
        
        console.log(`  → [${idx}] 교체 후:`, result.substring(0, 100) + '...');
    });
    
    console.log('✅ [highlightLectureScript] 완료');
    return result;
}

/**
 * 문제별 결과 렌더링
 */
function renderLectureAnswer(answer, qIdx, setIdx) {
    const questionNum = qIdx + 1;
    const isCorrect = answer.isCorrect;
    const resultClass = isCorrect ? 'correct' : 'incorrect';
    const resultIcon = isCorrect ? '✅' : '❌';
    const resultText = isCorrect ? '정답' : '오답';
    
    let html = `
    <div class="question-result ${resultClass}">
        <div class="question-result-header">
            <span class="question-number">Question ${questionNum}</span>
            <span class="result-badge ${resultClass}">
                <span class="result-icon">${resultIcon}</span>
                <span>${resultText}</span>
            </span>
        </div>
        
        <div class="question-text">${escapeHtml(answer.questionText || answer.question)}</div>
    `;
    
    if (answer.questionTrans) {
        html += `<div class="question-translation">${escapeHtml(answer.questionTrans)}</div>`;
    }
    
    html += `<div class="answer-options">`;
    
    answer.options.forEach((option, optIdx) => {
        const optionNum = optIdx + 1;
        // userAnswer가 없으면 questionIndex 사용
        const userAnswerValue = answer.userAnswer !== undefined ? answer.userAnswer : (answer.questionIndex + 1);
        const isUserAnswer = userAnswerValue === optionNum;
        const isCorrectAnswer = answer.correctAnswer === optionNum;
        
        let optionClass = 'answer-option';
        if (isCorrectAnswer) optionClass += ' correct-answer';
        if (isUserAnswer && !isCorrectAnswer) optionClass += ' wrong-answer';
        if (isUserAnswer) optionClass += ' user-selected';
        
        let optionIcon = '';
        if (isCorrectAnswer) optionIcon = '<span class="option-icon correct">✓</span>';
        if (isUserAnswer && !isCorrectAnswer) optionIcon = '<span class="option-icon wrong">✗</span>';
        
        html += `
        <div class="${optionClass}">
            ${optionIcon}
            <span class="option-text">${escapeHtml(option)}</span>
        </div>
        `;
        
        // 선택지 번역 (translations 또는 optionTranslations)
        const translations = answer.translations || answer.optionTranslations;
        if (translations && translations[optIdx]) {
            html += `
            <div class="option-translation">
                ${escapeHtml(translations[optIdx])}
            </div>
            `;
        }
        
        // 선택지 설명 (explanations 또는 optionExplanations)
        const explanations = answer.explanations || answer.optionExplanations;
        if (explanations && explanations[optIdx]) {
            html += `
            <div class="option-explanation">
                <strong>설명:</strong> ${escapeHtml(explanations[optIdx])}
            </div>
            `;
        }
    });
    
    html += `</div></div>`;
    
    return html;
}

/**
 * 오디오 리스너 초기화
 */
function initLectureResultAudioListeners() {
    console.log('🎵 [렉처 채점] 오디오 리스너 초기화 시작');
    
    const audios = document.querySelectorAll('audio[id^="lecture-main-audio-"]');
    console.log('  → 오디오 개수:', audios.length);
    
    let listenerCount = 0;
    
    audios.forEach((audio, index) => {
        const audioId = audio.id;
        console.log(`  → [${index}] 오디오 등록: ${audioId}`);
        
        const playBtn = document.querySelector(`.audio-play-btn[data-audio-id="${audioId}"]`);
        const seekBar = document.querySelector(`.audio-seek-bar[data-audio-id="${audioId}"]`);
        const progressBar = document.getElementById(`${audioId}-progress`);
        const currentTimeSpan = document.getElementById(`${audioId}-current`);
        const durationSpan = document.getElementById(`${audioId}-duration`);
        
        if (!playBtn || !seekBar || !progressBar || !currentTimeSpan || !durationSpan) {
            console.warn(`  → [${index}] UI 요소를 찾을 수 없음`);
            return;
        }
        
        // 재생/일시정지 버튼
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                // 다른 모든 오디오 정지
                document.querySelectorAll('audio[id^="lecture-main-audio-"]').forEach(otherAudio => {
                    if (otherAudio !== audio && !otherAudio.paused) {
                        otherAudio.pause();
                        const otherBtn = document.querySelector(`.audio-play-btn[data-audio-id="${otherAudio.id}"]`);
                        if (otherBtn) {
                            otherBtn.innerHTML = '<i class="fas fa-play"></i>';
                        }
                    }
                });
                
                audio.play();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                console.log(`▶️ [${audioId}] 재생 시작`);
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                console.log(`⏸️ [${audioId}] 일시정지`);
            }
        });
        
        // 시크바 클릭
        seekBar.addEventListener('click', (e) => {
            const rect = seekBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
            console.log(`⏩ [${audioId}] 시크: ${Math.round(percent * 100)}%`);
        });
        
        // 시간 업데이트
        audio.addEventListener('timeupdate', () => {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = percent + '%';
            currentTimeSpan.textContent = formatTime(audio.currentTime);
        });
        
        // 메타데이터 로드
        audio.addEventListener('loadedmetadata', () => {
            console.log(`📊 [${audioId}] loadedmetadata 이벤트 발생`);
            console.log(`  → duration: ${audio.duration}`);
            durationSpan.textContent = formatTime(audio.duration);
        });
        
        // ⭐ duration 즉시 확인 (이미 로드된 경우)
        if (audio.readyState >= 1) { // HAVE_METADATA
            console.log(`✅ [${audioId}] 이미 로드됨 (readyState: ${audio.readyState})`);
            durationSpan.textContent = formatTime(audio.duration);
        } else {
            console.log(`⏳ [${audioId}] 로드 대기 중 (readyState: ${audio.readyState})`);
            audio.load(); // 강제 로드
        }
        
        // 재생 시작
        audio.addEventListener('play', () => {
            console.log(`▶️ [${audioId}] play 이벤트 발생`);
        });
        
        // 재생 종료
        audio.addEventListener('ended', () => {
            console.log(`⏹️ [${audioId}] 재생 완료`);
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
        
        listenerCount++;
    });
    
    console.log(`✅ [렉처 채점] 오디오 리스너 ${listenerCount}개 등록 완료`);
    
    // 툴팁 이벤트 리스너 초기화
    initLectureTooltipListeners();
}

/**
 * 툴팁 이벤트 리스너
 */
function initLectureTooltipListeners() {
    console.log('💬 [렉처 채점] 툴팁 리스너 초기화 시작');
    
    const highlights = document.querySelectorAll('.lecture-keyword-highlight');
    console.log('  → 하이라이트 개수:', highlights.length);
    
    highlights.forEach((element, index) => {
        element.addEventListener('mouseenter', (e) => {
            const word = element.getAttribute('data-word');
            const translation = element.getAttribute('data-translation');
            const explanation = element.getAttribute('data-explanation');
            
            console.log(`  → [${index}] 툴팁 표시:`, { word, translation, explanation });
            
            const tooltip = document.createElement('div');
            tooltip.className = 'keyword-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-word">${escapeHtml(word)}</div>
                <div class="tooltip-translation">${escapeHtml(translation)}</div>
                ${explanation ? `<div class="tooltip-explanation">${escapeHtml(explanation)}</div>` : ''}
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (rect.top + scrollY - tooltip.offsetHeight - 10) + 'px';
            
            console.log(`  → [${index}] 툴팁 위치:`, {
                rectTop: rect.top,
                scrollY: scrollY,
                tooltipTop: rect.top + scrollY - tooltip.offsetHeight - 10
            });
            
            element._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', (e) => {
            if (element._tooltip) {
                element._tooltip.remove();
                element._tooltip = null;
            }
        });
    });
    
    console.log(`✅ [렉처 채점] 툴팁 리스너 ${highlights.length}개 등록 완료`);
}

/**
 * 유틸리티 함수들
 */
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convertGoogleDriveUrl(url) {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
        const fileId = url.match(/\/d\/([^/]+)/)[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
}

/**
 * 학습 일정으로 돌아가기
 */
function backToScheduleFromLectureResult() {
    console.log('🔙 [렉처 채점] 학습 일정으로 돌아가기');
    
    stopAllTimers();
    
    // 모든 화면 숨김
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = '';
    });
    
    // 학습 일정 화면 표시
    const scheduleScreen = document.getElementById('scheduleScreen');
    scheduleScreen.classList.add('active');
    
    // 일정 초기화
    if (window.currentUser) {
        initScheduleScreen();
    }
}

console.log('✅ listening-lecture-result.js 로드 완료');
