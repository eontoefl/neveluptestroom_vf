# 🧪 모듈 통합 테스트 가이드

## ✅ 완료된 수정사항

### 1. ModuleController 수정
- **모든 컴포넌트**(Response, Conver, Announcement, Lecture, Arrange, Email, Discussion, Repeat, Interview)
- HTML에서 `window.currentXXXComponent` 호출할 수 있도록 전역 변수 연결 완료

### 2. 캐시 버스팅
- `module-controller.js?v=004` 버전 업데이트

---

## 📋 테스트 절차

### **0단계: 브라우저 완전 초기화**
```javascript
// 브라우저 개발자 도구 Console에 입력:
localStorage.clear(); 
sessionStorage.clear(); 
location.reload(true);
```

---

### **1단계: Reading Module (리딩 모듈)**

**테스트 경로:**
```
Week 1 → Sunday → "Reading Module 1" 클릭
```

**확인 사항:**
- [ ] FillBlanks 10문제 (Question 1-10 of 35 표시)
- [ ] Daily1 10문제 (Question 11-20 of 35 표시)
- [ ] Daily2 10문제 (Question 21-30 of 35 표시)
- [ ] Academic 5문제 (Question 31-35 of 35 표시)
- [ ] 완료 후 채점 결과 화면 표시

**예상 소요 시간:** 5분 (빠르게 답변 선택)

---

### **2단계: Listening Module (리스닝 모듈)**

**테스트 경로:**
```
Week 1 → Sunday → "Listening Module 1" 클릭
```

**확인 사항:**
- [ ] Response 12문제 (Question 1-12 of 32)
  - 오디오 재생 후 20초 타이머 작동
  - 보기 선택 가능
  - 타이머 00:00 되면 자동 다음 문제
  
- [ ] Conver 3문제 (Question 13-15 of 32)
  - 인트로 화면에 이미지 표시
  - 보기 선택 가능
  
- [ ] Announcement 2문제 (Question 16-17 of 32)
  - 인트로 화면에 랜덤 이미지 표시
  - 질문 영문으로 표시 (q1_trans 아님)
  - 보기 4개 전부 표시
  
- [ ] Lecture 15문제 (Question 18-32 of 32)
  - 보기 선택 가능
  
- [ ] 완료 후 채점 결과 화면 표시

**예상 소요 시간:** 10분

---

### **3단계: Writing Module (라이팅 모듈)**

**테스트 경로:**
```
Week 1 → Sunday → "Writing Module 1" 클릭
```

**확인 사항:**
- [ ] Arrange 1문제 (드래그앤드롭 작동)
- [ ] Email 1문제 (텍스트 입력 가능)
- [ ] Discussion 1문제 (텍스트 입력 가능)
- [ ] 완료 후 채점 결과 화면 표시

**예상 소요 시간:** 5분

---

### **4단계: Speaking Module (스피킹 모듈)**

**테스트 경로:**
```
Week 1 → Sunday → "Speaking Module 1" 클릭
```

**확인 사항:**
- [ ] Repeat 1문제 (녹음 가능)
- [ ] Interview 4문제 (녹음 가능)
- [ ] 완료 후 채점 결과 화면 표시

**예상 소요 시간:** 5분

---

## 🚨 에러 발생 시 체크리스트

### **"Cannot read properties of undefined (reading 'selectOption')" 에러**
→ `window.currentXXXComponent`가 설정 안 됨

**디버깅:**
```javascript
// Console에 입력:
console.log(window.currentConverComponent);
console.log(window.currentAnnouncementComponent);
console.log(window.currentArrangeComponent);
```

**예상 결과:** `Object` (클래스나 함수가 아님)

---

### **타이머가 작동 안 함**
→ ModuleController의 `startQuestionTimer()` 호출 확인

**디버깅:**
```javascript
// Console 로그 확인:
"⏰ [모듈] Response 타이머 시작 (20초)"
"⏰ 문제별 타이머 시작: 20초"
```

---

### **진행률이 표시 안 됨**
→ `updateCurrentQuestionInComponent()` 호출 확인

**디버깅:**
```javascript
// Console 로그 확인:
"📊 [진행률] 컴포넌트 내 문제 업데이트: 5"
"📊 [진행률] 업데이트: Question 16 of 32"
```

---

## ✅ 모든 테스트 통과 기준

- [ ] Reading Module 35문제 완료 → 결과 화면
- [ ] Listening Module 32문제 완료 → 결과 화면
- [ ] Writing Module 3문제 완료 → 결과 화면
- [ ] Speaking Module 5문제 완료 → 결과 화면
- [ ] 모든 보기 선택 가능
- [ ] 타이머 정상 작동
- [ ] 진행률 정확히 표시
- [ ] Console에 에러 없음

---

## 📞 문제 발생 시

**Console 전체 로그 복사해서 보내주세요.**

특히 다음 키워드 포함된 로그:
- `❌` (에러)
- `TypeError`
- `undefined`
- `Cannot read`
- `is not a function`
