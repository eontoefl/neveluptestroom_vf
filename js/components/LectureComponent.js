/**
 * LectureComponent.js
 * 듣기 - 렉쳐 듣고 문제 풀기 컴포넌트
 * v=002
 * 
 * 공지사항과 유사하지만 차이점:
 * - 문제 개수: 4개 (공지사항 2개)
 * - 타이머: 30초 (공지사항 20초)
 * - lectureTitle 필드 추가 (인트로 상단 표시)
 */

// ✅ 캐시 시스템 추가
let cachedLectureData = null;

window.clearLectureCache = function() {
  console.log('🔄 [LectureComponent] 캐시 초기화');
  cachedLectureData = null;
};

class LectureComponent {
    constructor(setNumber, config = {}) {
        console.log(`[LectureComponent] 생성 - setNumber: ${setNumber}`);
        
        this.setNumber = setNumber;
        this.onComplete = config.onComplete || null;
        this.onError = config.onError || null;
        this.onTimerStart = config.onTimerStart || null;
        
        // 내부 상태
        this.currentQuestion = 0;
        this.answers = {};
        this.showingIntro = true;
        this.data = null;
        this.currentSetData = null;
        this.currentImage = null;
        
        // 오디오 플레이어
        this.audioPlayer = null;
        this.isAudioPlaying = false;
        
        // 타이머 설정
        this.TIME_LIMIT = 30; // 30초 (공지사항은 20초)
        
        // 구글 시트 설정
        this.SHEET_CONFIG = {
            spreadsheetId: '1srFVmFnRa8A73isTO_Vk3yfU1bQWVroHUui8XvYf9e0',
            gid: '421928479'
        };
        
        // 성별별 교수 이미지
        this.FEMALE_IMAGES = [
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageF1.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageF2.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageF3.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageF4.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageF5.jpg'
        ];
        
        this.MALE_IMAGES = [
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageM1.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageM2.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageM3.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageM4.jpg',
            'https://eontoefl.github.io/toefl-audio/listening/response/image/response_imageM5.jpg'
        ];
    }
    
