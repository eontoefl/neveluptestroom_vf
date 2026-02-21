/**
 * ================================================
 * mypage.js – 마이페이지 Supabase 연동 로직
 * ================================================
 * 
 * sessionStorage의 currentUser 정보로 Supabase 데이터를 불러와
 * 학습 현황, 잔디, 최근 기록을 렌더링합니다.
 * 
 * 의존: supabase-client.js (supabaseSelect 등)
 */

// ================================================
// 전역 상태
// ================================================
let mpUser = null;           // sessionStorage에서 로드한 유저 정보
let mpStudyRecords = [];     // tr_study_records
let mpAuthRecords = [];      // tr_auth_records

// ================================================
// 스케줄 데이터 (총 과제 수 / 총 일수 계산용)
// ================================================
// 총 일수/과제 수는 DOM에서 동적으로 계산
function getScheduleMeta(programType) {
    const gridId = programType === 'fast' ? 'grass-fast' : 'grass-standard';
    const cells = document.querySelectorAll(`#${gridId} .g`);
    const totalTasks = cells.length;

    // 고유 day 수 = 총 학습일
    const daySet = new Set();
    cells.forEach(c => daySet.add(c.dataset.day));
    const totalDays = daySet.size;

    return { totalDays, totalTasks };
}

// task_type을 요일 매핑하기 위한 한→영 변환
const DAY_MAP_KR_TO_NUM = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };

// ================================================
// 초기화
// ================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 [MyPage] 초기화 시작');

    // 1. 세션에서 유저 정보 로드
    const saved = sessionStorage.getItem('currentUser');
    if (!saved) {
        showNotLoggedIn();
        return;
    }

    mpUser = JSON.parse(saved);
    console.log('📊 [MyPage] 유저:', mpUser.name, mpUser.programType);

    // 2. UI 기본 세팅
    document.getElementById('userName').textContent = mpUser.name;
    document.getElementById('programBadge').textContent = mpUser.program || '내벨업챌린지';

    // 플랜 탭 - 유저의 프로그램에 맞춰 활성화
    setupPlanTabs();

    // 3. Supabase에서 데이터 로드
    try {
        await loadAllData();
        renderAll();
    } catch (err) {
        console.error('❌ [MyPage] 데이터 로드 실패:', err);
    }

    // 4. 화면 전환
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'flex';
});

// ================================================
// 데이터 로드
// ================================================
async function loadAllData() {
    const userId = mpUser.id;
    console.log('📊 [MyPage] 데이터 로드 시작 - userId:', userId);

    // 학습 기록 전체 로드
    mpStudyRecords = await supabaseSelect(
        'tr_study_records',
        `user_id=eq.${userId}&order=completed_at.desc&select=*`
    ) || [];

    // 인증 기록 전체 로드
    mpAuthRecords = await supabaseSelect(
        'tr_auth_records',
        `user_id=eq.${userId}&order=created_at.desc&select=*`
    ) || [];

    console.log(`📊 [MyPage] 로드 완료 - 학습기록: ${mpStudyRecords.length}건, 인증기록: ${mpAuthRecords.length}건`);
}

// ================================================
// 전체 렌더링
// ================================================
function renderAll() {
    renderSummaryCards();
    renderGrass();
    renderRecentRecords();
}

