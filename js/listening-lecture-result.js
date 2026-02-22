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
    const setNumber = setIdx + 1;
    const questionCount = setResult.answers ? setResult.answers.length : 0;
    const setMeta = setResult.setDescription || `학술강의 · ${questionCount}문제`;
    
    // 오디오 URL
    const audioUrl = setResult.audioUrl || (setResult.answers[0] && setResult.answers[0].audioUrl) || '';
    const script = setResult.script || (setResult.answers[0] && setResult.answers[0].script) || '';
    const scriptTrans = setResult.scriptTrans || (setResult.answers[0] && setResult.answers[0].scriptTrans) || '';
    const scriptHighlights = setResult.scriptHighlights || (setResult.answers[0] && setResult.answers[0].scriptHighlights) || [];
    
    let html = `
    <div class="academic-set">
        <!-- 세트 헤더 -->
        <div class="academic-set-header">
            <span class="academic-set-badge">
                <i class="fas fa-graduation-cap"></i>
                Academic Set ${setNumber}
            </span>
            <span class="academic-set-meta">${setMeta}</span>
        </div>
        
        <!-- 강의 오디오 -->
        ${audioUrl ? `
        <div class="academic-audio-section">
            <div class="academic-audio-title">
                <i class="fas fa-volume-up"></i>
                <span>강의 다시 듣기</span>
            </div>
            <div class="academic-audio-player">
                <button class="academic-play-btn" onclick="toggleLectureAudio('${audioId}')">
                    <i class="fas fa-play" id="${audioId}-icon"></i>
                </button>
                <div class="academic-seek-container">
                    <div class="academic-seek-bar" id="${audioId}-seek" onclick="seekLectureAudio('${audioId}', event)">
                        <div class="academic-seek-progress" id="${audioId}-progress" style="width: 0%">
                            <div class="academic-seek-handle"></div>
                        </div>
                    </div>
                    <div class="academic-audio-time">
                        <span id="${audioId}-current">0:00</span> <span id="${audioId}-duration">0:00</span>
                    </div>
                </div>
                <audio id="${audioId}" src="${convertGoogleDriveUrl(audioUrl)}"></audio>
            </div>
        </div>
        ` : ''}
        
        <!-- 전체 스크립트 -->
        ${script ? `
        <div class="academic-script-section">
            <button class="academic-script-toggle" onclick="toggleAcademicScriptSection('academic-script-${setIdx}')">
                <i class="fas fa-file-alt"></i>
                <span class="toggle-text">강의 전체 스크립트 보기</span>
                <i class="fas fa-chevron-down" id="academic-script-${setIdx}-icon"></i>
            </button>
            <div id="academic-script-${setIdx}" class="academic-script-body" style="display: none;">
                ${renderLectureScript(script, scriptTrans, scriptHighlights)}
            </div>
        </div>
        ` : ''}
        
        <!-- 구분선: 문제 영역 -->
        <div class="academic-questions-divider">
            <span>문제 해설</span>
        </div>
    `;
    
    // 문제별 결과
    if (setResult.answers) {
        setResult.answers.forEach((answer, qIdx) => {
            html += renderLectureAnswer(answer, qIdx, setIdx);
        });
    }
    
    // 강의 요약
    if (setResult.summaryText) {
        html += `
            <div class="academic-summary-section">
                <div class="academic-summary-title">
                    <i class="fas fa-lightbulb"></i>
                    <span>강의 핵심 포인트</span>
                </div>
                <div class="academic-summary-text">${setResult.summaryText}</div>
                ${setResult.keyPoints ? `
                <div class="academic-key-points">
                    ${setResult.keyPoints.map(point => `<div class="academic-key-point">${point}</div>`).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }
    
    html += `</div>`;
    
    return html;
}

/**
 * 스크립트 렌더링 (학술 단락 구조)
 */
