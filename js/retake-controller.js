/**
 * ================================================
 * RetakeController - 2차 풀이 (이중채점) 시스템
 * ================================================
 * v032 - 2025-02-13
 * - 🔥 레벨 계산 버그 수정 (구간 환산표 적용)
 * - 기존: 점수 / 7 (부정확)
 * - 수정: calculateLevel() 함수로 정확한 구간표 적용
 */

class RetakeController {
    constructor(sectionType, firstAttemptData) {
        this.sectionType = sectionType; // 'reading', 'listening'
        this.firstAttemptData = firstAttemptData;
        this.moduleConfig = null;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 0;
        this.secondAttemptAnswers = {};
        this.currentComponentType = null;
        this.currentComponentInstance = null;
        
        // ✅ 2차 풀이용 추가 변수
        this.wrongQuestionsList = []; // 틀린 문제 인덱스 목록
        this.currentWrongQuestionNumber = 0; // 현재 몇 번째 틀린 문제인지
        
        // ✅ 이전 문제로 돌아갈 때를 위한 임시 답안 저장소
        this.componentAnswersCache = {}; // { 'fillblanks_0001': {...}, 'daily1_0001': {...} }
        
        // ✅ 컴포넌트 인스턴스 캐시 (재사용)
        this.componentInstanceCache = {}; // { 'fillblanks_fillblank_set_0001': FillBlanksComponent, ... }
        
        console.log('🔄 [RetakeController] 초기화:', sectionType);
    }
    
    /**
     * 2차 풀이 시작
     */
    async start() {
        console.log('🎬 [RetakeController] 2차 풀이 시작');
        
        // 1. 모듈 설정 로드
        const moduleNumber = this.extractModuleNumber();
        this.moduleConfig = getModule(this.sectionType, moduleNumber);
        
        if (!this.moduleConfig) {
            console.error('❌ 모듈 설정을 찾을 수 없습니다');
            return;
        }
        
        this.totalQuestions = this.moduleConfig.totalQuestions;
        console.log(`📊 총 ${this.totalQuestions}문제 순회 시작`);
        
        // ✅ 2. 틀린 문제 목록 생성
        this.wrongQuestionsList = [];
        for (let i = 0; i < this.totalQuestions; i++) {
            if (!this.wasQuestionCorrect(i)) {
                this.wrongQuestionsList.push(i);
            }
        }
        console.log(`❌ 틀린 문제 ${this.wrongQuestionsList.length}개:`, this.wrongQuestionsList.map(i => i + 1));
        
        // 3. 첫 번째 문제부터 시작
        this.currentQuestionIndex = 0;
        this.currentWrongQuestionNumber = 0;
        this.showNextQuestion();
    }
    
    /**
     * 모듈 번호 추출
     */
    extractModuleNumber() {
        const match = this.firstAttemptData.moduleId.match(/\d+$/);
        return match ? parseInt(match[0]) : 1;
    }
    
    /**
     * 다음 문제 표시
     */
    async showNextQuestion() {
        console.log(`\n📍 [RetakeController] ========== 문제 ${this.currentQuestionIndex + 1}/${this.totalQuestions} ==========`);
        
        // 모든 문제 완료?
        if (this.currentQuestionIndex >= this.totalQuestions) {
            console.log(`✅ [RetakeController] 모든 문제 완료! 최종 결과 화면으로 이동`);
            this.showFinalResults();
            return;
        }
        
        // ✅ 현재 문제가 틀린 문제 목록에서 몇 번째인지 계산
        const wrongIndex = this.wrongQuestionsList.indexOf(this.currentQuestionIndex);
        if (wrongIndex !== -1) {
            this.currentWrongQuestionNumber = wrongIndex + 1; // 1-based
            console.log(`  ❌ 틀린 문제 ${this.currentWrongQuestionNumber}/${this.wrongQuestionsList.length}`);
        }
        
        // 현재 문제가 속한 컴포넌트 찾기
        const questionInfo = this.getQuestionInfo(this.currentQuestionIndex);
        
        if (!questionInfo) {
            console.error('❌ 문제 정보를 찾을 수 없습니다');
            return;
        }
        
        console.log(`  📊 questionInfo:`, questionInfo);
        
        // 1차 결과 확인
        const wasCorrect = this.wasQuestionCorrect(this.currentQuestionIndex);
        
        console.log(`  컴포넌트: ${questionInfo.componentType}`);
        console.log(`  세트ID: ${questionInfo.setId}`);
        console.log(`  컴포넌트 내 문제번호: ${questionInfo.questionIndexInComponent}`);
        console.log(`  1차 결과: ${wasCorrect ? '✅ 정답' : '❌ 틀림'}`);
        
        // 컴포넌트 로드 (맞은 문제도 모두 표시)
        console.log(`  🎯 컴포넌트 로드 시작`);
        await this.loadComponent(questionInfo, wasCorrect);
        
        // Floating UI 표시
        console.log(`  💬 Floating UI 표시`);
        this.showFloatingUI(wasCorrect, questionInfo);
        console.log(`========================================\n`);
    }
    
    /**
     * 문제 정보 가져오기 (어느 컴포넌트의 몇 번째 문제인지)
     * ⚠️ 1차 결과(firstAttemptData)에서 문자열 setId를 가져옴 (Module Config는 숫자만 제공)
     */
    getQuestionInfo(globalQuestionIndex) {
        let currentIndex = 0;
        let componentIndex = 0;
        
        for (const component of this.moduleConfig.components) {
            const questionsInComponent = component.questionsPerSet;
            
            if (globalQuestionIndex < currentIndex + questionsInComponent) {
                // ✅ 1차 결과에서 실제 문자열 setId 가져오기
                const compResult = this.firstAttemptData.componentResults[componentIndex];
                const actualSetId = compResult?.setId || component.setId;
                
                console.log(`  📍 [getQuestionInfo] 컴포넌트[${componentIndex}] type=${component.type}, Module Config setId=${component.setId}, 1차 결과 setId=${actualSetId}`);
                
                return {
                    componentType: component.type,
                    setId: actualSetId, // ✅ 문자열 setId 사용 (예: listening_conver_2)
                    questionIndexInComponent: globalQuestionIndex - currentIndex,
                    questionsPerSet: questionsInComponent
                };
            }
            
            currentIndex += questionsInComponent;
            componentIndex++;
        }
        
        return null;
    }
    
    /**
     * 1차 결과에서 해당 문제가 맞았는지 확인
     */
    wasQuestionCorrect(globalQuestionIndex) {
        let currentIndex = 0;
        
        for (const compResult of this.firstAttemptData.componentResults) {
            const answerArray = compResult.answers || compResult.results || [];
            
            if (globalQuestionIndex < currentIndex + answerArray.length) {
                const localIndex = globalQuestionIndex - currentIndex;
                return answerArray[localIndex]?.isCorrect || false;
            }
            
            currentIndex += answerArray.length;
        }
        
        return false;
    }
    
