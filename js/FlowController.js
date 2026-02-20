/**
 * ================================================
 * FlowController.js (v2)
 * 4개 섹션의 전체 플로우를 관리하는 "지휘자"
 * ================================================
 * 
 * 섹션별 플로우:
 * 
 *   [Reading / Listening / 단어배열(Arrange)]
 *   IDLE → FIRST_ATTEMPT → FIRST_RESULT → RETAKE → RETAKE_RESULT → EXPLAIN → IDLE
 * 
 *   [Email / Discussion]
 *   IDLE → FIRST_ATTEMPT → SECOND_ATTEMPT → EXPLAIN → IDLE
 *   (결과 화면 없이, 1차 작성 후 바로 2차 작성. 2차는 시간제한 없음)
 * 
 *   [Repeat / Interview]
 *   IDLE → FIRST_ATTEMPT → SECOND_ATTEMPT → EXPLAIN → IDLE
 *   (결과 화면 없이, 1차 답변 후 바로 2차 답변. 화면 완전히 동일)
 * 
 * 사용법:
 *   FlowController.start('reading', 1);   // 리딩 모듈 1 시작
 *   FlowController.start('listening', 3); // 리스닝 모듈 3 시작
 *   FlowController.start('writing', 2);   // 라이팅 2 시작
 *   FlowController.start('speaking', 1);  // 스피킹 1 시작
 */

