/**
 * ================================================
 * auth.js v2 — Supabase 로그인 시스템
 * ================================================
 * 
 * 변경 내역:
 * - Google Sheets 인증 → Supabase users 테이블 조회
 * - 이름+전화번호 → 이메일+비밀번호
 * - 로그인 성공 시 applications에서 4주/8주 자동 판별
 * - 세션 정보에 user_id, 프로그램 타입 포함
 */

// 현재 로그인한 사용자 정보
let currentUser = null;

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    
    console.log('🔐 handleLogin 호출됨');
    
    const emailInput = document.getElementById('studentEmail');
    const passwordInput = document.getElementById('studentPassword');
    const loginBtn = document.getElementById('loginBtn');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('입력값 - 이메일:', email);
    
    // 🔧 개발 모드: 빈 값으로 로그인 시 바로 접속
    if (!email && !password) {
        console.log('🔧 [개발 모드] 빈 값 로그인');
        currentUser = {
            id: 'dev-user-001',
            name: '개발자',
            email: 'dev@test.com',
            phone: '01000000000',
            program: '내벨업챌린지 - Standard',
            programType: 'standard',
            applicationId: null
        };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        showScreen('scheduleScreen');
        return;
    }
    
    // 입력값 검증
    if (!email) {
        showLoginError('이메일을 입력해주세요.');
        return;
    }
    if (!password) {
        showLoginError('비밀번호를 입력해주세요.');
        return;
    }
    
    // 버튼 비활성화 및 로딩 표시
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 로그인 중...';
    hideLoginMessage();
    
    try {
        // 1. Supabase에서 이메일+비밀번호 확인
        const user = await loginWithCredentials(email, password);
        
        if (!user) {
            showLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
            resetLoginBtn();
            return;
        }
        
        if (user.error === 'blocked') {
            showLoginError('차단된 계정입니다. 관리자에게 문의하세요.');
            resetLoginBtn();
            return;
        }
        
        // 2. 프로그램 정보 조회 (4주/8주) + 입금 확인 체크
        const programInfo = await getStudentProgram(email);
        
        // 수강신청 없음
        if (programInfo.error === 'no_application') {
            showLoginError('수강 신청 내역이 없습니다. 공식 홈페이지에서 먼저 수강 신청을 해주세요.');
            resetLoginBtn();
            return;
        }
        
        // 입금 미확인
        if (programInfo.error === 'not_confirmed') {
            showLoginError('수강 등록이 아직 확인되지 않았습니다. 관리자에게 문의해주세요.');
            resetLoginBtn();
            return;
        }
        
        // 3. 세션에 저장할 사용자 정보 구성
        const programType = programInfo.program.includes('Fast') ? 'fast' : 'standard';
        
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            program: programInfo.program,
            programType: programType,  // 'fast' = 4주, 'standard' = 8주
            applicationId: programInfo.applicationId,
            startDate: programInfo.startDate
        };
        
        // 세션에 저장 (새로고침 시에도 유지)
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('✅ 로그인 성공:', currentUser.name, '(' + programType + ')');
        
        const programLabel = programType === 'fast' ? '4주 Fast' : '8주 Standard';
        showLoginSuccess(`환영합니다, ${currentUser.name}님! (${programLabel})`);
        
        setTimeout(() => {
            showScreen('scheduleScreen');
        }, 1200);
        
    } catch (error) {
        console.error('로그인 에러:', error);
        showLoginError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        resetLoginBtn();
    }
}

// 로그인 버튼 초기화
function resetLoginBtn() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>로그인</span>';
    }
}

// 로그인 성공 메시지 표시
function showLoginSuccess(message) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.className = 'login-message success';
    messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    messageDiv.style.display = 'block';
}

// 로그인 에러 메시지 표시
function showLoginError(message) {
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.className = 'login-message error';
    messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    messageDiv.style.display = 'block';
}

// 로그인 메시지 숨기기
function hideLoginMessage() {
    const messageDiv = document.getElementById('loginMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// 페이지 로드 시 세션 확인
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('currentUser');
    
    if (savedUser) {
        // 이미 로그인되어 있으면 학습 일정 화면으로
        currentUser = JSON.parse(savedUser);
        console.log('📋 세션 복원:', currentUser.name);
        showScreen('scheduleScreen');
    } else {
        // 로그인 화면 표시
        showScreen('loginScreen');
    }
});

// 로그아웃 함수
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        
        // 답안 초기화
        if (typeof userAnswers !== 'undefined') {
            userAnswers = {
                reading: {},
                listening: {},
                speaking: {},
                writing: {}
            };
        }
        
        // 상태 초기화
        if (typeof currentTest !== 'undefined') {
            currentTest = {
                section: null,
                currentQuestion: 0,
                currentPassage: 0,
                currentTask: 0,
                startTime: null,
                answers: {}
            };
        }
        
        if (typeof stopAllTimers === 'function') {
            stopAllTimers();
        }
        
        showScreen('loginScreen');
        
        // 폼 초기화
        const form = document.getElementById('loginForm');
        if (form) form.reset();
        hideLoginMessage();
    }
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    return currentUser;
}

// 현재 사용자 ID 가져오기 (Supabase 연동용)
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

// 현재 프로그램 타입 가져오기 ('fast' 또는 'standard')
function getCurrentProgramType() {
    return currentUser ? currentUser.programType : 'standard';
}

console.log('✅ auth.js v2 (Supabase) 로드 완료');