    /**
     * 1차 답안 데이터 가져오기
     */
    getFirstAttemptAnswer(globalQuestionIndex) {
        let currentIndex = 0;
        
        for (const compResult of this.firstAttemptData.componentResults) {
            const answerArray = compResult.answers || compResult.results || [];
            
            if (globalQuestionIndex < currentIndex + answerArray.length) {
                const localIndex = globalQuestionIndex - currentIndex;
                return answerArray[localIndex] || null;
            }
            
            currentIndex += answerArray.length;
        }
        
        return null;
    }
    
    /**
     * 🆕 1차 결과에서 해당 문제가 속한 컴포넌트 결과 전체 가져오기
     */
    getFirstAttemptComponent(globalQuestionIndex) {
        let currentIndex = 0;
        
        for (const compResult of this.firstAttemptData.componentResults) {
            const answerArray = compResult.answers || compResult.results || [];
            
            if (globalQuestionIndex < currentIndex + answerArray.length) {
                const localIndex = globalQuestionIndex - currentIndex;
                return {
                    component: compResult,  // 전체 컴포넌트 결과
                    localIndex: localIndex  // 컴포넌트 내 인덱스
                };
            }
            
            currentIndex += answerArray.length;
        }
        
        return null;
    }
    
    /**
     * 컴포넌트 로드 (단일 문제 모드)
     */
    async loadComponent(questionInfo, wasCorrect) {
        console.log(`🔧 [RetakeController] 컴포넌트 로드: ${questionInfo.componentType}`);
        
        this.currentComponentType = questionInfo.componentType;
        
        // 기존 화면 숨기기
        document.querySelectorAll('.screen, .test-screen, .result-screen').forEach(el => {
            el.style.display = 'none';
        });
        
        // 진행률 업데이트 (FillBlanks는 범위 표시)
        this.updateProgress(questionInfo);
        
        // 컴포넌트별 로드
        switch (questionInfo.componentType) {
            case 'fillblanks':
                await this.loadFillBlanksRetake(questionInfo, wasCorrect);
                break;
            case 'daily1':
                await this.loadDaily1Retake(questionInfo, wasCorrect);
                break;
            case 'daily2':
                await this.loadDaily2Retake(questionInfo, wasCorrect);
                break;
            case 'academic':
                await this.loadAcademicRetake(questionInfo, wasCorrect);
                break;
            // 🎧 리스닝 컴포넌트
            case 'response':
                await this.loadResponseRetake(questionInfo, wasCorrect);
                break;
            case 'conver':
                await this.loadConverRetake(questionInfo, wasCorrect);
                break;
            case 'announcement':
                await this.loadAnnouncementRetake(questionInfo, wasCorrect);
                break;
            case 'lecture':
                await this.loadLectureRetake(questionInfo, wasCorrect);
                break;
            default:
                console.error('❌ 지원하지 않는 컴포넌트:', questionInfo.componentType);
        }
    }
    
