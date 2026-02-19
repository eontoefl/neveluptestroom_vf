/**
 * 학습 스케줄 데이터
 * Fast 프로그램: 4주 과정
 * Standard 프로그램: 8주 과정
 */

const SCHEDULE_DATA = {
    // Fast 프로그램 (4주)
    fast: {
        week1: {
            sunday: [
                "내벨업보카 5, 6, 7pg",
                "입문서 정독 1/3",
                "리딩 Module 1",
                "리스닝 Module 1"
            ],
            monday: [
                "내벨업보카 8, 9pg",
                "입문서 정독 2/3",
                "리딩 Module 2",
                "스피킹 1"
            ],
            tuesday: [
                "내벨업보카 10, 11, 12pg",
                "입문서 정독 3/3",
                "리스닝 Module 2",
                "라이팅 1"
            ],
            wednesday: [
                "내벨업보카 13, 14pg",
                "리딩 Module 3",
                "라이팅 2"
            ],
            thursday: [
                "내벨업보카 15, 16, 17pg",
                "리스닝 Module 3",
                "스피킹 2"
            ],
            friday: [
                "내벨업보카 18, 19pg",
                "스피킹 3",
                "라이팅 3"
            ],
            saturday: []
        },
        week2: {
            sunday: [
                "내벨업보카 20, 21, 22pg",
                "리딩 Module 4",
                "리스닝 Module 4"
            ],
            monday: [
                "내벨업보카 23, 24pg",
                "리딩 Module 5",
                "스피킹 4"
            ],
            tuesday: [
                "내벨업보카 25, 26, 27pg",
                "리스닝 Module 5",
                "라이팅 4"
            ],
            wednesday: [
                "내벨업보카 28, 29pg",
                "리딩 Module 6",
                "라이팅 5"
            ],
            thursday: [
                "내벨업보카 30, 31, 32pg",
                "리스닝 Module 6",
                "스피킹 5"
            ],
            friday: [
                "내벨업보카 33, 34pg",
                "스피킹 6",
                "라이팅 6"
            ],
            saturday: []
        },
        week3: {
            sunday: [
                "내벨업보카 35, 36, 37pg",
                "리딩 Module 7",
                "리스닝 Module 7"
            ],
            monday: [
                "내벨업보카 38, 39pg",
                "리딩 Module 8",
                "스피킹 7"
            ],
            tuesday: [
                "내벨업보카 40, 41, 42pg",
                "리스닝 Module 8",
                "라이팅 7"
            ],
            wednesday: [
                "내벨업보카 43, 44pg",
                "리딩 Module 9",
                "라이팅 8"
            ],
            thursday: [
                "내벨업보카 45, 46, 47pg",
                "리스닝 Module 9",
                "스피킹 8"
            ],
            friday: [
                "내벨업보카 48, 49pg",
                "스피킹 9",
                "라이팅 9"
            ],
            saturday: []
        },
        week4: {
            sunday: [
                "내벨업보카 50, 51, 52pg",
                "리딩 Module 10",
                "리스닝 Module 10"
            ],
            monday: [
                "내벨업보카 53, 54pg",
                "리딩 Module 11",
                "스피킹 10"
            ],
            tuesday: [
                "내벨업보카 55, 56, 57pg",
                "리스닝 Module 11",
                "라이팅 10"
            ],
            wednesday: [
                "내벨업보카 58, 59pg",
                "리딩 Module 12",
                "라이팅 11"
            ],
            thursday: [
                "내벨업보카 60, 61pg",
                "리스닝 Module 12",
                "스피킹 11"
            ],
            friday: [
                "스피킹 12",
                "라이팅 12"
            ],
            saturday: []
        }
    },

    // Standard 프로그램 (8주)
    standard: {
        week1: {
            sunday: [
                "내벨업보카 5, 6, 7pg",
                "입문서 정독 1/6",
                "리딩 Module 1"
            ],
            monday: [
                "내벨업보카 8, 9pg",
                "입문서 정독 2/6",
                "리스닝 Module 1"
            ],
            tuesday: [
                "내벨업보카 10, 11pg",
                "입문서 정독 3/6",
                "라이팅 1"
            ],
            wednesday: [
                "내벨업보카 12, 13, 14pg",
                "입문서 정독 4/6",
                "스피킹 1"
            ],
            thursday: [
                "내벨업보카 15, 16pg",
                "입문서 정독 5/6",
                "리딩 Module 2"
            ],
            friday: [
                "내벨업보카 17, 18, 19pg",
                "입문서 정독 6/6",
                "리스닝 Module 2"
            ],
            saturday: []
        },
        week2: {
            sunday: [
                "내벨업보카 20, 21pg",
                "스피킹 2"
            ],
            monday: [
                "내벨업보카 22, 23pg",
                "라이팅 2"
            ],
            tuesday: [
                "내벨업보카 24, 25, 26pg",
                "리딩 Module 3"
            ],
            wednesday: [
                "내벨업보카 27, 28pg",
                "스피킹 3"
            ],
            thursday: [
                "내벨업보카 29, 30, 31pg",
                "라이팅 3"
            ],
            friday: [
                "내벨업보카 32, 33pg",
                "리스닝 Module 3"
            ],
            saturday: []
        },
        week3: {
            sunday: [
                "내벨업보카 34, 35pg",
                "리딩 Module 4"
            ],
            monday: [
                "내벨업보카 36, 37, 38pg",
                "스피킹 4"
            ],
            tuesday: [
                "내벨업보카 39, 40pg",
                "리스닝 Module 4"
            ],
            wednesday: [
                "내벨업보카 41, 42pg",
                "리딩 Module 5"
            ],
            thursday: [
                "내벨업보카 43, 44, 45pg",
                "리스닝 Module 5"
            ],
            friday: [
                "내벨업보카 46, 47pg",
                "라이팅 4"
            ],
            saturday: []
        },
        week4: {
            sunday: [
                "내벨업보카 48, 49, 50pg",
                "스피킹 5"
            ],
            monday: [
                "내벨업보카 51, 52pg",
                "라이팅 5"
            ],
            tuesday: [
                "내벨업보카 53, 54pg",
                "리딩 Module 6"
            ],
            wednesday: [
                "내벨업보카 55, 56, 57pg",
                "스피킹 6"
            ],
            thursday: [
                "내벨업보카 58, 59pg",
                "라이팅 6"
            ],
            friday: [
                "내벨업보카 60, 61pg",
                "리스닝 Module 6"
            ],
            saturday: []
        },
        week5: {
            sunday: [
                "내벨업보카 5, 6, 7pg",
                "리딩 Module 7"
            ],
            monday: [
                "내벨업보카 8, 9pg",
                "스피킹 7"
            ],
            tuesday: [
                "내벨업보카 10, 11, 12pg",
                "리스닝 Module 7"
            ],
            wednesday: [
                "내벨업보카 13, 14pg",
                "리딩 Module 8"
            ],
            thursday: [
                "내벨업보카 15, 16pg",
                "리스닝 Module 8"
            ],
            friday: [
                "내벨업보카 17, 18, 19pg",
                "라이팅 7"
            ],
            saturday: []
        },
        week6: {
            sunday: [
                "내벨업보카 20, 21pg",
                "스피킹 8"
            ],
            monday: [
                "내벨업보카 22, 23, 24pg",
                "라이팅 8"
            ],
            tuesday: [
                "내벨업보카 25, 26pg",
                "리딩 Module 9"
            ],
            wednesday: [
                "내벨업보카 27, 28pg",
                "스피킹 9"
            ],
            thursday: [
                "내벨업보카 29, 30, 31pg",
                "라이팅 9"
            ],
            friday: [
                "내벨업보카 32, 33pg",
                "리스닝 Module 9"
            ],
            saturday: []
        },
        week7: {
            sunday: [
                "내벨업보카 34, 35pg",
                "리딩 Module 10"
            ],
            monday: [
                "내벨업보카 36, 37, 38pg",
                "스피킹 10"
            ],
            tuesday: [
                "내벨업보카 39, 40pg",
                "리스닝 Module 10"
            ],
            wednesday: [
                "내벨업보카 41, 42, 43pg",
                "리딩 Module 11"
            ],
            thursday: [
                "내벨업보카 44, 45pg",
                "리스닝 Module 11"
            ],
            friday: [
                "내벨업보카 46, 47pg",
                "라이팅 10"
            ],
            saturday: []
        },
        week8: {
            sunday: [
                "내벨업보카 48, 49, 50pg",
                "스피킹 11"
            ],
            monday: [
                "내벨업보카 51, 52pg",
                "라이팅 11"
            ],
            tuesday: [
                "내벨업보카 53, 54, 55pg",
                "리딩 Module 12"
            ],
            wednesday: [
                "내벨업보카 56, 57pg",
                "스피킹 12"
            ],
            thursday: [
                "내벨업보카 58, 59pg",
                "라이팅 12"
            ],
            friday: [
                "내벨업보카 60, 61pg",
                "리스닝 Module 12"
            ],
            saturday: []
        }
    }
};

