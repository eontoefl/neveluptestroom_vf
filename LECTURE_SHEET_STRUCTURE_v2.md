# 📚 Listening - Lecture Google Sheets 구조 (v2)

## 전체 개요

- **총 컬럼 수**: 68개 (A~BP)
- **문제 개수**: 4개 (각 문제당 15개 컬럼)
- **특징**: 나레이션 + 렉처 오디오 + 스크립트 + 번역 + 하이라이트

---

## 🗂️ 컬럼 구조 상세

### 📌 기본 정보 (6개 컬럼)

| 컬럼 | 인덱스 | 필드명 | 설명 | 예시 |
|------|--------|--------|------|------|
| **A** | 0 | `setId` | 세트 고유 ID | `listening_lecture_1` |
| **B** | 1 | `gender` | 교수 성별 (M/F) ⭐ | `M` 또는 `F` |
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

### 📌 추가 필드 (2개 컬럼)

| 컬럼 | 인덱스 | 필드명 | 설명 | 예시 |
|------|--------|--------|------|------|
| **BO** | 66 | `scriptHighlights` | 하이라이트 (단어::번역::설명##...) | `fascination::매력::주의를 끄는 힘##cognitive::인지적::생각과 관련된##...` |
| **BP** | 67 | (예비) | 예비 컬럼 | `` |

---

## 🔑 중요 변경사항

### ✅ **gender가 B열로 이동!**
- **이전**: BP열 (뒤에서 2번째)
- **현재**: B열 (2번째) ⭐
- **이유**: 매번 수기로 입력해야 하므로 앞쪽으로 이동

### ✅ **imageUrl 제거**
- **이전**: B열에 imageUrl
- **현재**: gender 기반 랜덤 이미지 자동 선택
- 더 이상 이미지 URL을 입력할 필요 없음

---

## 📋 입력 예시 (한 행)

```
listening_lecture_1 | M | https://.../narration.mp3 | https://.../lecture.mp3 | Professor: Today we will discuss... | 교수: 오늘은 ...논의하겠습니다... | What is the topic? | 주제는? | option1 | option2 | option3 | option4 | 1 | 번역1 | 번역2 | 번역3 | 번역4 | 설명1 | 설명2 | 설명3 | 설명4 | (q2 15개...) | (q3 15개...) | (q4 15개...) | fascination::매력::...##cognitive::인지적::... |
```

---

## 📊 컬럼 구조 비교

| 항목 | 이전 (v1) | 현재 (v2) |
|------|-----------|-----------|
| **총 컬럼** | 69개 (A~BQ) | 68개 (A~BP) |
| **gender 위치** | BP (67) | **B (1)** ⭐ |
| **imageUrl** | B (1) | **제거됨** |
| **scriptHighlights** | BO (66) | BO (66) (동일) |

---

## ✅ 최종 체크리스트

- [x] 총 68개 컬럼 (A~BP)
- [x] gender를 B열 (1)로 이동
- [x] imageUrl 제거
- [x] 기본 정보 6개 (A~F)
- [x] 문제 4개 × 15개 컬럼 = 60개 (G~BN)
- [x] scriptHighlights: BO열 (66)
- [x] 나레이션 시퀀스: narrationUrl → 2초 → audioUrl → 2초 → 문제
- [x] 인트로 이미지: gender 기반 랜덤 선택
- [x] 문제 화면 이미지: 인트로와 동일 (currentLectureImage)
- [x] 채점 화면: 스크립트 + 번역 + 하이라이트 + 4문제 결과

---

**작성일**: 2025-02-05  
**버전**: 2.0 (gender B열로 이동, imageUrl 제거)
