/**
 * ================================================
 * InterviewComponent.js v=001
 * 인터뷰 컴포넌트
 * ================================================
 * 
 * 책임:
 * - 데이터 처리 (7): Sheet 로드/파싱/Demo 데이터/Highlights 파싱
 * - 인트로 화면 (3): "Interview" 나레이션
 * - 상황 설명 화면 (5): 상황 설명 + 이미지 + 오디오
 * - 질문 화면 & 비디오 재생 (10): 질문 비디오 + Nodding 비디오
 * - 녹음 기능 (7): 45초 고정, 원형 프로그레스바
 * - 로딩 화면 (2): 문제 전환 시 로딩 표시
 * - 오디오 재생 (2): HTML5 Audio + 볼륨 적용
 * - 볼륨 조절 (5): 슬라이더 (0~100%, 최대 143% 증폭)
 * - 내부 상태 변수 (5): currentSet/Question/timer/video/audio
 * - 완료 & Cleanup (2): 모든 질문 완료 처리
 * - 채점 화면 (15): 하이라이트 클릭 → 피드백 표시
 * - 유틸리티 함수 (1): formatInterviewTime
 * 
 * 총 57개 요소
 */

class InterviewComponent {
    constructor() {
        // ============================================
        // 1. 데이터 처리 (7개)
        // ============================================
        
        // Google Sheet 설정
        this.INTERVIEW_SHEET_CONFIG = {
            spreadsheetId: '1wuZ8riC-foWRMQosuCgyZIE9ZdsElZIuhPqFMGhuUQM',
            sheetGid: '928002984'
        };
        
        // 데이터 저장
        this.speakingInterviewData = null;
        
        // ============================================
        // 2. 녹음 기능 (7개 중 1개)
        // ============================================
        
        // 녹음 시간 (45초 고정)
        this.INTERVIEW_RESPONSE_TIME = 45;
        
        // ============================================
        // 3. 볼륨 조절 (5개 중 1개)
        // ============================================
        
        // 볼륨 레벨 (0.0~1.43, 기본 1.0 = 100%)
        this.interviewVolumeLevel = 1.0;
        
        // ============================================
        // 4. 내부 상태 변수 (5개)
        // ============================================
        
        // 현재 세트/질문 번호
        this.currentInterviewSet = 0;
        this.currentInterviewQuestion = 0;
        
        // 타이머 & 미디어
        this.interviewTimer = null;
        this.currentVideo = null;
        this.currentInterviewAudio = null;
        
        // 채점 화면용
        this.currentInterviewResultData = null;
        this.currentPlayingAudio = null;
        this.currentPlayingIndex = null;
    }
    
    // ============================================
    // 데이터 처리 함수 (7개)
    // ============================================
    