/**
 * 요일 영문명 → 한글명 매핑
 */
const DAY_NAMES_KR = {
    sunday: '일요일',
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일'
};

/**
 * 과제명을 파싱하여 타입과 파라미터 추출
 * @param {string} taskName - 과제명 (예: "내벨업보카 5, 6, 7pg")
 * @returns {Object} - { type, params }
 */
function parseTaskName(taskName) {
    taskName = taskName.trim();

    // 내벨업보카
    if (taskName.startsWith('내벨업보카')) {
        const match = taskName.match(/내벨업보카\s+([\d,\s]+)pg/);
        if (match) {
            const pages = match[1].split(',').map(p => parseInt(p.trim()));
            return {
                type: 'vocab',
                params: { pages }
            };
        }
    }

    // 입문서 정독
    if (taskName.startsWith('입문서 정독')) {
        const match = taskName.match(/입문서 정독\s+(\d+)\/(\d+)/);
        if (match) {
            return {
                type: 'intro-book',
                params: {
                    current: parseInt(match[1]),
                    total: parseInt(match[2])
                }
            };
        }
    }

    // 리딩 Module
    if (taskName.startsWith('리딩 Module')) {
        const match = taskName.match(/리딩 Module\s+(\d+)/);
        if (match) {
            return {
                type: 'reading',
                params: { module: parseInt(match[1]) }
            };
        }
    }

    // 리스닝 Module
    if (taskName.startsWith('리스닝 Module')) {
        const match = taskName.match(/리스닝 Module\s+(\d+)/);
        if (match) {
            return {
                type: 'listening',
                params: { module: parseInt(match[1]) }
            };
        }
    }

    // 라이팅
    if (taskName.startsWith('라이팅')) {
        const match = taskName.match(/라이팅\s+(\d+)/);
        if (match) {
            return {
                type: 'writing',
                params: { number: parseInt(match[1]) }
            };
        }
    }

    // 스피킹
    if (taskName.startsWith('스피킹')) {
        const match = taskName.match(/스피킹\s+(\d+)/);
        if (match) {
            return {
                type: 'speaking',
                params: { number: parseInt(match[1]) }
            };
        }
    }

    return { type: 'unknown', params: {} };
}

/**
 * 프로그램과 주차에 해당하는 스케줄 가져오기
 * @param {string} program - 'fast' 또는 'standard'
 * @param {number} week - 주차 번호 (1-4 또는 1-8)
 * @returns {Object} - 해당 주차의 스케줄
 */
function getWeekSchedule(program, week) {
    const programData = SCHEDULE_DATA[program];
    if (!programData) return null;

    const weekKey = `week${week}`;
    return programData[weekKey] || null;
}

/**
 * 특정 날짜의 과제 목록 가져오기
 * @param {string} program - 'fast' 또는 'standard'
 * @param {number} week - 주차 번호
 * @param {string} day - 요일 영문명 (sunday, monday, ...)
 * @returns {Array} - 과제명 배열
 */
function getDayTasks(program, week, day) {
    const weekSchedule = getWeekSchedule(program, week);
    if (!weekSchedule) return [];

    return weekSchedule[day] || [];
}
