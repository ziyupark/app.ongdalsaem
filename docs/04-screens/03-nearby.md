# Screens 03 · Community · Nearby

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 03 Community · Nearby — [섹션 59:2363](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2363)

탭바에는 Discover가 없다. **내 동네 탐색 = Community의 Nearby 탭**(Global · **Nearby** · Following). TabBar 활성 = Community.

### 3.1 Community · Nearby — [19:663](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=19-663)
- 목적: **내 위치 근처**에서 지금 날씨에 올라온 요리 탐색 + 동네 질문. 세로 스크롤(프레임 390×1148).
- 블록:
  1. [A] **Mood wash** — 홈과 같은 현재 날씨 무드 그라데이션(390×420, [§2.4](../01-foundations.md)). 날씨가 바뀌면 같이 바뀐다.
  2. StatusBar → TopBar(Large) "Community"(4.1과 같은 상단)
  3. 탭: Global · **Nearby**(active) · Following — 4.1과 같은 Block · Tabs
  4. **Weather now**(좌우 20, 위 12, 아래 4) — 카드 가로, glass/surface, radius 16, padding 12 16, gap 12: 현재 날씨 아이콘 28(`cloud-rain`, 1.6) · "Light rain · 12°"(Body/M Strong) / "Mapo, Seoul · right now"(Caption fg/muted) ··· "H 14° · L 8°"(Caption Strong fg/muted).
     - **현재 내 위치 기준**이고 화면을 스크롤해도 TopBar 아래에 **고정(sticky)**된다. 앱이 다시 열리거나 15분이 지나면 새로 조회.
  5. 검색바 placeholder "Dishes, ingredients, moods"(`search`)
  6. 지역 칩(가로 스크롤): **All**(Selected) · Within 1 km · Mapo-gu · Same weather · …
  7. **Neighborhood questions**(gap 10): **Ask the neighborhood** 줄(bg/subtle + border/default, radius 16, `message-circle` 20 · "Ask your neighbors about food…" fg/muted) → **Question Card** 1개(사진 끔) — 가장 최근 · 답이 적은 질문 먼저.
  8. 컨텍스트 라인 "Cooked near you on days like this"
  9. **Food Card Grid 2열**(각 카드: 사진 + 좌하단 Weather Tag · 우하단 Acorn Tag, 제목 1줄 말줄임, 태그 "Cozy · Dinner"). 태그 값: Sujebi `cloud-rain` 12° · 128 / Pajeon `cloud-rain` 11° · 96 / Miso ramen `cloud` 13° · 74 / Hotteok `cloud-drizzle` 10° · 52:
  - Sujebi, hand-torn — Cozy · Dinner / Pajeon & makgeolli — Rainy · Snack / Miso ramen at home — Warm · Dinner / Hotteok — Sweet · Snack
- 이동: Ask 줄 → **3.7** · Question Card → **3.8** · 검색바 → **3.4** · 지역 칩 Within 1 km → **3.6**(다른 칩도 같은 필터 화면 구조) · 근처에 게시물이 없으면 3.2 · 카드 → 7.1 · Global 탭 → 4.1 · Following 탭 → 4.4 · `bell` → 2.8 · 탭바(+FAB).

### 3.2 State · Nearby is empty — [76:2978](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-2978)
- 노트: *First-of-its-kind framing: invites sharing instead of apologising.*
- 3.1 상단 동일(Nearby active). Weather now = "Light snow · −2°" / "Daegu · right now" / "H 0° · L −5°"(`cloud-snow`), Mood wash = snow 톤.
- 빈 상태: 일러스트/아이콘 → "Be the first table in this snow" → "Nobody near Daegu has shared a dish in today’s weather yet. Yours could start it." → Button Primary M "Share a dish" → 8.1.

### 3.3 State · No results — [76:3114](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3114)
- 노트: *Suggest neighbouring weather/mood tags so the search never dead-ends.*
- 블록: 3.1 상단(탭 · Weather now) → 검색바 값 "durian soup in snow" → 빈 상태 "Nothing yet for that one" / "Try a nearby mood or weather — people often search these together." → 추천 칩(아이콘): Snowy · Cozy · Soup · Spicy → 탭 시 해당 필터로 3.1.

### 3.4 Search · Typing — [351:7294](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=351-7294)
- 3.1 검색바를 탭하면 연다. 검색바 = Focus(1.5 border/focus), 값 "kimch", Clear `x`. 키보드가 올라오므로 TabBar는 숨김.
- **SUGGESTIONS**(박스, 행 52): `search` 18 · 일치 부분 굵게(**kimch**i jjigae) · 오른쪽 "24 near you"(Caption) — kimchi jjigae · kimchi pancake · kimchi fried rice. 입력 1글자마다 갱신(250ms 디바운스), 요리명 → 재료 → 무드 순.
- **RECENT**: `clock` · "sujebi" · "rainy day soup" · 행 끝 `x`(하나 지우기). 최근 10개, 기기에만 저장.
- 힌트 "Search dishes, ingredients or moods near you. Nothing matches? We’ll suggest weather and mood tags."
- 이동: 제안 행 / Return → **3.5** · 결과 0개 → 3.3 · Clear → 입력 비움 · 뒤로(취소) → 3.1.