// ================================================
// ① 학습 현황 요약 카드 렌더링
// ================================================
function renderSummaryCards() {
    const programType = mpUser.programType || 'standard';
    const meta = getScheduleMeta(programType);

    // --- 총 학습일 ---
    // 고유한 (week + day) 조합 수
    const uniqueDays = new Set();
    mpStudyRecords.forEach(r => {
        if (r.week && r.day) {
            uniqueDays.add(`${r.week}_${r.day}`);
        }
    });
    const studyDays = uniqueDays.size;
    const totalDays = meta.totalDays;
    const daysPct = totalDays > 0 ? Math.round((studyDays / totalDays) * 100) : 0;

    document.getElementById('studyDays').textContent = studyDays;
    document.getElementById('studyDaysTotal').textContent = ` / ${totalDays}일`;
    document.getElementById('studyDaysBar').style.width = `${daysPct}%`;
    document.getElementById('studyDaysPct').textContent = `${daysPct}% 달성`;

    // --- 완료한 과제 ---
    const tasksDone = mpStudyRecords.length;
    const totalTasks = meta.totalTasks;
    const tasksPct = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

    document.getElementById('tasksDone').textContent = tasksDone;
    document.getElementById('tasksTotal').textContent = ` / ${totalTasks}개`;
    document.getElementById('tasksBar').style.width = `${Math.min(tasksPct, 100)}%`;
    document.getElementById('tasksPct').textContent = `${tasksPct}% 완료`;

    // --- 현재 등급 ---
    // 등급 기준: "성공 요일" = 해당 요일의 모든 과제를 완료 + 평균 인증률 ≥ 70%
    const successDays = countSuccessDays();
    const grade = calculateGrade(successDays, totalDays);

    document.getElementById('currentGrade').textContent = grade.letter;
    const gradeHint = document.getElementById('gradeHint');
    gradeHint.querySelector('span').textContent = grade.hint;

    // --- 보증금 환급 예상 ---
    const deposit = 100000; // 기본 보증금 10만원 (추후 applications에서 가져올 수 있음)
    const refundRate = grade.refundRate;
    const refundAmount = Math.round(deposit * refundRate);

    document.getElementById('refundAmount').textContent = refundAmount.toLocaleString();
    const refundStatus = document.getElementById('refundStatus');
    if (refundRate >= 0.8) {
        refundStatus.className = 'sc-sub refund-tag';
        refundStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>환급 기준 충족 중</span>';
    } else if (refundRate > 0) {
        refundStatus.className = 'sc-sub refund-tag warning';
        refundStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span>환급률 낮음 – 더 열심히!</span>';
    } else {
        refundStatus.className = 'sc-sub refund-tag warning';
        refundStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i><span>아직 데이터가 없어요</span>';
    }
}

/**
 * 성공 요일 수 계산
 * 성공 = 해당 요일에 모든 과제 제출 + 인증률 평균 ≥ 50%
 */
function countSuccessDays() {
    // 각 (week, day) 별로 제출 과제 수 & 인증률 합산
    const dayMap = {}; // key: "week_day" → { taskCount, authSum, authCount }

    mpStudyRecords.forEach(r => {
        const key = `${r.week}_${r.day}`;
        if (!dayMap[key]) dayMap[key] = { taskCount: 0, authSum: 0, authCount: 0 };
        dayMap[key].taskCount++;
    });

    mpAuthRecords.forEach(r => {
        // study_record_id로 연결된 study_record의 week+day 찾기
        const sr = mpStudyRecords.find(s => s.id === r.study_record_id);
        if (sr) {
            const key = `${sr.week}_${sr.day}`;
            if (dayMap[key]) {
                dayMap[key].authSum += (r.auth_rate || 0);
                dayMap[key].authCount++;
            }
        }
    });

    let successCount = 0;
    Object.values(dayMap).forEach(d => {
        // 최소 1개 과제 + 인증 기록 있으면 확인
        if (d.taskCount >= 1) {
            const avgAuth = d.authCount > 0 ? d.authSum / d.authCount : 0;
            if (avgAuth >= 50) successCount++;
        }
    });

    return successCount;
}

/**
 * 등급 계산
 * A: 성공률 90%+  → 환급 100%
 * B: 성공률 70%+  → 환급 85%
 * C: 성공률 50%+  → 환급 50%
 * D: 성공률 50% 미만 → 환급 0%
 */
function calculateGrade(successDays, totalDays) {
    const rate = totalDays > 0 ? successDays / totalDays : 0;
    const pct = Math.round(rate * 100);

    // 아직 시작 전이면
    if (successDays === 0) {
        return { letter: '-', hint: '아직 데이터가 없어요', refundRate: 0 };
    }

    // 진행 중 - 현재까지 경과된 날 기준으로 비율 계산
    const elapsedDays = getElapsedDays();
    const actualRate = elapsedDays > 0 ? successDays / Math.min(elapsedDays, totalDays) : rate;

    if (actualRate >= 0.9) {
        const need = Math.ceil(totalDays * 0.9) - successDays;
        return {
            letter: 'A',
            hint: need > 0 ? `A등급 유지 중! 🔥` : 'A등급 확정! 🎉',
            refundRate: 1.0
        };
    } else if (actualRate >= 0.7) {
        const needForA = Math.ceil(totalDays * 0.9) - successDays;
        return {
            letter: 'B',
            hint: `성공요일 ${Math.max(needForA, 1)}번 더 필요!`,
            refundRate: 0.85
        };
    } else if (actualRate >= 0.5) {
        const needForB = Math.ceil(totalDays * 0.7) - successDays;
        return {
            letter: 'C',
            hint: `B등급까지 성공요일 ${Math.max(needForB, 1)}번 더!`,
            refundRate: 0.5
        };
    } else {
        const needForC = Math.ceil(totalDays * 0.5) - successDays;
        return {
            letter: 'D',
            hint: `C등급까지 성공요일 ${Math.max(needForC, 1)}번 더!`,
            refundRate: 0
        };
    }
}

