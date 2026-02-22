/**
 * ================================================
 * auth-monitor.js v2
 * 인증시스템 — 체크리스트 방식 (30/30/40)
 * ================================================
 * 
 * 체크리스트:
 *   1차 제출 완료 → 30%
 *   2차 제출 완료 → 30%
 *   해설 확인 + 오답노트(20단어↑) → 40%
 * 
 * 호출 시점:
 *   FlowController/WritingFlow wrap을 통해 자동 감지
 *   오답노트 제출 이벤트(errorNoteSubmitted)로 해설 단계 감지
 */

var AuthMonitor = {
    // ========================================
    // 상태
    // ========================================
    isActive: false,
    sectionType: null,
    moduleNumber: null,
    _lastSectionType: null,
    _lastModuleNumber: null,
    _snapshot: null,

    // 체크리스트 상태
    _step1Done: false,      // 1차 제출 완료
    _step2Done: false,      // 2차 제출 완료
    _explanationDone: false, // 해설+오답노트 완료
    _fraudFlag: false,      // 부정행위 플래그 (경고 무시 제출)
    _studyRecordId: null,   // 저장된 study_record ID

    // ========================================
    // 시작 — 과제 진입 시
    // ========================================
    start: function(sectionType, moduleNumber) {
        console.log('🔒 [Auth] 시작:', sectionType, moduleNumber);

        this.isActive = true;
        this.sectionType = sectionType;
        this.moduleNumber = moduleNumber;
        this._lastSectionType = sectionType;
        this._lastModuleNumber = moduleNumber;

        // 체크리스트 초기화
        this._step1Done = false;
        this._step2Done = false;
        this._explanationDone = false;
        this._fraudFlag = false;
        this._studyRecordId = null;
    },

    // ========================================
    // 종료
    // ========================================
    stop: function() {
        // 종료 (silent)
        this.isActive = false;
        this.sectionType = null;
        this.moduleNumber = null;
    },

    // ========================================
    // 단계 완료 마킹
    // ========================================
    markStep1: function() {
        this._step1Done = true;
        console.log('🔒 [Auth] 1차 ✅');
    },

    markStep2: function() {
        this._step2Done = true;
        console.log('🔒 [Auth] 2차 ✅');
    },

    markExplanation: function(isFraud) {
        if (isFraud) {
            this._fraudFlag = true;
            this._explanationDone = false;
            console.log('🔒 [Auth] 해설 ❌ (fraud)');
        } else {
            this._explanationDone = true;
            console.log('🔒 [Auth] 해설 ✅');
        }
    },

    // ========================================
    // 인증률 계산 (30/30/40)
    // ========================================
    calculateAuthRate: function() {
        var rate = 0;
        if (this._step1Done) rate += 30;
        if (this._step2Done) rate += 30;
        if (this._explanationDone && !this._fraudFlag) rate += 40;

        console.log('🔒 [Auth] 인증률:', rate + '%');

        return rate;
    },

    // ========================================
    // 현재 스케줄 정보
    // ========================================
    getCurrentScheduleInfo: function() {
        var ct = window.currentTest;
        if (ct && ct.currentWeek) {
            return { week: ct.currentWeek, day: ct.currentDay || '월' };
        }
        return { week: 1, day: '월' };
    },

    // ========================================
    // 1차 제출 완료 시: study_record INSERT + _studyRecordId 확보
    // ========================================
    saveFirstAttempt: async function() {
        if (window._deadlinePassedMode) {
            console.log('🔒 [Auth] 마감 지난 과제 — 저장 생략');
            return;
        }
        var user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
        if (!user || !user.id || user.id === 'dev-user-001') {
            console.log('🔒 [Auth] 개발 모드 — 저장 생략');
            return;
        }

        var sectionType = this.sectionType || this._lastSectionType;
        var moduleNumber = this.moduleNumber || this._lastModuleNumber;

        if (!sectionType || !moduleNumber) {
            console.warn('🔒 [Auth] 섹션/모듈 정보 없음 — 저장 생략');
            return;
        }

        // 1차 결과 데이터 추출
        var fc = window.FlowController;
        var wf = window.WritingFlow;
        var firstResult = null;

        if (sectionType === 'writing' && wf && wf.arrange1stResult) {
            firstResult = wf.arrange1stResult;
        } else if (fc && fc.firstAttemptResult) {
            firstResult = fc.firstAttemptResult;
        }

        var score = 0, total = 0, timeSpent = 0, detail = {};
        if (firstResult) {
            total = firstResult.totalQuestions || 0;
            timeSpent = firstResult.totalTimeSpent || firstResult.timeSpent || 0;

            if (firstResult.componentResults) {
                var totalCorrect = 0;
                firstResult.componentResults.forEach(function(comp) {
                    var key = comp.componentType + '_' + (comp.setId || '1');
                    var answerArray = comp.answers || comp.results || [];
                    var compTotal = answerArray.length || comp.totalQuestions || comp.questionsPerSet || 0;
                    var compCorrect = 0;
                    if (Array.isArray(answerArray)) {
                        compCorrect = answerArray.filter(function(a) { return a.isCorrect; }).length;
                    }
                    if (compCorrect === 0 && comp.correctCount) {
                        compCorrect = comp.correctCount;
                    }
                    detail[key] = compCorrect + '/' + compTotal;
                    totalCorrect += compCorrect;
                });
                score = totalCorrect;
            } else {
                score = firstResult.correctCount || 0;
            }
        }

        // result_json (1차 결과)
        var resultJson = null;
        if (firstResult && firstResult.componentResults) {
            try {
                resultJson = JSON.parse(JSON.stringify(firstResult));
                console.log('💾 [Auth] result_json 준비 완료 - componentResults:', firstResult.componentResults.length, '개');
            } catch (e) {
                console.warn('⚠️ [Auth] result_json 직렬화 실패:', e);
            }
        }

        var scheduleInfo = this.getCurrentScheduleInfo();

        var studyRecordData = {
            user_id: user.id,
            week: scheduleInfo.week,
            day: scheduleInfo.day,
            task_type: sectionType,
            module_number: moduleNumber,
            attempt: 1,
            score: score,
            total: total,
            time_spent: timeSpent,
            detail: detail,
            result_json: resultJson,
            completed_at: new Date().toISOString()
        };

        console.log('💾 [Auth] 1차 결과 저장...');
        var studyRecord = await saveStudyRecord(studyRecordData);

        if (studyRecord && studyRecord.id) {
            this._studyRecordId = studyRecord.id;
            console.log('💾 [Auth] study_record 생성 완료:', studyRecord.id);
        } else {
            console.warn('🔒 [Auth] study_record 저장 실패');
        }
    },

    // ========================================
    // 오답노트 저장: _studyRecordId로 UPDATE
    // ========================================
    saveErrorNote: async function(text, wordCount, speakingFile1, speakingFile2) {
        if (!this._studyRecordId) {
            console.warn('📝 [Auth] studyRecordId 없음 — 오답노트 저장 실패');
            return false;
        }

        try {
            var updateData = {
                error_note_text: text,
                error_note_word_count: wordCount
            };
            if (speakingFile1) updateData.speaking_file_1 = speakingFile1;
            if (speakingFile2) updateData.speaking_file_2 = speakingFile2;

            await supabaseUpdate('tr_study_records', 'id=eq.' + this._studyRecordId, updateData);
            console.log('📝 [Auth] 오답노트 저장 완료:', this._studyRecordId);
            return true;
        } catch (e) {
            console.error('📝 [Auth] 오답노트 저장 실패:', e);
            return false;
        }
    },

    // ========================================
    // finish() 시점: 최종 인증률 + auth_record 저장
    // ========================================
    saveFinalRecords: async function() {
        if (window._deadlinePassedMode) {
            console.log('🔒 [Auth] 마감 지난 과제 — 저장 생략');
            return;
        }
        var user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
        if (!user || !user.id || user.id === 'dev-user-001') {
            console.log('🔒 [Auth] 개발 모드 — 저장 생략');
            return;
        }

        // study_record가 아직 없으면 (예외: 1차 저장 실패 등) 기존 방식으로 INSERT
        if (!this._studyRecordId) {
            console.log('🔒 [Auth] studyRecordId 없음 — 풀 INSERT 폴백');
            await this._fallbackSaveRecords(user);
            return;
        }

        // 2차 결과 업데이트 (retakeResult가 있으면)
        var fc = window.FlowController;
        var snap = this._snapshot || {};
        if (fc && fc.firstAttemptResult) {
            try {
                var updatedJson = {
                    firstAttemptResult: JSON.parse(JSON.stringify(fc.firstAttemptResult))
                };
                if (snap.retakeResult) {
                    updatedJson.retakeResult = JSON.parse(JSON.stringify(snap.retakeResult));
                }
                await supabaseUpdate('tr_study_records', 'id=eq.' + this._studyRecordId, {
                    result_json: updatedJson
                });
                console.log('💾 [Auth] result_json 최종 업데이트 완료');
            } catch (e) {
                console.warn('⚠️ [Auth] result_json 업데이트 실패:', e);
            }
        }

        // auth_record 저장
        var authRate = this.calculateAuthRate();
        var authRecordData = {
            user_id: user.id,
            study_record_id: this._studyRecordId,
            auth_rate: authRate,
            step1_completed: this._step1Done,
            step2_completed: this._step2Done,
            explanation_completed: this._explanationDone,
            fraud_flag: this._fraudFlag,
            focus_lost_count: 0
        };

        var authRecord = await saveAuthRecord(authRecordData);
        console.log('🔒 [Auth] 최종 저장 완료:', authRate + '%');
    },

    // ========================================
    // 폴백: study_record가 없을 때 기존 방식으로 한번에 INSERT
    // ========================================
    _fallbackSaveRecords: async function(user) {
        var snap = this._snapshot || {};
        var sectionType = this.sectionType || snap.sectionType || this._lastSectionType;
        var moduleNumber = this.moduleNumber || snap.moduleNumber || this._lastModuleNumber;

        if (!sectionType || !moduleNumber) {
            console.warn('🔒 [Auth] 폴백 — 섹션/모듈 정보 없음');
            return;
        }

        var fc = window.FlowController;
        var wf = window.WritingFlow;
        var firstResult = null;

        if (sectionType === 'writing' && wf && wf.arrange1stResult) {
            firstResult = wf.arrange1stResult;
        } else if (fc && fc.firstAttemptResult) {
            firstResult = fc.firstAttemptResult;
        } else if (snap.firstAttemptResult) {
            firstResult = snap.firstAttemptResult;
        }

        var score = 0, total = 0, timeSpent = 0, detail = {};
        if (firstResult) {
            total = firstResult.totalQuestions || 0;
            timeSpent = firstResult.totalTimeSpent || firstResult.timeSpent || 0;
            if (firstResult.componentResults) {
                var totalCorrect = 0;
                firstResult.componentResults.forEach(function(comp) {
                    var key = comp.componentType + '_' + (comp.setId || '1');
                    var answerArray = comp.answers || comp.results || [];
                    var compTotal = answerArray.length || comp.totalQuestions || comp.questionsPerSet || 0;
                    var compCorrect = 0;
                    if (Array.isArray(answerArray)) {
                        compCorrect = answerArray.filter(function(a) { return a.isCorrect; }).length;
                    }
                    if (compCorrect === 0 && comp.correctCount) compCorrect = comp.correctCount;
                    detail[key] = compCorrect + '/' + compTotal;
                    totalCorrect += compCorrect;
                });
                score = totalCorrect;
            } else {
                score = firstResult.correctCount || 0;
            }
        }

        var resultJson = null;
        if (firstResult && firstResult.componentResults) {
            try { resultJson = JSON.parse(JSON.stringify(firstResult)); } catch (e) {}
        }

        var scheduleInfo = this.getCurrentScheduleInfo();
        var studyRecordData = {
            user_id: user.id,
            week: scheduleInfo.week,
            day: scheduleInfo.day,
            task_type: sectionType,
            module_number: moduleNumber,
            attempt: 1,
            score: score,
            total: total,
            time_spent: timeSpent,
            detail: detail,
            result_json: resultJson,
            completed_at: new Date().toISOString()
        };

        console.log('💾 [Auth] 폴백 INSERT...');
        var studyRecord = await saveStudyRecord(studyRecordData);

        if (studyRecord && studyRecord.id) {
            this._studyRecordId = studyRecord.id;
            var authRate = this.calculateAuthRate();
            var authRecordData = {
                user_id: user.id,
                study_record_id: studyRecord.id,
                auth_rate: authRate,
                step1_completed: this._step1Done,
                step2_completed: this._step2Done,
                explanation_completed: this._explanationDone,
                fraud_flag: this._fraudFlag,
                focus_lost_count: 0
            };
            await saveAuthRecord(authRecordData);
            console.log('🔒 [Auth] 폴백 저장 완료:', authRate + '%');
        }
    },

    // ========================================
    // 오답노트 제출 후 auth_records 업데이트
    // ========================================
    updateExplanationStatus: async function() {
        if (!this._studyRecordId) {
            console.warn('🔒 [Auth] studyRecordId 없음');
            return;
        }

        var authRate = this.calculateAuthRate();

        try {
            await supabaseUpdate(
                'tr_auth_records',
                'study_record_id=eq.' + this._studyRecordId,
                {
                    auth_rate: authRate,
                    explanation_completed: this._explanationDone,
                    fraud_flag: this._fraudFlag
                }
            );
            console.log('🔒 [Auth] 인증률 업데이트:', authRate + '%');
        } catch (e) {
            console.error('🔒 [Auth] 업데이트 실패:', e);
        }
    }
};

