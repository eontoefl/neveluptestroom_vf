// 화면 전환 함수들
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none'; // 명시적으로 숨김
    });
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
    targetScreen.style.display = 'block'; // 명시적으로 표시
    
    console.log(`📺 [화면전환] ${screenId} 표시 완료`);
    
    // scheduleScreen으로 전환 시 학습 일정 초기화
    if (screenId === 'scheduleScreen' && currentUser) {
        initScheduleScreen();
    }
    
    // welcomeScreen으로 전환 시 사용자 이름 표시
    if (screenId === 'welcomeScreen' && currentUser) {
        const userNameElement = document.getElementById('currentUserName');
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
    }
}

function showWelcomeScreen() {
    showScreen('welcomeScreen');
    stopAllTimers();
}

// ===== SCHEDULE SCREEN =====
function initScheduleScreen() {
    if (!currentUser) return;
    
    // 사용자 정보 표시
    const userNameElement = document.getElementById('scheduleUserName');
    const programBadgeElement = document.getElementById('userProgramBadge');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
    
    if (programBadgeElement) {
        programBadgeElement.textContent = currentUser.program;
    }
    
    // 프로그램에 따른 일정 생성
    renderSchedule(currentUser.program);
}

function renderSchedule(program) {
    const container = document.getElementById('scheduleContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 프로그램 타입 결정
    const programType = program === '내벨업챌린지 - Standard' ? 'standard' : 'fast';
    const totalWeeks = programType === 'standard' ? 8 : 4;
    
    console.log(`📅 [스케줄 렌더링] program: ${program}, programType: ${programType}, totalWeeks: ${totalWeeks}`);
    
    for (let week = 1; week <= totalWeeks; week++) {
        const weekBlock = document.createElement('div');
        weekBlock.className = 'week-block';
        
        const weekTitle = document.createElement('div');
        weekTitle.className = 'week-title';
        weekTitle.innerHTML = `<i class="fas fa-calendar-week"></i> Week ${week}`;
        
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';
        
        // 요일 영문명 매핑
        const dayMapping = {
            '일': 'sunday',
            '월': 'monday',
            '화': 'tuesday',
            '수': 'wednesday',
            '목': 'thursday',
            '금': 'friday'
        };
        
        // 요일별 버튼 생성 (토요일 제외)
        daysOfWeek.forEach(dayKr => {
            const dayEn = dayMapping[dayKr];
            const dayButton = document.createElement('div');
            dayButton.className = 'day-button';
            
            // 해당 날짜의 과제 목록 가져오기
            const tasks = getDayTasks(programType, week, dayEn);
            
            console.log(`🔧 [버튼생성] Week ${week}, Day: ${dayKr} (${dayEn}), 과제 수: ${tasks.length}`);
            
            dayButton.onclick = () => {
                console.log(`🖱️ [클릭] Week ${week}, Day: ${dayKr} 버튼 클릭됨`);
                selectDay(week, dayKr, dayEn);
            };
            
            // 과제 정보 표시
            const taskInfo = tasks.length > 0 ? `${tasks.length}개 과제` : '휴무';
            
            dayButton.innerHTML = `
                <div class="day-name">${dayKr}</div>
                <div class="day-tasks">${taskInfo}</div>
            `;
            
            // 휴무일인 경우 스타일 변경
            if (tasks.length === 0) {
                dayButton.style.opacity = '0.5';
                dayButton.style.cursor = 'default';
                dayButton.onclick = null;
            }
            
            daysGrid.appendChild(dayButton);
        });
        
        weekBlock.appendChild(weekTitle);
        weekBlock.appendChild(daysGrid);
        container.appendChild(weekBlock);
    }
}

// getTaskInfo 함수는 이제 사용하지 않음 (getDayTasks로 대체)

function selectDay(week, dayKr, dayEn) {
    if (!currentUser) return;
    
    currentTest.currentWeek = week;
    currentTest.currentDay = dayKr;
    
    // 프로그램 타입 결정
    const program = currentUser.program;
    const programType = program === '내벨업챌린지 - Standard' ? 'standard' : 'fast';
    
    console.log('🔍 [DEBUG] selectDay 호출됨');
    console.log('  week:', week);
    console.log('  dayKr:', dayKr);
    console.log('  dayEn:', dayEn);
    console.log('  program:', program);
    console.log('  programType:', programType);
    
    // 해당 날짜의 과제 목록 가져오기
    const tasks = getDayTasks(programType, week, dayEn);
    
    console.log('  과제 목록:', tasks);
    
    if (tasks.length === 0) {
        console.log('  ⚠️ 과제 없음 (휴무일)');
        return;
    }
    
    // 과제 목록 화면 표시
    showTaskListScreen(week, dayKr, tasks);
}

function showTaskSelectionScreen(week, day, dayTask) {
    console.log('showTaskSelectionScreen 호출됨:', week, day, dayTask);
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // welcomeScreen 강제 표시
    const welcomeScreenEl = document.getElementById('welcomeScreen');
    welcomeScreenEl.classList.add('active');
    welcomeScreenEl.style.display = 'block';
    
    console.log('welcomeScreen 강제 표시 완료');
    console.log('welcomeScreen display:', window.getComputedStyle(welcomeScreenEl).display);
    console.log('welcomeScreen classList:', welcomeScreenEl.classList);
    
    // 사용자 정보 표시
    if (currentUser) {
        const userNameElement = document.getElementById('currentUserName');
        const programBadgeElement = document.getElementById('currentUserProgramBadge');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        
        if (programBadgeElement) {
            programBadgeElement.textContent = currentUser.program;
        }
    }
    
    // welcomeScreen 내용을 과제 선택으로 변경
    const welcomeHeader = document.querySelector('#welcomeScreen .welcome-header h1');
    const subtitle = document.querySelector('#welcomeScreen .welcome-header .subtitle');
    
    console.log('welcomeHeader:', welcomeHeader);
    console.log('subtitle:', subtitle);
    
    if (welcomeHeader) {
        welcomeHeader.textContent = `Week ${week} - ${day}요일`;
    }
    if (subtitle) {
        subtitle.textContent = dayTask.description;
    }
    
    // 시작 버튼 숨기기
    const startOptions = document.querySelector('#welcomeScreen .start-options');
    if (startOptions) {
        startOptions.style.display = 'none';
    }
    
    // 시험 구성 카드를 해당 날짜의 섹션만 표시
    const sectionsGrid = document.querySelector('#welcomeScreen .sections-grid');
    console.log('sectionsGrid:', sectionsGrid);
    
    if (sectionsGrid) {
        sectionsGrid.innerHTML = '';
        
        dayTask.sections.forEach(section => {
            console.log('섹션 카드 생성:', section);
            const sectionInfo = getSectionInfo(section);
            console.log('섹션 정보:', sectionInfo);
            const card = document.createElement('div');
            card.className = 'section-card';
            card.style.cursor = 'pointer';
            card.onclick = () => startSection(section);
            card.innerHTML = `
                <i class="${sectionInfo.icon}"></i>
                <h3>${sectionInfo.title}</h3>
                <p>${sectionInfo.description}</p>
                <p class="time">${sectionInfo.time}</p>
            `;
            sectionsGrid.appendChild(card);
        });
    }
}

/**
 * 과제 목록 화면 표시 (새로운 스케줄 시스템)
 */
function showTaskListScreen(week, dayKr, tasks) {
    console.log('📋 [과제 목록 화면] Week', week, dayKr, '- 과제:', tasks);
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // welcomeScreen 표시
    const welcomeScreenEl = document.getElementById('welcomeScreen');
    welcomeScreenEl.classList.add('active');
    welcomeScreenEl.style.display = 'block';
    
    // 사용자 정보 표시
    if (currentUser) {
        const userNameElement = document.getElementById('currentUserName');
        const programBadgeElement = document.getElementById('currentUserProgramBadge');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        
        if (programBadgeElement) {
            programBadgeElement.textContent = currentUser.program;
        }
    }
    
    // 헤더 변경
    const welcomeHeader = document.querySelector('#welcomeScreen .welcome-header h1');
    const subtitle = document.querySelector('#welcomeScreen .welcome-header .subtitle');
    
    if (welcomeHeader) {
        welcomeHeader.textContent = `Week ${week} - ${dayKr}요일`;
    }
    if (subtitle) {
        subtitle.textContent = `${tasks.length}개의 과제가 있습니다`;
    }
    
    // 시작 버튼 숨기기
    const startOptions = document.querySelector('#welcomeScreen .start-options');
    if (startOptions) {
        startOptions.style.display = 'none';
    }
    
    // 과제 목록 표시
    const sectionsGrid = document.querySelector('#welcomeScreen .sections-grid');
    if (sectionsGrid) {
        sectionsGrid.innerHTML = '';
        
        tasks.forEach((taskName, index) => {
            const card = document.createElement('div');
            card.className = 'section-card';
            card.style.cursor = 'pointer';
            
            // 과제 타입에 따라 아이콘과 설명 결정
            let icon = 'fas fa-book';
            let description = taskName;
            
            if (taskName.includes('내벨업보카')) {
                icon = 'fas fa-spell-check';
                description = '단어 시험';
            } else if (taskName.includes('입문서')) {
                icon = 'fas fa-book-reader';
                description = 'PDF 읽기';
            } else if (taskName.includes('리딩')) {
                icon = 'fas fa-book-open';
                description = '독해 연습';
            } else if (taskName.includes('리스닝')) {
                icon = 'fas fa-headphones';
                description = '듣기 연습';
            } else if (taskName.includes('라이팅')) {
                icon = 'fas fa-pen';
                description = '쓰기 연습';
            } else if (taskName.includes('스피킹')) {
                icon = 'fas fa-microphone';
                description = '말하기 연습';
            }
            
            card.onclick = () => {
                console.log(`🎯 [과제 실행] ${taskName}`);
                executeTask(taskName);
            };
            
            card.innerHTML = `
                <i class="${icon}"></i>
                <h3>${taskName}</h3>
                <p>${description}</p>
            `;
            
            sectionsGrid.appendChild(card);
        });
    }
}

function getSectionInfo(section) {
    const sectionData = {
        reading: {
            icon: 'fas fa-book-open',
            title: 'Reading',
            description: '3개 지문',
            time: '54분'
        },
        reading_fillblanks: {
            icon: 'fas fa-spell-check',
            title: 'Reading - Fill Blanks',
            description: '빈칸채우기',
            time: '3분'
        },
        reading_daily1: {
            icon: 'fas fa-newspaper',
            title: 'Reading - Daily 1',
            description: '일상리딩',
            time: '1분'
        },
        reading_daily2: {
            icon: 'fas fa-newspaper',
            title: 'Reading - Daily 2',
            description: '일상리딩',
            time: '1분 20초'
        },
        reading_academic: {
            icon: 'fas fa-graduation-cap',
            title: 'Reading - Academic',
            description: '아카데믹리딩',
            time: '6분'
        },
        listening_response: {
            icon: 'fas fa-headphones',
            title: 'Listening - Response',
            description: '응답고르기',
            time: '20초/문제'
        },
        listening_conver: {
            icon: 'fas fa-comments',
            title: 'Listening - Conversation',
            description: '대화듣기',
            time: '20초/문제'
        },
        listening_announcement: {
            icon: 'fas fa-bullhorn',
            title: 'Listening - Announcement',
            description: '공지사항',
            time: '20초/문제'
        },
        listening_lecture: {
            icon: 'fas fa-chalkboard-teacher',
            title: 'Listening - Lecture',
            description: '강의듣기',
            time: '30초/문제'
        },
        writing_arrange: {
            icon: 'fas fa-spell-check',
            title: 'Writing - 단어배열',
            description: '단어배열',
            time: '6분 50초'
        },
        writing_email: {
            icon: 'fas fa-envelope',
            title: 'Writing - 이메일작성',
            description: '이메일작성',
            time: '6분'
        },
        writing_discussion: {
            icon: 'fas fa-comments',
            title: 'Writing - 토론형',
            description: '토론형 글쓰기',
            time: '9분'
        },
        speaking_repeat: {
            icon: 'fas fa-microphone',
            title: 'Speaking - 따라말하기',
            description: '듣고 따라 말하기',
            time: '3분'
        },
        speaking_interview: {
            icon: 'fas fa-user-tie',
            title: 'Speaking - 인터뷰',
            description: '인터뷰 질문 답변',
            time: '4분'
        },
        listening: {
            icon: 'fas fa-headphones',
            title: 'Listening',
            description: '대화 & 강의',
            time: '41분'
        },
        writing: {
            icon: 'fas fa-pen',
            title: 'Writing',
            description: '2개 에세이',
            time: '50분'
        },
        speaking: {
            icon: 'fas fa-microphone',
            title: 'Speaking',
            description: '4개 과제',
            time: '17분'
        },
        vocab_test: {
            icon: 'fas fa-spell-check',
            title: '내벨업보카 시험',
            description: '어휘 시험',
            time: '15분'
        }
    };
    
    return sectionData[section] || sectionData.reading;
}


function showSectionSelect() {
    showScreen('sectionSelectScreen');
    
    // 사용자 정보 표시
    if (currentUser) {
        const userNameElement = document.getElementById('sectionSelectUserName');
        const programBadgeElement = document.getElementById('sectionSelectProgramBadge');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser.name;
        }
        
        if (programBadgeElement) {
            programBadgeElement.textContent = currentUser.program;
        }
    }
}

