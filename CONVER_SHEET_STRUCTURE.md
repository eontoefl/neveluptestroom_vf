# 컨버(Conversation) Google Sheets 데이터 구조

## 📊 Sheet 정보
- **Spreadsheet ID**: `1srFVmFnRa8A73isTO_Vk3yfU1bQWVroHUui8XvYf9e0`
- **Sheet GID**: `1189725287`

---

## 📋 컬럼 구조 (총 35개 컬럼)

### 기본 정보 (5개)
| 컬럼 | 이름 | 설명 | 예시 |
|------|------|------|------|
| A | setId | 세트 ID | `listening_conver_1` |
| B | imageUrl | 대화 이미지 URL | GitHub Pages URL 또는 `PLACEHOLDER` |
| C | audioUrl | 대화 오디오 URL | GitHub Pages URL 또는 `PLACEHOLDER` |
| D | script | 대화 스크립트 (전체) | `Man: Hi, Sarah...` |
| E | scriptTrans | 스크립트 번역 (전체) | `남자: 안녕, Sarah...` |

### 문제 1 (14개: F ~ S)
| 컬럼 | 이름 | 설명 | 예시 |
|------|------|------|------|
| F | q1 | 문제 1 질문 | `What does the woman imply?` |
| G | q1_trans | 문제 1 번역 | `여자가 암시하는 것은?` |
| H | q1_opt1 | 보기 1 | `See a play` |
| I | q1_opt2 | 보기 2 | `Change her clothes` |
| J | q1_opt3 | 보기 3 | `Go shopping` |
| K | q1_opt4 | 보기 4 | `Eat dinner` |
| L | q1_answer | 정답 번호 (1~4) | `2` |
| M | q1_opt1_trans | 보기 1 번역 | `연극을 보다` |
| N | q1_opt2_trans | 보기 2 번역 | `옷을 갈아입다` |
| O | q1_opt3_trans | 보기 3 번역 | `쇼핑하러 가다` |
| P | q1_opt4_trans | 보기 4 번역 | `저녁을 먹다` |
| Q | q1_opt1_exp | 보기 1 해설 (오답 이유) | `여자는 연극을 보러 가기 전에...` |
| R | q1_opt2_exp | 보기 2 해설 (정답 이유) | `여자가 "I was just about to..."` |
| S | q1_opt3_exp | 보기 3 해설 (오답 이유) | `쇼핑에 대한 언급은...` |
| T | q1_opt4_exp | 보기 4 해설 (오답 이유) | `저녁 식사에 대한...` |

### 문제 2 (14개: U ~ AH)
| 컬럼 | 이름 | 설명 | 예시 |
|------|------|------|------|
| U | q2 | 문제 2 질문 | `What will the speakers do next?` |
| V | q2_trans | 문제 2 번역 | `화자들이 다음에 할 일은?` |
| W | q2_opt1 | 보기 1 | `Go to the theater` |
| X | q2_opt2 | 보기 2 | `Visit a restaurant` |
| Y | q2_opt3 | 보기 3 | `Return home` |
| Z | q2_opt4 | 보기 4 | `Buy tickets` |
| AA | q2_answer | 정답 번호 (1~4) | `1` |
| AB | q2_opt1_trans | 보기 1 번역 | `극장에 가다` |
| AC | q2_opt2_trans | 보기 2 번역 | `식당을 방문하다` |
| AD | q2_opt3_trans | 보기 3 번역 | `집으로 돌아가다` |
| AE | q2_opt4_trans | 보기 4 번역 | `티켓을 사다` |
| AF | q2_opt1_exp | 보기 1 해설 (정답 이유) | `남자가 "the play starts at..."` |
| AG | q2_opt2_exp | 보기 2 해설 (오답 이유) | `식당 방문에 대한...` |
| AH | q2_opt3_exp | 보기 3 해설 (오답 이유) | `이미 외출 중이고...` |
| AI | q2_opt4_exp | 보기 4 해설 (오답 이유) | `티켓 구매에 대한...` |

---

## 📝 작성 가이드

### 1. Script 작성 요령
- **형식**: `화자: 대사` 형태로 작성
- **예시**: 
  ```
  Man: Hi, Sarah. Are you ready to go? Woman: Actually, I was just about to change my clothes. I didn't realize we were leaving so soon.
  ```
- **자동 분리**: 마침표(.), 물음표(?), 느낌표(!)를 기준으로 문장이 자동으로 나뉩니다.
- **각 문장 아래에 번역 표시**: 시스템이 자동으로 문장별로 번역을 매칭합니다.

### 2. Script Translation 작성 요령
- Script와 **동일한 문장 수**로 작성
- **예시**:
  ```
  남자: 안녕, Sarah. 갈 준비됐어? 여자: 사실, 저는 막 옷을 갈아입으려고 했어요. 우리가 이렇게 빨리 떠날 줄 몰랐어요.
  ```

### 3. 헷갈릴 만한 표현 (자동 툴팁)
시스템이 자동으로 인식하여 hover 시 툴팁을 표시하는 표현들:
- `as a matter of fact` → 사실은
- `actually` → 사실은
- `by the way` → 그런데
- `I mean` → 내 말은
- `you know` → 있잖아
- `sort of` / `kind of` → 일종의 / 약간
- `I guess` / `probably` → 아마도
- `definitely` / `absolutely` → 확실히 / 절대적으로
- `basically` → 기본적으로
- `honestly` / `obviously` / `apparently` → 솔직히 / 명백히 / 분명히

