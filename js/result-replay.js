/**
 * ================================================
 * result-replay.js – 해설 다시보기 기능
 * ================================================
 * 
 * 1) saveResultJsonToSupabase() : 해설 화면 렌더링 후 result_json을 Supabase에 저장
 * 2) replayExplanation()        : 마이페이지에서 해설 화면 재렌더링
 * 
 * 의존: supabase-client.js (supabaseUpdate, supabaseSelect)
 */

console.log('✅ result-replay.js 로드 시작');

// ================================================
// 1. 결과 JSON 저장 (해설 화면 렌더링 직후 호출)
// ================================================
async function saveResultJsonToSupabase(taskType, resultData) {
    try {
        // ★ 리플레이 모드면 재저장 생략
        if (window._isReplayMode) {
            console.log('📋 [ResultReplay] 리플레이 모드 — result_json 재저장 생략');
            return;
        }
        
        // AuthMonitor에서 study_record_id 가져오기
        const recordId = window.AuthMonitor && window.AuthMonitor._studyRecordId;
        
        if (!recordId) {
            console.warn('📋 [ResultReplay] studyRecordId 없음 — result_json 저장 생략 (개발 모드?)');
            return;
        }
        
        console.log(`💾 [ResultReplay] result_json 저장 시작 — recordId: ${recordId}, taskType: ${taskType}`);
        
        // result_json 구조: { taskType, data, savedAt }
        const resultJson = {
            taskType: taskType,
            data: resultData,
            savedAt: new Date().toISOString()
        };
        
        // Supabase에 PATCH 업데이트
        await supabaseUpdate(
            'tr_study_records',
            `id=eq.${recordId}`,
            { result_json: resultJson }
        );
        
        console.log('✅ [ResultReplay] result_json 저장 완료');
        
    } catch (error) {
        // 저장 실패해도 해설 화면 자체는 정상 작동해야 하므로 에러만 로그
        console.error('⚠️ [ResultReplay] result_json 저장 실패:', error);
    }
}

// ================================================
// 2. 해설 다시보기 (마이페이지에서 호출)
// ================================================
async function replayExplanation(studyRecordId) {
    console.log(`📖 [ResultReplay] 해설 다시보기 시작 — recordId: ${studyRecordId}`);
    
    try {
        // Supabase에서 해당 레코드 조회
        const records = await supabaseSelect(
            'tr_study_records',
            `id=eq.${studyRecordId}&select=task_type,result_json,week,day,module_number`
        );
        
        if (!records || records.length === 0) {
            alert('학습 기록을 찾을 수 없습니다.');
            return;
        }
        
        const record = records[0];
        const resultJson = record.result_json;
        
        const taskType = record.task_type;
        
        if (!resultJson || !resultJson.data) {
            // ★ result_json 없음 → 원본 콘텐츠에서 재조합 (fallback)
            console.log('📖 [ResultReplay] result_json 없음 — 원본 콘텐츠로 해설 재구성');
            
            if (window.location.pathname.includes('mypage')) {
                sessionStorage.setItem('replayData', JSON.stringify({
                    studyRecordId,
                    taskType,
                    resultData: null,
                    week: record.week,
                    day: record.day,
                    moduleNumber: record.module_number,
                    fallback: true
                }));
                window.location.href = 'index.html?replay=true';
                return;
            }
            
            await executeFallbackReplay(taskType, record);
            return;
        }
        
        const resultData = resultJson.data;
        
        console.log(`📖 [ResultReplay] taskType: ${taskType}, 데이터 크기: ${JSON.stringify(resultData).length} bytes`);
        
        // 마이페이지 → 메인 페이지로 이동
        if (window.location.pathname.includes('mypage')) {
            sessionStorage.setItem('replayData', JSON.stringify({
                studyRecordId,
                taskType,
                resultData,
                week: record.week,
                day: record.day,
                moduleNumber: record.module_number
            }));
            window.location.href = 'index.html?replay=true';
            return;
        }
        
        // index.html에서 호출된 경우 → 바로 렌더링
        executeReplay(taskType, resultData, record);
        
    } catch (error) {
        console.error('❌ [ResultReplay] 해설 다시보기 실패:', error);
        alert('해설을 불러오는 중 오류가 발생했습니다.');
    }
}

