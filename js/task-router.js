/**
 * 입문서 정독 PDF 모달 관련 함수
 */

// 입문서 정독 모달 열기
function openIntroBookModal(taskName) {
    const modal = document.getElementById('introBookModal');
    const taskElement = document.getElementById('introBookTask');
    
    if (taskElement) {
        taskElement.textContent = taskName;
    }
    
    modal.classList.add('active');
}

// 입문서 정독 모달 닫기
function closeIntroBookModal() {
    const modal = document.getElementById('introBookModal');
    modal.classList.remove('active');
}

// 모달 외부 클릭 시 닫기
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('introBookModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeIntroBookModal();
            }
        });
    }
});

/**
 * 과제 실행 함수
 * @param {string} taskName - 과제명 (예: "내벨업보카 5, 6, 7pg")
 */
function executeTask(taskName) {
    console.log(`📝 [과제실행] ${taskName}`);
    
    const parsed = parseTaskName(taskName);
    console.log('  파싱 결과:', parsed);
    
    switch (parsed.type) {
        case 'vocab':
            // 내벨업보카 시험 시작
            console.log(`  🔹 내벨업보카 시작 - 페이지: ${parsed.params.pages.join(', ')}`);
            startVocabTest(parsed.params.pages);
            break;
            
        case 'intro-book':
            // 입문서 정독 PDF 모달 열기
            console.log(`  🔹 입문서 정독 모달 열기`);
            openIntroBookModal(taskName);
            break;
            
        case 'reading':
            // 리딩 Module 시작
            console.log(`  🔹 리딩 Module ${parsed.params.module} 시작`);
            startReadingModule(parsed.params.module);
            break;
            
        case 'listening':
            // 리스닝 Module 시작
            console.log(`  🔹 리스닝 Module ${parsed.params.module} 시작`);
            startListeningModule(parsed.params.module);
            break;
            
        case 'writing':
            // 라이팅 시작
            console.log(`  🔹 라이팅 ${parsed.params.number} 시작`);
            startWriting(parsed.params.number);
            break;
            
        case 'speaking':
            // 스피킹 시작
            console.log(`  🔹 스피킹 ${parsed.params.number} 시작`);
            startSpeaking(parsed.params.number);
            break;
            
        default:
            console.error('  ❌ 알 수 없는 과제 타입:', parsed.type);
            alert('알 수 없는 과제 타입입니다.');
    }
}

/**
 * 내벨업보카 시험 시작
 * @param {Array<number>} pages - 페이지 번호 배열
 */
function startVocabTest(pages) {
    // 페이지 배열을 문자열로 변환 (예: [5, 6, 7] -> "5-7")
    let pageRange;
    if (pages.length === 1) {
        pageRange = pages[0].toString();
    } else if (pages.length === 2) {
        pageRange = pages.join('-'); // "5-6"
    } else {
        // 연속된 페이지인지 확인
        const isConsecutive = pages.every((page, i) => i === 0 || page === pages[i - 1] + 1);
        if (isConsecutive) {
            pageRange = `${pages[0]}-${pages[pages.length - 1]}`; // "5-7"
        } else {
            pageRange = pages.join(','); // "5,7,9"
        }
    }
    
    console.log(`📚 [내벨업보카] 페이지: ${pages.join(', ')} -> 범위: ${pageRange}`);
    
    // vocab-test-logic-v2.js의 initVocabTest 함수 호출
    if (typeof initVocabTest === 'function') {
        initVocabTest(pageRange);
    } else {
        console.error('❌ initVocabTest 함수를 찾을 수 없습니다.');
    }
}

// ✅ startReadingModule은 이제 reading-module-controller.js에서 정의됨
// 이 파일의 기존 함수들은 모두 제거됨 (더 이상 사용 안 함)

// ✅ startReadingModule은 이제 reading-module-controller.js에서 정의됨
// 아래 함수들은 더 이상 사용하지 않음 (주석 처리)

/*
// 기존 Module 관련 함수들 (사용 안 함)

function startReadingModuleTimer() { ... }
function updateReadingModuleTimerDisplay() { ... }
function stopReadingModuleTimer() { ... }
function getReadingModuleSets(moduleNum) { ... }
function startNextReadingSet() { ... }
function onReadingSetComplete(setAnswers, setType, setNum) { ... }
function finishReadingModule() { ... }
*/

/**
 */
function startReadingModuleTimer() {
    const module = window.currentReadingModule;
    if (!module) return;
    
    console.log('⏱️ [리딩 Module] 20분 타이머 시작');
    
    // 타이머 UI 요소 찾기 (각 유형마다 타이머가 있으므로 동적으로 처리)
    const timeLimit = 20 * 60; // 20분 = 1200초
    
    // Timer 객체 생성
    module.timer = {
        startTime: Date.now(),
        timeLimit: timeLimit,
        remainingTime: timeLimit,
        interval: null
    };
    
    // 타이머 시작
    module.timer.interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - module.timer.startTime) / 1000);
        module.timer.remainingTime = module.timer.timeLimit - elapsed;
        
        // 현재 활성 화면의 타이머 요소 업데이트
        updateReadingModuleTimerDisplay();
        
        // 시간 종료
        if (module.timer.remainingTime <= 0) {
            clearInterval(module.timer.interval);
            console.log('⏰ [리딩 Module] 시간 종료!');
            alert('시간이 종료되었습니다!');
            finishReadingModule();
        }
    }, 1000);
}

/**
 * 리딩 Module 타이머 표시 업데이트
 */
