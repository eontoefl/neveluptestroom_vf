/**
 * ConverComponent.js v=002
 * 
 * Listening - 컨버(Conversation) 컴포넌트
 * - 세트당 2문제
 * - 인트로 화면 (이미지 + 나레이션 + 대화 오디오)
 * - 문제 화면 (작은 이미지 + 질문 2개)
 * - 오디오 시퀀스: 2초 대기 → 나레이션 → 2초 대기 → 대화 오디오
 * - 타이머, 버튼 제어, 진행바는 Module Controller에서 관리
 */

// ✅ 캐시 시스템 추가 (정렬된 데이터 재사용)
let cachedConverData = null;

// 캐시 초기화 함수 (디버깅용)
window.clearConverCache = function() {
  console.log('🔄 [ConverComponent] 캐시 초기화');
  cachedConverData = null;
};

class ConverComponent {
  constructor(setNumber, config = {}) {
    console.log(`[ConverComponent] 생성 - setNumber: ${setNumber}`);
    
    this.setNumber = setNumber;           // 현재 세트 번호
    this.currentQuestion = 0;             // 현재 문제 인덱스 (0-based)
    this.answers = {};                    // 답안 저장
    
    this.setData = null;                  // 현재 세트 데이터
    this.audioPlayer = null;              // 오디오 플레이어
    this.isAudioPlaying = false;          // 오디오 재생 중 플래그
    this.showingIntro = true;             // 인트로 화면 표시 여부
    this.currentImage = null;             // 현재 세트의 랜덤 이미지
    
    // 콜백 설정
    this.onComplete = config.onComplete || null;
    this.onError = config.onError || null;
    this.onTimerStart = config.onTimerStart || null;
    
    // 상수
    this.TIME_LIMIT = 20;                 // 문제당 20초
    
    // 대화 이미지 배열 (10개)
    this.CONVERSATION_IMAGES = [
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_1.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_2.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_3.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_4.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_5.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_6.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_7.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_8.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_9.png',
      'https://eontoefl.github.io/toefl-audio/listening/conversation/image/conver_image_10.png'
    ];
    
    // 나레이션 URL (고정)
    this.NARRATION_URL = 'https://eontoefl.github.io/toefl-audio/listening/conversation/narration/conversation_narration.mp3';
    
    // Google Sheets 설정
    this.SHEET_CONFIG = {
      spreadsheetId: '1srFVmFnRa8A73isTO_Vk3yfU1bQWVroHUui8XvYf9e0',
      sheetGid: '1189725287'
    };
  }

  /**
   * 초기화 - 데이터 로드 및 인트로 시작
   */
  async init() {
    console.log(`[ConverComponent] 초기화 시작 - setNumber: ${this.setNumber}`);
    
    // 화면 전환
    showScreen('listeningConverScreen');
    
    // 데이터 로드
    const allData = await this.loadData();
    
    if (!allData || !allData.sets || allData.sets.length === 0) {
      console.error('[ConverComponent] 데이터 로드 실패');
      alert('컨버 데이터를 불러올 수 없습니다.');
      return false;
    }
    
    // 세트 찾기
    const setIndex = this.findSetIndex(allData.sets);
    if (setIndex === -1) {
      console.error(`[ConverComponent] 세트를 찾을 수 없습니다 - setNumber: ${this.setNumber}`);
      return false;
    }
    
    this.setData = allData.sets[setIndex];
    console.log(`[ConverComponent] 세트 데이터 로드 완료:`, this.setData);
    
    // 인트로 화면 시작
    this.showIntro();
    
    return true;
  }

