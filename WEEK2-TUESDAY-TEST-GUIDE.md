# 🧪 Week 2 화요일 버튼 테스트 가이드

## 문제 상황
"Week 2 - 화요일 버튼이 안 눌린다"

## ✅ 현재 확인된 사항

### 1. 데이터 구조 (js/data.js) - ✅ 정상
```javascript
const demoTasks = {
    '내벨업챌린지 - Standard': {
        week2: {
            화: { 
                sections: ['vocab_test'], 
                description: '내벨업보카 (p.5-6)', 
                pages: '5-6' 
            }
        }
    }
}
```

### 2. getSectionInfo (js/main.js) - ✅ 수정 완료
```javascript
vocab_test: {
    icon: 'fas fa-spell-check',
    title: '내벨업보카 시험',
    description: '어휘 시험',
    time: '15분'
}
```

### 3. selectDay 함수 (js/main.js) - ✅ 정상
- Week 2 화요일 데이터를 정확히 찾음
- `vocab_test` 섹션이 1개이므로 `startSection('vocab_test')` 자동 호출
- `currentTest.currentDayTask`에 `{sections: ['vocab_test'], pages: '5-6'}` 저장

### 4. startSection 함수 (js/main.js) - ✅ 정상
```javascript
case 'vocab_test':
    const pageRange = (currentTest.currentDayTask && currentTest.currentDayTask.pages) || '1-2';
    initVocabTest(pageRange);  // '5-6' 전달
    break;
```

## 🧪 테스트 방법

### Step 1: 페이지 열기
1. 브라우저에서 프로젝트 열기:
   ```
   https://www.genspark.ai/api/code_sandbox_light/preview/3bebb157-8edd-4f39-b644-28a370098288/index.html
   ```

2. **강제 새로고침**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### Step 2: 개발자 도구 열기
1. `F12` 키를 누르거나 우클릭 → "검사"
2. **Console** 탭 선택

### Step 3: 로그인
1. 이름: `홍길동`
2. 휴대폰: `01012345678`
3. "인증하기" 클릭

**콘솔 확인**:
```
✅ 데이터 초기화 완료
✅ 로그인 성공: 홍길동 (내벨업챌린지 - Standard)
```

### Step 4: Week 2 클릭
**콘솔 확인**:
```
🔧 [버튼생성] Week 2, Day: "화"
🔍 [getTaskInfo] program: 내벨업챌린지 - Standard, week: 2, day: "화"
✅ 과제 찾음: "내벨업보카 (p.5-6)"
```

### Step 5: 화요일 버튼 클릭
**예상 콘솔 로그**:
```
🖱️ [클릭] Week 2, Day: "화" 버튼 클릭됨
🔍 [DEBUG] selectDay 호출됨
  week: 2 number
  day: 화 string
  weekKey: week2
  program: 내벨업챌린지 - Standard
✅ 과제 찾음: {sections: ['vocab_test'], description: '내벨업보카 (p.5-6)', pages: '5-6'}
📖 내벨업보카 페이지: 5-6
📚 내벨업보카 데이터 로드 시작 - 페이지: 5-6
```

## 🐛 문제 진단 체크리스트

### 문제 1: 버튼이 아예 표시되지 않음
**원인**: CSS 또는 렌더링 문제
**확인 방법**: 
- 콘솔에서 `document.querySelector('.day-button')` 실행
- 결과가 `null`이면 버튼이 렌더링되지 않은 것

**해결책**: 
```javascript
// 콘솔에서 직접 실행
renderSchedule('내벨업챌린지 - Standard');
```

### 문제 2: 버튼은 보이지만 클릭해도 반응 없음
**원인**: onclick 이벤트가 바인딩되지 않음
**확인 방법**:
```javascript
// 콘솔에서 실행
const buttons = document.querySelectorAll('.day-button');
buttons.forEach((btn, idx) => {
    console.log(`버튼 ${idx}:`, btn.onclick ? 'onclick 있음' : 'onclick 없음');
});
```

**해결책**:
```javascript
// 콘솔에서 직접 호출
selectDay(2, '화');
```

### 문제 3: 클릭은 되지만 화면 전환 안 됨
**원인**: `initVocabTest` 함수 또는 `showScreen` 문제
**확인 방법**:
```javascript
// 콘솔에서 실행
typeof initVocabTest  // 'function'이어야 함
```

**해결책**:
```javascript
// 콘솔에서 직접 실행
initVocabTest('5-6');
```

### 문제 4: 데이터가 안 보임
**원인**: Google Sheets 연결 문제
**확인 방법**:
```javascript
// 콘솔에서 실행
console.log(vocabTestData);  // 테스트 데이터가 보여야 함
```

**해결책**:
- Google Sheets가 공개로 설정되어 있는지 확인
- `js/vocab-test-logic.js`에서 `VOCAB_SPREADSHEET_ID` 확인

## 🔧 긴급 수동 테스트

콘솔에서 다음 명령어를 **순서대로** 실행:

```javascript
// 1. 변수 존재 확인
console.log('demoTasks:', typeof demoTasks);
console.log('currentUser:', currentUser);
console.log('selectDay:', typeof selectDay);

// 2. Week 2 화요일 데이터 확인
console.log('Week 2 화요일 데이터:', demoTasks['내벨업챌린지 - Standard'].week2['화']);

// 3. 직접 selectDay 호출
selectDay(2, '화');

// 4. initVocabTest 직접 호출 (위에서 안 되면)
initVocabTest('5-6');
```

## ✅ 성공 시 예상 화면

1. **화면 전환**: 학습 일정 → 내벨업보카 시험 소개 화면
2. **제목**: "내벨업보카 시험 (p.5-6)"
3. **버튼**: "시험 시작하기"
4. **콘솔**: 에러 없이 로드 완료 메시지들만 표시

## 📞 문제 보고 시 필요한 정보

만약 여전히 안 된다면, 다음 정보를 전달해주세요:

1. **콘솔 전체 로그** (F12 → Console 탭의 모든 메시지)
2. **버튼 HTML 구조**:
   ```javascript
   // 콘솔에서 실행
   document.querySelector('.day-button').outerHTML
   ```
3. **현재 화면 상태**:
   ```javascript
   // 콘솔에서 실행
   document.querySelectorAll('.screen').forEach(s => {
       if (s.style.display !== 'none') console.log('활성 화면:', s.id);
   });
   ```

## 🎯 최종 확인 사항

- [ ] 강제 새로고침 (`Ctrl+Shift+R`)
- [ ] F12 개발자 도구 열고 Console 탭 확인
- [ ] 홍길동 / 01012345678로 로그인
- [ ] Week 2 화요일 버튼 클릭
- [ ] 콘솔 에러 메시지 확인
- [ ] 화면이 전환되는지 확인

---

**테스트 링크**: https://www.genspark.ai/api/code_sandbox_light/preview/3bebb157-8edd-4f39-b644-28a370098288/index.html

**Google Sheets**: https://docs.google.com/spreadsheets/d/1I9R-yNiRrp12lDQ_pIk6_tUFO2KcxkG_akrwPj3zKws/edit?gid=0#gid=0
