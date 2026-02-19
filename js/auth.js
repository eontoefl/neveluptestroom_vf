// Google Sheets 인증 시스템
// 설정: Google Sheets를 공개로 설정하고 CSV로 읽어오기

const SHEET_CONFIG = {
    // Google Sheets를 CSV로 내보낸 URL
    // 설정 방법: README.md 참조
    sheetURL: 'YOUR_GOOGLE_SHEET_CSV_URL_HERE',
    
    // 또는 직접 Google Sheets ID와 GID 사용
    spreadsheetId: '1vyi3LV5bZNQ0dxsZOjpde94BD8aTwtu-MvzCVgtxOIE',
    sheetGid: '0', // 첫 번째 시트는 0
};

// Google Sheets CSV URL 생성 함수
function getSheetCSVUrl() {
    // 사용자가 전체 URL을 입력한 경우
    if (SHEET_CONFIG.sheetURL && SHEET_CONFIG.sheetURL !== 'YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
        return SHEET_CONFIG.sheetURL;
    }
    
    // Spreadsheet ID와 GID로 URL 생성
    if (SHEET_CONFIG.spreadsheetId !== 'YOUR_SPREADSHEET_ID') {
        return `https://docs.google.com/spreadsheets/d/${SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${SHEET_CONFIG.sheetGid}`;
    }
    
    return null;
}

// 현재 로그인한 사용자 정보
let currentUser = null;

// Google Sheets에서 수강생 목록 가져오기
async function fetchAuthorizedStudents() {
    const csvUrl = getSheetCSVUrl();
    
    if (!csvUrl) {
        console.error('Google Sheets URL이 설정되지 않았습니다.');
        // 데모 모드: 테스트용 데이터 반환
        return [
            { name: '홍길동', phone: '01012345678', program: '내벨업챌린지 - Standard' },
            { name: '김철수', phone: '01087654321', program: '내벨업챌린지 - Fast' },
            { name: '이영희', phone: '01055556666', program: '내벨업챌린지 - Standard' },
            { name: '박민수', phone: '01099998888', program: '내벨업챌린지 - Fast' }
        ];
    }
    
    try {
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error('Google Sheets에 접근할 수 없습니다. 공개 설정을 확인해주세요.');
        }
        
        const csvText = await response.text();
        return parseCSVtoStudents(csvText);
        
    } catch (error) {
        console.error('수강생 목록 로드 실패:', error);
        showLoginError('수강생 목록을 불러오는데 실패했습니다. 관리자에게 문의하세요.');
        return [];
    }
}

// CSV 텍스트를 수강생 배열로 변환
function parseCSVtoStudents(csvText) {
    const lines = csvText.trim().split('\n');
    const students = [];
    
    // 첫 줄은 헤더이므로 건너뛰기
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // CSV 파싱 (쉼표로 구분, 따옴표 처리)
        const values = parseCSVLine(line);
        
        if (values.length >= 2) {
            const name = values[0].trim();
            const phone = values[1].trim().replace(/[^0-9]/g, ''); // 숫자만 추출
            const program = values.length >= 3 ? values[2].trim() : '내벨업챌린지 - Standard'; // 프로그램 정보 (기본값: Standard)
            
            if (name && phone) {
                students.push({ name, phone, program });
            }
        }
    }
    
    return students;
}

// CSV 라인 파싱 (따옴표 처리)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    
    console.log('🔐 handleLogin 호출됨');
    
    const nameInput = document.getElementById('studentName');
    const phoneInput = document.getElementById('studentPhone');
    const loginBtn = document.getElementById('loginBtn');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim().replace(/[^0-9]/g, ''); // 숫자만 추출
    
    console.log('입력값 - 이름:', name, '전화:', phone);
    console.log('빈 값 체크 - !name:', !name, '!phone:', !phone);
    
    // 🔧 개발 모드: 빈 값으로 인증 시 바로 로그인
    if (!name && !phone) {
        console.log('✅ 빈 값 로그인 조건 만족!');
        console.log('🔧 [개발 모드] 빈 값 로그인 시작');
        currentUser = {
            name: '황경민',
            phone: '01088492728',
            program: '내벨업챌린지 - Standard'
        };
        console.log('currentUser 설정:', currentUser);
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('sessionStorage 저장 완료');
        console.log('scheduleScreen으로 이동 시도...');
        showScreen('scheduleScreen');
        console.log('화면 전환 완료');
        return;
    }
    
    console.log('❌ 빈 값 로그인 조건 불만족 - 일반 인증 진행');
    
    // 버튼 비활성화 및 로딩 표시
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 인증 중...';
    
    try {
        // Google Sheets에서 수강생 목록 가져오기
        const authorizedStudents = await fetchAuthorizedStudents();
        
        // 입력한 정보가 목록에 있는지 확인
        const student = authorizedStudents.find(
            s => s.name === name && s.phone === phone
        );
        
        if (student) {
            // 인증 성공
            currentUser = { name, phone, program: student.program };
            
            // 세션에 저장 (새로고침 시에도 유지)
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showLoginSuccess(`인증되었습니다! (${student.program})`);
            
            console.log('인증 성공, 1.5초 후 화면 전환 예정');
            
            setTimeout(() => {
                console.log('화면 전환 시도: scheduleScreen');
                showScreen('scheduleScreen');
                console.log('화면 전환 완료');
            }, 1500);
            
        } else {
            // 인증 실패
            showLoginError('등록되지 않은 수강생입니다. 이름과 휴대폰번호를 확인해주세요.');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 인증하기';
        }
        
    } catch (error) {
        console.error('로그인 에러:', error);
        showLoginError('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 인증하기';
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

// 페이지 로드 시 세션 확인
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = sessionStorage.getItem('currentUser');
    
    if (savedUser) {
        // 이미 로그인되어 있으면 학습 일정 화면으로
        currentUser = JSON.parse(savedUser);
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
            answers: {}
        };
        
        stopAllTimers();
        showScreen('loginScreen');
        
        // 폼 초기화
        document.getElementById('loginForm').reset();
        document.getElementById('loginMessage').style.display = 'none';
    }
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    return currentUser;
}
