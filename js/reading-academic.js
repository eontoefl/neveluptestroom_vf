// Reading - 아카데믹리딩 (Academic Reading) 데이터 구조
// Google Sheets 연동 방식 (일상리딩1/2와 동일한 구조, 문제 5개)

const ACADEMIC_SHEET_CONFIG = {
    spreadsheetId: '12EmtpZUXLyqyHH8iFfBiBgw7DVzP15LUWcIEaQLuOfY',
    sheetGid: '421928479', // 아카데믹리딩 데이터용 시트
};

// Google Sheets에서 아카데믹리딩 데이터 가져오기
/**
 * Google Sheets에서 아카데믹 리딩 데이터 로드
 * @returns {Array|null} 세트 배열 또는 null
 */
async function fetchAcademicFromSheet() {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${ACADEMIC_SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${ACADEMIC_SHEET_CONFIG.sheetGid}`;
    
    try {
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            console.warn('⚠️ [아카데믹리딩] 시트 접근 불가');
            return null;
        }
        
        const csvText = await response.text();
        const parsedData = parseAcademicCSV(csvText);
        
        // parseAcademicCSV는 {type, timeLimit, sets} 객체를 반환
        // 우리는 sets 배열만 필요
        if (parsedData && parsedData.sets && Array.isArray(parsedData.sets)) {
            console.log(`✅ [아카데믹리딩] ${parsedData.sets.length}개 세트 파싱 성공`);
            return parsedData.sets;
        }
        
        console.warn('⚠️ [아카데믹리딩] 파싱 데이터 형식 오류');
        return null;
        
    } catch (error) {
        console.error('❌ [아카데믹리딩] 데이터 로드 실패:', error);
        return null;
    }
}

// CSV 따옴표 제거 헬퍼 함수
function removeQuotesAcademic(str) {
    if (typeof str !== 'string') return str;
    if (str.startsWith('"') && str.endsWith('"')) {
        return str.slice(1, -1);
    }
    return str;
}

// 문제 데이터 파싱 (Q번호::문제원문::문제해석::정답번호::보기데이터##보기데이터...)
function parseAcademicQuestionData(questionStr) {
    console.log('🔍 [아카데믹리딩] 문제 파싱 시작:', questionStr.substring(0, 100) + '...');
    
    if (!questionStr || questionStr.trim() === '') {
        console.warn('⚠️ [아카데믹리딩] 문제 데이터가 비어있습니다');
        return null;
    }
    
    const parts = questionStr.split('::');
    console.log('📊 [아카데믹리딩] 분할된 파트 개수:', parts.length);
    
    if (parts.length < 5) {
        console.error('❌ [아카데믹리딩] 파트가 5개 미만입니다. 최소 5개 필요 (Q번호::문제::해석::정답번호::보기들)');
        return null;
    }
    
    const questionNum = parts[0].trim(); // Q1, Q2, Q3, Q4, Q5
    const questionText = parts[1].trim();
    const questionTranslation = parts[2].trim();
    const correctAnswer = parseInt(parts[3].trim());
    
    // ✅ 중요: 5번째 요소부터 끝까지 전부 합치기 (보기 설명에 ::가 포함될 수 있음)
    const optionsStr = parts.slice(4).join('::').trim();
    
    console.log('✅ [아카데믹리딩] 문제 번호:', questionNum);
    console.log('✅ [아카데믹리딩] 정답 번호:', correctAnswer);
    console.log('✅ [아카데믹리딩] 보기 문자열:', optionsStr.substring(0, 150) + '...');
    
    // 보기 파싱 (A)보기원문::보기해석::보기설명##B)...)
    const optionParts = optionsStr.split('##');
    console.log('📝 [아카데믹리딩] 보기 개수:', optionParts.length);
    
    const options = optionParts.map((optStr, idx) => {
        const optParts = optStr.split('::');
        
        if (optParts.length < 3) {
            console.warn(`  ⚠️ [아카데믹리딩] 보기 ${idx + 1} 파트가 3개 미만입니다`);
            return null;
        }
        
        const optionText = optParts[0].trim(); // A)Free yoga classes
        const optionTranslation = optParts[1].trim();
        const optionExplanation = optParts.slice(2).join('::').trim();
        
        // A), B) 등에서 레이블 추출
        const match = optionText.match(/^([A-D])\)(.*)/);
        if (!match) {
            console.warn(`  ⚠️ [아카데믹리딩] 보기 ${idx + 1} 형식이 잘못됨:`, optionText);
            return null;
        }
        
        const result = {
            label: match[1], // A, B, C, D
            text: match[2].trim(),
            translation: optionTranslation,
            explanation: optionExplanation
        };
        
        console.log(`  ✅ [아카데믹리딩] 보기 ${idx + 1} 파싱 완료:`, result.label, result.text.substring(0, 30));
        return result;
    }).filter(opt => opt !== null);
    
    console.log('🎯 [아카데믹리딩] 최종 파싱된 보기 개수:', options.length);
    
    return {
        questionNum,
        question: questionText,
        questionTranslation,
        correctAnswer,
        options
    };
}

// CSV 파싱
function parseAcademicCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        console.warn('[아카데믹리딩] CSV 데이터가 충분하지 않습니다');
        return null;
    }
    
    // 헤더 스킵
    const dataLines = lines.slice(1);
    const sets = [];
    
    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const cols = parseCSVLineAcademic(line);
        
        if (cols.length < 11) { // A-K열 (11개)
            console.warn(`[아카데믹리딩] ${i+2}번째 행: 컬럼이 11개 미만 (현재: ${cols.length})`);
            continue;
        }
        
        // 따옴표 제거 (CSV export 시 자동 추가되는 따옴표)
        let id = removeQuotesAcademic(cols[0]);
        
        // ✅ 빈 행 스킵 (id가 비어있으면 무시)
        if (!id) {
            continue;
        }
        
        const mainTitle = removeQuotesAcademic(cols[1]);
        const passageTitle = removeQuotesAcademic(cols[2]);
        const passageContent = removeQuotesAcademic(cols[3]);
        const sentenceTranslations = removeQuotesAcademic(cols[4]);
        const interactiveWords = removeQuotesAcademic(cols[5]);
        const question1Str = removeQuotesAcademic(cols[6]);
        const question2Str = removeQuotesAcademic(cols[7]);
        const question3Str = removeQuotesAcademic(cols[8]);
        const question4Str = removeQuotesAcademic(cols[9]);
        const question5Str = removeQuotesAcademic(cols[10]); // ✅ 5번째 문제 추가
        
        console.log(`\n📚 [아카데믹리딩] Set ${i+1} 파싱 시작: ${id}`);
        console.log('  문제1:', question1Str.substring(0, 100));
        console.log('  문제2:', question2Str.substring(0, 100));
        console.log('  문제3:', question3Str.substring(0, 100));
        console.log('  문제4:', question4Str.substring(0, 100));
        console.log('  문제5:', question5Str.substring(0, 100));
        
        // 문장별 해석
        const translations = sentenceTranslations.split('##').map(t => t.trim());
        
        // 인터랙티브 단어 파싱
        const interactiveWordsList = [];
        if (interactiveWords && interactiveWords.trim() !== '') {
            const wordParts = interactiveWords.split('##');
            wordParts.forEach(part => {
                const [word, translation, explanation] = part.split('::').map(s => s.trim());
                if (word && translation && explanation) {
                    interactiveWordsList.push({ word, translation, explanation });
                }
            });
        }
        
        // 5개 문제 파싱
        const q1 = parseAcademicQuestionData(question1Str);
        const q2 = parseAcademicQuestionData(question2Str);
        const q3 = parseAcademicQuestionData(question3Str);
        const q4 = parseAcademicQuestionData(question4Str);
        const q5 = parseAcademicQuestionData(question5Str);
        
        const questions = [q1, q2, q3, q4, q5].filter(q => q !== null);
        
        if (questions.length !== 5) {
            console.error(`❌ [아카데믹리딩] Set ${i+1}: 문제가 5개가 아닙니다 (현재: ${questions.length})`);
            continue;
        }
        
        // ✅ Set ID 강제 정규화: academic_set_1 → academic_set_0001
        let normalizedId = id;
        if (id) {
            const match = id.match(/academic_set_(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                normalizedId = `academic_set_${String(num).padStart(4, '0')}`;
                console.log(`  ✅ Set ID 정규화: ${match[0]} → ${normalizedId}`);
            }
        }
        id = normalizedId;
        
        sets.push({
            id,
            mainTitle,
            passage: {
                title: passageTitle,
                content: passageContent,
                translations,
                interactiveWords: interactiveWordsList
            },
            questions
        });
    }
    
    // ✅ Set ID 기준으로 정렬 (academic_set_0001, academic_set_0002, ...)
    console.log('🔄 [아카데믹리딩] 정렬 전 순서:', sets.map(s => s.id));
    
    sets.sort((a, b) => {
        const numA = parseInt(a.id.replace('academic_set_', ''));
        const numB = parseInt(b.id.replace('academic_set_', ''));
        console.log(`  비교: ${a.id} (${numA}) vs ${b.id} (${numB}) → ${numA - numB}`);
        return numA - numB;
    });
    
    console.log('✅ [아카데믹리딩] 정렬 후 순서:', sets.map(s => s.id));
    
    // 디버깅: 최종 데이터 검증
    sets.forEach((set, idx) => {
        console.log(`  [${idx}] ${set.id} - ${set.mainTitle} - ${set.questions.length}문제`);
    });
    
    console.log(`\n✅ [아카데믹리딩] 총 ${sets.length}개 세트 파싱 완료`);
    
    return {
        type: 'academic_reading',
        timeLimit: 120, // 120초 (2분) - 세트마다
        sets
    };
}

// CSV 라인 파싱 (쉼표 + 따옴표 처리)
function parseCSVLineAcademic(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && nextChar === '"' && inQuotes) {
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

// 데모 데이터 (Google Sheets 연결 실패 시 사용)
const readingAcademicDataDemo = {
    type: 'academic_reading',
    timeLimit: 120, // 120초 (2분) - 세트마다
    sets: [
        {
            id: 'academic_set_1',
            mainTitle: 'Read an academic passage about climate change.',
            passage: {
                title: 'The Effects of Climate Change on Ocean Ecosystems',
                content: 'Climate change is having profound effects on ocean ecosystems worldwide. Rising temperatures are causing coral bleaching events to occur more frequently. Many fish species are migrating to cooler waters. Ocean acidification is threatening shellfish populations. Scientists warn that without immediate action, these changes could become irreversible.',
                translations: [
                    '기후 변화는 전 세계 해양 생태계에 심각한 영향을 미치고 있습니다.',
                    '상승하는 온도는 산호 백화 현상을 더 자주 발생시키고 있습니다.',
                    '많은 어종들이 더 차가운 물로 이동하고 있습니다.',
                    '해양 산성화는 조개류 개체수를 위협하고 있습니다.',
                    '과학자들은 즉각적인 조치가 없으면 이러한 변화가 돌이킬 수 없게 될 수 있다고 경고합니다.'
                ],
                interactiveWords: [
                    { word: 'profound', translation: '심각한', explanation: '매우 깊고 중요한 영향을 의미합니다.' },
                    { word: 'coral bleaching', translation: '산호 백화', explanation: '산호가 하얗게 변하는 현상으로 스트레스의 신호입니다.' },
                    { word: 'acidification', translation: '산성화', explanation: '바다가 더 산성으로 변하는 현상입니다.' }
                ]
            },
            questions: [
                {
                    questionNum: 'Q1',
                    question: 'What is the main topic of the passage?',
                    questionTranslation: '지문의 주요 주제는 무엇인가요?',
                    correctAnswer: 1,
                    options: [
                        {
                            label: 'A',
                            text: 'The effects of climate change on ocean ecosystems',
                            translation: '기후 변화가 해양 생태계에 미치는 영향',
                            explanation: '지문 전체가 기후 변화가 해양 생태계에 미치는 다양한 영향을 설명하고 있습니다.'
                        },
                        {
                            label: 'B',
                            text: 'How to prevent ocean pollution',
                            translation: '해양 오염을 방지하는 방법',
                            explanation: '지문은 오염 방지가 아니라 기후 변화의 영향에 초점을 맞추고 있습니다.'
                        },
                        {
                            label: 'C',
                            text: 'The life cycle of coral reefs',
                            translation: '산호초의 생명 주기',
                            explanation: '산호 백화는 언급되지만 생명 주기는 주제가 아닙니다.'
                        },
                        {
                            label: 'D',
                            text: 'Fish migration patterns',
                            translation: '물고기 이동 패턴',
                            explanation: '물고기 이동은 한 예시일 뿐 주요 주제가 아닙니다.'
                        }
                    ]
                },
                {
                    questionNum: 'Q2',
                    question: 'According to the passage, what is causing coral bleaching?',
                    questionTranslation: '지문에 따르면 산호 백화를 일으키는 원인은 무엇인가요?',
                    correctAnswer: 2,
                    options: [
                        {
                            label: 'A',
                            text: 'Ocean pollution',
                            translation: '해양 오염',
                            explanation: '지문에서 오염은 언급되지 않았습니다.'
                        },
                        {
                            label: 'B',
                            text: 'Rising temperatures',
                            translation: '상승하는 온도',
                            explanation: '지문에 "Rising temperatures are causing coral bleaching"이라고 명시되어 있습니다.'
                        },
                        {
                            label: 'C',
                            text: 'Overfishing',
                            translation: '과도한 어획',
                            explanation: '과도한 어획은 지문에서 다루지 않았습니다.'
                        },
                        {
                            label: 'D',
                            text: 'Plastic waste',
                            translation: '플라스틱 쓰레기',
                            explanation: '플라스틱 쓰레기는 언급되지 않았습니다.'
                        }
                    ]
                },
                {
                    questionNum: 'Q3',
                    question: 'What are fish species doing in response to temperature changes?',
                    questionTranslation: '온도 변화에 대응하여 어종들은 무엇을 하고 있나요?',
                    correctAnswer: 3,
                    options: [
                        {
                            label: 'A',
                            text: 'They are reproducing more',
                            translation: '더 많이 번식하고 있다',
                            explanation: '번식에 대한 언급은 없습니다.'
                        },
                        {
                            label: 'B',
                            text: 'They are becoming extinct',
                            translation: '멸종되고 있다',
                            explanation: '멸종은 직접적으로 언급되지 않았습니다.'
                        },
                        {
                            label: 'C',
                            text: 'They are migrating to cooler waters',
                            translation: '더 차가운 물로 이동하고 있다',
                            explanation: '지문에 "Many fish species are migrating to cooler waters"라고 명시되어 있습니다.'
                        },
                        {
                            label: 'D',
                            text: 'They are changing their diet',
                            translation: '식단을 바꾸고 있다',
                            explanation: '식단 변화는 언급되지 않았습니다.'
                        }
                    ]
                },
                {
                    questionNum: 'Q4',
                    question: 'What is threatening shellfish populations?',
                    questionTranslation: '조개류 개체수를 위협하는 것은 무엇인가요?',
                    correctAnswer: 2,
                    options: [
                        {
                            label: 'A',
                            text: 'Predators',
                            translation: '포식자',
                            explanation: '포식자는 언급되지 않았습니다.'
                        },
                        {
                            label: 'B',
                            text: 'Ocean acidification',
                            translation: '해양 산성화',
                            explanation: '지문에 "Ocean acidification is threatening shellfish populations"라고 명시되어 있습니다.'
                        },
                        {
                            label: 'C',
                            text: 'Habitat loss',
                            translation: '서식지 손실',
                            explanation: '서식지 손실은 직접적으로 언급되지 않았습니다.'
                        },
                        {
                            label: 'D',
                            text: 'Disease',
                            translation: '질병',
                            explanation: '질병은 언급되지 않았습니다.'
                        }
                    ]
                },
                {
                    questionNum: 'Q5',
                    question: 'What do scientists warn about?',
                    questionTranslation: '과학자들은 무엇에 대해 경고하나요?',
                    correctAnswer: 1,
                    options: [
                        {
                            label: 'A',
                            text: 'Changes could become irreversible without immediate action',
                            translation: '즉각적인 조치가 없으면 변화가 돌이킬 수 없게 될 수 있다',
                            explanation: '지문의 마지막 문장이 이 내용을 명확하게 담고 있습니다.'
                        },
                        {
                            label: 'B',
                            text: 'More research funding is needed',
                            translation: '더 많은 연구 자금이 필요하다',
                            explanation: '연구 자금은 언급되지 않았습니다.'
                        },
                        {
                            label: 'C',
                            text: 'Ocean temperatures will drop',
                            translation: '해양 온도가 떨어질 것이다',
                            explanation: '온도 하락은 언급되지 않았으며 오히려 상승하고 있습니다.'
                        },
                        {
                            label: 'D',
                            text: 'Fish populations will increase',
                            translation: '물고기 개체수가 증가할 것이다',
                            explanation: '개체수 증가는 언급되지 않았습니다.'
                        }
                    ]
                }
            ]
        }
    ]
};

// 실제 사용할 데이터
let readingAcademicData = null;
let academicAnswers = {};

// ✅ 캐시 시스템 추가 (정렬된 데이터 재사용)
let cachedAcademicData = null;

/**
 * 아카데믹 리딩 데이터 로드 (Google Sheets 또는 데모 데이터)
 * window.readingAcademicData에 배열 형태로 저장
 * @param {boolean} forceReload - true면 캐시 무시하고 재로드
 */
async function loadAcademicData(forceReload = false) {
    console.log('📥 [아카데믹리딩] 데이터 로드 시작...');
    
    // ✅ 캐시 확인
    if (!forceReload && cachedAcademicData) {
        console.log('✅ [아카데믹리딩] 캐시된 데이터 사용 (이미 정렬됨)');
        window.readingAcademicData = cachedAcademicData;
        console.log('  캐시 데이터 세트 순서:', cachedAcademicData.map(s => s.id));
        return;
    }
    
    try {
        const sheetSets = await fetchAcademicFromSheet();
        
        // Google Sheets 데이터가 유효한 배열이면 사용
        if (sheetSets && Array.isArray(sheetSets) && sheetSets.length > 0) {
            console.log(`✅ [아카데믹리딩] Google Sheets 데이터 사용 (${sheetSets.length}개 세트)`);
            window.readingAcademicData = sheetSets;
            cachedAcademicData = sheetSets; // ✅ 캐시 저장
            return;
        }
        
        console.log('⚠️ [아카데믹리딩] Google Sheets 데이터 없음, 데모 데이터로 전환');
        
    } catch (error) {
        console.error('❌ [아카데믹리딩] 로드 중 예외 발생:', error);
    }
    
    // 데모 데이터 사용 (폴백)
    if (readingAcademicDataDemo && readingAcademicDataDemo.sets) {
        console.log(`📝 [아카데믹리딩] 데모 데이터 사용 (${readingAcademicDataDemo.sets.length}개 세트)`);
        window.readingAcademicData = readingAcademicDataDemo.sets;
        cachedAcademicData = readingAcademicDataDemo.sets; // ✅ 캐시 저장
    } else {
        console.error('❌ [아카데믹리딩] 데모 데이터도 없음!');
        window.readingAcademicData = [];
        cachedAcademicData = [];
    }
}

// 캐시 초기화 함수 (디버깅용)
window.clearAcademicCache = function() {
    console.log('🔄 [아카데믹리딩] 캐시 초기화');
    cachedAcademicData = null;
};

// 페이지 로드 시 데이터 초기화
async function initAcademicDataOnLoad() {
    await loadAcademicData();
    console.log('✅ [아카데믹리딩] 데이터 초기화 완료');
}

// 페이지 로드 시 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAcademicDataOnLoad);
} else {
    initAcademicDataOnLoad();
}
