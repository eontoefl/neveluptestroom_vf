# 내벨업보카 시험 - 설정 가이드 📚

## 🎯 개요

내벨업보카는 교재 페이지 기반 어휘 시험 시스템입니다. Google Sheets에 단어 데이터를 입력하면, 프로그램별/주차별로 자동으로 해당 페이지의 단어만 시험에 출제됩니다.

---

## 📊 Google Sheets 데이터 구조

### 1단계: 새 Google Sheet 생성

**시트 이름**: `내벨업보카 - 단어 시험`

### 2단계: 데이터 입력

아래 표를 **첫 번째 행(A1 셀)**에 복사해서 붙여넣으세요:

```
page	headword	synonym1	synonym2	synonym3	synonym4	synonym5	synonym6	synonym7	synonym8
5	coincide	occur together	match				
5	collapse	fall	break down				
5	colleague	coworker	associate				
5	commence	begin	start				
5	compensate	make up for	reimburse				
6	component	part	element				
6	comprehensive	complete	thorough	extensive			
6	comprise	consist of	include				
6	conceive	imagine	think of				
6	concentrate	focus	gather				
```

> **💡 팁**: 탭(Tab)으로 구분된 형식입니다. 복사 후 A1에 붙여넣으면 열이 자동으로 분리됩니다.

### 3단계: 공유 설정

1. 오른쪽 상단 **"공유"** 버튼 클릭
2. 일반 액세스: **"링크가 있는 모든 사용자"** 선택
3. 권한: **"뷰어"** (읽기 전용)
4. **"완료"** 클릭

### 4단계: Spreadsheet ID 확인

브라우저 주소창의 URL 확인:
```
https://docs.google.com/spreadsheets/d/1I9R-yNiRrp12lDQ_pIk6_tUFO2KcxkG_akrwPj3zKws/edit?gid=0#gid=0
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                      이 부분이 Spreadsheet ID입니다
```

---

## 🔧 코드 설정

### js/vocab-test-logic.js 파일 수정

1. 파일을 열고 아래 부분을 찾으세요:

```javascript
// Google Sheets 설정
const VOCAB_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';  // 👈 여기에 입력!
const VOCAB_SHEET_GID = '0';  // 기본값: 0 (첫 번째 시트)
```

2. `VOCAB_SPREADSHEET_ID`에 실제 Spreadsheet ID 입력:

```javascript
const VOCAB_SPREADSHEET_ID = '1I9R-yNiRrp12lDQ_pIk6_tUFO2KcxkG_akrwPj3zKws';  // ✅ 실제 ID
const VOCAB_SHEET_GID = '0';
```

3. 아래 주석 처리된 코드를 활성화:

