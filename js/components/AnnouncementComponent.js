/**
 * AnnouncementComponent.js
 * 듣기 - 공지사항 듣고 응답 고르기 컴포넌트
 * v=003_fix
 * - scriptHighlight → scriptTrans 수정 (CSV columns[5]는 scriptTrans)
 * - scriptHighlights 추가 (CSV 마지막 컬럼)
 * - submit()에 scriptTrans, scriptHighlights, questionTextTrans 포함
 */

// ✅ 캐시 시스템 추가
let cachedAnnouncementData = null;

window.clearAnnouncementCache = function() {
  console.log('🔄 [AnnouncementComponent] 캐시 초기화');
  cachedAnnouncementData = null;
};

class AnnouncementComponent {
    constructor(setNumber, config = {}) {
        console.log(`[AnnouncementComponent] 생성 - setNumber: ${setNumber}`);
        
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
        
        // 구글 시트 설정
        this.SHEET_CONFIG = {
            spreadsheetId: '1srFVmFnRa8A73isTO_Vk3yfU1bQWVroHUui8XvYf9e0',
            gid: '840514208'
        };
        
        // 성별별 이미지
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
        console.log('[AnnouncementComponent] 초기화 시작');
        
        // 화면 전환
        showScreen('listeningAnnouncementScreen');
        
        try {
            // 1. 데이터 로드
            await this.loadData();
            
            // 2. 세트 찾기 (announcement_set_XXXX 형식)
            let setId;
            if (typeof this.setNumber === 'string' && this.setNumber.includes('_set_')) {
                setId = this.setNumber;
            } else {
                setId = `announcement_set_${String(this.setNumber).padStart(4, '0')}`;
            }
            console.log(`[AnnouncementComponent] 세트 검색 - ID: ${setId}`);
            
            const setIndex = this.findSetIndex(setId);
            if (setIndex === -1) {
                throw new Error(`세트를 찾을 수 없습니다: ${setId}`);
            }
            
            this.currentSetData = this.data.sets[setIndex];
            console.log('[AnnouncementComponent] 세트 데이터 로드 완료:', this.currentSetData);
            
            // 3. 인트로 화면 표시
            this.showIntro();
            
        } catch (error) {
            console.error('[AnnouncementComponent] 초기화 실패:', error);
            alert('공지사항 듣기 데이터를 불러오는데 실패했습니다.');
        }
    }
    