    /**
     * 진행률 표시 업데이트
     */
    updateProgress(questionInfo) {
        // FillBlanks는 fillBlanksProgress, 다른 컴포넌트는 해당 ID 사용
        let progressEl = null;
        
        if (questionInfo.componentType === 'fillblanks') {
            progressEl = document.getElementById('fillBlanksProgress');
        } else if (questionInfo.componentType === 'daily1') {
            progressEl = document.getElementById('daily1Progress');
        } else if (questionInfo.componentType === 'daily2') {
            progressEl = document.getElementById('daily2Progress');
        } else if (questionInfo.componentType === 'academic') {
            progressEl = document.getElementById('academicProgress');
        } else if (questionInfo.componentType === 'response') {
            progressEl = document.getElementById('responseProgress');
        } else if (questionInfo.componentType === 'conver') {
            progressEl = document.getElementById('converProgress');
        } else if (questionInfo.componentType === 'announcement') {
            progressEl = document.getElementById('announcementProgress');
        } else if (questionInfo.componentType === 'lecture') {
            progressEl = document.getElementById('lectureProgress');
        }
        
        if (!progressEl) {
            console.warn(`⚠️ 진행률 요소를 찾을 수 없습니다: ${questionInfo.componentType}`);
            return;
        }
        
        // ✅ 전체 문제 기준으로 표시 (Question 1 of 32 형식)
        if (questionInfo.componentType === 'fillblanks') {
            // FillBlanks는 범위 표시 (예: Questions 1-10 of 32)
            const start = this.currentQuestionIndex + 1;
            const end = this.currentQuestionIndex + questionInfo.questionsPerSet;
            progressEl.textContent = `Questions ${start}-${end} of ${this.totalQuestions}`;
        } else {
            // 다른 컴포넌트는 개별 표시 (예: Question 13 of 32)
            progressEl.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.totalQuestions}`;
        }
        
        console.log(`  📊 진행률: ${progressEl.textContent}`);
    }
    
    /**
     * FillBlanks 2차 풀이 모드
     */
    async loadFillBlanksRetake(questionInfo, wasCorrect) {
        console.log('📝 [RetakeController] FillBlanks 로드');
        console.log(`  📍 현재 문제 인덱스: ${this.currentQuestionIndex}`);
        console.log(`  📦 questionsPerSet: ${questionInfo.questionsPerSet}`);
        
        // FillBlanks는 10문제씩 묶여 있음 - 한 세트 전체를 표시
        if (!window.FillBlanksComponent) {
            console.error('❌ FillBlanksComponent가 로드되지 않았습니다');
            return;
        }
        
        // 1차 결과에서 해당 빈칸들의 답안 가져오기
        const firstAttemptBlanks = [];
        for (let i = 0; i < questionInfo.questionsPerSet; i++) {
            const answer = this.getFirstAttemptAnswer(this.currentQuestionIndex + i);
            firstAttemptBlanks.push(answer);
        }
        
        // 캐시 키 생성
        const cacheKey = `${questionInfo.componentType}_${questionInfo.setId}`;
        console.log(`  🔑 캐시 키: ${cacheKey}`);
        
        // ✅ 이미 생성된 인스턴스가 있으면 재사용!
        let fillblanks = this.componentInstanceCache[cacheKey];
        
        if (fillblanks) {
            console.log(`  ♻️ 기존 컴포넌트 인스턴스 재사용!`);
            console.log(`    현재 answers:`, fillblanks.answers);
            
            // ✅ 재진입 시에도 화면을 다시 렌더링해야 함!
            showScreen('readingFillBlanksScreen');
            fillblanks.render();  // render() 안에서 restoreAnswers() 호출됨!
            
            // ✅ 2차 풀이용 오버레이 다시 적용
            fillblanks.applyRetakeOverlay(firstAttemptBlanks);
            
        } else {
            console.log(`  🆕 새 컴포넌트 인스턴스 생성`);
            console.log(`  📝 1차 답안 ${firstAttemptBlanks.length}개 수집 완료`);
            console.log(`  🔧 FillBlanksComponent 생성 - setId: ${questionInfo.setId}`);
            
            fillblanks = new window.FillBlanksComponent(questionInfo.setId, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ FillBlanks 로드 실패:', error);
                }
            });
            
            console.log(`  🔄 initRetakeMode 호출 중...`);
            // 2차 풀이 모드로 초기화
            await fillblanks.initRetakeMode(0, 10, firstAttemptBlanks);
            
            console.log(`  ✅ FillBlanks 2차 풀이 초기화 완료`);
            
            // ✅ 인스턴스 캐시에 저장
            this.componentInstanceCache[cacheKey] = fillblanks;
        }
        
        // 인스턴스 저장
        this.currentComponentInstance = fillblanks;
        window.currentFillBlanksComponent = fillblanks;
        
        console.log(`  📊 최종 answers 상태:`, fillblanks.answers);
    }
    
    /**
     * Daily1 2차 풀이 모드
     */
    async loadDaily1Retake(questionInfo, wasCorrect) {
        console.log('🎯 [RetakeController] Daily1 로드 시작');
        
        // 1차 결과에서 컴포넌트 전체 가져오기
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        const setIdString = firstAttemptComponent.setId;
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        
        console.log('  ✅ setId:', setIdString, ', localIndex:', localIndex);
        
        if (!window.Daily1Component) {
            console.error('❌ Daily1Component가 로드되지 않았습니다');
            return;
        }
        
        // 캐시 키 생성
        const cacheKey = `${questionInfo.componentType}_${setIdString}`;
        console.log(`  🔑 캐시 키: ${cacheKey}`);
        
        // ✅ 이미 생성된 인스턴스가 있으면 재사용!
        let daily1 = this.componentInstanceCache[cacheKey];
        
        if (daily1) {
            console.log(`  ♻️ 기존 Daily1 인스턴스 재사용!`);
            console.log(`    현재 answers:`, daily1.answers);
            
            // ✅ 재진입 시에도 문제를 다시 렌더링
            await daily1.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
        } else {
            console.log(`  🆕 새 Daily1 인스턴스 생성`);
            
            daily1 = new window.Daily1Component(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Daily1 로드 실패:', error);
                }
            });
            
            await daily1.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
            // ✅ 인스턴스 캐시에 저장
            this.componentInstanceCache[cacheKey] = daily1;
        }
        
        // 인스턴스 저장
        this.currentComponentInstance = daily1;
        window.currentDaily1Component = daily1;
        
        // ✅ 이전에 작성한 답안 복원 (캐시에서)
        this.restoreComponentAnswersFromCache();
        
        console.log(`  📊 최종 answers 상태:`, daily1.answers);
    }
    
    /**
     * Daily2 2차 풀이 모드
     */
    async loadDaily2Retake(questionInfo, wasCorrect) {
        console.log('🎯 [RetakeController] Daily2 로드 시작');
        
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        const setIdString = firstAttemptComponent.setId;
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        
        if (!window.Daily2Component) {
            console.error('❌ Daily2Component가 로드되지 않았습니다');
            return;
        }
        
        const cacheKey = `${questionInfo.componentType}_${setIdString}`;
        let daily2 = this.componentInstanceCache[cacheKey];
        
        if (daily2) {
            console.log(`  ♻️ 기존 Daily2 인스턴스 재사용!`);
            await daily2.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
        } else {
            console.log(`  🆕 새 Daily2 인스턴스 생성`);
            daily2 = new window.Daily2Component(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Daily2 로드 실패:', error);
                }
            });
            await daily2.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            this.componentInstanceCache[cacheKey] = daily2;
        }
        
        this.currentComponentInstance = daily2;
        window.currentDaily2Component = daily2;
        this.restoreComponentAnswersFromCache();
    }
    
    /**
     * Academic 2차 풀이 모드
     */
    async loadAcademicRetake(questionInfo, wasCorrect) {
        console.log('🎯 [RetakeController] Academic 로드 시작');
        
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        const setIdString = firstAttemptComponent.setId;
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        
        if (!window.AcademicComponent) {
            console.error('❌ AcademicComponent가 로드되지 않았습니다');
            return;
        }
        
        const cacheKey = `${questionInfo.componentType}_${setIdString}`;
        let academic = this.componentInstanceCache[cacheKey];
        
        if (academic) {
            console.log(`  ♻️ 기존 Academic 인스턴스 재사용!`);
            await academic.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
        } else {
            console.log(`  🆕 새 Academic 인스턴스 생성`);
            academic = new window.AcademicComponent(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Academic 로드 실패:', error);
                }
            });
            await academic.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            this.componentInstanceCache[cacheKey] = academic;
        }
        
        this.currentComponentInstance = academic;
        window.currentAcademicComponent = academic;
        this.restoreComponentAnswersFromCache();
    }
    
    /**
     * ================================================
     * 리스닝 2차 풀이 로더 함수들
     * ================================================
     */
    
    /**
     * Response 2차 풀이 모드
     */
    async loadResponseRetake(questionInfo, wasCorrect) {
        console.log('🎯🎯🎯 [RetakeController] Response 로드 시작');
        
        // 🆕 1차 결과에서 컴포넌트 전체 가져오기
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        
        console.log('  ✅ 1차 결과 컴포넌트:', firstAttemptComponent);
        console.log('    - type:', firstAttemptComponent.type);
        console.log('    - setId:', firstAttemptComponent.setId);
        console.log('    - localIndex:', localIndex);
        
        // 1차 결과에서 해당 문제의 답안 가져오기
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        console.log('  📥 firstAttemptAnswer:', firstAttemptAnswer);
        
        // ResponseComponent 인스턴스 생성
        if (!window.ResponseComponent) {
            console.error('❌ ResponseComponent가 로드되지 않았습니다');
            return;
        }
        
        const setIdString = firstAttemptComponent.setId;
        
        // 캐시 키 생성
        const cacheKey = `response_${setIdString}`;
        console.log(`  🔑 캐시 키: ${cacheKey}`);
        
        // ✅ 이미 생성된 인스턴스가 있으면 재사용!
        let response = this.componentInstanceCache[cacheKey];
        
        if (response) {
            console.log(`  ♻️ 기존 Response 인스턴스 재사용!`);
            console.log(`    현재 answers:`, response.answers);
            
            // ✅ 재진입 시에도 문제를 다시 렌더링
            await response.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
        } else {
            console.log(`  🆕 새 Response 인스턴스 생성`);
            console.log('    - 사용할 setId 문자열:', setIdString);
            
            response = new window.ResponseComponent(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Response 로드 실패:', error);
                }
            });
            
            console.log('  ✅ ResponseComponent 인스턴스 생성 완료');
            console.log('  🔄 initRetakeMode 호출 중... (localIndex:', localIndex, ')');
            
            await response.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
            console.log('  ✅ Response 2차 풀이 모드 초기화 완료');
            
            // ✅ 인스턴스 캐시에 저장
            this.componentInstanceCache[cacheKey] = response;
        }
        
        this.currentComponentInstance = response;
        window.currentResponseComponent = response;
    }
    
    /**
     * Conver 2차 풀이 모드
     */
    async loadConverRetake(questionInfo, wasCorrect) {
        console.log('🎯🎯🎯 [RetakeController] Conver 로드 시작');
        
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        
        console.log('  ✅ 1차 결과 컴포넌트:', firstAttemptComponent);
        console.log('    - type:', firstAttemptComponent.type);
        console.log('    - setId:', firstAttemptComponent.setId);
        console.log('    - localIndex:', localIndex);
        
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        console.log('  📥 firstAttemptAnswer:', firstAttemptAnswer);
        
        if (!window.ConverComponent) {
            console.error('❌ ConverComponent가 로드되지 않았습니다');
            return;
        }
        
        const setIdString = firstAttemptComponent.setId;
        
        // 캐시 키 생성
        const cacheKey = `conver_${setIdString}`;
        console.log(`  🔑 캐시 키: ${cacheKey}`);
        
        // ✅ 이미 생성된 인스턴스가 있으면 재사용!
        let conver = this.componentInstanceCache[cacheKey];
        
        if (conver) {
            console.log(`  ♻️ 기존 Conver 인스턴스 재사용!`);
            console.log(`    현재 answers:`, conver.answers);
            
            // ✅ 재진입 시에도 문제를 다시 렌더링
            await conver.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
        } else {
            console.log(`  🆕 새 Conver 인스턴스 생성`);
            console.log('    - 사용할 setId 문자열:', setIdString);
            
            conver = new window.ConverComponent(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Conver 로드 실패:', error);
                }
            });
            
            console.log('  ✅ ConverComponent 인스턴스 생성 완료');
            console.log('  🔄 initRetakeMode 호출 중... (localIndex:', localIndex, ')');
            
            await conver.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
            console.log('  ✅ Conver 2차 풀이 모드 초기화 완료');
            
            // ✅ 인스턴스 캐시에 저장
            this.componentInstanceCache[cacheKey] = conver;
        }
        
        this.currentComponentInstance = conver;
        window.currentConverComponent = conver;
    }
    
    /**
     * Announcement 2차 풀이 모드
     */
    async loadAnnouncementRetake(questionInfo, wasCorrect) {
        console.log('🎯🎯🎯 [RetakeController] Announcement 로드 시작');
        
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        
        console.log('  ✅ 1차 결과 컴포넌트:', firstAttemptComponent);
        console.log('    - type:', firstAttemptComponent.type);
        console.log('    - setId:', firstAttemptComponent.setId);
        console.log('    - localIndex:', localIndex);
        
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        console.log('  📥 firstAttemptAnswer:', firstAttemptAnswer);
        
        if (!window.AnnouncementComponent) {
            console.error('❌ AnnouncementComponent가 로드되지 않았습니다');
            return;
        }
        
        const setIdString = firstAttemptComponent.setId;
        
        // 캐시 키 생성
        const cacheKey = `announcement_${setIdString}`;
        console.log(`  🔑 캐시 키: ${cacheKey}`);
        
        // ✅ 이미 생성된 인스턴스가 있으면 재사용!
        let announcement = this.componentInstanceCache[cacheKey];
        
        if (announcement) {
            console.log(`  ♻️ 기존 Announcement 인스턴스 재사용!`);
            console.log(`    현재 answers:`, announcement.answers);
            
            // ✅ 재진입 시에도 문제를 다시 렌더링
            await announcement.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
        } else {
            console.log(`  🆕 새 Announcement 인스턴스 생성`);
            console.log('    - 사용할 setId 문자열:', setIdString);
            
            announcement = new window.AnnouncementComponent(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Announcement 로드 실패:', error);
                }
            });
            
            // setId를 명시적으로 설정
            announcement.setId = setIdString;
            
            console.log('  ✅ AnnouncementComponent 인스턴스 생성 완료');
            console.log('  🔄 initRetakeMode 호출 중... (localIndex:', localIndex, ')');
            
            await announcement.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
            console.log('  ✅ Announcement 2차 풀이 모드 초기화 완료');
            
            // ✅ 인스턴스 캐시에 저장
            this.componentInstanceCache[cacheKey] = announcement;
        }
        
        this.currentComponentInstance = announcement;
        window.currentAnnouncementComponent = announcement;
    }
    
    /**
     * Lecture 2차 풀이 모드
     */
    async loadLectureRetake(questionInfo, wasCorrect) {
        console.log('🎯🎯🎯 [RetakeController] Lecture 로드 시작');
        
        const componentData = this.getFirstAttemptComponent(this.currentQuestionIndex);
        
        if (!componentData) {
            console.error('❌ 1차 결과 컴포넌트를 찾을 수 없습니다');
            return;
        }
        
        const firstAttemptComponent = componentData.component;
        const localIndex = componentData.localIndex;
        
        console.log('  ✅ 1차 결과 컴포넌트:', firstAttemptComponent);
        console.log('    - type:', firstAttemptComponent.type);
        console.log('    - setId:', firstAttemptComponent.setId);
        console.log('    - localIndex:', localIndex);
        
        const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
        console.log('  📥 firstAttemptAnswer:', firstAttemptAnswer);
        
        if (!window.LectureComponent) {
            console.error('❌ LectureComponent가 로드되지 않았습니다');
            return;
        }
        
        const setIdString = firstAttemptComponent.setId;
        
        // 캐시 키 생성
        const cacheKey = `lecture_${setIdString}`;
        console.log(`  🔑 캐시 키: ${cacheKey}`);
        
        // ✅ 이미 생성된 인스턴스가 있으면 재사용!
        let lecture = this.componentInstanceCache[cacheKey];
        
        if (lecture) {
            console.log(`  ♻️ 기존 Lecture 인스턴스 재사용!`);
            console.log(`    현재 answers:`, lecture.answers);
            
            // ✅ 재진입 시에도 문제를 다시 렌더링
            await lecture.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
        } else {
            console.log(`  🆕 새 Lecture 인스턴스 생성`);
            console.log('    - 사용할 setId 문자열:', setIdString);
            
            lecture = new window.LectureComponent(setIdString, {
                onComplete: null,
                onError: (error) => {
                    console.error('❌ Lecture 로드 실패:', error);
                }
            });
            
            // setId를 명시적으로 설정
            lecture.setId = setIdString;
            
            console.log('  ✅ LectureComponent 인스턴스 생성 완료');
            console.log('  🔄 initRetakeMode 호출 중... (localIndex:', localIndex, ')');
            
            await lecture.initRetakeMode(localIndex, wasCorrect, firstAttemptAnswer);
            
            console.log('  ✅ Lecture 2차 풀이 모드 초기화 완료');
            
            // ✅ 인스턴스 캐시에 저장
            this.componentInstanceCache[cacheKey] = lecture;
        }
        
        this.currentComponentInstance = lecture;
        window.currentLectureComponent = lecture;
    }
    
    /**
     * Floating UI 표시
     */
    showFloatingUI(wasCorrect, questionInfo) {
        // 기존 floating UI 제거
        const existingFloating = document.getElementById('retakeFloatingUI');
        if (existingFloating) {
            existingFloating.remove();
        }
        
        // FillBlanks는 10문제를 한 번에 표시하므로 세트 전체의 정답 여부 확인
        let displayCorrect = wasCorrect;
        let displayMessage = '';
        
        if (this.currentComponentType === 'fillblanks') {
            // FillBlanks 세트 전체의 정답 개수 확인
            let correctCount = 0;
            let totalCount = questionInfo.questionsPerSet;
            
            for (let i = 0; i < totalCount; i++) {
                if (this.wasQuestionCorrect(this.currentQuestionIndex + i)) {
                    correctCount++;
                }
            }
            
            displayCorrect = (correctCount === totalCount); // 모두 맞았을 때만 '맞음' 표시
            displayMessage = `빈칸 ${correctCount}/${totalCount} 정답`;
        }
        
        // Floating UI 생성
        const floatingDiv = document.createElement('div');
        floatingDiv.id = 'retakeFloatingUI';
        floatingDiv.className = displayCorrect ? 'retake-floating correct' : 'retake-floating wrong';
        
        if (displayCorrect && this.currentComponentType !== 'fillblanks') {
            floatingDiv.innerHTML = `
                <div class="retake-floating-content">
                    <div class="retake-icon">✅</div>
                    <div class="retake-message">맞은 문제입니다!</div>
                    <div class="retake-buttons">
                        ${this.currentQuestionIndex > 0 ? '<button class="retake-prev-btn" onclick="window.retakeController.goToPreviousQuestion()">← 이전 문제</button>' : ''}
                        <button class="retake-next-btn" onclick="window.retakeController.goToNextQuestion()">
                            다음 문제로 →
                        </button>
                    </div>
                </div>
            `;
        } else if (this.currentComponentType === 'fillblanks') {
            // FillBlanks는 별도 메시지
            floatingDiv.innerHTML = `
                <div class="retake-floating-content">
                    <div class="retake-icon">${displayCorrect ? '✅' : '⚠️'}</div>
                    <div class="retake-message">${displayMessage}<br>${displayCorrect ? '모두 정답입니다!' : '틀린 빈칸을 수정하세요'}</div>
                    <div class="retake-buttons">
                        ${this.currentQuestionIndex > 0 ? '<button class="retake-prev-btn" onclick="window.retakeController.goToPreviousQuestion()">← 이전 유형</button>' : ''}
                        <button class="retake-next-btn" onclick="window.retakeController.goToNextQuestion()">
                            다음 유형으로 →
                        </button>
                    </div>
                </div>
            `;
        } else {
            floatingDiv.innerHTML = `
                <div class="retake-floating-content">
                    <div class="retake-icon">⚠️</div>
                    <div class="retake-message">틀렸던 문제입니다<br>다시 풀어보세요!</div>
                    <div class="retake-buttons">
                        ${this.currentQuestionIndex > 0 ? '<button class="retake-prev-btn" onclick="window.retakeController.goToPreviousQuestion()">← 이전 문제</button>' : ''}
                        <button class="retake-next-btn" onclick="window.retakeController.goToNextQuestion()">
                            다음 문제로 →
                        </button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(floatingDiv);
    }
    
