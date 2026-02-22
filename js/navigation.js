// 학습 일정으로 돌아가기 (과제 진행 중)
function backToSchedule() {
    // 현재 활성화된 화면 확인
    const activeScreen = document.querySelector('.screen.active');
    // active 클래스가 없는 경우 display:block인 화면도 확인
    const visibleScreen = activeScreen || document.querySelector('.screen[style*="display: block"], .screen[style*="display:block"]');
    const currentScreenId = visibleScreen ? visibleScreen.id : null;
    
    console.log('🔙 [뒤로가기] 현재 화면:', currentScreenId);
    
    // 경고 없이 바로 돌아가도 되는 화면들
    const isTaskListScreen = currentScreenId === 'welcomeScreen';
    const isResultScreen = currentScreenId && (
        currentScreenId.includes('Result') || 
        currentScreenId === 'vocabResultScreen' ||
        currentScreenId === 'resultScreen' ||
        currentScreenId === 'finalExplainScreen'
    );
    
    // 실제 시험 화면인 경우에만 경고 표시 (과제목록/결과화면은 스킵)
    if (!isTaskListScreen && !isResultScreen) {
        // AuthMonitor 상태로 구간 판별
        var hasSubmitted = window.AuthMonitor && (AuthMonitor._step1Done || AuthMonitor._step2Done);
        var msg;
        
        if (hasSubmitted) {
            // 1차 이후 (30%~60% 확보 상태)
            msg = '⚠️ 지금 나가면 남은 인증률을 받을 수 없습니다.\n나가시겠습니까?';
        } else {
            // 1차 풀이 중 (아직 제출 전)
            msg = '⚠️ 지금 나가면 모든 답안이 사라집니다.\n나가시겠습니까?';
        }
        
        if (!confirm(msg)) {
            return; // 취소하면 함수 종료
        }
    }
    
    // 해설 화면에서 오답노트 미제출 시 경고
    if (currentScreenId === 'finalExplainScreen') {
        if (window.ErrorNote && !ErrorNote.isSubmitted()) {
            if (!confirm('⚠️ 오답노트를 제출하지 않았습니다.\n그래도 나가시겠습니까?')) {
                return;
            }
        }
    }
    
    console.log('🔙 [뒤로가기] 학습 일정으로 돌아가기 시작');
    
    // 모든 미디어 즉시 중지
    stopAllMedia();
    
    // 모든 섹션 cleanup 호출
    if (typeof cleanupListeningConver === 'function') {
        cleanupListeningConver();
    }
    if (typeof cleanupListeningAnnouncement === 'function') {
        cleanupListeningAnnouncement();
    }
    if (typeof cleanupListeningResponse === 'function') {
        cleanupListeningResponse();
    }
    if (typeof cleanupListeningLecture === 'function') {
        cleanupListeningLecture();
    }
    if (typeof cleanupSpeakingRepeat === 'function') {
        cleanupSpeakingRepeat();
    }
    if (typeof cleanupSpeakingInterview === 'function') {
        cleanupSpeakingInterview();
    }
    if (typeof cleanupVocabTest === 'function') {
        cleanupVocabTest();
    }
    
    // 타이머 정지
    stopAllTimers();
    
    // 모든 화면 숨기기 (inline style 제거)
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = ''; // inline style 제거!
    });
    
    // 학습 일정 화면 표시
    const scheduleScreen = document.getElementById('scheduleScreen');
    scheduleScreen.classList.add('active');
    
    // 학습 일정 초기화
    if (currentUser) {
        initScheduleScreen();
    }
    
    console.log('✅ [뒤로가기] 학습 일정으로 돌아가기 완료');
}

// 모든 미디어 즉시 중지
function stopAllMedia() {
    console.log('🛑 모든 미디어 중지 시작');
    
    // 모든 Audio 요소 중지
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
    });
    
    // 모든 Video 요소 중지
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.currentTime = 0;
        video.src = '';
    });
    
    console.log('✅ 모든 미디어 중지 완료');
}

// 학습 일정으로 돌아가기 (결과 화면에서)
function backToScheduleFromResult() {
    // 모든 미디어 즉시 중지
    stopAllMedia();
    
    // 타이머 정지
    stopAllTimers();
    
    // 답안 초기화
    userAnswers = {
        reading: {},
        listening: {},
        speaking: {},
        writing: {}
    };
    
    // 상태 초기화
    currentTest = {
        section: null,
        currentQuestion: 0,
        currentPassage: 0,
        currentTask: 0,
        startTime: null,
        answers: {},
        currentWeek: null,
        currentDay: null
    };
    
    // 모든 화면 숨기기 (inline style 제거)
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = ''; // inline style 제거!
    });
    
    // 학습 일정 화면 표시
    const scheduleScreen = document.getElementById('scheduleScreen');
    scheduleScreen.classList.add('active');
    
    // 학습 일정 초기화
    if (currentUser) {
        initScheduleScreen();
    }
}
