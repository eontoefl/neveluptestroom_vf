/**
 * ================================================
 * module-definitions.js
 * 모듈 정의 및 생성 시스템
 * ================================================
 * 
 * 역할:
 * - Reading/Listening/Writing/Speaking 모듈 구조 정의
 * - 모듈 번호에 따라 자동으로 세트 ID 증가
 * - 동적 모듈 생성 함수 제공
 * 
 * 규칙:
 * - Reading Module 1: Set 1-7 사용
 * - Reading Module 2: Set 8-14 사용 (7씩 증가)
 * - Listening Module 1: Set 1-9 사용
 * - Listening Module 2: Set 10-18 사용 (9씩 증가)
 * - Writing 1: Set 1-3 사용
 * - Writing 2: Set 4-6 사용 (3씩 증가)
 * - Speaking 1: Set 1-2 사용
 * - Speaking 2: Set 3-4 사용 (2씩 증가)
 */

const MODULE_DEFINITIONS = {
    /**
     * ================================================
     * READING 모듈
     * ================================================
     * 구성: 35문제, 20분 제한
     * - 빈칸채우기 2세트 (각 10문제) = 20문제
     * - 일상리딩1 2세트 (각 2문제) = 4문제
     * - 일상리딩2 2세트 (각 3문제) = 6문제
     * - 아카데믹리딩 1세트 (5문제) = 5문제
     */
    reading: {
        sectionName: 'Reading',
        moduleNameFormat: 'Reading Module {n}',
        totalQuestions: 35,
        timeLimit: 1200, // 20분 = 1200초
        setsPerModule: 7, // 모듈당 7개 세트 사용
        
        // 컴포넌트 구조 (순서 고정)
        componentStructure: [
            { type: 'fillblanks', count: 2, questionsPerSet: 10 },
            { type: 'daily1', count: 2, questionsPerSet: 2 },
            { type: 'daily2', count: 2, questionsPerSet: 3 },
            { type: 'academic', count: 1, questionsPerSet: 5 }
        ],
        
        /**
         * 모듈 생성 함수
         * @param {number} moduleNumber - 모듈 번호 (1, 2, 3...)
         * @returns {object} 모듈 설정 객체
         */
        generateModule(moduleNumber) {
            const components = [];
            
            // 각 컴포넌트 타입별로 독립적인 세트 번호를 계산
            let fillblanksSetId = (moduleNumber - 1) * 2 + 1; // 모듈당 2세트
            let daily1SetId = (moduleNumber - 1) * 2 + 1;     // 모듈당 2세트
            let daily2SetId = (moduleNumber - 1) * 2 + 1;     // 모듈당 2세트
            let academicSetId = moduleNumber;                  // 모듈당 1세트
            
            // 컴포넌트 구조에 따라 순서대로 생성
            this.componentStructure.forEach(structure => {
                for (let i = 0; i < structure.count; i++) {
                    let setId;
                    
                    // 타입별로 setId 할당 및 증가
                    if (structure.type === 'fillblanks') {
                        setId = fillblanksSetId++;
                    } else if (structure.type === 'daily1') {
                        setId = daily1SetId++;
                    } else if (structure.type === 'daily2') {
                        setId = daily2SetId++;
                    } else if (structure.type === 'academic') {
                        setId = academicSetId++;
                    }
                    
                    components.push({
                        type: structure.type,
                        setId: setId,
                        questionsPerSet: structure.questionsPerSet
                    });
                }
            });
            
            return {
                moduleId: `reading_module_${moduleNumber}`,
                moduleName: `Reading Module ${moduleNumber}`,
                sectionType: 'reading',
                totalQuestions: this.totalQuestions,
                timeLimit: this.timeLimit,
                components: components
            };
        }
    },
    
    /**
     * ================================================
     * LISTENING 모듈
     * ================================================
     * 구성: 32문제, 타이머 없음 (유형별 타이머)
     * - 응답고르기 1세트 (12문제) = 12문제
     * - 컨버 3세트 (각 2문제) = 6문제
     * - 공지사항 3세트 (각 2문제) = 6문제
     * - 렉쳐 2세트 (각 4문제) = 8문제
     */
    listening: {
        sectionName: 'Listening',
        moduleNameFormat: 'Listening Module {n}',
        totalQuestions: 32,
        timeLimit: null, // 전체 타이머 없음 (유형별 타이머)
        setsPerModule: 9,
        
        componentStructure: [
            { type: 'response', count: 1, questionsPerSet: 12 },
            { type: 'conver', count: 3, questionsPerSet: 2 },
            { type: 'announcement', count: 3, questionsPerSet: 2 },
            { type: 'lecture', count: 2, questionsPerSet: 4 }
        ],
        
        generateModule(moduleNumber) {
            const components = [];
            
            // 각 컴포넌트 타입별로 독립적인 세트 번호를 계산
            let responseSetId = moduleNumber;  // 모듈당 1세트
            let converSetId = (moduleNumber - 1) * 3 + 1;  // 모듈당 3세트
            let announcementSetId = (moduleNumber - 1) * 3 + 1;  // 모듈당 3세트
            let lectureSetId = (moduleNumber - 1) * 2 + 1;  // 모듈당 2세트
            
            // 컴포넌트 구조에 따라 순서대로 생성
            this.componentStructure.forEach(structure => {
                for (let i = 0; i < structure.count; i++) {
                    let setId;
                    
                    // 타입별로 setId 할당 및 증가
                    if (structure.type === 'response') {
                        setId = responseSetId++;
                    } else if (structure.type === 'conver') {
                        setId = converSetId++;
                    } else if (structure.type === 'announcement') {
                        setId = announcementSetId++;
                    } else if (structure.type === 'lecture') {
                        setId = lectureSetId++;
                    }
                    
                    components.push({
                        type: structure.type,
                        setId: setId,
                        questionsPerSet: structure.questionsPerSet
                    });
                }
            });
            
            return {
                moduleId: `listening_module_${moduleNumber}`,
                moduleName: `Listening Module ${moduleNumber}`,
                sectionType: 'listening',
                totalQuestions: this.totalQuestions,
                timeLimit: this.timeLimit,
                components: components
            };
        }
    },
    
    /**
     * ================================================
     * WRITING 모듈
     * ================================================
     * 구성: 12문제, 타이머 없음 (유형별 타이머)
     * - 단어배열 1세트 (10문제) = 10문제
     * - 이메일작성 1문제 = 1문제
     * - 토론형글쓰기 1문제 = 1문제
     */
    writing: {
        sectionName: 'Writing',
        moduleNameFormat: 'Writing {n}',
        totalQuestions: 12,
        timeLimit: null,
        setsPerModule: 3,
        
        componentStructure: [
            { type: 'arrange', count: 1, questionsPerSet: 10 },
            { type: 'email', count: 1, questionsPerSet: 1 },
            { type: 'discussion', count: 1, questionsPerSet: 1 }
        ],
        
        generateModule(moduleNumber) {
            const baseSetId = (moduleNumber - 1) * this.setsPerModule + 1;
            const components = [];
            let currentSetOffset = 0;
            
            this.componentStructure.forEach(structure => {
                for (let i = 0; i < structure.count; i++) {
                    components.push({
                        type: structure.type,
                        setId: baseSetId + currentSetOffset,
                        questionsPerSet: structure.questionsPerSet
                    });
                    currentSetOffset++;
                }
            });
            
            return {
                moduleId: `writing_${moduleNumber}`,
                moduleName: `Writing ${moduleNumber}`,
                sectionType: 'writing',
                totalQuestions: this.totalQuestions,
                timeLimit: this.timeLimit,
                components: components
            };
        }
    },
    
    /**
     * ================================================
     * SPEAKING 모듈
     * ================================================
     * 구성: 11문제, 타이머 없음 (유형별 타이머)
     * - 따라말하기 1세트 (7문제) = 7문제
     * - 인터뷰 1세트 (4문제) = 4문제
     */
    speaking: {
        sectionName: 'Speaking',
        moduleNameFormat: 'Speaking {n}',
        totalQuestions: 11,
        timeLimit: null,
        setsPerModule: 2,
        
        componentStructure: [
            { type: 'repeat', count: 1, questionsPerSet: 7 },
            { type: 'interview', count: 1, questionsPerSet: 4 }
        ],
        
        generateModule(moduleNumber) {
            const baseSetId = (moduleNumber - 1) * this.setsPerModule + 1;
            const components = [];
            let currentSetOffset = 0;
            
            this.componentStructure.forEach(structure => {
                for (let i = 0; i < structure.count; i++) {
                    components.push({
                        type: structure.type,
                        setId: baseSetId + currentSetOffset,
                        questionsPerSet: structure.questionsPerSet
                    });
                    currentSetOffset++;
                }
            });
            
            return {
                moduleId: `speaking_${moduleNumber}`,
                moduleName: `Speaking ${moduleNumber}`,
                sectionType: 'speaking',
                totalQuestions: this.totalQuestions,
                timeLimit: this.timeLimit,
                components: components
            };
        }
    }
};

