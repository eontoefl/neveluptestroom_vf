# 📚 Listening - Lecture Google Sheets 구조

## 전체 개요

- **총 컬럼 수**: 69개 (A~BQ)
- **문제 개수**: 4개 (각 문제당 15개 컬럼)
- **특징**: 나레이션 + 렉처 오디오 + 스크립트 + 번역 + 하이라이트

---

## 🗂️ 컬럼 구조 상세

### 📌 기본 정보 (6개 컬럼)

| 컬럼 | 인덱스 | 필드명 | 설명 | 예시 |
|------|--------|--------|------|------|
| **A** | 0 | `setId` | 세트 고유 ID | `listening_lecture_1` |
| **B** | 1 | `imageUrl` | 교수 이미지 URL (사용 안 함, gender 기반 랜덤) | `` |
| **C** | 2 | `narrationUrl` | 나레이션 오디오 URL | `https://.../narration.mp3` |
| **D** | 3 | `audioUrl` | 렉처 오디오 URL | `https://.../lecture.mp3` |
| **E** | 4 | `script` | 영어 스크립트 | `Professor: Today we will discuss...` |
| **F** | 5 | `scriptTrans` | 한국어 번역 | `교수: 오늘은 ...에 대해 논의하겠습니다...` |

---

### 📌 Question 1 (15개 컬럼: G~U, 인덱스 6~20)

| 컬럼 | 인덱스 | 필드명 | 설명 | 예시 |
|------|--------|--------|------|------|
| **G** | 6 | `q1_question` | 문제 (영어) | `What is the topic of the talk?` |
| **H** | 7 | `q1_questionTrans` | 문제 번역 (한국어) | `이 강의의 주제는 무엇인가요?` |
| **I** | 8 | `q1_option1` | 선택지 1 | `How psychologists study attention` |
| **J** | 9 | `q1_option2` | 선택지 2 | `How to keep the mind focused` |
| **K** | 10 | `q1_option3` | 선택지 3 | `Two types of fascination` |
| **L** | 11 | `q1_option4` | 선택지 4 | `The benefits of hard fascination` |
| **M** | 12 | `q1_answer` | 정답 (1~4) | `1` |
| **N** | 13 | `q1_optionTrans1` | 선택지 1 번역 | `심리학자들이 주의를 연구하는 방법` |
| **O** | 14 | `q1_optionTrans2` | 선택지 2 번역 | `마음을 집중하는 방법` |
| **P** | 15 | `q1_optionTrans3` | 선택지 3 번역 | `두 가지 유형의 매력` |
| **Q** | 16 | `q1_optionTrans4` | 선택지 4 번역 | `강한 매력의 이점` |
| **R** | 17 | `q1_optionExpl1` | 선택지 1 설명 | `` (선택 사항) |
| **S** | 18 | `q1_optionExpl2` | 선택지 2 설명 | `` |
| **T** | 19 | `q1_optionExpl3` | 선택지 3 설명 | `` |
| **U** | 20 | `q1_optionExpl4` | 선택지 4 설명 | `` |

---

### 📌 Question 2 (15개 컬럼: V~AJ, 인덱스 21~35)

| 컬럼 | 인덱스 | 필드명 | 설명 |
|------|--------|--------|------|
| **V** | 21 | `q2_question` | 문제 (영어) |
| **W** | 22 | `q2_questionTrans` | 문제 번역 (한국어) |
| **X** | 23 | `q2_option1` | 선택지 1 |
| **Y** | 24 | `q2_option2` | 선택지 2 |
| **Z** | 25 | `q2_option3` | 선택지 3 |
| **AA** | 26 | `q2_option4` | 선택지 4 |
| **AB** | 27 | `q2_answer` | 정답 (1~4) |
| **AC** | 28 | `q2_optionTrans1` | 선택지 1 번역 |
| **AD** | 29 | `q2_optionTrans2` | 선택지 2 번역 |
| **AE** | 30 | `q2_optionTrans3` | 선택지 3 번역 |
| **AF** | 31 | `q2_optionTrans4` | 선택지 4 번역 |
| **AG** | 32 | `q2_optionExpl1` | 선택지 1 설명 |
| **AH** | 33 | `q2_optionExpl2` | 선택지 2 설명 |
| **AI** | 34 | `q2_optionExpl3` | 선택지 3 설명 |
| **AJ** | 35 | `q2_optionExpl4` | 선택지 4 설명 |

---

### 📌 Question 3 (15개 컬럼: AK~AY, 인덱스 36~50)

| 컬럼 | 인덱스 | 필드명 | 설명 |
|------|--------|--------|------|
| **AK** | 36 | `q3_question` | 문제 (영어) |
| **AL** | 37 | `q3_questionTrans` | 문제 번역 (한국어) |
| **AM** | 38 | `q3_option1` | 선택지 1 |
| **AN** | 39 | `q3_option2` | 선택지 2 |
| **AO** | 40 | `q3_option3` | 선택지 3 |
| **AP** | 41 | `q3_option4` | 선택지 4 |
| **AQ** | 42 | `q3_answer` | 정답 (1~4) |
| **AR** | 43 | `q3_optionTrans1` | 선택지 1 번역 |
| **AS** | 44 | `q3_optionTrans2` | 선택지 2 번역 |
| **AT** | 45 | `q3_optionTrans3` | 선택지 3 번역 |
| **AU** | 46 | `q3_optionTrans4` | 선택지 4 번역 |
| **AV** | 47 | `q3_optionExpl1` | 선택지 1 설명 |
| **AW** | 48 | `q3_optionExpl2` | 선택지 2 설명 |
| **AX** | 49 | `q3_optionExpl3` | 선택지 3 설명 |
| **AY** | 50 | `q3_optionExpl4` | 선택지 4 설명 |

