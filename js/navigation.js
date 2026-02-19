// 학습 일정으로 돌아가기 (과제 진행 중)
function backToSchedule() {
    // 현재 활성화된 화면 확인
    const activeScreen = document.querySelector('.screen.active');
    const currentScreenId = activeScreen ? activeScreen.id : null;
    
    console.log('🔙 [뒤로가기] 현재 화면:', currentScreenId);
    
    // 과제 목록 화면(welcomeScreen)에서는 경고 없이 바로 돌아가기
    const isTaskListScreen = currentScreenId === 'welcomeScreen';
    
    // 실제 시험 화면인 경우에만 경고 표시
    let shouldConfirm = !isTaskListScreen;
    
    if (shouldConfirm) {
        if (!confirm('진행 중인 과제를 종료하고 학습 일정으로 돌아가시겠습니까?\n(현재까지의 답안은 저장되지 않습니다)')) {
            return; // 취소하면 함수 종료
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