// 시험 시작 함수들
function startFullTest() {
    if (confirm('전체 시험을 시작하시겠습니까? 약 2시간 30분이 소요됩니다.')) {
        currentTest.section = 'full';
        startSection('reading');
    }
}

function startSection(section) {
    console.log('startSection 호출됨:', section);
    
    currentTest.section = section;
    currentTest.currentQuestion = 0;
    currentTest.currentPassage = 0;
    currentTest.currentTask = 0;
    currentTest.startTime = Date.now();
    
    console.log('섹션 초기화 완료, switch 진입');
    
    switch(section) {
        case 'reading':
            console.log('Reading 섹션 시작');
            initReadingSection();
            break;
        case 'reading_fillblanks':
            console.log('Reading FillBlanks 섹션 시작');
            initReadingFillBlanks();
            break;
        case 'reading_daily1':
            console.log('Reading Daily1 섹션 시작');
            initReadingDaily1();
            break;
        case 'reading_daily2':
            console.log('Reading Daily2 섹션 시작');
            initReadingDaily2();
            break;
        case 'reading_academic':
            console.log('Reading Academic 섹션 시작');
            initReadingAcademic();
            break;
        case 'listening_response':
            console.log('🎯🎯🎯 Listening Response 섹션 시작');
            console.log('🎯 initListeningResponse 함수 존재:', typeof initListeningResponse);
            try {
                initListeningResponse();
                console.log('✅ initListeningResponse() 호출 완료');
            } catch (error) {
                console.error('❌ initListeningResponse() 에러:', error);
                alert('응답고르기 초기화 실패: ' + error.message);
            }
            break;
        case 'listening_conver':
            console.log('🎯 Listening Conver 섹션 시작');
            console.log('🎯 initListeningConver 함수 존재:', typeof initListeningConver);
            try {
                if (typeof initListeningConver === 'function') {
                    initListeningConver();
                    console.log('✅ initListeningConver() 호출 완료');
                } else {
                    console.error('❌ initListeningConver 함수가 정의되지 않음');
                    alert('컨버 초기화 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                }
            } catch (error) {
                console.error('❌ initListeningConver() 에러:', error);
                alert('컨버 초기화 실패: ' + error.message);
            }
            break;
        case 'listening_announcement':
            console.log('🎯 Listening Announcement 섹션 시작');
            console.log('🎯 initListeningAnnouncement 함수 존재:', typeof initListeningAnnouncement);
            try {
                if (typeof initListeningAnnouncement === 'function') {
                    initListeningAnnouncement();
                    console.log('✅ initListeningAnnouncement() 호출 완료');
                } else {
                    console.error('❌ initListeningAnnouncement 함수가 정의되지 않음');
                    alert('공지사항 초기화 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                }
            } catch (error) {
                console.error('❌ initListeningAnnouncement() 에러:', error);
                alert('공지사항 초기화 실패: ' + error.message);
            }
            break;
        case 'listening_lecture':
            console.log('Listening Lecture 섹션 시작');
            initListeningLecture();
            break;
        case 'writing_arrange':
            console.log('Writing Arrange 섹션 시작');
            initWritingArrange();
            break;
        case 'writing_email':
            console.log('Writing Email 섹션 시작');
            initWritingEmail();
            break;
        case 'writing_discussion':
            console.log('Writing Discussion 섹션 시작');
            initWritingDiscussion();
            break;
        case 'speaking_repeat':
            console.log('=== SPEAKING REPEAT 진단 시작 ===');
            console.log('1. initSpeakingRepeat 타입:', typeof initSpeakingRepeat);
            console.log('2. window.initSpeakingRepeat 타입:', typeof window.initSpeakingRepeat);
            console.log('3. 전역 함수 목록:', Object.keys(window).filter(k => k.includes('Speaking') || k.includes('Repeat')));
            console.log('=== 진단 끝 ===');
            
            if (typeof initSpeakingRepeat === 'function') {
                initSpeakingRepeat();
            } else {
                console.error('❌ initSpeakingRepeat 함수를 찾을 수 없습니다!');
                alert('스피킹 따라말하기 초기화 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
            }
            break;
        case 'speaking_interview':
            console.log('Speaking Interview 섹션 시작');
            initSpeakingInterview();
            break;
        case 'vocab_test':
            console.log('내벨업보카 시험 섹션 시작');
            if (typeof initVocabTest === 'function') {
                // dayTask에서 pages 정보 가져오기
                const pageRange = (currentTest.currentDayTask && currentTest.currentDayTask.pages) || '1-2';
                console.log(`📖 내벨업보카 페이지: ${pageRange}`);
                // week, day 정보도 함께 전달
                initVocabTest(pageRange, currentTest.currentWeek, currentTest.currentDay);
            } else {
                console.error('❌ initVocabTest 함수를 찾을 수 없습니다!');
                alert('내벨업보카 시험 초기화 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
            }
            break;
        case 'listening':
            console.log('Listening 섹션 시작');
            initListeningSection();
            break;
        case 'speaking':
            console.log('Speaking 섹션 시작');
            initSpeakingSection();
            break;
        case 'writing':
            console.log('Writing 섹션 시작');
            initWritingSection();
            break;
        default:
            console.error('알 수 없는 섹션:', section);
            alert('알 수 없는 섹션입니다: ' + section);
    }
}

// ===== READING SECTION =====
function initReadingSection() {
    showScreen('readingScreen');
    
    // 타이머 시작 (54분)
    const timer = createSectionTimer('reading', 54);
    timer.start();
    
    // 첫 번째 지문 로드
    loadReadingPassage(0);
}

function loadReadingPassage(passageIndex) {
    currentTest.currentPassage = passageIndex;
    currentTest.currentQuestion = 0;
    
    const passage = toeflData.reading.passages[passageIndex];
    
    document.getElementById('passageTitle').textContent = passage.title;
    document.getElementById('passageContent').innerHTML = passage.content;
    
    loadReadingQuestion(0);
}

function loadReadingQuestion(questionIndex) {
    currentTest.currentQuestion = questionIndex;
    
    const passage = toeflData.reading.passages[currentTest.currentPassage];
    const question = passage.questions[questionIndex];
    
    // 전체 문제 번호 계산
    let totalQuestionNum = questionIndex + 1;
    for (let i = 0; i < currentTest.currentPassage; i++) {
        totalQuestionNum += toeflData.reading.passages[i].questions.length;
    }
    
    // 총 문제 수 계산
    let totalQuestions = 0;
    toeflData.reading.passages.forEach(p => totalQuestions += p.questions.length);
    
    document.getElementById('readingProgress').textContent = 
        `Question ${totalQuestionNum} of ${totalQuestions}`;
    document.getElementById('currentQuestionNum').textContent = totalQuestionNum;
    document.getElementById('questionContent').textContent = question.question;
    
    // 답안 선택지 렌더링
    const optionsContainer = document.getElementById('answerOptions');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        optionDiv.textContent = option;
        
        // 이전에 선택한 답이 있으면 표시
        const answerId = `${currentTest.currentPassage}-${questionIndex}`;
        if (userAnswers.reading[answerId] === index) {
            optionDiv.classList.add('selected');
        }
        
        optionDiv.onclick = () => selectReadingAnswer(index, optionDiv);
        optionsContainer.appendChild(optionDiv);
    });
    
    // 버튼 상태 업데이트
    updateReadingNavigationButtons();
}

function selectReadingAnswer(answerIndex, element) {
    // 모든 선택 해제
    document.querySelectorAll('#answerOptions .answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // 선택한 답 표시
    element.classList.add('selected');
    
    // 답안 저장
    const answerId = `${currentTest.currentPassage}-${currentTest.currentQuestion}`;
    userAnswers.reading[answerId] = answerIndex;
}

function updateReadingNavigationButtons() {
    const passage = toeflData.reading.passages[currentTest.currentPassage];
    const isLastQuestion = currentTest.currentQuestion === passage.questions.length - 1;
    const isLastPassage = currentTest.currentPassage === toeflData.reading.passages.length - 1;
    
    document.getElementById('prevBtn').disabled = 
        currentTest.currentPassage === 0 && currentTest.currentQuestion === 0;
    
    if (isLastQuestion && isLastPassage) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'inline-flex';
    } else {
        document.getElementById('nextBtn').style.display = 'inline-flex';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

function previousQuestion() {
    const passage = toeflData.reading.passages[currentTest.currentPassage];
    
    if (currentTest.currentQuestion > 0) {
        loadReadingQuestion(currentTest.currentQuestion - 1);
    } else if (currentTest.currentPassage > 0) {
        loadReadingPassage(currentTest.currentPassage - 1);
        const prevPassage = toeflData.reading.passages[currentTest.currentPassage];
        loadReadingQuestion(prevPassage.questions.length - 1);
    }
}

function nextQuestion() {
    const passage = toeflData.reading.passages[currentTest.currentPassage];
    
    if (currentTest.currentQuestion < passage.questions.length - 1) {
        loadReadingQuestion(currentTest.currentQuestion + 1);
    } else if (currentTest.currentPassage < toeflData.reading.passages.length - 1) {
        loadReadingPassage(currentTest.currentPassage + 1);
    }
}

// ===== LISTENING SECTION =====
let currentListeningItem = 0;
let listeningQuestionIndex = 0;

function initListeningSection() {
    showScreen('listeningScreen');
    
    // 타이머 시작 (41분)
    const timer = createSectionTimer('listening', 41);
    timer.start();
    
    currentListeningItem = 0;
    listeningQuestionIndex = 0;
    
    loadListeningItem(0);
}

function loadListeningItem(itemIndex) {
    currentListeningItem = itemIndex;
    listeningQuestionIndex = 0;
    
    // 오디오 섹션 표시, 질문 섹션 숨김
    document.getElementById('audioSection').style.display = 'block';
    document.getElementById('listeningQuestionSection').style.display = 'none';
    
    // 대화와 강의 통합
    const allItems = [...toeflData.listening.conversations, ...toeflData.listening.lectures];
    const item = allItems[itemIndex];
    
    // 오디오 플레이어 설정
    const audioInstruction = document.querySelector('.audio-instruction h3');
    const audioDesc = document.querySelector('.audio-instruction p');
    
    if (itemIndex < toeflData.listening.conversations.length) {
        audioInstruction.textContent = 'Now listen to a conversation';
    } else {
        audioInstruction.textContent = 'Now listen to a lecture';
    }
    
    audioDesc.textContent = item.audioDescription || '오디오를 주의깊게 들으세요. 메모를 할 수 있습니다.';
    
    // 실제 환경에서는 오디오 URL 설정
    const audioPlayer = document.getElementById('audioPlayer');
    if (item.audioUrl) {
        audioPlayer.querySelector('source').src = item.audioUrl;
        audioPlayer.load();
    } else {
        // 데모용: 오디오가 없을 때
        audioPlayer.style.display = 'none';
    }
}

function startListeningQuestions() {
    document.getElementById('audioSection').style.display = 'none';
    document.getElementById('listeningQuestionSection').style.display = 'block';
    
    loadListeningQuestion(0);
}

function loadListeningQuestion(questionIndex) {
    listeningQuestionIndex = questionIndex;
    
    const allItems = [...toeflData.listening.conversations, ...toeflData.listening.lectures];
    const item = allItems[currentListeningItem];
    const question = item.questions[questionIndex];
    
    // 전체 문제 번호 계산
    let totalQuestionNum = questionIndex + 1;
    for (let i = 0; i < currentListeningItem; i++) {
        totalQuestionNum += allItems[i].questions.length;
    }
    
    // 총 문제 수 계산
    let totalQuestions = 0;
    allItems.forEach(item => totalQuestions += item.questions.length);
    
    document.getElementById('listeningProgress').textContent = 
        `Question ${totalQuestionNum} of ${totalQuestions}`;
    document.getElementById('listeningQuestionNum').textContent = totalQuestionNum;
    document.getElementById('listeningQuestionContent').textContent = question.question;
    
    // 답안 선택지 렌더링
    const optionsContainer = document.getElementById('listeningAnswerOptions');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        optionDiv.textContent = option;
        
        // 이전에 선택한 답이 있으면 표시
        const answerId = `${currentListeningItem}-${questionIndex}`;
        if (userAnswers.listening[answerId] === index) {
            optionDiv.classList.add('selected');
        }
        
        optionDiv.onclick = () => selectListeningAnswer(index, optionDiv);
        optionsContainer.appendChild(optionDiv);
    });
}

function selectListeningAnswer(answerIndex, element) {
    document.querySelectorAll('#listeningAnswerOptions .answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    element.classList.add('selected');
    
    const answerId = `${currentListeningItem}-${listeningQuestionIndex}`;
    userAnswers.listening[answerId] = answerIndex;
}

function previousListeningQuestion() {
    const allItems = [...toeflData.listening.conversations, ...toeflData.listening.lectures];
    const item = allItems[currentListeningItem];
    
    if (listeningQuestionIndex > 0) {
        loadListeningQuestion(listeningQuestionIndex - 1);
    }
}

function nextListeningQuestion() {
    const allItems = [...toeflData.listening.conversations, ...toeflData.listening.lectures];
    const item = allItems[currentListeningItem];
    
    if (listeningQuestionIndex < item.questions.length - 1) {
        loadListeningQuestion(listeningQuestionIndex + 1);
    } else if (currentListeningItem < allItems.length - 1) {
        loadListeningItem(currentListeningItem + 1);
    } else {
        // 리스닝 섹션 완료
        if (confirm('Listening 섹션을 완료하시겠습니까?')) {
            if (currentTest.section === 'full') {
                startSection('speaking');
            } else {
                calculateAndShowResults();
            }
        }
    }
}

// ===== SPEAKING SECTION =====
let currentSpeakingTask = 0;
let preparationTimer = null;
let recordingTimer = null;
let mediaRecorder = null;
let audioChunks = [];

function initSpeakingSection() {
    showScreen('speakingScreen');
    
    // 타이머 시작 (17분)
    const timer = createSectionTimer('speaking', 17);
    timer.start();
    
    currentSpeakingTask = 0;
    loadSpeakingTask(0);
}

function loadSpeakingTask(taskIndex) {
    currentSpeakingTask = taskIndex;
    const task = toeflData.speaking.tasks[taskIndex];
    
    document.getElementById('speakingProgress').textContent = 
        `Task ${taskIndex + 1} of ${toeflData.speaking.tasks.length}`;
    document.getElementById('speakingTaskTitle').textContent = task.title;
    
    let promptHTML = `<p>${task.prompt}</p>`;
    
    if (task.readingText) {
        promptHTML += `<div style="background: var(--bg-color); padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4>Reading:</h4>
            <p>${task.readingText}</p>
        </div>`;
    }
    
    if (task.listeningDescription) {
        promptHTML += `<div style="background: var(--bg-color); padding: 20px; border-radius: 8px; margin-top: 15px;">
            <h4>Listening:</h4>
            <p><em>${task.listeningDescription}</em></p>
        </div>`;
    }
    
    document.getElementById('speakingPrompt').innerHTML = promptHTML;
    
    // 섹션 초기화
    document.getElementById('preparationSection').style.display = 'block';
    document.getElementById('recordingSection').style.display = 'none';
    document.getElementById('startRecordBtn').style.display = 'inline-flex';
    document.getElementById('nextSpeakingBtn').style.display = 'none';
    document.getElementById('speakingNotes').value = '';
}

function startSpeakingTask() {
    const task = toeflData.speaking.tasks[currentSpeakingTask];
    
    document.getElementById('startRecordBtn').style.display = 'none';
    
    // 준비 시간 시작
    const prepTimerElement = document.getElementById('prepTimer');
    preparationTimer = createPreparationTimer(task.preparationTime, prepTimerElement, () => {
        // 준비 시간 종료, 녹음 시작
        startRecording(task.responseTime);
    });
}

async function startRecording(duration) {
    document.getElementById('preparationSection').style.display = 'none';
    document.getElementById('recordingSection').style.display = 'block';
    
    const recordTimerElement = document.getElementById('recordTimer');
    recordingTimer = createRecordingTimer(duration, recordTimerElement, () => {
        stopRecording();
    });
    
    // 실제 녹음 시작 (브라우저 지원 시)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            userAnswers.speaking[currentSpeakingTask] = audioBlob;
            
            stream.getTracks().forEach(track => track.stop());
        });
        
        mediaRecorder.start();
    } catch (error) {
        console.log('음성 녹음을 사용할 수 없습니다:', error);
        // 데모 모드에서는 에러 무시
    }
}

function stopRecording() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
    }
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    document.getElementById('recordingSection').style.display = 'none';
    document.getElementById('nextSpeakingBtn').style.display = 'inline-flex';
}