// ================================================
// 3. 실제 해설 화면 렌더링 실행
// ================================================
function executeReplay(taskType, resultData, record) {
    console.log(`🎨 [ResultReplay] 렌더링 실행 — taskType: ${taskType}`);
    
    // ★ 리플레이 모드 플래그 (saveResultJsonToSupabase 재호출 방지)
    window._isReplayMode = true;
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // currentTest 복원 (Week/Day 표시용) — 전역 변수 + sessionStorage 둘 다 설정
    if (window.currentTest) {
        window.currentTest.currentWeek = record.week || 1;
        window.currentTest.currentDay = record.day || '월';
    } else {
        window.currentTest = {
            currentWeek: record.week || 1,
            currentDay: record.day || '월',
            section: null, currentQuestion: 0, currentPassage: 0,
            currentTask: 0, startTime: null, answers: {}
        };
    }
    sessionStorage.setItem('currentTest', JSON.stringify(window.currentTest));
    
    // taskType에 따라 분기
    switch (taskType) {
        case 'reading': {
            // resultData 구조로 어떤 리딩 타입인지 판별
            const subType = detectReadingSubType(resultData);
            console.log(`📖 [ResultReplay] 리딩 하위 타입: ${subType}`);
            
            switch (subType) {
                case 'fillblanks':
                    sessionStorage.setItem('fillBlanksResults', JSON.stringify(resultData));
                    showResultScreen();
                    break;
                case 'daily1':
                    sessionStorage.setItem('daily1Results', JSON.stringify(resultData));
                    showDaily1Results();
                    break;
                case 'daily2':
                    sessionStorage.setItem('daily2Results', JSON.stringify(resultData));
                    showDaily2Results();
                    break;
                case 'academic':
                    sessionStorage.setItem('academicResults', JSON.stringify(resultData));
                    showAcademicResults();
                    break;
                default:
                    alert('알 수 없는 리딩 유형입니다.');
            }
            break;
        }
        
        // 리스닝은 추후 구현
        case 'listening':
            alert('리스닝 해설 다시보기는 곧 추가됩니다!');
            break;
            
        default:
            alert(`${taskType} 해설 다시보기는 아직 지원하지 않습니다.`);
    }
    
    // ★ 마이페이지 돌아가기 플로팅 버튼 삽입
    addReplayBackButton();
}

