/**
 * ================================================
 * module-controller.js
 * 모듈 실행 컨트롤러
 * ================================================
 * 
 * 역할:
 * - 모듈 내 컴포넌트 순차 실행
 * - 전체 진행률 관리 (Question X of Y)
 * - Reading 모듈 전용 20분 타이머
 * - 모든 컴포넌트 완료 시 결과 전달
 * 
 * 사용법:
 * const controller = new ModuleController(moduleConfig);
 * controller.startModule();
 */

class ModuleController {
    constructor(moduleConfig) {
        console.log('📦 ModuleController 초기화:', moduleConfig.moduleName);
        console.log('  총 문제 수:', moduleConfig.totalQuestions);
        console.log('  컴포넌트:', moduleConfig.components);
        
        // 문제 수 합계 검증
        let calculatedTotal = 0;
        moduleConfig.components.forEach(comp => {
            calculatedTotal += comp.questionsPerSet;
            console.log(`  - ${comp.type} Set ${comp.setId}: ${comp.questionsPerSet}문제`);
        });
        console.log('  계산된 총 문제 수:', calculatedTotal);
        
        if (calculatedTotal !== moduleConfig.totalQuestions) {
            console.error(`❌ 문제 수 불일치! 설정: ${moduleConfig.totalQuestions}, 계산: ${calculatedTotal}`);
        }
        
        // 모듈 설정
        this.config = moduleConfig;
        
        // 진행 상태
        this.currentComponentIndex = 0;
        this.currentQuestionNumber = 0; // 전체 문제 번호 (1부터 시작)
        
        // 답변 저장
        this.allAnswers = [];
        this.componentResults = []; // 각 컴포넌트별 결과
        
        // 타이머
        this.startTime = null;
        this.moduleTimer = null;
        this.moduleTimeRemaining = null;
        this.questionTimer = null;          // 문제별 타이머 (Listening용)
        this.questionTimeRemaining = null;  // 남은 시간 (초)
        
        // 컴포넌트 인스턴스
        this.currentComponentInstance = null;
        
        // 완료 콜백
        this.onModuleCompleteCallback = null;
    }
    
    /**
     * ================================================
     * 모듈 시작
     * ================================================
     */
    startModule() {
        console.log('🚀 모듈 시작:', this.config.moduleName);
        
        this.startTime = Date.now();
        
        // 모듈 모드 플래그 설정 (컴포넌트들이 자체 진행률 표시하지 않도록)
        window.isModuleMode = true;
        window.moduleController = this;
        
        // Reading 모듈인 경우 20분 타이머 시작
        if (this.config.sectionType === 'reading' && this.config.timeLimit) {
            this.startModuleTimer();
        }
        
        // 첫 번째 컴포넌트 로드
        this.loadNextComponent();
    }
    
    /**
     * ================================================
     * Reading 모듈 타이머 (20분)
     * ================================================
     */
    startModuleTimer() {
        this.moduleTimeRemaining = this.config.timeLimit;
        
        console.log(`⏱️ 모듈 타이머 시작: ${this.config.timeLimit}초 (${this.config.timeLimit / 60}분)`);
        
        // 타이머 UI 표시
        this.updateModuleTimerDisplay();
        
        this.moduleTimer = setInterval(() => {
            this.moduleTimeRemaining--;
            this.updateModuleTimerDisplay();
            
            if (this.moduleTimeRemaining <= 0) {
                console.warn('⏰ 모듈 타이머 종료! 자동 제출');
                this.stopModuleTimer();
                this.handleModuleTimeout();
            }
        }, 1000);
    }
    
    stopModuleTimer() {
        if (this.moduleTimer) {
            clearInterval(this.moduleTimer);
            this.moduleTimer = null;
        }
    }
    
