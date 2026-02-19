/**
 * ================================================
 * ComponentPatch.js (v2)
 * RepeatComponent와 InterviewComponent 패치
 * ================================================
 * 
 * 패치 내용:
 * 1. RepeatComponent에 init(setId) 함수 추가
 * 2. RepeatComponent의 completeSpeakingRepeat()에 onComplete 콜백 호출 추가
 * 3. InterviewComponent에 init(setId) 함수 추가
 * 4. InterviewComponent 완료 시 onComplete 콜백 호출 추가
 * 
 * 적용:
 *   index.html에서 RepeatComponent.js, InterviewComponent.js 아래에,
 *   FlowController.js 위에 이 파일을 추가.
 */

// ========================================
// RepeatComponent 패치
// ========================================
if (typeof RepeatComponent !== 'undefined') {
    
    // [패치 1] init(setId) 함수 추가
    RepeatComponent.prototype.init = async function(setId) {
        console.log(`🔧 [ComponentPatch] RepeatComponent.init(${setId}) 호출`);
        
        this.setId = setId || 1;
        this.currentRepeatSet = (this.setId - 1);
        
        // 1. 데이터 로드
        await this.loadRepeatData();
        
        // 2. 화면 전환
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        const repeatScreen = document.getElementById('speakingRepeatScreen');
        if (repeatScreen) {
            repeatScreen.classList.add('active');
            repeatScreen.style.display = 'block';
        }
        
        // 3. 인트로 화면 표시
        this.showIntroScreen();
        
        console.log(`✅ [ComponentPatch] RepeatComponent.init(${setId}) 완료`);
    };
    
    // [패치 2] completeSpeakingRepeat()를 감싸서 onComplete 콜백 호출 추가
    const originalCompleteSpeakingRepeat = RepeatComponent.prototype.completeSpeakingRepeat;
    
    RepeatComponent.prototype.completeSpeakingRepeat = function() {
        console.log('🔧 [ComponentPatch] completeSpeakingRepeat 패치 실행');
        
        // 원래 함수 실행
        const result = originalCompleteSpeakingRepeat.call(this);
        
        // ★ 핵심: onComplete 콜백 호출 (ModuleController가 다음 단계로 넘어가도록)
        if (typeof this.onComplete === 'function') {
            console.log('✅ [ComponentPatch] onComplete 콜백 호출');
            
            // ModuleController가 기대하는 형식으로 결과 전달
            const componentResult = {
                componentType: 'repeat',
                setId: this.setId || 1,
                answers: [],  // 스피킹은 객관식 답이 없으므로 빈 배열
                results: [],
                timeSpent: 0,
                // 원래 함수의 반환값도 포함
                ...(result || {})
            };
            
            this.onComplete(componentResult);
        } else {
            console.log('⚠️ [ComponentPatch] onComplete 콜백이 없음 (단독 실행 모드)');
            // 단독 실행 시에는 어댑터의 completeSpeakingRepeat()가 처리
        }
        
        return result;
    };
    
    console.log('✅ [ComponentPatch] RepeatComponent 패치 완료 (init + completeSpeakingRepeat)');
    
} else {
    console.warn('⚠️ [ComponentPatch] RepeatComponent를 찾을 수 없음');
}

// ========================================
// InterviewComponent 패치
// ========================================
if (typeof InterviewComponent !== 'undefined') {
    
    // [패치 3] init(setId) 함수 추가
    InterviewComponent.prototype.init = async function(setId) {
        console.log(`🔧 [ComponentPatch] InterviewComponent.init(${setId}) 호출`);
        
        this.setId = setId || 1;
        
        // 1. 데이터 로드
        await this.loadInterviewData();
        
        // 2. 화면 전환
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        
        const interviewScreen = document.getElementById('speakingInterviewScreen');
        if (interviewScreen) {
            interviewScreen.classList.add('active');
            interviewScreen.style.display = 'block';
        }
        
        // 3. 인트로 화면 표시
        if (typeof this.showInterviewIntroScreen === 'function') {
            this.showInterviewIntroScreen();
        } else if (typeof this.showIntroScreen === 'function') {
            this.showIntroScreen();
        }
        
        console.log(`✅ [ComponentPatch] InterviewComponent.init(${setId}) 완료`);
    };
    
    // [패치 4] 인터뷰 완료 시 onComplete 콜백 호출 추가
    // InterviewComponent의 완료 함수 이름을 확인하고 패치
    const interviewCompleteNames = [
        'completeSpeakingInterview',
        'completeInterview', 
        'finishInterview'
    ];
    
    let interviewCompletePatched = false;
    
    interviewCompleteNames.forEach(funcName => {
        if (typeof InterviewComponent.prototype[funcName] === 'function' && !interviewCompletePatched) {
            const originalFunc = InterviewComponent.prototype[funcName];
            
            InterviewComponent.prototype[funcName] = function() {
                console.log(`🔧 [ComponentPatch] ${funcName} 패치 실행`);
                
                const result = originalFunc.call(this);
                
                if (typeof this.onComplete === 'function') {
                    console.log('✅ [ComponentPatch] Interview onComplete 콜백 호출');
                    
                    const componentResult = {
                        componentType: 'interview',
                        setId: this.setId || 1,
                        answers: [],
                        results: [],
                        timeSpent: 0,
                        ...(result || {})
                    };
                    
                    this.onComplete(componentResult);
                }
                
                return result;
            };
            
            interviewCompletePatched = true;
            console.log(`✅ [ComponentPatch] InterviewComponent.${funcName} 패치 완료`);
        }
    });
    
    if (!interviewCompletePatched) {
        console.warn('⚠️ [ComponentPatch] InterviewComponent 완료 함수를 찾지 못함. 수동 확인 필요.');
    }
    
    console.log('✅ [ComponentPatch] InterviewComponent 패치 완료');
    
} else {
    console.warn('⚠️ [ComponentPatch] InterviewComponent를 찾을 수 없음');
}

console.log('✅ ComponentPatch.js v2 로드 완료');
