# Screens 04 · Community

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 04 Community · Explore — [섹션 59:2365](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2365)

**탭 구성**: Community 탭 화면 하나에 밑줄 탭 **Explore · Following · Challenges** 3개. 예전 Global · Nearby는 **Explore 하나로 합쳤다**(Nearby의 동네 내용은 Explore의 "Our area" 섹션으로 옮김. Explore에는 검색창이 없다). Figma 4.1 · 4.4 · Challenges 프레임이 이 구성이다(공통 헤더 + 밑줄 탭).

섹션 안 배치(라벨 기준, 화면 종류별):
- **MAIN** — 4.1 Community · Explore(탭 화면) · 4.1 Community · Challenges(탭 화면) · 4.3-1 / 4.3-2 Special days around the world. Following(4.4)은 04b.
- **TEMPLATES** — 4.2 Tag · #Comfort · 4.3 Country · Japan. **앱은 v2 디자인**(Figma "4.2 Tag · #Comfort (v2)" [718:11114](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=718-11114) · "4.3 Country · Japan (v2)" [718:11248](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=718-11248)). 명절 페이지(Halloween · Christmas …)도 **4.2 태그 템플릿**에 그 명절 태그를 넣은 것이다. 같은 종류의 다른 페이지(#Spicy, #Vegan, Italy …)는 **이 템플릿에 데이터만 바꿔** 쓴다.

두 템플릿은 같은 뼈대(`CollectionParts`)를 쓰고 탭과 데이터만 다르다:
| | 태그 4.2 | 나라 4.3 |
|---|---|---|
| 제목 카드 오버라인 | "{태그} FOOD" | 국기 + 나라 이름 |
| 제목 카드 띠 | 이 태그가 가장 많이 공유된 날씨 | 대표 도시의 지금 날씨 · 같은 날씨 요리 먼저 |
| 탭 | Latest · Popular · By weather | All + 게시물 많은 도시 3곳 |
| 정보 알약의 날씨 | 내 날씨 | 고른 도시(All이면 1위 도시)의 날씨 |
| 그리드 순서 | 탭 기준 | 인기순, 지금 그 도시 날씨와 같은 요리 먼저 |

### 4.1 Community · Explore — [1113:25908](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1113-25908)
- 목적: **전 세계 식탁 + 우리 동네**. 세로 스크롤.
- 블록:
  1. **ScreenWash + ScreenHeader**(Home과 같은 무드 wash + 날씨 모션 · 로고 · `bell` · 날짜·위치 · 날씨 제목, [02-home](02-home.md) 공통 레이아웃 3 — Community는 오버라인 → 12 → 제목 → 12)
  2. **UnderlineTabs**: **Explore**(active) · Table · Challenges(왼쪽 20, 탭 간격 24, 아래 border/default 30 % 줄). 글자색은 wash 55 % 지점 잉크. 한 번 연 탭은 계속 마운트해 둔다(탭을 바꿔도 다시 불러오지 않음).
  3. 본문(1219:15437): 위아래 32, **섹션 사이 38**. 순서 = Story of the day → Popular today → Neighbourhood questions → Trending tags → Special days around the world. (Viral Bites · Explore Together는 Explore에 없다.)
  4. **Story of the day**(좌우 20, gap 16): Display/M 26 "Story of the day"(항상 영어, 읽기는 내 언어) → Story Card **350×420**(PhotoCard, padding 24, Card scrim): 오른쪽 위 **⋯**(fg/on-photo, 남의 글일 때 → 신고·차단) · 아래 Statement 요리 이름(2줄) → Body/M 설명(2줄) → Body/S "이름 · 도시 · 시간" + Avatar 40 → Weather Tag · Acorn Tag(도토리 토글). 탭 → 7.1.
     - 고르는 규칙: 최근 2일 · 캡션 있는 게시물 중 도토리 최다 → 없으면 최근 30일 → 그래도 없으면 최신 60개 중 도토리 최다(캡션 줄 생략). 섹션이 사라지지 않게 한다.
  5. **Popular today · Neighbourhood questions**(아래 "Our area")
  6. **Trending tags**(1113:25982, gap 16): SectionHeader "Trending tags" + ›(→ 선택한 태그의 4.2) → 태그 칩(아이콘) 가로 스크롤(좌우 inset 20, 게시물에 많은 무드 태그 6개, 첫 태그 Selected) → Food Card Row 최대 3개(그 태그 게시물).
  7. **Special days around the world**(1113:25999, gap 16): 제목 + ›(→ **4.3-1** 전체 목록) → **Festive Card** 168×196 가로 스크롤(gap 12, 좌우 inset 20), **가까운 명절 8개**. 카드 → 그 명절의 **4.3-2**.
  8. TabBar(Community, CreateFAB) — 바닥 여백 110 + 24.