// ========================================
// FlowController + WritingFlow 통합 (함수 감싸기)
// ========================================
(function() {
    var setupDone = false;

    function setupIntegration() {
        if (setupDone) return;

        var fc = window.FlowController;
        if (!fc) return;

        // ── FlowController.start → AuthMonitor 시작 ──
        var originalStart = fc.start.bind(fc);
        fc.start = function(sectionType, moduleNumber) {
            AuthMonitor.start(sectionType, moduleNumber);
            AuthMonitor._snapshot = {
                sectionType: sectionType,
                moduleNumber: moduleNumber,
                firstAttemptResult: null
            };
            return originalStart(sectionType, moduleNumber);
        };

        // ── FlowController.afterFirstAttempt → 1차 완료 + study_record INSERT ──
        var originalAfterFirst = fc.afterFirstAttempt.bind(fc);
        fc.afterFirstAttempt = async function() {
            AuthMonitor.markStep1();
            if (AuthMonitor._snapshot && fc.firstAttemptResult) {
                AuthMonitor._snapshot.firstAttemptResult = fc.firstAttemptResult;
            }
            // ★ 1차 결과를 즉시 DB에 저장하여 _studyRecordId 확보
            await AuthMonitor.saveFirstAttempt();
            return originalAfterFirst();
        };

        // ── FlowController.showRetakeResult → 2차 완료 (R/L) ──
        var originalShowRetake = fc.showRetakeResult.bind(fc);
        fc.showRetakeResult = function(secondResults) {
            AuthMonitor.markStep2();
            
            // ★ 2차 결과를 result_json에 추가 저장 (_studyRecordId가 확보된 상태)
            if (AuthMonitor._studyRecordId && secondResults) {
                AuthMonitor._snapshot = AuthMonitor._snapshot || {};
                AuthMonitor._snapshot.retakeResult = secondResults;
                try {
                    var updatedJson = {
                        firstAttemptResult: fc.firstAttemptResult ? JSON.parse(JSON.stringify(fc.firstAttemptResult)) : null,
                        retakeResult: JSON.parse(JSON.stringify(secondResults))
                    };
                    supabaseUpdate('tr_study_records', 'id=eq.' + AuthMonitor._studyRecordId, {
                        result_json: updatedJson
                    });
                    console.log('💾 [Auth] result_json 업데이트 — 1차+2차 결과 저장 완료');
                } catch (e) {
                    console.warn('⚠️ [Auth] 2차 결과 저장 실패:', e);
                }
            }
            
            return originalShowRetake(secondResults);
        };

        // ── FlowController.showExplain → 2차 완료 (Speaking) ──
        // 스피킹은 retakeResult를 거치지 않고 바로 explain으로 가는 경우가 있음
        // showExplain 진입 시 step2가 아직 안 됐으면 마킹
        var originalShowExplain = fc.showExplain.bind(fc);
        fc.showExplain = function() {
            if (!AuthMonitor._step2Done) {
                AuthMonitor.markStep2();
            }
            return originalShowExplain();
        };

        // ── FlowController.finish → 최종 인증률 + auth_record 저장 ──
        var originalFinish = fc.finish.bind(fc);
        fc.finish = async function() {
            if (fc.sectionType) {
                AuthMonitor._snapshot = AuthMonitor._snapshot || {};
                AuthMonitor._snapshot.sectionType = fc.sectionType;
                AuthMonitor._snapshot.moduleNumber = fc.moduleNumber;
                AuthMonitor._snapshot.firstAttemptResult = fc.firstAttemptResult;
            }
            // result-screen, test-screen 숨기기
            document.querySelectorAll('.result-screen, .test-screen').forEach(function(el) {
                el.style.display = 'none';
            });
            // ★ 최종 저장: auth_record + 인증률 (study_record는 이미 1차 시점에 생성됨)
            await AuthMonitor.saveFinalRecords();
            AuthMonitor.stop();
            AuthMonitor._snapshot = null;
            originalFinish();
        };

        console.log('✅ [Auth] FlowController 연동');

        // ── WritingFlow 통합 ──
        var wf = window.WritingFlow;
        if (wf) {
            // WritingFlow.start → AuthMonitor 시작
            if (wf.start) {
                var originalWFStart = wf.start.bind(wf);
                wf.start = function(moduleNumber, moduleConfig) {
                    AuthMonitor.start('writing', moduleNumber);
                    return originalWFStart(moduleNumber, moduleConfig);
                };
            }

            // WritingFlow 1차 완료 감지 — arrange 1차 결과 후
            // Step 4 (arrange 1차 결과)에 진입하면 1차 완료
            if (wf.runStep4) {
                var originalStep4 = wf.runStep4.bind(wf);
                wf.runStep4 = function() {
                    AuthMonitor.markStep1();
                    return originalStep4();
                };
            }

            // WritingFlow 2차 완료 감지 — Step 10 완료 후 Step 11 진입 시
            if (wf.runStep11_email) {
                var originalStep11 = wf.runStep11_email.bind(wf);
                wf.runStep11_email = function() {
                    AuthMonitor.markStep2();
                    return originalStep11();
                };
            }

            // WritingFlow.runStep12 → 최종 기록 저장
            if (wf.runStep12) {
                var originalStep12 = wf.runStep12.bind(wf);
                wf.runStep12 = async function() {
                    if (!AuthMonitor.isActive) {
                        AuthMonitor.start('writing', wf.moduleNumber || 0);
                    }
                    await AuthMonitor.saveFinalRecords();
                    AuthMonitor.stop();
                    return originalStep12();
                };
            }

            console.log('✅ [Auth] WritingFlow 연동');
        }

        // ── 오답노트 제출 이벤트 감지 ──
        window.addEventListener('errorNoteSubmitted', function(e) {
            var detail = e.detail || {};
            AuthMonitor.markExplanation(detail.isFraud);
            AuthMonitor.updateExplanationStatus();
        });

        // 오답노트 이벤트 연동 완료

        setupDone = true;
    }

    // 페이지 로드 후 연결
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(setupIntegration, 500);
        });
    } else {
        setTimeout(setupIntegration, 500);
    }

    // 반복 체크
    var checkCount = 0;
    var checkInterval = setInterval(function() {
        if (setupDone || checkCount > 20) {
            clearInterval(checkInterval);
            return;
        }
        setupIntegration();
        checkCount++;
    }, 1000);
})();

console.log('✅ auth-monitor.js v2 로드');
