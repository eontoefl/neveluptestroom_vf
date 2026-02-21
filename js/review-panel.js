/**
 * ================================================
 * review-panel.js
 * Review 패널 - 리딩/리스닝 1차 풀이 중 문제 목록 확인 + 이동
 * ================================================
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

        mc.config.components.forEach((comp, compIndex) => {
            const isCompleted = compIndex < mc.currentComponentIndex;
            const isCurrent = compIndex === mc.currentComponentIndex;
            const isFuture = compIndex > mc.currentComponentIndex;

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
     */
    checkAnswered(comp, compIndex, qIdx, mc, instance, isCompleted, isCurrent) {
        // 완료된 컴포넌트 - allAnswers에서 확인
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

        // 현재 컴포넌트 - 인스턴스의 answers에서 확인
        if (isCurrent && instance) {
            return this.checkInstanceAnswered(instance, comp.type, qIdx);
        }

        // 미래 컴포넌트 - 답변 안 됨
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

        // 다른 컴포넌트로 이동 - 현재 컴포넌트의 답변을 저장하고 대상 컴포넌트로 전환
        // 현재는 이미 완료된(뒤로 갈 수 있는) 컴포넌트로의 이동만 지원
        // 미래 컴포넌트로는 이동 불가 (아직 로드 안 됨)
        if (targetCompIndex > mc.currentComponentIndex) {
            alert('아직 도달하지 않은 문제입니다. Next 버튼으로 진행해주세요.');
            return;
        }

        // 이전 컴포넌트로 이동: goToPreviousComponent를 반복 호출
        this.navigateToPreviousComponent(mc, targetCompIndex, targetQIdx, item.componentType);
    },

    /**
     * 이전 컴포넌트로 이동 (재귀적으로 goToPreviousComponent 호출)
     */
    async navigateToPreviousComponent(mc, targetCompIndex, targetQIdx, targetType) {
        // 현재 컴포넌트에서 타겟까지 뒤로 이동
        while (mc.currentComponentIndex > targetCompIndex) {
            // 현재 컴포넌트의 답변을 먼저 저장 (submit 처리)
            const currentInstance = this.getCurrentComponentInstance(
                mc.config.components[mc.currentComponentIndex].type
            );
            
            if (currentInstance && typeof currentInstance.submit === 'function') {
                // submit을 호출하면 onComponentComplete가 트리거되므로, 
                // 대신 답변만 수집하여 저장
                const answers = this.collectCurrentAnswers(currentInstance, mc.config.components[mc.currentComponentIndex]);
                if (answers && answers.length > 0) {
                    mc.allAnswers.push(...answers);
                    mc.componentResults.push({
                        componentType: mc.config.components[mc.currentComponentIndex].type,
                        setId: mc.config.components[mc.currentComponentIndex].setId,
                        answers: answers
                    });
                }
            }

            mc.goToPreviousComponent();
            
            // 비동기 로드 대기
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 타겟 컴포넌트 내에서 특정 문제로 이동
        const instance = this.getCurrentComponentInstance(targetType);
        if (instance && typeof instance.loadQuestion === 'function' && targetQIdx > 0) {
            instance.loadQuestion(targetQIdx);
            mc.updateCurrentQuestionInComponent(targetQIdx);
        }

        this.close();
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