    /**
     * 데이터 로드
     */
    async loadInterviewData() {
        console.log('📥 [Interview] 데이터 로드 시작...');
        
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.INTERVIEW_SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.INTERVIEW_SHEET_CONFIG.sheetGid}`;
        
        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('CSV 로드 실패');
            
            const csvText = await response.text();
            this.speakingInterviewData = this.parseInterviewCSV(csvText);
            
            console.log('✅ [Interview] 데이터 로드 성공:', this.speakingInterviewData);
            return this.speakingInterviewData;
        } catch (error) {
            console.error('❌ [Interview] 데이터 로드 실패:', error);
            console.log('📦 Demo 데이터 사용');
            this.speakingInterviewData = this.getInterviewDemoData();
            return this.speakingInterviewData;
        }
    }
    
    /**
     * CSV 파싱
     */
    parseInterviewCSV(csvText) {
        console.log('🔄 [Interview] CSV 파싱 시작...');
        
        const lines = csvText.split('\n');
        const sets = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = this.parseCSVLine(line);
            if (columns.length < 34) continue;
            
            // 각 비디오별 데이터 파싱 (4개)
            const videos = [];
            for (let v = 0; v < 4; v++) {
                const baseIdx = 5 + (v * 7);
                videos.push({
                    video: columns[baseIdx].trim(),
                    script: columns[baseIdx + 1].trim(),
                    translation: columns[baseIdx + 2].trim(),
                    modelAnswer: columns[baseIdx + 3].trim(),
                    modelAnswerTranslation: columns[baseIdx + 4].trim(),
                    modelAnswerAudio: columns[baseIdx + 5].trim(),
                    highlights: this.parseHighlights(columns[baseIdx + 6] ? columns[baseIdx + 6].trim() : '{}')
                });
            }
            
            const set = {
                id: columns[0].trim(),
                contextText: columns[1].trim(),
                contextTranslation: columns[2].trim(),
                contextAudio: columns[3].trim(),
                contextImage: columns[4].trim(),
                noddingVideo: columns[33].trim(),
                videos: videos
            };
            
            sets.push(set);
            console.log('[Interview] 세트 추가:', set.id);
        }
        
        console.log(`✅ [CSV 파싱] 총 세트 개수: ${sets.length}`);
        
        return {
            type: 'speaking_interview',
            sets: sets
        };
    }
    
    /**
     * CSV 한 줄 파싱 (쉼표+따옴표 처리)
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
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
    
    /**
     * Highlights JSON 파싱 (2가지 형식 지원)
     */
    parseHighlights(highlightsStr) {
        if (!highlightsStr || highlightsStr.trim() === '') {
            console.warn('⚠️ highlights 빈 문자열');
            return {};
        }
        
        try {
            let cleanStr = highlightsStr.trim();
            
            // 방법 1: JSON 형식 시도
            if (cleanStr.startsWith('{') && cleanStr.endsWith('}')) {
                // Google Sheets 이스케이프 해제
                if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
                    cleanStr = cleanStr.slice(1, -1).replace(/""/g, '"');
                }
                
                try {
                    const parsed = JSON.parse(cleanStr);
                    console.log('✅ highlights 파싱 성공 (JSON):', Object.keys(parsed).length, '개');
                    return parsed;
                } catch (e) {
                    console.warn('⚠️ JSON 파싱 실패, :: 구분자 시도');
                }
            }
            
            // 방법 2: :: 구분자 파싱
            const highlights = {};
            const entries = cleanStr.split('||').map(s => s.trim()).filter(s => s);
            
            for (const entry of entries) {
                const parts = entry.split('::').map(s => s.trim());
                if (parts.length === 3) {
                    const [key, title, description] = parts;
                    highlights[key] = {
                        title: title,
                        description: description
                    };
                }
            }
            
            if (Object.keys(highlights).length > 0) {
                console.log('✅ highlights 파싱 성공 (:: 구분자):', Object.keys(highlights).length, '개');
                return highlights;
            }
            
            console.warn('⚠️ highlights 파싱 실패: 알 수 없는 형식');
            return {};
            
        } catch (e) {
            console.error('❌ highlights 파싱 실패:', e);
            console.error('❌ 원본 데이터:', highlightsStr);
            return {};
        }
    }
    
    /**
     * Demo 데이터 (로드 실패 시 대체)
     */
    getInterviewDemoData() {
        return {
            type: 'speaking_interview',
            sets: [
                {
                    id: 'speaking_interview_1',
                    contextText: 'You have volunteered for a research study about commuting habits. You will have a short online interview with a researcher. The researcher will ask you some questions.',
                    contextTranslation: '당신은 통근 습관에 관한 연구에 자원했습니다. 연구원과 짧은 온라인 인터뷰를 하게 됩니다.',
                    contextAudio: 'PLACEHOLDER',
                    contextImage: 'https://via.placeholder.com/600x400/e3f2fd/1976d2?text=Researcher',
                    noddingVideo: 'https://via.placeholder.com/600x400/4caf50/ffffff?text=Nodding',
                    videos: [
                        {
                            video: 'PLACEHOLDER',
                            script: 'How do you usually get to school or work?',
                            translation: '보통 어떻게 학교나 직장에 가나요?',
                            modelAnswer: 'Um... I usually take the bus.\nIt takes about 30 minutes.\nSometimes I drive if I\'m late.',
                            modelAnswerTranslation: '음... 저는 보통 버스를 타요.\n약 30분 걸려요.\n가끔 늦으면 운전해요.',
                            modelAnswerAudio: 'PLACEHOLDER',
                            highlights: {}
                        },
                        {
                            video: 'PLACEHOLDER',
                            script: 'What do you like about your commute?',
                            translation: '통근에서 좋은 점은 무엇인가요?',
                            modelAnswer: 'Well, I like that I can read.\nOr I listen to music.\nIt\'s relaxing time for me.',
                            modelAnswerTranslation: '음, 책을 읽을 수 있어서 좋아요.\n또는 음악을 들어요.\n저에게는 휴식 시간이에요.',
                            modelAnswerAudio: 'PLACEHOLDER',
                            highlights: {}
                        },
                        {
                            video: 'PLACEHOLDER',
                            script: 'Is there anything you would change?',
                            translation: '바꾸고 싶은 점이 있나요?',
                            modelAnswer: 'I wish it was faster.\nThe bus is often crowded.\nMaybe I should bike instead.',
                            modelAnswerTranslation: '더 빨랐으면 좋겠어요.\n버스가 자주 붐벼요.\n자전거를 타야 할 것 같아요.',
                            modelAnswerAudio: 'PLACEHOLDER',
                            highlights: {}
                        },
                        {
                            video: 'PLACEHOLDER',
                            script: 'Thank you for your time.',
                            translation: '시간 내주셔서 감사합니다.',
                            modelAnswer: 'You\'re welcome.\nThank you too.\nHave a great day!',
                            modelAnswerTranslation: '천만에요.\n저도 감사해요.\n좋은 하루 보내세요!',
                            modelAnswerAudio: 'PLACEHOLDER',
                            highlights: {}
                        }
                    ]
                }
            ]
        };
    }
    
    // ============================================
    // 인트로 화면 함수 (3개)
    // ============================================
    
    /**
     * 인트로 화면 표시
     */
    showInterviewIntroScreen() {
        console.log('📺 인터뷰 인트로 화면 표시');
        
        document.getElementById('interviewIntroScreen').style.display = 'flex';
        document.getElementById('interviewContextScreen').style.display = 'none';
        document.getElementById('interviewQuestionScreen').style.display = 'none';
        
        // 1초 대기 후 인트로 나레이션 재생
        setTimeout(() => {
            const introNarration = 'https://eontoefl.github.io/toefl-audio/speaking/interview/narration/interview_narration.mp3';
            
            this.playInterviewAudio(introNarration, () => {
                console.log('✅ 인트로 나레이션 종료');
                
                // 2초 대기 후 상황 화면으로 이동
                setTimeout(() => {
                    document.getElementById('interviewIntroScreen').style.display = 'none';
                    this.startInterviewSequence(0);
                }, 2000);
            });
        }, 1000);
    }
    
    // ============================================
    // 상황 설명 화면 함수 (5개)
    // ============================================
    
    /**
     * 인터뷰 시퀀스 시작
     */
    startInterviewSequence(setIndex) {
        const set = this.speakingInterviewData.sets[setIndex];
        
        if (!set) {
            console.error('세트를 찾을 수 없습니다:', setIndex);
            return;
        }
        
        this.currentInterviewSet = setIndex;
        this.currentInterviewQuestion = 0;
        
        // 첫 번째 화면 표시
        this.showInterviewContextScreen(set);
    }
    
    /**
     * 상황 설명 화면 표시
     */
    showInterviewContextScreen(set) {
        console.log('📺 상황 화면 표시');
        
        document.getElementById('interviewContextScreen').style.display = 'flex';
        document.getElementById('interviewQuestionScreen').style.display = 'none';
        
        // contextText 표시
        const contextTextEl = document.getElementById('interviewContextText');
        if (contextTextEl) {
            contextTextEl.textContent = set.contextText;
        }
        
        // contextImage 표시
        const contextImageEl = document.getElementById('interviewContextImage');
        if (contextImageEl && set.contextImage && set.contextImage !== 'PLACEHOLDER') {
            contextImageEl.src = set.contextImage;
            contextImageEl.style.display = 'block';
        }
        
        // 1초 대기 후 contextAudio 재생
        console.log('⏳ 화면 표시 후 1초 대기...');
        setTimeout(() => {
            if (set.contextAudio && set.contextAudio !== 'PLACEHOLDER') {
                console.log('🎵 시나리오 오디오 재생');
                this.playInterviewAudio(set.contextAudio, () => {
                    console.log('✅ 시나리오 오디오 종료 → 문제 1로 이동');
                    // 오디오 종료 후 바로 문제 1로 이동
                    this.showInterviewQuestionScreen(set);
                });
            } else {
                // 오디오 없으면 2초 후 문제 1로 이동
                setTimeout(() => {
                    this.showInterviewQuestionScreen(set);
                }, 2000);
            }
        }, 1000);
    }
    
    // ============================================
    // 질문 화면 & 비디오 재생 함수 (10개)
    // ============================================
    
    /**
     * 질문 화면 표시
     */
    showInterviewQuestionScreen(set) {
        console.log('📺 질문 화면 표시');
        
        document.getElementById('interviewContextScreen').style.display = 'none';
        document.getElementById('interviewQuestionScreen').style.display = 'block';
        
        // 첫 번째 질문 재생
        this.playInterviewQuestion(set, 0);
    }
    
    /**
     * 질문 재생
     */
    playInterviewQuestion(set, questionIndex) {
        if (questionIndex >= set.videos.length) {
            console.log('✅ 모든 질문 완료 → 섹션 종료');
            this.completeSpeakingInterview();
            return;
        }
        
        this.currentInterviewQuestion = questionIndex;
        const videoData = set.videos[questionIndex];
        
        console.log(`🎤 질문 ${questionIndex + 1}/4 준비`);
        
        // Progress 업데이트
        const totalQuestions = set.videos.length;
        document.getElementById('interviewProgress').textContent = `Question ${questionIndex + 1} of ${totalQuestions}`;
        
        // 녹음 UI 숨김
        document.getElementById('interviewRecordingUI').style.display = 'none';
        document.getElementById('interviewSavingPopup').style.display = 'none';
        
        // 1초 대기 후 interviewer 영상 재생
        console.log('⏳ 화면 표시 후 1초 대기...');
        setTimeout(() => {
            console.log(`🎵 질문 ${questionIndex + 1}/4 영상 재생 시작`);
            this.playInterviewVideo(videoData.video, () => {
                console.log(`✅ 질문 ${questionIndex + 1} 영상 종료 → 0.7초 대기`);
                
                // 0.7초 대기 + base image 표시
                setTimeout(() => {
                    console.log('🎬 0.7초 대기 완료 → nodding video 재생 + 녹음 시작');
                    // Nodding video 재생 + 녹음
                    this.startInterviewRecording(set, questionIndex);
                }, 700);
            });
        }, 1000);
    }
    
    /**
     * 비디오 재생 (HTML5 Video)
     */
    playInterviewVideo(videoUrl, onEnded) {
        const videoElement = document.getElementById('interviewVideo');
        const videoPlaceholder = document.getElementById('interviewVideoPlaceholder');
        
        // PLACEHOLDER이면 플레이스홀더 표시
        if (videoUrl === 'PLACEHOLDER' || !videoUrl || videoUrl.trim() === '') {
            console.log('⏭️ 영상 없음 (PLACEHOLDER) → 플레이스홀더 표시');
            if (videoPlaceholder) videoPlaceholder.style.display = 'block';
            if (videoElement) videoElement.style.display = 'none';
            
            if (onEnded) {
                setTimeout(() => {
                    if (videoPlaceholder) videoPlaceholder.style.display = 'none';
                    onEnded();
                }, 2000); // 2초 표시
            }
            return;
        }
        
        console.log('🎥 비디오 재생 시작:', videoUrl);
        
        if (videoPlaceholder) videoPlaceholder.style.display = 'none';
        videoElement.src = videoUrl;
        videoElement.style.display = 'block';
        videoElement.controls = false; // 컨트롤 제거
        videoElement.removeAttribute('controls'); // 명시적으로 제거
        videoElement.volume = Math.min(this.interviewVolumeLevel, 1.0);
        console.log(`🎵 비디오 볼륨 설정: ${Math.round(this.interviewVolumeLevel * 100)}%`);
        
        videoElement.addEventListener('ended', () => {
            console.log('🔊 영상 재생 완료:', videoUrl);
            if (onEnded) onEnded();
        }, { once: true });
        
        videoElement.addEventListener('error', (e) => {
            console.error('❌ 영상 로드 실패:', videoUrl, e);
            if (onEnded) {
                setTimeout(onEnded, 1000);
            }
        }, { once: true });
        
        videoElement.play().then(() => {
            console.log('✅ 비디오 재생 시작됨');
        }).catch(err => {
            console.error('❌ 영상 재생 실패:', err);
            if (onEnded) {
                setTimeout(onEnded, 1000);
            }
        });
    }
    
    // ============================================
    // 녹음 기능 함수 (7개)
    // ============================================
    
    /**
     * 녹음 시작
     */
    startInterviewRecording(set, questionIndex) {
        console.log(`🔴 녹음 시작: ${this.INTERVIEW_RESPONSE_TIME}초`);
        
        // Nodding video 재생 (45초 동안 반복)
        const noddingVideoElement = document.getElementById('interviewVideo');
        if (noddingVideoElement && set.noddingVideo && set.noddingVideo !== 'PLACEHOLDER') {
            console.log('🎥 Nodding video 재생 (반복 모드)');
            
            noddingVideoElement.src = set.noddingVideo;
            noddingVideoElement.loop = true; // 반복 재생
            noddingVideoElement.controls = false;
            noddingVideoElement.removeAttribute('controls');
            noddingVideoElement.volume = Math.min(this.interviewVolumeLevel, 1.0);
            console.log(`🎵 Nodding video 볼륨 설정: ${Math.round(this.interviewVolumeLevel * 100)}%`);
            
            noddingVideoElement.load();
            noddingVideoElement.play().then(() => {
                console.log('✅ Nodding video 재생 시작됨');
            }).catch(err => console.error('❌ Nodding video 재생 실패:', err));
        }
        
        // 녹음 UI 표시
        const recordingUI = document.getElementById('interviewRecordingUI');
        if (recordingUI) {
            recordingUI.style.display = 'flex';
            console.log('✅ 녹음 UI 표시됨');
        }
        
        // 카운트다운 시작
        let timeLeft = this.INTERVIEW_RESPONSE_TIME;
        const totalTime = this.INTERVIEW_RESPONSE_TIME;
        const timerElement = document.getElementById('interviewTimer');
        const progressCircle = document.getElementById('interviewProgressCircle');
        
        // 원의 둘레 계산 (반지름 20px)
        const radius = 20;
        const circumference = 2 * Math.PI * radius;
        
        if (timerElement) {
            timerElement.textContent = this.formatInterviewTime(timeLeft);
        }
        
        // 프로그레스 서클 초기화 (100% 채워진 상태에서 시작)
        if (progressCircle) {
            progressCircle.style.strokeDasharray = circumference;
            progressCircle.style.strokeDashoffset = circumference;
        }
        
        this.interviewTimer = setInterval(() => {
            timeLeft--;
            
            // 타이머 업데이트
            if (timerElement) {
                timerElement.textContent = this.formatInterviewTime(timeLeft);
            }
            
            // 프로그레스 서클 업데이트 (경과 시간에 따라 원이 채워짐)
            if (progressCircle) {
                const elapsed = totalTime - timeLeft;
                const percentage = elapsed / totalTime;
                const offset = circumference - (percentage * circumference);
                progressCircle.style.strokeDashoffset = offset;
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.interviewTimer);
                this.stopInterviewRecording(set, questionIndex);
            }
        }, 1000);
    }
    
    /**
     * 녹음 중지
     */
    stopInterviewRecording(set, questionIndex) {
        console.log('⏹️ 녹음 중지');
        
        // Nodding video 중지
        const noddingVideoElement = document.getElementById('interviewVideo');
        if (noddingVideoElement) {
            noddingVideoElement.pause();
            noddingVideoElement.loop = false; // 반복 모드 해제
            console.log('🛑 Nodding video 중지');
        }
        
        // 녹음 UI 숨김
        const recordingUI = document.getElementById('interviewRecordingUI');
        if (recordingUI) {
            recordingUI.style.display = 'none';
        }
        
        // 저장 팝업 표시
        const savingPopup = document.getElementById('interviewSavingPopup');
        if (savingPopup) {
            savingPopup.style.display = 'flex';
            console.log('✅ 저장 팝업 표시됨');
        }
        
        // 5초 후 로딩 화면 표시
        setTimeout(() => {
            if (savingPopup) {
                savingPopup.style.display = 'none';
            }
            
            // 로딩 화면 표시
            this.showInterviewLoadingScreen();
            
            // 1초 후 다음 질문
            setTimeout(() => {
                this.hideInterviewLoadingScreen();
                this.playInterviewQuestion(set, questionIndex + 1);
            }, 1000);
        }, 5000);
    }
    
    // ============================================
    // 로딩 화면 함수 (2개)
    // ============================================
    
    /**
     * 로딩 화면 표시
     */
    showInterviewLoadingScreen() {
        console.log('🔄 로딩 화면 표시');
        
        // 질문 화면 숨기기
        document.getElementById('interviewQuestionScreen').style.display = 'none';
        
        // 로딩 화면 표시
        const loadingScreen = document.getElementById('interviewLoadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }
    
    /**
     * 로딩 화면 숨김
     */
    hideInterviewLoadingScreen() {
        console.log('✅ 로딩 화면 숨김');
        
        // 로딩 화면 숨기기
        const loadingScreen = document.getElementById('interviewLoadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // 질문 화면 표시
        document.getElementById('interviewQuestionScreen').style.display = 'block';
    }
    
    // ============================================
    // 오디오 재생 함수 (2개)
    // ============================================
    
    /**
     * 오디오 재생 (HTML5 Audio + 볼륨 적용)
     */
    playInterviewAudio(audioUrl, onEnded) {
        // 기존 오디오 중지
        if (this.currentInterviewAudio) {
            this.currentInterviewAudio.pause();
            this.currentInterviewAudio.currentTime = 0;
            this.currentInterviewAudio = null;
            console.log('🛑 기존 오디오 중지');
        }
        
        if (audioUrl === 'PLACEHOLDER' || !audioUrl || audioUrl.trim() === '') {
            console.log('⏭️ 오디오 없음 (PLACEHOLDER) → 즉시 다음으로');
            if (onEnded) {
                setTimeout(onEnded, 500);
            }
            return;
        }
        
        console.log('🎵 오디오 재생 시작:', audioUrl);
        
        // HTML Audio Element 생성
        this.currentInterviewAudio = new Audio(audioUrl);
        
        // 볼륨 설정
        this.currentInterviewAudio.volume = Math.min(this.interviewVolumeLevel, 1.0);
        console.log(`🎵 오디오 볼륨 설정: ${Math.round(this.interviewVolumeLevel * 100)}%`);
        
        this.currentInterviewAudio.addEventListener('ended', () => {
            console.log('🔊 오디오 재생 완료:', audioUrl);
            this.currentInterviewAudio = null;
            if (onEnded) onEnded();
        }, { once: true });
        
        this.currentInterviewAudio.addEventListener('error', (e) => {
            console.error('❌ 오디오 로드 실패:', audioUrl, e);
            this.currentInterviewAudio = null;
            if (onEnded) {
                setTimeout(onEnded, 1000);
            }
        }, { once: true });
        
        this.currentInterviewAudio.play().then(() => {
            console.log('✅ 오디오 재생 시작됨');
        }).catch(err => {
            console.error('❌ 오디오 재생 실패:', err);
            this.currentInterviewAudio = null;
            if (onEnded) {
                setTimeout(onEnded, 1000);
            }
        });
    }
    
    // ============================================
    // 볼륨 조절 함수 (5개)
    // ============================================
    
    /**
     * 볼륨 슬라이더 토글
     */
    toggleVolumeSlider() {
        const container = document.getElementById('volumeSliderContainer');
        if (container.style.display === 'none' || container.style.display === '') {
            container.style.display = 'block';
            console.log('🎵 볼륨 슬라이더 열림');
        } else {
            container.style.display = 'none';
            console.log('🎵 볼륨 슬라이더 닫힘');
        }
    }
    
    /**
     * 볼륨 업데이트
     */
    updateInterviewVolume(value) {
        // 슬라이더 값 0~100을 실제 볼륨 0.0~1.43으로 변환
        // 슬라이더 0 → 볼륨 0.0, 슬라이더 70 → 볼륨 1.0, 슬라이더 100 → 볼륨 1.43
        const normalizedValue = value / 70; // 70 = 100% 볼륨
        this.interviewVolumeLevel = normalizedValue;
        
        console.log(`🎵 볼륨 변경: 슬라이더 ${value}% (실제 볼륨: ${this.interviewVolumeLevel.toFixed(2)})`);
        
        // 퍼센트 표시는 슬라이더 값 그대로
        const percentageDisplay = document.getElementById('volumePercentage');
        if (percentageDisplay) {
            percentageDisplay.textContent = `${value}%`;
        }
        
        // 아이콘 업데이트
        const volumeIcon = document.getElementById('volumeIcon');
        if (volumeIcon) {
            if (value == 0) {
                volumeIcon.className = 'fas fa-volume-mute';
            } else if (value < 50) {
                volumeIcon.className = 'fas fa-volume-down';
            } else {
                volumeIcon.className = 'fas fa-volume-up';
            }
        }
        
        // 현재 재생 중인 오디오에 볼륨 적용
        if (this.currentInterviewAudio) {
            this.currentInterviewAudio.volume = Math.min(this.interviewVolumeLevel, 1.0);
            console.log(`🎵 재생 중인 오디오에 볼륨 적용: 슬라이더 ${value}%`);
        }
        
        // 현재 재생 중인 비디오에 볼륨 적용
        const videoElement = document.getElementById('interviewVideo');
        if (videoElement && !videoElement.paused) {
            videoElement.volume = Math.min(this.interviewVolumeLevel, 1.0);
            console.log(`🎵 재생 중인 비디오에 볼륨 적용: 슬라이더 ${value}%`);
        }
    }
    
    /**
     * 외부 클릭 시 볼륨 슬라이더 닫기 (이벤트 리스너 등록용)
     */
    setupVolumeSliderCloseOnOutsideClick() {
        document.addEventListener('click', (event) => {
            const volumeControl = document.querySelector('.volume-control');
            const volumeSliderContainer = document.getElementById('volumeSliderContainer');
            
            if (volumeControl && volumeSliderContainer && 
                !volumeControl.contains(event.target) && 
                volumeSliderContainer.style.display === 'block') {
                volumeSliderContainer.style.display = 'none';
                console.log('🎵 볼륨 슬라이더 닫힘 (외부 클릭)');
            }
        });
    }
    
    // ============================================
    // 완료 & Cleanup 함수 (2개)
    // ============================================
    
    /**
     * 인터뷰 완료
     */
    completeSpeakingInterview() {
        if (this.interviewTimer) {
            clearInterval(this.interviewTimer);
        }
        
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo = null;
        }
        
        console.log('✅ 스피킹-인터뷰 완료 → 채점화면으로 이동');
        
        const set = this.speakingInterviewData.sets[this.currentInterviewSet];
        
        return { set: set };
    }
    
    /**
     * Cleanup (타이머/오디오/비디오 정리)
     */
    cleanup() {
        console.log('🧹 [Cleanup] 스피킹-인터뷰 정리 시작');
        
        // 타이머 정지
        if (this.interviewTimer) {
            clearInterval(this.interviewTimer);
            this.interviewTimer = null;
            console.log('✅ 타이머 정지');
        }
        
        // 비디오 정지
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo.currentTime = 0;
            this.currentVideo = null;
            console.log('✅ 비디오 정지');
        }
        
        // 오디오 정지
        if (this.currentInterviewAudio) {
            this.currentInterviewAudio.pause();
            this.currentInterviewAudio.currentTime = 0;
            this.currentInterviewAudio = null;
            console.log('✅ 오디오 정지');
        }
        
        // 채점 화면 오디오 정지
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio = null;
            console.log('✅ 채점 화면 오디오 정지');
        }
        
        // 팝업 숨김
        const savingPopup = document.getElementById('interviewSavingPopup');
        if (savingPopup) {
            savingPopup.style.display = 'none';
        }
        
        // 데이터 초기화
        this.speakingInterviewData = null;
        this.currentInterviewSet = 0;
        this.currentInterviewQuestion = 0;
        this.currentInterviewResultData = null;
        this.currentPlayingIndex = null;
        
        console.log('✅ [Cleanup] 스피킹-인터뷰 정리 완료');
    }
    
    // ============================================
    // 채점 화면 함수 (15개)
    // ============================================
    
    /**
     * 채점 화면 표시
     */
    showInterviewResult(data) {
        console.log('📊 인터뷰 채점화면 표시');
        
        this.currentInterviewResultData = data;
        const set = data.set;
        
        // 데이터 렌더링
        this.renderInterviewResult(set);
    }
    
    /**
     * 채점 화면 렌더링
     */
    renderInterviewResult(set) {
        console.log('🎨 채점화면 렌더링');
        
        const container = document.getElementById('interviewResultContainer');
        if (!container) return;
        
        let html = '';
        
        // 문제보기 섹션
        html += this.renderQuestionsSection(set);
        
        // 모범답안 섹션 (1~4)
        for (let i = 0; i < set.videos.length; i++) {
            html += this.renderModelAnswerSection(set, i);
        }
        
        container.innerHTML = html;
        
        // 이벤트 리스너 등록
        this.attachInterviewResultEvents(set);
    }
    
    /**
     * 문제보기 섹션 렌더링
     */
    renderQuestionsSection(set) {
        let html = `
            <div class="interview-result-section">
                <div class="interview-result-header" onclick="window.currentInterviewComponent.toggleQuestions()">
                    <span id="questionsToggleIcon">▼</span>
                    <span class="interview-result-title">문제 보기</span>
                </div>
                <div id="questionsContent" class="interview-result-content" style="display: block;">
                    <div class="interview-question-block">
                        <div class="interview-scenario">
                            <strong>시나리오:</strong>
                            <div class="interview-scenario-text">${set.contextText}</div>
                            <span class="interview-translation">${set.contextTranslation || ''}</span>
                        </div>
                    </div>
        `;
        
        // 문제 1~4
        for (let i = 0; i < set.videos.length; i++) {
            const video = set.videos[i];
            html += `
                    <div class="interview-question-block">
                        <strong>문제 ${i + 1}:</strong>
                        <span class="interview-question-text">${video.script}</span>
                        <span class="interview-translation">${video.translation}</span>
                    </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * 모범답안 섹션 렌더링
     */
    renderModelAnswerSection(set, index) {
        const video = set.videos[index];
        const answerId = `answer${index}`;
        
        let html = `
            <div class="interview-result-section">
                <div class="interview-result-header" onclick="window.currentInterviewComponent.toggleModelAnswer(${index})">
                    <span id="${answerId}ToggleIcon">▶</span>
                    <span class="interview-result-title">모범답안 ${index + 1} 보기</span>
                </div>
                <div id="${answerId}Content" class="interview-result-content" style="display: none;">
                    <div class="interview-audio-button">
                        <button onclick="window.currentInterviewComponent.playModelAnswerAudio(${index})" class="interview-play-button">
                            <i class="fas fa-volume-up"></i> 모범답안 듣기
                        </button>
                    </div>
                    <div class="interview-model-answer">
        `;
        
        // 모범답안 전체 텍스트 (줄바꿈 제거, 한 문단으로)
        const fullAnswer = video.modelAnswer.replace(/\n/g, ' ').trim();
        const fullTranslation = video.modelAnswerTranslation.replace(/\n/g, ' ').trim();
        
        // 전체 텍스트에서 하이라이트 부분 찾기
        const segments = this.parseLineWithHighlights(fullAnswer, video.highlights);
        
        // 모범답안 전체 (하이라이트 포함)
        let answerHtml = '';
        for (const segment of segments) {
            if (segment.isHighlight) {
                answerHtml += `<span class="interview-highlight" data-highlight="${segment.key}" onclick="window.currentInterviewComponent.showFeedback(${index}, '${segment.key}')">${segment.text}</span>`;
            } else {
                answerHtml += segment.text;
            }
        }
        
        html += `
                        <div class="interview-answer-full">
                            <p class="interview-script">${answerHtml}</p>
                            
                            <!-- 해석 펼치기/접기 -->
                            <div class="interview-translation-toggle" onclick="window.currentInterviewComponent.toggleTranslation(${index})">
                                <span id="translation${index}ToggleIcon">▶</span>
                                <span>해석 보기</span>
                            </div>
                            <div id="translation${index}Content" class="interview-script-translation" style="display: none;">
                                ${fullTranslation}
                            </div>
                        </div>
        `;
        
        html += `
                    </div>
                    <div id="${answerId}Feedback" class="interview-feedback" style="display: none;">
                        <!-- 피드백이 여기 표시됨 -->
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * 한 라인에서 여러 하이라이트를 찾아 세그먼트로 분리
     */
    parseLineWithHighlights(line, highlights) {
        if (!highlights || typeof highlights !== 'object') {
            return [{ text: line, isHighlight: false }];
        }
        
        // 긴 키부터 먼저 매칭
        const keys = Object.keys(highlights).sort((a, b) => b.length - a.length);
        
        const segments = [];
        let remainingText = line;
        let lastIndex = 0;
        
        // 각 하이라이트 키의 위치 찾기
        const matches = [];
        for (const key of keys) {
            const index = remainingText.indexOf(key);
            if (index !== -1) {
                matches.push({ key, index, length: key.length });
            }
        }
        
        // 위치 순서로 정렬
        matches.sort((a, b) => a.index - b.index);
        
        // 겹치는 매칭 제거
        const validMatches = [];
        let lastEnd = 0;
        for (const match of matches) {
            if (match.index >= lastEnd) {
                validMatches.push(match);
                lastEnd = match.index + match.length;
            }
        }
        
        // 세그먼트 생성
        lastIndex = 0;
        for (const match of validMatches) {
            // 하이라이트 이전 텍스트
            if (match.index > lastIndex) {
                segments.push({
                    text: remainingText.substring(lastIndex, match.index),
                    isHighlight: false
                });
            }
            
            // 하이라이트 텍스트
            segments.push({
                text: match.key,
                key: match.key,
                isHighlight: true
            });
            
            lastIndex = match.index + match.length;
        }
        
        // 남은 텍스트
        if (lastIndex < remainingText.length) {
            segments.push({
                text: remainingText.substring(lastIndex),
                isHighlight: false
            });
        }
        
        // 매칭이 없으면 전체를 일반 텍스트로
        if (segments.length === 0) {
            segments.push({ text: line, isHighlight: false });
        }
        
        return segments;
    }
    
    /**
     * 문제보기 토글
     */
    toggleQuestions() {
        const content = document.getElementById('questionsContent');
        const icon = document.getElementById('questionsToggleIcon');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    }
    
    /**
     * 모범답안 토글
     */
    toggleModelAnswer(index) {
        const answerId = `answer${index}`;
        const content = document.getElementById(`${answerId}Content`);
        const icon = document.getElementById(`${answerId}ToggleIcon`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    }
    
    /**
     * 해석 토글
     */
    toggleTranslation(index) {
        const content = document.getElementById(`translation${index}Content`);
        const icon = document.getElementById(`translation${index}ToggleIcon`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '▼';
        } else {
            content.style.display = 'none';
            icon.textContent = '▶';
        }
    }
    
    /**
     * 모범답안 오디오 재생/일시정지
     */
    playModelAnswerAudio(index) {
        if (!this.currentInterviewResultData) return;
        
        const set = this.currentInterviewResultData.set;
        const video = set.videos[index];
        const button = document.querySelector(`#answer${index}Content .interview-play-button`);
        const icon = button.querySelector('i');
        const text = button.childNodes[button.childNodes.length - 1];
        
        // 현재 재생 중인 오디오가 같은 것이면 일시정지/재생 토글
        if (this.currentPlayingIndex === index && this.currentPlayingAudio) {
            if (this.currentPlayingAudio.paused) {
                this.currentPlayingAudio.play();
                icon.className = 'fas fa-pause';
                text.textContent = ' 일시정지';
                console.log(`▶️ 모범답안 ${index + 1} 재생 재개`);
            } else {
                this.currentPlayingAudio.pause();
                icon.className = 'fas fa-volume-up';
                text.textContent = ' 모범답안 듣기';
                console.log(`⏸️ 모범답안 ${index + 1} 일시정지`);
            }
            return;
        }
        
        // 다른 오디오가 재생 중이면 중지
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio.currentTime = 0;
            
            // 이전 버튼 아이콘 복원
            if (this.currentPlayingIndex !== null) {
                const prevButton = document.querySelector(`#answer${this.currentPlayingIndex}Content .interview-play-button`);
                if (prevButton) {
                    const prevIcon = prevButton.querySelector('i');
                    const prevText = prevButton.childNodes[prevButton.childNodes.length - 1];
                    prevIcon.className = 'fas fa-volume-up';
                    prevText.textContent = ' 모범답안 듣기';
                }
            }
        }
        
