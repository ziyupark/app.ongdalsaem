# Screens 06 · Profile

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 06 Profile — [섹션 59:2369](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2369)

### 프로필 공통 헤더 (6.1 / 6.2 / 6.3 / 6.4) — 코드 기준(Figma 6.1 657:16468 · 컴포넌트 `Profile Header` [126:4345](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=126-4345)는 이전 구성)
- **ScreenWash + ScreenHeader**(네 탭 공통): 오른쪽 = 내 프로필 `settings`(→ 9.1), 다른 요리사 = 빈 자리 + 로고 대신 **뒤로** 버튼(4.5).
- **프로필 카드**(좌우 20, 유리: 블러 + glass/surface 88 %, 테두리 bg/subtle):
  1. **날씨 줄** — 홈 Weather card Now 줄과 같은 규칙: Numeric/XL 기온(padding 0 8 2 8) → 4 → Title/M 상태 → 6 → Body/S fg/muted 두 줄 "H 14° · L 9°" / "until 9 PM"(줄 간격 2) · **3D 날씨 아이콘 64**(원형 배경 없음, 날씨 없으면 bg/muted 원 + `cloud` — [§2.4](../01-foundations.md)). **항상 내 위치의 날씨**(다른 요리사 프로필에서도). 날씨가 없으면 "--°" / "No weather yet".
  2. 구분선 border/default — 날씨 줄 아래 12(홈 Weather Card와 같은 위치), 구분선 아래는 카드 간격 14
  3. **아이디 줄**: 아바타 88(흰 1.2 테두리, 사진 없으면 bg/accent-subtle + 첫 글자 Display/M fg/accent; 내 프로필은 탭 → 사진 바꾸기) + 16 + [Display/M 이름 → 2 → Body/S fg/muted "@username"] → 11 → **도토리 칩**(bg/muted, 채운 도토리 16 + Caption Strong **"Total acorns {n}"**) — 받은 도토리 합계.
  4. **상태 메시지**(Body/S fg/secondary). 내 프로필은 눌러서 고침("Add a status message" fg/muted 자리표시) → BottomSheet "Status message"(입력칸 + 글자 수).
  5. 다른 요리사만: **Follow**(Primary M, 팔로우 중이면 Secondary "Following") · **Message**(Outline M) 나란히 → 4.11.
- 18 → **UnderlineTabs**(Profile Header [126:4345](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=126-4345), 좌우 40, 탭 사이 28). 내 프로필 = **글자 탭** "Dishes {n}" · "Saved" · "Diary"(순서 Dishes → Saved → Diary). 다른 요리사 = "Dishes {n}" 하나.
- 오프라인이면 탭 아래 bg/inverse 띠(`wifi-off` + Body/S Strong fg/inverse "You’re offline — saved dishes still open.").

### 6.1 Profile · Dishes — [20:974](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-974) · 코드 기준
- 탭 아래 **8** → **Dish Tile 2열 그리드**(좌우 20, 열 16, 줄 20). 세로 스크롤, TabBar.
- 타일 = 사진(167:208 비율) + Weather Tag · **Acorn Tag** + 제목 · 바이라인.
- **Acorn Tag = 도토리 토글**(내 요리 · 다른 요리사 요리 모두): 탭하면 주고 다시 탭하면 취소, 준 상태는 채운 도토리. 숫자는 바로 바뀌고 실패하면 되돌린다. 내 프로필이면 위 "Total acorns"도 같이 바뀐다.
- 비었으면 Body/M 안내 + (내 프로필) Outline M "Share a dish" → 8.1.
- 셀 탭 → 7.1.

### 6.2 Profile · Saved — [58:1788](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=58-1788) · 코드 기준(내 프로필만)
- Title/L **"Collections"** ··· Body/S Strong fg/muted **"+ New"** → 칩 줄: **All** · 내 컬렉션들 · 저장한 요리의 날씨(아이콘 칩) → 저장 행 목록 → Caption "Hold a dish to add it to a collection."
- 저장 행: 썸네일 · Overline "SAVED · {날씨} {기온}°" · 제목 · "{요리사} · saved {시간}" · 오른쪽 북마크(누르면 저장 해제). 행 탭 → 7.1, **길게 누름 → "Add “{요리}” to…"** 컬렉션 고르기(체크 토글, 컬렉션이 없으면 새로 만들기).
- **"+ New" → 가운데 대화상자**(8.2b Add your mood와 같은 카드: 딤 · Title/M "New collection" · 이름 칸(30자) · Outline "Cancel" / Primary "Save").
- **컬렉션 칩 길게 누름 → 삭제 확인** "Delete “{name}”?" / "The dishes inside stay in Saved." → 삭제(안의 요리는 저장 목록에 남음). 그 컬렉션을 보고 있었으면 All로.
- 이동: 행 → 7.1.