    /**
     * 다음 문제로 이동 (버튼 클릭)
     */
    goToNextQuestion() {
        console.log(`\n➡️ [RetakeController] ========== 다음 문제로 이동 ==========`);
        console.log(`  현재 인덱스: ${this.currentQuestionIndex + 1}`);
        console.log(`  현재 컴포넌트: ${this.currentComponentType}`);
        
        // 답안 수집
        if (this.currentComponentType === 'fillblanks') {
            // FillBlanks는 맞고 틀림 상관없이 무조건 수집 (10문제 묶음)
            console.log(`  💾 FillBlanks 답안 수집`);
            this.collectSecondAttemptAnswer();
            
            // ✅ 캐시에 저장 (이전으로 돌아올 때를 위해)
            this.saveComponentAnswersToCache();
        } else {
            // 다른 컴포넌트는 틀린 문제만 수집
            const wasCorrect = this.wasQuestionCorrect(this.currentQuestionIndex);
            console.log(`  현재 문제 1차 결과: ${wasCorrect ? '✅ 정답' : '❌ 틀림'}`);
            if (!wasCorrect) {
                console.log(`  💾 틀린 문제 답안 수집`);
                this.collectSecondAttemptAnswer();
                
                // ✅ 캐시에 저장
                this.saveComponentAnswersToCache();
            }
        }
        
        // 다음 문제로 이동
        if (this.currentComponentType === 'fillblanks') {
            // FillBlanks는 10문제를 한 번에 표시하므로 10 증가
            const questionInfo = this.getQuestionInfo(this.currentQuestionIndex);
            const increment = questionInfo.questionsPerSet;
            console.log(`  📦 FillBlanks 세트 완료 - ${increment}문제 건너뛰기`);
            console.log(`  이동: Q${this.currentQuestionIndex + 1} → Q${this.currentQuestionIndex + increment + 1}`);
            this.currentQuestionIndex += increment;
        } else {
            // 다른 컴포넌트는 1문제씩
            console.log(`  📝 개별 문제 완료 - 1문제 건너뛰기`);
            console.log(`  이동: Q${this.currentQuestionIndex + 1} → Q${this.currentQuestionIndex + 2}`);
            this.currentQuestionIndex++;
        }
        
        console.log(`  새 인덱스: ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
        console.log(`========================================\n`);
        
        this.showNextQuestion();
    }
    
    /**
     * 이전 문제로 이동 (버튼 클릭)
     */
    goToPreviousQuestion() {
        console.log(`\n⬅️ [RetakeController] ========== 이전 문제로 이동 ==========`);
        console.log(`  현재 인덱스: ${this.currentQuestionIndex + 1}`);
        console.log(`  현재 컴포넌트: ${this.currentComponentType}`);
        
        // 첫 번째 문제면 이동 불가
        if (this.currentQuestionIndex <= 0) {
            console.log(`  ⚠️ 첫 번째 문제입니다. 이전 문제가 없습니다.`);
            return;
        }
        
        // 이전 문제로 이동
        if (this.currentComponentType === 'fillblanks') {
            // FillBlanks는 10문제를 한 번에 표시하므로 10 감소
            const questionInfo = this.getQuestionInfo(this.currentQuestionIndex);
            const decrement = questionInfo.questionsPerSet;
            console.log(`  📦 이전 FillBlanks 세트로 - ${decrement}문제 이전으로`);
            console.log(`  이동: Q${this.currentQuestionIndex + 1} → Q${this.currentQuestionIndex - decrement + 1}`);
            this.currentQuestionIndex -= decrement;
        } else {
            // 다른 컴포넌트는 1문제씩
            // 현재 문제가 컴포넌트의 첫 문제인지 확인
            const currentQuestionInfo = this.getQuestionInfo(this.currentQuestionIndex);
            
            // 이전 문제가 FillBlanks인지 확인
            if (this.currentQuestionIndex >= 1) {
                const prevQuestionInfo = this.getQuestionInfo(this.currentQuestionIndex - 1);
                
                if (prevQuestionInfo.componentType === 'fillblanks') {
                    // 이전이 FillBlanks면 10문제 건너뛰기
                    const decrement = prevQuestionInfo.questionsPerSet;
                    console.log(`  📦 이전이 FillBlanks - ${decrement}문제 이전으로`);
                    console.log(`  이동: Q${this.currentQuestionIndex + 1} → Q${this.currentQuestionIndex - decrement + 1}`);
                    this.currentQuestionIndex -= decrement;
                } else {
                    // 일반 문제
                    console.log(`  📝 이전 문제로 - 1문제 이전으로`);
                    console.log(`  이동: Q${this.currentQuestionIndex + 1} → Q${this.currentQuestionIndex}`);
                    this.currentQuestionIndex--;
                }
            }
        }
        
        console.log(`  새 인덱스: ${this.currentQuestionIndex + 1}/${this.totalQuestions}`);
        console.log(`========================================\n`);
        
        this.showNextQuestion();
    }
    
    /**
     * 2차 답안 수집
     */
    collectSecondAttemptAnswer() {
        console.log('💾 [RetakeController] 2차 답안 수집');
        
        if (!this.currentComponentInstance) {
            console.warn('⚠️ [RetakeController] 2차 답안 수집 실패 - 현재 컴포넌트 인스턴스가 없습니다');
            return;
        }
        
        // 컴포넌트별로 답안 가져오기
        let answer = null;
        
        switch (this.currentComponentType) {
            case 'daily1':
            case 'daily2':
                if (this.currentComponentInstance.getRetakeAnswer) {
                    const userAnswer = this.currentComponentInstance.getRetakeAnswer(); // 숫자 (1, 2, 3, 4)
                    
                    if (userAnswer) {
                        // ✅ 채점
                        const currentQuestion = this.currentComponentInstance.currentSet.questions[this.currentComponentInstance.currentQuestion];
                        const correctAnswer = currentQuestion.correctAnswer; // 숫자
                        const isCorrect = userAnswer === correctAnswer;
                        
                        answer = {
                            userAnswer: userAnswer,
                            isCorrect: isCorrect
                        };
                        
                        console.log(`  📝 ${this.currentComponentType} 채점: ${userAnswer} vs 정답 ${correctAnswer} → ${isCorrect ? '✅' : '❌'}`);
                    }
                }
                break;
            case 'academic':
                if (this.currentComponentInstance.getRetakeAnswer) {
                    const userAnswer = this.currentComponentInstance.getRetakeAnswer(); // 'A', 'B', 'C', 'D', 'E'
                    
                    if (userAnswer) {
                        // ✅ 채점: 'A' → 1, 'B' → 2로 변환
                        const userAnswerNumber = userAnswer.charCodeAt(0) - 64; // 'A'.charCodeAt(0) = 65
                        const currentQuestion = this.currentComponentInstance.setData.questions[this.currentComponentInstance.currentQuestion];
                        const correctAnswer = currentQuestion.correctAnswer; // 숫자 (1, 2, 3, 4, 5)
                        const isCorrect = userAnswerNumber === correctAnswer;
                        
                        answer = {
                            userAnswer: userAnswer,
                            isCorrect: isCorrect
                        };
                        
                        console.log(`  📝 Academic 채점: "${userAnswer}" (${userAnswerNumber}) vs 정답 ${correctAnswer} → ${isCorrect ? '✅' : '❌'}`);
                    }
                }
                break;
            case 'fillblanks':
                // FillBlanks는 10문제 묶음 - 한 번에 수집
                if (this.currentComponentInstance.answers) {
                    console.log('📝 FillBlanks 10문제 답안 수집:', this.currentComponentInstance.answers);
                    
                    // ✅ 각 빈칸별로 개별 문제 번호에 저장
                    const sortedBlanks = [...this.currentComponentInstance.currentSet.blanks]
                        .sort((a, b) => a.startIndex - b.startIndex);
                    
                    sortedBlanks.forEach((blank, index) => {
                        const globalQuestionIndex = this.currentQuestionIndex + index;
                        const answerKey = `q${globalQuestionIndex}`;
                        const userAnswer = this.currentComponentInstance.answers[blank.id] || '';
                        const correctAnswer = blank.answer;
                        const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
                        
                        this.secondAttemptAnswers[answerKey] = {
                            userAnswer: userAnswer,
                            isCorrect: isCorrect
                        };
                        
                        console.log(`  - ${answerKey} (빈칸 ${blank.id}): "${userAnswer}" ${isCorrect ? '✅' : '❌'} (정답: "${correctAnswer}")`);
                    });
                    
                    return 'fillblanks_bulk_saved';
                }
                break;
            
            // 🎧 리스닝 컴포넌트들
            case 'response':
            case 'conver':
            case 'announcement':
            case 'lecture':
                if (this.currentComponentInstance.getRetakeAnswer) {
                    const userAnswer = this.currentComponentInstance.getRetakeAnswer(); // 숫자 (1, 2, 3, 4...)
                    
                    // 1차 결과에서 정답 가져오기
                    const firstAttemptAnswer = this.getFirstAttemptAnswer(this.currentQuestionIndex);
                    
                    if (firstAttemptAnswer && firstAttemptAnswer.correctAnswer) {
                        const correctAnswer = firstAttemptAnswer.correctAnswer;
                        
                        // userAnswer가 있으면 채점, 없으면 null (선택 안 함)
                        if (userAnswer) {
                            const isCorrect = userAnswer === correctAnswer;
                            answer = {
                                userAnswer: userAnswer,
                                isCorrect: isCorrect
                            };
                            console.log(`  📝 ${this.currentComponentType} 채점: ${userAnswer} vs 정답 ${correctAnswer} → ${isCorrect ? '✅' : '❌'}`);
                        } else {
                            // 선택하지 않음
                            answer = {
                                userAnswer: null,
                                isCorrect: false
                            };
                            console.log(`  📝 ${this.currentComponentType}: 답안 선택 안 함 → ❌`);
                        }
                    } else {
                        console.warn(`  ⚠️ ${this.currentComponentType}: 1차 결과에서 정답을 찾을 수 없습니다`);
                    }
                }
                break;
        }
        
        // 답안 저장
        if (answer !== null) {
            const answerKey = `q${this.currentQuestionIndex}`;  // ✅ 문자열 키로 통일
            this.secondAttemptAnswers[answerKey] = answer;
            console.log(`  저장됨: ${answerKey} (문제 ${this.currentQuestionIndex + 1}) →`, answer);
        } else {
            console.log(`  답안 없음: 문제 ${this.currentQuestionIndex + 1}`);
        }
    }
    
    /**
     * 💾 현재 컴포넌트 답안을 캐시에 저장
     */
    saveComponentAnswersToCache() {
        if (!this.currentComponentInstance) {
            console.warn('⚠️ [RetakeController] currentComponentInstance가 없어서 답안 저장 불가');
            return;
        }
        
        const questionInfo = this.getQuestionInfo(this.currentQuestionIndex);
        const cacheKey = `${questionInfo.componentType}_${questionInfo.setId}`;
        
        if (this.currentComponentType === 'fillblanks') {
            // FillBlanks: 10문제 답안 객체를 통째로 저장
            const answers = { ...this.currentComponentInstance.answers };
            this.componentAnswersCache[cacheKey] = answers;
            console.log(`💾 [캐시 저장] ${cacheKey}:`, answers);
        } else {
            // Daily1, Daily2, Academic: 개별 문제 답안 저장
            const answers = { ...this.currentComponentInstance.answers };
            this.componentAnswersCache[cacheKey] = answers;
            console.log(`💾 [캐시 저장] ${cacheKey}:`, answers);
        }
    }
    
    /**
     * 📥 캐시에서 답안 복원
     */
    restoreComponentAnswersFromCache() {
        if (!this.currentComponentInstance) {
            console.warn('⚠️ [RetakeController] currentComponentInstance가 없어서 답안 복원 불가');
            return;
        }
        
        const questionInfo = this.getQuestionInfo(this.currentQuestionIndex);
        const cacheKey = `${questionInfo.componentType}_${questionInfo.setId}`;
        
        const cachedAnswers = this.componentAnswersCache[cacheKey];
        
        if (cachedAnswers) {
            console.log(`📥 [캐시 복원] ${cacheKey}:`, cachedAnswers);
            
            // 컴포넌트의 answers 객체에 복원
            this.currentComponentInstance.answers = { ...cachedAnswers };
            
            if (this.currentComponentType === 'fillblanks') {
                // FillBlanks: input 필드에도 값 복원
                Object.entries(cachedAnswers).forEach(([blankId, value]) => {
                    const input = document.getElementById(blankId);
                    if (input && value) {
                        input.value = value;
                        console.log(`  ✅ ${blankId} → "${value}" 복원`);
                    }
                });
            } else {
                // Daily1, Daily2, Academic: 선택된 옵션에 'selected' 클래스 추가
                console.log(`  📥 객관식 답안 복원 중...`);
                Object.entries(cachedAnswers).forEach(([questionKey, selectedOption]) => {
                    console.log(`    - ${questionKey} → 선택: ${selectedOption}`);
                    
                    // 현재 화면에 표시된 문제의 답안인 경우에만 UI 복원
                    // Academic은 숫자 인덱스를 사용하므로 비교 방식을 다르게 처리
                    let isCurrentQuestion = false;
                    
                    if (this.currentComponentType === 'academic') {
                        // Academic: 숫자 인덱스와 currentQuestion을 직접 비교
                        const numericKey = parseInt(questionKey);
                        const currentIndex = this.currentComponentInstance.currentQuestion;
                        isCurrentQuestion = numericKey === currentIndex;
                        console.log(`    🔍 현재 문제 인덱스: ${currentIndex}, 캐시 키: ${questionKey} (${numericKey}) → ${isCurrentQuestion ? '일치 ✅' : '불일치 ❌'}`);
                    } else {
                        // Daily1, Daily2: "q1", "q2" 형식
                        const currentQuestionKey = `q${questionInfo.questionIndexInComponent + 1}`;
                        isCurrentQuestion = questionKey === currentQuestionKey;
                        console.log(`    🔍 현재 문제: ${currentQuestionKey}, 캐시 문제: ${questionKey} → ${isCurrentQuestion ? '일치 ✅' : '불일치 ❌'}`);
                    }
                    
                    if (isCurrentQuestion) {
                        console.log(`    ✅ 현재 문제와 일치! UI 복원 시작`);
                        
                        // 옵션 요소 찾기 (daily1Options, daily2Options, academicOptions)
                        const optionsContainerId = this.currentComponentInstance.optionsId;
                        console.log(`    📦 optionsContainerId: ${optionsContainerId}`);
                        
                        const optionsContainer = document.getElementById(optionsContainerId);
                        console.log(`    📦 optionsContainer:`, optionsContainer);
                        
                        if (optionsContainer) {
                            // ✅ 'answer-option' 클래스로 찾기!
                            const allOptions = optionsContainer.querySelectorAll('.answer-option');
                            console.log(`    📦 찾은 옵션 개수: ${allOptions.length}`);
                            
                            allOptions.forEach(opt => {
                                console.log(`      옵션 data-value: ${opt.dataset.value}`);
                                opt.classList.remove('selected');
                            });
                            
                            // 선택된 옵션에 'selected' 추가
                            let selectedOptionEl;
                            
                            if (this.currentComponentType === 'academic') {
                                // Academic: 문자열 비교 ('A', 'B', 'C', ...)
                                selectedOptionEl = Array.from(allOptions).find(opt => 
                                    opt.dataset.value === selectedOption
                                );
                            } else {
                                // Daily1, Daily2: 숫자 비교 (1, 2, 3, 4)
                                selectedOptionEl = Array.from(allOptions).find(opt => 
                                    parseInt(opt.dataset.value) === selectedOption
                                );
                            }
                            
                            console.log(`    🎯 선택할 옵션 엘리먼트:`, selectedOptionEl);
                            
                            if (selectedOptionEl) {
                                selectedOptionEl.classList.add('selected');
                                console.log(`    ✅ 옵션 ${selectedOption} UI 복원 완료!`);
                            } else {
                                console.error(`    ❌ 옵션 ${selectedOption}을 찾을 수 없음!`);
                            }
                        } else {
                            console.error(`    ❌ optionsContainer를 찾을 수 없음!`);
                        }
                    } else {
                        console.log(`    ⏭️ 다른 문제의 답안 - 건너뜀`);
                    }
                });
            }
        } else {
            console.log(`📥 [캐시 복원] ${cacheKey}: 캐시 없음 (첫 진입)`);
        }
    }
    
    /**
     * 최종 결과 화면
     */
    showFinalResults() {
        console.log('🎉 [RetakeController] 2차 풀이 완료! 최종 결과 표시');
        
        // Floating UI 제거
        const existingFloating = document.getElementById('retakeFloatingUI');
        if (existingFloating) {
            existingFloating.remove();
        }
        
        // 2차 채점
        const secondResults = this.gradeSecondAttempt();
        
        // 2차 결과 화면 표시
        this.showSecondResultScreen(secondResults);
    }
    
    /**
     * 2차 채점
     */
    gradeSecondAttempt() {
        console.log('📊 [RetakeController] 2차 채점 중...');
        
        // 1차 결과와 2차 답안을 비교해서 채점
        const firstResults = [];
        const secondResults = [];
        
        let currentIndex = 0;
        
        for (const compResult of this.firstAttemptData.componentResults) {
            const answerArray = compResult.answers || compResult.results || [];
            
            for (const answerData of answerArray) {
                // 1차 결과
                firstResults.push(answerData.isCorrect || false);
                
                // 2차 답안 (틀린 문제만 2차 풀이를 하므로)
                const secondAnswerKey = `q${currentIndex}`;
                const secondAnswer = this.secondAttemptAnswers[secondAnswerKey];
                
                console.log(`  [채점] 문제 ${currentIndex}: 1차=${answerData.isCorrect}, secondAnswer=`, secondAnswer);
                
                if (secondAnswer !== undefined) {
                    // 2차에서 다시 풀었음
                    secondResults.push(secondAnswer.isCorrect || false);
                    console.log(`    → 2차 풀이함: ${secondAnswer.isCorrect}`);
                } else {
                    // 1차에 맞아서 2차에서 안 풀었음 -> 1차 결과 유지
                    secondResults.push(answerData.isCorrect || false);
                    console.log(`    → 1차 결과 유지: ${answerData.isCorrect}`);
                }
                
                currentIndex++;
            }
        }
        
        const firstScore = firstResults.filter(r => r).length;
        const secondScore = secondResults.filter(r => r).length;
        
        const firstPercent = Math.round((firstScore / this.totalQuestions) * 100);
        const secondPercent = Math.round((secondScore / this.totalQuestions) * 100);
        
        // ✅ 올바른 레벨 계산 함수 사용
        const firstLevel = this.calculateLevel(firstScore);
        const secondLevel = this.calculateLevel(secondScore);
        
        console.log(`  ✅ 1차: ${firstScore}/${this.totalQuestions} (${firstPercent}%) - Level ${firstLevel}`);
        console.log(`  ✅ 2차: ${secondScore}/${this.totalQuestions} (${secondPercent}%) - Level ${secondLevel}`);
        
        return {
            firstAttempt: {
                score: firstScore,
                percentage: firstPercent,
                level: firstLevel,
                results: firstResults
            },
            secondAttempt: {
                score: secondScore,
                percentage: secondPercent,
                level: secondLevel,
                results: secondResults
            },
            improvement: {
                scoreDiff: secondScore - firstScore,
                percentDiff: secondPercent - firstPercent,
                levelDiff: parseFloat((secondLevel - firstLevel).toFixed(1))
            }
        };
    }
    
    /**
     * 레벨 계산 (Reading 구간표)
     * - 0~3개: 1.0
     * - 4~6개: 1.5
     * - 7~10개: 2.0
     * - 11~13개: 2.5
     * - 14~17개: 3.0
     * - 18~20개: 3.5
     * - 21~24개: 4.0
     * - 25~27개: 4.5
     * - 28~30개: 5.0
     * - 31~32개: 5.5
     * - 33~35개: 6.0
     */
    calculateLevel(correctCount) {
        if (this.sectionType === 'reading') {
            // Reading: 35문제 기준
            if (correctCount <= 3) return 1.0;
            if (correctCount <= 6) return 1.5;
            if (correctCount <= 10) return 2.0;
            if (correctCount <= 13) return 2.5;
            if (correctCount <= 17) return 3.0;
            if (correctCount <= 20) return 3.5;
            if (correctCount <= 24) return 4.0;
            if (correctCount <= 27) return 4.5;
            if (correctCount <= 30) return 5.0;
            if (correctCount <= 32) return 5.5;
            return 6.0; // 33~35개
        } else if (this.sectionType === 'listening') {
            // Listening: 32문제 기준
            // 0~2개: 1.0
            // 3~5개: 1.5
            // 6~8개: 2.0
            // 9~11개: 2.5
            // 12~15개: 3.0
            // 16~18개: 3.5
            // 19~21개: 4.0
            // 22~24개: 4.5
            // 25~27개: 5.0
            // 28~29개: 5.5
            // 30~32개: 6.0
            if (correctCount <= 2) return 1.0;
            if (correctCount <= 5) return 1.5;
            if (correctCount <= 8) return 2.0;
            if (correctCount <= 11) return 2.5;
            if (correctCount <= 15) return 3.0;
            if (correctCount <= 18) return 3.5;
            if (correctCount <= 21) return 4.0;
            if (correctCount <= 24) return 4.5;
            if (correctCount <= 27) return 5.0;
            if (correctCount <= 29) return 5.5;
            return 6.0; // 30~32개
        } else {
            return 0;
        }
    }
    
    /**
     * 2차 결과 화면 표시
     */
    showSecondResultScreen(secondResults) {
        console.log('📊 [RetakeController] 2차 결과 화면 표시');
        console.log('  결과 데이터:', secondResults);
        console.log('  secondAttemptAnswers:', this.secondAttemptAnswers);
        console.log('  secondAttemptAnswers 키 개수:', Object.keys(this.secondAttemptAnswers).length);
        
        // ✅ secondAttemptAnswers를 결과 데이터에 포함
        secondResults.secondAttemptAnswers = this.secondAttemptAnswers;
        
        // 리딩인 경우 showReadingRetakeResult 호출
        if (this.sectionType === 'reading' && typeof window.showReadingRetakeResult === 'function') {
            window.showReadingRetakeResult(secondResults);
        }
        // 리스닝인 경우 showListeningRetakeResult 호출
        else if (this.sectionType === 'listening' && typeof window.showListeningRetakeResult === 'function') {
            window.showListeningRetakeResult(secondResults);
        }
        else {
            alert('2차 결과 화면을 찾을 수 없습니다.');
        }
    }
}

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.RetakeController = RetakeController;
}