function nextSpeakingTask() {
    if (currentSpeakingTask < toeflData.speaking.tasks.length - 1) {
        loadSpeakingTask(currentSpeakingTask + 1);
    } else {
        // Speaking 섹션 완료
        if (confirm('Speaking 섹션을 완료하시겠습니까?')) {
            if (currentTest.section === 'full') {
                startSection('writing');
            } else {
                calculateAndShowResults();
            }
        }
    }
}

// ===== WRITING SECTION =====
let currentWritingTask = 0;

function initWritingSection() {
    showScreen('writingScreen');
    
    // 타이머 시작 (50분)
    const timer = createSectionTimer('writing', 50);
    timer.start();
    
    currentWritingTask = 0;
    loadWritingTask(0);
}

function loadWritingTask(taskIndex) {
    currentWritingTask = taskIndex;
    const task = toeflData.writing.tasks[taskIndex];
    
    document.getElementById('writingProgress').textContent = 
        `Task ${taskIndex + 1} of ${toeflData.writing.tasks.length}`;
    document.getElementById('writingTaskTitle').textContent = task.title;
    
    let promptHTML = task.prompt;
    
    if (task.readingPassage) {
        promptHTML = `<h4>Reading Passage:</h4>
            ${task.readingPassage}
            <div style="margin-top: 20px; padding: 15px; background: var(--bg-color); border-radius: 8px;">
                <h4>Listening:</h4>
                <p><em>${task.listeningDescription}</em></p>
            </div>
            <div style="margin-top: 20px;">
                <h4>Question:</h4>
                <p>${task.prompt}</p>
            </div>`;
    }
    
    document.getElementById('writingPrompt').innerHTML = promptHTML;
    
    // 이전에 작성한 내용이 있으면 불러오기
    const savedText = userAnswers.writing[taskIndex] || '';
    document.getElementById('writingEditor').value = savedText;
    updateWordCount();
}

