# Screens 03 · Community · Nearby

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 03 Community · Nearby(Our area · Nearby list) — [섹션 59:2363](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2363)

Community에 **Nearby 탭은 없다**(Explore에 합침, [04-community 4.1](04-community.md)). 내 동네 탐색은 Explore의 **Our area** 섹션(오늘 인기 · 동네 질문)에서 한다. **3.1 Nearby list** 화면은 코드에 남아 있지만 **지금 여는 버튼이 없다**(Our area "See more"와 Explore 검색창을 뺐음). Figma 3.1은 이 화면(TopBar "Our area")이다. 3.2–3.6 프레임은 Nearby 탭 시절 상단(탭 · Weather now)이 남아 있지만 본문 규칙은 아래와 같다.

### 3.1 Nearby list — [19:663](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=19-663)
- 여는 곳: **지금 없음**(예전 Explore → Our area "See more" · Explore 검색창). 푸시 화면, TabBar 없음.
- 블록:
  1. TopBar(Inline) **"Our area"**(뒤로)
  2. **검색 필드** "Dishes, ingredients, moods"(좌우 20, 위 16) — 입력 중에는 아래 대신 **3.4 입력 패널**. 보내면 같은 화면에서 결과(3.5).
  3. **범위 칩**(가로 스크롤, 좌우 20, 위 16, gap 8): **All** · Within 1 km(위치가 있을 때) · {구 이름}(구를 알 때) · Same weather(날씨를 알 때). 하나만 선택.
  4. 본문(좌우 20, 위 16 · 아래 12, gap 12):
     - 컨텍스트 줄(날씨를 알 때): `cloud-rain` 16 + Body/S Strong fg/accent "Cooked near you on days like this" — 검색 결과면 "{n} dishes near you · best in {weather} first".
     - 검색하지 않았을 때: **Ask 줄**(bg/subtle + border/default, radius lg, `message-circle` 20 · "Ask your neighbors about food…" fg/muted) → 3.7 · **Question Card** 1개(내 칸 질문 중 첫 번째) → 3.8.
  5. **Dish Tile 2열 그리드**(좌우 20, 열 16 · 줄 20). **같은 날씨에 올라온 요리 먼저**, 그다음 최신.
- 상태: 근처 게시물이 없으면 **3.2**, 검색 결과가 없으면 **3.3**.
- 이동: 카드 → 7.1 · Ask 줄 → 3.7 · Question Card → 3.8 · 뒤로 → 4.1.

### 3.2 State · Nearby is empty — [76:2978](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-2978)
- 3.1 그리드 자리에 EmptyState(L): 지금 날씨 아이콘 → "Be the first table in this {weather}" → "Nobody near {place} has shared a dish in today’s weather yet. Yours could start it." → Button Primary M "Share a dish" → 8.1.

### 3.3 State · No results — [76:3114](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3114)
- 검색 결과 0개: EmptyState(L) `search` → "Nothing for “{q}” yet" → "Try the weather or a mood tag instead." → 칩: 지금 날씨(→ 검색 지우고 Same weather 칩) · #cozy · #comforting · #spicy(→ 그 태그 4.2).

### 3.4 Search · Typing — [351:7294](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=351-7294)
- 3.1의 검색 필드. 입력 중에는 아래 내용 대신 패널(좌우 20, 위 16, gap 10)이 보인다.
- **SUGGESTIONS**: `search` · 일치 부분 굵게 · 오른쪽 "{n} near you"(Caption) — 내 도시 게시물 이름에서.
- **RECENT**: 최근 검색 최대 6개(기기에만 저장), 행 끝 `x`로 하나씩 지우기.
- 힌트 Caption "Search dishes, ingredients or moods near you. Nothing matches? We’ll suggest weather and mood tags."
- 이동: 제안 행 / Return → 결과(같은 화면) · Clear → 입력 비움.

### 3.5 Search results — [351:8143](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=351-8143)
- 3.1 레이아웃 그대로, 검색 필드에 검색어. 컨텍스트 "24 dishes near you · best in light rain first". Ask 줄 · 질문 카드는 숨김.
- 정렬: 지금 날씨와 같은 날씨에 올라온 것 먼저 → 최신. 범위 칩으로 더 좁힐 수 있다.