- Food Card Row: 썸네일 80 · Overline "끼니 · 기온°" · 제목 · "핸들 · 도시 · 시간" · 북마크(저장 토글) · **⋯**(남의 글일 때 → 신고·차단).
- **⋯ 메뉴**(Story · Popular today · Question · Food Card): 7.3 ReportSheet — 신고(게시물 / 질문) · "{이름} 차단". 내 글에는 ⋯가 없다. 차단하면 화면 전체를 다시 불러오고, 차단한 사람의 글·질문은 RLS(`is_blocked_between`)로 모든 섹션에서 빠진다.
- 상태: Popular today · 질문은 불러오는 동안 스피너, 실패·없음이면 안내 문구(무한 로딩 없음). 게시물 목록이 실패하면 맨 위 LoadError(Try again).
- 위치 표시는 시 · 구까지(동 이름은 쓰지 않음).

#### 4.1 Our area — Popular today · Neighbourhood questions(4.1 1219:15435 · 1219:15436)
- 위치가 켜져 있을 때(두 섹션 사이 38):
  - **Popular today**(1113:25935, gap 12): SectionHeader "Popular today" + 오른쪽 범위 배지(구 · 도시 · "도시 · Last 3 days" · "날씨 · Recent") → 카드 최대 3개(gap 12).
    - 카드(1219:15520): bg/subtle, radius 2xl, padding 8 16, 최소 높이 108 — 사진 80 radius lg → [알약 overlay/scrim "I ATE THIS ・ {n}"(Overline · Body/S Strong, fg/on-photo) → (왼쪽 9 안쪽) Body/M Strong 요리 이름 · Caption fg/muted "도시 · 시간"] → ⋯. 탭 → 7.1. 없으면 Body/S fg/muted "No dishes shared nearby today yet."
    - 규칙: 공개 **게시물 단위**로 "I ate this" 수(`food_eaten_counts`) 많은 순 → 도토리 → 최신. 범위: 오늘 내 칸(geohash 5자리)과 주변 칸 → 오늘 같은 구 → 오늘 같은 도시 → 도시 최근 3일 → 같은 날씨 최근 7일 순으로 3개까지 채운다. Story of the day 게시물은 뺀다.
  - **Neighbourhood questions**(1113:25960, gap 16): SectionHeader + ›(→ 3.7 목록) → Question Card 최대 3개(gap 14) → Outline M `message-circle` **"Ask a question"**. 없으면 Body/S fg/muted "No questions nearby yet. Be the first to ask."
    - Explore Question Card(1113:25964): bg/subtle, radius 2xl, padding 16, gap 16 — Avatar 40 · Body/S Strong 이름 · Caption "구(또는 넓힌 범위) · 시간" · ⋯ → Body/L fg/secondary 질문 → 사진(있을 때, 318:395 비율, radius md) → [`message-circle` 24 + 답변 수 · 12 · `share` 24(시스템 공유: 질문 + 링크)] ··· **`bookmark` 24 = 질문 저장 토글**(채움 = 저장됨, 바로 바뀌고 실패하면 되돌림, DB question_saves). 카테고리 배지 · Me too는 없다(질문 카드 어디에도 없음 — 3.7 목록 · 3.8 상세 포함). 카드 → 3.8.
    - 규칙: 내 칸 질문이 3개 미만이면 주변 칸(한 단계 넓은 geohash) → 같은 구 → 같은 도시 → 최신 순으로 채운다. 넓혀서 가져온 질문에는 그 범위(구 · 도시) 라벨이 붙는다.
- 위치가 꺼져 있으면: 카드(bg/subtle + border/default, radius 2xl, padding 20, 가운데) `map-pin` 22 fg/secondary · Body/M fg/secondary "Turn on location to see today’s table in our area." · Button M "Allow location"(권한 요청 → 도시 저장).

