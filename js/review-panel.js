/**
 * ================================================
 * review-panel.js
 * Review 패널 - 리딩/리스닝 1차 풀이 중 문제 목록 확인 + 이동
 * ================================================
 * 
 * v2 - 2026-02-24 버그 수정
 * - 🔥 BUG FIX: 리뷰에서 이전 컴포넌트로 이동 시 답안이 사라지는 버그 수정
 *   기존: navigateToPreviousComponent()가 componentResults/allAnswers를 splice로 삭제 후
 *         복원을 시도했으나, 이미 삭제된 상태에서 복원이 실패하여 답안 유실
 *   수정: _reviewBackup에 답안을 먼저 백업한 뒤 splice → 백업에서 복원
 * - 🔥 NEW: _patchOnComponentComplete() 추가
 *   뒤로 이동 후 다시 앞으로 진행(Next) 시, 이전에 풀었던 답안을 자동 복원
 * - 🔥 IMPROVED: restoreFillBlanksUI()에 정확한 input ID 매칭 추가
 * 
 * 기능:
 * - 전체 문제 목록을 테이블로 표시
 * - 각 문제의 Answered / Not Answered 상태 표시
 * - 행 클릭 시 해당 문제로 이동
 * - 1차 풀이에서만 표시 (2차, 결과, 해설에서는 숨김)
 */

