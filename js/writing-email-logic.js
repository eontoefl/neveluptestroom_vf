// Writing - 이메일작성 로직 (어댑터)
// EmailComponent를 사용하는 어댑터
// v=011

console.log('✅ writing-email-logic.js 로드 시작 (EmailComponent 어댑터)');

// 컴포넌트 인스턴스 (전역에서 접근 가능하도록)
window.currentEmailComponent = null;

async function initEmailComponent(setId, onCompleteCallback) {
    console.log(`📦 [모듈] initEmailComponent - setId: ${setId}`);
    window.currentEmailComponent = new EmailComponent(setId, {
        onComplete: (results) => {
            console.log(`✅ [모듈] Email Component 완료`);
            if (onCompleteCallback) onCompleteCallback(results);
        },
        onError: (error) => console.error(`❌ [모듈] Email Component 오류:`, error)
    });
    await window.currentEmailComponent.init();
}

/**
 * 이메일작성 초기화
 * Module에서 호출됨 (화면 전환 후)
 */
async function initWritingEmail(setNumber = 1) {
    console.log(`[어댑터] initWritingEmail 호출 - setNumber: ${setNumber}`);
    
    try {
        // EmailComponent 생성
        window.currentEmailComponent = new EmailComponent(setNumber, function(resultData) {
            console.log('[어댑터] EmailComponent 완료 콜백 호출됨');
            console.log('[어댑터] resultData:', resultData);
            
            // 결과 화면 표시
            showEmailResult(resultData);
        });
        
        // 초기화
        await window.currentEmailComponent.init();
        
        // 텍스트 입력 이벤트 바인딩
        const textarea = document.getElementById('emailTextarea');
        if (textarea) {
            textarea.addEventListener('input', () => {
                window.currentEmailComponent.onTextInput();
            });
        }
        
    } catch (error) {
        console.error('[어댑터] initWritingEmail 실패:', error);
        alert('이메일 작성을 시작할 수 없습니다.');
    }
}

/**
 * 제출 (Module에서 버튼 클릭 시 호출)
 */
function submitWritingEmail() {
    console.log('[어댑터] submitWritingEmail 호출됨');
    
    if (!window.currentEmailComponent) {
        console.error('[어댑터] currentEmailComponent가 없습니다');
        return;
    }
    
    // 컴포넌트의 submit() 호출
    const resultData = window.currentEmailComponent.submit();
    
    // ★ ModuleController에 완료 알림 (FlowController 플로우용)
    // onComplete 또는 onSubmitComplete 콜백이 있으면 호출
    const callback = window.currentEmailComponent.onComplete || window.currentEmailComponent.onSubmitComplete;
    if (callback && typeof callback === 'function') {
        console.log('📤 [Email] onComplete 콜백 호출');
        callback(resultData);
    } else {
        // 기존 방식 (독립 실행 시)
        console.log('📤 [Email] 기존 방식 - 결과 화면 직접 표시');
        showScreen('writingEmailResultScreen');
        if (window.currentEmailComponent.showEmailResult) {
            window.currentEmailComponent.showEmailResult(resultData);
        }
    }
}

/**
 * Cut (어댑터 함수)
 */
function cutText() {
    if (window.currentEmailComponent) {
        window.currentEmailComponent.cutText();
    }
}

/**
 * Paste (어댑터 함수)
 */
function pasteText() {
    if (window.currentEmailComponent) {
        window.currentEmailComponent.pasteText();
    }
}

/**
 * Undo (어댑터 함수)
 */
function undoText() {
    if (window.currentEmailComponent) {
        window.currentEmailComponent.undoText();
    }
}

/**
 * Redo (어댑터 함수)
 */
function redoText() {
    if (window.currentEmailComponent) {
        window.currentEmailComponent.redoText();
    }
}

/**
 * 단어수 표시/숨김 (어댑터 함수)
 */
function toggleWordCount() {
    if (window.currentEmailComponent) {
        window.currentEmailComponent.toggleWordCount();
    }
}

window.initEmailComponent = initEmailComponent;
window.initWritingEmail = initWritingEmail;

/**
 * 답안 다운로드 (어댑터 함수)
 */
function downloadEmail() {
    if (window.currentEmailComponent) {
        window.currentEmailComponent.downloadEmail();
    }
}

console.log('✅ writing-email-logic.js 로드 완료 (EmailComponent 어댑터)');
console.log('✅ initWritingEmail 함수:', typeof initWritingEmail);
console.log('✅ submitWritingEmail 함수:', typeof submitWritingEmail);
