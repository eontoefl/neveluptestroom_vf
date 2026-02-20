/**
 * ================================================
 * progress-tracker.js
 * 진도율 추적 시스템
 * ================================================
 * 
 * 기능:
 * 1. tr_study_records에서 완료 과제 조회
 * 2. 학습일정 화면: 요일 버튼에 일 단위 진도 표시
 * 3. 학습일정 화면: 전체 진도율 Progress Bar 표시
 * 4. 과제 목록 화면: 완료 과제에 CSS 체크 아이콘 표시
 * 
 * ★ 인증률(auth rate)과 독립 — 여기서는 "기록이 존재하면 완료"만 판단
 */

var ProgressTracker = {
    // 캐시: { 'reading_1': true, 'writing_3': true, ... }
    _completedTasks: {},
    _loaded: false,
    _loading: false,
    _authRecords: [],
    _avgAuthRate: null,

    // ========================================
    // Supabase에서 학습 기록 조회 → 캐시
    // ========================================
    async loadCompletedTasks() {
        if (this._loading) return;
        this._loading = true;

        var user = (typeof getCurrentUser === 'function') ? getCurrentUser() : window.currentUser;
        if (!user || !user.id || user.id === 'dev-user-001') {
            console.log('📊 [ProgressTracker] 개발 모드 — 진도 조회 생략');
            this._loading = false;
            this._loaded = true;
            return;
        }

        console.log('📊 [ProgressTracker] 학습 기록 조회 시작...');

        try {
            var records = await getStudyRecords(user.id);
            this._completedTasks = {};

            if (records && records.length > 0) {
                records.forEach(function(rec) {
                    if (rec.task_type && rec.module_number) {
                        // 키: "reading_1", "writing_3" 등
                        var key = rec.task_type + '_' + rec.module_number;
                        // week+day도 함께 저장 (일 단위 진도 계산용)
                        if (!ProgressTracker._completedTasks[key]) {
                            ProgressTracker._completedTasks[key] = {
                                week: rec.week,
                                day: rec.day,
                                completedAt: rec.completed_at
                            };
                        }
                    }
                });
            }

            this._loaded = true;
            console.log('📊 [ProgressTracker] 완료 과제:', Object.keys(this._completedTasks).length, '건');

            // 인증 기록도 조회
            await this.loadAuthRecords(user.id);
        } catch (e) {
            console.error('❌ [ProgressTracker] 조회 실패:', e);
        }

        this._loading = false;
    },

    // ========================================
    // Supabase에서 인증 기록 조회
    // ========================================
    async loadAuthRecords(userId) {
        try {
            if (typeof getAuthRecords === 'function') {
                var records = await getAuthRecords(userId);
                this._authRecords = records || [];
                
                // 평균 인증률 계산
                if (this._authRecords.length > 0) {
                    var sum = 0;
                    this._authRecords.forEach(function(r) { sum += (r.auth_rate || 0); });
                    this._avgAuthRate = Math.round(sum / this._authRecords.length);
                } else {
                    this._avgAuthRate = null;
                }
                console.log('📊 [ProgressTracker] 인증률:', this._avgAuthRate, '% (' + this._authRecords.length + '건)');
            }
        } catch (e) {
            console.error('📊 [ProgressTracker] 인증 기록 조회 실패:', e);
        }
    },

    // ========================================
    // 특정 과제가 완료되었는지 판단
    // ========================================
    isTaskCompleted(taskType, moduleNumber) {
        var key = taskType + '_' + moduleNumber;
        return !!this._completedTasks[key];
    },

    // ========================================
    // 과제명(스케줄 텍스트)으로 완료 여부 확인
    // ========================================
    isTaskNameCompleted(taskName) {
        var parsed = (typeof parseTaskName === 'function') ? parseTaskName(taskName) : null;
        if (!parsed) return false;

        var type = parsed.type;
        var moduleNum = null;

        if (type === 'reading' || type === 'listening') {
            moduleNum = parsed.params.module;
        } else if (type === 'writing' || type === 'speaking') {
            moduleNum = parsed.params.number;
        } else {
            // vocab, intro-book 등은 진도율 대상 아님
            return false;
        }

        if (!moduleNum) return false;
        return this.isTaskCompleted(type, moduleNum);
    },

    // ========================================
    // 특정 날짜의 진도율 계산
    // ========================================
    getDayProgress(programType, week, dayEn) {
        if (typeof getDayTasks !== 'function') return { completed: 0, total: 0 };

        var tasks = getDayTasks(programType, week, dayEn);
        var total = 0;
        var completed = 0;

        tasks.forEach(function(taskName) {
            var parsed = (typeof parseTaskName === 'function') ? parseTaskName(taskName) : null;
            if (!parsed) return;

            // vocab, intro-book은 진도율 대상 제외
            if (parsed.type === 'vocab' || parsed.type === 'intro-book' || parsed.type === 'unknown') {
                return;
            }

            total++;
            if (ProgressTracker.isTaskNameCompleted(taskName)) {
                completed++;
            }
        });

        return { completed: completed, total: total };
    },

    // ========================================
    // 전체 진도율 계산
    // ========================================
    getTotalProgress(programType) {
        var totalWeeks = programType === 'standard' ? 8 : 4;
        var dayMapping = {
            '일': 'sunday', '월': 'monday', '화': 'tuesday',
            '수': 'wednesday', '목': 'thursday', '금': 'friday'
        };
        var days = ['일', '월', '화', '수', '목', '금'];

        var total = 0;
        var completed = 0;

        for (var w = 1; w <= totalWeeks; w++) {
            days.forEach(function(dayKr) {
                var dayEn = dayMapping[dayKr];
                var dayProgress = ProgressTracker.getDayProgress(programType, w, dayEn);
                total += dayProgress.total;
                completed += dayProgress.completed;
            });
        }

        return {
            completed: completed,
            total: total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    },

    // ========================================
    // UI: 학습일정 화면 업데이트
    // ========================================
    async updateScheduleUI() {
        // 데이터 로드 (아직 안 됐으면)
        if (!this._loaded) {
            await this.loadCompletedTasks();
        }

        var user = window.currentUser;
        if (!user) return;

        var programType = user.programType || (user.program === '내벨업챌린지 - Standard' ? 'standard' : 'fast');

        // 1) 전체 진도율 Progress Bar 업데이트
        this.renderTotalProgressBar(programType);

        // 2) 각 요일 버튼에 진도 정보 추가
        this.updateDayButtons(programType);

        console.log('📊 [ProgressTracker] 스케줄 UI 업데이트 완료');
    },

    // ========================================
    // UI: 전체 진도율 Progress Bar
    // ========================================
    renderTotalProgressBar(programType) {
        var progress = this.getTotalProgress(programType);
        var container = document.getElementById('totalProgressContainer');

        // 없으면 생성
        if (!container) {
            container = document.createElement('div');
            container.id = 'totalProgressContainer';
            container.className = 'total-progress-container';

            // scheduleContainer 바로 위에 삽입
            var scheduleContainer = document.getElementById('scheduleContainer');
            if (scheduleContainer && scheduleContainer.parentNode) {
                scheduleContainer.parentNode.insertBefore(container, scheduleContainer);
            }
        }

        // 인증률 표시 (데이터 있을 때만)
        var authRateHtml = '';
        if (this._avgAuthRate !== null) {
            var grade = this.getGrade(this._avgAuthRate);
            authRateHtml = 
                '<div class="auth-rate-display">' +
                    '<span class="auth-rate-label">인증률</span>' +
                    '<span class="auth-rate-value" style="color:' + grade.color + '">' + this._avgAuthRate + '%</span>' +
                    '<span class="auth-rate-grade" style="background:' + grade.color + '">' + grade.letter + '</span>' +
                '</div>';
        }

        container.innerHTML = 
            '<div class="total-progress-header">' +
                '<span class="total-progress-label">전체 진도율</span>' +
                '<span class="total-progress-count">' + progress.completed + ' / ' + progress.total + ' 과제 완료</span>' +
            '</div>' +
            '<div class="total-progress-bar-track">' +
                '<div class="total-progress-bar-fill" style="width: ' + progress.percent + '%"></div>' +
            '</div>' +
            '<div class="total-progress-bottom">' +
                '<div class="total-progress-percent">' + progress.percent + '%</div>' +
                authRateHtml +
            '</div>';
    },

    // ========================================
    // 등급 판정 (인증률 → 등급)
    // ========================================
    getGrade(rate) {
        if (rate >= 95) return { letter: 'A', color: '#22c55e' };
        if (rate >= 90) return { letter: 'B', color: '#3b82f6' };
        if (rate >= 80) return { letter: 'C', color: '#f59e0b' };
        if (rate >= 70) return { letter: 'D', color: '#f97316' };
        return { letter: 'F', color: '#ef4444' };
    },

    // ========================================
    // UI: 요일 버튼에 진도 정보 추가
    // ========================================
    updateDayButtons(programType) {
        var dayMapping = {
            '일': 'sunday', '월': 'monday', '화': 'tuesday',
            '수': 'wednesday', '목': 'thursday', '금': 'friday'
        };
        var days = ['일', '월', '화', '수', '목', '금'];
        var totalWeeks = programType === 'standard' ? 8 : 4;

        // week-block들 순회
        var weekBlocks = document.querySelectorAll('.week-block');
        weekBlocks.forEach(function(weekBlock, weekIndex) {
            var week = weekIndex + 1;
            if (week > totalWeeks) return;

            var dayButtons = weekBlock.querySelectorAll('.day-button');
            dayButtons.forEach(function(btn, dayIndex) {
                if (dayIndex >= days.length) return;

                var dayKr = days[dayIndex];
                var dayEn = dayMapping[dayKr];
                var progress = ProgressTracker.getDayProgress(programType, week, dayEn);

                // 과제가 없는 날(휴무)은 건너뜀
                if (progress.total === 0) return;

                // 기존 진도 표시 제거
                var existing = btn.querySelector('.day-progress');
                if (existing) existing.remove();

                // 진도 표시 추가
                var progressEl = document.createElement('div');
                progressEl.className = 'day-progress';

                if (progress.completed === progress.total && progress.total > 0) {
                    // 전부 완료
                    progressEl.classList.add('day-progress-done');
                    progressEl.innerHTML = '<span class="check-icon"></span> 제출됨';
                } else if (progress.completed > 0) {
                    // 일부 완료
                    progressEl.classList.add('day-progress-partial');
                    progressEl.textContent = progress.completed + '/' + progress.total;
                } else {
                    // 미완료
                    progressEl.classList.add('day-progress-none');
                    progressEl.textContent = '0/' + progress.total;
                }

                btn.appendChild(progressEl);
            });
        });
    },

    // ========================================
    // UI: 과제 목록(section-card)에 체크 아이콘 추가
    // ========================================
    updateTaskCards() {
        if (!this._loaded) return;

        var cards = document.querySelectorAll('#welcomeScreen .section-card');
        cards.forEach(function(card) {
            // 기존 체크 제거
            var existingCheck = card.querySelector('.task-complete-badge');
            if (existingCheck) existingCheck.remove();

            // h3에서 과제명 추출
            var h3 = card.querySelector('h3');
            if (!h3) return;
            var taskName = h3.textContent.trim();

            if (ProgressTracker.isTaskNameCompleted(taskName)) {
                // 완료 배지 추가
                var badge = document.createElement('div');
                badge.className = 'task-complete-badge';
                badge.innerHTML = '<span class="check-icon check-icon-sm"></span>';
                card.appendChild(badge);
                card.classList.add('task-completed');
            } else {
                card.classList.remove('task-completed');
            }
        });
    },

    // ========================================
    // 과제 완료 후 캐시 즉시 갱신 (재조회 없이)
    // ========================================
    markCompleted(taskType, moduleNumber) {
        var key = taskType + '_' + moduleNumber;
        this._completedTasks[key] = {
            week: window.currentTest ? window.currentTest.currentWeek : 1,
            day: window.currentTest ? window.currentTest.currentDay : '월',
            completedAt: new Date().toISOString()
        };
        console.log('📊 [ProgressTracker] 캐시 업데이트:', key);
    }
};

// ========================================
// 자동 연동: showTaskListScreen에 체크 표시 + AuthMonitor 캐시 갱신
// ========================================
(function() {
    var setupDone = false;

    function setup() {
        if (setupDone) return;

        // showTaskListScreen 감싸기 (과제 목록에 체크 표시)
        if (typeof window.showTaskListScreen === 'function') {
            var originalShowTaskList = window.showTaskListScreen;
            window.showTaskListScreen = function(week, dayKr, tasks) {
                originalShowTaskList(week, dayKr, tasks);
                // 과제 카드 렌더링 후 체크 표시
                setTimeout(function() {
                    ProgressTracker.updateTaskCards();
                }, 100);
            };
            console.log('📊 [ProgressTracker] showTaskListScreen 연동 완료');
        }

        // AuthMonitor.saveRecords 후 캐시 갱신 연동
        if (window.AuthMonitor) {
            var originalSave = AuthMonitor.saveRecords.bind(AuthMonitor);
            AuthMonitor.saveRecords = async function() {
                await originalSave();
                // 저장 후 캐시 갱신
                var snap = AuthMonitor._snapshot || {};
                var sType = AuthMonitor._lastSectionType || snap.sectionType;
                var mNum = AuthMonitor._lastModuleNumber || snap.moduleNumber;
                if (sType && mNum) {
                    ProgressTracker.markCompleted(sType, mNum);
                }
            };
            console.log('📊 [ProgressTracker] AuthMonitor 연동 완료');
        }

        setupDone = true;
    }

    // 페이지 로드 후 연결
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(setup, 800);
        });
    } else {
        setTimeout(setup, 800);
    }

    // 반복 체크
    var checkCount = 0;
    var checkInterval = setInterval(function() {
        if (setupDone || checkCount > 20) {
            clearInterval(checkInterval);
            return;
        }
        setup();
        checkCount++;
    }, 1000);
})();

console.log('✅ progress-tracker.js 로드 완료');
