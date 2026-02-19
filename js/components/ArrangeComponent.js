/**
 * ArrangeComponent.js
 * 라이팅 - 단어배열 (Build a Sentence) 컴포넌트
 * v=001
 * 
 * 특징:
 * - 대화형 UI (두 사람 프로필 + 문장)
 * - 드래그 & 드롭으로 빈칸 채우기
 * - 남녀 랜덤 조합 (남남/여여 불가)
 * - 첫 번째 빈칸 자동 대문자 변환
 * - 6분 50초 타이머 (410초)
 */

class ArrangeComponent {
    constructor(setNumber, onComplete) {
        console.log(`[ArrangeComponent] 생성 - setNumber: ${setNumber}`);
        
        this.setNumber = setNumber;
        
        // onComplete 콜백 처리 (함수 또는 객체 형태 지원)
        if (typeof onComplete === 'function') {
            this.onComplete = onComplete;
        } else if (onComplete && typeof onComplete.onComplete === 'function') {
            this.onComplete = onComplete.onComplete;
            this.onError = onComplete.onError;
        } else {
            this.onComplete = null;
        }
        
        // 내부 상태
        this.currentQuestion = 0;
        this.answers = {}; // 문제별 답안 저장
        this.data = null;
        this.currentSetData = null;
        this.profilePairs = {}; // 문제별 프로필 이미지 저장
        this.draggedWord = null; // 현재 드래그 중인 단어
        
        // 타이머 설정
        this.TIME_LIMIT = 410; // 6분 50초
        
        // 구글 시트 설정
        this.SHEET_CONFIG = {
            spreadsheetId: '1Na3AmaqNeE2a3gcq7koj0TF2jGZhS7m8PFuk2S8rRfo',
            gid: '0'
        };
        
        // 프로필 이미지 (여자 7개, 남자 7개)
        this.FEMALE_IMAGES = [
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F1.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F2.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F3.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F4.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F5.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F6.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_F7.png'
        ];
        
        this.MALE_IMAGES = [
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M1.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M2.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M3.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M4.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M5.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M6.png',
            'https://eontoefl.github.io/toefl-audio/writing/arrange/image/arrange_image_M7.png'
        ];
    }
    