function updateReadingModuleTimerDisplay() {
    const module = window.currentReadingModule;
    if (!module || !module.timer) return;
    
    const remaining = module.timer.remainingTime;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // 현재 활성 유형의 타이머 요소 찾아서 업데이트
    const timerElements = [
        document.getElementById('fillBlanksTimer'),
        document.getElementById('daily1Timer'),
        document.getElementById('daily2Timer'),
        document.getElementById('academicTimer')
    ];
    
    timerElements.forEach(el => {
        if (el && el.offsetParent !== null) { // 보이는 요소만
            el.textContent = timeText;
            // 1분 미만 시 경고 색상
            if (remaining < 60) {
                el.style.color = '#ef4444';
            }
        }
    });
}

/**
 * 리딩 Module 타이머 정지
 */
function stopReadingModuleTimer() {
    const module = window.currentReadingModule;
    if (module && module.timer && module.timer.interval) {
        clearInterval(module.timer.interval);
        console.log('⏱️ [리딩 Module] 타이머 정지');
    }
}

/**
 * 리딩 Module 번호 → Set 번호 매핑
 */
function getReadingModuleSets(moduleNum) {
    return {
        fillblanks: [moduleNum * 2 - 1, moduleNum * 2],      // Module 1: [1,2], Module 2: [3,4]
        daily1: [moduleNum * 2 - 1, moduleNum * 2],          // Module 1: [1,2], Module 2: [3,4]
        daily2: [moduleNum * 2 - 1, moduleNum * 2],          // Module 1: [1,2], Module 2: [3,4]
        academic: [moduleNum]                                 // Module 1: [1], Module 2: [2]
    };
}

/**
 * 다음 리딩 세트 시작
 */
function startNextReadingSet() {
    const module = window.currentReadingModule;
    
    if (!module) {
        console.error('❌ currentReadingModule이 없습니다');
        return;
    }
    
    // 모든 세트 완료 확인
    if (module.currentIndex >= module.sequence.length) {
        console.log('🎉 리딩 Module 완료!');
        finishReadingModule();
        return;
    }
    
    const current = module.sequence[module.currentIndex];
    
    console.log(`\n▶️ [${module.currentIndex + 1}/${module.sequence.length}] ${current.type} Set ${current.setNum} 시작`);
    console.log(`   Question ${module.currentQuestionOffset + 1} ~ ${module.currentQuestionOffset + current.questionsPerSet} of ${module.totalQuestions}`);
    
    // 해당 유형의 init 함수 호출
    switch(current.type) {
        case 'fillblanks':
            if (typeof initReadingFillBlanks === 'function') {
                initReadingFillBlanks(current.setNum);
            } else {
                console.error('❌ initReadingFillBlanks 함수 없음');
            }
            break;
        case 'daily1':
            if (typeof initReadingDaily1 === 'function') {
                initReadingDaily1(current.setNum);
            } else {
                console.error('❌ initReadingDaily1 함수 없음');
            }
            break;
        case 'daily2':
            if (typeof initReadingDaily2 === 'function') {
                initReadingDaily2(current.setNum);
            } else {
                console.error('❌ initReadingDaily2 함수 없음');
            }
            break;
        case 'academic':
            if (typeof initReadingAcademic === 'function') {
                initReadingAcademic(current.setNum);
            } else {
                console.error('❌ initReadingAcademic 함수 없음');
            }
            break;
        default:
            console.error('❌ 알 수 없는 유형:', current.type);
    }
}

/**
 * 리딩 세트 완료 처리 (각 유형의 완료 시 호출)
 */
function onReadingSetComplete(setAnswers, setType, setNum) {
    const module = window.currentReadingModule;
    
    if (!module) {
        console.log('⚠️ Module 모드 아님 - 일반 결과 화면으로');
        return false; // 일반 모드
    }
    
    console.log(`✅ ${setType} Set ${setNum} 완료`);
    
    // 답안 저장
    const answerKey = `${setType}_set${setNum}`;
    module.answers[answerKey] = setAnswers;
    
    // Question offset 업데이트
    const current = module.sequence[module.currentIndex];
    module.currentQuestionOffset += current.questionsPerSet;
    
    // 다음 세트로
    module.currentIndex++;
    
    // 다음 세트 시작
    setTimeout(() => {
        startNextReadingSet();
    }, 100);
    
    return true; // Module 모드 - 계속 진행
}

/**
 * 리딩 Module 완료
 */
function finishReadingModule() {
    const module = window.currentReadingModule;
    
    // 타이머 정지
    stopReadingModuleTimer();
    
    console.log('🎉 리딩 Module 완료!');
    console.log('  수집된 답안:', module.answers);
    
    // TODO: 나중에 통합 결과 화면 구현
    alert(`리딩 Module ${module.moduleNum} 완료!\n\n(통합 결과 화면은 나중에 구현 예정)`);
    
    // Module 데이터 초기화
    window.currentReadingModule = null;
    
    // 학습 일정으로 돌아가기
    backToSchedule();
}

/**
 * 리스닝 Module 시작
 * @param {number} module - 모듈 번호
 * 
 * 실제 구현은 listening-module-controller.js에 있음
 */
// startListeningModule() 함수는 listening-module-controller.js에서 전역으로 정의됨


/**
 * 라이팅 시작
 * @param {number} number - 라이팅 번호
 */
function startWriting(number) {
    // TODO: 라이팅 시작 로직 구현
    console.log(`🚧 라이팅 ${number} 시작 (구현 예정)`);
    alert(`라이팅 ${number}을 시작합니다. (구현 예정)`);
}

/**
 * 스피킹 시작
 * @param {number} number - 스피킹 번호
 */
function startSpeaking(number) {
    // TODO: 스피킹 시작 로직 구현
    console.log(`🚧 스피킹 ${number} 시작 (구현 예정)`);
    alert(`스피킹 ${number}을 시작합니다. (구현 예정)`);
}