const FlowController = {
    // ========================================
    // 상태
    // ========================================
    state: 'IDLE',
    sectionType: null,      // 'reading', 'listening', 'writing', 'speaking'
    moduleNumber: null,      // 1, 2, 3, ...
    moduleConfig: null,      // module-definitions.js에서 생성된 설정
    
    // 결과 데이터 (단계 간 전달)
    firstAttemptResult: null,
    secondAttemptResult: null,
    retakeResult: null,
    
    // 1차/2차 작성 내용 저장 (라이팅/스피킹용)
    firstAttemptResponses: null,   // 이메일/토론: 1차 작성 텍스트, 스피킹: 1차 녹음
    secondAttemptResponses: null,  // 이메일/토론: 2차 작성 텍스트, 스피킹: 2차 녹음
    
    // 현재 활성 컨트롤러 (cleanup용)
    activeController: null,
    activeRetakeController: null,
    
    // 현재 몇 차 풀이인지 (라이팅/스피킹에서 사용)
    currentAttemptNumber: 1,

    // ========================================
    // 플로우 타입 판별
    // ========================================
    
    /**
     * 이 모듈이 어떤 플로우를 따르는지 판별
     * 
     * 'standard'  = 1차→결과→2차→2차결과→해설 (리딩, 리스닝, 단어배열)
     * 'write'     = 1차작성→2차작성→해설 (이메일, 토론)
     * 'speak'     = 1차답변→2차답변→해설 (따라말하기, 인터뷰)
     */
    getFlowType() {
        if (this.sectionType === 'reading' || this.sectionType === 'listening') {
            return 'standard';
        }
        
        if (this.sectionType === 'writing') {
            // 라이팅은 컴포넌트 구성을 확인해야 함
            // 단어배열(arrange)만 있으면 standard, 이메일/토론이 포함되면 write
            const hasArrangeOnly = this.moduleConfig.components.every(c => c.type === 'arrange');
            if (hasArrangeOnly) return 'standard';
            
            // 라이팅 모듈은 arrange + email + discussion 혼합
            // 이 경우 전체를 'writing_mixed'로 처리
            return 'writing_mixed';
        }
        
        if (this.sectionType === 'speaking') {
            return 'speak';
        }
        
        return 'standard'; // 기본값
    },

    // ========================================
    // ★ 유일한 진입점: 모듈 시작
    // ========================================
    start(sectionType, moduleNumber) {
        console.log('='.repeat(80));
        console.log(`🚀 [FlowController] ${sectionType} Module ${moduleNumber} 시작`);
        console.log('='.repeat(80));
        
        // 이전 상태 정리
        this.cleanup();
        
        // 상태 설정
        this.sectionType = sectionType;
        this.moduleNumber = moduleNumber;
        this.moduleConfig = getModule(sectionType, moduleNumber);
        this.currentAttemptNumber = 1;
        
        if (!this.moduleConfig) {
            console.error('❌ [FlowController] 모듈 설정을 찾을 수 없습니다:', sectionType, moduleNumber);
            alert('모듈을 찾을 수 없습니다.');
            return;
        }
        
        // 모듈 정보 출력
        if (typeof printModuleInfo === 'function') {
            printModuleInfo(this.moduleConfig);
        }
        
        // 플로우 타입 확인
        const flowType = this.getFlowType();
        console.log(`📋 [FlowController] 플로우 타입: ${flowType}`);
        
        // ★ writing_mixed는 WritingFlow로 위임
        if (flowType === 'writing_mixed' && window.WritingFlow) {
            console.log('✏️ [FlowController] writing_mixed → WritingFlow로 위임');
            WritingFlow.start(moduleNumber, this.moduleConfig);
            return;
        }
        
        // 1단계: 1차 풀이/작성/답변 시작
        this.startFirstAttempt();
    },

    // ========================================
    // 1단계: 1차 풀이/작성/답변
    // ========================================
    startFirstAttempt() {
        this.state = 'FIRST_ATTEMPT';
        this.currentAttemptNumber = 1;
        console.log('📝 [FlowController] 1차 풀이 시작');
        
        // 기존 ModuleController 사용 (모든 섹션 공통)
        const controller = new ModuleController(this.moduleConfig);
        this.activeController = controller;
        
        controller.setOnComplete((result) => {
            console.log('✅ [FlowController] 1차 풀이 완료');
            this.firstAttemptResult = result;
            
            // 1차 작성 내용 저장 (라이팅/스피킹용)
            this.firstAttemptResponses = this.collectResponses(result);
            
            // 플로우 타입에 따라 다음 단계 결정
            this.afterFirstAttempt();
        });
        
        controller.startModule();
    },
    
    /**
     * 1차 완료 후 다음 단계 분기
     */
    afterFirstAttempt() {
        const flowType = this.getFlowType();
        
        switch (flowType) {
            case 'standard':
                // 리딩/리스닝/단어배열만: 1차 결과 화면으로
                console.log('📊 [FlowController] standard 플로우 → 1차 결과 화면');
                this.showFirstResult();
                break;
                
            case 'writing_mixed':
                // 라이팅 혼합 (arrange + email/discussion)
                // arrange 부분은 결과→2차 풀이, email/discussion 부분은 바로 2차
                // ★ 간단하게: 전체를 standard로 처리하되, email/discussion은 2차에서 "시간제한 없이 다시 작성"
                console.log('📊 [FlowController] writing_mixed 플로우 → 1차 결과 화면');
                this.showFirstResult();
                break;
                
            case 'speak':
                // 스피킹: 결과 없이 바로 2차 답변
                console.log('🔄 [FlowController] speak 플로우 → 바로 2차 답변');
                this.startSecondAttempt();
                break;
                
            default:
                this.showFirstResult();
        }
    },

    // ========================================
    // 2단계: 1차 결과 화면 (standard/writing_mixed 전용)
    // ========================================
    showFirstResult() {
        this.state = 'FIRST_RESULT';
        console.log('📊 [FlowController] 1차 결과 화면 표시');
        
        // ★ 라이팅: arrange 결과만 직접 표시
        if (this.sectionType === 'writing') {
            this.showWritingResult('first');
            return;
        }
        
        // 리딩/리스닝: 기존 ResultController 사용
        const resultController = new ResultController(this.firstAttemptResult);
        
        // ★ startRetake를 FlowController로 연결
        resultController.startRetake = () => {
            console.log('🔄 [FlowController] ResultController → FlowController로 Retake 위임');
            
            const flowType = this.getFlowType();
            if (flowType === 'writing_mixed') {
                this.startSecondAttempt();
            } else {
                this.startRetake();
            }
        };
        
        // ★ showExplanations를 FlowController로 연결 (만점일 때)
        resultController.showExplanations = () => {
            console.log('📖 [FlowController] ResultController → FlowController로 해설 위임');
            this.showExplain();
        };
        
        resultController.show();
    },
    
    // ========================================
    // 라이팅 결과 화면 (arrange 결과만 + 안내 문구)
    // ========================================
    showWritingResult(attempt) {
        console.log(`📊 [FlowController] 라이팅 ${attempt === 'first' ? '1차' : '2차'} 결과 화면`);
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // arrange 결과 화면이 있으면 사용
        const arrangeResultScreen = document.getElementById('writingArrangeResultScreen');
        if (arrangeResultScreen) {
            arrangeResultScreen.style.display = 'block';
            
            // 어댑터의 showArrangeResult 함수 호출
            if (typeof window.showArrangeResult === 'function') {
                window.showArrangeResult();
            }
            
            // ★ 결과 화면에서는 해설 숨기기 (1차/2차 결과용)
            setTimeout(() => {
                const explanations = arrangeResultScreen.querySelectorAll(
                    '.arrange-explanation-section, .arrange-explanation-title, .arrange-explanation-text'
                );
                explanations.forEach(el => {
                    el.style.display = 'none';
                });
                console.log(`🔒 [FlowController] 해설 숨김 처리 완료 (${explanations.length}개 요소)`);
            }, 100);
        }
        
        // "이메일/토론은 채점 없음" 안내 추가
        let noticeEl = document.getElementById('writingResultNotice');
        if (!noticeEl) {
            noticeEl = document.createElement('div');
            noticeEl.id = 'writingResultNotice';
            noticeEl.style.cssText = 'text-align:center; padding:16px; margin:16px; background:#FFF3CD; border-radius:8px; color:#856404; font-size:14px;';
            const resultDetails = document.getElementById('arrangeResultDetails');
            if (resultDetails) {
                resultDetails.parentNode.insertBefore(noticeEl, resultDetails.nextSibling);
            }
        }
        noticeEl.innerHTML = `
            <p style="margin:0;">📝 이메일 작성과 토론형 글쓰기는 채점 없이 진행됩니다.</p>
            <p style="margin:4px 0 0 0; font-size:12px;">해설 화면에서 모범답안을 확인할 수 있습니다.</p>
        `;
        
        // 기존 "학습 일정" 버튼을 "2차 풀이 시작"으로 교체
        let retakeBtn = document.getElementById('writingRetakeBtn');
        if (!retakeBtn) {
            retakeBtn = document.createElement('button');
            retakeBtn.id = 'writingRetakeBtn';
            retakeBtn.style.cssText = 'display:block; margin:20px auto; padding:14px 40px; font-size:16px; background:#4A90D9; color:white; border:none; border-radius:8px; cursor:pointer;';
            if (noticeEl) {
                noticeEl.parentNode.insertBefore(retakeBtn, noticeEl.nextSibling);
            }
        }
        
        if (attempt === 'first') {
            retakeBtn.textContent = '2차 풀이 시작';
            retakeBtn.onclick = () => {
                console.log('🔄 [FlowController] 라이팅 2차 시작');
                this.startSecondAttempt();
            };
        } else {
            retakeBtn.textContent = '해설 보기';
            retakeBtn.onclick = () => {
                console.log('📖 [FlowController] 라이팅 해설 시작');
                this.showExplain();
            };
        }
    },

    // ========================================
    // 3a단계: 2차 풀이 - 리딩/리스닝 (틀린 문제 다시 풀기)
    // ========================================
    startRetake() {
        this.state = 'RETAKE';
        console.log('🔄 [FlowController] 2차 풀이 시작 (Retake)');
        
        // 기존 RetakeController 사용
        const retakeController = new RetakeController(this.sectionType, this.firstAttemptResult);
        this.activeRetakeController = retakeController;
        window.retakeController = retakeController;
        
        // ★ RetakeController의 showSecondResultScreen을 오버라이드
        retakeController.showSecondResultScreen = (secondResults) => {
            console.log('📊 [FlowController] RetakeController → FlowController로 2차 결과 위임');
            this.retakeResult = secondResults;
            this.showRetakeResult(secondResults);
        };
        
        retakeController.start();
    },
    
    // ========================================
    // 3b단계: 2차 작성/답변 - 라이팅(이메일,토론)/스피킹
    // ========================================
    startSecondAttempt() {
        this.state = 'SECOND_ATTEMPT';
        this.currentAttemptNumber = 2;
        console.log('🔄 [FlowController] 2차 작성/답변 시작');
        
        // ★ 핵심: 같은 모듈을 한 번 더 실행하되, 2차임을 표시
        // ModuleController에 2차 모드 정보를 전달
        
        // 2차용 모듈 설정 복사
        const secondConfig = JSON.parse(JSON.stringify(this.moduleConfig));
        
        // 2차 모드 표시 (컴포넌트에서 활용 가능)
        secondConfig.isSecondAttempt = true;
        secondConfig.attemptNumber = 2;
        
        // 라이팅 이메일/토론: 2차는 시간제한 없음
        if (this.sectionType === 'writing') {
            secondConfig.timeLimit = null; // 시간제한 제거
            secondConfig.components.forEach(comp => {
                if (comp.type === 'email' || comp.type === 'discussion') {
                    comp.noTimeLimit = true; // 개별 컴포넌트에도 표시
                }
            });
            console.log('⏰ [FlowController] 라이팅 2차: 시간제한 해제');
        }
        
        // 스피킹: 2차는 1차와 완전히 동일
        if (this.sectionType === 'speaking') {
            console.log('🎤 [FlowController] 스피킹 2차: 1차와 동일한 화면');
        }
        
        // 전역으로 현재 차수 표시 (컴포넌트에서 참조 가능)
        window.currentAttemptNumber = 2;
        window.isSecondAttempt = true;
        
        const controller = new ModuleController(secondConfig);
        this.activeController = controller;
        
        controller.setOnComplete((result) => {
            console.log('✅ [FlowController] 2차 작성/답변 완료');
            this.secondAttemptResult = result;
            
            // 2차 작성 내용 저장
            this.secondAttemptResponses = this.collectResponses(result);
            
            // 전역 상태 초기화
            window.currentAttemptNumber = 1;
            window.isSecondAttempt = false;
            
            // 라이팅: 2차 결과 화면 먼저 표시
            if (this.sectionType === 'writing') {
                this.showWritingResult('second');
            } else {
                // 스피킹: 바로 해설 화면으로
                this.showExplain();
            }
        });
        
        controller.startModule();
    },

    // ========================================
    // 4단계: 2차 결과 화면 (리딩/리스닝 전용, 1차 vs 2차 비교)
    // ========================================
    showRetakeResult(secondResults) {
        this.state = 'RETAKE_RESULT';
        console.log('📊 [FlowController] 2차 결과 화면 표시');
        
        // ★ 리딩/리스닝: 2차 결과 = 해설이 합쳐진 구조이므로 여기서 오답노트 표시
        if (typeof ErrorNote !== 'undefined') {
            ErrorNote.show(this.sectionType, this.moduleNumber);
        }
        
        // 기존 retake-result 함수들을 그대로 사용
        if (this.sectionType === 'reading' && typeof window.showReadingRetakeResult === 'function') {
            window.showReadingRetakeResult(secondResults);
        } else if (this.sectionType === 'listening' && typeof window.showListeningRetakeResult === 'function') {
            window.showListeningRetakeResult(secondResults);
        } else {
            console.error('❌ [FlowController] 2차 결과 화면 함수를 찾을 수 없습니다');
            // 결과 화면을 못 찾으면 바로 해설로
            this.showExplain();
            return;
        }
        
        // "해설 보기" 버튼 연결
        this.attachExplainButton();
    },

    // ========================================
    // 5단계: 최종 해설 화면
    // ========================================
    showExplain() {
        this.state = 'EXPLAIN';
        console.log('📖 [FlowController] 최종 해설 화면 표시');
        
        // ★ 오답노트 플로팅 UI 표시
        if (typeof ErrorNote !== 'undefined') {
            ErrorNote.show(this.sectionType, this.moduleNumber);
        }
        
        // 해설 화면에 전달할 데이터 준비
        const explainData = {
            sectionType: this.sectionType,
            moduleNumber: this.moduleNumber,
            moduleConfig: this.moduleConfig,
            firstAttemptResult: this.firstAttemptResult,
            secondAttemptResult: this.secondAttemptResult,
            retakeResult: this.retakeResult,
            firstAttemptResponses: this.firstAttemptResponses,
            secondAttemptResponses: this.secondAttemptResponses
        };
        
        // 전역으로 저장 (해설 화면에서 접근 가능)
        window.flowExplainData = explainData;
        
        // ★ 섹션별로 다른 해설 화면 호출
        if (this.sectionType === 'reading' || this.sectionType === 'listening') {
            // 리딩/리스닝: 기존 final-explain-screen.js 사용
            if (typeof window.showFinalExplainScreen === 'function') {
                window.showFinalExplainScreen(this.firstAttemptResult, this.retakeResult);
            } else {
                console.warn('⚠️ [FlowController] 해설 화면 함수가 없습니다.');
                this.showCompletionScreen();
            }
        } else if (this.sectionType === 'speaking') {
            // 스피킹: 따라말하기 복습 → 인터뷰 복습 순서로 표시
            console.log('🎤 [FlowController] 스피킹 해설 화면 시작');
            this.showSpeakingExplain();
        } else if (this.sectionType === 'writing') {
            // 라이팅: arrange 해설 → email 해설 → discussion 해설
            console.log('✏️ [FlowController] 라이팅 해설 화면 시작');
            this.showWritingExplain();
        } else {
            this.showCompletionScreen();
        }
    },
    
    // ========================================
    // 스피킹 해설 화면 (따라말하기 복습 → 인터뷰 복습)
    // ========================================
    showSpeakingExplain() {
        console.log('🎤 [FlowController] 스피킹 해설: 따라말하기 복습 시작');
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // 1. 따라말하기 복습 화면 표시
        const repeatResultScreen = document.getElementById('speakingRepeatResultScreen');
        if (repeatResultScreen && window.currentRepeatComponent) {
            repeatResultScreen.style.display = 'block';
            
            // RepeatComponent의 showRepeatResult 호출
            const set = window.currentRepeatComponent.speakingRepeatData?.sets?.[0];
            if (set) {
                window.currentRepeatComponent.showRepeatResult({ set: set });
            }
            
            // ★ 따라말하기 복습의 "완료" 버튼을 인터뷰 복습으로 연결
            const originalCompleteRepeatResult = window.currentRepeatComponent.completeRepeatResult.bind(window.currentRepeatComponent);
            window.currentRepeatComponent.completeRepeatResult = () => {
                console.log('🎤 [FlowController] 따라말하기 복습 완료 → 인터뷰 복습으로');
                originalCompleteRepeatResult();
                this.showInterviewExplain();
            };
        } else {
            // 따라말하기 컴포넌트가 없으면 바로 인터뷰 복습으로
            console.warn('⚠️ [FlowController] 따라말하기 컴포넌트 없음, 인터뷰 복습으로 이동');
            this.showInterviewExplain();
        }
    },
    
    // ========================================
    // 인터뷰 해설 화면
    // ========================================
    showInterviewExplain() {
        console.log('🎙️ [FlowController] 인터뷰 복습 시작');
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // 인터뷰 복습 화면 표시
        const interviewResultScreen = document.getElementById('speakingInterviewResultScreen');
        if (interviewResultScreen && window.currentInterviewComponent) {
            interviewResultScreen.style.display = 'block';
            
            // InterviewComponent의 showInterviewResult 호출
            if (typeof window.currentInterviewComponent.showInterviewResult === 'function') {
                // 인터뷰 데이터에서 현재 세트 가져오기
                const interviewData = window.currentInterviewComponent.speakingInterviewData;
                const currentSet = window.currentInterviewComponent.currentInterviewSet || 0;
                const set = interviewData?.sets?.[currentSet];
                
                if (set) {
                    window.currentInterviewComponent.showInterviewResult({ set: set });
                } else {
                    console.warn('⚠️ [FlowController] 인터뷰 세트 데이터 없음');
                    window.currentInterviewComponent.showInterviewResult({ set: interviewData?.sets?.[0] });
                }
            } else if (typeof window.currentInterviewComponent.renderInterviewResult === 'function') {
                window.currentInterviewComponent.renderInterviewResult();
            }
            
            // ★ 인터뷰 복습의 "완료"/"학습 일정" 버튼을 FlowController.finish()로 연결
            setTimeout(() => {
                // 결과 화면의 backToSchedule 버튼을 FlowController로 연결
                const backBtns = interviewResultScreen.querySelectorAll(
                    '.btn-back-to-schedule, [onclick*="backToSchedule"]'
                );
                backBtns.forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        console.log('🏠 [FlowController] 인터뷰 복습 완료 → 스케줄로');
                        this.finish();
                    };
                });
                
                // completeInterviewResult 함수도 연결
                if (window.currentInterviewComponent) {
                    const originalComplete = window.currentInterviewComponent.completeInterviewResult;
                    window.currentInterviewComponent.completeInterviewResult = () => {
                        console.log('🏠 [FlowController] 인터뷰 복습 완료 → 스케줄로');
                        if (originalComplete) originalComplete.call(window.currentInterviewComponent);
                        this.finish();
                    };
                }
            }, 500);
        } else {
            // 인터뷰 컴포넌트가 없으면 완료 화면
            console.warn('⚠️ [FlowController] 인터뷰 컴포넌트 없음, 완료 화면 표시');
            this.showCompletionScreen();
        }
    },
    
    // ========================================
    // 라이팅 해설 화면 (arrange해설 → email해설 → discussion해설)
    // ========================================
    showWritingExplain() {
        console.log('✏️ [FlowController] 라이팅 해설: 단어배열 해설 시작');
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // 1단계: 단어배열 해설 (writingArrangeResultScreen)
        const arrangeResultScreen = document.getElementById('writingArrangeResultScreen');
        if (arrangeResultScreen) {
            arrangeResultScreen.style.display = 'block';
            
            if (typeof window.showArrangeResult === 'function') {
                window.showArrangeResult();
            }
            
            // ★ 해설 화면에서는 해설 다시 표시
            setTimeout(() => {
                const explanations = arrangeResultScreen.querySelectorAll(
                    '.arrange-explanation-section, .arrange-explanation-title, .arrange-explanation-text'
                );
                explanations.forEach(el => {
                    el.style.display = '';  // 숨김 해제
                });
                console.log(`📖 [FlowController] 해설 표시 (${explanations.length}개 요소)`);
            }, 100);
            
            // 기존 버튼들을 "다음: 이메일 해설"로 교체
            let nextBtn = document.getElementById('writingExplainNextBtn');
            if (!nextBtn) {
                nextBtn = document.createElement('button');
                nextBtn.id = 'writingExplainNextBtn';
                nextBtn.style.cssText = 'display:block; margin:20px auto; padding:14px 40px; font-size:16px; background:#4A90D9; color:white; border:none; border-radius:8px; cursor:pointer;';
                arrangeResultScreen.querySelector('.test-content')?.appendChild(nextBtn);
            }
            nextBtn.textContent = '다음: 이메일 해설 보기';
            nextBtn.onclick = () => {
                this.showEmailExplain();
            };
        } else {
            this.showEmailExplain();
        }
    },
    
    showEmailExplain() {
        console.log('✏️ [FlowController] 이메일 해설 시작');
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        const emailResultScreen = document.getElementById('writingEmailResultScreen');
        if (emailResultScreen) {
            emailResultScreen.style.display = 'block';
            
            // ★ componentResults에서 이메일 데이터 가져오기
            const emailData = this.getEmailDataFromResults();
            
            // showEmailResult 호출 (데이터 전달)
            if (typeof window.showEmailResult === 'function') {
                try {
                    if (emailData) {
                        window.showEmailResult(emailData);
                    } else {
                        console.warn('⚠️ 이메일 해설 데이터 없음');
                        window.showEmailResult();
                    }
                } catch(e) {
                    console.error('❌ 이메일 해설 표시 실패:', e);
                }
            }
            
            // 기존 backToSchedule 버튼을 "다음: 토론 해설"로 연결
            setTimeout(() => {
                const backBtns = emailResultScreen.querySelectorAll(
                    '.btn-back-to-schedule, [onclick*="backToSchedule"]'
                );
                backBtns.forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        this.showDiscussionExplain();
                    };
                });
                
                // 또는 별도 버튼 추가
                let nextBtn = document.getElementById('emailExplainNextBtn');
                if (!nextBtn) {
                    nextBtn = document.createElement('button');
                    nextBtn.id = 'emailExplainNextBtn';
                    nextBtn.style.cssText = 'display:block; margin:20px auto; padding:14px 40px; font-size:16px; background:#4A90D9; color:white; border:none; border-radius:8px; cursor:pointer;';
                    emailResultScreen.querySelector('.test-content')?.appendChild(nextBtn);
                }
                nextBtn.textContent = '다음: 토론 해설 보기';
                nextBtn.onclick = () => {
                    this.showDiscussionExplain();
                };
            }, 300);
        } else {
            this.showDiscussionExplain();
        }
    },
    
    showDiscussionExplain() {
        console.log('✏️ [FlowController] 토론 해설 시작');
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        const discussionResultScreen = document.getElementById('writingDiscussionResultScreen');
        if (discussionResultScreen) {
            discussionResultScreen.style.display = 'block';
            
            // ★ componentResults에서 토론 데이터 가져오기
            const discussionData = this.getDiscussionDataFromResults();
            
            if (typeof window.showDiscussionResult === 'function') {
                try {
                    if (discussionData) {
                        window.showDiscussionResult(discussionData);
                    } else {
                        console.warn('⚠️ 토론 해설 데이터 없음');
                        window.showDiscussionResult();
                    }
                } catch(e) {
                    console.error('❌ 토론 해설 표시 실패:', e);
                }
            }
            
            // backToSchedule 버튼을 FlowController.finish()로 연결
            setTimeout(() => {
                const backBtns = discussionResultScreen.querySelectorAll(
                    '.btn-back-to-schedule, [onclick*="backToSchedule"]'
                );
                backBtns.forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        this.finish();
                    };
                });
                
                // 완료 버튼 추가
                let finishBtn = document.getElementById('discussionExplainFinishBtn');
                if (!finishBtn) {
                    finishBtn = document.createElement('button');
                    finishBtn.id = 'discussionExplainFinishBtn';
                    finishBtn.style.cssText = 'display:block; margin:20px auto; padding:14px 40px; font-size:16px; background:#4A90D9; color:white; border:none; border-radius:8px; cursor:pointer;';
                    discussionResultScreen.querySelector('.test-content')?.appendChild(finishBtn);
                }
                finishBtn.textContent = '학습 일정으로 돌아가기';
                finishBtn.onclick = () => {
                    this.finish();
                };
            }, 300);
        } else {
            this.finish();
        }
    },
    
    // ========================================
    // 이메일/토론 데이터 추출 헬퍼
    // ========================================
    getEmailDataFromResults() {
        // 1차 또는 2차 결과에서 이메일 컴포넌트 데이터 찾기
        const results = this.secondAttemptResult || this.firstAttemptResult;
        if (!results || !results.componentResults) return null;
        
        const emailComponent = results.componentResults.find(c => c.componentType === 'email');
        return emailComponent || null;
    },
    
    getDiscussionDataFromResults() {
        // 1차 또는 2차 결과에서 토론 컴포넌트 데이터 찾기
        const results = this.secondAttemptResult || this.firstAttemptResult;
        if (!results || !results.componentResults) return null;
        
        const discussionComponent = results.componentResults.find(c => c.componentType === 'discussion');
        return discussionComponent || null;
    },
    
    // ========================================
    // 완료 화면 (라이팅/스피킹용 임시 + 해설 없을 때 대체)
    // ========================================
    showCompletionScreen() {
        console.log('🎉 [FlowController] 완료 화면 표시');
        
        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // 완료 화면이 있으면 사용, 없으면 생성
        let completionScreen = document.getElementById('flowCompletionScreen');
        
        if (!completionScreen) {
            completionScreen = document.createElement('div');
            completionScreen.id = 'flowCompletionScreen';
            completionScreen.className = 'screen';
            completionScreen.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; 
                            min-height:100vh; padding:40px; text-align:center; background:#f8f9fa;">
                    <div style="font-size:60px; margin-bottom:20px;">🎉</div>
                    <h1 id="completionTitle" style="font-size:24px; color:#333; margin-bottom:12px;"></h1>
                    <p id="completionSubtitle" style="font-size:16px; color:#666; margin-bottom:8px;"></p>
                    <p id="completionDetail" style="font-size:14px; color:#999; margin-bottom:30px;"></p>
                    <button onclick="FlowController.finish()" 
                            style="padding:14px 40px; font-size:16px; background:#4A90D9; color:white; 
                                   border:none; border-radius:8px; cursor:pointer;">
                        학습 일정으로 돌아가기
                    </button>
                </div>
            `;
            document.body.appendChild(completionScreen);
        }
        
        // 내용 채우기
        const moduleName = this.moduleConfig ? this.moduleConfig.moduleName : '';
        const sectionLabel = {
            'reading': '리딩', 'listening': '리스닝', 
            'writing': '라이팅', 'speaking': '스피킹'
        }[this.sectionType] || '';
        
        document.getElementById('completionTitle').textContent = 
            `${moduleName} 완료!`;
        document.getElementById('completionSubtitle').textContent = 
            `${sectionLabel} 1차와 2차를 모두 마쳤습니다.`;
        document.getElementById('completionDetail').textContent = 
            '(해설 화면은 추후 업데이트 예정입니다)';
        
        completionScreen.style.display = 'block';
    },

    // ========================================
    // 종료: 스케줄 화면으로 복귀
    // ========================================
    finish() {
        console.log('🏠 [FlowController] 종료 → 스케줄 화면으로');
        
        // ★ 오답노트 패널 정리
        if (typeof ErrorNote !== 'undefined') {
            ErrorNote.hide();
        }
        
        this.cleanup();
        
        if (typeof backToSchedule === 'function') {
            backToSchedule();
        }
    },

    // ========================================
    // 응답 데이터 수집 (라이팅/스피킹용)
    // ========================================
    collectResponses(result) {
        if (!result || !result.componentResults) return null;
        
        const responses = {};
        
        result.componentResults.forEach((comp, index) => {
            const type = comp.componentType;
            
            if (type === 'email' || type === 'discussion') {
                // 라이팅: 학생이 작성한 텍스트
                responses[`${type}_${index}`] = {
                    type: type,
                    text: comp.responseText || comp.userAnswer || '',
                    wordCount: comp.wordCount || 0,
                    timeSpent: comp.timeSpent || 0
                };
            } else if (type === 'repeat' || type === 'interview') {
                // 스피킹: 녹음 데이터
                responses[`${type}_${index}`] = {
                    type: type,
                    audioUrl: comp.audioUrl || '',
                    timeSpent: comp.timeSpent || 0
                };
            }
        });
        
        return Object.keys(responses).length > 0 ? responses : null;
    },

    // ========================================
    // 정리 (Cleanup)
    // ========================================
    cleanup() {
        console.log('🧹 [FlowController] 상태 초기화');
        
        // ModuleController 정리
        if (this.activeController && this.activeController.cleanup) {
            this.activeController.cleanup();
        }
        
        // RetakeController 정리
        if (this.activeRetakeController) {
            const floatingUI = document.getElementById('retakeFloatingUI');
            if (floatingUI) floatingUI.remove();
        }
        
        // 상태 초기화
        this.state = 'IDLE';
        this.firstAttemptResult = null;
        this.secondAttemptResult = null;
        this.retakeResult = null;
        this.firstAttemptResponses = null;
        this.secondAttemptResponses = null;
        this.activeController = null;
        this.activeRetakeController = null;
        this.currentAttemptNumber = 1;
        window.retakeController = null;
        window.currentAttemptNumber = 1;
        window.isSecondAttempt = false;
        window.flowExplainData = null;
    },

    // ========================================
    // 유틸리티: 해설 버튼 연결
    // ========================================
    attachExplainButton() {
        setTimeout(() => {
            const explainButtons = document.querySelectorAll(
                '#readingRetakeResultScreen .btn-explain, ' +
                '#listeningRetakeResultScreen .btn-explain, ' +
                '[data-action="show-explain"]'
            );
            
            explainButtons.forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.showExplain();
                };
                console.log('🔗 [FlowController] 해설 버튼 연결 완료');
            });
            
            const backButtons = document.querySelectorAll(
                '#readingRetakeResultScreen .btn-back, ' +
                '#listeningRetakeResultScreen .btn-back, ' +
                '[data-action="back-to-schedule"]'
            );
            
            backButtons.forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.finish();
                };
                console.log('🔗 [FlowController] 돌아가기 버튼 연결 완료');
            });
        }, 300);
    },

    // ========================================
    // 현재 상태 확인 (디버깅용)
    // ========================================
    getStatus() {
        return {
            state: this.state,
            sectionType: this.sectionType,
            moduleNumber: this.moduleNumber,
            flowType: this.moduleConfig ? this.getFlowType() : 'unknown',
            currentAttemptNumber: this.currentAttemptNumber,
            hasFirstResult: !!this.firstAttemptResult,
            hasSecondResult: !!this.secondAttemptResult,
            hasRetakeResult: !!this.retakeResult,
            hasFirstResponses: !!this.firstAttemptResponses,
            hasSecondResponses: !!this.secondAttemptResponses
        };
    }
};

// ========================================
// 전역으로 노출
// ========================================
if (typeof window !== 'undefined') {
    window.FlowController = FlowController;
    
    // ★ 기존 함수들을 FlowController로 대체
    window.startReadingModule = function(moduleNum) {
        FlowController.start('reading', moduleNum);
    };
    
    window.startListeningModule = function(moduleNum) {
        FlowController.start('listening', moduleNum);
    };
    
    window.startWriting = function(number) {
        FlowController.start('writing', number);
    };
    
    window.startSpeaking = function(number) {
        FlowController.start('speaking', number);
    };
    
    console.log('✅ FlowController.js v2 로드 완료');
    console.log('   - startReadingModule() → FlowController (standard 플로우)');
    console.log('   - startListeningModule() → FlowController (standard 플로우)');
    console.log('   - startWriting() → FlowController (writing_mixed 플로우)');
    console.log('   - startSpeaking() → FlowController (speak 플로우)');
}