---

### 📌 Question 4 (15개 컬럼: AZ~BN, 인덱스 51~65)

| 컬럼 | 인덱스 | 필드명 | 설명 |
|------|--------|--------|------|
| **AZ** | 51 | `q4_question` | 문제 (영어) |
| **BA** | 52 | `q4_questionTrans` | 문제 번역 (한국어) |
| **BB** | 53 | `q4_option1` | 선택지 1 |
| **BC** | 54 | `q4_option2` | 선택지 2 |
| **BD** | 55 | `q4_option3` | 선택지 3 |
| **BE** | 56 | `q4_option4` | 선택지 4 |
| **BF** | 57 | `q4_answer` | 정답 (1~4) |
| **BG** | 58 | `q4_optionTrans1` | 선택지 1 번역 |
| **BH** | 59 | `q4_optionTrans2` | 선택지 2 번역 |
| **BI** | 60 | `q4_optionTrans3` | 선택지 3 번역 |
| **BJ** | 61 | `q4_optionTrans4` | 선택지 4 번역 |
| **BK** | 62 | `q4_optionExpl1` | 선택지 1 설명 |
| **BL** | 63 | `q4_optionExpl2` | 선택지 2 설명 |
| **BM** | 64 | `q4_optionExpl3` | 선택지 3 설명 |
| **BN** | 65 | `q4_optionExpl4` | 선택지 4 설명 |

---

### 📌 추가 필드 (3개 컬럼)

| 컬럼 | 인덱스 | 필드명 | 설명 | 예시 |
|------|--------|--------|------|------|
| **BO** | 66 | `scriptHighlights` | 하이라이트 (단어::번역::설명##...) | `fascination::매력::주의를 끄는 힘##cognitive::인지적::생각과 관련된##...` |
| **BP** | 67 | `gender` | 교수 성별 (M/F) | `M` 또는 `F` |
| **BQ** | 68 | (예비) | 예비 컬럼 | `` |

---

## 📋 입력 예시 (한 행)

```
listening_lecture_1 | | https://.../narration.mp3 | https://.../lecture.mp3 | Professor: Today we will discuss... | 교수: 오늘은 ...논의하겠습니다... | What is the topic? | 주제는? | option1 | option2 | option3 | option4 | 1 | 번역1 | 번역2 | 번역3 | 번역4 | 설명1 | 설명2 | 설명3 | 설명4 | (q2 15개...) | (q3 15개...) | (q4 15개...) | fascination::매력::...##cognitive::인지적::... | M |
```

---

## 🔑 중요 사항

1. **컬럼 개수**: 정확히 **67개 이상** (최소 67개, scriptHighlights 포함)
2. **narrationUrl** (C열, 인덱스 2): 
   - 있으면: 나레이션 → 2초 대기 → 렉처 오디오 → 2초 대기 → 문제 화면
   - 없으면: 렉처 오디오 → 2초 대기 → 문제 화면
3. **gender** (BP열, 인덱스 67): 
   - `M` 또는 `F`
   - 인트로 이미지를 랜덤으로 선택 (LECTURE_MALE_IMAGES / LECTURE_FEMALE_IMAGES)
4. **scriptHighlights** (BO열, 인덱스 66):
   - 형식: `단어::번역::설명##단어2::번역2::설명2##...`
   - 채점 화면에서 파란색 밑줄 + 툴팁으로 표시
5. **imageUrl** (B열): 사용하지 않음 (gender 기반 랜덤 선택)

---

## 🎯 컨버/공지사항과의 차이점

| 항목 | 공지사항 | 렉처 |
|------|----------|------|
| **컬럼 수** | 37개 (A~AK) | 69개 (A~BQ) |
| **문제 수** | 2개 | 4개 |
| **이미지** | 랜덤 (M/F) | 랜덤 (M/F, 교수) |
| **나레이션** | 있음 | 있음 |
| **오디오 시퀀스** | 나레이션 → 2초 → 오디오 → 2초 → 문제 | 동일 |
| **scriptHighlights** | AI열 (35) | BO열 (66) |
| **gender** | B열 (1) | BP열 (67) |

---

## ✅ 최종 체크리스트

- [x] 총 69개 컬럼 (A~BQ)
- [x] 기본 정보 6개 (A~F)
- [x] 문제 4개 × 15개 컬럼 = 60개 (G~BN)
- [x] scriptHighlights: BO열 (66)
- [x] gender: BP열 (67)
- [x] 나레이션 시퀀스: narrationUrl → 2초 → audioUrl → 2초 → 문제
- [x] 인트로 이미지: gender 기반 랜덤 선택
- [x] 문제 화면 이미지: 인트로와 동일 (currentLectureImage)
- [x] 채점 화면: 스크립트 + 번역 + 하이라이트 + 4문제 결과

---

## 🚀 다음 단계

1. Google Sheets에 위 구조로 데이터 입력
2. 캐시 삭제 후 테스트
3. F12 콘솔 로그 확인
4. 채점 화면에서 스크립트, 하이라이트, 오디오 재생 확인

---

**작성일**: 2025-02-05  
**버전**: 1.0