### 3.6 Nearby · 범위 칩 — [351:8336](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=351-8336)
- **Within 1 km** = 내 위치 주변 geohash 칸 · **{구}** = 같은 구 · **Same weather** = 지금 내 날씨와 같은 날씨로 올라온 게시물(같은 도시) · **All** = 내 도시 전체.

### 3.7 Ask the neighborhood — [469:11315](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-11315)
- 섹션 04c의 NEIGHBORHOOD QUESTIONS에 있다. 4.1 Our area의 "Ask a question" · 3.1 Ask 줄에서 연다(푸시, TopBar Inline "Ask the neighborhood").
- 블록(좌우 20, gap 20): **Area shown** pill(`map-pin` · "Your area shows as Mangwon-dong" + **Change** 작은 pill(bg/default, fg/accent) → 9.5) → 질문 칸(bg/subtle, focus 테두리, radius 16, Body/L, 예시 "Is there a place near the market that still does kalguksu after 9 PM?") + 아래 줄 **Photo**(`camera`, 선택 1장) ··· "71 / 200" → **What kind of question?** Chip: **Where to eat**(Selected) · Recipe help · Ingredients · Market & deals · Other → 안내 박스(bg/accent-subtle, Caption fg/secondary) "Neighbors near you see this — never your exact location. Questions stay up for 7 days. No names, phone numbers or addresses of people."
- [고정] Button Primary L **Post question**(y 744, 01과 같은 위치) → 3.8.
- 규칙: 5–200자, 카테고리 1개 필수. **보이는 장소 이름 = 9.5 Shared precision**(동네 → "Mangwon-dong", 도시 → "Seoul", 나라 → "Korea"). pill 문구도 그 값을 보여 준다. **누가 보는지**는 장소 이름과 별개로, 질문할 때의 위치를 약 5 km 칸(geohash 5자리)으로 줄여 서버에만 저장하고 같은 약 20 km 범위 사람에게 보여 준다. 정확한 위치와 칸 값은 누구에게도 보이지 않는다(DB question_areas, ask_question · nearby_questions). 위치가 꺼져 있으면 3.7 대신 **3.7b**.

### 3.7b State · Location off — [502:12559](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=502-12559)
- 위치를 끈 상태에서 Ask the neighborhood를 눌렀을 때. 3.7 상단 그대로, 본문: 72 원 `map-pin` 30 → "Turn on location to ask neighbors"(Title/L) → "We only use a rough area to find people near you. Your exact location is never shown."(Body/S, 가운데).
- [고정] Button Primary L **Turn on location**(y 744) → **9.5**(Use location 스위치). 켜고 돌아오면 3.7.

### 3.8 Question · Kalguksu after 9 PM — [469:11388](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-11388)
- TopBar Inline "Question". **Question Card**(사진 켬) → **4 ANSWERS**(Overline) → 답 행 ×3: 아바타 32 · 이름 Body/S Strong · 동네 · 시간 Caption · (질문자가 고른 답) **Asker’s pick** 배지(bg/done-subtle, `check` 12 fg/done + 글자 fg/default) → 답 Body/M → `thumbs-up` 16 "Helpful · 12".
- [고정] **Comment Composer** "Answer Minji…".
- 규칙: 답 ≤500자. 질문자는 답 하나를 Asker’s pick으로 고른다(바꿀 수 있음). 질문 카드에는 Me too · 카테고리 배지가 없다(4.1에서 뺌, DB question_me_too는 남겨 둠). 답의 **Helpful**(`thumbs-up`) = 이 답이 도움 됨 — 답 정렬에 쓰고 답한 사람에게 하루 1회 묶어서 알림. 정렬 = Asker’s pick → Helpful 많은 순 → 오래된 순. 7일이 지나면 새 답을 막고 피드에서 내린다(질문자에게는 계속 보임). 신고 = 7.3과 같은 흐름(대상이 질문 · 답).
- 이동: 답 작성자 → 4.5 · 뒤로 → Back.

---
