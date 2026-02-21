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
        
        // 현재 컴포넌트의 현재 문제 제한시간 가져오기 (다음 문제 타이머용)
        const currentComponent = this.config.components[this.currentComponentIndex];
        const componentType = currentComponent ? currentComponent.type : null;
        
        // 컴포넌트 타입별 제한시간 (초)
        const timeLimitMap = {
            response: 20,
            conver: 20,
            announcement: 20,
            lecture: 30
        };
        const timeLimit = timeLimitMap[componentType] || 20;
        
        // 현재 컴포넌트의 nextQuestion() 호출
        if (componentInstance.nextQuestion) {
            const hasNext = componentInstance.nextQuestion();
            console.log(`🔄 [자동진행] nextQuestion() 결과: ${hasNext ? '다음 문제 있음' : '마지막 문제 - submit 호출'}`);
            if (hasNext) {
                // 다음 문제가 있으면 새 타이머 시작
                console.log(`⏰ [자동진행] 다음 문제 타이머 시작: ${timeLimit}초`);
                this.startQuestionTimer(timeLimit);
            } else {
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
     * 헤더 타이틀 업데이트 (Week N - O요일 | 아이콘 유형명)
     * ================================================
     */
    updateHeaderTitle(componentType) {
        // Week/요일 정보 가져오기
        const ct = window.currentTest || {};
const week = ct.currentWeek || 'Week 1';
const day = ct.currentDay || '일';
const weekDay = `${week} - ${day}요일`;
        
        // 유형별 Font Awesome 아이콘 + 한글명 매핑
        const typeMap = {
            fillblanks: { icon: 'fas fa-book-open', name: '빈칸채우기' },
            daily1: { icon: 'fas fa-book-open', name: '일상지문 1' },
            daily2: { icon: 'fas fa-book-open', name: '일상지문 2' },
            academic: { icon: 'fas fa-book-open', name: '학술지문' },
            response: { icon: 'fas fa-headphones', name: '응답고르기' },
            conver: { icon: 'fas fa-headphones', name: '대화' },
            announcement: { icon: 'fas fa-headphones', name: '공지사항' },
            lecture: { icon: 'fas fa-headphones', name: '렉쳐' },
            arrange: { icon: 'fas fa-pen', name: '단어배열' },
            email: { icon: 'fas fa-pen', name: '이메일' },
            discussion: { icon: 'fas fa-pen', name: '토론' },
            repeat: { icon: 'fas fa-microphone', name: '따라말하기' },
            interview: { icon: 'fas fa-microphone', name: '인터뷰' }
        };
        
        const typeInfo = typeMap[componentType] || { icon: 'fas fa-book', name: componentType };
        const titleText = `${weekDay} | ${typeInfo.name}`;
        
        // 헤더 타이틀 요소 매핑
        const titleElements = {
            fillblanks: 'fillBlanksHeaderTitle',
            daily1: 'daily1HeaderTitle',
            daily2: 'daily2HeaderTitle',
            academic: 'academicHeaderTitle',
            response: 'responseHeaderTitle',
            conver: 'converHeaderTitle',
            announcement: 'announcementHeaderTitle',
            lecture: 'lectureHeaderTitle',
            repeat: 'repeatHeaderTitle',
            interview: 'interviewHeaderTitle'
        };
        
        const elementId = titleElements[componentType];
        if (elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.innerHTML = `<i class="${typeInfo.icon}"></i> ${titleText}`;
                console.log(`📋 헤더 타이틀 업데이트: ${titleText}`);
            }
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
            'academicProgress',           // Academic
            'repeatProgress',             // Speaking Repeat
            'interviewProgress'           // Speaking Interview
        ];
        
        progressElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = progressText;
            }
        });
        
        // ★ fillblanks는 loadQuestion을 호출하지 않으므로 여기서 버튼 상태 설정
        if (currentComponent.type === 'fillblanks') {
            // fillblanks는 세트 전체가 하나의 화면이므로 첫 문제 인덱스 = 0
            this.updateNavigationButtons(currentComponent.type, 0, currentComponent.questionsPerSet);
        }
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
        
        // ★ Back/Next/Submit 버튼 상태 업데이트 (모듈 전체 기준)
        this.updateNavigationButtons(currentComponent.type, questionIndexInComponent, currentComponent.questionsPerSet);
    }
    
    /**
     * 모듈 전체 기준 현재 문제 번호 계산
     */
    getGlobalQuestionNumber(questionIndexInComponent) {
        let completedQuestions = 0;
        for (let i = 0; i < this.currentComponentIndex; i++) {
            completedQuestions += this.config.components[i].questionsPerSet;
        }
        return completedQuestions + questionIndexInComponent + 1;
    }
    
    /**
     * 헤더 Back/Next/Submit 버튼 상태 업데이트
     * - Back: Q1에서만 숨김, Q2부터 항상 표시
     * - Next: 마지막 문제(Q35)에서만 숨김
     * - Submit: 마지막 문제(Q35)에서만 표시
     */
    updateNavigationButtons(componentType, questionIndex, totalQuestionsInSet) {
        const globalQuestionNum = this.getGlobalQuestionNumber(questionIndex);
        const totalQuestions = this.config.totalQuestions;
        
        const isFirstGlobal = (globalQuestionNum === 1);
        const isLastGlobal = (globalQuestionNum === totalQuestions);
        
        console.log(`🔘 [Nav] 버튼 업데이트: Q${globalQuestionNum}/${totalQuestions} (${componentType} 내 idx:${questionIndex}) | Back:${!isFirstGlobal} Next:${!isLastGlobal} Submit:${isLastGlobal}`);
        
        // 모든 화면의 버튼을 업데이트 (현재 보이는 화면에만 적용됨)
        const allBtnIds = [
            { prev: 'fillBlanksPrevBtn', next: 'fillBlanksNextBtn', submit: 'fillBlanksSubmitBtn' },
            { prev: 'daily1PrevBtn', next: 'daily1NextBtn', submit: 'daily1SubmitBtn' },
            { prev: 'daily2PrevBtn', next: 'daily2NextBtn', submit: 'daily2SubmitBtn' },
            { prev: 'academicPrevBtn', next: 'academicNextBtn', submit: 'academicSubmitBtn' }
        ];
        
        allBtnIds.forEach(ids => {
            const prevBtn = document.getElementById(ids.prev);
            const nextBtn = document.getElementById(ids.next);
            const submitBtn = document.getElementById(ids.submit);
            
            if (prevBtn) prevBtn.style.display = isFirstGlobal ? 'none' : '';
            if (nextBtn) nextBtn.style.display = isLastGlobal ? 'none' : '';
            if (submitBtn) submitBtn.style.display = isLastGlobal ? '' : 'none';
        });
    }
    
    /**
     * 이전 컴포넌트로 이동 (Back 시 현재 컴포넌트 첫 문제에서 호출)
     */
    goToPreviousComponent() {
        if (this.currentComponentIndex <= 0) {
            console.log('⚠️ 첫 번째 컴포넌트입니다 - 이전으로 이동 불가');
            return;
        }
        
        const prevIndex = this.currentComponentIndex - 1;
        const prevComponent = this.config.components[prevIndex];
        
        console.log(`⬅️ [Nav] 이전 컴포넌트로 이동: ${prevComponent.type} (Set ${prevComponent.setId})`);
        
        // 이전 컴포넌트의 결과를 componentResults와 allAnswers에서 제거
        // (이전 컴포넌트가 submit되어 onComponentComplete로 추가된 데이터)
        if (this.componentResults.length > prevIndex) {
            const removedResult = this.componentResults.pop();
            console.log(`🗑️ 이전 컴포넌트 결과 제거:`, removedResult?.componentType);
            
            // allAnswers에서 해당 컴포넌트의 답변 수만큼 제거
            if (removedResult?.answers) {
                this.allAnswers.splice(-removedResult.answers.length);
                console.log(`🗑️ allAnswers에서 ${removedResult.answers.length}개 제거`);
            }
        }
        
        // 컴포넌트 인덱스 되돌리기
        this.currentComponentIndex = prevIndex;
        
        // 완료된 문제 수 재계산
        let completedQuestions = 0;
        for (let i = 0; i < prevIndex; i++) {
            completedQuestions += this.config.components[i].questionsPerSet;
        }
        this.currentQuestionNumber = completedQuestions;
        
        // 이전 컴포넌트의 마지막 문제로 로드
        this.loadPreviousComponentAtLastQuestion(prevComponent);
    }
    
    /**
     * 이전 컴포넌트를 마지막 문제에서 시작하도록 로드
     */
    async loadPreviousComponentAtLastQuestion(prevComponent) {
        const { type, setId, questionsPerSet } = prevComponent;
        const lastQuestionIndex = questionsPerSet - 1;
        
        console.log(`📝 이전 컴포넌트 로드 (마지막 문제): ${type} (Set ${setId}), 마지막 문제 인덱스: ${lastQuestionIndex}`);
        
        // 진행률 업데이트
        this.updateProgress();
        
        // 헤더 타이틀 업데이트
        this.updateHeaderTitle(type);
        
        const initOptions = {
            startQuestionNumber: this.currentQuestionNumber + 1,
            totalModuleQuestions: this.config.totalQuestions
        };
        
        // 컴포넌트별 초기화 (await로 데이터 로드 완료 대기)
        switch (type) {
            case 'fillblanks':
                this.currentComponentInstance = window.FillBlanksComponent;
                if (window.initFillBlanksComponent) {
                    await window.initFillBlanksComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                // fillblanks는 세트 전체가 한 화면이므로 마지막 문제 이동 불필요
                this.updateNavigationButtons(type, 0, questionsPerSet);
                break;
            case 'daily1':
                this.currentComponentInstance = window.Daily1Component;
                if (window.initDaily1Component) {
                    await window.initDaily1Component(setId, this.onComponentComplete.bind(this), initOptions);
                }
                if (window.currentDaily1Component && lastQuestionIndex > 0) {
                    console.log(`⬅️ Daily1 마지막 문제로 이동: index ${lastQuestionIndex}`);
                    window.currentDaily1Component.loadQuestion(lastQuestionIndex);
                }
                break;
            case 'daily2':
                this.currentComponentInstance = window.Daily2Component;
                if (window.initDaily2Component) {
                    await window.initDaily2Component(setId, this.onComponentComplete.bind(this), initOptions);
                }
                if (window.currentDaily2Component && lastQuestionIndex > 0) {
                    console.log(`⬅️ Daily2 마지막 문제로 이동: index ${lastQuestionIndex}`);
                    window.currentDaily2Component.loadQuestion(lastQuestionIndex);
                }
                break;
            case 'academic':
                this.currentComponentInstance = window.AcademicComponent;
                if (window.initAcademicComponent) {
                    await window.initAcademicComponent(setId, this.onComponentComplete.bind(this), initOptions);
                }
                if (window.currentAcademicComponent && lastQuestionIndex > 0) {
                    console.log(`⬅️ Academic 마지막 문제로 이동: index ${lastQuestionIndex}`);
                    window.currentAcademicComponent.loadQuestion(lastQuestionIndex);
                }
                break;
        }
    }
    
    /**
     * 모듈 전체 Submit (마지막 문제 Q35에서 호출)
     */
    submitCurrentModule() {
        console.log('📤 [모듈] 전체 Submit 호출 - 현재 컴포넌트 제출 후 모듈 완료');
        
        const currentComponent = this.config.components[this.currentComponentIndex];
        if (!currentComponent) return;
        
        // 현재 컴포넌트 submit (각 어댑터의 전역 submit 함수 호출)
        switch (currentComponent.type) {
            case 'fillblanks':
                if (typeof submitFillBlanks === 'function') submitFillBlanks();
                break;
            case 'daily1':
                if (typeof submitDaily1 === 'function') submitDaily1();
                break;
            case 'daily2':
                if (typeof submitDaily2 === 'function') submitDaily2();
                break;
            case 'academic':
                if (typeof submitAcademic === 'function') submitAcademic();
                break;
        }
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
        
        // ★ 헤더 타이틀 업데이트
        this.updateHeaderTitle(type);
        
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
                    window.initFillBlanksComponent(setId, this.onComponentComplete.bind(this), initOptions).then(() => {
                        // fillblanks 초기화 완료 후 버튼 상태 강제 설정
                        this.updateNavigationButtons(type, 0, questionsPerSet);
                    });
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
     * ================================================
     * 전역 네비게이션 어댑터 함수
     * ================================================
     * HTML 헤더 버튼에서 호출되는 함수들
     */
    
    /**
     * fillblanks 화면에서 Next 클릭
     * → 현재 세트 제출 후 다음 컴포넌트로 이동
     */
    window.moduleNextFromFillBlanks = function() {
        console.log('➡️ [Nav] fillblanks Next 클릭');
        // submitFillBlanks()는 어댑터 함수로 currentFillBlanksComponent.submit() 호출
        // submit() → onComplete 콜백 → onComponentComplete → 다음 컴포넌트 자동 로드
        if (typeof submitFillBlanks === 'function') {
            submitFillBlanks();
        }
    };
    
    /**
     * fillblanks 화면에서 Back 클릭
     * → 이전 컴포넌트로 이동 (첫 세트면 동작 안함)
     */
    window.modulePrevFromFillBlanks = function() {
        console.log('⬅️ [Nav] fillblanks Back 클릭');
        if (window.isModuleMode && window.moduleController) {
            window.moduleController.goToPreviousComponent();
        }
    };
    
    /**
     * 모듈 전체 Submit (마지막 문제 Q35에서 호출)
     */
    window.moduleSubmitAll = function() {
        console.log('📤 [Nav] 모듈 전체 Submit 클릭');
        if (window.isModuleMode && window.moduleController) {
            window.moduleController.submitCurrentModule();
        }
    };
    
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