const ReviewPanel = {
    isOpen: false,

    /**
     * Review 패널 열기
     */
    async open() {
        const mc = window.moduleController;
        if (!mc) {
            console.warn('⚠️ [Review] moduleController가 없습니다');
            return;
        }

        console.log('📋 [Review] 패널 열기');

        // ★ 최대 도달 인덱스 갱신 (패널 열 때마다)
        if (this._maxReachedCompIndex === undefined || mc.currentComponentIndex > this._maxReachedCompIndex) {
            this._maxReachedCompIndex = mc.currentComponentIndex;
        }

        // ★ 답안 백업 갱신 (패널 열 때마다 최신 상태 반영)
        if (!this._reviewBackup) {
            this._reviewBackup = {};
        }
        // 완료된 컴포넌트들의 답안 백업
        mc.componentResults.forEach((result, idx) => {
            if (result && result.answers) {
                this._reviewBackup[idx] = {
                    type: result.componentType,
                    answers: JSON.parse(JSON.stringify(result.answers))
                };
            }
        });
        // 현재 진행 중 컴포넌트 답안 백업
        const currentComp = mc.config.components[mc.currentComponentIndex];
        if (currentComp) {
            const currentInstance = this.getCurrentComponentInstance(currentComp.type);
            if (currentInstance) {
                const currentAnswers = this.collectCurrentAnswers(currentInstance, currentComp);
                if (currentAnswers.length > 0) {
                    this._reviewBackup[mc.currentComponentIndex] = {
                        type: currentComp.type,
                        answers: JSON.parse(JSON.stringify(currentAnswers))
                    };
                }
            }
        }

        // 패널 먼저 표시 (로딩 상태)
        const panel = document.getElementById('reviewPanel');
        if (panel) {
            panel.style.display = 'flex';
            this.isOpen = true;
        }

        // 미래 컴포넌트 데이터 미리 로드 (캐시된 데이터 사용)
        await this.preloadComponentData(mc);

        // 전체 문제 데이터 수집
        const reviewData = this.collectReviewData(mc);
        
        // 테이블 렌더링
        this.renderTable(reviewData, mc);

        // Summary 업데이트
        this.updateSummary(reviewData);
    },

    /**
     * Review 패널 닫기
     */
    close() {
        const panel = document.getElementById('reviewPanel');
        if (panel) {
            panel.style.display = 'none';
            this.isOpen = false;
        }
        console.log('📋 [Review] 패널 닫기');
    },

    /**
     * 전체 문제 데이터 수집
     * 각 컴포넌트에서 문제 텍스트 + 답변 여부를 가져옴
     */
    collectReviewData(mc) {
        const reviewData = [];
        let globalQuestionNum = 0;

        // ★ v2: _maxReachedCompIndex를 반영하여 이미 도달한 컴포넌트도 "완료"로 취급
        const maxReached = this._maxReachedCompIndex ?? mc.currentComponentIndex;

        mc.config.components.forEach((comp, compIndex) => {
            const isCurrent = compIndex === mc.currentComponentIndex;
            // 현재보다 앞이거나, 이미 도달했던 컴포넌트(뒤로 이동 후에도)는 완료 취급
            const isCompleted = compIndex < mc.currentComponentIndex || 
                                (compIndex > mc.currentComponentIndex && compIndex <= maxReached);
            const isFuture = compIndex > maxReached;

            // 컴포넌트 인스턴스 가져오기
            let instance = null;
            if (isCurrent) {
                instance = this.getCurrentComponentInstance(comp.type);
            }

            // 캐시 데이터에서 문제 목록 가져오기 (현재 + 미래 모두 사용)
            let preloadedQuestions = null;
            if (!instance || isFuture || isCompleted) {
                preloadedQuestions = this.getPreloadedQuestions(comp);
            }

            for (let qIdx = 0; qIdx < comp.questionsPerSet; qIdx++) {
                globalQuestionNum++;
                
                const questionText = this.getQuestionText(comp, compIndex, qIdx, mc, instance, isCompleted, isCurrent, preloadedQuestions);
                const isAnswered = this.checkAnswered(comp, compIndex, qIdx, mc, instance, isCompleted, isCurrent);

                reviewData.push({
                    number: globalQuestionNum,
                    questionText: questionText,
                    isAnswered: isAnswered,
                    componentIndex: compIndex,
                    questionIndex: qIdx,
                    componentType: comp.type,
                    setId: comp.setId
                });
            }
        });

        return reviewData;
    },

    /**
     * 미래 컴포넌트 데이터 미리 로드 (캐시된 데이터 사용, 없으면 로드)
     */
    async preloadComponentData(mc) {
        const types = new Set(mc.config.components.map(c => c.type));
        const promises = [];

        if (types.has('daily1') && typeof loadDaily1Data === 'function') {
            promises.push(loadDaily1Data().then(d => { this._cachedDaily1 = d; }).catch(() => {}));
        }
        if (types.has('daily2') && typeof loadDaily2Data === 'function') {
            promises.push(loadDaily2Data().then(d => { this._cachedDaily2 = d; }).catch(() => {}));
        }
        if (types.has('academic') && typeof loadAcademicData === 'function') {
            promises.push(loadAcademicData().then(() => {
                this._cachedAcademic = window.readingAcademicData;
            }).catch(() => {}));
        }
        if (types.has('fillblanks') && typeof loadFillBlanksData === 'function') {
            promises.push(loadFillBlanksData().then(d => { this._cachedFillBlanks = d; }).catch(() => {}));
        }

        // 리스닝 컴포넌트 캐시 로드 (임시 인스턴스 생성 → loadData() 호출 → 캐시 반환)
        if (types.has('response') && typeof ResponseComponent === 'function') {
            promises.push(
                new ResponseComponent(1).loadData().then(d => { this._cachedResponse = d; }).catch(() => {})
            );
        }
        if (types.has('conver') && typeof ConverComponent === 'function') {
            promises.push(
                new ConverComponent(1).loadData().then(d => { this._cachedConver = d; }).catch(() => {})
            );
        }
        if (types.has('announcement') && typeof AnnouncementComponent === 'function') {
            const tempAnnounce = new AnnouncementComponent(1);
            promises.push(
                tempAnnounce.loadData().then(() => { this._cachedAnnouncement = tempAnnounce.data; }).catch(() => {})
            );
        }
        if (types.has('lecture') && typeof LectureComponent === 'function') {
            const tempLecture = new LectureComponent(1);
            promises.push(
                tempLecture.loadData().then(() => { this._cachedLecture = tempLecture.data; }).catch(() => {})
            );
        }

        await Promise.all(promises);
    },

    /**
     * 미리 로드된 데이터에서 문제 목록 가져오기
     */
    getPreloadedQuestions(comp) {
        try {
            // setId는 숫자(1, 2, 3...) → 배열 인덱스 = setId - 1
            const idx = (typeof comp.setId === 'number' ? comp.setId : parseInt(comp.setId)) - 1;

            if (comp.type === 'fillblanks' && this._cachedFillBlanks) {
                const sets = this._cachedFillBlanks.sets || this._cachedFillBlanks;
                const set = Array.isArray(sets) ? sets[idx] : null;
                if (set && set.blanks) return set.blanks;
            }
            if (comp.type === 'daily1' && this._cachedDaily1) {
                const sets = this._cachedDaily1.sets || [];
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }
            if (comp.type === 'daily2' && this._cachedDaily2) {
                const sets = this._cachedDaily2.sets || [];
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }
            if (comp.type === 'academic' && this._cachedAcademic) {
                const sets = Array.isArray(this._cachedAcademic) ? this._cachedAcademic : (this._cachedAcademic.sets || []);
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }

            // 리스닝 컴포넌트
            if (comp.type === 'response' && this._cachedResponse) {
                const sets = this._cachedResponse.sets || [];
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }
            if (comp.type === 'conver' && this._cachedConver) {
                const sets = this._cachedConver.sets || [];
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }
            if (comp.type === 'announcement' && this._cachedAnnouncement) {
                const sets = this._cachedAnnouncement.sets || [];
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }
            if (comp.type === 'lecture' && this._cachedLecture) {
                const sets = this._cachedLecture.sets || [];
                const set = sets[idx];
                if (set && set.questions) return set.questions;
            }
        } catch (e) {
            console.warn('⚠️ [Review] 미리로드 데이터 가져오기 실패:', e);
        }
        return null;
    },

    /**
     * 현재 활성 컴포넌트 인스턴스 가져오기
     */
    getCurrentComponentInstance(type) {
        switch (type) {
            case 'fillblanks': return window.currentFillBlanksComponent;
            case 'daily1': return window.currentDaily1Component;
            case 'daily2': return window.currentDaily2Component;
            case 'academic': return window.currentAcademicComponent;
            case 'response': return window.currentResponseComponent;
            case 'conver': return window.currentConverComponent;
            case 'announcement': return window.currentAnnouncementComponent;
            case 'lecture': return window.currentLectureComponent;
            default: return null;
        }
    },

    /**
     * 문제 텍스트 가져오기
     */
    getQuestionText(comp, compIndex, qIdx, mc, instance, isCompleted, isCurrent, preloadedQuestions) {
        // 현재 컴포넌트에서 가져오기 (인스턴스가 있을 때만)
        if (isCurrent && instance) {
            const text = this.getTextFromInstance(instance, comp.type, qIdx);
            if (text && !text.startsWith('Fill in the blank') && !text.startsWith('Question ')) {
                return text;
            }
        }

        // 완료된 컴포넌트 - allAnswers에서 문제 텍스트 추출 (객체인 경우)
        if (isCompleted) {
            let prevQuestions = 0;
            for (let i = 0; i < compIndex; i++) {
                prevQuestions += mc.config.components[i].questionsPerSet;
            }
            const answerObj = mc.allAnswers[prevQuestions + qIdx];
            if (answerObj && typeof answerObj === 'object') {
                if (answerObj.question) return this.formatBlankQuestion(answerObj, comp.type);
                if (answerObj.questionText) return answerObj.questionText;
            }
            const result = mc.componentResults[compIndex];
            if (result && result.answers && result.answers[qIdx]) {
                const a = result.answers[qIdx];
                if (typeof a === 'object' && a.question) return this.formatBlankQuestion(a, comp.type);
            }
        }

        // 미리 로드된 데이터에서 가져오기 (미래 컴포넌트 + 현재 인스턴스 없는 경우)
        if (preloadedQuestions && preloadedQuestions[qIdx]) {
            const q = preloadedQuestions[qIdx];
            if (comp.type === 'fillblanks') {
                return this.formatBlankQuestion(q, comp.type);
            }
            // Response: 오디오 문제라 텍스트 없음 → 헤드폰 아이콘 + 번호
            if (comp.type === 'response') {
                return `🎧 Response Q${qIdx + 1}`;
            }
            return q.question || q.questionText || `Question ${qIdx + 1}`;
        }

        // 폴백: 타입명 + 번호
        if (comp.type === 'response') {
            return `🎧 Response Q${qIdx + 1}`;
        }
        const typeName = this.getComponentTypeName(comp.type);
        return `[${typeName}] Question ${qIdx + 1}`;
    },

    /**
     * 빈칸채우기 문제 포맷 (fr_ _ _ _ _ 형식)
     */
    formatBlankQuestion(item, type) {
        if (type !== 'fillblanks') {
            return item.question || item.questionText || '';
        }
        
        // item.question: "fr_____ (2글자)" 형식 또는 prefix/answer가 있을 수 있음
        const prefix = item.prefix || '';
        const answer = item.correctAnswer || item.answer || '';
        const blankCount = answer.length || item.blankCount || 0;
        
        if (prefix && blankCount > 0) {
            // 언더스코어 + 스페이스 조합으로 간격 표시
            const blanks = Array(blankCount).fill('_').join(' ');
            return `${prefix}${blanks}`;
        }
        
        // question 필드에서 추출
        if (item.question) {
            // "fr_____ (2글자)" → "fr_ _" 형식으로 변환
            return item.question
                .replace(/\(\d+글자\)/, '')  // (N글자) 제거
                .replace(/_{2,}/g, match => Array(match.length).fill('_').join(' '))  // ___ → _ _ _
                .trim();
        }
        
        return `Blank ${item.blankId || ''}`;
    },

    /**
     * 컴포넌트 타입 한글명
     */
    getComponentTypeName(type) {
        const names = {
            'fillblanks': '빈칸채우기',
            'daily1': '일상지문 1',
            'daily2': '일상지문 2',
            'academic': '학술지문',
            'response': '응답고르기',
            'conver': '대화',
            'announcement': '공지사항',
            'lecture': '렉쳐'
        };
        return names[type] || type;
    },

    /**
     * 컴포넌트 인스턴스에서 문제 텍스트 추출
     */
    getTextFromInstance(instance, type, qIdx) {
        try {
            if (type === 'fillblanks') {
                // FillBlanks는 빈칸 단위 - formatBlankQuestion 사용
                if (instance.currentSet && instance.currentSet.blanks && instance.currentSet.blanks[qIdx]) {
                    return this.formatBlankQuestion(instance.currentSet.blanks[qIdx], 'fillblanks');
                }
                return `Fill in the blank ${qIdx + 1}`;
            }

            // 일반 문제형 컴포넌트 (daily1, daily2, academic, response, conver, announcement, lecture)
            let questions = null;
            
            if (instance.currentSet && instance.currentSet.questions) {
                questions = instance.currentSet.questions;
            } else if (instance.currentSetData && instance.currentSetData.questions) {
                questions = instance.currentSetData.questions;
            } else if (instance.setData && instance.setData.questions) {
                questions = instance.setData.questions;
            }

            if (questions && questions[qIdx]) {
                const q = questions[qIdx];
                // Response: 오디오 문제라 텍스트 없음 → 헤드폰 아이콘 + 번호
                if (type === 'response') {
                    return `🎧 Response Q${qIdx + 1}`;
                }
                return q.question || q.questionText || `Question ${qIdx + 1}`;
            }
        } catch (e) {
            console.warn(`⚠️ [Review] 문제 텍스트 추출 실패 (${type}, idx:${qIdx}):`, e);
        }

        return `Question ${qIdx + 1}`;
    },

    /**
     * 답변 여부 확인
     * 
     * ★ v2: _reviewBackup이 있으면 우선 참조
     *   (Review로 이동 후 allAnswers가 splice된 상태에서도 정확한 답변 여부 표시)
     */
    checkAnswered(comp, compIndex, qIdx, mc, instance, isCompleted, isCurrent) {
        // ── 1차: _reviewBackup에서 확인 (이동 후에도 정확) ──
        if (this._reviewBackup && this._reviewBackup[compIndex]) {
            const backup = this._reviewBackup[compIndex];
            if (backup.answers && backup.answers[qIdx] !== undefined) {
                const ans = backup.answers[qIdx];
                if (ans && typeof ans === 'object') {
                    const userAns = ans.userAnswer ?? ans.answer ?? '';
                    return userAns !== undefined && userAns !== null && String(userAns).trim() !== '';
                }
                if (ans !== undefined && ans !== null && ans !== '') {
                    return true;
                }
            }
        }

        // ── 2차: 완료된 컴포넌트 - allAnswers에서 확인 ──
        if (isCompleted) {
            let prevQuestions = 0;
            for (let i = 0; i < compIndex; i++) {
                prevQuestions += mc.config.components[i].questionsPerSet;
            }
            const answer = mc.allAnswers[prevQuestions + qIdx];
            
            // answer가 객체인 경우 (fillblanks 등): userAnswer 필드 확인
            if (answer && typeof answer === 'object') {
                const userAns = answer.userAnswer ?? answer.answer ?? '';
                return userAns !== undefined && userAns !== null && String(userAns).trim() !== '';
            }
            // answer가 문자열/숫자인 경우
            if (answer !== undefined && answer !== null && answer !== '') {
                return true;
            }
            return false;
        }

        // ── 3차: 현재 컴포넌트 - 인스턴스의 answers에서 확인 ──
        if (isCurrent && instance) {
            return this.checkInstanceAnswered(instance, comp.type, qIdx);
        }

        // 미래 컴포넌트 (도달한 적 없음) - 답변 안 됨
        return false;
    },

    /**
     * 컴포넌트 인스턴스에서 답변 여부 확인
     */
    checkInstanceAnswered(instance, type, qIdx) {
        try {
            if (type === 'fillblanks') {
                // FillBlanks: answers 객체에서 blankId로 확인
                if (instance.currentSet && instance.currentSet.blanks && instance.currentSet.blanks[qIdx]) {
                    const blankId = instance.currentSet.blanks[qIdx].id;
                    const answer = instance.answers[blankId];
                    return answer !== undefined && answer !== null && answer.trim() !== '';
                }
                return false;
            }

            // 일반 문제형: answers 객체에서 확인
            if (instance.answers) {
                // daily1, daily2: { 'q1': 2, 'q2': 3 }
                const key1 = `q${qIdx + 1}`;
                if (instance.answers[key1] !== undefined && instance.answers[key1] !== null) {
                    return true;
                }

                // academic: { 0: 'A', 1: 'B' }
                if (instance.answers[qIdx] !== undefined && instance.answers[qIdx] !== null && instance.answers[qIdx] !== '') {
                    return true;
                }

                // response, conver, announcement, lecture: setId_q1 형태
                if (instance.setData || instance.currentSetData) {
                    const setId = (instance.setData && instance.setData.id) || 
                                  (instance.currentSetData && instance.currentSetData.setId) || '';
                    const key2 = `${setId}_q${qIdx + 1}`;
                    const key3 = `${setId}_a${qIdx + 1}`;
                    if ((instance.answers[key2] !== undefined && instance.answers[key2] !== null) ||
                        (instance.answers[key3] !== undefined && instance.answers[key3] !== null)) {
                        return true;
                    }
                }
            }
        } catch (e) {
            console.warn(`⚠️ [Review] 답변 확인 실패 (${type}, idx:${qIdx}):`, e);
        }

        return false;
    },

    /**
     * 테이블 렌더링
     */
    renderTable(reviewData, mc) {
        const tbody = document.getElementById('reviewTableBody');
        if (!tbody) return;

        const totalQuestions = mc.config.totalQuestions;
        const sectionType = mc.config.sectionType;
        
        // 헤더 텍스트 업데이트
        const headerEl = document.getElementById('reviewPanelTitle');
        if (headerEl) {
            const sectionName = sectionType === 'reading' ? 'Reading' : 'Listening';
            headerEl.textContent = `${sectionName} Review (${totalQuestions} Questions)`;
        }

        tbody.innerHTML = '';

        reviewData.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = item.isAnswered ? 'review-row answered' : 'review-row not-answered';
            
            // 현재 풀고 있는 문제 하이라이트
            const currentGlobal = mc.getGlobalQuestionNumber(
                mc.currentComponentInstance?.currentQuestion || 0
            );
            if (item.number === currentGlobal) {
                tr.classList.add('review-row-current');
            }

            // 번호
            const tdNum = document.createElement('td');
            tdNum.className = 'review-cell-num';
            tdNum.textContent = item.number;
            tr.appendChild(tdNum);

            // 문제 텍스트
            const tdQuestion = document.createElement('td');
            tdQuestion.className = 'review-cell-question';
            // 긴 텍스트는 잘라서 표시
            const maxLen = 80;
            const displayText = item.questionText.length > maxLen 
                ? item.questionText.substring(0, maxLen) + '...' 
                : item.questionText;
            tdQuestion.textContent = displayText;
            tr.appendChild(tdQuestion);

            // 상태
            const tdStatus = document.createElement('td');
            tdStatus.className = 'review-cell-status';
            if (item.isAnswered) {
                tdStatus.innerHTML = '<span class="review-status-answered">✅ Answered</span>';
            } else {
                tdStatus.innerHTML = '<span class="review-status-not-answered">⬜ Not Answered</span>';
            }
            tr.appendChild(tdStatus);

            // 클릭 이벤트 - 해당 문제로 이동 (리스닝에서는 비활성화)
            if (sectionType === 'listening') {
                tr.style.cursor = 'default';
            } else {
                tr.addEventListener('click', () => {
                    this.navigateToQuestion(item, mc);
                });
            }

            tbody.appendChild(tr);
        });
    },

    /**
     * 해당 문제로 이동
     */
    navigateToQuestion(item, mc) {
        console.log(`📋 [Review] 문제 ${item.number}로 이동 (컴포넌트: ${item.componentType}, idx: ${item.questionIndex})`);

        const targetCompIndex = item.componentIndex;
        const targetQIdx = item.questionIndex;

        // 같은 컴포넌트 내 이동
        if (targetCompIndex === mc.currentComponentIndex) {
            const instance = this.getCurrentComponentInstance(item.componentType);
            if (instance && typeof instance.loadQuestion === 'function') {
                instance.loadQuestion(targetQIdx);
                // 진행률 업데이트
                mc.updateCurrentQuestionInComponent(targetQIdx);
            }
            this.close();
            return;
        }

        // 다른 컴포넌트로 이동
        // _maxReachedCompIndex: 학생이 실제로 도달한 최대 컴포넌트 인덱스
        // (Review로 뒤로 이동하면 currentComponentIndex가 줄어들지만,
        //  실제 도달 기록은 유지해야 함)
        const maxReached = this._maxReachedCompIndex ?? mc.currentComponentIndex;
        
        if (targetCompIndex > maxReached) {
            alert('아직 도달하지 않은 문제입니다. Next 버튼으로 진행해주세요.');
            return;
        }

        // 이전 또는 이미 도달한 컴포넌트로 이동
        this.navigateToPreviousComponent(mc, targetCompIndex, targetQIdx, item.componentType);
    },

    /**
     * 이전 컴포넌트로 이동 (답안 보존 방식 v2)
     * 
     * ★ 핵심 변경: componentResults / allAnswers를 삭제하지 않음
     * 
     * 기존 버그: splice로 답안을 삭제한 뒤 복원을 시도 → 답안 유실
     * 수정 방법:
     *   1) 현재 진행 중 컴포넌트의 답안을 먼저 수집하여 _reviewBackup에 보관
     *   2) componentResults / allAnswers는 건드리지 않고 그대로 유지
     *   3) 대상 컴포넌트를 재초기화한 뒤, 백업해둔 답안을 인스턴스에 복원
     *   4) 학생이 다시 Next로 진행하면 onComponentComplete에서 기존 데이터를 덮어쓰기
     *      (→ _patchedOnComponentComplete로 자동 처리)
     * 
     * 이로써 어느 방향으로 이동해도 답안이 보존됩니다.
     */
    async navigateToPreviousComponent(mc, targetCompIndex, targetQIdx, targetType) {
        console.log(`📋 [Review] 컴포넌트 이동: ${mc.currentComponentIndex} → ${targetCompIndex}`);

        // ── 0. 최대 도달 인덱스 갱신 ──
        if (!this._maxReachedCompIndex || mc.currentComponentIndex > this._maxReachedCompIndex) {
            this._maxReachedCompIndex = mc.currentComponentIndex;
        }

        // ── 1. 현재 진행 중 컴포넌트의 답안 수집 (아직 submit 안 된 상태) ──
        const currentComp = mc.config.components[mc.currentComponentIndex];
        const currentInstance = this.getCurrentComponentInstance(currentComp.type);
        const currentInProgressAnswers = currentInstance 
            ? this.collectCurrentAnswers(currentInstance, currentComp)
            : [];

        // ── 2. 모든 컴포넌트의 답안을 _reviewBackup에 통합 보관 ──
        //    componentResults(완료된 컴포넌트) + 현재 진행 중 답안
        if (!this._reviewBackup) {
            this._reviewBackup = {};
        }
        // 이미 완료된 컴포넌트들의 답안 백업
        mc.componentResults.forEach((result, idx) => {
            if (result && result.answers) {
                this._reviewBackup[idx] = {
                    type: result.componentType,
                    answers: JSON.parse(JSON.stringify(result.answers))
                };
            }
        });
        // 현재 진행 중 컴포넌트 답안 백업
        if (currentInProgressAnswers.length > 0) {
            this._reviewBackup[mc.currentComponentIndex] = {
                type: currentComp.type,
                answers: JSON.parse(JSON.stringify(currentInProgressAnswers))
            };
        }

        console.log(`📋 [Review] 백업 완료:`, Object.keys(this._reviewBackup).length, '개 컴포넌트');

        // ── 3. 대상 컴포넌트의 답안 추출 (백업에서) ──
        const targetBackup = this._reviewBackup[targetCompIndex];
        const savedAnswers = targetBackup ? targetBackup.answers : [];
        console.log(`📋 [Review] 대상 컴포넌트 백업 답안:`, savedAnswers.length, '개');

        // ── 4. componentResults / allAnswers를 대상 지점으로 되감기 ──
        //    대상 컴포넌트부터 다시 풀게 되므로, 해당 지점까지만 유지
        //    (삭제가 아니라, 대상 이후 것들은 _reviewBackup에 이미 보관됨)
        if (mc.componentResults.length > targetCompIndex) {
            mc.componentResults.splice(targetCompIndex);
        }
        // allAnswers도 대상 컴포넌트 시작 지점까지만 유지
        let answersBeforeTarget = 0;
        for (let i = 0; i < targetCompIndex; i++) {
            answersBeforeTarget += mc.config.components[i].questionsPerSet;
        }
        if (mc.allAnswers.length > answersBeforeTarget) {
            mc.allAnswers.splice(answersBeforeTarget);
        }

        // ── 5. 컴포넌트 인덱스 되돌리기 ──
        mc.currentComponentIndex = targetCompIndex;
        mc.currentQuestionNumber = answersBeforeTarget;

        // ── 6. 대상 컴포넌트 로드 ──
        const targetComp = mc.config.components[targetCompIndex];
        mc.updateProgress();
        mc.updateHeaderTitle(targetComp.type);

        const initOptions = {
            startQuestionNumber: mc.currentQuestionNumber + 1,
            totalModuleQuestions: mc.config.totalQuestions
        };

        switch (targetComp.type) {
            case 'fillblanks':
                mc.currentComponentInstance = window.FillBlanksComponent;
                if (window.initFillBlanksComponent) {
                    await window.initFillBlanksComponent(targetComp.setId, mc.onComponentComplete.bind(mc), initOptions);
                }
                mc.updateNavigationButtons(targetComp.type, 0, targetComp.questionsPerSet);
                break;
            case 'daily1':
                mc.currentComponentInstance = window.Daily1Component;
                if (window.initDaily1Component) {
                    await window.initDaily1Component(targetComp.setId, mc.onComponentComplete.bind(mc), initOptions);
                }
                break;
            case 'daily2':
                mc.currentComponentInstance = window.Daily2Component;
                if (window.initDaily2Component) {
                    await window.initDaily2Component(targetComp.setId, mc.onComponentComplete.bind(mc), initOptions);
                }
                break;
            case 'academic':
                mc.currentComponentInstance = window.AcademicComponent;
                if (window.initAcademicComponent) {
                    await window.initAcademicComponent(targetComp.setId, mc.onComponentComplete.bind(mc), initOptions);
                }
                break;
        }

        // 비동기 로드 대기
        await new Promise(resolve => setTimeout(resolve, 300));

        // ── 7. 백업한 답안을 새 인스턴스에 복원 ──
        this.restoreAnswersToInstance(targetComp.type, savedAnswers, targetComp);

        // ── 8. 대상 문제로 이동 (loadQuestion이 UI 복원 포함) ──
        const instance = this.getCurrentComponentInstance(targetComp.type);
        if (instance && typeof instance.loadQuestion === 'function') {
            instance.loadQuestion(targetQIdx);
            mc.updateCurrentQuestionInComponent(targetQIdx);
        }

        // ── 9. 이후 컴포넌트 답안 자동 복원 패치 ──
        //    학생이 Next → onComponentComplete로 다음 컴포넌트에 진입할 때
        //    _reviewBackup에 보관된 답안을 자동 복원
        this._patchOnComponentComplete(mc);

        console.log(`📋 [Review] 이동 완료 — 답안 복원됨`);
        this.close();
    },

    /**
     * onComponentComplete 패치: 다음 컴포넌트 로드 시 백업 답안 자동 복원
     * 
     * 학생이 Review로 뒤로 이동한 뒤 → Next로 다시 앞으로 진행하면
     * 새로 초기화된 컴포넌트에 _reviewBackup의 답안을 자동으로 넣어줌
     */
    _patchOnComponentComplete(mc) {
        // 이미 패치했으면 스킵
        if (mc._reviewPatched) return;
        mc._reviewPatched = true;

        const originalOnComplete = mc.onComponentComplete.bind(mc);
        const self = this;

        mc.onComponentComplete = function(componentResult) {
            // 원본 로직 실행 (allAnswers push, componentResults push, 다음 컴포넌트 로드)
            originalOnComplete(componentResult);

            // 다음 컴포넌트에 백업 답안 복원
            const nextIndex = mc.currentComponentIndex;
            if (self._reviewBackup && self._reviewBackup[nextIndex]) {
                const backup = self._reviewBackup[nextIndex];
                const nextComp = mc.config.components[nextIndex];
                if (nextComp) {
                    console.log(`📋 [Review] 자동 복원: 컴포넌트 ${nextIndex} (${backup.type})`);
                    // 약간의 딜레이 후 복원 (init 완료 대기)
                    setTimeout(() => {
                        self.restoreAnswersToInstance(nextComp.type, backup.answers, nextComp);
                        // 현재 문제의 UI도 갱신
                        const inst = self.getCurrentComponentInstance(nextComp.type);
                        if (inst && typeof inst.loadQuestion === 'function' && inst.currentQuestion !== undefined) {
                            inst.loadQuestion(inst.currentQuestion);
                        }
                    }, 400);
                }
            }
        };
    },

    /**
     * 백업한 답안을 새로 생성된 컴포넌트 인스턴스에 복원
     */
    restoreAnswersToInstance(type, savedAnswers, comp) {
        if (!savedAnswers || savedAnswers.length === 0) {
            console.log(`📋 [Review] 복원할 답안 없음 (type: ${type})`);
            return;
        }

        console.log(`📋 [Review] 답안 복원 시작: type=${type}, 답안 ${savedAnswers.length}개, 첫번째:`, savedAnswers[0]);

        try {
            if (type === 'fillblanks') {
                const instance = window.currentFillBlanksComponent;
                if (instance && instance.currentSet && instance.currentSet.blanks) {
                    // ★ FillBlanks 복원: 두 가지 형태의 답안 처리
                    // 1) componentResults에서 온 경우: { blankId: 'b1', userAnswer: 'fr', ... } (startIndex 정렬)
                    // 2) collectCurrentAnswers에서 온 경우: 'fr' (blanks 배열 순서)
                    
                    const hasBlankId = savedAnswers.some(a => a && typeof a === 'object' && a.blankId);
                    
                    if (hasBlankId) {
                        // blankId로 정확 매칭 (정렬 순서 무관)
                        savedAnswers.forEach((ans) => {
                            if (!ans || typeof ans !== 'object' || !ans.blankId) return;
                            const userAns = ans.userAnswer || ans.answer || '';
                            if (!userAns) return;
                            
                            instance.answers[ans.blankId] = userAns;
                            const blank = instance.currentSet.blanks.find(b => b.id === ans.blankId);
                            if (blank) {
                                this.restoreFillBlanksUI(blank, userAns, instance);
                            }
                        });
                    } else {
                        // blanks 배열 인덱스 순서로 매칭
                        savedAnswers.forEach((ans, idx) => {
                            const blank = instance.currentSet.blanks[idx];
                            if (!blank) return;
                            const userAns = (typeof ans === 'string') ? ans : 
                                           (ans && typeof ans === 'object') ? (ans.userAnswer || ans.answer || '') : '';
                            if (!userAns) return;
                            
                            instance.answers[blank.id] = userAns;
                            this.restoreFillBlanksUI(blank, userAns, instance);
                        });
                    }

                    console.log(`📋 [Review] FillBlanks 답안 복원 완료:`, Object.keys(instance.answers).length, '개');
                }
            } else {
                // daily1, daily2, academic
                const instanceMap = {
                    'daily1': window.currentDaily1Component,
                    'daily2': window.currentDaily2Component,
                    'academic': window.currentAcademicComponent
                };
                const instance = instanceMap[type];
                if (instance) {
                    savedAnswers.forEach((ans, idx) => {
                        const val = (typeof ans === 'object') 
                            ? (ans.userAnswer || ans.answer || '') 
                            : ans;

                        if (type === 'academic') {
                            // academic: answers[idx] = 'A'/'B'/'C'/'D'
                            if (val !== undefined && val !== null && val !== '') {
                                instance.answers[idx] = val;
                            }
                        } else {
                            // daily1/daily2: answers['q1'] = 1, answers['q2'] = 3
                            const key = `q${idx + 1}`;
                            if (val !== undefined && val !== null && val !== '') {
                                instance.answers[key] = val;
                            }
                        }
                    });
                    console.log(`📋 [Review] ${type} 답안 복원 완료:`, instance.answers);
                }
            }
        } catch (e) {
            console.warn(`⚠️ [Review] 답안 복원 실패:`, e);
        }
    },

    /**
     * FillBlanks UI 복원 (input 필드에 값 채우기)
     */
    restoreFillBlanksUI(blank, userAnswer, instance) {
        try {
            const chars = userAnswer.split('');
            const setId = instance && instance.currentSet ? instance.currentSet.id : '';
            
            console.log(`📋 [Review] FillBlanks UI 복원 시도: blank.id=${blank.id}, answer="${userAnswer}", setId=${setId}, chars=${chars.length}개`);
            
            let restoredCount = 0;
            chars.forEach((char, charIdx) => {
                // 정확한 ID로 먼저 시도: blank_setId_blankId_charIdx
                let input = null;
                const exactId = `blank_${setId}_${blank.id}_${charIdx}`;
                if (setId) {
                    input = document.getElementById(exactId);
                }
                // 폴백: 와일드카드 검색
                if (!input) {
                    const inputs = document.querySelectorAll(`input[id*="_${blank.id}_${charIdx}"]`);
                    input = inputs[0] || null;
                }
                // 폴백2: 더 넓은 범위
                if (!input) {
                    const inputs = document.querySelectorAll(`input[id*="_${blank.id}_"]`);
                    input = inputs[charIdx] || null;
                }
                
                if (input) {
                    input.value = char;
                    input.classList.add('filled');
                    // 입력 필드 크기 조정 (FillBlanksComponent 스타일 유지)
                    input.style.width = '';
                    input.style.padding = '';
                    restoredCount++;
                } else {
                    console.warn(`⚠️ [Review] input 못 찾음: exactId=${exactId}`);
                }
            });
            console.log(`📋 [Review] FillBlanks UI: ${restoredCount}/${chars.length} 글자 복원됨`);
        } catch (e) {
            // UI 복원 실패해도 답안 데이터는 보존됨
            console.warn(`⚠️ [Review] FillBlanks UI 복원 실패:`, e);
        }
    },

    /**
     * 현재 컴포넌트의 답변 수집 (submit 없이)
     */
    collectCurrentAnswers(instance, comp) {
        const answers = [];
        
        if (comp.type === 'fillblanks' && instance.currentSet) {
            for (let i = 0; i < comp.questionsPerSet; i++) {
                const blank = instance.currentSet.blanks[i];
                if (blank) {
                    answers.push(instance.answers[blank.id] || '');
                } else {
                    answers.push('');
                }
            }
        } else if (instance.answers) {
            for (let i = 0; i < comp.questionsPerSet; i++) {
                // 다양한 키 형태 시도
                const key1 = `q${i + 1}`;
                const answer = instance.answers[key1] ?? instance.answers[i] ?? null;
                answers.push(answer);
            }
        }

        return answers;
    },

    /**
     * Summary 업데이트 (Answered / Not Answered 개수)
     */
    updateSummary(reviewData) {
        const summaryEl = document.getElementById('reviewSummary');
        if (!summaryEl) return;

        const answered = reviewData.filter(d => d.isAnswered).length;
        const notAnswered = reviewData.length - answered;

        summaryEl.innerHTML = `
            <span class="review-summary-item review-summary-answered">✅ Answered: ${answered}</span>
            <span class="review-summary-item review-summary-not-answered">⬜ Not Answered: ${notAnswered}</span>
        `;
    },

    /**
     * Review 버튼 표시/숨김
     * 1차 풀이에서만 표시
     */
    updateButtonVisibility() {
        const buttons = document.querySelectorAll('.review-btn');
        const fc = window.FlowController;
        
        // 1차 풀이 + 리딩/리스닝에서만 표시
        const mc = window.moduleController;
        const sectionType = mc?.config?.sectionType || (fc && fc.sectionType);
        const attemptNumber = (fc && fc.currentAttemptNumber) || 1;
        
        const shouldShow = mc && 
                          attemptNumber === 1 &&
                          (sectionType === 'reading' || sectionType === 'listening');

        buttons.forEach(btn => {
            btn.style.display = shouldShow ? 'inline-flex' : 'none';
        });
    }
};

// 전역 함수 노출
window.openReviewPanel = function() { ReviewPanel.open(); };
window.closeReviewPanel = function() { ReviewPanel.close(); };

// Review 버튼 자동 표시/숨김 감시
// moduleController가 생성될 때 버튼을 표시하고, 파괴될 때 숨김
(function() {
    let lastModuleController = null;
    
    setInterval(() => {
        const mc = window.moduleController;
        const fc = window.FlowController;
        
        if (mc !== lastModuleController) {
            lastModuleController = mc;
            ReviewPanel.updateButtonVisibility();
        }
    }, 500);
})();

console.log('✅ review-panel.js 로드 완료');