// ================================================
// 4. 마이페이지 돌아가기 플로팅 버튼
// ================================================
function addReplayBackButton() {
    // 이미 존재하면 제거
    const existing = document.getElementById('replayBackBtn');
    if (existing) existing.remove();
    
    const btn = document.createElement('button');
    btn.id = 'replayBackBtn';
    btn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> 마이페이지로 돌아가기';
    btn.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 28px;
        background: linear-gradient(135deg, #9480c5, #7a66b0);
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(122, 102, 176, 0.4);
        transition: all 0.2s;
        font-family: 'Pretendard Variable', sans-serif;
    `;
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateX(-50%) translateY(-2px)';
        btn.style.boxShadow = '0 6px 20px rgba(122, 102, 176, 0.55)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateX(-50%)';
        btn.style.boxShadow = '0 4px 16px rgba(122, 102, 176, 0.4)';
    });
    btn.addEventListener('click', () => {
        window._isReplayMode = false;
        window.location.href = 'mypage.html';
    });
    
    document.body.appendChild(btn);
    console.log('✅ [ResultReplay] 마이페이지 돌아가기 버튼 추가');
}

// ================================================
// 5. 리딩 하위 타입 판별 (rename from 4)
// ================================================
function detectReadingSubType(resultData) {
    if (!Array.isArray(resultData) || resultData.length === 0) {
        return 'unknown';
    }
    
    const firstSet = resultData[0];
    
    // fillblanks: blanks 배열이 있음
    if (firstSet.blanks || firstSet.passage_with_markers) {
        return 'fillblanks';
    }
    
    // answers 개수로 구분
    if (firstSet.answers) {
        const answerCount = firstSet.answers.length;
        if (answerCount === 5) return 'academic';
        if (answerCount === 3) return 'daily2';
        if (answerCount === 2) return 'daily1';
    }
    
    // passage.interactiveWords로 추가 판별
    if (firstSet.passage && firstSet.passage.interactiveWords) {
        return 'academic'; // 인터랙티브 워드가 있으면 daily1/daily2/academic
    }
    
    return 'unknown';
}

// ================================================
// 6. 페이지 로드 시 replay 파라미터 확인
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('replay') === 'true') {
        const replayDataStr = sessionStorage.getItem('replayData');
        if (replayDataStr) {
            sessionStorage.removeItem('replayData');
            
            const replayData = JSON.parse(replayDataStr);
            console.log('🔄 [ResultReplay] replay 모드 감지 — 해설 다시보기 실행');
            
            // 약간의 지연 (다른 스크립트 로드 대기)
            setTimeout(async () => {
                if (replayData.fallback) {
                    // result_json 없음 → 원본 콘텐츠 재조합
                    await executeFallbackReplay(replayData.taskType, {
                        week: replayData.week,
                        day: replayData.day,
                        module_number: replayData.moduleNumber
                    });
                } else {
                    executeReplay(replayData.taskType, replayData.resultData, {
                        week: replayData.week,
                        day: replayData.day,
                        module_number: replayData.moduleNumber
                    });
                }
                
                // URL에서 ?replay=true 제거 (뒤로가기 시 깔끔하게)
                window.history.replaceState({}, '', 'index.html');
            }, 800);
        }
    }

    // ── retry(다시 풀기) 파라미터 처리 ──
    if (params.get('retry') === 'true') {
        const retryDataStr = sessionStorage.getItem('retryData');
        if (retryDataStr) {
            sessionStorage.removeItem('retryData');
            
            const retryData = JSON.parse(retryDataStr);
            console.log('🔄 [Retry] 다시 풀기 모드 감지:', retryData);
            
            // 연습 모드 플래그 설정
            window._deadlinePassedMode = true;
            window._isPracticeMode = true;
            
            setTimeout(() => {
                // currentTest에 주차/요일 설정
                if (typeof currentTest !== 'undefined') {
                    currentTest.currentWeek = retryData.week;
                    currentTest.currentDay = retryData.day;
                } else if (window.currentTest) {
                    window.currentTest.currentWeek = retryData.week;
                    window.currentTest.currentDay = retryData.day;
                }
                
                // task-router의 과제 실행 함수 호출
                const taskType = retryData.taskType;
                const moduleNum = retryData.moduleNumber;
                
                try {
                    switch (taskType) {
                        case 'reading':
                            if (typeof startReadingModule === 'function') {
                                startReadingModule(moduleNum);
                            }
                            break;
                        case 'listening':
                            if (typeof startListeningModule === 'function') {
                                startListeningModule(moduleNum);
                            }
                            break;
                        case 'writing':
                            if (typeof startWriting === 'function') {
                                startWriting(moduleNum);
                            }
                            break;
                        case 'speaking':
                            if (typeof startSpeaking === 'function') {
                                startSpeaking(moduleNum);
                            }
                            break;
                        case 'vocab':
                            if (typeof initVocabTest === 'function') {
                                // vocab은 페이지 정보가 필요 — 스케줄에서 찾기
                                console.log('📝 [Retry] Vocab 다시풀기 — 스케줄에서 시작');
                                showScreen('scheduleScreen');
                            }
                            break;
                        default:
                            console.warn('⚠️ [Retry] 지원하지 않는 과제 타입:', taskType);
                            showScreen('scheduleScreen');
                    }
                } catch (e) {
                    console.error('❌ [Retry] 과제 실행 실패:', e);
                    showScreen('scheduleScreen');
                }
                
                // URL 정리
                window.history.replaceState({}, '', 'index.html');
            }, 1000);
        }
    }
});

// ================================================
// 7. 원본 콘텐츠 Fallback (result_json 없을 때)
// ================================================

/**
 * result_json 없이 원본 콘텐츠에서 해설 화면 재구성
 * - 학생 답안(userAnswer)은 null로 표시
 * - 정답/해설은 원본 데이터에서 가져옴
 * - 유형 선택 화면을 먼저 보여줌
 */
async function executeFallbackReplay(taskType, record) {
    console.log(`📖 [Fallback] 원본 콘텐츠 재조합 시작 — taskType: ${taskType}, module: ${record.module_number}`);
    
    window._isReplayMode = true;
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // currentTest 복원
    if (window.currentTest) {
        window.currentTest.currentWeek = record.week || 1;
        window.currentTest.currentDay = record.day || '월';
    } else {
        window.currentTest = {
            currentWeek: record.week || 1,
            currentDay: record.day || '월',
            section: null, currentQuestion: 0, currentPassage: 0,
            currentTask: 0, startTime: null, answers: {}
        };
    }
    sessionStorage.setItem('currentTest', JSON.stringify(window.currentTest));
    
    if (taskType !== 'reading') {
        alert(`${taskType} 해설은 아직 원본 재구성을 지원하지 않습니다.`);
        return;
    }
    
    const moduleNumber = record.module_number || 1;
    
    // 유형 선택 화면 표시
    showFallbackTypeSelector(moduleNumber, record);
}

/**
 * 리딩 유형 선택 화면
 */
function showFallbackTypeSelector(moduleNumber, record) {
    // 기존 선택 화면 제거
    let selector = document.getElementById('replayTypeSelector');
    if (selector) selector.remove();
    
    const week = record.week || 1;
    const day = record.day || '월';
    
    selector = document.createElement('div');
    selector.id = 'replayTypeSelector';
    selector.className = 'screen active';
    selector.style.cssText = `
        display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: #f7f6fb; z-index: 9998; overflow-y: auto;
        font-family: 'Pretendard Variable', -apple-system, sans-serif;
    `;
    
    selector.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; padding: 32px 20px 100px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #9480c5, #7a66b0); color: #fff; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
                    <i class="fa-solid fa-book-open"></i> Week ${week} - ${day}요일
                </div>
                <h2 style="font-size: 22px; font-weight: 800; color: #1e1e2f; margin: 0 0 8px;">Reading Module ${moduleNumber} 해설</h2>
                <p style="font-size: 14px; color: #888; margin: 0; line-height: 1.6;">
                    보고 싶은 유형을 선택하세요<br>
                    <span style="font-size: 12px; color: #bbb;">※ 이 기능 추가 전 기록이라 답안 데이터는 없습니다</span>
                </p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${buildTypeCard('fillblanks', '빈칸 채우기', 'Fill in the Blanks', 'fa-pen-to-square', '#9480c5', '2세트', moduleNumber)}
                ${buildTypeCard('daily1', '일상 리딩 1', 'Daily Reading 1', 'fa-book', '#5b9bd5', '2세트', moduleNumber)}
                ${buildTypeCard('daily2', '일상 리딩 2', 'Daily Reading 2', 'fa-book-bookmark', '#7aaa7e', '2세트', moduleNumber)}
                ${buildTypeCard('academic', '아카데믹 리딩', 'Academic Reading', 'fa-graduation-cap', '#e67e5a', '1세트', moduleNumber)}
            </div>
        </div>
    `;
    
    document.body.appendChild(selector);
    addReplayBackButton();
}

function buildTypeCard(type, nameKr, nameEn, icon, color, setCount, moduleNumber) {
    return `
        <button onclick="loadFallbackType('${type}', ${moduleNumber})" style="
            display: flex; align-items: center; gap: 16px;
            width: 100%; padding: 20px; border: 1px solid rgba(148,128,197,0.15);
            background: #fff; border-radius: 16px; cursor: pointer;
            transition: all 0.2s; text-align: left;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        " onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';this.style.borderColor='${color}'"
           onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)';this.style.borderColor='rgba(148,128,197,0.15)'">
            <div style="
                width: 52px; height: 52px; border-radius: 14px;
                background: ${color}15; display: flex; align-items: center; justify-content: center;
                flex-shrink: 0;
            ">
                <i class="fa-solid ${icon}" style="font-size: 20px; color: ${color};"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 16px; font-weight: 700; color: #1e1e2f; margin-bottom: 2px;">${nameKr}</div>
                <div style="font-size: 12px; color: #999;">${nameEn} · ${setCount}</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="font-size: 14px; color: #ccc;"></i>
        </button>
    `;
}

/**
 * 유형 선택 후 해당 타입 데이터 로드 & 렌더링
 */
async function loadFallbackType(subType, moduleNumber) {
    console.log(`📖 [Fallback] ${subType} 로드 시작 (module ${moduleNumber})`);
    
    // 로딩 표시
    const selector = document.getElementById('replayTypeSelector');
    if (selector) {
        const cards = selector.querySelector('div[style*="flex-direction: column"]');
        if (cards) cards.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;display:block;"></i>데이터를 불러오는 중...</div>';
    }
    
    try {
        const startId = (moduleNumber - 1) * 2 + 1;
        let resultData = [];
        
        switch (subType) {
            case 'fillblanks':
                resultData = await loadFillblanksSets(startId, 2);
                break;
            case 'daily1':
                resultData = await loadDaily1Sets(startId, 2);
                break;
            case 'daily2':
                resultData = await loadDaily2Sets(startId, 2);
                break;
            case 'academic':
                resultData = await loadAcademicSets(moduleNumber, 1);
                break;
        }
        
        if (!resultData || resultData.length === 0) {
            alert('해당 유형의 데이터를 찾을 수 없습니다.');
            // 선택 화면 복원
            if (selector) selector.remove();
            showFallbackTypeSelector(moduleNumber, {
                week: window.currentTest?.currentWeek || 1,
                day: window.currentTest?.currentDay || '월',
                module_number: moduleNumber
            });
            return;
        }
        
        // 선택 화면 제거
        if (selector) selector.remove();
        
        // 기존 back 버튼 제거 (새로 추가됨)
        const backBtn = document.getElementById('replayBackBtn');
        if (backBtn) backBtn.remove();
        
        // 해당 타입 결과 화면 렌더링
        switch (subType) {
            case 'fillblanks':
                sessionStorage.setItem('fillBlanksResults', JSON.stringify(resultData));
                showResultScreen();
                break;
            case 'daily1':
                sessionStorage.setItem('daily1Results', JSON.stringify(resultData));
                showDaily1Results();
                break;
            case 'daily2':
                sessionStorage.setItem('daily2Results', JSON.stringify(resultData));
                showDaily2Results();
                break;
            case 'academic':
                sessionStorage.setItem('academicResults', JSON.stringify(resultData));
                showAcademicResults();
                break;
        }
        
        // "유형 선택으로 돌아가기" + "마이페이지" 버튼 추가
        addFallbackNavButtons(moduleNumber);
        
    } catch (error) {
        console.error('❌ [Fallback] 데이터 로드 실패:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * Fallback 모드 네비게이션 버튼 (유형선택 + 마이페이지)
 */
function addFallbackNavButtons(moduleNumber) {
    // 기존 버튼 제거
    const existing = document.getElementById('replayBackBtn');
    if (existing) existing.remove();
    const existingNav = document.getElementById('fallbackNavBtns');
    if (existingNav) existingNav.remove();
    
    const nav = document.createElement('div');
    nav.id = 'fallbackNavBtns';
    nav.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        z-index: 9999; display: flex; gap: 10px;
        font-family: 'Pretendard Variable', sans-serif;
    `;
    
    // 유형 선택 버튼
    const typeSelectorBtn = document.createElement('button');
    typeSelectorBtn.innerHTML = '<i class="fa-solid fa-list"></i> 다른 유형 보기';
    typeSelectorBtn.style.cssText = `
        display: inline-flex; align-items: center; gap: 8px;
        padding: 14px 24px; background: #fff; color: #7a66b0;
        font-size: 14px; font-weight: 700; border: 2px solid #d8d0eb;
        border-radius: 50px; cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        transition: all 0.2s;
    `;
    typeSelectorBtn.addEventListener('click', () => {
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        nav.remove();
        showFallbackTypeSelector(moduleNumber, {
            week: window.currentTest?.currentWeek || 1,
            day: window.currentTest?.currentDay || '월',
            module_number: moduleNumber
        });
    });
    
    // 마이페이지 버튼
    const backBtn = document.createElement('button');
    backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> 마이페이지';
    backBtn.style.cssText = `
        display: inline-flex; align-items: center; gap: 8px;
        padding: 14px 24px; background: linear-gradient(135deg, #9480c5, #7a66b0);
        color: #fff; font-size: 14px; font-weight: 700; border: none;
        border-radius: 50px; cursor: pointer;
        box-shadow: 0 4px 16px rgba(122, 102, 176, 0.4);
        transition: all 0.2s;
    `;
    backBtn.addEventListener('click', () => {
        window._isReplayMode = false;
        window.location.href = 'mypage.html';
    });
    
    nav.appendChild(typeSelectorBtn);
    nav.appendChild(backBtn);
    document.body.appendChild(nav);
}

// ---- Fillblanks 원본 로드 & 변환 ----
async function loadFillblanksSets(startId, count) {
    try {
        const rows = await supabaseSelect('tr_reading_fillblanks', 'select=id,passage_with_markers&order=id.asc');
        if (!rows || rows.length === 0) return [];
        
        const results = [];
        for (let i = 0; i < count; i++) {
            const idx = startId - 1 + i;
            if (idx >= rows.length) break;
            
            const row = rows[idx];
            const parsed = parsePassageWithMarkers(row.passage_with_markers);
            
            const sortedBlanks = [...parsed.blanks].sort((a, b) => a.startIndex - b.startIndex);
            
            results.push({
                type: 'fillblanks',
                setId: row.id,
                setNumber: startId + i,
                setTitle: 'Fill in the missing letters in the paragraph.',
                passage: parsed.cleanPassage,
                blanks: parsed.blanks,
                answers: sortedBlanks.map(blank => ({
                    blankId: blank.id,
                    question: `${blank.prefix}_____ (${blank.blankCount}글자)`,
                    userAnswer: '',
                    correctAnswer: blank.answer,
                    prefix: blank.prefix,
                    isCorrect: false,
                    explanation: blank.explanation || '해설이 준비 중입니다.',
                    commonMistakes: blank.commonMistakes || '',
                    mistakesExplanation: blank.mistakesExplanation || '',
                    _noUserAnswer: true
                }))
            });
        }
        return results;
    } catch (e) {
        console.error('❌ [Fallback] fillblanks 로드 실패:', e);
        return [];
    }
}

// ---- Daily1 원본 로드 & 변환 ----
async function loadDaily1Sets(startId, count) {
    try {
        const rows = await supabaseSelect('tr_reading_daily1', 'select=*&order=id.asc');
        if (!rows || rows.length === 0) return [];
        
        const results = [];
        for (let i = 0; i < count; i++) {
            const idx = startId - 1 + i;
            if (idx >= rows.length) break;
            
            const row = rows[idx];
            const set = parseDaily1Row(row);
            
            results.push({
                type: 'daily1',
                setId: row.id,
                setNumber: startId + i,
                mainTitle: set.mainTitle,
                passage: set.passage,
                answers: set.questions.map((q, qIdx) => ({
                    questionNum: q.questionNum || `Q${qIdx + 1}`,
                    question: q.question,
                    questionTranslation: q.questionTranslation || '',
                    options: q.options || [],
                    userAnswer: null,
                    correctAnswer: q.correctAnswer,
                    isCorrect: false,
                    _noUserAnswer: true
                }))
            });
        }
        return results;
    } catch (e) {
        console.error('❌ [Fallback] daily1 로드 실패:', e);
        return [];
    }
}

// ---- Daily2 원본 로드 & 변환 ----
async function loadDaily2Sets(startId, count) {
    try {
        const rows = await supabaseSelect('tr_reading_daily2', 'select=*&order=id.asc');
        if (!rows || rows.length === 0) return [];
        
        const results = [];
        for (let i = 0; i < count; i++) {
            const idx = startId - 1 + i;
            if (idx >= rows.length) break;
            
            const row = rows[idx];
            const set = parseDaily2Row(row);
            
            results.push({
                type: 'daily2',
                setId: row.id,
                setNumber: startId + i,
                mainTitle: set.mainTitle,
                passage: set.passage,
                answers: set.questions.map((q, qIdx) => ({
                    questionNum: q.questionNum || `Q${qIdx + 1}`,
                    question: q.question,
                    questionTranslation: q.questionTranslation || '',
                    options: q.options || [],
                    userAnswer: null,
                    correctAnswer: q.correctAnswer,
                    isCorrect: false,
                    _noUserAnswer: true
                }))
            });
        }
        return results;
    } catch (e) {
        console.error('❌ [Fallback] daily2 로드 실패:', e);
        return [];
    }
}

// ---- Academic 원본 로드 & 변환 ----
async function loadAcademicSets(startId, count) {
    try {
        const rows = await supabaseSelect('tr_reading_academic', 'select=*&order=id.asc');
        if (!rows || rows.length === 0) return [];
        
        const results = [];
        for (let i = 0; i < count; i++) {
            const idx = startId - 1 + i;
            if (idx >= rows.length) break;
            
            const row = rows[idx];
            const set = parseAcademicRow(row);
            if (!set) continue;
            
            results.push({
                setId: row.id,
                mainTitle: set.mainTitle,
                passage: set.passage,
                answers: set.questions.map((q, qIdx) => ({
                    questionIndex: qIdx,
                    questionNum: q.questionNum || `Q${qIdx + 1}`,
                    question: q.question,
                    questionTranslation: q.questionTranslation || '',
                    userAnswer: null,
                    correctAnswer: q.correctAnswer,
                    isCorrect: false,
                    options: q.options,
                    _noUserAnswer: true
                }))
            });
        }
        return results;
    } catch (e) {
        console.error('❌ [Fallback] academic 로드 실패:', e);
        return [];
    }
}

// ---- Supabase row → 파싱 헬퍼 ----

function parseDaily1Row(row) {
    const translations = row.sentence_translations ? row.sentence_translations.split('##') : [];
    const interactiveWords = parseInteractiveWords(row.interactive_words);
    
    const q1 = parseQuestionData(row.question1);
    const q2 = parseQuestionData(row.question2);
    const questions = [];
    if (q1) questions.push(q1);
    if (q2) questions.push(q2);
    
    return {
        id: row.id,
        mainTitle: row.main_title,
        passage: {
            title: row.passage_title,
            content: row.passage_content,
            translations,
            interactiveWords
        },
        questions
    };
}

function parseDaily2Row(row) {
    const translations = row.sentence_translations ? row.sentence_translations.split('##') : [];
    const interactiveWords = parseInteractiveWords(row.interactive_words);
    
    const q1 = parseDaily2QuestionData(row.question1);
    const q2 = parseDaily2QuestionData(row.question2);
    const q3 = parseDaily2QuestionData(row.question3);
    const questions = [];
    if (q1) questions.push(q1);
    if (q2) questions.push(q2);
    if (q3) questions.push(q3);
    
    return {
        id: row.id,
        mainTitle: row.main_title,
        passage: {
            title: row.passage_title,
            content: row.passage_content,
            translations,
            interactiveWords
        },
        questions
    };
}

function parseAcademicRow(row) {
    const translations = row.sentence_translations ? row.sentence_translations.split('##') : [];
    const interactiveWords = parseInteractiveWords(row.interactive_words);
    
    const questions = [];
    [row.question1, row.question2, row.question3, row.question4, row.question5].forEach(qStr => {
        if (qStr) {
            const q = parseAcademicQuestionData(qStr);
            if (q) questions.push(q);
        }
    });
    
    if (questions.length !== 5) {
        console.warn(`⚠️ [Fallback] ${row.id}: ${questions.length}/5 문제만 파싱됨`);
        return null;
    }
    
    return {
        id: row.id,
        mainTitle: row.main_title,
        passage: {
            title: row.passage_title,
            content: row.passage_content,
            translations,
            interactiveWords
        },
        questions
    };
}

function parseInteractiveWords(str) {
    if (!str) return [];
    return str.split('##').map(wordStr => {
        const parts = wordStr.split('::');
        if (parts.length >= 2) {
            return {
                word: parts[0].trim(),
                translation: parts[1].trim(),
                explanation: parts.length >= 3 ? parts[2].trim() : ''
            };
        }
        return null;
    }).filter(Boolean);
}

// 전역 노출
window.saveResultJsonToSupabase = saveResultJsonToSupabase;
window.replayExplanation = replayExplanation;
window.executeReplay = executeReplay;
window.executeFallbackReplay = executeFallbackReplay;
window.loadFallbackType = loadFallbackType;

console.log('✅ result-replay.js 로드 완료');