function formatText(command) {
    document.execCommand(command, false, null);
}

function updateWordCount() {
    const text = document.getElementById('writingEditor').value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    document.getElementById('wordCount').textContent = words.length;
}

// 단어 수 업데이트를 위한 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    const writingEditor = document.getElementById('writingEditor');
    if (writingEditor) {
        writingEditor.addEventListener('input', updateWordCount);
    }
});

function saveWriting() {
    const text = document.getElementById('writingEditor').value;
    userAnswers.writing[currentWritingTask] = text;
    alert('초안이 저장되었습니다.');
}

function nextWritingTask() {
    // 현재 작성 중인 내용 저장
    const text = document.getElementById('writingEditor').value;
    userAnswers.writing[currentWritingTask] = text;
    
    if (currentWritingTask < toeflData.writing.tasks.length - 1) {
        loadWritingTask(currentWritingTask + 1);
    } else {
        // Writing 섹션 완료
        if (confirm('Writing 섹션을 완료하시겠습니까?')) {
            calculateAndShowResults();
        }
    }
}

// ===== SUBMIT & RESULTS =====
function submitSection() {
    if (confirm('정말로 제출하시겠습니까? 제출 후에는 답안을 수정할 수 없습니다.')) {
        calculateAndShowResults();
    }
}