    updateModuleTimerDisplay() {
        const minutes = Math.floor(this.moduleTimeRemaining / 60);
        const seconds = this.moduleTimeRemaining % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 모든 가능한 타이머 요소 업데이트
        const timerElements = [
            'module-timer-display',  // 테스트 화면
            'readingTimer',          // Reading Section
            'fillBlanksTimer',       // Fill in the Blanks
            'daily1Timer',           // Daily1
            'daily2Timer',           // Daily2
            'academicTimer'          // Academic
        ];
        
        timerElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = timeText;
                
                // 5분 이하일 때 경고 표시
                if (this.moduleTimeRemaining <= 300) {
                    element.style.color = '#ff4444';
                }
            }
        });
    }
    
    handleModuleTimeout() {
        // 현재 컴포넌트 중단
        if (this.currentComponentInstance && this.currentComponentInstance.cleanup) {
            this.currentComponentInstance.cleanup();
        }
        
        // 현재까지의 답변으로 자동 제출
        this.completeModule(true); // timeout flag
    }
    
    /**
     * ================================================
     * 문제별 타이머 (Listening용)
     * ================================================
     * @param {number} seconds - 타이머 시간 (초)
     */
    startQuestionTimer(seconds) {
        if (typeof seconds !== 'number' || seconds <= 0) {
            console.error('❌ [타이머] 잘못된 시간 값:', seconds);
            return;
        }
        console.log(`⏰ 문제별 타이머 시작: ${seconds}초`);
        
        // 기존 타이머 정리
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
        
        this.questionTimeRemaining = seconds;
        this.updateQuestionTimerDisplay();
        
        this.questionTimer = setInterval(() => {
            this.questionTimeRemaining--;
            this.updateQuestionTimerDisplay();
            
            if (this.questionTimeRemaining <= 0) {
                clearInterval(this.questionTimer);
                this.handleQuestionTimeout();
            }
        }, 1000);
    }
    
    updateQuestionTimerDisplay() {
        if (this.questionTimeRemaining === null || this.questionTimeRemaining === undefined) {
            console.error('❌ [타이머] questionTimeRemaining이 정의되지 않음');
            return false;
        }
        
        const seconds = this.questionTimeRemaining;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeText = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Listening 타이머 요소들 업데이트
        const timerElements = [
            'responseTimer',
            'converTimer',
            'announcementTimer',
            'lectureTimer'
        ];
        
        let updated = false;
        timerElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = timeText;
                updated = true;
                
                // 5초 이하일 때 경고 표시
                if (seconds <= 5) {
                    element.style.color = '#ff4444';
                } else {
                    element.style.color = '';
                }
            }
        });
        
        return updated;
    }
    
    handleQuestionTimeout() {
        console.log('⏰ [타이머] 시간 초과 (0초 도달) - 자동 다음 문제');
        
        // 타이머 정리
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
            console.log('✅ [타이머] 정리 완료');
        }
        
        // 실제 컴포넌트 인스턴스 찾기 (전역 변수에서)
        const componentInstance = this.getCurrentComponentInstance();
        
        if (!componentInstance) {
            console.error('❌ [자동진행] 컴포넌트 인스턴스를 찾을 수 없음');
            return;
        }
        
        console.log('🔍 [자동진행] 컴포넌트 인스턴스 확인:', typeof componentInstance.nextQuestion);
        
        // 현재 컴포넌트의 nextQuestion() 호출
        if (componentInstance.nextQuestion) {
            const hasNext = componentInstance.nextQuestion();
            console.log(`🔄 [자동진행] nextQuestion() 결과: ${hasNext ? '다음 문제 있음' : '마지막 문제 - submit 호출'}`);
            if (!hasNext) {
                // 마지막 문제면 submit
                if (componentInstance.submit) {
                    componentInstance.submit();
                } else {
                    console.error('❌ [자동진행] submit() 메서드 없음');
                }
            }
        } else {
            console.error('❌ [자동진행] nextQuestion() 메서드 없음');
        }
    }
    
    /**
     * 현재 실행 중인 컴포넌트 인스턴스 반환
     * @returns {Object|null} 컴포넌트 인스턴스 또는 null
     */
    getCurrentComponentInstance() {
        const component = this.config.components[this.currentComponentIndex];
        if (!component) return null;
        
        // 컴포넌트 타입별로 전역 인스턴스 반환
        switch (component.type) {
            case 'fillblanks':
                return window.currentFillBlanksComponent;
            case 'daily1':
                return window.currentDaily1Component;
            case 'daily2':
                return window.currentDaily2Component;
            case 'academic':
                return window.currentAcademicComponent;
            case 'response':
                return window.currentResponseComponent;
            case 'conver':
                return window.currentConverComponent;
            case 'announcement':
                return window.currentAnnouncementComponent;
            case 'lecture':
                return window.currentLectureComponent;
            case 'arrange':
                return window.currentArrangeComponent;
            case 'email':
                return window.currentEmailComponent;
            case 'discussion':
                return window.currentDiscussionComponent;
            default:
                console.warn('⚠️ [컴포넌트] 알 수 없는 타입:', component.type);
                return null;
        }
    }
    
    /**
     * 타이머 정지 (오디오 재생 중)
     */
    stopQuestionTimer() {
        if (this.questionTimer) {
            console.log('⏸️ [타이머] 정지 - 현재 시간:', this.questionTimeRemaining);
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        } else {
            console.log('⏸️ [타이머] 이미 정지됨');
        }
    }
    
    /**
     * 타이머 표시만 초기화 (오디오 재생 중)
     */
    resetQuestionTimerDisplay() {
        console.log('🔄 [타이머] 표시 리셋 → 00:20');
        this.questionTimeRemaining = 20;
        const success = this.updateQuestionTimerDisplay();
        if (!success) {
            console.warn('⚠️ [타이머] 표시 업데이트 실패 - HTML 요소 없음');
        }
    }
    
    /**
     * ================================================
     * 진행률 업데이트
     * ================================================
     */
    updateProgress() {
        // 현재까지 완료한 문제 수 계산
        let completedQuestions = 0;
        for (let i = 0; i < this.currentComponentIndex; i++) {
            completedQuestions += this.config.components[i].questionsPerSet;
        }
        
        const currentComponent = this.config.components[this.currentComponentIndex];
        if (!currentComponent) return;
        
        // 현재 진행 중인 컴포넌트의 문제 번호
        const startQuestion = completedQuestions + 1;
        const endQuestion = completedQuestions + currentComponent.questionsPerSet;
        
        // 진행률 텍스트 생성
        // FillBlanks는 범위로, 나머지는 개별 문제로 표시 (기본값)
        let progressText;
        if (currentComponent.type === 'fillblanks') {
            progressText = `Questions ${startQuestion}-${endQuestion} of ${this.config.totalQuestions}`;
        } else {
            // 나머지는 첫 문제 번호로 표시 (컴포넌트에서 개별 업데이트 예정)
            progressText = `Question ${startQuestion} of ${this.config.totalQuestions}`;
        }
        
        console.log(`📊 진행률 업데이트: ${progressText}`);
        
        // 모든 가능한 진행률 요소 업데이트
        const progressElements = [
            'module-progress-text',      // 테스트 화면용
            'readingProgress',            // Reading Section
            'listeningProgress',          // Listening Section
            'fillBlanksProgress',         // Fill in the Blanks
            'daily1Progress',             // Daily1
            'daily2Progress',             // Daily2
            'academicProgress'            // Academic
        ];
        
        progressElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = progressText;
            }
        });
    }
    
    /**
     * 컴포넌트 내부에서 현재 문제 번호 업데이트
     * @param {number} questionIndexInComponent - 컴포넌트 내 현재 문제 인덱스 (0부터 시작)
     */
    updateCurrentQuestionInComponent(questionIndexInComponent) {
        // 현재까지 완료한 문제 수 계산
        let completedQuestions = 0;
        for (let i = 0; i < this.currentComponentIndex; i++) {
            completedQuestions += this.config.components[i].questionsPerSet;
        }
        
        const currentComponent = this.config.components[this.currentComponentIndex];
        if (!currentComponent) return;
        
        // 전체 모듈 기준 현재 문제 번호
        const currentQuestionNumber = completedQuestions + questionIndexInComponent + 1;
        
        // 진행률 텍스트 생성
        let progressText;
        if (currentComponent.type === 'fillblanks') {
            // FillBlanks는 범위로 표시
            const startQuestion = completedQuestions + 1;
            const endQuestion = completedQuestions + currentComponent.questionsPerSet;
            progressText = `Questions ${startQuestion}-${endQuestion} of ${this.config.totalQuestions}`;
        } else {
            // 나머지는 개별 문제 번호
            progressText = `Question ${currentQuestionNumber} of ${this.config.totalQuestions}`;
        }
        
        console.log(`📊 문제별 진행률 업데이트: ${progressText} (컴포넌트 내 인덱스: ${questionIndexInComponent})`);
        
        // 모든 가능한 진행률 요소 업데이트
        const progressElements = [
            'module-progress-text',
            'readingProgress',
            'listeningProgress',
            'fillBlanksProgress',
            'daily1Progress',
            'daily2Progress',
            'academicProgress',
            'responseProgress',
            'converProgress',
            'announcementProgress',
            'lectureProgress'
        ];
        
        progressElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = progressText;
            }
        });
    }
    
    /**
     * ================================================
     * 다음 컴포넌트 로드
     * ================================================
     */
    loadNextComponent() {
        if (this.currentComponentIndex >= this.config.components.length) {
            // 모든 컴포넌트 완료
            this.completeModule(false);
            return;
        }
        
        const component = this.config.components[this.currentComponentIndex];
        
        console.log(`📝 컴포넌트 로드 [${this.currentComponentIndex + 1}/${this.config.components.length}]:`, 
                    `${component.type} (Set ${component.setId})`);
        
        // 진행률 업데이트
        this.updateProgress();
        
        // 컴포넌트 초기화 및 시작
        this.initComponent(component);
    }
    
    /**
     * ================================================
     * 컴포넌트 초기화
     * ================================================
     */
    initComponent(component) {
        const { type, setId, questionsPerSet } = component;
        
        console.log(`🎯 컴포넌트 초기화: ${type} (Set ${setId}), 문제 시작: ${this.currentQuestionNumber + 1}`);
        
        // 컴포넌트별 초기화 함수 호출 (시작 문제 번호와 총 문제 수 전달)
        const initOptions = {
            startQuestionNumber: this.currentQuestionNumber + 1,
            totalModuleQuestions: this.config.totalQuestions
        };
        
        // 컴포넌트별 초기화 함수 호출
        switch (type) {
            case 'fillblanks':
                this.currentComponentInstance = window.FillBlanksComponent;
                if (window.initFillBlanksComponent) {
                    window.initFillBlanksComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                break;
                
            case 'daily1':
                this.currentComponentInstance = window.Daily1Component;
                if (window.initDaily1Component) {
                    window.initDaily1Component(setId, this.onComponentComplete.bind(this), initOptions);
                }
                break;
                
            case 'daily2':
                this.currentComponentInstance = window.Daily2Component;
                if (window.initDaily2Component) {
                    window.initDaily2Component(setId, this.onComponentComplete.bind(this), initOptions);
                }
                break;
                
            case 'academic':
                this.currentComponentInstance = window.AcademicComponent;
                if (window.initAcademicComponent) {
                    window.initAcademicComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                break;
                
            case 'response':
                // initResponseComponent가 window.currentResponseComponent를 설정함
                if (window.initResponseComponent) {
                    window.initResponseComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentResponseComponent;
                break;
                
            case 'conver':
                // initConverComponent가 window.currentConverComponent를 설정함
                if (window.initConverComponent) {
                    window.initConverComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentConverComponent;
                break;
                
            case 'announcement':
                // initAnnouncementComponent가 window.currentAnnouncementComponent를 설정함
                if (window.initAnnouncementComponent) {
                    window.initAnnouncementComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentAnnouncementComponent;
                break;
                
            case 'lecture':
                // initLectureComponent가 window.currentLectureComponent를 설정함
                if (window.initLectureComponent) {
                    window.initLectureComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentLectureComponent;
                break;
                
            case 'arrange':
                // initArrangeComponent가 window.currentArrangeComponent를 설정함
                if (window.initArrangeComponent) {
                    window.initArrangeComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentArrangeComponent;
                break;
                
            case 'email':
                // initEmailComponent가 window.currentEmailComponent를 설정함
                if (window.initEmailComponent) {
                    window.initEmailComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스휴스 참조
                this.currentComponentInstance = window.currentEmailComponent;
                break;
                
            case 'discussion':
                // initDiscussionComponent가 window.currentDiscussionComponent를 설정함
                if (window.initDiscussionComponent) {
                    window.initDiscussionComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentDiscussionComponent;
                break;
                
            case 'repeat':
                // initRepeatComponent가 window.currentRepeatComponent를 설정함
                if (window.initRepeatComponent) {
                    window.initRepeatComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentRepeatComponent;
                break;
                
            case 'interview':
                // initInterviewComponent가 window.currentInterviewComponent를 설정함
                if (window.initInterviewComponent) {
                    window.initInterviewComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // 전역 인스턴스 참조
                this.currentComponentInstance = window.currentInterviewComponent;
                break;
                
            default:
                console.error('❌ 알 수 없는 컴포넌트 타입:', type);
                this.loadNextComponent(); // 스킵하고 다음으로
        }
    }
    
    /**
     * ================================================
     * 컴포넌트 완료 콜백
     * ================================================
     */
    onComponentComplete(componentResult) {
        console.log('✅ 컴포넌트 완료:', componentResult);
        
        const component = this.config.components[this.currentComponentIndex];
        
        // 답변 저장
        if (componentResult.answers && Array.isArray(componentResult.answers)) {
            this.allAnswers.push(...componentResult.answers);
            this.currentQuestionNumber += componentResult.answers.length;
        }
        
        // 컴포넌트별 결과 저장
        this.componentResults.push({
            componentType: component.type,
            setId: component.setId,
            ...componentResult
        });
        
        // 다음 컴포넌트로
        this.currentComponentIndex++;
        this.loadNextComponent();
    }
    
    /**
     * ================================================
     * 모듈 완료
     * ================================================
     */
    completeModule(isTimeout = false) {
        console.log('🎉 모듈 완료!', isTimeout ? '(시간 초과)' : '');
        
        // 타이머 정리
        this.stopModuleTimer();
        
        const endTime = Date.now();
        const totalTimeSpent = Math.floor((endTime - this.startTime) / 1000); // 초 단위
        
        // 최종 결과 객체
        const moduleResult = {
            moduleId: this.config.moduleId,
            moduleName: this.config.moduleName,
            sectionType: this.config.sectionType,
            totalQuestions: this.config.totalQuestions,
            answeredQuestions: this.currentQuestionNumber,
            answers: this.allAnswers,
            componentResults: this.componentResults,
            timeSpent: totalTimeSpent,
            isTimeout: isTimeout,
            timestamp: endTime
        };
        
        console.log('📊 모듈 결과:', moduleResult);
        
        // 완료 콜백 호출
        if (this.onModuleCompleteCallback) {
            this.onModuleCompleteCallback(moduleResult);
        } else {
            console.warn('⚠️ onModuleCompleteCallback이 설정되지 않았습니다.');
        }
    }
    
    /**
     * ================================================
     * 정리 (Cleanup)
     * ================================================
     */
    cleanup() {
        console.log('🧹 ModuleController cleanup');
        
        this.stopModuleTimer();
        
        if (this.currentComponentInstance && this.currentComponentInstance.cleanup) {
            this.currentComponentInstance.cleanup();
        }
        
        this.currentComponentInstance = null;
        
        // 모듈 모드 플래그 해제
        window.isModuleMode = false;
        window.moduleController = null;
    }
    
    /**
     * ================================================
     * 완료 콜백 설정
     * ================================================
     */
    setOnComplete(callback) {
        this.onModuleCompleteCallback = callback;
    }
}

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.ModuleController = ModuleController;
    
    /**
     * 테스트 함수: Reading Module 1 시작
     */
    window.testReadingModule1 = function() {
        console.log('🧪 Reading Module 1 테스트 시작...');
        
        const module = getModule('reading', 1);
        const controller = new ModuleController(module);
        
        controller.setOnComplete((result) => {
            console.log('✅ 모듈 완료 콜백 받음:', result);
            alert(`모듈 완료!\n답변: ${result.answeredQuestions}/${result.totalQuestions}\n소요 시간: ${result.timeSpent}초`);
        });
        
        controller.startModule();
    };
}
