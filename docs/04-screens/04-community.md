# Screens 04 · Community

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 04 Community · Global — [섹션 59:2365](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2365)

섹션 안 배치(라벨 기준, 화면 종류별):
- **MAIN** — 4.1 Community · Global(탭 화면). Global · Nearby · Following 탭은 같은 개념이라 탭 화면은 4.1 하나로 대표하고, Nearby(3.1)·Following(4.4)은 각자 섹션에 둔다.
- **TEMPLATES** — 4.2 Tag · #Comfort (template) · 4.3 Country · Japan (template). 명절 페이지(Halloween · Christmas …)는 **4.2 태그 템플릿에 날짜 헤더를 켠 것**이다. 같은 종류의 다른 페이지(#Spicy, #Vegan, Italy, Christmas …)는 **이 템플릿에 데이터만 바꿔** 쓴다.

세 템플릿은 일부러 모양을 다르게 했다(같은 Food Card Grid를 쓰지만 헤더가 다름):
| | 태그 4.2 | 나라 4.3 |
|---|---|---|
| 헤더 오버라인 | 없음 | 없음(현지 시각은 Local now 칸) |
| 고유 블록 | **COOKED IN N COUNTRIES** 나라 해시태그 칩(#Korea … +13) — 이 태그가 어느 나라에서 요리되는지 | **Local now** 3칸(현지 시각 · 날씨 · 지금 식탁의 끼니) + **SIGNATURE DISHES** 해시태그 칩 |
| 탭 | Popular · Latest · Near me | Popular · Latest · Same weather |

### 4.1 Community · Global — [19:818](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=19-818)
- 목적: **전 세계** 식탁. 세로 스크롤.
- 블록:
  1. StatusBar → TopBar(Large) "Community"
  2. 탭: **Global**(active) · Nearby · Following
  3. **Landscape 칩**(가로 스크롤): **All**(Selected) · Forest · Sea · Lake · Mountain · Countryside · City — 나라가 아니라 **그 요리를 먹은 곳의 풍경**으로 거른다. 칩을 바꾸면 아래 섹션 전체가 그 풍경의 게시물로 바뀐다(화면 이동 없음).
  4. SectionHeader("Trending by Country", action 없음, Eyebrow 없음) + **Country Card** 가로 스크롤 ×3 — 사진 **좌상단(12, 12)에 국기 Flag Tag**(높이 24 = Weather Tag L) · 아래 Title · Weather Tag · Acorn Tag:
     - "Oyakodon tonight" 🇯🇵 (`cloud` 14° · 87)
     - "Panzanella at noon" 🇮🇹 (`sun` 22° · 64)
     - "Elote by the street" 🇲🇽 (`sun` 27° · 112)
  5. **Group · Food challenges** — SectionHeader("Food challenges", "See all") + **Challenge 카드** 가로 스크롤 ×4(각 220×252, radius 24, **카드 전체 = Mood 그라데이션**, padding 16, 세로 정렬):
     - 위 줄: **Flag Tag**(국기) ··· 남은 기간 pill(bg/subtle 72%, Caption Strong; 진행 중이면 앞에 6px 점 fg/accent)
     - 아래로 몰아서: 제목 **Title/L 2줄**(fg/default) → 규칙 한 줄 Body/S fg/secondary → 아래 줄: 참여자 아바타 3개 겹침(24, 흰 테두리 2) + "2,830 cooking"(Caption Strong) ··· **Join** 36 원 버튼(bg/primary + `plus` 18 fg/on-primary)
     - 데이터: 🇰🇷 3 days left(진행 중) **Midnight Ramyeon Hack** "One leftover from the fridge. That’s the rule." 2,830 cooking (Mood/rain) · 🇯🇵 5 days left **Onigiri Shape-Off** "Triangle, bear or cloud — the cutest wins." 1,240 (Mood/cloudy) · 🇮🇹 1 week left **Pasta in 15** "One pan. Fifteen minutes. No shortcuts." 968 (Mood/clear) · 🇲🇽 Starts Fri **Taco by the Weather** "Fill it with whatever the sky asks for." "Be the first"(아바타 없음) (Mood/heat)
     - 규칙: 챌린지 = 기간이 정해진 나라별 해시태그 이벤트(운영자가 만듦). 카드 탭 · Join → **4.10 Challenge 상세**(참여는 상세에서). 남은 시간 72시간 미만이면 상세에 **Closing soon** 배지. 유행 밈을 쓸 때는 상표·캐릭터·노래 가사를 제목에 쓰지 않는다.
  6. **Group · Trending tags**(트렌딩 태그와 그 태그의 게시물을 **한 묶음**으로): SectionHeader(title **"Trending tags"**, action "See all" → 선택한 태그의 4.2, Eyebrow 없음) → 칩(아이콘) 가로 스크롤 **Comfort**(Selected) · Spicy · Korean · Dessert · Healthy · **Vegan**(`leaf`) · Street Food · Kids → Food Card Row ×2: "DINNER · 10° / Doenjang soup with tofu / Jae · Daejeon · 2h ago", "LATE · 8° / Ramyeon with an egg drop / Sora · Incheon · 3h ago" → Caption fg/muted "Pick a tag above — these dishes change with it."
  7. **FESTIVE TABLES** / "Holidays around the world" + **Festive 카드** 가로 스크롤 ×5(각 카드 = Mood 그라데이션 배경, 글자 fg/default):
     - "OCT 31 · TOMORROW" Halloween — Pumpkin soup, soul cakes
     - "DEC 25" Christmas — Roast, stollen, bûche
     - "HARVEST MOON · 15TH OF 8TH LUNAR MONTH" Chuseok — Songpyeon, jeon, galbi-jjim
     - "LUNAR NEW YEAR" Seollal — Tteokguk for a new year
     - "FESTIVAL OF LIGHTS" Diwali — Sweets, dal, samosa
     - 순서 = 오늘에서 가까운 명절부터(지난 명절은 맨 뒤로). 7일 이내면 "TOMORROW / IN 3 DAYS" 표시.
  8. SectionHeader("Story of the day") + Story Card: "Oyakodon, Aoi’s way / Egg and onion simmered for a grey afternoon / Aoi · Osaka · 2h ago"(카드 Eyebrow · Focus 라벨 숨김), 태그 `cloud` 14° · 87. 아래 Tab bar 여백 120.
  9. TabBar(Community active, CreateFAB)
- 동작: 태그 칩 Selected 변경 시 같은 묶음(6번)의 제목과 카드가 그 태그로 바뀐다(화면 이동 없음). Row 카드·Story 사진 → 7.1.
- 이동:
  - Nearby 탭 → 3.1 · Following 탭 → **4.4**
  - Country Card → **7.1 Post detail**(그 나라 사람이 올린 게시물). 카드의 `#Japan` 칩 → 4.3(구현 시. 프로토타입은 카드 전체 → 7.1)
  - Trending tags "See all" → **4.2 템플릿**(선택한 태그) · 칩 탭 = 같은 화면에서 전환
  - Challenge 카드(Join 포함) → **4.10**(그 챌린지) · Food challenges "See all" → **4.9**
  - Festive 카드 ×5 → **4.2 템플릿**(명절 태그 `festive:halloween` 등, 날짜 헤더 "OCT 31 · HALLOWEEN · TOMORROW" 켬)
  - Story Card의 요리사(Byline·Avatar) → **4.5**

### 4.2 Tag · #Comfort (template) — [182:5020](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=182-5020)
- **태그 페이지 템플릿**(#Spicy · #Vegan · #Korean … 모두 이 화면). TopBar "#Comfort" → "Grey days, / warm bowls." / "1,870 dishes · most shared on cloudy evenings" → **COOKED IN 18 COUNTRIES** + 해시태그 칩 #Korea · #Japan · #Italy · #Mexico · #Thailand · "+13" → 탭 Popular · Latest · Near me → Food Card Grid:
  - Doenjang soup with tofu (Comfort · Dinner, `cloud` 10° · 92)
  - Ramyeon with an egg drop (Comfort · Late, `cloud-drizzle` 8° · 77)
  - Miso soup & rice (Comfort · Breakfast, `cloud-rain` 11° · 58)
  - Rice, egg & soy (Comfort · Lunch, `cloud` 12° · 41)
- 식단 태그(#Vegan 등)도 같은 템플릿. 데이터만 바꾼다(헤더 문장 예: "Plants, warm / and filling.").
- 이동: 나라 칩 → 4.3(템플릿) · "+13" → 같은 줄에서 나머지 나라 칩 펼치기 · 카드 → 7.1 · 뒤로 → BACK.
- **명절 헤더 옵션**: 명절 태그일 때만 제목 위 Overline "OCT 31 · HALLOWEEN · TOMORROW"(날짜 · 명절 · D-day)와 고유 블록 **CELEBRATED IN** 나라 칩을 켠다. 작성 시 날짜가 명절 ±3일이면 8.3에서 태그 제안. 사진은 라이선스 확인된 것만, 캐릭터 그림 금지.

### 4.3 Country · Japan (template) — [182:5165](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=182-5165)
- **나라 페이지 템플릿**. TopBar "Japan" → "Grey afternoon, / slow simmer." / "14° cloudy now · 1,204 dishes this week" → **Local now** 3칸: "Osaka now 6:40 PM" · "Weather 14° cloudy" · "On tables Dinner" → **SIGNATURE DISHES** 칩 #Ramen · #Donburi · #Miso · #Okonomiyaki → 탭 Popular · Latest · Same weather → Food Card Grid:
  - Oyakodon, Aoi’s way (Dinner · Osaka, `cloud` 14° · 87)
  - Miso butter corn ramen (Late · Sapporo, `cloud-snow` −4° · 141)
  - Tamago donburi (Lunch · Kyoto, `cloud` 15° · 66)
  - Shoyu ramen, jammy egg (Late · Otaru, `cloud-snow` −3° · 60)
- 바이라인 = 끼니 · 도시. 이동: Signature 칩 → 4.2(템플릿) · 카드 → 7.1 · 뒤로 → BACK.

---

## 04b Community · Following — [섹션 353:2866](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=353-2866)

팔로우한 사람과 관련된 화면 묶음(Following 탭 · 요리사 프로필 · 요리사 목록 · 메시지).

### 4.4 Community · Following — [183:5713](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=183-5713)
- 4.1과 같은 상단(TopBar Large "Community", 탭 Global · Nearby · **Following** active). 국가 칩 없음. 세로 스크롤.
- Block · following feed:
  - SectionHeader "From people and tables you follow"(Eyebrow 없음)
  - **Your tables** 줄(좌우 20, 아래 16, gap 8, 가로 스크롤): 내가 들어간 테이블 pill(사진 24 원 + `#SoloMeals` Caption Strong, bg/subtle + border/default, radius 999) ×N → 마지막 **Browse tables**(`plus` 16, border/strong) → 4.7.
  - **Feed filter** 칩 줄(좌우 20, 아래 16, gap 8): **All**(Selected, 기본) · People · Tables. All = 팔로우한 사람 + 들어간 테이블 게시물, People = 팔로우한 사람만, Tables = 들어간 테이블 게시물만. 칩은 같은 화면에서 바뀐다(마지막 선택을 기억). Tables를 골랐는데 들어간 테이블이 없으면 **4.4c**.
  - 테이블에서 온 게시물 위에 **Table source** 줄(좌우 20, 아래 8): `utensils` 14 fg/muted + "from #SoloMeals"(Caption Strong fg/muted) → 4.8b. 팔로우한 사람이 테이블에 올린 글은 사람 글로 한 번만 나오고 source 줄을 붙인다.
  - 섞는 규칙: 시간순, 단 같은 테이블 글이 3개 이상 연달아 나오지 않게 뒤로 미룬다. **Suggested for you**는 게시물 5개 뒤에(목업은 2개 뒤).
  - **Feed Post ×2**([§3.3](../02-components.md)):
    - aoi.sapporo · Sapporo · 20m · ramen1 · `cloud-snow` −4° · 도토리 108 · 💬21 · "Miso butter corn ramen at 11 PM. The snow can wait."
    - hana.kitchen · Suyeong, Busan · 2h · bibimguksu · `sun` 22° · 도토리 54 · 💬7
  - SectionHeader "Suggested for you" / See all(게시물 5개 뒤)
  - **Cook card ×3** 가로(각 FILL, radius 24, bg/subtle + border/default, padding 16 8 14): Avatar 56(이니셜) → 이름 Body/S Strong → 설명 Caption(1줄 말줄임) → Button Outline S "Follow"(FILL). 데이터: kenji.eats (Otaru · ramen), luca.cucina (Rome · pasta), sol.mx (Oaxaca · street food)
  - Tab bar spacer 96
- 이동: Global → 4.1 · Nearby → 3.1 · 테이블 pill → **4.8b** · Browse tables → **4.7** · "From people and tables you follow" 헤더 → **4.6** · 게시물 헤더 → 4.5 · 사진 → 7.1 · 댓글 → 7.2 · Suggested "See all" → **4.6** · Cook card 아바타 → 4.5 · Follow → 그 자리에서 "Following"(Secondary)으로 바뀜 · 아무도 팔로우하지 않으면 **4.4b**.

### 4.4b State · Following is empty — [352:7679](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=352-7679)
- 4.5와 같은 상단(Following active). 피드 대신 빈 상태: 72 원 bg/muted + `users` 30 → "Your table is empty"(Title/L) → "Follow cooks whose food fits your weather — their dishes will show up here."(Body/S) → Button Primary M **Find cooks** → 4.6.
- 그 아래 "Suggested for you" Cook card ×3(4.5와 같음, See all → 4.6).

### 4.4c State · No tables yet — [486:11553](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=486-11553)
- 4.5에서 **Tables** 칩을 골랐는데 들어간 테이블이 없을 때. 4.4 상단 + Feed filter(Tables Selected) 아래 빈 상태: 72 원 bg/subtle + `utensils` 30 → "No tables yet"(Title/L) → "Join a table to see dishes about cooking for one, rainy days and more — right here."(Body/S, 가운데) → Button Primary M **Browse tables** → 4.7.

### 4.5 Cook profile · Aoi — [183:6092](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=183-6092)
- **다른 사람 프로필**(6.1 레이아웃 재사용). TopBar(Inline) "aoi.sapporo" → Profile Header(Tab=Dishes):
  - Top row Weather now pill "Cloudy · 14° · Osaka" → Name "Aoi" / Handle "@aoi.sapporo · Osaka" / 도토리 pill `acorn-color` "1,204 acorns" → Bio "Japanese home food for grey afternoons." → 탭 **Dishes 86** · Saved · Diary
  - settings 아이콘과 Saved 탭은 **숨김**(본인에게만 보임)
  - **Show actions = On**: stats 아래·Dishes/Diary 탭 위에 Button Primary M "Follow"(Message 버튼은 숨김 — v1에 DM 없음)
- "acorns" 앞 아이콘 = **컬러 도토리**(`acorn-color`, 받은 도토리 수).
- 그 아래 Dish Tile 그리드 9칸(Acorn Tag Default — 보는 사람 기준) → Tab bar spacer. 태그 값(순서대로): `cloud` 14° · 87 / `cloud-snow` −4° · 108 / `cloud` 15° · 66 / `cloud-rain` 13° · 54 / `sun` 18° · 49 / `cloud-drizzle` 11° · 41 / `cloud-sun` 16° · 37 / `cloud` 12° · 30 / `wind` 9° · 22. TabBar(Community active, CreateFAB 포함).
- 이동: 타일 → 7.1 · Follow → 그 자리에서 "Following"(Secondary) · 뒤로 → 이전 화면 · TabBar.

### 4.6 Cooks in your weather — [352:8601](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=352-8601)
- **요리사 추천 + 팔로우 관리를 한 화면에서.** 4.4 "From people and tables you follow" 헤더 · Suggested "See all" · 4.4b "Find cooks"에서 연다. TopBar(Inline) "Cooks in your weather"(뒤로).
- 안내 "People living in weather like yours right now — rain and 12° in Mapo."
- 목록 박스(bg/subtle, radius 16) — **Cook Row** ×5:
  - kenji.eats · Otaru · light snow −2° · 842 acorns · **Follow**
  - luca.cucina · Rome · drizzle 14° · 615 acorns · **Follow**
  - sol.mx · Oaxaca · showers 18° · 1,930 acorns · **Follow**
  - aoi.sapporo · Osaka · cloudy 14° · 1,204 acorns · **Following**(Secondary)
  - hana.kitchen · Busan · light rain 13° · 388 acorns · **Following**
- 숫자는 요리 개수가 아니라 **받은 도토리 수**(`acorn-color` 14).
- 캡션 "Sorted by how close their weather is to yours, then by acorns. Tap Following to unfollow — they won’t be notified."
- 정렬: 지금 그 사람이 사는 곳의 날씨가 내 날씨와 가까운 순(같은 날씨 무드 → 기온 차 ±3° → 시차) → 받은 도토리. 이미 팔로우 중인 사람도 같은 목록에 Following으로 섞여 나온다. 차단한 사람 제외.
- 이동: 행 → 4.5 · Follow ↔ Following 그 자리에서 토글(Undo 토스트).

---

## 04c Community · Tables, Questions & Challenges — [섹션 467:9853](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=467-9853)

같이 쓰는 공간 3가지. 섹션 안 라벨: **TABLES** · **NEIGHBORHOOD QUESTIONS**(3.7 · 3.8은 [03-nearby](03-nearby.md)) · **FOOD CHALLENGES**. (Eat together 4.23은 [99-removed-in-v1](99-removed-in-v1.md)) 새 컴포넌트 **Question Card** [469:10124](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-10124)([02-components](../02-components.md)).

| 기능 | 무엇 | 들어가는 곳 | 쌓이는 곳 |
|---|---|---|---|
| **Tables** | 주제로 모이는 공간(#SoloMeals · #RainyDayFood · #KidsTable · #PlantBased · #CampCooking · #LunchBox). 운영자가 만들고 누구나 Join | 4.4 Browse tables · 4.2 태그 페이지(구현 시 "Open table") | 들어간 테이블 게시물이 **Following**에 |
| **Neighborhood questions** | 동네 사람에게 짧게 묻기(≤200자, 7일 뒤 닫힘) | 3.1 Ask 줄 | 3.1 피드 · 3.8 상세 |
| **Food challenges** | 기간 · 참여자 · 사진 인증 | 4.1 Food challenges 카드 | 4.10 Latest entries |

### 4.7 Tables · Browse — [467:9855](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=467-9855)
- 푸시(TopBar Inline "Tables", 뒤로). 세로 스크롤 975. TabBar(고정).
- 블록(좌우 20, gap 24): 안내 "Join a table to see its dishes and questions in Following."(Body/S fg/secondary) → Search Field "Search tables" → **YOUR TABLES · 2**(Overline — 개수 정보라 유지) + 테이블 pill 2개(사진 40 radius 12 · 이름 Body/S Strong · "3 new today" Caption fg/accent, 각 FILL) → **POPULAR TABLES** + 목록 박스(bg/subtle radius 16) **Table Row** ×6: 사진 56 radius 16 · 이름 Title/S · 설명 Caption fg/secondary · "12.4k members · 20 posts today" Caption fg/muted · Button S(들어간 곳 = Secondary "Joined", 아니면 Outline "Join").
- 데이터: #SoloMeals 12.4k(Joined) · #RainyDayFood 8.1k(Joined) · #KidsTable 6.3k · #PlantBased 9.7k · #CampCooking 3.2k · #LunchBox 5.5k.
- 정렬: 들어간 곳 위 → 오늘 게시물 수. 검색 = 이름 · 설명 부분 일치.
- 이동: pill · Joined 행 → **4.8b** · 나머지 행 → **4.8** · Join 버튼 = 그 자리에서 Joined로(구현 시) · 뒤로 → Back.

### 4.8 Table · #SoloMeals — [467:11159](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=467-11159)
- 사진 Hero 390×240(+ Gradient/Photo scrim), StatusBar Light · 뒤로 Glass 버튼(20, 56) 고정. Hero 안 왼쪽 아래(20, 150) "#SoloMeals"(Display/M, fg/on-photo) / "Cooking for one, no leftovers."(Body/M, fg/on-photo-secondary)
- **Meta** 줄: 아바타 3개 겹침(28) · "12.4k members" / "86 posts today · hosted by ongdalsaem" · Button Primary M **Join**.
- **Table rules** 박스(bg/subtle radius 16, `book-open` 20 · 한 줄 규칙 · `chevron-right`): "Table rules · one-person portions, share what you’d cook again." → 탭하면 규칙 전체(시트, 구현 시).
- Food Card Grid(4.4와 같은 카드): Rice, egg & soy · Miso soup for one · One-pan kimchi rice · Tea and toast, 10 PM.
- 탭 없음(Dishes만). 규칙 줄 탭 → 규칙 시트(소개 · 규칙 · Leave table — 개발 단계에서 구현).
- 이동: Join → **4.8b** · 카드 → 7.1 · 뒤로 → Back.

### 4.8b Table · Joined — [467:11321](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=467-11321)
- 4.21과 같고 Join → **Joined**(Secondary). Toast "You joined #SoloMeals — its posts now show up in Following." + 오른쪽 아래 **CreateFAB "Post to table"**(→ 8.1, 공유할 때 이 테이블이 미리 선택됨).
- 규칙: 테이블에는 **들어간 사람만** 자기 요리를 올린다(DB table_posts). 나가기 = Joined 탭 → 확인 시트. 차단한 사람의 게시물은 보이지 않는다.

### 4.9 Food challenges · All — [484:10315](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=484-10315)
- 4.1 Food challenges "See all"에서 연다. 푸시(TopBar Inline "Food challenges", 뒤로).
- 묶음(Overline 라벨 + 목록 박스 bg/subtle radius 16) 순서: **YOU’RE IN** → **RUNNING** → **STARTING SOON** → **ENDED**. 빈 묶음은 숨긴다.
- **Challenge Row**: 썸네일 56(radius 16, 그 챌린지 Mood 그라데이션 + 가운데 Flag Tag, 끝난 것은 50%) · 제목 Title/S(+ **Closing soon** 배지 bg/accent-subtle · fg/accent, 72시간 미만) · 메타 Caption fg/muted · `chevron-right`.
- 데이터: YOU’RE IN — Midnight Ramyeon Hack "2d 22h left · 2,830 cooking"(Closing soon) / RUNNING — Onigiri Shape-Off "5 days left · 1,240 cooking", Pasta in 15 "1 week left · 968 cooking" / STARTING SOON — Taco by the Weather "Starts Fri · Join now, post from Friday" / ENDED — Pancake Sunday "Ended Oct 25 · 742 entries".
- 아래 안내 "Challenges are made by ongdalsaem and last 3–14 days. Post one public dish with the tag while it runs."
- 이동: 참여 중 행 → **4.10b** · 진행 중 · 곧 시작 → **4.10** · 끝남 → **4.10c** · 뒤로 → Back.

### 4.10 Challenge · Midnight Ramyeon Hack — [470:10224](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=470-10224)
- 4.1 Challenge 카드(Join 포함)에서 연다. 세로 스크롤 923.
- **Hero**(4.1 카드와 같은 Mood 그라데이션, 위 56 · 좌우 20 · 아래 24, gap 12, 제목 · 설명 모두 fg/default — 그라데이션 위 fg/secondary는 대비 부족): 🇰🇷 Flag Tag · **Closing soon** 배지(bg/default, fg/accent) → "Midnight Ramyeon Hack"(Display/M) → "One leftover from the fridge. That’s the rule. Post a photo before the clock runs out." → 3칸 **Ends in 2d 22h** · **Cooking 2,830** · **Entries 1,104**(bg/default radius 12, Title/M + Caption).
- 본문(좌우 20, gap 24): 참여자 아바타 4개 + "Aoi, Kenji and 2,828 others are cooking" → **How it works** = 7.1 재료 목록과 같은 **Ingredients List** 인스턴스(Title/L 제목 + Ingredient Row, 행 사이 border/default 선, 남는 행 숨김): **Join** · Shows up on Home / **Cook** · Ramyeon + one leftover / **Post** · One photo · #MidnightRamyeon → **Latest entries** 1,104 + 사진 3열 그리드(111, radius 12).
- [고정] 하단 CTA 바(위 border, 112 = 위 16 · 버튼 56 · 아래 40): Button Primary L **Join challenge** → **4.10b**.
- 상태 배지: 시작 전 "Starts Fri"(Join 가능, 사진 올리기는 시작 후) · 진행 중 · **Closing soon**(< 72h) · 끝남 "Ended — see the entries"(CTA 숨김). DB `challenge_cards.phase`.

### 4.10b Challenge · Joined — [470:11467](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=470-11467)
- 4.22에 **Your progress** 박스(bg/done-subtle, `check`(fg/done) · "You’re in"(fg/default) · "Post one photo with #MidnightRamyeon before Sunday 11:59 PM.")가 본문 맨 위에 추가. CTA = **Post my entry** → **8.1**(태그 #MidnightRamyeon 미리 붙음).
- 인증 = 기간 안에 공유한 **공개 게시물 1개 이상**(DB challenge_entries). 올리면 박스가 "Entry posted · see it in Latest entries"로 바뀐다. 끝나면 홈에서 사라지고 프로필 다이어리에 기록.

### 4.10c Challenge · Ended — [502:12476](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=502-12476)
- 끝난 챌린지(4.9 ENDED 행에서 연다). 4.22와 같은 구조, Hero = 그 챌린지 Mood 그라데이션.
- "Pancake Sunday" · 배지 **Ended Oct 25**(bg/default, fg/secondary) · "Any pancake, sweet or savory — Sunday only. Thanks to everyone who cooked." → 2칸 **742 Entries** · **1,020 Cooked**.
- 본문: "Aoi, Kenji and 1,018 others cooked" → **All entries** 742 + 사진 그리드. How it works와 하단 CTA 없음(참여 · 인증 불가).
- 끝난 챌린지는 90일 동안 목록에 남고, 내 인증은 프로필 다이어리에 계속 남는다.

### 2.1c Home · In a challenge — [484:11596](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=484-11596)
- 섹션 04c FOOD CHALLENGES 줄에 둔 **홈 상태 화면**(2.1 복제, 연결 같음). 챌린지에 들어가 있는 동안 홈 Story Card 위에 **Challenge Banner**가 생긴다.
- Challenge Banner(350 FILL, radius 16, 그 챌린지 Mood 그라데이션, padding 12, gap 12): Flag Tag · "Midnight Ramyeon Hack"(Body/S Strong) / "2d 22h left · post your entry"(Caption fg/default) · Button Primary S **Post**.
- 규칙: 참여 중인 챌린지가 여러 개면 끝나는 시간이 가까운 것 1개만(배너 탭 → 4.24에서 나머지). 인증을 올렸으면 "Entry posted · 2d 22h left"로 바뀌고 Post 버튼이 사라진다. 끝나면 배너도 사라진다.
- 이동: 배너 → **4.10b** · Post → **8.1**(태그 미리 붙음).
