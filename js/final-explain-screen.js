// Final Explain Screen Component
// 최종 해설 화면 컴포넌트

console.log('✅ final-explain-screen.js 로드 완료');

// 현재 페이지 인덱스 저장
let currentFinalExplainPageIndex = 1;

/**
 * 최종 해설 화면 표시
 * @param {Object} data - 데이터 객체
 * @param {string} data.week - 주차 (예: "Week 1")
 * @param {string} data.day - 요일 (예: "월요일")
 * @param {string} data.moduleName - 모듈명 (예: "Reading Module 1")
 * @param {string} data.sectionName - 섹션명 (예: "빈칸채우기")
 * @param {Array} data.firstAttempt - 1차 답변 배열
 * @param {Array} data.secondAttempt - 2차 답변 배열
 * @param {number} data.pageIndex - 페이지 인덱스 (1: Response, 2: Conversation, 3: Announcement, 4: Lecture)
 */
function showFinalExplainScreen(data) {
    console.log('🎯 최종 해설 화면 표시:', data);
    
    // 페이지 인덱스 저장
    if (data.pageIndex) {
        currentFinalExplainPageIndex = data.pageIndex;
    }
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    // 제목 설정 (아이콘 HTML 생성)
    const iconHtml = data.moduleName.includes('Reading') 
        ? '<span class="final-icon final-icon-reading"></span>' 
        : '<span class="final-icon final-icon-listening"></span>';
    const title = `${data.week} - ${data.day} : ${data.moduleName} 최종 해설`;
    document.getElementById('finalExplainTitle').innerHTML = iconHtml + title;
    
    // 유형 제목 설정
    const moduleType = data.moduleName.includes('Reading') ? 'Reading' : 'Listening';
    const sectionTitle = `${moduleType} - ${data.sectionName}`;
    document.getElementById('finalSectionTitle').textContent = sectionTitle;
    
    // 통계 계산
    const totalQuestions = data.firstAttempt.length;
    const firstCorrect = data.firstAttempt.filter(a => a.isCorrect).length;
    const secondCorrect = data.secondAttempt.filter(a => a.isCorrect).length;
    const improvement = secondCorrect - firstCorrect;
    
    const firstPercent = Math.round((firstCorrect / totalQuestions) * 100);
    const secondPercent = Math.round((secondCorrect / totalQuestions) * 100);
    const improvementPercent = secondPercent - firstPercent;
    
    // 통계 박스 업데이트
    document.getElementById('finalTotal').textContent = totalQuestions;
    document.getElementById('finalFirst').textContent = `${firstCorrect}/${totalQuestions} (${firstPercent}%)`;
    document.getElementById('finalSecond').textContent = `${secondCorrect}/${totalQuestions} (${secondPercent}%)`;
    
    const improvementText = improvement >= 0 ? `+${improvement}문제 (+${improvementPercent}%)` : `${improvement}문제 (${improvementPercent}%)`;
    document.getElementById('finalImprovement').textContent = improvementText;
    
    // 화면 표시
    document.getElementById('finalExplainScreen').style.display = 'block';
    
    console.log('✅ 최종 해설 화면 표시 완료');
}

/**
 * 다음 페이지로 이동
 */
function goToNextFinalExplainPage() {
    console.log('📄 다음 페이지 이동:', currentFinalExplainPageIndex);
    
    const nextPageIndex = currentFinalExplainPageIndex + 1;
    
    // 페이지 범위 확인 (1: Response, 2: Conversation, 3: Announcement, 4: Lecture)
    if (nextPageIndex > 4) {
        console.log('⚠️ 마지막 페이지입니다');
        backToSchedule();
        return;
    }
    
    // 다음 페이지 표시
    showListeningRetakeDetailPage(nextPageIndex);
}

/**
 * 최종 해설 화면 테스트 진입점
 */
function testFinalExplainScreen() {
    console.log('🧪 최종 해설화면 테스트 시작');
    
    // 테스트 데이터
    const testData = {
        week: 'Week 1',
        day: '월요일',
        moduleName: 'Reading Module 1',
        sectionName: '빈칸채우기',
        firstAttempt: [
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true }
        ],
        secondAttempt: [
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true }
        ]
    };
    
    showFinalExplainScreen(testData);
}

// 전역 노출
window.showFinalExplainScreen = showFinalExplainScreen;
window.testFinalExplainScreen = testFinalExplainScreen;
window.goToNextFinalExplainPage = goToNextFinalExplainPage;