function renderLectureScript(script, scriptTrans, scriptHighlights = []) {
    if (!script) return '';
    
    // "Professor:" 등 화자 표시 제거 + \n 처리
    const cleanScript = script ? script.replace(/^(Professor|Woman|Man):\s*/i, '').trim()
        .replace(/\\n/g, '\n').replace(/\r\n/g, '\n') : '';
    const cleanScriptTrans = scriptTrans ? scriptTrans.trim()
        .replace(/\\n/g, '\n').replace(/\r\n/g, '\n') : '';
    
    // 단락(\n\n) 기준 분리 → 폴백
    let sentences = cleanScript.split(/\n\n+/).filter(s => s.trim());
    let sentencesTrans = cleanScriptTrans ? cleanScriptTrans.split(/\n\n+/).filter(s => s.trim()) : [];
    
    if (sentences.length <= 1) {
        sentences = cleanScript.split(/(?<=[.!?])(?:\s*\n|\s{2,})/).filter(s => s.trim());
        sentencesTrans = cleanScriptTrans ? cleanScriptTrans.split(/(?<=[.!?])(?:\s*\n|\s{2,})/).filter(s => s.trim()) : [];
    }
    if (sentences.length <= 1) {
        sentences = cleanScript.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        sentencesTrans = cleanScriptTrans ? cleanScriptTrans.split(/(?<=[.!?])\s+/).filter(s => s.trim()) : [];
    }
    
    let html = '';
    
    sentences.forEach((sentence, idx) => {
        const translation = sentencesTrans[idx] || '';
        
        html += `
            <div class="academic-paragraph">
                <div class="academic-paragraph-text">
                    ${highlightLectureScript(sentence.replace(/\n/g, '<br>'), scriptHighlights)}
                </div>
                ${translation ? `<span class="academic-paragraph-translation">${escapeHtml(translation).replace(/\n/g, '<br>')}</span>` : ''}
            </div>
        `;
    });
    
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
        
        const replacement = `<span class="academic-keyword" 
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
    const correctIcon = isCorrect 
        ? '<i class="fas fa-check-circle" style="color: #77bf7e;"></i>' 
        : '<i class="fas fa-times-circle" style="color: #e74c5e;"></i>';
    
    const toggleId = `academic-toggle-q${setIdx}-${qIdx}`;
    
    let html = `
    <div class="academic-question">
        <div class="academic-question-header">
            <span class="academic-q-number">Question ${questionNum}</span>
            <span class="academic-q-status">${correctIcon}</span>
        </div>
        <div class="academic-q-text">${escapeHtml(answer.questionText || answer.question)}</div>
    `;
    
    if (answer.questionTrans) {
        html += `<div class="academic-q-translation">${escapeHtml(answer.questionTrans)}</div>`;
    }
    
    // 답변 비교
    const userAnswerText = answer.userAnswer ? (answer.options[answer.userAnswer - 1] || '미응답') : '미응답';
    const correctAnswerText = answer.options[(answer.correctAnswer || 1) - 1] || '';
    
    html += `
        <div class="academic-answer-summary">
            <div class="academic-answer-row">
                <span class="academic-answer-label">내 답변:</span>
                <span class="academic-answer-value ${isCorrect ? 'correct' : 'incorrect'}">${userAnswerText}</span>
            </div>
            <div class="academic-answer-row">
                <span class="academic-answer-label">정답:</span>
                <span class="academic-answer-value correct">${correctAnswerText}</span>
            </div>
        </div>
    `;
    
    // 보기 해설
    const translations = answer.translations || answer.optionTranslations || [];
    const explanations = answer.explanations || answer.optionExplanations || [];
    
    if (answer.options && answer.options.length > 0) {
        let optionsHtml = '';
        answer.options.forEach((option, optIdx) => {
            const optionLetter = String.fromCharCode(65 + optIdx);
            const isCorrectOpt = answer.correctAnswer === (optIdx + 1);
            const translation = translations[optIdx] || '';
            const explanation = explanations[optIdx] || '';
            
            optionsHtml += `
                <div class="academic-option ${isCorrectOpt ? 'correct' : ''}">
                    <div class="academic-option-text"><span class="academic-option-marker">${optionLetter}</span>${escapeHtml(option)}</div>
                    ${translation ? `<div class="academic-option-translation">${escapeHtml(translation)}</div>` : ''}
                    ${explanation ? `
                    <div class="academic-option-explanation ${isCorrectOpt ? 'correct' : 'incorrect'}">
                        <strong>${isCorrectOpt ? '정답 이유:' : '오답 이유:'}</strong> ${escapeHtml(explanation)}
                    </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
            <button class="academic-toggle-btn" onclick="toggleAcademicExplanation('${toggleId}')">
                <span class="toggle-text">보기 상세 해설 펼치기</span>
                <i class="fas fa-chevron-down" id="${toggleId}-icon"></i>
            </button>
            <div id="${toggleId}" class="academic-options-details" style="display: none;">
                ${optionsHtml}
            </div>
        `;
    }
    
    html += `</div>`;
    
    return html;
}

// Academic 해설 토글
function toggleAcademicExplanation(toggleId) {
    const content = document.getElementById(toggleId);
    const icon = document.getElementById(toggleId + '-icon');
    const btn = content.previousElementSibling;
    const text = btn.querySelector('.toggle-text');
    
    if (content.style.display === 'none') {
        content.style.display = 'flex';
        if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
        if (text) text.textContent = '보기 상세 해설 접기';
    } else {
        content.style.display = 'none';
        if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
        if (text) text.textContent = '보기 상세 해설 펼치기';
    }
}

// Academic 스크립트 토글
function toggleAcademicScriptSection(scriptId) {
    const content = document.getElementById(scriptId);
    const icon = document.getElementById(scriptId + '-icon');
    const btn = content.previousElementSibling;
    const text = btn.querySelector('.toggle-text');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        if (icon) { icon.classList.remove('fa-chevron-down'); icon.classList.add('fa-chevron-up'); }
        if (text) text.textContent = '강의 전체 스크립트 접기';
    } else {
        content.style.display = 'none';
        if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }
        if (text) text.textContent = '강의 전체 스크립트 보기';
    }
}

// Lecture 오디오 재생/정지
function toggleLectureAudio(audioId) {
    const audio = document.getElementById(audioId);
    const icon = document.getElementById(`${audioId}-icon`);
    if (!audio) return;
    if (audio.paused) {
        document.querySelectorAll('audio').forEach(a => { if (a.id !== audioId) { a.pause(); const oi = document.getElementById(`${a.id}-icon`); if (oi) oi.className = 'fas fa-play'; } });
        audio.play();
        if (icon) icon.className = 'fas fa-pause';
    } else {
        audio.pause();
        if (icon) icon.className = 'fas fa-play';
    }
}

function seekLectureAudio(audioId, event) {
    const audio = document.getElementById(audioId);
    const seekBar = document.getElementById(`${audioId}-seek`);
    if (!audio || !seekBar) return;
    const rect = seekBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
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
    
    const highlights = document.querySelectorAll('.academic-keyword');
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