/**
 * ================================================
 * 유틸리티 함수
 * ================================================
 */

/**
 * 특정 섹션의 모듈 가져오기
 * @param {string} sectionType - 'reading', 'listening', 'writing', 'speaking'
 * @param {number} moduleNumber - 모듈 번호 (1, 2, 3...)
 * @returns {object} 모듈 설정 객체
 */
function getModule(sectionType, moduleNumber) {
    if (!MODULE_DEFINITIONS[sectionType]) {
        console.error(`❌ 존재하지 않는 섹션: ${sectionType}`);
        return null;
    }
    
    return MODULE_DEFINITIONS[sectionType].generateModule(moduleNumber);
}

/**
 * 모듈 정보 출력 (디버깅용)
 * @param {object} module - 모듈 객체
 */
function printModuleInfo(module) {
    console.log('='.repeat(50));
    console.log(`📚 모듈: ${module.moduleName}`);
    console.log(`   ID: ${module.moduleId}`);
    console.log(`   총 문제: ${module.totalQuestions}문제`);
    console.log(`   제한 시간: ${module.timeLimit ? module.timeLimit + '초' : '없음'}`);
    console.log('   컴포넌트 구성:');
    
    let questionCount = 0;
    module.components.forEach((comp, idx) => {
        const start = questionCount + 1;
        const end = questionCount + comp.questionsPerSet;
        questionCount = end;
        
        console.log(`   ${idx + 1}. ${comp.type} (Set ${comp.setId}) - ${comp.questionsPerSet}문제 (Q${start}-Q${end})`);
    });
    console.log('='.repeat(50));
}

/**
 * 테스트: 모든 모듈 생성 확인
 */
function testModuleGeneration() {
    console.log('🧪 모듈 생성 테스트 시작...\n');
    
    // Reading Module 1, 2
    printModuleInfo(getModule('reading', 1));
    printModuleInfo(getModule('reading', 2));
    
    // Listening Module 1
    printModuleInfo(getModule('listening', 1));
    
    // Writing 1
    printModuleInfo(getModule('writing', 1));
    
    // Speaking 1
    printModuleInfo(getModule('speaking', 1));
    
    console.log('✅ 모듈 생성 테스트 완료!');
}

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.MODULE_DEFINITIONS = MODULE_DEFINITIONS;
    window.getModule = getModule;
    window.printModuleInfo = printModuleInfo;
    window.testModuleGeneration = testModuleGeneration;
}