### 6.3 Profile · Diary — [20:1110](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-1110) · 코드 기준(내 프로필만)
- **내가 올린 요리만** 보여 준다("I ate this" 기록은 이번 주 줄 · 월 보기 · 월 요약에 넣지 않는다).
- 순서(위→아래): **이번 주 한 줄** → **월 요약 한 줄** → **Fridge memo**(냉장실/냉동실 → What you can cook now) → **Shopping list**.
- **이번 주 한 줄**
  - 헤더: Title/M "Weekly Menu"(날짜 범위 없음 — 지난주 · 다음주로 넘겨도 제목은 그대로) · `calendar-days` 20 fg/accent(Month view) · `chevron-left`/`chevron-right` 20 fg/muted(지난주/다음주, 제한 없음). 어느 주인지는 칸의 날짜로 본다.
  - 7칸(로케일 주 시작 요일을 따름 — 기기 Intl 정보, 없으면 es · vi = 월요일, 나머지 = 일요일). 칸 = 요일 한 글자 · 날짜 · 날씨 줄(아이콘 14) · 원형 36. **오늘 칸** = border/focus 2 + 요일 · 날짜 fg/accent.
  - **지난 날**: 그날 날씨 아이콘 + 내가 만든 요리 원형 사진. 없으면 빈칸. 탭 → 그 요리 7.1.
  - **오늘 · 앞으로**: 예보 날씨 아이콘 + 최고기온 + 계획한 요리(사진, 없으면 이름 첫 글자 · bg/accent-subtle). 계획 없으면 점선 원 `plus`. 예보가 없는 먼 날짜는 날씨 생략.
  - 칸 탭 → **그날 식단 시트**(BottomSheet): 계획한 요리(삭제 X) · 끼니 칩 Lunch / Dinner · "Good for {날씨}" — 그날 예보로 Today's pick 추천 3개 · "From your saved dishes" → 고르면 그날 그 끼니에 저장(같은 끼니는 교체).
  - 계획 칸 **길게 누르기** → "Remove from your meal plan?" 확인(요리마다 Remove 버튼) 후 삭제.
  - 식단 계획은 **기기에만 저장**(서버에 올리지 않음), 30일 지난 계획은 지운다.
- **월 요약 한 줄**: 아이콘 16(fg/accent, 이번 달 가장 많은 날씨) + Body/S "{month}, mostly {날씨} · You cooked 12 times — 6 of them in the rain."(요리가 없으면 "A quiet {month}"만).
- **Month view**(가운데 팝업, 타이머 팝업과 같은 모양: overlay/scrim · bg/default 카드 radius xl, 최대 너비 360, 바깥 탭 → 닫기): 월 헤더 "November 2026" + `chevron-left`/`chevron-right`(이번 달 이후로는 못 감) → 달력(7열, 요일 한 글자) — 요리한 날 = 그 요리 사진 + 날씨 아이콘 → 날짜를 고르면 그날 요리 목록(썸네일 · 이름 · "You cooked this") → 팝업 닫고 7.1.
- 7.1 더보기 **Add to meal plan**: 날짜(오늘 + 6일) · 끼니(Lunch / Dinner) 선택 → 식단에 추가.

### 6.3 Fridge memo(Diary 탭 아래) — 코드 기준, Figma 없음
- **기기에만 저장**(서버에 올리지 않음).
- Title/M "Fridge" → **칸 선택** 3개(높이 48, radius input 20): **Fridge** · **Freezer** · **Shopping memo**(선택 = bg/inverse + fg/inverse, 아니면 bg/subtle + border/default).
  - 고른 칸의 **상자가 강조**된다: 상자 테두리 2 border/focus(다이어리 오늘 칸과 같음). 고르지 않은 상자는 투명 테두리 2라 크기 · 안쪽 위치는 같다(테두리 2 + padding 14 = 16).
- **입력 줄**(높이 48): Input "Add an ingredient" + Button M "Add" → 고른 칸(Shopping memo면 장보기 목록)에 추가.
- **칸별 상자** Fridge / Freezer: 재료 칩. 넣은 지 **7일이 넘으면 칩 테두리 fg/accent**. 칩 탭 → "Remove {name}?" 확인 후 삭제. 비었으면 "Nothing in the fridge yet. Add what you just put in."
- **"What you can cook now" 박스**(bg/accent-subtle): 냉장고 재료로 만들 수 있는 공개 레시피 **최대 5개**(사진 · 이름 · Caption fg/accent "{have}/{total} ingredients on hand" · Caption fg/muted "Need: {부족한 재료 2개}") → 7.1. 재료가 없으면 "Add ingredients and we’ll find dishes you can make with them."
  - 규칙: 재료 목록이 있는 최신 공개 게시물 200개(10분 캐시)에서, 내 재료와 겹치는 비율 → 겹친 개수 순. 하나도 안 겹치면 제외. 재료 이름은 소문자 · 복수형 · 수식어를 정리해서 비교.

> 설정은 **09 Settings**(9.1 Settings). 프로필의 `settings` 아이콘은 9.1로 간다.

### 6.4 State · Offline — [76:3380](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3380)
- 노트: *Saved dishes and Diary stay readable. Sharing is queued and sent when back online.*
- 6.2 레이아웃 + 탭 아래 오프라인 띠(bg/inverse, `wifi-off`, fg/inverse) "You’re offline — saved dishes still open.".
- 구현: 저장 요리·다이어리는 로컬 캐시. 공유는 큐에 넣고 재연결 시 전송.
- 이동: 저장 카드 → **6.4b**.

### 6.4b State · Offline post — [366:8906](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=366-8906)
- 오프라인에서 저장한 요리를 열었을 때. **7.1과 같은 레이아웃**(캐시된 사진 · 본문 · 재료 · 단계 · Details).
- Sheet 맨 위 `Inline Banner`(Neutral, `wifi-off`) "You’re offline — this saved copy still works. Acorns and comments come back online."
- 네트워크가 필요한 것은 **비활성(투명도 35–40%, 탭 안 됨)**: Feed Post Acorn · Comment · Share, Action bar Acorn Button, Top bar `more`(숨김). Nearby · More from 섹션은 없음.
- 그대로 되는 것: 재료 · 단계 읽기, **Cook along / Start timer**(로컬 타이머), 저장 해제(재연결 때 동기화).
- 다시 연결되면 7.1로 조용히 바뀐다(배너 사라짐, 숫자 갱신).

---
