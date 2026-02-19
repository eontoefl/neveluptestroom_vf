/**
 * Daily2Component - 일상리딩2 컴포넌트
 * 
 * 박스 안에 포함된 요소:
 * - 데이터 로드 (Google Sheets)
 * - 지문 렌더링 (제목, 본문)
 * - 문제/보기 렌더링 (3문제)
 * - 답안 입력 처리
 * - 채점 및 결과 저장
 * - 결과 화면 표시
 * 
 * 박스 밖 (Controller가 관리):
 * - 진행 바 (Question N of N)
 * - Previous/Next/Submit 버튼
 * - 타이머 (Module 전체 타이머 사용)
 * - 다음 세트로 자동 이동
 */

class Daily2Component {
    constructor(setNumber, config = {}) {
        console.log(`📦 [Daily2Component] 생성 - setNumber: ${setNumber}`);
        
        // 박스 내부 변수
        this.setNumber = setNumber;          // 몇 번째 세트인지 (고정값)
        this.currentQuestion = 0;            // 세트 내부 문제 인덱스 (0, 1, 2)
        this.data = null;                    // 전체 데이터
        this.currentSet = null;              // 현재 세트 데이터
        this.answers = {};                   // 이 세트의 답안 { 'q1': 2, 'q2': 3, 'q3': 1 }
        
        // 콜백
        this.onComplete = config.onComplete || null;
        this.onError = config.onError || null;
        
        // DOM 요소 ID
        this.screenId = 'readingDaily2Screen';
        this.mainTitleId = 'daily2MainTitle';
        this.passageTitleId = 'daily2PassageTitle';
        this.passageContentId = 'daily2PassageContent';
        this.questionId = 'daily2Question';
        this.optionsId = 'daily2Options';
    }
    
