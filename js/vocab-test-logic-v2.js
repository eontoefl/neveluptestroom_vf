// 내벨업보카 시험 로직 - 페이지별 분할 시스템

// 전역 변수
let vocabTestData = [];
let vocabUserAnswers = {};
let currentPages = '';
let currentPageIndex = 0;
let pageGroups = [];
let currentWeekId = null;
let currentDayId = null;

// Google Sheets 설정
const VOCAB_SPREADSHEET_ID = '1I9R-yNiRrp12lDQ_pIk6_tUFO2KcxkG_akrwPj3zKws';
const VOCAB_SHEET_GID = '0';

// CSV 파싱 함수
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && inQuotes && nextChar === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
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

// 페이지 범위 파싱 (예: "5-6" → [5, 6])
function parsePageRange(pageRange) {
    if (pageRange.includes('-')) {
        const [start, end] = pageRange.split('-').map(p => parseInt(p.trim()));
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    } else {
        return [parseInt(pageRange.trim())];
    }
}

// 데이터 로드
async function loadVocabData(pageRange) {
    console.log('📚 내벨업보카 데이터 로드 시작 - 페이지:', pageRange);
    currentPages = pageRange;
    
    const pages = parsePageRange(pageRange);
    console.log('📖 시험 페이지:', pages.join(', '));
    
    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${VOCAB_SPREADSHEET_ID}/export?format=csv&gid=${VOCAB_SHEET_GID}`;
        console.log('CSV URL:', csvUrl);
        
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        
        vocabTestData = [];
        
        // 첫 행은 헤더이므로 건너뛰기
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            
            if (values.length >= 2) {
                const page = parseInt(values[0]);
                const headword = values[1].trim();
                
                // 해당 페이지의 단어만 필터링
                if (pages.includes(page) && headword) {
                    const synonyms = [];
                    
                    // synonym1부터 synonym8까지 (최대 8개)
                    for (let j = 2; j <= 9; j++) {
                        if (values[j] && values[j].trim()) {
                            synonyms.push(values[j].trim());
                        }
                    }
                    
                    if (synonyms.length > 0) {
                        vocabTestData.push({
                            page: page,
                            headword: headword,
                            synonyms: synonyms
                        });
                    }
                }
            }
        }
        
        console.log(`✅ ${vocabTestData.length}개의 단어 로드 완료 (Google Sheets)`);
    } catch (error) {
        console.error('❌ Google Sheets 로드 실패:', error);
        alert('데이터를 불러오는데 실패했습니다. 다시 시도해주세요.');
    }
}

// 내벨업보카 섹션 초기화
async function initVocabTest(pageRange, weekId, dayId) {
    console.log(`📚 내벨업보카 섹션 초기화 - 페이지: ${pageRange}`);
    
    // 주차/요일 정보 저장
    currentWeekId = weekId || null;
    currentDayId = dayId || null;
    
    // 데이터 로드
    await loadVocabData(pageRange);
    
    // 화면 표시
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const vocabScreen = document.getElementById('vocabTestScreen');
    vocabScreen.classList.add('active');
    vocabScreen.style.display = 'block';
    
    console.log('✅ vocabTestScreen 화면 전환 완료');
    
    // 페이지별로 그룹화
    const pages = parsePageRange(pageRange);
    pageGroups = [];
    pages.forEach(page => {
        const pageData = vocabTestData.filter(item => item.page === page);
        if (pageData.length > 0) {
            pageGroups.push({
                page: page,
                data: pageData
            });
        }
    });
    currentPageIndex = 0;
    
    console.log(`✅ 총 ${pageGroups.length}개 페이지로 분할됨`);
    
    // 시험 제목 업데이트
    updateVocabTestTitle(pageRange);
    
    // 소개 화면 업데이트
    updateIntroScreen(pageRange);
    
    // 소개 화면 표시
    document.getElementById('vocabTestIntro').style.display = 'block';
    document.getElementById('vocabTestMain').style.display = 'none';
}

// 인트로 화면 업데이트
function updateIntroScreen(pageRange) {
    // Week N - X요일 표시
    const weekDayElement = document.querySelector('#vocabTestIntro .intro-week-day');
    if (weekDayElement && currentWeekId && currentDayId) {
        weekDayElement.textContent = `Week ${currentWeekId} - ${currentDayId}요일`;
        weekDayElement.style.display = 'block';
    }
    
    // 페이지 정보 표시
    const pageInfoElement = document.querySelector('#vocabTestIntro .intro-page-info');
    if (pageInfoElement) {
        // 🎯 "5-6" → "5, 6" 형식으로 변환
        const formattedPageRange = pageRange.replace('-', ', ');
        pageInfoElement.textContent = `페이지 ${formattedPageRange} (총 ${vocabTestData.length}개 단어)`;
        pageInfoElement.style.display = 'block';
    }
}

// 시험 제목 업데이트
function updateVocabTestTitle(pageRange) {
    const titleElement = document.querySelector('#vocabTestScreen .test-title span');
    if (titleElement) {
        titleElement.textContent = `내벨업보카 시험 (p.${pageRange})`;
    }
}

// 시험 시작
function startVocabTest() {
    console.log('✅ 내벨업보카 시험 시작');
    
    // 사용자 답안 초기화
    vocabUserAnswers = {};
    currentPageIndex = 0;
    
    // 소개 화면 숨기고 시험 화면 표시
    document.getElementById('vocabTestIntro').style.display = 'none';
    document.getElementById('vocabTestMain').style.display = 'block';
    
    // 첫 페이지 렌더링
    renderCurrentPage();
}

// 현재 페이지 렌더링
function renderCurrentPage() {
    const currentGroup = pageGroups[currentPageIndex];
    const container = document.getElementById('vocabTestContainer');
    container.innerHTML = '';
    
    // 진행 상태 업데이트 - 🎯 구조화된 HTML로 변경
    const progressHTML = `
        <span class="vocab-progress-page">페이지 ${currentGroup.page}</span>
        <span class="vocab-progress-divider">•</span>
        <span class="vocab-progress-count">${currentPageIndex + 1}/${pageGroups.length}</span>
        <span class="vocab-progress-divider">•</span>
        <span class="vocab-progress-words">${currentGroup.data.length}개 단어</span>
    `;
    document.getElementById('vocabTestProgressText').innerHTML = progressHTML;
    
    // 🎯 이전 페이지 버튼 표시/숨김
    const prevBtn = document.querySelector('.vocab-prev-btn');
    if (prevBtn) {
        if (currentPageIndex > 0) {
            prevBtn.style.display = 'inline-block';
        } else {
            prevBtn.style.display = 'none';
        }
    }
    
    // 제출 버튼 텍스트 변경
    const submitBtn = document.querySelector('.vocab-submit-btn');
    if (submitBtn) {
        if (currentPageIndex < pageGroups.length - 1) {
            submitBtn.innerHTML = '<i class="fas fa-arrow-right"></i>'; /* 🎯 아이콘만 */
        } else {
            submitBtn.innerHTML = '<i class="fas fa-check"></i>'; /* 🎯 아이콘만 */
        }
    }
    
    // 🎯 컬럼 헤더 추가
    const headerDiv = document.createElement('div');
    headerDiv.className = 'vocab-header';
    headerDiv.innerHTML = `
        <div class="vocab-header-headword">표제어</div>
        <div class="vocab-header-synonyms">동의어</div>
    `;
    container.appendChild(headerDiv);
    
    // 문제 렌더링
    currentGroup.data.forEach((item) => {
        const globalIndex = vocabTestData.indexOf(item);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'vocab-item';
        itemDiv.dataset.index = globalIndex;
        
        // 🎯 표제어 부분 (라벨 제거)
        const headwordDiv = document.createElement('div');
        headwordDiv.className = 'vocab-headword';
        headwordDiv.innerHTML = `
            <div class="vocab-headword-text">${item.headword}</div>
        `;
        
        // 🎯 동의어 입력 부분 (라벨 제거)
        const synonymsDiv = document.createElement('div');
        synonymsDiv.className = 'vocab-synonyms';
        
        item.synonyms.forEach((_, synIndex) => {
            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'vocab-synonym-input-wrapper';
            
            inputWrapper.innerHTML = `
                <input 
                    type="text" 
                    class="vocab-synonym-input" 
                    data-word-index="${globalIndex}" 
                    data-synonym-index="${synIndex}"
                    placeholder="동의어를 입력하세요"
                    autocomplete="off"
                    value="${vocabUserAnswers[globalIndex] && vocabUserAnswers[globalIndex][synIndex] || ''}"
                >
            `;
            
            synonymsDiv.appendChild(inputWrapper);
        });
        
        itemDiv.appendChild(headwordDiv);
        itemDiv.appendChild(synonymsDiv);
        container.appendChild(itemDiv);
    });
    
    // 입력 이벤트 리스너 추가
    document.querySelectorAll('.vocab-synonym-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const wordIdx = parseInt(e.target.dataset.wordIndex);
            const synIdx = parseInt(e.target.dataset.synonymIndex);
            
            if (!vocabUserAnswers[wordIdx]) {
                vocabUserAnswers[wordIdx] = {};
            }
            
            // trim 적용
            vocabUserAnswers[wordIdx][synIdx] = e.target.value.trim();
        });
    });
}

// 🎯 이전 페이지로 이동
function goToPrevPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        renderCurrentPage();
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 시험 제출 또는 다음 페이지
function submitVocabTest() {
    // 다음 페이지가 있으면 다음 페이지로
    if (currentPageIndex < pageGroups.length - 1) {
        currentPageIndex++;
        renderCurrentPage();
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    // 마지막 페이지면 제출
    if (!confirm('제출하시겠습니까?')) {
        return;
    }
    
    // 채점 화면으로 이동
    showVocabTestResult();
}

// 채점 결과 화면 표시
function showVocabTestResult() {
    console.log('📊 채점 결과 표시');
    
    // 채점
    const results = [];
    let correctCount = 0;
    let totalCount = vocabTestData.length;
    
    vocabTestData.forEach((item, index) => {
        const userAnswer = vocabUserAnswers[index] || {};
        const synonymResults = [];
        let allCorrect = true;
        
        item.synonyms.forEach((correctSynonym, synIndex) => {
            const userSynonym = (userAnswer[synIndex] || '').trim().toLowerCase();
            const correctSynLower = correctSynonym.trim().toLowerCase();
            const isCorrect = userSynonym === correctSynLower;
            
            if (!isCorrect) {
                allCorrect = false;
            }
            
            synonymResults.push({
                userAnswer: userAnswer[synIndex] || '',
                correctAnswer: correctSynonym,
                isCorrect: isCorrect
            });
        });
        
        if (allCorrect) {
            correctCount++;
        }
        
        results.push({
            headword: item.headword,
            synonyms: synonymResults,
            allCorrect: allCorrect
        });
    });
    
    const percentage = Math.round((correctCount / totalCount) * 100);
    
    // 결과 렌더링
    renderVocabResult(results, correctCount, totalCount, percentage);
    
    // 결과 화면으로 전환
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const resultScreen = document.getElementById('vocabResultScreen');
    resultScreen.classList.add('active');
    resultScreen.style.display = 'block';
}

// 결과 렌더링
function renderVocabResult(results, correctCount, totalCount, percentage) {
    const container = document.getElementById('vocabResultContainer');
    
    // 점수 카드
    const scoreCard = `
        <div class="vocab-score-card">
            <div class="vocab-score-title">시험 결과 (p.${currentPages})</div>
            <div class="vocab-score-percentage">${percentage}%</div>
            <div class="vocab-score-stats">
                <div class="vocab-stat-item">
                    <div class="vocab-stat-label">정답</div>
                    <div class="vocab-stat-value vocab-stat-correct">${correctCount}</div>
                </div>
                <div class="vocab-stat-item">
                    <div class="vocab-stat-label">오답</div>
                    <div class="vocab-stat-value vocab-stat-wrong">${totalCount - correctCount}</div>
                </div>
                <div class="vocab-stat-item">
                    <div class="vocab-stat-label">총 문제</div>
                    <div class="vocab-stat-value">${totalCount}</div>
                </div>
            </div>
        </div>
    `;
    
    // 결과 리스트
    let resultsList = '<div class="vocab-results-list">';
    resultsList += '<div class="vocab-results-header">문제별 결과</div>';
    
    results.forEach((result) => {
        const statusClass = result.allCorrect ? 'correct' : 'wrong';
        const statusIcon = result.allCorrect 
            ? '<div class="status-icon-o"><i class="fas fa-check"></i></div>' 
            : '<div class="status-icon-x"><i class="fas fa-times"></i></div>';
        const statusText = result.allCorrect ? '정답' : '오답';
        
        resultsList += `
            <div class="vocab-result-item ${statusClass}">
                <div class="vocab-result-header">
                    <div class="vocab-result-headword">
                        ${statusIcon}
                        <div class="vocab-result-headword-text">${result.headword}</div>
                    </div>
                    <div class="vocab-result-status ${statusClass}">${statusText}</div>
                </div>
                <div class="vocab-result-synonyms">
        `;
        
        result.synonyms.forEach((syn, synIndex) => {
            const userAnswerClass = syn.isCorrect ? 'correct' : (syn.userAnswer ? 'wrong' : 'empty');
            const userAnswerText = syn.userAnswer || '-';
            
            resultsList += `
                <div class="vocab-synonym-row">
                    <div class="syn-label">동의어 ${synIndex + 1}</div>
                    <div class="syn-my-label">내 답안</div>
                    <div class="syn-user-box">${userAnswerText}</div>
                    <div class="syn-arrow">→</div>
                    <div class="syn-correct-label">정답</div>
                    <div class="syn-correct ${userAnswerClass}">${syn.correctAnswer}</div>
                </div>
            `;
        });
        
        resultsList += `
                </div>
            </div>
        `;
    });
    
    resultsList += '</div>';
    
    container.innerHTML = scoreCard + resultsList;
}

// 시험 재시작
function restartVocabTest() {
    vocabUserAnswers = {};
    currentPageIndex = 0;
    
    // 시험 화면으로 복귀
    document.getElementById('vocabResultScreen').style.display = 'none';
    document.getElementById('vocabTestScreen').style.display = 'block';
    document.getElementById('vocabTestIntro').style.display = 'block';
    document.getElementById('vocabTestMain').style.display = 'none';
}

// Cleanup 함수
function cleanupVocabTest() {
    vocabTestData = [];
    vocabUserAnswers = {};
    currentPages = '';
    currentPageIndex = 0;
    pageGroups = [];
    currentWeekId = null;
    currentDayId = null;
}

console.log('✅ vocab-test-logic.js 로드 완료');