### 3.5 Search results · kimchi jjigae — [351:8143](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=351-8143)
- 3.1 레이아웃 그대로, 검색바 값 "kimchi jjigae"(Clear). 컨텍스트 "24 dishes near you · best in light rain first".
- Food Card Grid: Kimchi jjigae for one(Cozy · Dinner, `cloud-rain` 12° · 95) · Budae jjigae for four(Together · Dinner, `cloud-drizzle` 11° · 74) · Kimchi sundubu(Comforting · Lunch, `cloud-rain` 10° · 61) · Tuna kimchi jjigae(Cozy · Late, `cloud` 13° · 38).
- 정렬: 현재 날씨와 같은 날씨에 올라온 것 먼저 → 거리 → 도토리. 지역 칩으로 더 좁힐 수 있다.
- 이동: 카드 → 7.1 · 검색바 → 3.4.

### 3.6 Nearby · Within 1 km — [351:8336](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=351-8336)
- 지역 칩 필터 예시: **Within 1 km** Selected(All은 Default). 컨텍스트 "6 dishes within 1 km · closest 120 m".
- 카드 바이라인 = 거리 · 끼니(120 m · Dinner, 350 m · Snack, 600 m · Dinner, 900 m · Snack). 거리 = 게시물 위치(9.5 정밀도 기준 중심점)와 내 위치.
- 다른 칩: Mapo-gu = 구 단위, Same weather = 지금 내 날씨와 같은 날씨로 올라온 근처 게시물. 칩은 하나만 선택.
- 이동: All → 3.1 · 카드 → 7.1.

### 3.7 Ask the neighborhood — [469:11315](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-11315)
- 섹션 04c의 NEIGHBORHOOD QUESTIONS에 있다. 3.1 Ask 줄에서 연다(푸시, TopBar Inline "Ask the neighborhood").
- 블록(좌우 20, gap 20): **Area shown** pill(`map-pin` · "Your area shows as Mangwon-dong" + **Change** 작은 pill(bg/default, fg/accent) → 9.5) → 질문 칸(bg/subtle, focus 테두리, radius 16, Body/L, 예시 "Is there a place near the market that still does kalguksu after 9 PM?") + 아래 줄 **Photo**(`camera`, 선택 1장) ··· "71 / 200" → **What kind of question?** Chip: **Where to eat**(Selected) · Recipe help · Ingredients · Market & deals · Other → 안내 박스(bg/accent-subtle, Caption fg/secondary) "Neighbors near you see this — never your exact location. Questions stay up for 7 days. No names, phone numbers or addresses of people."
- [고정] Button Primary L **Post question**(y 744, 01과 같은 위치) → 3.8.
- 규칙: 5–200자, 카테고리 1개 필수. **보이는 장소 이름 = 9.5 Shared precision**(동네 → "Mangwon-dong", 도시 → "Seoul", 나라 → "Korea"). pill 문구도 그 값을 보여 준다. **누가 보는지**는 장소 이름과 별개로, 질문할 때의 위치를 약 5 km 칸(geohash 5자리)으로 줄여 서버에만 저장하고 같은 약 20 km 범위 사람에게 보여 준다. 정확한 위치와 칸 값은 누구에게도 보이지 않는다(DB question_areas, ask_question · nearby_questions). 위치가 꺼져 있으면 3.7 대신 **3.7b**.

### 3.7b State · Location off — [502:12559](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=502-12559)
- 위치를 끈 상태에서 Ask the neighborhood를 눌렀을 때. 3.7 상단 그대로, 본문: 72 원 `map-pin` 30 → "Turn on location to ask neighbors"(Title/L) → "We only use a rough area to find people near you. Your exact location is never shown."(Body/S, 가운데).
- [고정] Button Primary L **Turn on location**(y 744) → **9.5**(Use location 스위치). 켜고 돌아오면 3.7.

### 3.8 Question · Kalguksu after 9 PM — [469:11388](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-11388)
- TopBar Inline "Question". **Question Card**(사진 켬) → **4 ANSWERS**(Overline) → 답 행 ×3: 아바타 32 · 이름 Body/S Strong · 동네 · 시간 Caption · (질문자가 고른 답) **Asker’s pick** 배지(bg/done-subtle, `check` 12 fg/done + 글자 fg/default) → 답 Body/M → `thumbs-up` 16 "Helpful · 12".
- [고정] **Comment Composer** "Answer Minji…".
- 규칙: 답 ≤500자. 질문자는 답 하나를 Asker’s pick으로 고른다(바꿀 수 있음). Question Card의 **Me too**(`users`) = 나도 같은 게 궁금함 — 질문이 위로 올라가고 답이 달리면 나에게도 알림, 질문자에게는 알림 없음. 답의 **Helpful**(`thumbs-up`) = 이 답이 도움 됨 — 답 정렬에 쓰고 답한 사람에게 하루 1회 묶어서 알림. 정렬 = Asker’s pick → Helpful 많은 순 → 오래된 순. 7일이 지나면 새 답을 막고 피드에서 내린다(질문자에게는 계속 보임). 신고 = 7.3과 같은 흐름(대상이 질문 · 답).
- 이동: 답 작성자 → 4.5 · 뒤로 → Back.

---