    /**
     * 초기화 및 데이터 로드
     */
    async init() {
        console.log(`📖 [Daily2Component] 초기화 시작`);
        
        try {
            // 1. 화면 표시
            showScreen(this.screenId);
            
            // 2. 데이터 로드
            this.data = await loadDaily2Data();
            console.log(`✅ 데이터 로드 완료: ${this.data.sets.length}개 세트`);
            
            // 3. 세트 찾기
            const setIndex = this.findSetIndex(this.setNumber);
            if (setIndex === -1) {
                throw new Error(`Set ${this.setNumber}를 찾을 수 없습니다`);
            }
            
            this.currentSet = this.data.sets[setIndex];
            console.log(`✅ Set 로드 완료: ${this.currentSet.id}`);
            console.log(`  - Main Title: ${this.currentSet.mainTitle}`);
            console.log(`  - 문제 개수: ${this.currentSet.questions.length}`);
            
            // 4. UI 렌더링
            this.render();
            
        } catch (error) {
            console.error(`❌ [Daily2Component] 초기화 실패:`, error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * 세트 번호로 인덱스 찾기
     */
    findSetIndex(setNumber) {
        // 🆕 setNumber가 이미 "daily2_set_0001" 형식이면 그대로 사용
        let setId;
        if (typeof setNumber === 'string' && setNumber.startsWith('daily2_set_')) {
            setId = setNumber;
            console.log(`🔍 [findSetIndex] setId 문자열 직접 사용: ${setId}`);
        } else {
            setId = `daily2_set_${String(setNumber).padStart(4, '0')}`;
            console.log(`🔍 [findSetIndex] setNumber ${setNumber} → setId: ${setId}`);
        }
        
        console.log(`  🔍 찾는 Set ID: ${setId}`);
        
        for (let i = 0; i < this.data.sets.length; i++) {
            if (this.data.sets[i].id === setId) {
                console.log(`  ✅ 인덱스 ${i}에서 발견`);
                return i;
            }
        }
        console.error(`  ❌ ${setId}를 찾을 수 없음`);
        return -1;
    }
    
    /**
     * UI 렌더링
     */
    render() {
        console.log(`🎨 [Daily2Component] 렌더링 시작`);
        
        // 1. 메인 타이틀 설정
        document.getElementById(this.mainTitleId).textContent = this.currentSet.mainTitle;
        
        // 2. 지문 렌더링
        this.renderPassage();
        
        // 3. 첫 번째 문제 로드
        this.loadQuestion(0);
    }
    
    /**
     * 지문 렌더링
     */
    renderPassage() {
        const passage = this.currentSet.passage;
        document.getElementById(this.passageTitleId).textContent = passage.title;
        document.getElementById(this.passageContentId).textContent = passage.content;
    }
    
    /**
     * 문제 로드
     */
    loadQuestion(questionIndex) {
        this.currentQuestion = questionIndex;
        const question = this.currentSet.questions[questionIndex];
        
        console.log(`📚 [Daily2Component] 문제 로드: ${questionIndex + 1}/${this.currentSet.questions.length}`);
        
        // 모듈 모드일 때 진행률 업데이트
        if (window.isModuleMode && window.moduleController) {
            window.moduleController.updateCurrentQuestionInComponent(questionIndex);
        }
        
        // 1. 문제 텍스트 표시
        document.getElementById(this.questionId).textContent = question.question;
        
        // 2. 보기 렌더링
        this.renderOptions(question, questionIndex);
    }
    
    /**
     * 보기 렌더링
     */
    renderOptions(question, questionIndex) {
        const container = document.getElementById(this.optionsId);
        container.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            
            // 새 형식: {label, text, translation, explanation} vs 구 형식: 'text'
            if (typeof option === 'object' && option.label) {
                optionDiv.textContent = `${option.label}) ${option.text}`;
            } else {
                optionDiv.textContent = option;
            }
            
            optionDiv.onclick = () => this.selectOption(index + 1);
            
            // 이전 답안 복원
            const savedAnswer = this.answers[`q${questionIndex + 1}`];
            if (savedAnswer === index + 1) {
                optionDiv.classList.add('selected');
            }
            
            container.appendChild(optionDiv);
        });
    }
    
    /**
     * 보기 선택
     */
    selectOption(optionIndex) {
        const questionKey = `q${this.currentQuestion + 1}`;
        
        // 답안 저장
        this.answers[questionKey] = optionIndex;
        console.log(`✅ [Daily2Component] 답안 저장: ${questionKey} = ${optionIndex}`);
        
        // 선택 UI 업데이트
        const options = document.querySelectorAll(`#${this.optionsId} .answer-option`);
        options.forEach((opt, idx) => {
            if (idx + 1 === optionIndex) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
    
    /**
     * 다음 문제로 이동 (세트 내부에서만)
     */
    nextQuestion() {
        if (this.currentQuestion < this.currentSet.questions.length - 1) {
            this.loadQuestion(this.currentQuestion + 1);
            return true;
        }
        return false; // 더 이상 문제 없음
    }
    
    /**
     * 이전 문제로 이동 (세트 내부에서만)
     */
    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.loadQuestion(this.currentQuestion - 1);
            return true;
        }
        return false; // 첫 문제임
    }
    
    /**
     * 현재 문제가 이 세트의 마지막 문제인지 확인
     */
    isLastQuestion() {
        return this.currentQuestion === this.currentSet.questions.length - 1;
    }
    
    /**
     * 현재 문제가 이 세트의 첫 문제인지 확인
     */
    isFirstQuestion() {
        return this.currentQuestion === 0;
    }
    
    /**
     * 제출 (채점 및 결과 저장)
     */
    submit() {
        console.log(`📤 [Daily2Component] 제출 시작`);
        
        // 1. 채점
        const results = this.gradeAnswers();
        
        // 2. sessionStorage에 저장 (이 세트만)
        sessionStorage.setItem(
            `daily2_set_${this.setNumber}`,
            JSON.stringify(results)
        );
        
        console.log(`✅ 채점 완료:`, results);
        
        // 3. 콜백 호출 (Module Controller에 전달)
        if (this.onComplete) {
            this.onComplete(results);
        }
    }
    
    /**
     * 답안 채점
     */
    gradeAnswers() {
        const setResults = {
            type: 'daily2',
            setId: this.currentSet.id,
            setNumber: this.setNumber,
            mainTitle: this.currentSet.mainTitle,
            passage: this.currentSet.passage,
            answers: []
        };
        
        this.currentSet.questions.forEach((question, index) => {
            const questionKey = `q${index + 1}`;
            const userAnswer = this.answers[questionKey];
            const isCorrect = userAnswer === question.correctAnswer;
            
            setResults.answers.push({
                questionNum: question.questionNum || `Q${index + 1}`,
                question: question.question,
                questionTranslation: question.questionTranslation || '',
                options: question.options || [],
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect
            });
        });
        
        return setResults;
    }
    
    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 정리 (메모리 해제)
     */
    cleanup() {
        console.log(`🧹 [Daily2Component] 정리`);
        this.data = null;
        this.currentSet = null;
        this.answers = {};
    }
    
    /**
     * ================================================
     * 2차 풀이 (이중채점) 모드
     * ================================================
     */
    
    /**
     * 2차 풀이 모드로 단일 문제 표시
     * @param {number} questionIndex - 세트 내 문제 인덱스 (0, 1, 2)
     * @param {boolean} wasCorrect - 1차에 맞았는지 여부
     * @param {any} firstAttemptAnswer - 1차 답안 (맞은 경우 정답 표시용)
     */
    async initRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer = null) {
        console.log(`🔄 [Daily2Component] 2차 풀이 모드 - 문제 ${questionIndex}, 1차 결과: ${wasCorrect ? '✅' : '❌'}`);
        console.log(`  📥 firstAttemptAnswer:`, firstAttemptAnswer);
        
        try {
            // 1. 데이터 로드
            if (!this.data) {
                this.data = await loadDaily2Data();
            }
            
            // 2. 세트 찾기
            const setIndex = this.findSetIndex(this.setNumber);
            if (setIndex === -1) {
                throw new Error(`세트를 찾을 수 없습니다: ${this.setNumber}`);
            }
            
            this.currentSet = this.data.sets[setIndex];
            this.currentQuestion = questionIndex;
            
            console.log(`  📊 currentSet.id: ${this.currentSet.id}`);
            console.log(`  📊 currentSet.mainTitle: ${this.currentSet.mainTitle}`);
            console.log(`  📊 선택된 question (index ${questionIndex}):`, this.currentSet.questions[questionIndex]?.question.substring(0, 100));
            
            // 3. 화면 표시
            showScreen(this.screenId);
            
            // 4. 타이머 숨기기
            this.hideTimer();
            
            // 5. mainTitle 설정
            document.getElementById(this.mainTitleId).textContent = this.currentSet.mainTitle;
            console.log(`  ✅ mainTitle 설정: ${this.currentSet.mainTitle}`);
            
            // 6. 지문 렌더링
            this.renderPassage();
            
            // 6. 문제 렌더링 (2차 풀이 모드)
            this.renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer);
            
        } catch (error) {
            console.error('[Daily2Component] 2차 풀이 초기화 실패:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * 2차 풀이 모드로 문제 렌더링
     */
    renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer) {
        console.log(`🎨 [Daily2Component] 2차 풀이 문제 렌더링 - Q${questionIndex + 1}`);
        
        const question = this.currentSet.questions[questionIndex];
        if (!question) {
            console.error(`❌ 문제를 찾을 수 없습니다: index ${questionIndex}`);
            return;
        }
        
        // 1. 문제 텍스트 표시
        const questionEl = document.getElementById(this.questionId);
        questionEl.textContent = question.question;
        
        // 2. 보기 컨테이너 초기화
        const optionsEl = document.getElementById(this.optionsId);
        optionsEl.innerHTML = '';
        
        // 3. 각 보기 렌더링
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            
            const optionIndex = index + 1;
            
            // 2차 풀이: 1차에 맞았으면 정답 표시하고 클릭 불가
            if (wasCorrect && firstAttemptAnswer && firstAttemptAnswer.userAnswer === optionIndex) {
                optionDiv.classList.add('retake-option-correct');
                // 클릭 불가
            } else {
                // 틀렸거나 다른 보기: 클릭 가능
                optionDiv.onclick = () => this.selectOption(optionIndex);
            }
            
            // 보기 텍스트 설정
            const displayText = typeof option === 'object' ? option.text : option;
            optionDiv.textContent = displayText;
            optionDiv.setAttribute('data-value', optionIndex);
            
            optionsEl.appendChild(optionDiv);
        });
        
        console.log(`✅ [Daily2Component] 2차 풀이 렌더링 완료 - ${question.options.length}개 보기`);
    }
    