function calculateAndShowResults() {
    stopAllTimers();
    
    let readingScore = 0;
    let listeningScore = 0;
    
    // Reading 점수 계산
    let readingCorrect = 0;
    let readingTotal = 0;
    
    toeflData.reading.passages.forEach((passage, passageIndex) => {
        passage.questions.forEach((question, questionIndex) => {
            readingTotal++;
            const answerId = `${passageIndex}-${questionIndex}`;
            if (userAnswers.reading[answerId] === question.correctAnswer) {
                readingCorrect++;
            }
        });
    });
    
    readingScore = Math.round((readingCorrect / readingTotal) * 30);
    
    // Listening 점수 계산
    let listeningCorrect = 0;
    let listeningTotal = 0;
    
    const allListeningItems = [...toeflData.listening.conversations, ...toeflData.listening.lectures];
    allListeningItems.forEach((item, itemIndex) => {
        item.questions.forEach((question, questionIndex) => {
            listeningTotal++;
            const answerId = `${itemIndex}-${questionIndex}`;
            if (userAnswers.listening[answerId] === question.correctAnswer) {
                listeningCorrect++;
            }
        });
    });
    
    listeningScore = Math.round((listeningCorrect / listeningTotal) * 30);
    
    // Speaking과 Writing은 자동 채점 불가 (임의 점수)
    const speakingScore = 22; // 데모용
    const writingScore = 24; // 데모용
    
    const totalScore = readingScore + listeningScore + speakingScore + writingScore;
    
    // 결과 화면 표시
    showScreen('resultScreen');
    
    document.getElementById('totalScore').textContent = totalScore;
    document.getElementById('readingScore').textContent = `${readingScore}/30`;
    document.getElementById('listeningScore').textContent = `${listeningScore}/30`;
    document.getElementById('speakingScore').textContent = `${speakingScore}/30`;
    document.getElementById('writingScore').textContent = `${writingScore}/30`;
}

function reviewAnswers() {
    alert('답안 확인 기능은 개발 중입니다.');
    // TODO: 답안 리뷰 화면 구현
}

function restartTest() {
    if (confirm('시험을 처음부터 다시 시작하시겠습니까?')) {
        // 답안 초기화
        userAnswers = {
            reading: {},
            listening: {},
            speaking: {},
            writing: {}
        };
        
        // 상태 초기화
        currentTest = {
            section: null,
            currentQuestion: 0,
            currentPassage: 0,
            currentTask: 0,
            startTime: null,
            answers: {}
        };
        
        showWelcomeScreen();
    }
}

function exportResults() {
    const results = {
        date: new Date().toLocaleDateString(),
        reading: document.getElementById('readingScore').textContent,
        listening: document.getElementById('listeningScore').textContent,
        speaking: document.getElementById('speakingScore').textContent,
        writing: document.getElementById('writingScore').textContent,
        total: document.getElementById('totalScore').textContent + '/120'
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `toefl-results-${Date.now()}.json`;
    link.click();
    
    alert('결과가 다운로드되었습니다.');
}