  /**
   * Google Sheets에서 데이터 로드
   */
  async loadData(forceReload = false) {
    console.log('[ConverComponent] 데이터 로드 시작');
    
    // ✅ 캐시 확인
    if (!forceReload && cachedConverData) {
      console.log('✅ [ConverComponent] 캐시된 데이터 사용 (이미 정렬됨)');
      console.log('  캐시 데이터 세트 순서:', cachedConverData.sets.map(s => s.id));
      return cachedConverData;
    }
    
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.SHEET_CONFIG.sheetGid}`;
      console.log('[ConverComponent] CSV URL:', csvUrl);
      
      const response = await fetch(csvUrl);
      console.log('[ConverComponent] Response status:', response.status);
      
      if (!response.ok) {
        console.warn('[ConverComponent] HTTP 에러, 데모 데이터 사용');
        return this.getDemoData();
      }
      
      const csvText = await response.text();
      const parsedData = this.parseCSV(csvText);
      
      if (!parsedData || !parsedData.sets || parsedData.sets.length === 0) {
        console.warn('[ConverComponent] CSV 파싱 실패, 데모 데이터 사용');
        return this.getDemoData();
      }
      
      console.log('[ConverComponent] 데이터 로드 성공:', parsedData.sets.length, '개 세트');
      
      // ✅ 캐시 저장
      cachedConverData = parsedData;
      
      return parsedData;
    } catch (error) {
      console.error('[ConverComponent] 데이터 로드 실패:', error);
      return this.getDemoData();
    }
  }

  /**
   * CSV 파싱
   */
  parseCSV(csvText) {
    console.log('[ConverComponent] CSV 파싱 시작');
    
    const lines = csvText.trim().split('\n');
    const sets = [];
    
    // 첫 줄이 헤더인지 확인
    const firstLine = this.parseCSVLine(lines[0]);
    const hasHeader = !firstLine[0].startsWith('listening_conver_');
    const startIndex = hasHeader ? 1 : 0;
    
    console.log(`[ConverComponent] 헤더 존재: ${hasHeader}, 시작 인덱스: ${startIndex}`);
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      
      if (values.length < 34) {
        console.warn(`[ConverComponent] Line ${i} 건너뜀: 열 부족 (${values.length}/34)`);
        continue;
      }
      
      const rawSetId = values[0].trim();
      
      if (!rawSetId) {
        console.warn(`[ConverComponent] Line ${i}: 빈 Set ID, 건너뜀`);
        continue;
      }
      
      // ID 정규화: conversation_set_0001 형식 그대로 사용
      let setId = rawSetId;
      if (/^\d+$/.test(rawSetId)) {
        // 순수 숫자: "1" → "conversation_set_0001"
        setId = `conversation_set_${String(rawSetId).padStart(4, '0')}`;
      }
      // 다른 형식은 그대로 사용
      
      console.log(`[ConverComponent] ID 정규화: "${rawSetId}" → "${setId}"`);
      
      const audioUrl = values[1];
      const script = values[2] || '';
      const scriptTrans = values[3] || '';
      
      // scriptHighlights 파싱 (## 구분자)
      let scriptHighlights = [];
      if (values[34] && values[34].trim()) {
        const highlightStr = values[34].trim();
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
      }
      
      // 문제 1
      const q1 = {
        question: values[4],
        questionTrans: values[5],
        options: [values[6], values[7], values[8], values[9]],
        answer: parseInt(values[10]) || 1,
        optionTranslations: [values[11], values[12], values[13], values[14]],
        optionExplanations: [values[15], values[16], values[17], values[18]]
      };
      
      // 문제 2
      const q2 = {
        question: values[19],
        questionTrans: values[20],
        options: [values[21], values[22], values[23], values[24]],
        answer: parseInt(values[25]) || 1,
        optionTranslations: [values[26], values[27], values[28], values[29]],
        optionExplanations: [values[30], values[31], values[32], values[33]]
      };
      
      sets.push({
        id: setId,
        audioUrl: audioUrl,
        script: script,
        scriptTrans: scriptTrans,
        scriptHighlights: scriptHighlights,
        questions: [q1, q2]
      });
      
      console.log(`[ConverComponent] 세트 추가: ${setId}`);
    }
    
    // ✅ Set ID 기준으로 정렬 (conversation_set_0001, conversation_set_0002, ...)
    console.log('🔄 [ConverComponent] 정렬 전 순서:', sets.map(s => s.id));
    
    sets.sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, ''));
      const numB = parseInt(b.id.replace(/\D/g, ''));
      console.log(`  비교: ${a.id} (${numA}) vs ${b.id} (${numB}) → ${numA - numB}`);
      return numA - numB;
    });
    
    console.log('✅ [ConverComponent] 정렬 후 순서:', sets.map(s => s.id));
    
    // 디버깅: 최종 데이터 검증
    sets.forEach((set, idx) => {
      console.log(`  [${idx}] ${set.id} - ${set.questions.length}문제`);
    });
    
    console.log(`[ConverComponent] CSV 파싱 완료: ${sets.length}개 세트`);
    
    return {
      type: 'listening_conver',
      timeLimit: this.TIME_LIMIT,
      sets: sets
    };
  }

  /**
   * CSV 라인 파싱 (쉼표 + 따옴표 처리)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * 세트 인덱스 찾기
   */
  findSetIndex(sets) {
    // ✅ setNumber를 conversation_set_XXXX 형식으로 변환
    let setId;
    if (typeof this.setNumber === 'string' && this.setNumber.includes('_set_')) {
      // 이미 "conversation_set_0001" 형식이면 그대로 사용
      setId = this.setNumber;
      console.log(`🔍 [findSetIndex] setId 문자열 직접 사용: ${setId}`);
    } else {
      // 숫자면 "conversation_set_XXXX" 형식으로 변환
      setId = `conversation_set_${String(this.setNumber).padStart(4, '0')}`;
      console.log(`🔍 [findSetIndex] setNumber ${this.setNumber} → setId: ${setId}`);
    }
    
    console.log(`[ConverComponent] 세트 검색 - ID: ${setId}`);
    
    const index = sets.findIndex(s => s.id === setId);
    console.log(`[ConverComponent] 세트 인덱스: ${index}`);
    return index;
  }

  /**
   * 인트로 화면 표시 (이미지 + 오디오)
   */
  showIntro() {
    console.log('[ConverComponent] 인트로 화면 시작');
    
    this.showingIntro = true;
    
    // 인트로 화면 표시
    document.getElementById('converIntroScreen').style.display = 'block';
    document.getElementById('converQuestionScreen').style.display = 'none';
    
    // 진행률/타이머 숨김
    document.getElementById('converProgress').style.display = 'none';
    document.getElementById('converTimer').style.display = 'none';
    
    // 랜덤 이미지 선택 (세트당 1개)
    if (!this.currentImage) {
      const randomIndex = Math.floor(Math.random() * this.CONVERSATION_IMAGES.length);
      this.currentImage = this.CONVERSATION_IMAGES[randomIndex];
      console.log(`[ConverComponent] 랜덤 이미지 선택: ${randomIndex + 1}/${this.CONVERSATION_IMAGES.length}`);
    }
    
    // 이미지 렌더링
    const container = document.getElementById('converIntroImage');
    container.innerHTML = `
      <img src="${this.currentImage}" alt="Conversation scene" 
           style="width: 100%; max-width: 450px; height: auto; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); object-fit: cover;"
           onerror="console.error('❌ 컨버 이미지 로드 실패:', this.src);"
           onload="console.log('✅ 컨버 이미지 로드 성공:', this.src);">
    `;
    
    // 오디오 시퀀스 시작
    this.playAudioSequence();
  }

  /**
   * 오디오 시퀀스: 2초 → 나레이션 → 2초 → 대화 오디오
   */
  playAudioSequence() {
    console.log('[ConverComponent] 오디오 시퀀스 시작');
    
    setTimeout(() => {
      console.log('[ConverComponent] 나레이션 재생 시작');
      this.playNarration(() => {
        console.log('[ConverComponent] 나레이션 완료, 2초 대기');
        setTimeout(() => {
          console.log('[ConverComponent] 대화 오디오 재생 시작');
          this.playMainAudio(this.setData.audioUrl, () => {
            console.log('[ConverComponent] 대화 오디오 완료, 문제 화면으로 전환');
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
    console.log('[ConverComponent] 나레이션 재생');
    
    // 기존 오디오 정리
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
    
    this.audioPlayer = new Audio(this.NARRATION_URL);
    this.isAudioPlaying = true;
    
    this.audioPlayer.addEventListener('ended', () => {
      console.log('[ConverComponent] 나레이션 재생 완료');
      this.isAudioPlaying = false;
      if (onEnded) onEnded();
    });
    
    this.audioPlayer.addEventListener('error', (e) => {
      console.error('[ConverComponent] 나레이션 재생 실패:', e);
      this.isAudioPlaying = false;
      // 에러 발생해도 계속 진행
      setTimeout(() => {
        if (onEnded) onEnded();
      }, 1000);
    });
    
    this.audioPlayer.play().catch(err => {
      console.error('[ConverComponent] 나레이션 play() 실패:', err);
      this.isAudioPlaying = false;
      setTimeout(() => {
        if (onEnded) onEnded();
      }, 1000);
    });
  }

  /**
   * 대화 오디오 재생
   */
  playMainAudio(audioUrl, onEnded) {
    console.log('[ConverComponent] 대화 오디오 재생');
    
    if (!audioUrl || audioUrl === 'PLACEHOLDER') {
      console.warn('[ConverComponent] 오디오 URL 없음, 5초 후 진행');
      this.isAudioPlaying = true;
      setTimeout(() => {
        this.isAudioPlaying = false;
        if (onEnded) onEnded();
      }, 5000);
      return;
    }
    
    // 기존 오디오 정리
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
    
    this.audioPlayer = new Audio(audioUrl);
    this.isAudioPlaying = true;
    
    this.audioPlayer.addEventListener('ended', () => {
      console.log('[ConverComponent] 대화 오디오 재생 완료');
      this.isAudioPlaying = false;
      if (onEnded) onEnded();
    });
    
    this.audioPlayer.addEventListener('error', (e) => {
      console.error('[ConverComponent] 대화 오디오 재생 실패:', e);
      this.isAudioPlaying = false;
      setTimeout(() => {
        if (onEnded) onEnded();
      }, 3000);
    });
    
    this.audioPlayer.play().catch(err => {
      console.error('[ConverComponent] 대화 오디오 play() 실패:', err);
      this.isAudioPlaying = false;
      setTimeout(() => {
        if (onEnded) onEnded();
      }, 3000);
    });
  }

  /**
   * 문제 화면 표시
   */
  showQuestions() {
    console.log('[ConverComponent] 문제 화면 시작');
    
    this.showingIntro = false;
    
    // 화면 전환
    document.getElementById('converIntroScreen').style.display = 'none';
    document.getElementById('converQuestionScreen').style.display = 'block';
    
    // 진행률/타이머 표시
    document.getElementById('converProgress').style.display = 'inline-block';
    document.getElementById('converTimer').style.display = 'inline-block';
    
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
    console.log(`[ConverComponent] 문제 로드 - questionIndex: ${questionIndex}`);
    
    this.currentQuestion = questionIndex;
    const question = this.setData.questions[questionIndex];
    
    if (!question) {
      console.error('[ConverComponent] 문제 데이터 없음');
      return;
    }
    
    // 진행률 업데이트 (ModuleController에 알림)
    if (window.moduleController) {
      window.moduleController.updateCurrentQuestionInComponent(questionIndex);
    }
    
    // 작은 이미지 표시 (인트로와 동일)
    this.renderSmallImage();
    
    // 질문 + 선택지 렌더링
    this.renderQuestion(question);
  }

  /**
   * 작은 이미지 렌더링 (문제 화면 왼쪽)
   */
  renderSmallImage() {
    const container = document.getElementById('converSmallImage');
    
    if (this.currentImage) {
      container.innerHTML = `
        <img src="${this.currentImage}" alt="Conversation scene" 
             style="width: 100%; height: auto; object-fit: cover; border-radius: 12px; display: block;">
      `;
    } else {
      container.innerHTML = `
        <div style="width: 100%; height: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;">
          <i class="fas fa-image" style="font-size: 60px; opacity: 0.8;"></i>
        </div>
      `;
    }
  }

  /**
   * 질문 + 선택지 렌더링
   */
  renderQuestion(question) {
    console.log('[ConverComponent] 질문 렌더링');
    
    const container = document.getElementById('converQuestionContent');
    const questionKey = `${this.setData.id}_q${this.currentQuestion + 1}`;
    const savedAnswer = this.answers[questionKey];
    
    const optionsHtml = question.options.map((option, index) => {
      const selectedClass = savedAnswer === (index + 1) ? 'selected' : '';
      
      return `
        <div class="response-option ${selectedClass}" 
             onclick="window.currentConverComponent.selectOption(${index + 1})">
          ${option}
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <h3 class="conver-question">${question.question}</h3>
      <div class="conver-options">
        ${optionsHtml}
      </div>
    `;
  }

  /**
   * 선택지 선택
   */
  selectOption(optionIndex) {
    console.log(`[ConverComponent] 선택 - Q${this.currentQuestion + 1}: ${optionIndex}`);
    
    const questionKey = `${this.setData.id}_q${this.currentQuestion + 1}`;
    this.answers[questionKey] = optionIndex;
    
    // UI 업데이트
    document.querySelectorAll('.conver-options .response-option').forEach((el, idx) => {
      if (idx === optionIndex - 1) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  /**
   * 다음 문제로 이동
   */
  nextQuestion() {
    if (this.currentQuestion < this.setData.questions.length - 1) {
      this.loadQuestion(this.currentQuestion + 1);
      return true;
    }
    return false;
  }

  /**
   * 제출 & 채점
   */
  submit() {
    console.log('[ConverComponent] 제출 시작');
    
    // 오디오 정지
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
    this.isAudioPlaying = false;
    
    // 결과 데이터 준비
    const results = {
      setId: this.setData.id,
      answers: []
    };
    
    this.setData.questions.forEach((question, index) => {
      const questionKey = `${this.setData.id}_q${index + 1}`;
      const userAnswer = this.answers[questionKey] || null;
      const isCorrect = userAnswer === question.answer;
      
      results.answers.push({
        questionNum: index + 1,
        audioUrl: this.setData.audioUrl || '',
        script: this.setData.script || '',
        scriptTrans: this.setData.scriptTrans || '',
        scriptHighlights: this.setData.scriptHighlights || [],
        question: question.question,
        questionTrans: question.questionTrans || '',
        options: question.options,
        optionTranslations: question.optionTranslations || [],
        optionExplanations: question.optionExplanations || [],
        userAnswer: userAnswer,
        correctAnswer: question.answer,
        isCorrect: isCorrect
      });
    });
    
    console.log('[ConverComponent] 채점 완료:', results);
    
    // sessionStorage 저장
    sessionStorage.setItem('converResults', JSON.stringify([results]));
    
    // 완료 콜백
    if (this.onComplete) {
      this.onComplete(results);
    }
    
    return results;
  }

  /**
   * 데모 데이터
   */
  getDemoData() {
    return {
      type: 'listening_conver',
      timeLimit: 20,
      sets: [
        {
          id: 'listening_conver_1',
          audioUrl: '',
          script: 'Man: Hey, did you finish the assignment for Professor Smith?\nWoman: Not yet, I\'m still working on it. It\'s due tomorrow, right?',
          scriptTrans: '남자: 저기, 스미스 교수님 과제 끝냈어?\n여자: 아직, 아직 하고 있어. 내일까지잖아, 그치?',
          scriptHighlights: [],
          questions: [
            {
              question: 'What are the speakers mainly discussing?',
              questionTrans: '화자들이 주로 무엇에 대해 논의하고 있습니까?',
              options: [
                'An assignment deadline',
                'A professor\'s lecture',
                'A study group',
                'A class schedule'
              ],
              answer: 1,
              optionTranslations: ['과제 마감일', '교수님 강의', '스터디 그룹', '수업 일정'],
              optionExplanations: ['과제 마감에 대해 이야기하고 있습니다.', '', '', '']
            },
            {
              question: 'When is the assignment due?',
              questionTrans: '과제 마감일은 언제입니까?',
              options: [
                'Today',
                'Tomorrow',
                'Next week',
                'Next month'
              ],
              answer: 2,
              optionTranslations: ['오늘', '내일', '다음 주', '다음 달'],
              optionExplanations: ['', '여자가 "내일까지잖아"라고 말했습니다.', '', '']
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
    console.log(`🔄 [ConverComponent] 2차 풀이 모드 - 문제 ${questionIndex}, 1차 결과: ${wasCorrect ? '✅' : '❌'}`);
    console.log(`  📥 firstAttemptAnswer:`, firstAttemptAnswer);
    
    try {
      // 1. 데이터 로드
      const allData = await this.loadData();
      
      if (!allData || !allData.sets || allData.sets.length === 0) {
        throw new Error('데이터를 불러올 수 없습니다');
      }
      
      // 2. 세트 찾기
      const setIndex = this.findSetIndex(allData.sets);
      if (setIndex === -1) {
        throw new Error(`세트를 찾을 수 없습니다: ${this.setNumber}`);
      }
      
      this.setData = allData.sets[setIndex];
      this.currentQuestion = questionIndex;
      
      console.log(`  📊 setData.id: ${this.setData.id}`);
      console.log(`  📊 선택된 question (index ${questionIndex}):`, this.setData.questions[questionIndex]?.question.substring(0, 50));
      
      // 3. 화면 표시
      showScreen('listeningConverScreen');
      
      // 4. 타이머 숨기기
      this.hideTimer();
      
      // 5. 인트로 건너뛰고 문제 렌더링 (2차 풀이 모드)
      this.showingIntro = false;
      await this.renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer);
      
    } catch (error) {
      console.error('[ConverComponent] 2차 풀이 초기화 실패:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }
  
  /**
   * 2차 풀이 모드로 문제 렌더링
   */
  async renderQuestionRetakeMode(questionIndex, wasCorrect, firstAttemptAnswer) {
    console.log(`🎨 [ConverComponent] 2차 풀이 문제 렌더링 - Q${questionIndex + 1}`);
    
    // 🔴 이전 AudioPlayer 정리 (렉 방지)
    if (this.retakeAudioPlayer && typeof this.retakeAudioPlayer.destroy === 'function') {
      this.retakeAudioPlayer.destroy();
      this.retakeAudioPlayer = null;
      console.log('[ConverComponent] 🛑 이전 AudioPlayer 정리 완료');
    }
    
    const question = this.setData.questions[questionIndex];
    if (!question) {
      console.error(`❌ 문제를 찾을 수 없습니다: index ${questionIndex}`);
      return;
    }
    
    // ModuleController에게 진행률 업데이트 요청
    if (window.moduleController) {
      window.moduleController.updateCurrentQuestionInComponent(questionIndex);
    }
    
    // 문제 화면 표시 (인트로 없음)
    document.getElementById('converIntroScreen').style.display = 'none';
    document.getElementById('converQuestionScreen').style.display = 'block';
    
    // 이미지 표시 (작은 이미지)
    const questionImageEl = document.getElementById('converQuestionImage');
    if (questionImageEl && this.currentImage) {
      questionImageEl.src = this.currentImage;
    }
    
    // 질문 및 선택지 렌더링 (2차 풀이 모드)
    const container = document.getElementById('converQuestionContent');
    if (!container) {
      console.error('❌ converQuestionContent 요소를 찾을 수 없습니다');
      return;
    }
    
    // 🎵 오디오 플레이어 추가
    const audioPlayerHtml = `
      <div id="converAudioPlayerContainer" style="margin-bottom: 20px;"></div>
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
               onclick="window.currentConverComponent.selectOption(${index + 1})">
            ${option}
          </div>
        `;
      }
    }).join('');
    
    container.innerHTML = `
      ${audioPlayerHtml}
      <h3 class="conver-question">${question.question}</h3>
      <div class="conver-options">
        ${optionsHtml}
      </div>
    `;
    
    // 🎵 AudioPlayer 초기화 (URL 없어도 UI는 표시)
    if (window.AudioPlayer) {
      this.retakeAudioPlayer = new window.AudioPlayer('converAudioPlayerContainer', this.setData.audioUrl || '');
      console.log('🎵 Conver AudioPlayer 생성:', this.setData.audioUrl ? '오디오 있음' : 'UI만');
    } else {
      console.error('❌ AudioPlayer 클래스를 찾을 수 없습니다');
    }
    
    // ✅ 이전에 선택한 답안 복원
    const questionKey = `${this.setData.id}_q${questionIndex + 1}`;
    const savedAnswer = this.answers[questionKey];
    if (savedAnswer) {
      const options = container.querySelectorAll('.response-option');
      options.forEach((opt, idx) => {
        if (idx + 1 === savedAnswer) {
          opt.classList.add('selected');
        }
      });
      console.log(`✅ [ConverComponent] 답안 복원: ${questionKey} = ${savedAnswer}`);
    }
    
    console.log(`✅ [ConverComponent] 2차 풀이 렌더링 완료 - ${question.options.length}개 보기`);
  }
  
  /**
   * 타이머와 버튼 숨기기
   */
  hideTimer() {
    console.log('  ⏱️ [ConverComponent] 타이머 및 버튼 숨김 시작');
    
    // ✅ Conver 타이머 숨기기
    const timerEl = document.getElementById('converTimer');
    if (timerEl && timerEl.parentElement) {
      timerEl.parentElement.style.display = 'none';
      console.log('  ✅ converTimer 숨김');
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
    const questionKey = `${this.setData.id}_q${this.currentQuestion + 1}`;
    return this.answers[questionKey] || null;
  }

  /**
   * Cleanup
   */
  cleanup() {
    console.log('[ConverComponent] Cleanup 시작');
    
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer = null;
    }
    
    this.isAudioPlaying = false;
    this.showingIntro = true;
    this.currentImage = null;
    this.answers = {};
    
    console.log('[ConverComponent] Cleanup 완료');
  }
}

// 전역으로 노출
window.ConverComponent = ConverComponent;
console.log('[ConverComponent] 클래스 정의 완료');