        // 새 오디오 재생
        if (video.modelAnswerAudio && video.modelAnswerAudio !== 'PLACEHOLDER') {
            console.log(`🔊 모범답안 ${index + 1} 오디오 재생`);
            
            this.currentPlayingAudio = new Audio(video.modelAnswerAudio);
            this.currentPlayingIndex = index;
            
            // 재생 시작
            this.currentPlayingAudio.play();
            icon.className = 'fas fa-pause';
            text.textContent = ' 일시정지';
            
            // 재생 종료 시
            this.currentPlayingAudio.onended = () => {
                icon.className = 'fas fa-volume-up';
                text.textContent = ' 모범답안 듣기';
                this.currentPlayingAudio = null;
                this.currentPlayingIndex = null;
                console.log(`✅ 모범답안 ${index + 1} 재생 완료`);
            };
            
            // 에러 처리
            this.currentPlayingAudio.onerror = () => {
                console.error(`❌ 모범답안 ${index + 1} 재생 실패`);
                icon.className = 'fas fa-volume-up';
                text.textContent = ' 모범답안 듣기';
                this.currentPlayingAudio = null;
                this.currentPlayingIndex = null;
            };
        } else {
            console.log('⚠️ 모범답안 오디오 없음');
        }
    }
    
    /**
     * 피드백 표시 (하이라이트 클릭 시)
     */
    showFeedback(answerIndex, highlightKey) {
        if (!highlightKey) return;
        if (!this.currentInterviewResultData) return;
        
        const set = this.currentInterviewResultData.set;
        const video = set.videos[answerIndex];
        const highlights = video.highlights;
        
        if (!highlights || !highlights[highlightKey]) return;
        
        const feedback = highlights[highlightKey];
        const feedbackDiv = document.getElementById(`answer${answerIndex}Feedback`);
        
        if (!feedbackDiv) return;
        
        // 피드백 HTML 생성
        feedbackDiv.innerHTML = `
            <div class="interview-feedback-content">
                <h4 class="interview-feedback-title">${feedback.title}</h4>
                <p class="interview-feedback-description">${feedback.description}</p>
            </div>
        `;
        
        feedbackDiv.style.display = 'block';
        
        console.log(`💡 피드백 표시: ${feedback.title}`);
    }
    
    /**
     * 이벤트 리스너 등록
     */
    attachInterviewResultEvents(set) {
        console.log('🔗 이벤트 리스너 등록');
        // highlight 클릭 이벤트는 이미 onclick으로 등록됨
    }
    
    /**
     * 채점 완료
     */
    completeInterviewResult() {
        console.log('✅ [채점 화면] 채점 완료');
        
        // 오디오 정지
        if (this.currentPlayingAudio) {
            this.currentPlayingAudio.pause();
            this.currentPlayingAudio = null;
        }
        
        // backToSchedule는 Module이 제공
        return true;
    }
    
    // ============================================
    // 유틸리티 함수 (1개)
    // ============================================
    
    /**
     * 시간 포맷 (예: 45 → "00:45")
     */
    formatInterviewTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// ============================================
// 전역 초기화
// ============================================
console.log('✅ InterviewComponent 클래스 로드 완료 (v=001)');
