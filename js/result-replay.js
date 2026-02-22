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
        
        if (!resultJson || !resultJson.data) {
            alert('해설 데이터가 저장되지 않은 기록입니다.\n(이 기능 추가 전에 푼 문제는 다시보기가 불가합니다)');
            return;
        }
        
        const taskType = record.task_type;
        const resultData = resultJson.data;
        
        console.log(`📖 [ResultReplay] taskType: ${taskType}, 데이터 크기: ${JSON.stringify(resultData).length} bytes`);
        
        // 마이페이지 → 메인 페이지로 이동
        if (window.location.pathname.includes('mypage')) {
            // mypage.html에서 호출된 경우 → index.html로 이동하면서 데이터 전달
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
            setTimeout(() => {
                executeReplay(replayData.taskType, replayData.resultData, {
                    week: replayData.week,
                    day: replayData.day,
                    module_number: replayData.moduleNumber
                });
                
                // URL에서 ?replay=true 제거 (뒤로가기 시 깔끔하게)
                window.history.replaceState({}, '', 'index.html');
            }, 800);
        }
    }
});

// 전역 노출
window.saveResultJsonToSupabase = saveResultJsonToSupabase;
window.replayExplanation = replayExplanation;
window.executeReplay = executeReplay;

console.log('✅ result-replay.js 로드 완료');