    /**
     * 데이터 로드
     */
    async loadData(forceReload = false) {
        console.log('[AnnouncementComponent] 데이터 로드 시작');
        
        // ✅ 캐시 확인
        if (!forceReload && cachedAnnouncementData) {
            console.log('✅ [AnnouncementComponent] 캐시된 데이터 사용 (이미 정렬됨)');
            console.log('  캐시 데이터 세트 순서:', cachedAnnouncementData.sets.map(s => s.setId));
            this.data = cachedAnnouncementData;
            return;
        }
        
        // 1) Supabase 우선 시도
        const supabaseResult = await this._loadFromSupabase();
        if (supabaseResult) {
            this.data = supabaseResult;
            cachedAnnouncementData = supabaseResult;
            return;
        }
        
        // 2) Google Sheets 폴백
        console.log('🔄 [AnnouncementComponent] Google Sheets 폴백 시도...');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.SHEET_CONFIG.gid}`;
        console.log('[AnnouncementComponent] CSV URL:', csvUrl);
        
        try {
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            console.log(`[AnnouncementComponent] CSV 다운로드 완료 (${csvText.length} bytes)`);
            
            this.data = this.parseCSV(csvText);
            console.log('[AnnouncementComponent] 파싱 완료:', this.data);
            
            if (!this.data || !this.data.sets || this.data.sets.length === 0) {
                throw new Error('데이터가 비어있습니다');
            }
            
            // ✅ 캐시 저장
            cachedAnnouncementData = this.data;
            
        } catch (error) {
            console.error('[AnnouncementComponent] 데이터 로드 실패, 데모 데이터 사용:', error);
            this.data = this.getDemoData();
            
            // ✅ 데모 데이터도 캐시
            cachedAnnouncementData = this.data;
        }
    }
    
    // --- Supabase에서 로드 ---
    async _loadFromSupabase() {
        if (typeof USE_SUPABASE !== 'undefined' && !USE_SUPABASE) return null;
        if (typeof supabaseSelect !== 'function') return null;
        
        try {
            console.log('📥 [AnnouncementComponent] Supabase에서 데이터 로드...');
            const rows = await supabaseSelect('tr_listening_announcement', 'select=*&order=id.asc');
            
            if (!rows || rows.length === 0) {
                console.warn('⚠️ [AnnouncementComponent] Supabase 데이터 없음');
                return null;
            }
            
            console.log(`✅ [AnnouncementComponent] Supabase에서 ${rows.length}개 세트 로드 성공`);
            
            const sets = rows.map(row => {
                // scriptHighlights 파싱
                let scriptHighlights = '';
                if (row.script_highlights) scriptHighlights = row.script_highlights;
                
                return {
                    setId: row.id,
                    gender: row.gender || '',
                    narrationUrl: row.narration_url || '',
                    audioUrl: row.audio_url || '',
                    script: row.script || '',
                    scriptTrans: row.script_trans || '',
                    scriptHighlights: scriptHighlights,
                    questions: [
                        {
                            questionText: row.q1_question_text || '',
                            questionTextTrans: row.q1_question_text_trans || '',
                            options: [row.q1_opt1 || '', row.q1_opt2 || '', row.q1_opt3 || '', row.q1_opt4 || ''],
                            correctAnswer: parseInt(row.q1_correct_answer) || 1,
                            translations: [row.q1_trans1 || '', row.q1_trans2 || '', row.q1_trans3 || '', row.q1_trans4 || ''],
                            explanations: [row.q1_exp1 || '', row.q1_exp2 || '', row.q1_exp3 || '', row.q1_exp4 || '']
                        },
                        {
                            questionText: row.q2_question_text || '',
                            questionTextTrans: row.q2_question_text_trans || '',
                            options: [row.q2_opt1 || '', row.q2_opt2 || '', row.q2_opt3 || '', row.q2_opt4 || ''],
                            correctAnswer: parseInt(row.q2_correct_answer) || 1,
                            translations: [row.q2_trans1 || '', row.q2_trans2 || '', row.q2_trans3 || '', row.q2_trans4 || ''],
                            explanations: [row.q2_exp1 || '', row.q2_exp2 || '', row.q2_exp3 || '', row.q2_exp4 || '']
                        }
                    ]
                };
            });
            
            sets.sort((a, b) => {
                const numA = parseInt(a.setId.replace(/\D/g, ''));
                const numB = parseInt(b.setId.replace(/\D/g, ''));
                return numA - numB;
            });
            
            return { type: 'listening_announcement', sets };
            
        } catch (error) {
            console.error('❌ [AnnouncementComponent] Supabase 로드 실패:', error);
            return null;
        }
    }
    
    /**
     * CSV 파싱
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        console.log(`[AnnouncementComponent] CSV 라인 수: ${lines.length}`);
        
        const sets = [];
        
        for (let i = 1; i < lines.length; i++) {
            const columns = this.parseCSVLine(lines[i]);
            
            if (columns.length < 37) {
                console.warn(`[AnnouncementComponent] 라인 ${i} 스킵 (컬럼 부족: ${columns.length})`);
                continue;
            }
            
            const rawSetId = columns[0].trim();
            // ID 정규화: announcement_set_0001 형식 그대로 사용
            let normalizedSetId = rawSetId;
            if (/^\d+$/.test(rawSetId)) {
                // 숫자만: "1" → "announcement_set_0001"
                normalizedSetId = `announcement_set_${String(rawSetId).padStart(4, '0')}`;
            }
            // 다른 형식은 그대로 사용
            
            const setData = {
                setId: normalizedSetId,
                gender: columns[1].trim(), // 🆕 성별
                narrationUrl: this.convertGoogleDriveUrl(columns[2].trim()), // 🆕 나레이션 URL
                audioUrl: this.convertGoogleDriveUrl(columns[3].trim()),
                script: columns[4].trim(),
                scriptTrans: columns[5].trim(),
                scriptHighlights: columns[37] ? columns[37].trim() : '',
                questions: [
                    {
                        questionText: columns[6].trim(),
                        questionTextTrans: columns[7].trim(),
                        options: [
                            columns[8].trim(),
                            columns[9].trim(),
                            columns[10].trim(),
                            columns[11].trim()
                        ],
                        correctAnswer: parseInt(columns[12].trim()),
                        translations: [
                            columns[13].trim(),
                            columns[14].trim(),
                            columns[15].trim(),
                            columns[16].trim()
                        ],
                        explanations: [
                            columns[17].trim(),
                            columns[18].trim(),
                            columns[19].trim(),
                            columns[20].trim()
                        ]
                    },
                    {
                        questionText: columns[21].trim(),
                        questionTextTrans: columns[22].trim(),
                        options: [
                            columns[23].trim(),
                            columns[24].trim(),
                            columns[25].trim(),
                            columns[26].trim()
                        ],
                        correctAnswer: parseInt(columns[27].trim()),
                        translations: [
                            columns[28].trim(),
                            columns[29].trim(),
                            columns[30].trim(),
                            columns[31].trim()
                        ],
                        explanations: [
                            columns[33].trim(),
                            columns[34].trim(),
                            columns[35].trim(),
                            columns[36].trim()
                        ]
                    }
                ]
            };
            
            sets.push(setData);
        }
        
        // ✅ Set ID 기준으로 정렬 (announcement_set_0001, announcement_set_0002, ...)
        console.log('🔄 [AnnouncementComponent] 정렬 전 순서:', sets.map(s => s.setId));
        
        sets.sort((a, b) => {
            const numA = parseInt(a.setId.replace(/\D/g, ''));
            const numB = parseInt(b.setId.replace(/\D/g, ''));
            console.log(`  비교: ${a.setId} (${numA}) vs ${b.setId} (${numB}) → ${numA - numB}`);
            return numA - numB;
        });
        
        console.log('✅ [AnnouncementComponent] 정렬 후 순서:', sets.map(s => s.setId));
        
        // 디버깅: 최종 데이터 검증
        sets.forEach((set, idx) => {
            console.log(`  [${idx}] ${set.setId} - ${set.questions.length}문제`);
        });
        
        console.log(`[AnnouncementComponent] 파싱된 세트 수: ${sets.length}`);
        
        return {
            type: 'listening_announcement',
            timeLimit: 20,
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
        // ✅ setId를 announcement_set_XXXX 형식으로 변환
        let targetSetId;
        if (typeof setId === 'string' && setId.includes('_set_')) {
            // 이미 "announcement_set_0001" 형식이면 그대로 사용
            targetSetId = setId;
            console.log(`🔍 [findSetIndex] setId 문자열 직접 사용: ${targetSetId}`);
        } else {
            // 숫자면 "announcement_set_XXXX" 형식으로 변환
            targetSetId = `announcement_set_${String(setId).padStart(4, '0')}`;
            console.log(`🔍 [findSetIndex] setId ${setId} → targetSetId: ${targetSetId}`);
        }
        
        console.log(`[AnnouncementComponent] 세트 검색 - ID: ${targetSetId}`);
        
        const index = this.data.sets.findIndex(set => set.setId === targetSetId);
        console.log(`[AnnouncementComponent] 세트 인덱스: ${index}`);
        return index;
    }
    
    /**
     * 인트로 화면 표시
     */
    showIntro() {
        console.log('[AnnouncementComponent] 인트로 화면 표시');
        
        this.showingIntro = true;
        
        // ★ 오디오 재생 중 Review 버튼 숨김
        const reviewBtn = document.querySelector('#listeningAnnouncementScreen .review-btn');
        if (reviewBtn) reviewBtn.style.display = 'none';
        
        // 성별에 따라 이미지 선택 (직전 이미지 제외)
        const gender = this.currentSetData.gender.toLowerCase().trim();
        const isFemale = gender === 'female' || gender === 'f';
        const images = isFemale ? this.FEMALE_IMAGES : this.MALE_IMAGES;
        const lastKey = isFemale ? '_lastFemaleImage' : '_lastMaleImage';
        if (!AnnouncementComponent[lastKey]) AnnouncementComponent[lastKey] = null;
        const last = AnnouncementComponent[lastKey];
        const candidates = (last && images.length > 1) ? images.filter(img => img !== last) : images;
        this.currentImage = candidates[Math.floor(Math.random() * candidates.length)];
        AnnouncementComponent[lastKey] = this.currentImage;
        
        console.log(`[AnnouncementComponent] 성별: ${gender}, 여성: ${isFemale}, 선택된 이미지:`, this.currentImage);
        
        // 인트로 화면에 이미지 표시 (Conver 스타일)
        const introImageDiv = document.getElementById('announcementIntroImage');
        if (introImageDiv) {
            introImageDiv.innerHTML = `
                <img src="${this.currentImage}" alt="Announcement" 
                     style="width: 100%; max-width: 450px; height: auto; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); object-fit: cover;"
                     onerror="console.error('❌ 공지사항 이미지 로드 실패:', this.src);"
                     onload="console.log('✅ 공지사항 이미지 로드 성공:', this.src);">
            `;
        }
        
        // 인트로 화면 표시
        document.getElementById('announcementIntroScreen').style.display = 'block';
        document.getElementById('announcementQuestionScreen').style.display = 'none';
        
        // 진행률/타이머 숨기기 (인트로 중에는 안 보임)
        // 진행률/타이머/Next버튼 숨김 (인트로 동안)
        document.getElementById('announcementProgress').style.display = 'none';
        document.getElementById('announcementTimer').style.display = 'none';
        const annTimerWrap = document.getElementById('announcementTimerWrap');
        if (annTimerWrap) annTimerWrap.style.display = 'none';
        const annNextBtn = document.getElementById('announcementNextBtn');
        if (annNextBtn) annNextBtn.style.display = 'none';
        const annSubmitBtn = document.getElementById('announcementSubmitBtn');
        if (annSubmitBtn) annSubmitBtn.style.display = 'none';
        
        // 오디오 시퀀스 시작
        this.playAudioSequence();
    }
    
    /**
     * 오디오 시퀀스 재생
     * 2초 대기 → 나레이션 → 2초 대기 → 공지사항 오디오
     */
    playAudioSequence() {
        console.log('[AnnouncementComponent] 오디오 시퀀스 시작');
        
        // 2초 대기
        setTimeout(() => {
            console.log('[AnnouncementComponent] 나레이션 재생 시작');
            this.playNarration(() => {
                // 나레이션 끝난 후 2초 대기
                setTimeout(() => {
                    console.log('[AnnouncementComponent] 공지사항 오디오 재생 시작');
                    this.playMainAudio(() => {
                        console.log('[AnnouncementComponent] 오디오 시퀀스 완료, 문제 화면으로 전환');
                        this.showQuestions();
                    });
                }, 2000);
            });
        }, 2000);
    }
    
    /**
     * 나레이션 재생
     */
    playNarration(onEnded) {
        const narrationUrl = this.currentSetData.narrationUrl;
        console.log('[AnnouncementComponent] 나레이션 URL:', narrationUrl);
        
        if (!narrationUrl) {
            console.warn('[AnnouncementComponent] 나레이션 URL 없음, 스킵');
            if (onEnded) onEnded();
            return;
        }
        
        this.audioPlayer = new Audio(narrationUrl);
        this.audioPlayer.onended = () => {
            console.log('[AnnouncementComponent] 나레이션 재생 완료');
            if (onEnded) onEnded();
        };
        this.audioPlayer.onerror = (e) => {
            console.error('[AnnouncementComponent] 나레이션 재생 오류:', e);
            if (onEnded) onEnded();
        };
        this.audioPlayer.play().catch(err => {
            console.error('[AnnouncementComponent] 나레이션 재생 실패:', err);
            if (onEnded) onEnded();
        });
    }
    
    /**
     * 공지사항 오디오 재생
     */
    playMainAudio(onEnded) {
        const audioUrl = this.currentSetData.audioUrl;
        console.log('[AnnouncementComponent] 공지사항 오디오 URL:', audioUrl);
        
        if (!audioUrl) {
            console.warn('[AnnouncementComponent] 공지사항 오디오 URL 없음, 스킵');
            if (onEnded) onEnded();
            return;
        }
        
        this.audioPlayer = new Audio(audioUrl);
        this.audioPlayer.onended = () => {
            console.log('[AnnouncementComponent] 공지사항 오디오 재생 완료');
            if (onEnded) onEnded();
        };
        this.audioPlayer.onerror = (e) => {
            console.error('[AnnouncementComponent] 공지사항 오디오 재생 오류:', e);
            if (onEnded) onEnded();
        };
        this.audioPlayer.play().catch(err => {
            console.error('[AnnouncementComponent] 공지사항 오디오 재생 실패:', err);
            if (onEnded) onEnded();
        });
    }
    
    /**
     * 문제 화면 표시
     */
    showQuestions() {
        console.log('[AnnouncementComponent] 문제 화면으로 전환');
        
        this.showingIntro = false;
        
        // ★ 문제 화면 전환 시 Review 버튼 복원
        const reviewBtn = document.querySelector('#listeningAnnouncementScreen .review-btn');
        if (reviewBtn) reviewBtn.style.display = '';
        
        document.getElementById('announcementIntroScreen').style.display = 'none';
        document.getElementById('announcementQuestionScreen').style.display = 'block';
        
        // 진행률/타이머/Next버튼 표시 (문제 풀이 시작)
        document.getElementById('announcementProgress').style.display = 'inline-block';
        document.getElementById('announcementTimer').style.display = 'inline-block';
        const annTimerWrap = document.getElementById('announcementTimerWrap');
        if (annTimerWrap) annTimerWrap.style.display = '';
        const annNextBtn = document.getElementById('announcementNextBtn');
        if (annNextBtn) annNextBtn.style.display = '';
        
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
        console.log(`[AnnouncementComponent] 문제 ${questionIndex + 1} 로드`);
        
        this.currentQuestion = questionIndex;
        const question = this.currentSetData.questions[questionIndex];
        
        // 진행률 업데이트 (ModuleController에 알림)
        if (window.moduleController) {
            window.moduleController.updateCurrentQuestionInComponent(questionIndex);
        }
        
        // 타이머 리셋 (다음 문제로 넘어갈 때)
        if (questionIndex > 0 && window.moduleController) {
            window.moduleController.stopQuestionTimer();
            window.moduleController.startQuestionTimer(20);
        }
        
        // 작은 이미지 표시
        this.renderSmallImage();
        
        // 질문 + 선택지 표시 (Conver 방식)
        this.renderQuestion(question);
        
        // 저장된 답안 복원
        this.restoreAnswer(questionIndex);
        
        console.log(`[AnnouncementComponent] 문제 ${questionIndex + 1} 로드 완료`);
    }
    
    /**
     * 작은 이미지 렌더링
     */
    renderSmallImage() {
        const smallImageDiv = document.getElementById('announcementSmallImage');
        if (smallImageDiv && this.currentImage) {
            smallImageDiv.innerHTML = `
                <img src="${this.currentImage}" alt="Announcement" 
                     style="width: 100%; height: auto; object-fit: cover; border-radius: 12px; display: block;">
            `;
        }
    }
    
    /**
     * 질문 + 선택지 렌더링 (Conver 스타일)
     */
    renderQuestion(question) {
        console.log('[AnnouncementComponent] 질문 렌더링');
        
        const container = document.getElementById('announcementQuestionContent');
        if (!container) return;
        
        const questionKey = `${this.currentSetData.setId}_q${this.currentQuestion + 1}`;
        const savedAnswer = this.answers[questionKey];
        
        const optionsHtml = question.options.map((option, index) => {
            const selectedClass = savedAnswer === (index + 1) ? 'selected' : '';
            
            return `
                <div class="response-option ${selectedClass}" 
                     onclick="window.currentAnnouncementComponent.selectOption(${index + 1})">
                    ${option}
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <h3 class="conver-question">${question.questionText}</h3>
            <div class="conver-options">
                ${optionsHtml}
            </div>
        `;
    }
    
    /**
     * 저장된 답안 복원
     */
    restoreAnswer(questionIndex) {
        if (this.answers[questionIndex] !== undefined) {
            const selectedIndex = this.answers[questionIndex];
            const optionItems = document.querySelectorAll('#listeningAnnouncementOptions .option-item');
            optionItems.forEach((item, index) => {
                if (index === selectedIndex) {
                    item.classList.add('selected');
                }
            });
        }
    }
    
    /**
     * 선택지 선택
     */
    selectOption(optionIndex) {
        console.log(`[AnnouncementComponent] 선택지 ${optionIndex} 선택됨`);
        
        // ✅ 수정: '_a'로 통일 (실제 저장되는 키 형식에 맞춤)
        const questionKey = `${this.currentSetData.setId}_a${this.currentQuestion + 1}`;
        this.answers[questionKey] = optionIndex;
        
        console.log(`[AnnouncementComponent] 답안 저장 - key: ${questionKey}, value: ${optionIndex}`);
        
        // UI 업데이트: 모든 선택지에서 selected 제거
        const allOptions = document.querySelectorAll('#announcementQuestionContent .response-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // 선택된 항목에 selected 추가 (0-based index)
        if (allOptions[optionIndex - 1]) {
            allOptions[optionIndex - 1].classList.add('selected');
        }
        
        console.log('[AnnouncementComponent] 현재 답안:', this.answers);
    }
    
    /**
     * 다음 문제로 이동
     */
    nextQuestion() {
        if (this.currentQuestion < this.currentSetData.questions.length - 1) {
            this.loadQuestion(this.currentQuestion + 1);
            return true;
        }
        console.log('[AnnouncementComponent] 마지막 문제입니다');
        return false;
    }
    
    /**
     * 제출 & 채점
     */
    submit() {
        console.log('[AnnouncementComponent] 제출 시작');
        console.log('[AnnouncementComponent] 최종 답안:', this.answers);
        console.log('[AnnouncementComponent] currentSetData.setId:', this.currentSetData.setId);
        
        // 답안 채점
        const results = [];
        let totalCorrect = 0;
        let totalIncorrect = 0;
        
        this.currentSetData.questions.forEach((question, index) => {
            // ✅ 수정: questionKey로 답안 찾기 (q 또는 a 둘 다 체크)
            const questionKeyQ = `${this.currentSetData.setId}_q${index + 1}`;
            const questionKeyA = `${this.currentSetData.setId}_a${index + 1}`;
            const userAnswer = this.answers[questionKeyQ] || this.answers[questionKeyA];
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer === correctAnswer;
            
            // 🔍 디버깅 로그
            console.log(`[AnnouncementComponent] 문제 ${index + 1}:`, {
                questionKeyQ,
                questionKeyA,
                userAnswer,
                correctAnswer,
                isCorrect,
                answersObject: this.answers
            });
            
            if (isCorrect) {
                totalCorrect++;
            } else {
                totalIncorrect++;
            }
            
            results.push({
                questionIndex: index,
                questionText: question.questionText,
                questionTextTrans: question.questionTextTrans || '',
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
            imageUrl: this.currentImage,
            audioUrl: this.currentSetData.audioUrl,
            narrationUrl: this.currentSetData.narrationUrl,
            script: this.currentSetData.script,
            scriptTrans: this.currentSetData.scriptTrans || '',
            scriptHighlights: this.currentSetData.scriptHighlights || '',
            totalCorrect: totalCorrect,
            totalIncorrect: totalIncorrect,
            totalQuestions: this.currentSetData.questions.length,
            score: Math.round((totalCorrect / this.currentSetData.questions.length) * 100),
            results: results
        };
        
        console.log('[AnnouncementComponent] 채점 완료:', resultData);
        
        // sessionStorage에 저장
        sessionStorage.setItem('listeningAnnouncementResult', JSON.stringify(resultData));
        
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
            type: 'listening_announcement',
            timeLimit: 20,
            sets: [
                {
                    setId: 'listening_announcement_1',
                    gender: 'female',
                    narrationUrl: 'https://example.com/narration1.mp3',
                    audioUrl: 'https://example.com/announcement1.mp3',
                    script: 'This is a demo announcement script.',
                    scriptTrans: '이것은 데모 공지사항 스크립트입니다.',
                    scriptHighlights: 'demo,announcement',
                    questions: [
                        {
                            questionText: 'Demo Question 1?',
                            questionTextTrans: '데모 질문 1?',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 0,
                            translations: ['번역 A', '번역 B', '번역 C', '번역 D'],
                            explanations: ['해설 A', '해설 B', '해설 C', '해설 D']
                        },
                        {
                            questionText: 'Demo Question 2?',
                            questionTextTrans: '데모 질문 2?',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 1,
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
     * @param {number} questionIndex - 세트 내 문제 인덱스 (0-1)
     * @param {boolean} wasCorrect - 1차에 맞았는지 여부
     * @param {any} firstAttemptAnswer - 1차 답안
     */
    async initRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer = null) {
        console.log(`🔄 [AnnouncementComponent] 2차 풀이 모드 - 문제 ${questionIndex}, 1차 결과: ${wasCorrect ? '✅' : '❌'}`);
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
            showScreen('listeningAnnouncementScreen');
            
            // 4. 타이머 숨기기
            this.hideTimer();
            
            // 5. 인트로 건너뛰고 문제 렌더링 (2차 풀이 모드)
            this.showingIntro = false;
            await this.renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer);
            
        } catch (error) {
            console.error('[AnnouncementComponent] 2차 풀이 초기화 실패:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * 2차 풀이 모드로 문제 렌더링
     */
    async renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer) {
        console.log(`🎨 [AnnouncementComponent] 2차 풀이 문제 렌더링 - Q${questionIndex + 1}`);
        
        // 🔴 이전 AudioPlayer 정리 (렉 방지)
        if (this.retakeAudioPlayer && typeof this.retakeAudioPlayer.destroy === 'function') {
            this.retakeAudioPlayer.destroy();
            this.retakeAudioPlayer = null;
            console.log('[AnnouncementComponent] 🛑 이전 AudioPlayer 정리 완료');
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
        document.getElementById('announcementIntroScreen').style.display = 'none';
        document.getElementById('announcementQuestionScreen').style.display = 'block';
        
        // 질문 및 선택지 렌더링 (2차 풀이 모드)
        const container = document.getElementById('announcementQuestionContent');
        if (!container) {
            console.error('❌ announcementQuestionContent 요소를 찾을 수 없습니다');
            return;
        }
        
        // 🎵 오디오 플레이어 추가
        const audioPlayerHtml = `
            <div id="announcementAudioPlayerContainer" style="margin-bottom: 20px;"></div>
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
                         onclick="window.currentAnnouncementComponent.selectOption(${index + 1})">
                        ${option}
                    </div>
                `;
            }
        }).join('');
        
        container.innerHTML = `
            ${audioPlayerHtml}
            <h3 class="conver-question">${question.questionText}</h3>
            <div class="conver-options">
                ${optionsHtml}
            </div>
        `;
        
        // 🎵 AudioPlayer 초기화 (URL 없어도 UI는 표시)
        if (window.AudioPlayer) {
            this.retakeAudioPlayer = new window.AudioPlayer('announcementAudioPlayerContainer', this.currentSetData.audioUrl || '');
            console.log('🎵 Announcement AudioPlayer 생성:', this.currentSetData.audioUrl ? '오디오 있음' : 'UI만');
        } else {
            console.error('❌ AudioPlayer 클래스를 찾을 수 없습니다');
        }
        
        // ✅ 이전에 선택한 답안 복원
        const questionKey = `${this.currentSetData.setId}_a${questionIndex + 1}`;
        const savedAnswer = this.answers[questionKey];
        if (savedAnswer) {
            const options = container.querySelectorAll('.response-option');
            options.forEach((opt, idx) => {
                if (idx + 1 === savedAnswer) {
                    opt.classList.add('selected');
                }
            });
            console.log(`✅ [AnnouncementComponent] 답안 복원: ${questionKey} = ${savedAnswer}`);
        }
        
        console.log(`✅ [AnnouncementComponent] 2차 풀이 렌더링 완료 - ${question.options.length}개 보기`);
    }
    
    /**
     * 타이머와 버튼 숨기기
     */
    hideTimer() {
        console.log('  ⏱️ [AnnouncementComponent] 타이머 및 버튼 숨김 시작');
        
        // ✅ Announcement 타이머 숨기기
        const timerEl = document.getElementById('announcementTimer');
        if (timerEl && timerEl.parentElement) {
            timerEl.parentElement.style.display = 'none';
            console.log('  ✅ announcementTimer 숨김');
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
        if (!this.currentSetData) {
            console.warn('[AnnouncementComponent] getRetakeAnswer: currentSetData가 null입니다');
            return null;
        }
        const questionKey = `${this.currentSetData.setId}_a${this.currentQuestion + 1}`;
        return this.answers[questionKey] || null;
    }
}

// 전역 스코프에 노출
window.AnnouncementComponent = AnnouncementComponent;