    /**
     * 컴포넌트 초기화
     */
    async init() {
        console.log('[LectureComponent] 초기화 시작');
        
        // 화면 전환
        showScreen('listeningLectureScreen');
        
        try {
            // 1. 데이터 로드
            await this.loadData();
            
            // 2. 세트 찾기 (lecture_set_XXXX 형식)
            let setId;
            if (typeof this.setNumber === 'string' && this.setNumber.includes('_set_')) {
                setId = this.setNumber;
            } else {
                setId = `lecture_set_${String(this.setNumber).padStart(4, '0')}`;
            }
            console.log(`[LectureComponent] 세트 검색 - ID: ${setId}`);
            
            const setIndex = this.findSetIndex(setId);
            if (setIndex === -1) {
                throw new Error(`세트를 찾을 수 없습니다: ${setId}`);
            }
            
            this.currentSetData = this.data.sets[setIndex];
            console.log('[LectureComponent] 세트 데이터 로드 완료:', this.currentSetData);
            
            // 3. 인트로 화면 표시
            this.showIntro();
            
        } catch (error) {
            console.error('[LectureComponent] 초기화 실패:', error);
            alert('렉쳐 듣기 데이터를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * 데이터 로드
     */
    async loadData(forceReload = false) {
        console.log('[LectureComponent] 데이터 로드 시작');
        
        // ✅ 캐시 확인
        if (!forceReload && cachedLectureData) {
            console.log('✅ [LectureComponent] 캐시된 데이터 사용 (이미 정렬됨)');
            console.log('  캐시 데이터 세트 순서:', cachedLectureData.sets.map(s => s.setId));
            this.data = cachedLectureData;
            return;
        }
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.SHEET_CONFIG.gid}`;
        console.log('[LectureComponent] CSV URL:', csvUrl);
        
        try {
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            console.log(`[LectureComponent] CSV 다운로드 완료 (${csvText.length} bytes)`);
            
            this.data = this.parseCSV(csvText);
            console.log('[LectureComponent] 파싱 완료:', this.data);
            
            if (!this.data || !this.data.sets || this.data.sets.length === 0) {
                throw new Error('데이터가 비어있습니다');
            }
            
            // ✅ 캐시 저장
            cachedLectureData = this.data;
            
        } catch (error) {
            console.error('[LectureComponent] 데이터 로드 실패, 데모 데이터 사용:', error);
            this.data = this.getDemoData();
            
            // ✅ 데모 데이터도 캐시
            cachedLectureData = this.data;
        }
    }
    
    /**
     * CSV 파싱 (69개 컬럼: A~BQ)
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log(`[LectureComponent] CSV 라인 수: ${lines.length}`);
        
        const sets = [];
        
        // 헤더 확인
        const firstLine = this.parseCSVLine(lines[0]);
        const hasHeader = firstLine[0].toLowerCase().includes('setid') || 
                          firstLine[0].toLowerCase().includes('set_id');
        const startIndex = hasHeader ? 1 : 0;
        
        console.log(`[LectureComponent] 헤더 존재: ${hasHeader}, 시작 인덱스: ${startIndex}`);
        
        for (let i = startIndex; i < lines.length; i++) {
            const columns = this.parseCSVLine(lines[i]);
            
            if (columns.length < 68) {
                console.warn(`[LectureComponent] 라인 ${i} 스킵 (컬럼 부족: ${columns.length}/68)`);
                continue;
            }
            
            // 기본 정보
            const rawSetId = columns[0].trim();
            // ID 정규화: lecture_set_0001 형식 그대로 사용
            let setId = rawSetId;
            if (/^\d+$/.test(rawSetId)) {
                // 숫자만: "1" → "lecture_set_0001"
                setId = `lecture_set_${String(rawSetId).padStart(4, '0')}`;
            }
            // 다른 형식은 그대로 사용
            
            const gender = columns[1].trim();
            const lectureTitle = columns[2].trim(); // 🆕 렉쳐 타이틀
            const narrationUrl = this.convertGoogleDriveUrl(columns[3].trim());
            const audioUrl = this.convertGoogleDriveUrl(columns[4].trim());
            const script = columns[5].trim();
            const scriptTrans = columns[6].trim();
            
            console.log(`[LectureComponent] 세트 파싱: ${setId}, 타이틀: ${lectureTitle}`);
            
            // scriptHighlights 파싱 (BP열, 인덱스 67)
            let scriptHighlights = [];
            if (columns[67] && columns[67].trim()) {
                try {
                    const highlightStr = columns[67].trim();
                    const items = highlightStr.split('##');
                    
                    items.forEach(item => {
                        const parts = item.split('::');
                        if (parts.length >= 3) {
                            scriptHighlights.push({
                                word: parts[0].trim(),
                                translation: parts[1].trim(),
                                explanation: parts[2].trim()
                            });
                        }
                    });
                    
                    console.log(`[LectureComponent] scriptHighlights 파싱: ${scriptHighlights.length}개`);
                } catch (e) {
                    console.error('[LectureComponent] scriptHighlights 파싱 실패:', e);
                }
            }
            
            // 문제 1 (H~V: 7~21)
            const q1 = this.parseQuestion(columns, 7);
            
            // 문제 2 (W~AK: 22~36)
            const q2 = this.parseQuestion(columns, 22);
            
            // 문제 3 (AL~AZ: 37~51)
            const q3 = this.parseQuestion(columns, 37);
            
            // 문제 4 (BA~BO: 52~66)
            const q4 = this.parseQuestion(columns, 52);
            
            sets.push({
                setId: setId,
                gender: gender,
                lectureTitle: lectureTitle, // 🆕
                narrationUrl: narrationUrl,
                audioUrl: audioUrl,
                script: script,
                scriptTrans: scriptTrans,
                scriptHighlights: scriptHighlights,
                questions: [q1, q2, q3, q4] // 4문제
            });
        }
        
        // ✅ Set ID 기준으로 정렬 (lecture_set_0001, lecture_set_0002, ...)
        console.log('🔄 [LectureComponent] 정렬 전 순서:', sets.map(s => s.setId));
        
        sets.sort((a, b) => {
            const numA = parseInt(a.setId.replace(/\D/g, ''));
            const numB = parseInt(b.setId.replace(/\D/g, ''));
            console.log(`  비교: ${a.setId} (${numA}) vs ${b.setId} (${numB}) → ${numA - numB}`);
            return numA - numB;
        });
        
        console.log('✅ [LectureComponent] 정렬 후 순서:', sets.map(s => s.setId));
        
        // 디버깅: 최종 데이터 검증
        sets.forEach((set, idx) => {
            console.log(`  [${idx}] ${set.setId} - ${set.questions.length}문제`);
        });
        
        console.log(`[LectureComponent] 파싱된 세트 수: ${sets.length}`);
        
        return {
            type: 'listening_lecture',
            timeLimit: this.TIME_LIMIT,
            sets: sets
        };
    }
    
    /**
     * 문제 파싱 헬퍼 (15개 컬럼)
     */
    parseQuestion(columns, startIndex) {
        return {
            questionText: columns[startIndex] || '',
            questionTrans: columns[startIndex + 1] || '',
            options: [
                columns[startIndex + 2] || '',
                columns[startIndex + 3] || '',
                columns[startIndex + 4] || '',
                columns[startIndex + 5] || ''
            ],
            correctAnswer: parseInt(columns[startIndex + 6]) || 1,
            translations: [
                columns[startIndex + 7] || '',
                columns[startIndex + 8] || '',
                columns[startIndex + 9] || '',
                columns[startIndex + 10] || ''
            ],
            explanations: [
                columns[startIndex + 11] || '',
                columns[startIndex + 12] || '',
                columns[startIndex + 13] || '',
                columns[startIndex + 14] || ''
            ]
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
        // ✅ setId를 lecture_set_XXXX 형식으로 변환
        let targetSetId;
        if (typeof setId === 'string' && setId.includes('_set_')) {
            // 이미 "lecture_set_0001" 형식이면 그대로 사용
            targetSetId = setId;
            console.log(`🔍 [findSetIndex] setId 문자열 직접 사용: ${targetSetId}`);
        } else {
            // 숫자면 "lecture_set_XXXX" 형식으로 변환
            targetSetId = `lecture_set_${String(setId).padStart(4, '0')}`;
            console.log(`🔍 [findSetIndex] setId ${setId} → targetSetId: ${targetSetId}`);
        }
        
        console.log(`[LectureComponent] 세트 검색 - ID: ${targetSetId}`);
        
        const index = this.data.sets.findIndex(set => set.setId === targetSetId);
        console.log(`[LectureComponent] 세트 인덱스: ${index}`);
        return index;
    }
    
    /**
     * 인트로 화면 표시
     */
    showIntro() {
        console.log('[LectureComponent] 인트로 화면 표시');
        
        this.showingIntro = true;
        
        // 성별에 따라 교수 이미지 선택
        const gender = this.currentSetData.gender.toLowerCase().trim();
        const isFemale = gender === 'female' || gender === 'f';
        const images = isFemale ? this.FEMALE_IMAGES : this.MALE_IMAGES;
        this.currentImage = images[Math.floor(Math.random() * images.length)];
        
        console.log(`[LectureComponent] 성별: ${gender}, 여성: ${isFemale}, 선택된 이미지:`, this.currentImage);
        
        // 인트로 타이틀 표시 (렉쳐만의 특징)
        const titleElement = document.getElementById('lectureIntroTitle');
        if (titleElement) {
            titleElement.textContent = this.currentSetData.lectureTitle || 'Listen to a lecture.';
            console.log(`[LectureComponent] 타이틀 설정: ${this.currentSetData.lectureTitle}`);
        }
        
        // 인트로 화면에 이미지 표시 (Conver 스타일)
        const introImageDiv = document.getElementById('lectureIntroImage');
        if (introImageDiv) {
            introImageDiv.innerHTML = `
                <img src="${this.currentImage}" alt="Lecture professor" 
                     style="width: 100%; max-width: 450px; height: auto; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); object-fit: cover;"
                     onerror="console.error('❌ 렉쳐 이미지 로드 실패:', this.src);"
                     onload="console.log('✅ 렉쳐 이미지 로드 성공:', this.src);">
            `;
        }
        
        // 인트로 화면 표시
        document.getElementById('lectureIntroScreen').style.display = 'block';
        document.getElementById('lectureQuestionScreen').style.display = 'none';
        
        // 진행률/타이머 숨기기 (인트로 중에는 안 보임)
        document.getElementById('lectureProgress').style.display = 'none';
        document.getElementById('lectureTimer').style.display = 'none';
        
        // 오디오 시퀀스 시작
        this.playAudioSequence();
    }
    
    /**
     * 오디오 시퀀스 재생
     * 나레이션 → 2초 대기 → 렉처 오디오
     */
    playAudioSequence() {
        console.log('[LectureComponent] 오디오 시퀀스 시작');
        
        const narrationUrl = this.currentSetData.narrationUrl;
        const audioUrl = this.currentSetData.audioUrl;
        
        // 나레이션이 없으면 바로 렉처 오디오 재생
        if (!narrationUrl || narrationUrl.trim() === '') {
            console.log('[LectureComponent] 나레이션 없음, 렉처 오디오만 재생');
            this.playMainAudio(() => {
                console.log('[LectureComponent] 오디오 시퀀스 완료, 2초 후 문제 화면으로 전환');
                setTimeout(() => this.showQuestions(), 2000);
            });
            return;
        }
        
        // 1) 나레이션 재생
        console.log('[LectureComponent] 나레이션 재생 시작');
        this.playNarration(() => {
            console.log('[LectureComponent] 나레이션 완료, 2초 대기');
            
            // 2) 2초 대기
            setTimeout(() => {
                console.log('[LectureComponent] 렉처 오디오 재생 시작');
                
                // 3) 렉처 오디오 재생
                this.playMainAudio(() => {
                    console.log('[LectureComponent] 오디오 시퀀스 완료, 2초 후 문제 화면으로 전환');
                    setTimeout(() => this.showQuestions(), 2000);
                });
            }, 2000);
        });
    }
    
    /**
     * 나레이션 재생
     */
    playNarration(onEnded) {
        const narrationUrl = this.currentSetData.narrationUrl;
        console.log('[LectureComponent] 나레이션 URL:', narrationUrl);
        
        if (!narrationUrl) {
            console.warn('[LectureComponent] 나레이션 URL 없음, 스킵');
            if (onEnded) onEnded();
            return;
        }
        
        this.audioPlayer = new Audio(narrationUrl);
        this.audioPlayer.onended = () => {
            console.log('[LectureComponent] 나레이션 재생 완료');
            if (onEnded) onEnded();
        };
        this.audioPlayer.onerror = (e) => {
            console.error('[LectureComponent] 나레이션 재생 오류:', e);
            if (onEnded) onEnded();
        };
        this.audioPlayer.play().catch(err => {
            console.error('[LectureComponent] 나레이션 재생 실패:', err);
            if (onEnded) onEnded();
        });
    }
    
    /**
     * 렉처 오디오 재생
     */
    playMainAudio(onEnded) {
        const audioUrl = this.currentSetData.audioUrl;
        console.log('[LectureComponent] 렉처 오디오 URL:', audioUrl);
        
        if (!audioUrl) {
            console.warn('[LectureComponent] 렉처 오디오 URL 없음, 스킵');
            if (onEnded) onEnded();
            return;
        }
        
        this.audioPlayer = new Audio(audioUrl);
        this.audioPlayer.onended = () => {
            console.log('[LectureComponent] 렉처 오디오 재생 완료');
            if (onEnded) onEnded();
        };
        this.audioPlayer.onerror = (e) => {
            console.error('[LectureComponent] 렉처 오디오 재생 오류:', e);
            if (onEnded) onEnded();
        };
        this.audioPlayer.play().catch(err => {
            console.error('[LectureComponent] 렉처 오디오 재생 실패:', err);
            if (onEnded) onEnded();
        });
    }
    
    /**
     * 문제 화면 표시
     */
    showQuestions() {
        console.log('[LectureComponent] 문제 화면으로 전환');
        
        this.showingIntro = false;
        
        document.getElementById('lectureIntroScreen').style.display = 'none';
        document.getElementById('lectureQuestionScreen').style.display = 'block';
        
        // 진행률/타이머 표시 (문제 풀이 시작)
        document.getElementById('lectureProgress').style.display = 'inline-block';
        document.getElementById('lectureTimer').style.display = 'inline-block';
        
        // 첫 번째 문제 로드
        this.loadQuestion(0);
        
        // Module에게 타이머 시작 요청
        if (this.onTimerStart) {
            this.onTimerStart();
        }
    }
    
    /**
     * 문제 로드
     */
    loadQuestion(questionIndex) {
        console.log(`[LectureComponent] 문제 ${questionIndex + 1} 로드`);
        
        this.currentQuestion = questionIndex;
        const question = this.currentSetData.questions[questionIndex];
        
        // 진행률 업데이트 (ModuleController에 알림)
        if (window.moduleController) {
            window.moduleController.updateCurrentQuestionInComponent(questionIndex);
        }
        
        // 타이머 리셋 (다음 문제로 넘어갈 때)
        if (questionIndex > 0 && window.moduleController) {
            window.moduleController.stopQuestionTimer();
            window.moduleController.startQuestionTimer(this.TIME_LIMIT);  // 30초
        }
        
        // 작은 이미지 표시
        this.renderSmallImage();
        
        // 질문 및 선택지 표시
        const questionContentDiv = document.getElementById('lectureQuestionContent');
        if (!questionContentDiv) {
            console.error('[LectureComponent] lectureQuestionContent 요소를 찾을 수 없습니다');
            return;
        }
        
        // 기존 내용 초기화
        questionContentDiv.innerHTML = '';
        
        // 답안 키 생성
        const questionKey = `${this.currentSetData.setId}_q${questionIndex + 1}`;
        const savedAnswer = this.answers[questionKey];
        
        // 선택지 HTML 생성
        const optionsHtml = question.options.map((option, index) => {
            const selectedClass = savedAnswer === (index + 1) ? 'selected' : '';
            
            return `
                <div class="response-option ${selectedClass}" 
                     onclick="window.currentLectureComponent.selectOption(${index + 1})">
                    ${option}
                </div>
            `;
        }).join('');
        
        // 질문 + 선택지 표시
        questionContentDiv.innerHTML = `
            <h3 class="conver-question">${question.questionText}</h3>
            <div class="conver-options">
                ${optionsHtml}
            </div>
        `;
        
        console.log(`[LectureComponent] 문제 ${questionIndex + 1} 로드 완료`);
    }
    
    /**
     * 작은 이미지 렌더링
     */
    renderSmallImage() {
        const smallImageDiv = document.getElementById('lectureSmallImage');
        if (smallImageDiv && this.currentImage) {
            smallImageDiv.innerHTML = `<img src="${this.currentImage}" alt="Lecture professor" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
        }
    }
    
    /**
     * 선택지 선택
     */
    selectOption(optionIndex) {
        console.log(`[LectureComponent] 선택 - Q${this.currentQuestion + 1}: ${optionIndex}`);
        
        const questionKey = `${this.currentSetData.setId}_q${this.currentQuestion + 1}`;
        this.answers[questionKey] = optionIndex;
        
        // UI 업데이트: 모든 선택지에서 selected 제거
        const allOptions = document.querySelectorAll('#lectureQuestionContent .response-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // 선택된 항목에 selected 추가 (0-based index)
        if (allOptions[optionIndex - 1]) {
            allOptions[optionIndex - 1].classList.add('selected');
        }
        
        console.log('[LectureComponent] 현재 답안:', this.answers);
    }
    
    /**
     * 다음 문제로 이동
     */
    nextQuestion() {
        if (this.currentQuestion < this.currentSetData.questions.length - 1) {
            this.loadQuestion(this.currentQuestion + 1);
            return true;
        }
        console.log('[LectureComponent] 마지막 문제입니다');
        return false;
    }
    
    /**
     * 제출 & 채점
     */
    submit() {
        console.log('[LectureComponent] 제출 시작');
        console.log('[LectureComponent] 최종 답안:', this.answers);
        
        // 답안 채점
        const results = [];
        let totalCorrect = 0;
        let totalIncorrect = 0;
        
        this.currentSetData.questions.forEach((question, index) => {
            // ✅ 수정: questionKey로 답안 찾기
            const questionKey = `${this.currentSetData.setId}_q${index + 1}`;
            const userAnswer = this.answers[questionKey];
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) {
                totalCorrect++;
            } else {
                totalIncorrect++;
            }
            
            results.push({
                questionIndex: index,
                questionText: question.questionText,
                questionTrans: question.questionTrans,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                options: question.options,
                translations: question.translations,
                explanations: question.explanations
            });
        });
        
        // 결과 데이터 구성
        const resultData = {
            setId: this.currentSetData.setId,
            gender: this.currentSetData.gender,
            lectureTitle: this.currentSetData.lectureTitle,
            imageUrl: this.currentImage,
            audioUrl: this.currentSetData.audioUrl,
            narrationUrl: this.currentSetData.narrationUrl,
            script: this.currentSetData.script,
            scriptTrans: this.currentSetData.scriptTrans,
            scriptHighlights: this.currentSetData.scriptHighlights,
            totalCorrect: totalCorrect,
            totalIncorrect: totalIncorrect,
            totalQuestions: this.currentSetData.questions.length,
            score: Math.round((totalCorrect / this.currentSetData.questions.length) * 100),
            results: results
        };
        
        console.log('[LectureComponent] 채점 완료:', resultData);
        
        // sessionStorage에 저장
        sessionStorage.setItem('listeningLectureResult', JSON.stringify(resultData));
        
        // 완료 콜백 호출
        if (this.onComplete) {
            this.onComplete(resultData);
        }
    }
    
    /**
     * 구글 드라이브 URL 변환
     */
    convertGoogleDriveUrl(url) {
        if (!url) return '';
        if (url.includes('drive.google.com/file/d/')) {
            const fileId = url.match(/\/d\/([^/]+)/)?.[1];
            if (fileId) {
                return `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
        }
        return url;
    }
    
    /**
     * 데모 데이터
     */
    getDemoData() {
        return {
            type: 'listening_lecture',
            timeLimit: 30,
            sets: [
                {
                    setId: 'listening_lecture_1',
                    gender: 'M',
                    lectureTitle: 'Listen to a lecture.',
                    narrationUrl: '',
                    audioUrl: 'https://example.com/lecture1.mp3',
                    script: 'This is a demo lecture script.',
                    scriptTrans: '이것은 데모 강의 스크립트입니다.',
                    scriptHighlights: [],
                    questions: [
                        {
                            questionText: 'Demo Question 1?',
                            questionTrans: '데모 질문 1?',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 0,
                            translations: ['번역 A', '번역 B', '번역 C', '번역 D'],
                            explanations: ['해설 A', '해설 B', '해설 C', '해설 D']
                        },
                        {
                            questionText: 'Demo Question 2?',
                            questionTrans: '데모 질문 2?',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 1,
                            translations: ['번역 A', '번역 B', '번역 C', '번역 D'],
                            explanations: ['해설 A', '해설 B', '해설 C', '해설 D']
                        },
                        {
                            questionText: 'Demo Question 3?',
                            questionTrans: '데모 질문 3?',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 2,
                            translations: ['번역 A', '번역 B', '번역 C', '번역 D'],
                            explanations: ['해설 A', '해설 B', '해설 C', '해설 D']
                        },
                        {
                            questionText: 'Demo Question 4?',
                            questionTrans: '데모 질문 4?',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 3,
                            translations: ['번역 A', '번역 B', '번역 C', '번역 D'],
                            explanations: ['해설 A', '해설 B', '해설 C', '해설 D']
                        }
                    ]
                }
            ]
        };
    }
    
    /**
     * ================================================
     * 2차 풀이 (이중채점) 모드
     * ================================================
     */
    
    /**
     * 2차 풀이 모드로 단일 문제 표시
     * @param {number} questionIndex - 세트 내 문제 인덱스 (0-3)
     * @param {boolean} wasCorrect - 1차에 맞았는지 여부
     * @param {any} firstAttemptAnswer - 1차 답안
     */
    async initRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer = null) {
        console.log(`🔄 [LectureComponent] 2차 풀이 모드 - 문제 ${questionIndex}, 1차 결과: ${wasCorrect ? '✅' : '❌'}`);
        console.log(`  📥 firstAttemptAnswer:`, firstAttemptAnswer);
        
        try {
            // 1. 데이터 로드
            await this.loadData();
            
            if (!this.data || !this.data.sets || this.data.sets.length === 0) {
                throw new Error('데이터를 불러올 수 없습니다');
            }
            
            // 2. 세트 찾기
            const setIndex = this.findSetIndex(this.setId);
            if (setIndex === -1) {
                throw new Error(`세트를 찾을 수 없습니다: ${this.setId}`);
            }
            
            this.currentSetData = this.data.sets[setIndex];
            this.currentQuestion = questionIndex;
            
            console.log(`  📊 currentSetData.setId: ${this.currentSetData.setId}`);
            console.log(`  📊 선택된 question (index ${questionIndex}):`, this.currentSetData.questions[questionIndex]?.questionText.substring(0, 50));
            
            // 3. 화면 표시
            showScreen('listeningLectureScreen');
            
            // 4. 타이머 숨기기
            this.hideTimer();
            
            // 5. 인트로 건너뛰고 문제 렌더링 (2차 풀이 모드)
            this.showingIntro = false;
            await this.renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer);
            
        } catch (error) {
            console.error('[LectureComponent] 2차 풀이 초기화 실패:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * 2차 풀이 모드로 문제 렌더링
     */
    async renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer) {
        console.log(`🎨 [LectureComponent] 2차 풀이 문제 렌더링 - Q${questionIndex + 1}`);
        
        // 🔴 이전 AudioPlayer 정리 (렉 방지)
        if (this.retakeAudioPlayer && typeof this.retakeAudioPlayer.destroy === 'function') {
            this.retakeAudioPlayer.destroy();
            this.retakeAudioPlayer = null;
            console.log('[LectureComponent] 🛑 이전 AudioPlayer 정리 완료');
        }
        
        const question = this.currentSetData.questions[questionIndex];
        if (!question) {
            console.error(`❌ 문제를 찾을 수 없습니다: index ${questionIndex}`);
            return;
        }
        
        // ModuleController에게 진행률 업데이트 요청
        if (window.moduleController) {
            window.moduleController.updateCurrentQuestionInComponent(questionIndex);
        }
        
        // 문제 화면 표시 (인트로 없음)
        document.getElementById('lectureIntroScreen').style.display = 'none';
        document.getElementById('lectureQuestionScreen').style.display = 'block';
        
        // 질문 및 선택지 렌더링 (2차 풀이 모드)
        const questionContentDiv = document.getElementById('lectureQuestionContent');
        if (!questionContentDiv) {
            console.error('❌ lectureQuestionContent 요소를 찾을 수 없습니다');
            return;
        }
        
        // 🎵 오디오 플레이어 추가
        const audioPlayerHtml = `
            <div id="lectureAudioPlayerContainer" style="margin-bottom: 20px;"></div>
        `;
        
        // 선택지 HTML 생성
        const optionsHtml = question.options.map((option, index) => {
            const optionNumber = index + 1;
            
            // 2차 풀이: 1차에 맞았으면 정답 표시하고 클릭 불가
            if (wasCorrect && firstAttemptAnswer && firstAttemptAnswer.userAnswer === optionNumber) {
                return `
                    <div class="response-option retake-option-correct">
                        ${option}
                    </div>
                `;
            } else {
                // 틀렸거나 다른 보기: 클릭 가능
                return `
                    <div class="response-option" 
                         onclick="window.currentLectureComponent.selectOption(${index + 1})">
                        ${option}
                    </div>
                `;
            }
        }).join('');
        
        questionContentDiv.innerHTML = `
            ${audioPlayerHtml}
            <h3 class="conver-question">${question.questionText}</h3>
            <div class="conver-options">
                ${optionsHtml}
            </div>
        `;
        
        // 🎵 AudioPlayer 초기화 (URL 없어도 UI는 표시)
        if (window.AudioPlayer) {
            this.retakeAudioPlayer = new window.AudioPlayer('lectureAudioPlayerContainer', this.currentSetData.audioUrl || '');
            console.log('🎵 Lecture AudioPlayer 생성:', this.currentSetData.audioUrl ? '오디오 있음' : 'UI만');
        } else {
            console.error('❌ AudioPlayer 클래스를 찾을 수 없습니다');
        }
        
        // ✅ 이전에 선택한 답안 복원
        const questionKey = `${this.currentSetData.setId}_q${questionIndex + 1}`;
        const savedAnswer = this.answers[questionKey];
        if (savedAnswer) {
            const options = questionContentDiv.querySelectorAll('.response-option');
            options.forEach((opt, idx) => {
                if (idx + 1 === savedAnswer) {
                    opt.classList.add('selected');
                }
            });
            console.log(`✅ [LectureComponent] 답안 복원: ${questionKey} = ${savedAnswer}`);
        }
        
        console.log(`✅ [LectureComponent] 2차 풀이 렌더링 완료 - ${question.options.length}개 보기`);
    }
    
    /**
     * 타이머와 버튼 숨기기
     */
    hideTimer() {
        console.log('  ⏱️ [LectureComponent] 타이머 및 버튼 숨김 시작');
        
        // ✅ Lecture 타이머 숨기기
        const timerEl = document.getElementById('lectureTimer');
        if (timerEl && timerEl.parentElement) {
            timerEl.parentElement.style.display = 'none';
            console.log('  ✅ lectureTimer 숨김');
        }
        
        // ✅ ModuleController 타이머 정지
        if (window.moduleController) {
            // 전체 타이머 정지
            if (window.moduleController.stopTimer) {
                window.moduleController.stopTimer();
            }
            
            // 문제당 타이머 정지
            if (window.moduleController.stopQuestionTimer) {
                window.moduleController.stopQuestionTimer();
            }
        }
        
        // ✅ 모든 가능한 Next/Submit 버튼 숨기기
        const buttonsToHide = [
            'button[onclick*="nextQuestion"]',
            'button[onclick*="submitComponent"]',
            'button[onclick*="nextModule"]',
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
        const questionKey = `${this.currentSetData.setId}_q${this.currentQuestion + 1}`;
        return this.answers[questionKey] || null;
    }
}

// 전역 스코프에 노출
window.LectureComponent = LectureComponent;