### 4.3-1 Special days around the world — [724:11491](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=724-11491)
- 4.1 Special days 섹션의 더보기(`chevron-right`, 접근성 "See all holidays")에서 연다. 푸시, TopBar(Inline) "Special days around the world"(뒤로).
- 본문(좌우 20, 위 12): **Festive Card 2열 그리드**(gap 12, 카드 비율 168:196). **모든 명절 46개**를 다음 날짜가 가까운 순으로.
- 카드 → **4.3-2** 그 명절 페이지.

### 4.3-2 Special days around the world · {명절} — [1219:16713](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1219-16713)
- 4.3-1의 카드, 4.1 Special days 카드에서 연다(`app/holiday/[key]`). 4.2 Tag와 같은 틀.
- 블록: TopBar · Overlay(뒤로만) → **#명절** Display/XL(항상 영어, 예 "#Chuseok") → Group(위 22 · gap 16): Display/M "Special days around the world" → 사진 카드 350×400 가로 스크롤(그 명절 요리 중 도토리 1–3위) → 18 → **동그란 카테고리 = 그날 먹는 음식**(`community.holidays.<key>.food`를 나눈 것, 예 Songpyeon · Jeon · Galbi-jjim; 사진 = 그 음식 이름이 들어간 최신 게시물, 없으면 bg/muted 원) — 탭하면 그 음식으로 그리드를 거르고 다시 탭하면 해제 → 32 → Overline "LATEST · {음식}" → Dish Tile 2열 그리드(최신순) → TabBar.
- 데이터: 공개 게시물 중 **명절 태그가 붙었거나**(무드 태그 = 명절 키) **이름에 그 음식(내 언어 · 영어)이 들어간** 것, 최신 60개. 비면 EmptyState, 실패 = LoadError.

### Festive Card(4.1 · 4.3-1 공통)
- 168×196, radius xl(24), padding 16, gap 6. 배경 = 그 명절 **음식 사진**(`assets/holidays/food/`, 600×800) + 아래로 overlay/scrim-strong 그라데이션(35 %부터).
- 위 왼쪽 **배지 36 원**(glass/surface): 그 명절 나라 국기 20×14(radius 3), 세계 공통 명절(새해 등)은 `globe` 18. (Figma 카드 배지는 아직 아이콘 — 앱 기준은 국기)
- 아래로 몰아서: Overline fg/on-photo-secondary 날짜 "OCT 31"(오늘 · 내일이면 "· TODAY" / "· TOMORROW") → Title/M fg/on-photo 명절 이름 → Caption fg/on-photo-secondary 대표 음식(1줄).
- 명절 46개 목록·국기·사진은 `src/lib/holidays.ts`, 날짜(2026–2035)는 `src/lib/holidayDates.ts`(`npm run holidays:dates`로 생성: 음력 · 절기 · 부활절 · 요일 규칙 · 달 기준 명절 · 마타리키 법정일). 이름 · 음식은 9개 언어.