**기존 (주석 처리됨)**:
```javascript
// const csvUrl = `https://docs.google.com/spreadsheets/d/${VOCAB_SPREADSHEET_ID}/export?format=csv&gid=${VOCAB_SHEET_GID}`;
// const response = await fetch(csvUrl);
```

**변경 후 (주석 제거)**:
```javascript
const csvUrl = `https://docs.google.com/spreadsheets/d/${VOCAB_SPREADSHEET_ID}/export?format=csv&gid=${VOCAB_SHEET_GID}`;
const response = await fetch(csvUrl);
```

---

## 📅 프로그램별 페이지 스케줄

### Standard 프로그램 (8주)

| Week | 요일 | 페이지 | 설명 |
|------|-----|-------|------|
| Week 2 | 화요일 | 5-6 | 내벨업보카 시험 |
| Week 3 | 화요일 | 9-10 | 내벨업보카 시험 |
| Week 4 | 화요일 | 13-14 | 내벨업보카 시험 |
| Week 5 | 화요일 | 17-18 | 내벨업보카 시험 |
| Week 6 | 화요일 | 21-22 | 내벨업보카 시험 |
| Week 7 | 화요일 | 25-26 | 내벨업보카 시험 |
| Week 8 | 화요일 | 29-30 | 내벨업보카 시험 |

### Fast 프로그램 (4주)

| Week | 요일 | 페이지 | 설명 |
|------|-----|-------|------|
| Week 2 | 화요일 | 5-8 | 내벨업보카 시험 |
| Week 3 | 화요일 | 9-12 | 내벨업보카 시험 |
| Week 4 | 화요일 | 13-16 | 내벨업보카 시험 |

---

## 📝 데이터 형식 규칙

### 필수 열
- **page** (숫자): 페이지 번호
- **headword** (텍스트): 표제어
- **synonym1** (텍스트): 첫 번째 동의어 (필수)

### 선택 열
- **synonym2 ~ synonym8**: 추가 동의어 (최대 8개까지)
- 빈 칸으로 두어도 됩니다

### 주의사항
✅ **첫 행은 반드시 헤더**여야 합니다
✅ **page**는 숫자로 입력 (5, 6, 7...)
✅ **headword**와 **synonym1**은 필수입니다
✅ 대소문자는 자동으로 무시됩니다
✅ 앞뒤 공백은 자동으로 제거됩니다

---

## 🧪 테스트 방법

### 1. 페이지 새로고침
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 2. 로그인
- **이름**: 홍길동
- **휴대폰**: 01012345678

### 3. Week 2 선택

### 4. 화요일 클릭

### 5. 확인 사항
✅ 제목: `내벨업보카 시험 (p.5-6)` 표시
✅ 진행 상태: `총 XX개 문제 (p.5-6)` 표시
✅ 페이지 5와 6의 단어만 표시됨

---

## 🐛 문제 해결

### 문제 1: "데이터를 불러오는데 실패했습니다"

**원인**: Google Sheets가 공개로 설정되지 않음
**해결**: 
1. Google Sheets 열기
2. 우측 상단 "공유" 클릭
3. "링크가 있는 모든 사용자" → "뷰어" 확인

### 문제 2: 페이지가 로딩되지 않음

**원인**: 브라우저 캐시
**해결**: 
- 강제 새로고침 (`Ctrl+Shift+R` / `Cmd+Shift+R`)

### 문제 3: 단어가 표시되지 않음

**원인**: page 열이 텍스트로 입력됨
**해결**: 
- page 열의 값을 숫자로 변경 (5, 6, 7...)

### 문제 4: 동의어가 채점되지 않음

**원인**: 철자 오류 또는 공백
**해결**: 
- Google Sheets에서 동의어 철자 확인
- 앞뒤 불필요한 공백 제거

---

## 📈 추가 단어 입력 방법

### 새 단어 추가
1. Google Sheets 열기
2. 마지막 행 다음에 새 행 추가
3. 데이터 입력:
   - `page`: 페이지 번호 (숫자)
   - `headword`: 표제어
   - `synonym1 ~ synonym8`: 동의어 (최소 1개)

### 예시
```
| page | headword | synonym1 | synonym2 | synonym3 |
|------|----------|----------|----------|----------|
| 7    | constant | continuous | unchanging | steady |
| 7    | construct | build | create | |
```

### 자동 반영
- Google Sheets에 저장하면 **즉시 반영**됩니다
- 학생이 페이지를 **새로고침**하면 새 데이터가 로드됩니다

---

## ✅ 완료 체크리스트

- [ ] Google Sheet 생성 완료
- [ ] 시트 이름: `내벨업보카 - 단어 시험`
- [ ] 헤더 입력: `page`, `headword`, `synonym1` ~ `synonym8`
- [ ] 테스트 데이터 입력 (p.5-6 최소 10개 단어)
- [ ] 공유 설정: "링크가 있는 모든 사용자" (뷰어)
- [ ] Spreadsheet ID 복사
- [ ] `js/vocab-test-logic.js`에 ID 입력
- [ ] 로드 코드 주석 해제
- [ ] 테스트 완료 (Week 2 화요일)

---

## 📞 지원

문제가 발생하면:
1. F12 → 콘솔 탭 확인
2. 에러 메시지 확인
3. 위의 "문제 해결" 섹션 참고

**로그 확인 방법**:
```javascript
// 콘솔에서 다음 메시지 확인
📚 내벨업보카 데이터 로드 시작 - 페이지: 5-6
📖 시험 페이지: 5, 6
✅ XX개의 단어 로드 완료 (페이지: 5, 6)
```

---

## 🎉 완료!

이제 내벨업보카 시험 시스템이 완벽하게 작동합니다! 🚀

**테스트 링크**: [프로젝트 미리보기](https://www.genspark.ai/api/code_sandbox_light/preview/3bebb157-8edd-4f39-b644-28a370098288/index.html)
