/**
 * EmailComponent.js
 * 라이팅 - 이메일 작성 컴포넌트
 * v=001
 * 
 * 특징:
 * - 텍스트 직접 입력 (Textarea)
 * - 편집 도구 (Cut, Paste, Undo, Redo)
 * - 단어수 카운트 + 1000단어 제한
 * - TXT 파일 자동 다운로드
 * - 6분 타이머 (360초)
 */

class EmailComponent {
    constructor(setNumber, onComplete) {
        console.log(`[EmailComponent] 생성 - setNumber: ${setNumber}`);
        
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
        
        // Undo/Redo
        this.undoStack = [];
        this.redoStack = [];
        
        // 단어수 관리
        this.wordCountVisible = true;
        this.MAX_WORD_COUNT = 1000;
        
        // 타이머 설정
        this.TIME_LIMIT = 420; // 7분
        
        // 구글 시트 설정
        this.SHEET_CONFIG = {
            spreadsheetId: '1Na3AmaqNeE2a3gcq7koj0TF2jGZhS7m8PFuk2S8rRfo',
            gid: '1586284898'
        };
    }
    
    /**
     * 컴포넌트 초기화
     */
    async init() {
        console.log('[EmailComponent] 초기화 시작');
        
        try {
            // 1. 데이터 로드
            await this.loadData();
            
            // 2. 세트 찾기
            const setId = `email_set_${String(this.setNumber).padStart(4, '0')}`;
            console.log(`[EmailComponent] 세트 검색 - ID: ${setId}`);
            
            const setIndex = this.findSetIndex(setId);
            if (setIndex === -1) {
                throw new Error(`세트를 찾을 수 없습니다: ${setId}`);
            }
            
            this.currentSetData = this.data.sets[setIndex];
            console.log('[EmailComponent] 세트 데이터 로드 완료:', this.currentSetData);
            
            // 3. 첫 번째 문제 로드
            this.loadQuestion(0);
            
            // 4. 화면 표시
            if (typeof window.showScreen === 'function') {
                window.showScreen('writingEmailScreen');
            }
            
            // 5. 이메일은 문제 1개 → Next 숨기고 Submit만 표시
            const nextBtn = document.getElementById('emailNextBtn');
            const submitBtn = document.getElementById('emailSubmitBtn');
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-block';
            
        } catch (error) {
            console.error('[EmailComponent] 초기화 실패:', error);
            alert('이메일 작성 데이터를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * 데이터 로드
     */
    async loadData() {
        console.log('[EmailComponent] 데이터 로드 시작');
        
        // 1) Supabase 우선 시도
        const supabaseResult = await this._loadFromSupabase();
        if (supabaseResult) {
            this.data = supabaseResult;
            return;
        }
        
        // 2) Google Sheets 폴백
        console.log('🔄 [EmailComponent] Google Sheets 폴백 시도...');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.SHEET_CONFIG.gid}`;
        console.log('[EmailComponent] CSV URL:', csvUrl);
        
        try {
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            console.log(`[EmailComponent] CSV 다운로드 완료 (${csvText.length} bytes)`);
            
            this.data = this.parseCSV(csvText);
            console.log('[EmailComponent] 파싱 완료:', this.data);
            
            if (!this.data || !this.data.sets || this.data.sets.length === 0) {
                throw new Error('데이터가 비어있습니다');
            }
            
        } catch (error) {
            console.error('[EmailComponent] 데이터 로드 실패, 데모 데이터 사용:', error);
            this.data = this.getDemoData();
        }
    }
    
    // --- Supabase에서 로드 ---
    async _loadFromSupabase() {
        if (typeof USE_SUPABASE !== 'undefined' && !USE_SUPABASE) return null;
        if (typeof supabaseSelect !== 'function') return null;
        
        try {
            console.log('📥 [EmailComponent] Supabase에서 데이터 로드...');
            const rows = await supabaseSelect('tr_writing_email', 'select=*&order=id.asc');
            
            if (!rows || rows.length === 0) {
                console.warn('⚠️ [EmailComponent] Supabase 데이터 없음');
                return null;
            }
            
            console.log(`✅ [EmailComponent] Supabase에서 ${rows.length}개 세트 로드 성공`);
            
            const sets = rows.map(row => {
                const bullets = [];
                for (let b = 1; b <= 3; b++) {
                    bullets.push({
                        bulletNum: b,
                        must: row[`bullet${b}_must`] || '',
                        sample: row[`bullet${b}_sample`] || '',
                        points: row[`bullet${b}_points`] || '',
                        key: row[`bullet${b}_key`] || ''
                    });
                }
                
                return {
                    id: row.id,
                    scenario: row.scenario || '',
                    task: row.task || '',
                    instruction1: row.instruction1 || '',
                    instruction2: row.instruction2 || '',
                    instruction3: row.instruction3 || '',
                    to: row.to_recipient || '',
                    subject: row.subject || '',
                    sampleAnswer: row.sample_answer || '',
                    bullets: bullets
                };
            });
            
            return { type: 'writing_email', timeLimit: this.TIME_LIMIT, sets };
            
        } catch (error) {
            console.error('❌ [EmailComponent] Supabase 로드 실패:', error);
            return null;
        }
    }
    
    /**
     * CSV 파싱 (21개 컬럼)
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log(`[EmailComponent] CSV 라인 수: ${lines.length}`);
        
        const sets = [];
        
        // 헤더 제외 (1부터 시작)
        for (let i = 1; i < lines.length; i++) {
            const columns = this.parseCSVLine(lines[i]);
            
            if (columns.length < 21) {
                console.warn(`[EmailComponent] 라인 ${i} 스킵 (컬럼 부족: ${columns.length}/21)`);
                continue;
            }
            
            const setId = columns[0].trim();
            
            console.log(`[EmailComponent] 세트 파싱: ${setId}`);
            
            // bullet 데이터 파싱 (각 bullet당 4개 필드)
            const bullets = [];
            for (let b = 0; b < 3; b++) {
                const baseIndex = 9 + (b * 4);  // 9, 13, 17
                bullets.push({
                    bulletNum: b + 1,
                    must: columns[baseIndex] || '',
                    sample: columns[baseIndex + 1] || '',
                    points: columns[baseIndex + 2] || '',
                    key: columns[baseIndex + 3] || ''
                });
            }
            
            sets.push({
                id: setId,
                scenario: columns[1].trim(),
                task: columns[2].trim(),
                instruction1: columns[3].trim(),
                instruction2: columns[4].trim(),
                instruction3: columns[5].trim(),
                to: columns[6].trim(),
                subject: columns[7].trim(),
                sampleAnswer: columns[8].trim(),
                bullets: bullets
            });
        }
        
        console.log(`[EmailComponent] 파싱된 세트 수: ${sets.length}`);
        
        if (sets.length === 0) {
            console.warn('[EmailComponent] CSV 데이터가 비어있음');
            return this.getDemoData();
        }
        
        return {
            type: 'writing_email',
            timeLimit: this.TIME_LIMIT,
            sets: sets
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
        return this.data.sets.findIndex(set => set.id === setId);
    }
    
    /**
     * 문제 로드
     */
    loadQuestion(questionIndex) {
        console.log(`[EmailComponent] 문제 ${questionIndex + 1} 로드`);
        
        this.currentQuestion = questionIndex;
        const set = this.data.sets[questionIndex];
        
        // 문제 렌더링
        this.renderQuestion(set);
        
        console.log(`[EmailComponent] 문제 ${questionIndex + 1} 로드 완료`);
    }
    
    /**
     * 문제 렌더링
     */
    renderQuestion(set) {
        // 왼쪽: 과제 설명
        const scenarioEl = document.getElementById('emailSituation');
        if (scenarioEl) scenarioEl.textContent = set.scenario || '';
        
        const taskEl = document.getElementById('emailTask');
        if (taskEl) taskEl.textContent = set.task || '';
        
        const inst1El = document.getElementById('emailInstruction1');
        if (inst1El) inst1El.textContent = set.instruction1 || '';
        
        const inst2El = document.getElementById('emailInstruction2');
        if (inst2El) inst2El.textContent = set.instruction2 || '';
        
        const inst3El = document.getElementById('emailInstruction3');
        if (inst3El) inst3El.textContent = set.instruction3 || '';
        
        // 오른쪽: 이메일 헤더
        const toEl = document.getElementById('emailTo');
        if (toEl) toEl.textContent = set.to || '';
        
        const subjectEl = document.getElementById('emailSubject');
        if (subjectEl) subjectEl.textContent = set.subject || '';
        
        // 이전 답안 불러오기
        const savedAnswer = this.answers[set.id] || '';
        
        const textarea = document.getElementById('emailTextarea');
        if (textarea) {
            textarea.value = savedAnswer;
            
            // DOM이 완전히 렌더링된 후 단어수 업데이트
            setTimeout(() => {
                this.updateWordCount();
            }, 100);
        }
        
        // Undo/Redo 스택 초기화
        this.undoStack = [savedAnswer];
        this.redoStack = [];
    }
    
    /**
     * 텍스트 입력 이벤트
     */
    onTextInput() {
        const textarea = document.getElementById('emailTextarea');
        if (!textarea) {
            console.error('[EmailComponent] emailTextarea를 찾을 수 없습니다');
            return;
        }
        
        const set = this.data.sets[this.currentQuestion];
        if (!set) {
            console.error('[EmailComponent] set을 찾을 수 없습니다');
            this.updateWordCount();
            return;
        }
        
        // 답안 저장
        this.answers[set.id] = textarea.value;
        
        // Undo 스택에 추가
        if (this.undoStack[this.undoStack.length - 1] !== textarea.value) {
            this.undoStack.push(textarea.value);
            this.redoStack = [];
        }
        
        this.updateWordCount();
    }
    
    /**
     * 단어수 카운트
     */
    updateWordCount() {
        const textarea = document.getElementById('emailTextarea');
        if (!textarea) {
            console.error('[EmailComponent] emailTextarea를 찾을 수 없습니다');
            return;
        }
        
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
        
        const wordCountElement = document.getElementById('emailWordCount');
        if (wordCountElement) {
            wordCountElement.textContent = words;
        }
        
        // 최대 단어수 체크
        if (words > this.MAX_WORD_COUNT) {
            const wordsArray = text.split(/\s+/).filter(word => word.length > 0);
            textarea.value = wordsArray.slice(0, this.MAX_WORD_COUNT).join(' ');
            this.updateWordCount();
        }
    }
    
    /**
     * Cut
     */
    cutText() {
        const textarea = document.getElementById('emailTextarea');
        const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        
        if (selectedText) {
            navigator.clipboard.writeText(selectedText);
            
            const newValue = textarea.value.substring(0, textarea.selectionStart) + 
                            textarea.value.substring(textarea.selectionEnd);
            textarea.value = newValue;
            
            this.onTextInput();
        }
    }
    
    /**
     * Paste
     */
    pasteText() {
        navigator.clipboard.readText().then(text => {
            const textarea = document.getElementById('emailTextarea');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            const newValue = textarea.value.substring(0, start) + text + textarea.value.substring(end);
            textarea.value = newValue;
            
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            
            this.onTextInput();
        });
    }
    
    /**
     * Undo
     */
    undoText() {
        if (this.undoStack.length > 1) {
            const current = this.undoStack.pop();
            this.redoStack.push(current);
            
            const previous = this.undoStack[this.undoStack.length - 1];
            document.getElementById('emailTextarea').value = previous;
            
            this.updateWordCount();
        }
    }
    
    /**
     * Redo
     */
    redoText() {
        if (this.redoStack.length > 0) {
            const next = this.redoStack.pop();
            this.undoStack.push(next);
            
            document.getElementById('emailTextarea').value = next;
            
            this.updateWordCount();
        }
    }
    
    /**
     * 단어수 표시/숨김
     */
    toggleWordCount() {
        this.wordCountVisible = !this.wordCountVisible;
        const wordCountElement = document.getElementById('emailWordCountDisplay');
        const toggleButton = document.getElementById('toggleWordCountBtn');
        
        if (this.wordCountVisible) {
            wordCountElement.style.display = 'inline';
            toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Word Count';
        } else {
            wordCountElement.style.display = 'none';
            toggleButton.innerHTML = '<i class="fas fa-eye"></i> Show Word Count';
        }
    }
    
    /**
     * 답안 다운로드 (문제 풀이 중)
     */
    downloadEmail() {
        const set = this.data.sets[this.currentQuestion];
        const answer = this.answers[set.id] || '';
        
        const content = `To: ${set.to}\nSubject: ${set.subject}\n\n${answer}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email_${set.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * 제출 & TXT 파일 다운로드
     */
    submit() {
        console.log('[EmailComponent] 제출 시작');
        
        const set = this.data.sets[this.currentQuestion];
        const userAnswer = document.getElementById('emailTextarea').value || '';
        const wordCount = userAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        console.log('[EmailComponent] 단어수:', wordCount);
        
        // TXT 파일 내용 생성
        const now = new Date();
        const dateStr = now.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        let txtContent = `====================================\n`;
        txtContent += `Writing - Email (${window.currentAttemptNumber === 2 ? '2차 작성' : '1차 작성'})\n`;
        txtContent += `제출 일시: ${dateStr}\n`;
        txtContent += `====================================\n\n`;
        
        txtContent += `[문제]\n`;
        txtContent += `Scenario: ${set.scenario || ''}\n\n`;
        txtContent += `Task: ${set.task || ''}\n`;
        txtContent += `  • ${set.instruction1 || ''}\n`;
        txtContent += `  • ${set.instruction2 || ''}\n`;
        txtContent += `  • ${set.instruction3 || ''}\n\n`;
        
        txtContent += `To: ${set.to || ''}\n`;
        txtContent += `Subject: ${set.subject || ''}\n\n`;
        
        txtContent += `------------------------------------\n\n`;
        
        txtContent += `[내 답안]\n`;
        txtContent += `${userAnswer}\n\n`;
        
        txtContent += `------------------------------------\n\n`;
        
        txtContent += `[단어 수]\n`;
        txtContent += `${wordCount} words\n\n`;
        
        txtContent += `====================================\n`;
        
        // TXT 파일 다운로드
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 파일명: Writing_Email_YYYYMMDD_HHMMSS.txt
        const fileName = `Writing_Email_${window.currentAttemptNumber === 2 ? '2차' : '1차'}_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}.txt`;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('[EmailComponent] 파일 다운로드 완료:', fileName);
        
        // 결과 데이터 구성
        const resultData = {
            weekDay: 'Week 1, 월요일',  // TODO: 실제 학습 일정 정보
            wordCount: wordCount,
            userAnswer: userAnswer,
            question: {
                scenario: set.scenario,
                task: set.task,
                instructions: [
                    set.instruction1,
                    set.instruction2,
                    set.instruction3
                ],
                to: set.to,
                subject: set.subject,
                sampleAnswer: set.sampleAnswer,
                bullets: set.bullets
            }
        };
        
        console.log('[EmailComponent] 채점 완료:', resultData);
        
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
            type: 'writing_email',
            timeLimit: 420,
            sets: [
                {
                    id: 'writing_email_1',
                    scenario: 'Your coworker, Kevin, recently recommended a new restaurant for your team to visit. You took the team there, but everyone was disappointed. The food was not as good as expected, and the service was slow. You need to inform Kevin about the situation and discuss future lunch options.',
                    task: 'Write an email to Kevin. In your email, do the following.',
                    instruction1: 'Explain what was wrong with the restaurant.',
                    instruction2: "Describe the team's reaction to the visit.",
                    instruction3: 'Suggest alternative lunch arrangements.',
                    to: 'Kevin',
                    subject: 'Team Lunch Experience',
                    sampleAnswer: `Dear Kevin,

I wanted to follow up regarding the restaurant recommendation you made last week. Unfortunately, I have to share some disappointing feedback about our team's experience there.

The main issue was that the food quality didn't meet our expectations. Several team members found their dishes underwhelming, and the flavors weren't as impressive as we'd hoped. Additionally, the service was quite slow, which made it difficult for everyone to get back to work on time.

I appreciate your suggestion, but I think we should explore other options for our future team lunches. Perhaps we could create a rotating list of restaurants that different team members recommend, so we can try a variety of places.

Let me know if you'd like to discuss this further.

Best regards,
[Your Name]`,
                    bullets: [
                        {
                            bulletNum: 1,
                            must: '레스토랑의 구체적인 문제점을 명확하게 설명해야 합니다.',
                            sample: 'The main issue was that the food quality didn\'t meet our expectations. Additionally, the service was quite slow.',
                            points: '음식 품질과 서비스 속도를 모두 언급합니다.',
                            key: '부정적 피드백을 정중하고 객관적으로 전달하는 것이 핵심입니다.'
                        },
                        {
                            bulletNum: 2,
                            must: '팀 전체의 반응과 경험을 공유해야 합니다.',
                            sample: 'Several team members found their dishes underwhelming.',
                            points: '집단의 의견임을 명확히 합니다.',
                            key: '팀 전체의 공통된 경험임을 전달합니다.'
                        },
                        {
                            bulletNum: 3,
                            must: '미래 점심 식사에 대한 건설적인 대안을 제시해야 합니다.',
                            sample: 'Perhaps we could create a rotating list of restaurants.',
                            points: '구체적이고 실행 가능한 제안을 합니다.',
                            key: '해결 방안을 제시하는 것이 중요합니다.'
                        }
                    ]
                }
            ]
        };
    }
}

// 전역 스코프에 노출
window.EmailComponent = EmailComponent;