    /**
     * 컴포넌트 초기화
     */
    async init() {
        console.log('[ArrangeComponent] 초기화 시작');
        
        try {
            // 1. 데이터 로드
            await this.loadData();
            
            // 2. 세트 찾기
            const setId = `arrange_set_${String(this.setNumber).padStart(4, '0')}`;
            console.log(`[ArrangeComponent] 세트 검색 - ID: ${setId}`);
            
            const setIndex = this.findSetIndex(setId);
            if (setIndex === -1) {
                throw new Error(`세트를 찾을 수 없습니다: ${setId}`);
            }
            
            this.currentSetData = this.data.sets[setIndex];
            console.log('[ArrangeComponent] 세트 데이터 로드 완료:', this.currentSetData);
            
            // 3. 첫 번째 문제 로드
            this.loadQuestion(0);
            
            // 4. 화면 표시
            if (typeof window.showScreen === 'function') {
                window.showScreen('writingArrangeScreen');
            }
            
        } catch (error) {
            console.error('[ArrangeComponent] 초기화 실패:', error);
            alert('단어배열 데이터를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * 데이터 로드
     */
    async loadData() {
        console.log('[ArrangeComponent] 데이터 로드 시작');
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.SHEET_CONFIG.gid}`;
        console.log('[ArrangeComponent] CSV URL:', csvUrl);
        
        try {
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            console.log(`[ArrangeComponent] CSV 다운로드 완료 (${csvText.length} bytes)`);
            
            this.data = this.parseCSV(csvText);
            console.log('[ArrangeComponent] 파싱 완료:', this.data);
            
            if (!this.data || !this.data.sets || this.data.sets.length === 0) {
                throw new Error('데이터가 비어있습니다');
            }
            
        } catch (error) {
            console.error('[ArrangeComponent] 데이터 로드 실패, 데모 데이터 사용:', error);
            this.data = this.getDemoData();
        }
    }
    
    /**
     * CSV 파싱 (12개 컬럼)
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log(`[ArrangeComponent] CSV 라인 수: ${lines.length}`);
        
        const sets = {};
        
        // 헤더 제외 (1부터 시작)
        for (let i = 1; i < lines.length; i++) {
            const columns = this.parseCSVLine(lines[i]);
            
            if (columns.length < 12) {
                console.warn(`[ArrangeComponent] 라인 ${i} 스킵 (컬럼 부족: ${columns.length}/12)`);
                continue;
            }
            
            const setId = columns[0].trim();
            const questionNum = parseInt(columns[1]) || 1;
            const givenSentence = columns[2].trim();
            const givenTranslation = columns[3].trim();
            const correctAnswer = columns[4].split('|'); // "Which|store|has|the best|deals"
            const correctTranslation = columns[5].trim();
            const presentedWords = columns[6].split('|'); // "Which|_|_|_|_"
            const optionWords = columns[7].split('|'); // "has|the best|which|store|deals|laptop|good"
            const endPunctuation = columns[8] || '.';
            const explanation = columns[9] || '';
            const week = columns[10] || 'Week 1';
            const day = columns[11] || '월';
            
            console.log(`[ArrangeComponent] 세트 파싱: ${setId} - Q${questionNum}`);
            
            // 세트별로 그룹화
            if (!sets[setId]) {
                sets[setId] = {
                    setId: setId,
                    week: week,
                    day: day,
                    questions: []
                };
            }
            
            sets[setId].questions.push({
                questionNum: questionNum,
                givenSentence: givenSentence,
                givenTranslation: givenTranslation,
                correctAnswer: correctAnswer,
                correctTranslation: correctTranslation,
                presentedWords: presentedWords,
                optionWords: optionWords,
                endPunctuation: endPunctuation,
                explanation: explanation
            });
        }
        
        // 세트를 배열로 변환 및 정렬
        const setsArray = Object.values(sets).map(set => {
            set.questions.sort((a, b) => a.questionNum - b.questionNum);
            return set;
        });
        
        console.log(`[ArrangeComponent] 파싱된 세트 수: ${setsArray.length}`);
        
        return {
            type: 'writing_arrange',
            timeLimit: this.TIME_LIMIT,
            sets: setsArray
        };
    }
    
    /**
     * CSV 라인 파싱 (쉼표 처리)
     */
    parseCSVLine(line) {
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
    
    /**
     * 세트 인덱스 찾기
     */
    findSetIndex(setId) {
        return this.data.sets.findIndex(set => set.setId === setId);
    }
    
    /**
     * 랜덤 남녀 조합 생성 (남남/여여 불가)
     */
    getRandomGenderPair() {
        const femaleIndex = Math.floor(Math.random() * this.FEMALE_IMAGES.length);
        const maleIndex = Math.floor(Math.random() * this.MALE_IMAGES.length);
        
        // 랜덤으로 순서 결정 (50% 확률로 여자가 먼저 or 남자가 먼저)
        const femaleFirst = Math.random() < 0.5;
        
        return {
            first: femaleFirst ? {
                gender: 'female',
                image: this.FEMALE_IMAGES[femaleIndex]
            } : {
                gender: 'male',
                image: this.MALE_IMAGES[maleIndex]
            },
            second: femaleFirst ? {
                gender: 'male',
                image: this.MALE_IMAGES[maleIndex]
            } : {
                gender: 'female',
                image: this.FEMALE_IMAGES[femaleIndex]
            }
        };
    }
    
    /**
     * 문제 로드
     */
    loadQuestion(questionIndex) {
        console.log(`[ArrangeComponent] 문제 ${questionIndex + 1} 로드`);
        
        this.currentQuestion = questionIndex;
        const question = this.currentSetData.questions[questionIndex];
        
        // 문제별 프로필 이미지 조합 가져오기 (없으면 새로 생성)
        const questionKey = `${this.currentSetData.setId}_q${question.questionNum}`;
        if (!this.profilePairs[questionKey]) {
            this.profilePairs[questionKey] = this.getRandomGenderPair();
            console.log(`[ArrangeComponent] 새 프로필 조합 생성: ${questionKey}`);
        }
        
        // 문제 렌더링
        this.renderQuestion(question);
        
        console.log(`[ArrangeComponent] 문제 ${questionIndex + 1} 로드 완료`);
        
        // 마지막 문제면 Submit 버튼 표시
        const totalQuestions = this.currentSetData.questions.length;
        if (questionIndex >= totalQuestions - 1) {
            document.getElementById('arrangeNextBtn').style.display = 'none';
            document.getElementById('arrangeSubmitBtn').style.display = 'inline-block';
        } else {
            document.getElementById('arrangeNextBtn').style.display = 'inline-block';
            document.getElementById('arrangeSubmitBtn').style.display = 'none';
        }
    }
    
    /**
     * 문제 렌더링
     */
    renderQuestion(question) {
        const container = document.getElementById('arrangeQuestionContent');
        
        // 저장된 답안 불러오기
        const questionKey = `${this.currentSetData.setId}_q${question.questionNum}`;
        const savedAnswer = this.answers[questionKey];
        
        // 프로필 이미지 조합
        const genderPair = this.profilePairs[questionKey];
        
        // 첫 번째 사람 프로필 + 주어진 문장
        const givenSentenceHtml = `
            <div class="arrange-given">
                <div class="arrange-profile ${genderPair.first.gender}">
                    <img src="${genderPair.first.image}" alt="${genderPair.first.gender}" />
                </div>
                <div class="arrange-sentence">${question.givenSentence}</div>
            </div>
        `;
        
        // 두 번째 사람 프로필 + 빈칸
        const blanksHtml = question.presentedWords.map((word, index) => {
            const isBlank = word === '_';
            const userWord = savedAnswer && savedAnswer[index] ? savedAnswer[index] : null;
            
            if (isBlank) {
                return `
                    <div class="arrange-blank ${userWord ? 'has-word' : ''}" 
                         data-index="${index}" 
                         ondrop="window.currentArrangeComponent.dropWord(event)" 
                         ondragover="allowDrop(event)"
                         onclick="window.currentArrangeComponent.removeWord(${index})">
                        ${userWord ? `<span class="filled-word">${userWord}</span>` : ''}
                    </div>
                `;
            } else {
                return `<span class="arrange-presented-word">${word}</span>`;
            }
        }).join('');
        
        const answerAreaHtml = `
            <div class="arrange-answer">
                <div class="arrange-profile ${genderPair.second.gender}">
                    <img src="${genderPair.second.image}" alt="${genderPair.second.gender}" />
                </div>
                <div class="arrange-blanks">
                    ${blanksHtml}
                    <span class="arrange-punctuation">${question.endPunctuation}</span>
                </div>
            </div>
        `;
        
        // 하단 보기 단어들
        const usedWords = savedAnswer ? Object.values(savedAnswer) : [];
        const optionsHtml = question.optionWords.map(word => {
            const isUsed = usedWords.includes(word);
            return `
                <div class="arrange-option ${isUsed ? 'used' : ''}" 
                     draggable="${!isUsed}" 
                     ondragstart="window.currentArrangeComponent.dragStart(event)" 
                     ondragend="window.currentArrangeComponent.dragEnd(event)"
                     data-word="${word}">
                    ${word}
                </div>
            `;
        }).join('');
        
        const optionsAreaHtml = `
            <div class="arrange-options">
                ${optionsHtml}
            </div>
        `;
        
        container.innerHTML = `
            <h2 class="arrange-title">Make an appropriate sentence.</h2>
            ${givenSentenceHtml}
            ${answerAreaHtml}
            ${optionsAreaHtml}
        `;
    }
    
    /**
     * 드래그 시작
     */
    dragStart(event) {
        this.draggedWord = event.target.dataset.word;
        event.dataTransfer.effectAllowed = 'move';
        console.log(`[ArrangeComponent] 드래그 시작: ${this.draggedWord}`);
    }
    
    /**
     * 드래그 종료
     */
    dragEnd(event) {
        this.draggedWord = null;
        console.log('[ArrangeComponent] 드래그 종료');
    }
    
    /**
     * 단어 드롭
     */
    dropWord(event) {
        event.preventDefault();
        
        if (!this.draggedWord) return;
        
        const blank = event.target.closest('.arrange-blank');
        if (!blank) {
            console.log('[ArrangeComponent] 빈칸이 아닌 곳에 드롭 - 무시');
            this.draggedWord = null;
            return;
        }
        
        const index = parseInt(blank.dataset.index);
        const question = this.currentSetData.questions[this.currentQuestion];
        const questionKey = `${this.currentSetData.setId}_q${question.questionNum}`;
        
        if (!this.answers[questionKey]) {
            this.answers[questionKey] = {};
        }
        
        // 첫 번째 빈칸인지 확인
        let word = this.draggedWord;
        const isFirstBlank = question.presentedWords[0] === '_' && index === 0;
        
        if (isFirstBlank && word) {
            // 첫 글자를 대문자로 변환
            word = word.charAt(0).toUpperCase() + word.slice(1);
            console.log(`[ArrangeComponent] 첫 번째 빈칸 - 대문자 변환: ${this.draggedWord} → ${word}`);
        }
        
        this.answers[questionKey][index] = word;
        console.log(`[ArrangeComponent] 답안 저장: ${questionKey}[${index}] = ${word}`);
        
        // 화면 재렌더링
        this.renderQuestion(question);
        
        this.draggedWord = null;
    }
    
    /**
     * 단어 제거 (클릭)
     */
    removeWord(index) {
        const question = this.currentSetData.questions[this.currentQuestion];
        const questionKey = `${this.currentSetData.setId}_q${question.questionNum}`;
        
        if (this.answers[questionKey] && this.answers[questionKey][index]) {
            console.log(`[ArrangeComponent] 단어 제거: ${questionKey}[${index}]`);
            delete this.answers[questionKey][index];
            
            // 화면 재렌더링
            this.renderQuestion(question);
        }
    }
    
    /**
     * 다음 문제로 이동 (Next 버튼에서 호출)
     */
    nextQuestion() {
        const nextIndex = this.currentQuestion + 1;
        const totalQuestions = this.currentSetData.questions.length;
        
        if (nextIndex >= totalQuestions) {
            // 마지막 문제 → Submit 버튼 표시
            console.log('[ArrangeComponent] 마지막 문제 → Submit 버튼 표시');
            document.getElementById('arrangeNextBtn').style.display = 'none';
            document.getElementById('arrangeSubmitBtn').style.display = 'inline-block';
            return;
        }
        
        // 다음 문제 로드
        this.loadQuestion(nextIndex);
        
        // 진행률 업데이트
        const progressEl = document.getElementById('arrangeProgress');
        if (progressEl) {
            progressEl.textContent = `Question ${nextIndex + 1} of ${totalQuestions}`;
        }
    }
    
    /**
     * 제출 & 채점
     */
    submit() {
        console.log('[ArrangeComponent] 제출 시작');
        console.log('[ArrangeComponent] 최종 답안:', this.answers);
        
        let correct = 0;
        const total = this.currentSetData.questions.length;
        
        const results = this.currentSetData.questions.map((question, index) => {
            const questionKey = `${this.currentSetData.setId}_q${question.questionNum}`;
            const userAnswer = this.answers[questionKey];
            
            // 사용자가 입력한 전체 문장 만들기
            const userFullAnswer = [];
            question.presentedWords.forEach((word, idx) => {
                if (word === '_') {
                    if (userAnswer && userAnswer[idx]) {
                        userFullAnswer.push(userAnswer[idx]);
                    } else {
                        userFullAnswer.push('___');
                    }
                } else {
                    userFullAnswer.push(word);
                }
            });
            
            // 정답 확인
            let isCorrect = true;
            if (userFullAnswer.length !== question.correctAnswer.length) {
                isCorrect = false;
            } else {
                for (let i = 0; i < question.correctAnswer.length; i++) {
                    if (userFullAnswer[i] !== question.correctAnswer[i]) {
                        isCorrect = false;
                        break;
                    }
                }
            }
            
            console.log(`[ArrangeComponent] Q${question.questionNum} - ${isCorrect ? '정답' : '오답'}`);
            
            if (isCorrect) {
                correct++;
            }
            
            return {
                questionNum: question.questionNum,
                givenSentence: question.givenSentence,
                givenTranslation: question.givenTranslation,
                correctAnswer: question.correctAnswer.join(' ') + question.endPunctuation,
                correctAnswerArray: question.correctAnswer,
                correctTranslation: question.correctTranslation,
                userAnswer: userFullAnswer.join(' ') + question.endPunctuation,
                explanation: question.explanation,
                isCorrect: isCorrect,
                profilePair: this.profilePairs[questionKey],
                presentedWords: question.presentedWords,
                userFilledWords: userAnswer || {},
                optionWords: question.optionWords,
                endPunctuation: question.endPunctuation
            };
        });
        
        const accuracy = Math.round((correct / total) * 100);
        
        // 결과 데이터 구성
        const resultData = {
            results: results,
            correct: correct,
            total: total,
            accuracy: accuracy,
            week: this.currentSetData.week,
            day: this.currentSetData.day
        };
        
        console.log('[ArrangeComponent] 채점 완료:', resultData);
        
        // sessionStorage에 저장
        sessionStorage.setItem('arrangeResults', JSON.stringify(resultData));
        
        // 완료 콜백 호출
        if (this.onComplete) {
            this.onComplete(resultData);
        }
    }
    
    /**
     * 데모 데이터
     */
    getDemoData() {
        return {
            type: 'writing_arrange',
            timeLimit: 410,
            sets: [
                {
                    setId: 'writing_arrange_1',
                    week: 'Week 1',
                    day: '월',
                    questions: [
                        {
                            questionNum: 1,
                            givenSentence: 'I need to buy a new laptop.',
                            givenTranslation: '나는 새 노트북을 사야 해.',
                            correctAnswer: ['Which', 'store', 'has', 'the best', 'deals'],
                            correctTranslation: '어느 가게가 가장 좋은 거래를 하나요?',
                            presentedWords: ['Which', '_', '_', '_', '_'],
                            optionWords: ['has', 'the best', 'which', 'store', 'deals', 'laptop', 'good'],
                            endPunctuation: '?',
                            explanation: '"Which store"는 어느 가게를 묻는 표현이고, "has the best deals"는 가장 좋은 거래를 가지고 있다는 의미입니다.'
                        }
                    ]
                }
            ]
        };
    }
}

// 전역 스코프에 노출
window.ArrangeComponent = ArrangeComponent;

// index.html의 Next 버튼에서 호출하는 전역 함수
function nextArrangeQuestion() {
    if (window.currentArrangeComponent) {
        window.currentArrangeComponent.nextQuestion();
    }
}
window.nextArrangeQuestion = nextArrangeQuestion;

// 드롭 허용 헬퍼 함수 (전역)
function allowDrop(event) {
    event.preventDefault();
}