    /**
     * 타이머와 버튼 숨기기
     */
    hideTimer() {
        console.log('  ⏱️ [Daily2Component] 타이머 및 버튼 숨김 시작');
        
        // ✅ 개별 타이머 숨기기
        const timerEl = document.getElementById('daily2Timer');
        if (timerEl) {
            timerEl.style.display = 'none';
        }
        
        // ✅ ModuleController 타이머도 숨기기
        if (window.moduleController) {
            const moduleTimerEl = document.getElementById('moduleTimer');
            if (moduleTimerEl) {
                moduleTimerEl.style.display = 'none';
            }
            
            // 타이머 정지
            if (window.moduleController.stopTimer) {
                window.moduleController.stopTimer();
            }
        }
        
        // ✅ Previous, Next, Submit 버튼 숨기기
        const prevBtn = document.querySelector('button[onclick*="previousQuestion"]');
        const nextBtn = document.querySelector('button[onclick*="nextQuestion"]');
        const submitBtn = document.querySelector('button[onclick*="submitComponent"]');
        
        if (prevBtn) prevBtn.parentElement.style.display = 'none';
        if (nextBtn) nextBtn.parentElement.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        
        // ✅ 추가 버튼들 숨기기
        const buttonsToHide = [
            '.next-btn',
            '.submit-btn',
            '.timer-section button'
        ];
        
        buttonsToHide.forEach(selector => {
            document.querySelectorAll(selector).forEach(btn => {
                if (btn && btn.parentElement) {
                    btn.parentElement.style.display = 'none';
                }
            });
        });
        
        console.log('  ✅ 타이머 및 버튼 숨김 완료');
    }
    
    /**
     * 2차 답안 가져오기 (RetakeController가 호출)
     */
    getRetakeAnswer() {
        const questionKey = `q${this.currentQuestion + 1}`;
        return this.answers[questionKey] || null;
    }
}

// 전역으로 노출 (기존 코드와 호환성)
window.Daily2Component = Daily2Component;