**추가 키워드가 필요하면 `js/listening-conver-logic.js`의 `highlightKeywords()` 함수를 수정하세요.**

### 4. 보기 해설 작성 요령
- **정답 이유**: 대화 내용의 근거를 명확히 제시
  - 예: `여자가 "I was just about to change my clothes"라고 말했으므로 옷을 갈아입으려 했던 것이 맞습니다.`
  
- **오답 이유**: 왜 틀렸는지 설명
  - 예: `쇼핑에 대한 언급은 대화에 없습니다.`
  - 예: `남자가 언급한 것은 연극이므로 식당 방문 계획은 없습니다.`

---

## 🎨 결과 화면 구조

### ✅ 포함되는 요소
1. **대화 오디오 재생 버튼** (세트당 1회)
2. **전체 스크립트 표시**
   - 문장별로 분리
   - 각 문장 아래에 번역
   - 헷갈리는 표현에 툴팁 (hover)
3. **각 문제별 표시**
   - 문제 질문 + 번역
   - 내 답변 / 정답 표시
   - 보기 상세 해설 (펼치기/접기)
     - 각 보기 텍스트
     - 각 보기 번역
     - 정답 이유 / 오답 이유

---

## 📊 예시 데이터

```csv
setId,imageUrl,audioUrl,script,scriptTrans,q1,q1_trans,q1_opt1,q1_opt2,q1_opt3,q1_opt4,q1_answer,q1_opt1_trans,q1_opt2_trans,q1_opt3_trans,q1_opt4_trans,q1_opt1_exp,q1_opt2_exp,q1_opt3_exp,q1_opt4_exp,q2,q2_trans,q2_opt1,q2_opt2,q2_opt3,q2_opt4,q2_answer,q2_opt1_trans,q2_opt2_trans,q2_opt3_trans,q2_opt4_trans,q2_opt1_exp,q2_opt2_exp,q2_opt3_exp,q2_opt4_exp
listening_conver_1,PLACEHOLDER,PLACEHOLDER,"Man: Hi, Sarah. Are you ready to go? Woman: Actually, I was just about to change my clothes. I didn't realize we were leaving so soon. Man: Well, the play starts at 7, so we should probably leave in about 10 minutes.","남자: 안녕, Sarah. 갈 준비됐어? 여자: 사실, 저는 막 옷을 갈아입으려고 했어요. 우리가 이렇게 빨리 떠날 줄 몰랐어요. 남자: 음, 연극이 7시에 시작하니까 10분 정도 후에 출발해야 할 것 같아요.",What does the woman imply that she was about to do?,여자가 막 하려고 했던 일은 무엇입니까?,See a play,Change her clothes,Go shopping,Eat dinner,2,연극을 보다,옷을 갈아입다,쇼핑하러 가다,저녁을 먹다,여자는 연극을 보러 가기 전에 옷을 갈아입으려 했지 연극을 보려고 한 것이 아닙니다.,여자가 "I was just about to change my clothes"라고 말했으므로 옷을 갈아입으려 했던 것이 맞습니다.,쇼핑에 대한 언급은 대화에 없습니다.,저녁 식사에 대한 언급은 대화에 없습니다.,What will the speakers probably do next?,화자들이 다음에 할 일은 무엇입니까?,Go to the theater,Visit a restaurant,Return home,Buy tickets,1,극장에 가다,식당을 방문하다,집으로 돌아가다,티켓을 사다,남자가 "the play starts at 7"이라고 말했으므로 극장에 갈 것입니다.,식당 방문에 대한 계획은 언급되지 않았습니다.,이미 외출 중이고 연극을 보러 갈 예정이므로 집으로 돌아가지 않습니다.,티켓 구매에 대한 언급은 없으며 이미 티켓이 있는 것으로 보입니다.
```

---

## 🔧 시스템 동작

### 파싱 로직 (`parseConverCSV`)
1. CSV를 줄 단위로 읽음
2. 각 줄을 35개 컬럼으로 분리
3. 기본 정보 (setId, imageUrl, audioUrl, script, scriptTrans) 추출
4. 문제 1 데이터 (질문, 보기, 번역, 해설) 추출
5. 문제 2 데이터 (질문, 보기, 번역, 해설) 추출
6. 세트 객체 생성 및 반환

### 렌더링 로직
1. **세트 렌더링**: 대화 오디오 + 전체 스크립트 (문장별 분리)
2. **문제 렌더링**: 각 문제의 질문 + 번역 + 답변 + 해설

---

## ✅ 체크리스트

데이터 입력 시 확인사항:
- [ ] 모든 필수 컬럼(35개)이 채워졌는가?
- [ ] script와 scriptTrans의 문장 수가 일치하는가?
- [ ] 각 문제의 answer 값이 1~4 범위인가?
- [ ] 모든 보기에 번역이 있는가?
- [ ] 정답 보기에는 "정답 이유"가, 오답 보기에는 "오답 이유"가 작성되었는가?
- [ ] audioUrl이 GitHub Pages URL 또는 PLACEHOLDER인가?

---

## 🎉 완료!

이 구조에 맞춰 Google Sheets에 데이터를 입력하면, 자동으로:
- ✅ 대화 스크립트가 문장별로 분리되어 표시됩니다
- ✅ 각 문장 아래에 번역이 표시됩니다
- ✅ 헷갈리는 표현에 툴팁이 자동으로 추가됩니다
- ✅ 문제별 질문, 번역, 보기, 해설이 모두 표시됩니다
- ✅ 정답/오답 이유가 명확히 구분되어 표시됩니다
