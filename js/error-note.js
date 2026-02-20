/**
 * ================================================
 * error-note.js
 * 오답노트 플로팅 UI 컴포넌트
 * ================================================
 * 
 * 기능:
 * 1. 해설 화면에서 플로팅 텍스트 입력 패널 표시
 * 2. 실시간 단어 수 카운트
 * 3. 20단어 미만 제출 시 경고 팝업
 * 4. Supabase tr_study_records에 오답노트 저장
 * 
 * 적용 대상: R/L/W/S 해설 화면 (보카 미적용)
 */

var ErrorNote = {
    _isOpen: false,
    _isSubmitted: false,
    _currentStudyRecordId: null,
    _sectionType: null,
    _moduleNumber: null,
    _panelEl: null,
    _overlayEl: null,

    // ========================================
    // 단어 수 카운트
    // ========================================
    countWords(text) {
        if (!text || !text.trim()) return 0;
        // 한글+영어 혼합 지원: 공백 기준 분리
        var words = text.trim().split(/\s+/);
        return words.length;
    },

    // ========================================
    // 플로팅 패널 생성
    // ========================================
    createPanel() {
        // 이미 존재하면 제거
        this.removePanel();

        // 오버레이 (팝업용)
        var overlay = document.createElement('div');
        overlay.id = 'errorNoteOverlay';
        overlay.className = 'error-note-overlay';
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
        this._overlayEl = overlay;

        // 플로팅 패널
        var panel = document.createElement('div');
        panel.id = 'errorNotePanel';
        panel.className = 'error-note-panel';
        panel.innerHTML = 
            '<div class="error-note-header" id="errorNoteHeader">' +
                '<div class="error-note-title">' +
                    '<i class="fas fa-edit"></i> 오답노트' +
                '</div>' +
                '<div class="error-note-toggle" id="errorNoteToggle">' +
                    '<i class="fas fa-chevron-up"></i>' +
                '</div>' +
            '</div>' +
            '<div class="error-note-body" id="errorNoteBody">' +
                '<div class="error-note-guide">' +
                    '해설을 참고하여 오답노트를 작성해주세요.' +
                '</div>' +
                '<textarea id="errorNoteTextarea" class="error-note-textarea" ' +
                    'placeholder="틀린 문제에 대한 오답 분석, 핵심 개념 정리, 다음에 주의할 점 등을 자유롭게 작성해주세요..."></textarea>' +
                '<div class="error-note-footer">' +
                    '<div class="error-note-notice">' +
                        '<i class="fas fa-info-circle"></i> 20단어 이상 작성 시 인정됩니다' +
                    '</div>' +
                    '<button id="errorNoteSubmitBtn" class="error-note-submit-btn" onclick="ErrorNote.handleSubmit()">' +
                        '<i class="fas fa-paper-plane"></i> 제출' +
                    '</button>' +
                '</div>' +
                '<div class="error-note-resize-handle" id="errorNoteResizeHandle">' +
                    '<div class="resize-bar"></div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(panel);
        this._panelEl = panel;

        // 이벤트 연결
        var textarea = document.getElementById('errorNoteTextarea');

        // 드래그로 패널 크기 조절
        var resizeHandle = document.getElementById('errorNoteResizeHandle');
        if (resizeHandle && panel) {
            var startY = 0;
            var startHeight = 0;

            resizeHandle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                startY = e.clientY;
                startHeight = panel.offsetHeight;
                
                function onMouseMove(e) {
                    var diff = startY - e.clientY;
                    var newHeight = Math.max(120, Math.min(window.innerHeight - 40, startHeight + diff));
                    panel.style.height = newHeight + 'px';
                    // textarea 높이도 같이 늘리기
                    var ta = document.getElementById('errorNoteTextarea');
                    if (ta) {
                        var taHeight = newHeight - 180;
                        if (taHeight > 60) ta.style.height = taHeight + 'px';
                    }
                }
                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            // 터치 지원
            resizeHandle.addEventListener('touchstart', function(e) {
                var touch = e.touches[0];
                startY = touch.clientY;
                startHeight = panel.offsetHeight;
                
                function onTouchMove(e) {
                    var touch = e.touches[0];
                    var diff = startY - touch.clientY;
                    var newHeight = Math.max(120, Math.min(window.innerHeight - 40, startHeight + diff));
                    panel.style.height = newHeight + 'px';
                    var ta = document.getElementById('errorNoteTextarea');
                    if (ta) {
                        var taHeight = newHeight - 180;
                        if (taHeight > 60) ta.style.height = taHeight + 'px';
                    }
                }
                function onTouchEnd() {
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                }
                document.addEventListener('touchmove', onTouchMove);
                document.addEventListener('touchend', onTouchEnd);
            }, { passive: true });
        }

        var toggle = document.getElementById('errorNoteToggle');
        if (toggle) {
            toggle.addEventListener('click', function() {
                ErrorNote.togglePanel();
            });
        }

        var header = document.getElementById('errorNoteHeader');
        if (header) {
            header.addEventListener('click', function(e) {
                // 토글 버튼 영역이 아닌 헤더 클릭 시에도 토글
                if (e.target.id !== 'errorNoteToggle' && !e.target.closest('#errorNoteToggle')) {
                    ErrorNote.togglePanel();
                }
            });
        }
    },

    // ========================================
    // 패널 제거
    // ========================================
    removePanel() {
        var panel = document.getElementById('errorNotePanel');
        if (panel) panel.remove();
        var overlay = document.getElementById('errorNoteOverlay');
        if (overlay) overlay.remove();
        var popup = document.getElementById('errorNoteWarningPopup');
        if (popup) popup.remove();
        this._panelEl = null;
        this._overlayEl = null;
    },

    // ========================================
    // 패널 열기/닫기 (접기)
    // ========================================
    togglePanel() {
        var body = document.getElementById('errorNoteBody');
        var toggle = document.getElementById('errorNoteToggle');
        var panel = document.getElementById('errorNotePanel');
        if (!body || !toggle) return;

        this._isOpen = !this._isOpen;

        if (this._isOpen) {
            body.style.display = 'block';
            toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
            if (panel) panel.classList.add('error-note-panel-open');
        } else {
            body.style.display = 'none';
            toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
            if (panel) panel.classList.remove('error-note-panel-open');
        }
    },

    // ========================================
    // 단어 수 업데이트
    // ========================================
    updateWordCount() {
        var textarea = document.getElementById('errorNoteTextarea');
        var countEl = document.getElementById('errorNoteWordCount');
        if (!textarea || !countEl) return;

        var count = this.countWords(textarea.value);
        countEl.textContent = count;

        // 20 이상이면 초록색, 미만이면 빨간색
        var countWrapper = countEl.parentElement;
        if (countWrapper) {
            if (count >= 20) {
                countWrapper.classList.add('word-count-ok');
                countWrapper.classList.remove('word-count-low');
            } else {
                countWrapper.classList.add('word-count-low');
                countWrapper.classList.remove('word-count-ok');
            }
        }
    },

    // ========================================
    // 제출 처리
    // ========================================
    handleSubmit() {
        if (this._isSubmitted) {
            console.log('📝 [ErrorNote] 이미 제출됨');
            return;
        }

        var textarea = document.getElementById('errorNoteTextarea');
        if (!textarea) return;

        var text = textarea.value.trim();
        var wordCount = this.countWords(text);

        if (wordCount < 20) {
            // 20단어 미만 → 경고 팝업
            this.showWarningPopup(wordCount);
        } else {
            // 정상 제출
            this.submitNote(text, wordCount, false);
        }
    },

    // ========================================
    // 경고 팝업 (20단어 미만)
    // ========================================
    showWarningPopup(wordCount) {
        // 기존 팝업 제거
        var existing = document.getElementById('errorNoteWarningPopup');
        if (existing) existing.remove();

        var overlay = this._overlayEl;
        if (overlay) overlay.style.display = 'block';

        var popup = document.createElement('div');
        popup.id = 'errorNoteWarningPopup';
        popup.className = 'error-note-warning-popup';
        popup.innerHTML = 
            '<div class="error-note-warning-content">' +
                '<div class="error-note-warning-icon">' +
                    '<i class="fas fa-exclamation-triangle"></i>' +
                '</div>' +
                '<h3>오답노트 단어 수 부족</h3>' +
                '<p>현재 <strong>' + wordCount + '단어</strong>를 작성했습니다.<br>' +
                '기준 미달 시 해설 단계가 <strong>미인정</strong> 처리됩니다.</p>' +
                '<div class="error-note-warning-buttons">' +
                    '<button class="error-note-btn-edit" onclick="ErrorNote.closeWarningPopup()">' +
                        '<i class="fas fa-pencil-alt"></i> 수정하기' +
                    '</button>' +
                    '<button class="error-note-btn-force" onclick="ErrorNote.forceSubmit()">' +
                        '그래도 제출' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(popup);
    },

    // ========================================
    // 경고 팝업 닫기
    // ========================================
    closeWarningPopup() {
        var popup = document.getElementById('errorNoteWarningPopup');
        if (popup) popup.remove();
        var overlay = this._overlayEl;
        if (overlay) overlay.style.display = 'none';

        // 텍스트 영역에 포커스
        var textarea = document.getElementById('errorNoteTextarea');
        if (textarea) textarea.focus();
    },

    // ========================================
    // 강제 제출 (20단어 미만 — 해설 단계 0%)
    // ========================================
    forceSubmit() {
        this.closeWarningPopup();
        var textarea = document.getElementById('errorNoteTextarea');
        var text = textarea ? textarea.value.trim() : '';
        var wordCount = this.countWords(text);
        this.submitNote(text, wordCount, true);
    },

    // ========================================
    // 실제 제출 (Supabase 저장)
    // ========================================
    async submitNote(text, wordCount, isFraud) {
        console.log('📝 [ErrorNote] 제출:', { wordCount: wordCount, isFraud: isFraud });

        this._isSubmitted = true;

        // UI 업데이트 — 제출 완료 상태
        var submitBtn = document.getElementById('errorNoteSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> 제출 완료';
            submitBtn.classList.add('error-note-submitted');
        }

        var textarea = document.getElementById('errorNoteTextarea');
        if (textarea) {
            textarea.readOnly = true;
            textarea.classList.add('error-note-readonly');
        }

        // Supabase에 저장 (tr_study_records 업데이트)
        try {
            var user = window.currentUser;
            if (!user || !user.id) {
                console.warn('📝 [ErrorNote] 사용자 정보 없음, 저장 생략');
                return;
            }

            // 현재 진행 중인 과제의 study_record를 찾아서 업데이트
            if (typeof supabaseSelect === 'function') {
                var records = await supabaseSelect(
                    'tr_study_records',
                    'id',
                    'user_id=eq.' + user.id + 
                    '&task_type=eq.' + this._sectionType + 
                    '&module_number=eq.' + this._moduleNumber +
                    '&order=completed_at.desc&limit=1'
                );

                if (records && records.length > 0) {
                    var recordId = records[0].id;
                    await supabaseUpdate('tr_study_records', recordId, {
                        error_note_text: text,
                        error_note_word_count: wordCount
                    });
                    console.log('📝 [ErrorNote] Supabase 저장 완료, record:', recordId);
                } else {
                    console.warn('📝 [ErrorNote] study_record를 찾을 수 없음');
                }
            }
        } catch (e) {
            console.error('📝 [ErrorNote] 저장 실패:', e);
        }

        // 커스텀 이벤트 발생 (auth-monitor 등에서 감지 가능)
        var event = new CustomEvent('errorNoteSubmitted', {
            detail: {
                text: text,
                wordCount: wordCount,
                isFraud: isFraud,
                sectionType: this._sectionType,
                moduleNumber: this._moduleNumber
            }
        });
        window.dispatchEvent(event);

        console.log('📝 [ErrorNote] 제출 이벤트 발생:', isFraud ? '미인정(fraud)' : '정상');
    },

    // ========================================
    // 해설 화면 진입 시 호출 (외부에서 사용)
    // ========================================
    show(sectionType, moduleNumber) {
        console.log('📝 [ErrorNote] 표시:', sectionType, 'Module', moduleNumber);
        
        this._sectionType = sectionType;
        this._moduleNumber = moduleNumber;
        this._isSubmitted = false;
        this._isOpen = false;

        this.createPanel();

        // 접힌 상태에서 시작 → 첫 클릭 시 펼침
        var body = document.getElementById('errorNoteBody');
        if (body) body.style.display = 'none';
    },

    // ========================================
    // 해설 화면 종료 시 호출 (정리)
    // ========================================
    hide() {
        console.log('📝 [ErrorNote] 숨김');
        this.removePanel();
        this._isOpen = false;
        this._isSubmitted = false;
        this._sectionType = null;
        this._moduleNumber = null;
    },

    // ========================================
    // 제출 여부 확인
    // ========================================
    isSubmitted() {
        return this._isSubmitted;
    },

    // ========================================
    // 제출된 단어 수 확인
    // ========================================
    getSubmittedWordCount() {
        if (!this._isSubmitted) return 0;
        var textarea = document.getElementById('errorNoteTextarea');
        return textarea ? this.countWords(textarea.value) : 0;
    }
};

console.log('✅ error-note.js 로드 완료');