### 4.2 Tag · #Comfort (v2) — [826:14271](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=826-14271)
- **태그 페이지 템플릿**(#Spicy · #Vegan · 명절 태그 … 모두 이 화면). 세로 스크롤, 화면 무드 wash 위.
- 블록:
  1. **TopBar · Overlay**(높이 52, 좌우 12): 왼쪽 **뒤로**(IconButton Soft 40)만. 공유 버튼 없음.
  2. **#태그** Display/XL(항상 영어, 읽기는 내 언어) — padding 22 20 12.
  3. **Group**(위 22 · gap 16): Display/M 한 줄 제목(`tag.headlines.<태그>`, 없으면 "{태그}") → **사진 카드 350×400 가로 스크롤**(gap 6, 좌우 20, 넘김 = 카드 한 장씩) — 이 태그 **인기 게시물 1–3위**, 사진만(아래 잉크 scrim). 탭 → 7.1.
  4. 18 → **동그란 카테고리**(가로 스크롤, 좌우 20, gap 16): 사진 64 원 + Caption 라벨(gap 8). 이 태그 게시물에 함께 많이 붙은 무드 태그 최대 6개(지금 태그 제외), 사진 = 그 태그 첫 게시물. 선택 = 2px fg/accent 테두리 + 라벨 fg/accent. 탭하면 같은 화면에서 그리드를 거르고, 다시 탭하면 해제.
  5. 32 → Overline fg/muted **"LATEST · {카테고리}"**(카테고리를 고르지 않았으면 "LATEST") → 12 → **Dish Tile 2열 그리드**(좌우 20, 열 16 · 줄 20) — **최신순**. 비면 EmptyState "No #{tag} dishes here yet" / "Share one and it shows up here." 불러오기 실패 = LoadError(Try again).
  6. TabBar(Community active, CreateFAB) — 바닥 여백 110 + 24.
- 정렬 탭(Latest · Popular · By weather) · 정보 알약(내 날씨 · 요리 수) · 끼니 필터 시트는 없다.
- 이동: 사진 · 타일 → 7.1 · 뒤로 → BACK · TabBar.
- **명절 태그**도 같은 화면이다(명절 날짜 헤더 · CELEBRATED IN 칩은 없다).

### 4.3 Country · Japan (v2) — [718:11248](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=718-11248)
- **나라 페이지 템플릿**. 4.2와 같은 뼈대.
- 차이점:
  - 제목 카드: Overline = **Flag Tag + 나라 이름**("JAPAN") · 제목 = 지금 날씨별 문장(`country.headline.<날씨>`, 없으면 "Today’s tables in {나라}") · 띠 = "Now in Tokyo: Clear 18° · same-weather dishes first"(ko "지금 도쿄 맑음 18° · 같은 날씨 요리 먼저"; 날씨를 모르면 요리 수).
  - 탭: **All** · 그 나라 게시물이 많은 **도시 3곳**(예: Tokyo · Osaka · Kyoto). 도시를 바꾸면 카테고리 · 끼니 필터를 초기화.
  - 정보 알약: "Tokyo weather · Clear 18°" · "86 dishes"(고른 도시 기준, All이면 1위 도시의 날씨 · 나라 전체 수).
  - 카테고리: 고른 범위 게시물의 무드 태그 상위 6개.
  - 그리드: 인기순, **지금 그 도시 날씨와 같은 날씨의 요리를 먼저**(같은 무리 안에서는 인기순 유지). 섹션 제목 "{All 또는 도시} · {카테고리}". 비면 "No dishes from {나라} yet".
- 이동: 4.1 Trending Bites 카드 → 4.3 · 사진 · 타일 → 7.1 · 뒤로 → BACK.

---

## 04b Community · Following — [섹션 353:2866](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=353-2866)

팔로우한 사람과 관련된 화면 묶음(Following 탭 · 요리사 프로필 · 요리사 목록 · 메시지 4.11).

### 4.4 Community · Following — [183:5713](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=183-5713)
- 4.1과 같은 상단(ScreenHeader + 탭 Explore · **Following** · Challenges). 세로 스크롤.
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
- 이동: Explore → 4.1 · Challenges → 4.9 탭 · 테이블 pill → **4.8b** · Browse tables → **4.7** · "From people and tables you follow" 헤더 → **4.6** · 게시물 헤더 → 4.5 · 사진 → 7.1 · 댓글 → 7.2 · Suggested "See all" → **4.6** · Cook card 아바타 → 4.5 · Follow → 그 자리에서 "Following"(Secondary)으로 바뀜 · 아무도 팔로우하지 않으면 **4.4b**.

### 4.4b State · Following is empty — [352:7679](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=352-7679)
- 4.5와 같은 상단(Following active). 피드 대신 빈 상태: 72 원 bg/muted + `users` 30 → "Your table is empty"(Title/L) → "Follow cooks whose food fits your weather — their dishes will show up here."(Body/S) → Button Primary M **Find cooks** → 4.6.
- 그 아래 "Suggested for you" Cook card ×3(4.5와 같음, See all → 4.6).

### 4.4c State · No tables yet — [486:11553](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=486-11553)
- 4.5에서 **Tables** 칩을 골랐는데 들어간 테이블이 없을 때. 4.4 상단 + Feed filter(Tables Selected) 아래 빈 상태: 72 원 bg/subtle + `utensils` 30 → "No tables yet"(Title/L) → "Join a table to see dishes about cooking for one, rainy days and more — right here."(Body/S, 가운데) → Button Primary M **Browse tables** → 4.7.

### 4.5 Cook profile · Aoi — [183:6092](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=183-6092)
- **다른 사람 프로필** = 6.1과 같은 화면([06-profile](06-profile.md) 공통 헤더). 차이:
  - ScreenHeader 왼쪽이 **뒤로** 버튼, 오른쪽은 빈 자리(settings 없음). 날씨 줄은 **내 날씨**.
  - 카드에 상대의 아바타 · 이름 · @username · "Total acorns {n}" · 상태 메시지 → **Follow**(Primary M, 팔로우 중 = Secondary "Following") · **Message**(Outline M)를 나란히(각 FILL). Message → 대화를 열거나 만들어 **4.11**(상대가 팔로우한 사람만 받으면 "This cook only takes messages from people they follow.", 차단이면 "You can’t message this cook.")
  - 탭은 글자 탭 **"Dishes {n}"** 하나(Saved · Diary 없음).
  - Dish Tile 2열 그리드, Acorn Tag = 도토리 토글(내가 준 상태 기준).
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

### 4.11 Messages — 받은 대화함 · 대화(코드 기준, Figma 4.11 [352:9114](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=352-9114)는 99 Removed 섹션)
- **들어가는 곳**: 다른 요리사 프로필(4.5)의 **Message**뿐이다. 받은 대화함(`/messages`) 화면은 코드에 있지만 **여는 버튼이 지금 화면에 없다**. 요리 보내기 시트(7.5 Send to)는 파일만 남아 있고 어디서도 열지 않는다(게시물 Actions에 `send` 없음).
- **받은 대화함**: TopBar(Inline) "Messages" → 묶음(Overline + ListCard) **CONVERSATIONS** → **REQUESTS**(+ Caption "Requests are from cooks you don’t follow. Reply to accept — they can’t see that you read it until then."). 행 = Avatar 44 · 핸들(안 읽으면 Strong) + 오른쪽 시간 · 미리보기 1줄(요리 공유는 "Shared a dish", 내가 먼저 보내고 답이 없으면 "Waiting for a reply") · 안 읽은 수 배지(fg/accent 원 + fg/inverse 숫자). 당겨서 새로고침. 비면 EmptyState "No messages yet" / "Send a dish to someone you follow, or message a cook from their profile."
- **대화**: TopBar(Inline) 상대 이름 + 오른쪽 ··· (View profile · **Block** — 차단하면 대화를 닫음). 날짜 구분(Today · Yesterday · 날짜) → 말풍선(내 것 = 오른쪽 bg/primary + fg/on-primary, 상대 = 왼쪽 bg/subtle) + 시간 Caption(내 마지막 메시지에 "· Seen"). 요리 링크는 요리 카드("Open dish" → 7.1)로 보인다. 맨 아래 안내 "Messages from cooks you don’t follow arrive as requests. Report or block from ··· anytime." → [고정] 입력 pill "Message {name}…" + 보내기. 실시간으로 새 메시지를 받고, 열면 읽음 처리.
- 규칙: 상대가 나를 팔로우하지 않으면 상대 쪽에서는 **요청**으로 받는다. 받는 사람 범위는 9.5 Privacy의 **Who can message you** 설정을 따른다. 보내기 실패 시 "Couldn’t send. Try again."(입력 내용 복구).

---

## 04c Community · Tables, Questions & Challenges — [섹션 467:9853](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=467-9853)

같이 쓰는 공간 3가지. 섹션 안 라벨: **TABLES** · **NEIGHBORHOOD QUESTIONS**(3.7 · 3.8은 [03-nearby](03-nearby.md)) · **FOOD CHALLENGES**. (Eat together 4.23은 [99-removed-in-v1](99-removed-in-v1.md)) 새 컴포넌트 **Question Card** [469:10124](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-10124)([02-components](../02-components.md)).

| 기능 | 무엇 | 들어가는 곳 | 쌓이는 곳 |
|---|---|---|---|
| **Tables** | 주제로 모이는 공간(#SoloMeals · #RainyDayFood · #KidsTable · #PlantBased · #CampCooking · #LunchBox). 운영자가 만들고 누구나 Join | 4.4 Browse tables · 4.2 태그 페이지(구현 시 "Open table") | 들어간 테이블 게시물이 **Following**에 |
| **Neighborhood questions** | 동네 사람에게 짧게 묻기(≤200자, 7일 뒤 닫힘) | 4.1 Our area "Ask a question" | 4.1 Our area · 3.8 상세 |
| **Food challenges** | 기간 · 참여자 · 사진 인증 | Community **Challenges 탭** | 4.10 Latest entries |

### 4.1 Community · Challenges(탭) — [680:11155](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=680-11155)
- Community 세 번째 탭. 위에서부터(섹션마다 SectionHeader):
  1. **This week’s challenge**(Overline "SEASONAL TABLES"): 큰 카드(테마 사진 + 아래 scrim) — 위 유리 pill "Live · {남은 시간}"(점 fg/accent) → 제목 · 설명 → 참여자 아바타 24 겹침 + "{n} cooking · {n} entries" → 버튼: 참여 전 White M **Join challenge** · 참여 후 Kick M `upload` **Post my entry**(→ 8.1, 태그 미리 붙음) · 올린 뒤 Glass M `check` **Entry posted**(비활성). 카드 탭 → 4.10.
  2. **Your challenges**: 참여 중 챌린지 행(올렸으면 "Entry posted", 곧 시작 "Starts …", 아니면 "Post before …" + **Post** 버튼).
  3. **Top entries** + See all(→ 4.10): 그 챌린지 인증 사진 그리드.
  4. **Coming up** + See all(→ **4.9**): 가로 카드(남은 기간 대문자 · Join / Join early / Joined).
  5. **Recently ended**: 끝난 챌린지 행(흐리게, "Ended {date} · {n} entries").
  - 맨 아래 **Viral Bites**(Figma 1113:25966, 위 32 · gap 6): SectionHeader "Viral Bites" → Country Card **전체 폭 × 180** 세로로 최대 3장(gap 12, r32, padding 14 18, 아래 120 잉크 페이드) — 위 Flag Tag(18, 12) + Viral badge(62, 12: "🔥 +n% this week" bg/kick · "✦ Editor’s pick" bg/inverse) · 아래 Display/M 요리 이름 → Weather Tag · Acorn Tag. 탭 → 4.7. 편집자 픽 먼저, 그다음 뜨는 요리. 없거나 실패하면 섹션을 숨긴다(챌린지가 없어도 보임). 모아 보는 목록 화면이 없어 제목 옆 ›는 두지 않는다.
  6. **How it works**: Join("Shows up on Home") · Cook(그 챌린지 규칙) · Post(#태그) + Caption "Challenges are made by ongdalsaem and last 3–14 days. Post one public dish with the tag while it runs."
- 챌린지가 없으면 EmptyState `flag` "No challenges right now".

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
- Challenges 탭 **Coming up "See all"**에서 연다. 푸시(TopBar Inline "Food challenges", 뒤로).
- 묶음(Overline 라벨 + 목록 박스 bg/subtle radius 16) 순서: **YOU’RE IN** → **RUNNING** → **STARTING SOON** → **ENDED**. 빈 묶음은 숨긴다.
- **Challenge Row**: 썸네일 56(radius 16, 그 챌린지 Mood 그라데이션 + 가운데 Flag Tag, 끝난 것은 50%) · 제목 Title/S(+ **Closing soon** 배지 bg/accent-subtle · fg/accent, 72시간 미만) · 메타 Caption fg/muted · `chevron-right`.
- 데이터: YOU’RE IN — Midnight Ramyeon Hack "2d 22h left · 2,830 cooking"(Closing soon) / RUNNING — Onigiri Shape-Off "5 days left · 1,240 cooking", Pasta in 15 "1 week left · 968 cooking" / STARTING SOON — Taco by the Weather "Starts Fri · Join now, post from Friday" / ENDED — Pancake Sunday "Ended Oct 25 · 742 entries".
- 아래 안내 "Challenges are made by ongdalsaem and last 3–14 days. Post one public dish with the tag while it runs."
- 이동: 참여 중 행 → **4.10b** · 진행 중 · 곧 시작 → **4.10** · 끝남 → **4.10c** · 뒤로 → Back.

### 4.10 Challenge · Midnight Ramyeon Hack — [470:10224](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=470-10224)
- Challenges 탭의 챌린지 카드 · Top entries See all에서 연다. 세로 스크롤 923.
- **Hero**(챌린지 Mood 그라데이션, 위 56 · 좌우 20 · 아래 24, gap 12, 제목 · 설명 모두 fg/default — 그라데이션 위 fg/secondary는 대비 부족): 🇰🇷 Flag Tag · **Closing soon** 배지(bg/default, fg/accent) → "Midnight Ramyeon Hack"(Display/M) → "One leftover from the fridge. That’s the rule. Post a photo before the clock runs out." → 3칸 **Ends in 2d 22h** · **Cooking 2,830** · **Entries 1,104**(bg/default radius 12, Title/M + Caption).
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