/**
 * 시작일 기준 경과 일수 계산
 */
function getElapsedDays() {
    if (!mpUser.startDate) return 0;
    const start = new Date(mpUser.startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    // 주 6일 과정이므로 토요일 빼기: 대략 diff * 6/7
    return Math.max(1, Math.round(diff * 6 / 7));
}

// ================================================
// ② 잔디 렌더링
// ================================================
function renderGrass() {
    const programType = mpUser.programType || 'standard';
    const gridId = programType === 'fast' ? 'grass-fast' : 'grass-standard';

    // 유저 프로그램에 맞는 그리드의 잔디 셀들만 업데이트
    // 완료된 과제를 매핑: (week, day, task_type) → completed
    const completedMap = buildCompletedMap();

    // 모든 잔디 셀 업데이트
    document.querySelectorAll(`#${gridId} .g`).forEach(cell => {
        const dayNum = parseInt(cell.dataset.day);
        const order = parseInt(cell.dataset.order);
        const type = cell.dataset.type;

        // 스케줄 진행 상황 판단
        const currentDay = getCurrentScheduleDay();

        if (completedMap.has(`${dayNum}_${order}`)) {
            // 완료
            cell.classList.remove('empty', 'fail');
            cell.classList.add('success');
        } else if (dayNum < currentDay) {
            // 마감 지남 → 미완료
            cell.classList.remove('empty', 'success');
            cell.classList.add('fail');
        }
        // else: 아직 예정 → empty 유지
    });
}

/**
 * 완료된 과제 맵 생성
 * key: "dayNum_order" (잔디 HTML의 data-day + data-order)
 * 
 * tr_study_records의 (week, day, task_type, module_number)를
 * 잔디 그리드의 (dayNum, order)에 매핑
 */
function buildCompletedMap() {
    const map = new Map();
    const programType = mpUser.programType || 'standard';
    const gridId = programType === 'fast' ? 'grass-fast' : 'grass-standard';

    // task_type 매핑: Supabase → 잔디 data-type
    const typeMap = {
        'vocab': 'voca_test',
        'intro-book': 'intro_reading',
        'reading': 'reading_module',
        'listening': 'listening_module',
        'writing': 'writing',
        'speaking': 'speaking'
    };

    // 각 study_record → 해당 잔디 셀 매핑
    mpStudyRecords.forEach(record => {
        const week = record.week;
        const dayKr = record.day; // '일', '월', etc.
        const taskType = typeMap[record.task_type] || record.task_type;

        // week + 요일 → dayNum 계산
        const dayIndex = DAY_MAP_KR_TO_NUM[dayKr];
        if (dayIndex === undefined) return;
        const dayNum = (week - 1) * 6 + dayIndex + 1;

        // 해당 dayNum의 모든 잔디 셀에서 task_type이 매칭되는 것 찾기
        const cells = document.querySelectorAll(`#${gridId} .g[data-day="${dayNum}"]`);
        cells.forEach(cell => {
            if (cell.dataset.type === taskType) {
                map.set(`${dayNum}_${cell.dataset.order}`, true);
            }
        });
    });

    return map;
}

/**
 * 현재 스케줄 진행 일차 계산
 */
function getCurrentScheduleDay() {
    if (!mpUser.startDate) return 1;
    const start = new Date(mpUser.startDate);
    const now = new Date();

    // 시작일부터 오늘까지 경과 일수 (토요일 제외)
    let count = 0;
    const d = new Date(start);
    while (d <= now) {
        if (d.getDay() !== 6) count++; // 토요일 제외
        d.setDate(d.getDate() + 1);
    }
    return Math.max(1, count);
}

// ================================================
// ③ 최근 학습 기록 렌더링
// ================================================
function renderRecentRecords() {
    const tbody = document.getElementById('recordTableBody');
    
    if (mpStudyRecords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fa-solid fa-inbox"></i>
                        <p>아직 학습 기록이 없어요.<br>테스트룸에서 과제를 시작해보세요! 💪</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // 최근 20개만 표시
    const recent = mpStudyRecords.slice(0, 20);
    
    tbody.innerHTML = recent.map(record => {
        const date = formatDate(record.completed_at);
        const taskLabel = getTaskLabel(record.task_type);
        const moduleText = getModuleText(record);
        const scoreHtml = renderScore(record);
        const noteHtml = renderNoteButton(record);

        return `
            <tr>
                <td><span class="date-badge">${date}</span></td>
                <td>
                    <div class="task-info">
                        <span class="task-module ${taskLabel.cls}">${taskLabel.name}</span>
                        ${moduleText}
                    </div>
                </td>
                <td>${scoreHtml}</td>
                <td>${noteHtml}</td>
            </tr>
        `;
    }).join('');
}

/**
 * 날짜 포맷: "2/19 (목)"
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

/**
 * task_type → 한글 라벨 + CSS 클래스
 */
function getTaskLabel(taskType) {
    const labels = {
        'reading': { name: 'Reading', cls: '' },
        'listening': { name: 'Listening', cls: 'listening' },
        'writing': { name: 'Writing', cls: 'writing' },
        'speaking': { name: 'Speaking', cls: 'speaking' },
        'vocab': { name: 'Vocab', cls: 'vocab' },
        'intro-book': { name: '입문서', cls: 'intro-book' }
    };
    return labels[taskType] || { name: taskType, cls: '' };
}

/**
 * 모듈 텍스트 생성
 */
function getModuleText(record) {
    if (record.task_type === 'vocab') {
        return `Week ${record.week} ${record.day}`;
    }
    if (record.task_type === 'intro-book') {
        return `${record.day}요일`;
    }
    return `Module ${record.module_number || ''}`;
}

/**
 * 점수 렌더링
 */
function renderScore(record) {
    if (record.task_type === 'vocab') {
        const rate = record.vocab_accuracy_rate;
        if (rate !== undefined && rate !== null) {
            const pct = Math.round(rate * 100);
            return `
                <span class="score-badge">${pct}%</span>
                <div class="score-bar">
                    <div class="score-fill" style="width:${pct}%;"></div>
                </div>
            `;
        }
        return `<span class="score-badge">${record.score || 0} / ${record.total || 0}</span>`;
    }

    if (record.task_type === 'intro-book') {
        return '<span class="score-badge" style="color:var(--accent);">✓ 완료</span>';
    }

    const score = record.score || 0;
    const total = record.total || 1;
    const pct = Math.round((score / total) * 100);

    return `
        <span class="score-badge">${score} / ${total}</span>
        <div class="score-bar">
            <div class="score-fill" style="width:${pct}%;"></div>
        </div>
    `;
}

/**
 * 노트 버튼 렌더링
 */
function renderNoteButton(record) {
    if (record.error_note_text && record.error_note_text.trim()) {
        const escaped = record.error_note_text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n');
        const title = `${getTaskLabel(record.task_type).name} Module ${record.module_number || ''}`;
        return `
            <button class="btn-note" onclick="openNote('${title}', '${escaped}')">
                <i class="fa-regular fa-note-sticky"></i> 노트보기
            </button>
        `;
    }
    if (record.memo_text && record.memo_text.trim()) {
        const escaped = record.memo_text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n');
        return `
            <button class="btn-note" onclick="openNote('입문서 메모', '${escaped}')">
                <i class="fa-regular fa-note-sticky"></i> 메모보기
            </button>
        `;
    }
    return `<button class="btn-note" disabled><i class="fa-regular fa-note-sticky"></i> -</button>`;
}

// ================================================
// 플랜 탭 전환
// ================================================
function setupPlanTabs() {
    const programType = mpUser.programType || 'standard';

    // 유저 프로그램에 맞는 탭을 기본 활성화
    const tabs = document.querySelectorAll('.plan-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.plan === programType) {
            tab.classList.add('active');
        }
    });

    // 해당 잔디 그리드 표시
    document.getElementById('grass-fast').style.display = programType === 'fast' ? '' : 'none';
    document.getElementById('grass-standard').style.display = programType === 'standard' ? '' : 'none';

    // 탭 클릭 이벤트
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const plan = tab.dataset.plan;
            document.getElementById('grass-fast').style.display = plan === 'fast' ? '' : 'none';
            document.getElementById('grass-standard').style.display = plan === 'standard' ? '' : 'none';
        });
    });
}

// ================================================
// 모달
// ================================================
function openNote(title, content) {
    document.getElementById('noteTitle').innerHTML = 
        `<i class="fa-regular fa-note-sticky"></i> ${title}`;
    document.getElementById('noteContent').textContent = content;
    document.getElementById('noteModal').classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

// 모달 바깥 클릭으로 닫기
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
});

// ================================================
// 네비게이션
// ================================================
function goBackToTestroom() {
    window.location.href = 'index.html';
}

function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ================================================
// 유틸리티
// ================================================
function showNotLoggedIn() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('notLoggedScreen').style.display = 'flex';
}

console.log('✅ mypage.js 로드 완료');
