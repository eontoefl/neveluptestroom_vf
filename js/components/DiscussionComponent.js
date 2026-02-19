/**
 * ================================================
 * DiscussionComponent.js v=001
 * 토론형 글쓰기 컴포넌트
 * ================================================
 * 
 * 책임:
 * - 데이터 처리 (6): Sheet 로드/파싱/Demo 데이터
 * - 프로필 이미지 관리 (7): 교수/학생 이미지 + 이름 치환
 * - 문제 화면 (5): 수업 주제 + 학생 의견 렌더링
 * - 텍스트 편집 (7): 입력/저장/Undo/Redo/Cut/Paste
 * - 단어 수 관리 (4): 계산/표시/토글/1,000 단어 제한
 * - 제출 & 결과 (5): 제출/TXT 다운로드/결과 데이터 생성
 * - 내부 상태 + 타이머 (6): currentSet/Question/TIME_LIMIT/timer 변수/시작/중단
 * - 결과 화면 (7): 결과 표시/Bullet 하이라이트/문제 토글
 * 
 * 총 42개 요소
 */

class DiscussionComponent {
    constructor() {
        // ============================================
        // 1. 데이터 처리 (6개)
        // ============================================
        
        // Google Sheet 설정
        this.DISCUSSION_SHEET_CONFIG = {
            spreadsheetId: '1Na3AmaqNeE2a3gcq7koj0TF2jGZhS7m8PFuk2S8rRfo',
            sheetGid: '44517517'
        };
        
        // 데이터 저장
        this.writingDiscussionData = null;
        
        // ============================================
        // 2. 프로필 이미지 관리 (7개)
        // ============================================
        
        // 교수 프로필 (남/녀)
        this.PROFESSOR_PROFILES = {
            male: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_prof_M.png',
            female: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_prof_F.png'
        };
        
        // 여학생 프로필 (7명)
        this.FEMALE_STUDENT_PROFILES = [
            { name: 'Amy', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F1.png' },
            { name: 'Emma', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F2.png' },
            { name: 'Anna', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F3.png' },
            { name: 'Lucy', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F4.png' },
            { name: 'Mia', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F5.png' },
            { name: 'Lily', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F6.png' },
            { name: 'Sarah', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_F7.png' }
        ];
        
        // 남학생 프로필 (7명)
        this.MALE_STUDENT_PROFILES = [
            { name: 'Tom', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M1.png' },
            { name: 'Jack', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M2.png' },
            { name: 'Ben', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M3.png' },
            { name: 'Sam', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M4.png' },
            { name: 'John', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M5.png' },
            { name: 'Paul', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M6.png' },
            { name: 'Mark', image: 'https://eontoefl.github.io/toefl-audio/writing/discussion/image/discussion_image_M7.png' }
        ];
        
        // 현재 세트의 프로필 정보
        this.currentDiscussionProfiles = null;
        
        // ============================================
        // 3. 텍스트 편집 (답안 처리 포함, 7개)
        // ============================================
        
        // 답안 저장
        this.discussionAnswers = [];
        
        // Undo/Redo 스택
        this.discussionUndoStack = [];
        this.discussionRedoStack = [];
        
        // ============================================
        // 4. 단어 수 관리 (4개)
        // ============================================
        
        // 최대 단어 수 제한
        this.DISCUSSION_WORD_LIMIT = 1000;
        
        // ============================================
        // 5. 내부 상태 + 타이머 (6개)
        // ============================================
        
        // 현재 세트/문제 번호
        this.currentDiscussionSet = 0;
        this.currentDiscussionQuestion = 0;
        
        // 타이머 (9분 = 540초)
        this.DISCUSSION_TIME_LIMIT = 600;
        this.discussionTimer = null;
    }
    
    // ============================================
    // 데이터 처리 함수 (6개)
    // ============================================
    
    /**
     * 데이터 로드
     */
    async loadDiscussionData() {
        console.log('📥 [Discussion] 데이터 로드 시작...');
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.DISCUSSION_SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.DISCUSSION_SHEET_CONFIG.sheetGid}`;
        
        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('CSV 로드 실패');
            
            const csvText = await response.text();
            this.writingDiscussionData = this.parseDiscussionCSV(csvText);
            
            console.log('✅ [Discussion] 데이터 로드 성공:', this.writingDiscussionData);
            return this.writingDiscussionData;
        } catch (error) {
            console.error('❌ [Discussion] 데이터 로드 실패:', error);
            console.log('📦 Demo 데이터 사용');
            this.writingDiscussionData = this.getDiscussionDemoData();
            return this.writingDiscussionData;
        }
    }
    
    /**
     * CSV 파싱
     */
    parseDiscussionCSV(csvText) {
        console.log('🔄 [Discussion] CSV 파싱 시작...');
        
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            console.error('❌ CSV 데이터가 비어있습니다.');
            return [];
        }
        
        // 헤더 제거
        lines.shift();
        
        const sets = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const fields = this.parseCSVLine(line);
            
            // 21개 컬럼 예상 (weekDay 제거)
            if (fields.length < 21) {
                console.warn('⚠️ 컬럼 수 부족:', fields.length, '예상: 21');
                continue;
            }
            
            const setData = {
                setNumber: fields[0] || '',
                classContext: fields[1] || '',
                topic: fields[2] || '',
                student1Opinion: fields[3] || '',
                student2Opinion: fields[4] || '',
                sampleAnswer: fields[5] || '',
                // Bullet 1
                bullet1Sentence: fields[6] || '',
                bullet1ETS: fields[7] || '',
                bullet1Strategy: fields[8] || '',
                // Bullet 2
                bullet2Sentence: fields[9] || '',
                bullet2ETS: fields[10] || '',
                bullet2Strategy: fields[11] || '',
                // Bullet 3
                bullet3Sentence: fields[12] || '',
                bullet3ETS: fields[13] || '',
                bullet3Strategy: fields[14] || '',
                // Bullet 4 (선택)
                bullet4Sentence: fields[15] || '',
                bullet4ETS: fields[16] || '',
                bullet4Strategy: fields[17] || '',
                // Bullet 5 (선택)
                bullet5Sentence: fields[18] || '',
                bullet5ETS: fields[19] || '',
                bullet5Strategy: fields[20] || ''
            };
            
            // Bullets 배열 구성 (빈 값 제외)
            setData.bullets = [];
            for (let i = 1; i <= 5; i++) {
                const sentence = setData[`bullet${i}Sentence`];
                const ets = setData[`bullet${i}ETS`];
                const strategy = setData[`bullet${i}Strategy`];
                
                if (sentence && sentence.trim()) {
                    setData.bullets.push({
                        bulletNum: i,
                        sentence: sentence,
                        ets: ets || '',
                        strategy: strategy || ''
                    });
                }
            }
            
            sets.push(setData);
        }
        
        console.log(`✅ [Discussion] 파싱 완료: ${sets.length}개 세트`);
        return sets;
    }
    
    /**
     * CSV 한 줄 파싱 (쉼표+따옴표 처리)
     */
    parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        fields.push(currentField);
        return fields;
    }
    
    /**
     * Demo 데이터 (로드 실패 시 대체)
     */
    getDiscussionDemoData() {
        return [{
            setNumber: 'discussion_set_0001',
            weekDay: 'Week 1, 월요일',
            classContext: 'Your professor is teaching a class on environmental science.',
            topic: 'Should governments prioritize renewable energy over traditional energy sources?',
            student1Opinion: 'I believe governments should prioritize renewable energy because it reduces pollution and creates long-term sustainability. Investing in solar and wind power can help combat climate change.',
            student2Opinion: 'I think traditional energy sources are still necessary because renewable energy is not yet reliable enough to meet all our energy needs. We need a balanced approach.',
            sampleAnswer: 'I agree with {name1} that governments should prioritize renewable energy. First, renewable sources like solar and wind are sustainable and do not deplete natural resources. Second, they significantly reduce carbon emissions, which is crucial for addressing climate change. While {name2} raises a valid concern about reliability, advances in battery storage technology are making renewable energy more dependable. Therefore, investing in renewables is the best long-term strategy.',
            bullets: [
                {
                    bulletNum: 1,
                    sentence: 'First, renewable sources like solar and wind are sustainable and do not deplete natural resources.',
                    ets: 'ETS는 첫 번째 근거로 재생 에너지의 지속 가능성을 제시하길 원합니다.',
                    strategy: '"First" 등의 전환 표현으로 논리적 흐름을 명확히 하세요.'
                },
                {
                    bulletNum: 2,
                    sentence: 'Second, they significantly reduce carbon emissions, which is crucial for addressing climate change.',
                    ets: 'ETS는 두 번째 근거로 환경적 이점을 구체적으로 제시하길 원합니다.',
                    strategy: '"Second" 등의 전환 표현과 함께 구체적인 효과를 설명하세요.'
                },
                {
                    bulletNum: 3,
                    sentence: 'While {name2} raises a valid concern about reliability, advances in battery storage technology are making renewable energy more dependable.',
                    ets: 'ETS는 상대방 의견을 인정하면서도 반박하는 능력을 평가합니다.',
                    strategy: '"While..." 구조로 상대 의견을 언급한 후 자신의 주장을 강화하세요.'
                }
            ]
        }];
    }
    
    // ============================================
    // 프로필 이미지 관리 함수 (7개)
    // ============================================
    
    /**
     * 랜덤 프로필 선택 (교수 1명 + 학생 2명, 남/녀 조합)
     */
    getRandomProfiles() {
        // 교수 랜덤 (남/녀)
        const professorGender = Math.random() < 0.5 ? 'male' : 'female';
        const professorImage = this.PROFESSOR_PROFILES[professorGender];
        
        // 학생 2명 (남/녀 조합)
        const femaleStudent = this.FEMALE_STUDENT_PROFILES[Math.floor(Math.random() * this.FEMALE_STUDENT_PROFILES.length)];
        const maleStudent = this.MALE_STUDENT_PROFILES[Math.floor(Math.random() * this.MALE_STUDENT_PROFILES.length)];
        
        // 순서 랜덤 (50% 확률)
        const students = Math.random() < 0.5
            ? [femaleStudent, maleStudent]
            : [maleStudent, femaleStudent];
        
        return {
            professor: { image: professorImage },
            student1: students[0],
            student2: students[1]
        };
    }
    
    /**
     * 텍스트 내 학생 이름 치환 ({name1}, {name2} → 실제 이름)
     */
    replaceStudentNames(text, profiles) {
        if (!text || !profiles) return text;
        
        return text
            .replace(/\{name1\}/g, profiles.student1.name)
            .replace(/\{name2\}/g, profiles.student2.name);
    }
    
    /**
     * 결과 화면용 이름 치환
     */
    replaceStudentNamesInResult(text, profiles) {
        return this.replaceStudentNames(text, profiles);
    }
    
    // ============================================
    // 문제 화면 함수 (5개)
    // ============================================
    
    /**
     * 문제 로드
     */
    loadDiscussionQuestion(setIndex) {
        console.log(`📄 [Discussion] 문제 로드: Set ${setIndex}`);
        
        if (!this.writingDiscussionData || setIndex >= this.writingDiscussionData.length) {
            console.error('❌ 유효하지 않은 세트 인덱스:', setIndex);
            return;
        }
        
        this.currentDiscussionSet = setIndex;
        this.currentDiscussionQuestion = 0; // Discussion은 세트당 1문제
        
        // 프로필 랜덤 선택
        this.currentDiscussionProfiles = this.getRandomProfiles();
        
        // 전역 저장 (결과 화면에서 재사용)
        window.currentDiscussionProfiles = this.currentDiscussionProfiles;
        
        this.renderDiscussionQuestion();
    }
    
    /**
     * 문제 화면 렌더링
     */
    renderDiscussionQuestion() {
        const setData = this.writingDiscussionData[this.currentDiscussionSet];
        const profiles = this.currentDiscussionProfiles;
        
        console.log('🎨 [Discussion] 문제 렌더링:', setData);
        
        // Context 표시
        const contextElement = document.getElementById('discussionContext');
        if (contextElement) {
            contextElement.textContent = setData.classContext || '';
        }
        
        // Topic 표시
        const topicElement = document.getElementById('discussionTopic');
        if (topicElement) {
            topicElement.textContent = setData.topic || '';
        }
        
        // 교수 이미지
        const professorImageElement = document.getElementById('discussionProfessorImage');
        if (professorImageElement) {
            professorImageElement.src = profiles.professor.image;
        }
        
        // 학생 1
        const student1ImageElement = document.getElementById('discussionStudent1Image');
        const student1NameElement = document.getElementById('discussionStudent1Name');
        const student1OpinionElement = document.getElementById('discussionStudent1Opinion');
        
        if (student1ImageElement) {
            student1ImageElement.src = profiles.student1.image;
        }
        if (student1NameElement) {
            student1NameElement.textContent = profiles.student1.name;
        }
        if (student1OpinionElement) {
            const opinion = this.replaceStudentNames(setData.student1Opinion, profiles);
            student1OpinionElement.textContent = opinion;
        }
        
        // 학생 2
        const student2ImageElement = document.getElementById('discussionStudent2Image');
        const student2NameElement = document.getElementById('discussionStudent2Name');
        const student2OpinionElement = document.getElementById('discussionStudent2Opinion');
        
        if (student2ImageElement) {
            student2ImageElement.src = profiles.student2.image;
        }
        if (student2NameElement) {
            student2NameElement.textContent = profiles.student2.name;
        }
        if (student2OpinionElement) {
            const opinion = this.replaceStudentNames(setData.student2Opinion, profiles);
            student2OpinionElement.textContent = opinion;
        }
        
        // Textarea 복원
        const textarea = document.getElementById('discussionTextarea');
        if (textarea) {
            textarea.value = this.discussionAnswers[this.currentDiscussionSet] || '';
            
            // 입력 이벤트 바인딩
            textarea.oninput = () => this.onDiscussionTextInput();
            
            // 단어 수 업데이트
            this.updateDiscussionWordCount();
        }
    }
    
    // ============================================
    // 텍스트 편집 함수 (7개)
    // ============================================
    
    /**
     * Textarea 입력 이벤트
     */
    onDiscussionTextInput() {
        const textarea = document.getElementById('discussionTextarea');
        if (!textarea) return;
        
        // 답안 저장
        this.discussionAnswers[this.currentDiscussionSet] = textarea.value;
        
        // Undo 스택에 푸시
        this.discussionUndoStack.push(textarea.value);
        
        // Redo 스택 초기화
        this.discussionRedoStack = [];
        
        // 단어 수 업데이트
        this.updateDiscussionWordCount();
    }
    
    /**
     * 잘라내기
     */
    cutDiscussion() {
        const textarea = document.getElementById('discussionTextarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        if (start === end) return; // 선택 없음
        
        const selectedText = textarea.value.substring(start, end);
        
        // 클립보드에 복사
        navigator.clipboard.writeText(selectedText).then(() => {
            console.log('✂️ 잘라내기 완료');
            
            // 선택 텍스트 삭제
            textarea.value = textarea.value.substring(0, start) + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start;
            
            this.onDiscussionTextInput();
        }).catch(err => {
            console.error('❌ 잘라내기 실패:', err);
        });
    }
    
    /**
     * 붙여넣기
     */
    pasteDiscussion() {
        const textarea = document.getElementById('discussionTextarea');
        if (!textarea) return;
        
        navigator.clipboard.readText().then(clipboardText => {
            console.log('📋 붙여넣기:', clipboardText);
            
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // 현재 커서 위치에 삽입
            textarea.value = textarea.value.substring(0, start) + clipboardText + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + clipboardText.length;
            
            this.onDiscussionTextInput();
        }).catch(err => {
            console.error('❌ 붙여넣기 실패:', err);
        });
    }
    
    /**
     * 실행 취소 (Undo)
     */
    undoDiscussion() {
        if (this.discussionUndoStack.length === 0) {
            console.log('⚠️ Undo 스택이 비어있습니다.');
            return;
        }
        
        const textarea = document.getElementById('discussionTextarea');
        if (!textarea) return;
        
        // 현재 상태를 Redo 스택에 푸시
        this.discussionRedoStack.push(textarea.value);
        
        // Undo 스택에서 이전 상태 가져오기
        const previousState = this.discussionUndoStack.pop();
        textarea.value = previousState || '';
        
        this.discussionAnswers[this.currentDiscussionSet] = textarea.value;
        this.updateDiscussionWordCount();
        
        console.log('↶ Undo 완료');
    }
    
    /**
     * 다시 실행 (Redo)
     */
    redoDiscussion() {
        if (this.discussionRedoStack.length === 0) {
            console.log('⚠️ Redo 스택이 비어있습니다.');
            return;
        }
        
        const textarea = document.getElementById('discussionTextarea');
        if (!textarea) return;
        
        // 현재 상태를 Undo 스택에 푸시
        this.discussionUndoStack.push(textarea.value);
        
        // Redo 스택에서 다음 상태 가져오기
        const nextState = this.discussionRedoStack.pop();
        textarea.value = nextState || '';
        
        this.discussionAnswers[this.currentDiscussionSet] = textarea.value;
        this.updateDiscussionWordCount();
        
        console.log('↷ Redo 완료');
    }
    
    // ============================================
    // 단어 수 관리 함수 (4개)
    // ============================================
    
    /**
     * 단어 수 계산 및 표시
     */
    updateDiscussionWordCount() {
        const textarea = document.getElementById('discussionTextarea');
        const wordCountElement = document.getElementById('discussionWordCount');
        
        if (!textarea || !wordCountElement) return;
        
        const text = textarea.value.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        
        wordCountElement.textContent = wordCount;
        
        // 1,000단어 초과 시 경고
        if (wordCount > this.DISCUSSION_WORD_LIMIT) {
            wordCountElement.style.color = '#e74c3c';
            console.warn(`⚠️ 단어 수 초과: ${wordCount}/${this.DISCUSSION_WORD_LIMIT}`);
            
            // 입력 차단 (선택 사항)
            // textarea.value = textarea.value.split(/\s+/).slice(0, this.DISCUSSION_WORD_LIMIT).join(' ');
        } else {
            wordCountElement.style.color = '#2ecc71';
        }
    }
    
    /**
     * 단어 수 표시/숨김 토글
     */
    toggleDiscussionWordCount() {
        const wordCountContainer = document.getElementById('discussionWordCountContainer');
        if (!wordCountContainer) return;
        
        if (wordCountContainer.style.display === 'none') {
            wordCountContainer.style.display = 'block';
            console.log('👁️ 단어 수 표시');
        } else {
            wordCountContainer.style.display = 'none';
            console.log('🙈 단어 수 숨김');
        }
    }
    
    // ============================================
    // 타이머 함수 (6개 중 2개)
    // ============================================
    
    /**
     * 타이머 시작 (9분 = 540초)
     */
    startDiscussionTimer(onTimeUpdate, onTimeEnd) {
        console.log('⏱️ [Discussion] 타이머 시작: 540초');
        
        let remainingTime = this.DISCUSSION_TIME_LIMIT;
        
        // 초기 표시
        if (onTimeUpdate) onTimeUpdate(remainingTime);
        
        this.discussionTimer = setInterval(() => {
            remainingTime--;
            
            if (onTimeUpdate) onTimeUpdate(remainingTime);
            
            if (remainingTime <= 0) {
                console.log('⏰ [Discussion] 시간 종료!');
                this.stopDiscussionTimer();
                if (onTimeEnd) onTimeEnd();
            }
        }, 1000);
    }
    
    /**
     * 타이머 중단
     */
    stopDiscussionTimer() {
        if (this.discussionTimer) {
            clearInterval(this.discussionTimer);
            this.discussionTimer = null;
            console.log('⏹️ [Discussion] 타이머 중단');
        }
    }
    
    // ============================================
    // 제출 & 결과 함수 (5개)
    // ============================================
    
    /**
     * 제출
     */
    submit() {
        console.log('📤 [Discussion] 제출 시작...');
        
        // 타이머 중단
        this.stopDiscussionTimer();
        
        const setData = this.writingDiscussionData[this.currentDiscussionSet];
        const userAnswer = this.discussionAnswers[this.currentDiscussionSet] || '';
        const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
        
        console.log('📝 답안:', userAnswer);
        console.log('📊 단어 수:', wordCount);
        
        // TXT 파일 다운로드
        this.downloadDiscussion(setData, userAnswer, wordCount);
        
        // 결과 데이터 생성
        const resultData = {
            weekDay: setData.weekDay || 'Week 1, 월요일',
            wordCount: wordCount,
            userAnswer: userAnswer,
            question: {
                classContext: setData.classContext || '',
                topic: setData.topic || '',
                student1Opinion: setData.student1Opinion || '',
                student2Opinion: setData.student2Opinion || '',
                sampleAnswer: setData.sampleAnswer || '',
                bullets: setData.bullets || []
            }
        };
        
        console.log('✅ [Discussion] 결과 데이터:', resultData);
        
        // 데이터 초기화
        this.discussionAnswers = [];
        this.discussionUndoStack = [];
        this.discussionRedoStack = [];
        
        return resultData;
    }
    
    /**
     * TXT 파일 다운로드
     */
    downloadDiscussion(setData, userAnswer, wordCount) {
        const now = new Date();
        const dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        
        const filename = `Writing_Discussion_${dateStr}.txt`;
        
        const profiles = this.currentDiscussionProfiles;
        
        let content = '='.repeat(60) + '\n';
        content += '토론형 글쓰기 답안\n';
        content += '='.repeat(60) + '\n\n';
        content += `작성일시: ${now.toLocaleString('ko-KR')}\n`;
        content += `단어 수: ${wordCount}\n\n`;
        content += '-'.repeat(60) + '\n';
        content += '수업 정보\n';
        content += '-'.repeat(60) + '\n';
        content += `${setData.classContext}\n\n`;
        content += `토론 주제: ${setData.topic}\n\n`;
        content += '-'.repeat(60) + '\n';
        content += '학생 의견\n';
        content += '-'.repeat(60) + '\n';
        content += `${profiles.student1.name}: ${this.replaceStudentNames(setData.student1Opinion, profiles)}\n\n`;
        content += `${profiles.student2.name}: ${this.replaceStudentNames(setData.student2Opinion, profiles)}\n\n`;
        content += '-'.repeat(60) + '\n';
        content += '내 답안\n';
        content += '-'.repeat(60) + '\n';
        content += userAnswer + '\n\n';
        content += '='.repeat(60) + '\n';
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`💾 [Discussion] 파일 다운로드: ${filename}`);
    }
    
    // ============================================
    // 결과 화면 함수 (7개)
    // ============================================
    
    /**
     * 결과 화면 표시
     */
    showDiscussionResult(data) {
        console.log('💬 [토론형 채점] 결과 화면 표시:', data);
        
        if (!data) {
            console.error('❌ 채점 데이터가 없습니다.');
            return;
        }
        
        const profiles = window.currentDiscussionProfiles || {
            student1: { name: 'Student 1' },
            student2: { name: 'Student 2' }
        };
        
        // 제목 업데이트
        const titleElement = document.getElementById('discussionResultTitle');
        if (titleElement) {
            titleElement.textContent = data.weekDay || 'Week 1, 월요일';
        }
        
        // 단어 수 표시
        const wordCountElement = document.getElementById('discussionResultWordCount');
        const wordCountFeedbackElement = document.getElementById('discussionWordCountFeedback');
        
        if (wordCountElement) {
            wordCountElement.textContent = data.wordCount || 0;
        }
        
        // 단어 수 피드백
        if (wordCountFeedbackElement && data.wordCount) {
            const wordCount = data.wordCount;
            let feedbackText = '';
            let feedbackClass = '';
            
            if (wordCount >= 100 && wordCount <= 120) {
                feedbackText = '✨ Perfect! 최적의 단어 수입니다!';
                feedbackClass = 'perfect';
            } else if (wordCount < 100) {
                feedbackText = '💡 100~120단어가 만점 비율이 가장 높습니다. 조금 더 작성해보세요!';
                feedbackClass = 'too-short';
            } else {
                feedbackText = '⚠️ 너무 많은 글은 퀄리티를 낮춥니다. 100~120단어가 충분합니다!';
                feedbackClass = 'too-long';
            }
            
            wordCountFeedbackElement.textContent = feedbackText;
            wordCountFeedbackElement.className = `word-count-feedback ${feedbackClass}`;
        }
        
        // 문제 정보 표시
        if (data.question) {
            const contextElement = document.getElementById('discussionResultContext');
            if (contextElement && data.question.classContext) {
                contextElement.textContent = data.question.classContext;
            }
            
            const topicElement = document.getElementById('discussionResultTopic');
            if (topicElement && data.question.topic) {
                topicElement.textContent = data.question.topic;
            }
        }
        
        // 내 답안 표시
        const userAnswerElement = document.getElementById('discussionResultUserAnswer');
        if (userAnswerElement) {
            userAnswerElement.textContent = data.userAnswer || '(답안이 없습니다)';
        }
        
        // 모범 답안 표시 (Bullet 하이라이트)
        this.renderSampleAnswerWithBullets(data, profiles);
        
        // Bullet 피드백 데이터 저장
        window.discussionBulletsData = data.question && data.question.bullets ? data.question.bullets : [];
        
        // 피드백 박스 초기화
        const bulletsElement = document.getElementById('discussionResultBullets');
        if (bulletsElement) {
            bulletsElement.classList.remove('show');
            bulletsElement.innerHTML = '';
        }
    }
    
    /**
     * 모범 답안에 Bullet 하이라이트 추가
     */
    renderSampleAnswerWithBullets(data, profiles) {
        const sampleAnswerElement = document.getElementById('discussionResultSampleAnswer');
        if (!sampleAnswerElement || !data.question || !data.question.sampleAnswer) return;
        
        // <br> 태그를 실제 줄바꿈으로 변환
        let formattedAnswer = data.question.sampleAnswer.replace(/<br\s*\/?>/gi, '\n');
        
        // 학생 이름 치환
        formattedAnswer = this.replaceStudentNames(formattedAnswer, profiles);
        
        // Bullet 하이라이트 추가
        if (data.question.bullets && Array.isArray(data.question.bullets)) {
            // bullets를 역순으로 정렬 (긴 텍스트 먼저 처리)
            const sortedBullets = [...data.question.bullets].sort((a, b) => {
                return (b.sentence?.length || 0) - (a.sentence?.length || 0);
            });
            
            sortedBullets.forEach(bullet => {
                if (bullet.sentence) {
                    const sentenceText = bullet.sentence.replace(/<br\s*\/?>/gi, '\n');
                    const replacedSentence = this.replaceStudentNames(sentenceText, profiles);
                    
                    if (formattedAnswer.includes(replacedSentence)) {
                        formattedAnswer = formattedAnswer.replace(
                            replacedSentence,
                            `{{HIGHLIGHT_START_${bullet.bulletNum}}}${replacedSentence}{{HIGHLIGHT_END_${bullet.bulletNum}}}`
                        );
                    }
                }
            });
        }
        
        // 텍스트로 설정 후 하이라이트를 HTML로 변환
        sampleAnswerElement.textContent = formattedAnswer;
        let htmlContent = sampleAnswerElement.innerHTML;
        
        // 하이라이트 마커를 실제 HTML 요소로 변환
        for (let i = 1; i <= 8; i++) {
            const regex = new RegExp(`\\{\\{HIGHLIGHT_START_${i}\\}\\}([\\s\\S]*?)\\{\\{HIGHLIGHT_END_${i}\\}\\}`, 'g');
            htmlContent = htmlContent.replace(
                regex,
                `<span class="bullet-highlight" data-bullet="${i}" onclick="window.currentDiscussionComponent.showDiscussionBulletFeedback(${i}, event)">$1</span>`
            );
        }
        
        sampleAnswerElement.innerHTML = htmlContent;
    }
    
    /**
     * Bullet 피드백 표시 (하이라이트 클릭 시)
     */
    showDiscussionBulletFeedback(bulletNum, event) {
        console.log(`🎯 Bullet ${bulletNum} 클릭됨`);
        
        const bulletsElement = document.getElementById('discussionResultBullets');
        if (!bulletsElement || !window.discussionBulletsData) return;
        
        const bullet = window.discussionBulletsData.find(b => b.bulletNum === bulletNum);
        if (!bullet) return;
        
        // 모든 하이라이트의 active 클래스 제거
        document.querySelectorAll('.bullet-highlight').forEach(highlight => {
            highlight.classList.remove('active');
        });
        
        // 클릭한 하이라이트에 active 클래스 추가
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        // Bullet 피드백 HTML 생성
        const bulletHtml = `
            <div class="bullet-item">
                <div class="bullet-header">
                    <span class="bullet-number">📝 문장 ${bullet.bulletNum}</span>
                </div>
                <div class="bullet-content">
                    <div class="bullet-section">
                        <div class="bullet-label">✅ ETS가 요구하는 필수 요소</div>
                        <div class="bullet-text">${bullet.ets}</div>
                    </div>
                    <div class="bullet-section">
                        <div class="bullet-label">🎯 효과적인 작성 전략</div>
                        <div class="bullet-text strategy-text">${bullet.strategy}</div>
                    </div>
                </div>
            </div>
        `;
        
        bulletsElement.innerHTML = bulletHtml;
        bulletsElement.classList.add('show');
        
        // 피드백 박스로 부드럽게 스크롤
        setTimeout(() => {
            bulletsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
    
    /**
     * 문제 보기 토글
     */
    toggleDiscussionProblem() {
        const problemDiv = document.getElementById('discussionResultProblem');
        const toggleIcon = document.getElementById('discussionProblemToggleIcon');
        const toggleButton = document.querySelector('.discussion-result-toggle');
        
        if (problemDiv && toggleIcon) {
            if (problemDiv.style.display === 'none') {
                problemDiv.style.display = 'block';
                toggleIcon.classList.add('fa-chevron-up');
                toggleIcon.classList.remove('fa-chevron-down');
                if (toggleButton) toggleButton.classList.add('active');
            } else {
                problemDiv.style.display = 'none';
                toggleIcon.classList.add('fa-chevron-down');
                toggleIcon.classList.remove('fa-chevron-up');
                if (toggleButton) toggleButton.classList.remove('active');
            }
        }
    }
}

// ============================================
// 전역 초기화
// ============================================
console.log('✅ DiscussionComponent 클래스 로드 완료 (v=001)');
