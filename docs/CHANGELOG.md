# CHANGELOG — ongdalsaem 디자인

디자인 버전별 변경 요약이다. 본문 문서에는 최종 상태만 적고, 무엇이 바뀌었는지는 여기에만 남긴다. 새 변경은 맨 위에 추가한다.

## v1.8.6 — 2026-11-27 (프로필 · 다이어리 · 냉장고 · 지역 이름 언어)

- **6.x 프로필 Weather card**: 날씨 줄 → 구분선 간격 14 → 12(홈 Weather Card와 같은 위치). 구분선 아래 간격 14는 그대로
- **2.1 Nearby card**: 글자 줄 사이 3 → **8**(Figma 131:4544), 위에 Overline "Eat this nearby" 줄을 문서에 반영
- **6.3 이번 주 한 줄**: 제목 "This week" + 날짜 범위 → **"Weekly Menu"만**(지난주 · 다음주에서도 그대로, 날짜 범위 없음). Month view는 글자 → `calendar-days` 아이콘(문서를 코드에 맞춤)
- **6.3 Fridge memo**: 칸 선택에 Shopping memo 포함(3개, 문서를 코드에 맞춤). 고른 칸의 상자에 border/focus 2 테두리
- **9.4 오늘의 픽 알림**: 알림을 끄면 서버 `push_tokens`의 위치(lat · lon · city · place)도 null로 지움
- **2.1 Home**: Today’s pick(Story Card) · Nearby card(Similar Bites) 삭제 — 홈은 Weather card(끼니 슬롯) + 날씨에 맞는 피드. 오버라인 → 제목 12 → 11(오버라인 2 안쪽), 제목 → Weather card 12 → 18. 2.5(위치 꺼짐)는 안내 카드 아래 피드, 2.7 스켈레톤에서 픽 · Nearby 자리 삭제
- **6.1 Profile**(1217:14479): 헤더 간격 홈과 같게(11 / 18), 카드 gap 14 → 12, 아바타 88 → 74(테두리 흰색 → border/default), 아이디 줄 높이 80, 상태 메시지 Body/S → Body/M, Follow · Message 버튼 → 높이 32 · radius 8 · 사이 6(Follow = bg/kick), 카드 → 탭 18 → 15, 탭 좌우 40 → 20, 탭 → 그리드 8 → 23
- **Switch**: 시스템 스위치 → 직접 그린 51×31(iOS 26에서 설정 행의 토글이 위 · 오른쪽으로 어긋나던 문제)
- **6.3 What you can cook now 빈 상태**(1217:15353): 안내 문구 → 점선 자리표시 카드 3장. 문구 `fridge.canCookEmpty` 9개 언어 변경
- **8.2 Auto context**(303:403): Lucide 날씨 아이콘 22 → 3D 날씨 이미지 53, 둘째 줄 "From your photo · {when} · Tap to edit" → 시각만("Today 7:20 PM")
- **8.2 Type**: "Travel" → **"Eating Out"**(Figma 400:9707). 문구 `share.types.travel` — en · ko(외식) · es(Comer fuera) · ja · zh-TW(外食) 변경, pt-BR · id · th · vi는 이미 '외식' 뜻이라 그대로. 저장 값은 `travel` 그대로
- **라이트 모드 고정**: 기기 다크 모드를 따르지 않고 항상 Light. 9.1 Settings의 Appearance 행 삭제(앱 설정값 `appearance`도 없앰)
- **지역 이름 언어**: 게시물 지역을 보는 사람의 앱 언어로 표시. DB `foods.place_names`(jsonb) 추가 — 20261127000000

## v1.8.5 — 2026-11-20 (전역 날씨 배경 · Weather Card · 타이머 · 앱 아이콘)

- **날씨 모션(WeatherMoodLayer)**: 무드별 느린 배경 모션 값을 정함(비 1.2–2초 · 투명도 0.15–0.35 · 10°, 눈 8–14초 · 깊이감, 구름 40/60/90초, 맑음 빛 번짐 1 → 1.06 · 8초 + 떠오르는 빛 입자, 번개 6–14초 · 최대 0.35, 밤 = 입자 60 % · 별 0.3 ↔ 0.8). 입자 상한 비 60 · 눈 40 · 기타 20. 무드 변경 크로스페이드 800/1200ms. Reduce Motion = 정지 한 장, 번개 없음. 개발용 무드 미리보기(홈 로고 길게 누르기)
- **전역 날씨 배경(WeatherBackdrop)**: 탭마다 따로 있던 wash · 날씨 효과 → 앱 루트에 하나. 탭 전환 · 푸시 · 뒤로가기에서 모션이 처음부터 다시 시작되지 않음. 네 탭(투명 배경)에서만 보이고, 다른 화면에서는 300ms 페이드아웃 후 멈춤 → 돌아오면 이어서 재생. 2.6은 wash만(모션 없음)
- 2.6 Mood wash: 저녁 기본 톤 → `Mood/overcast`(Figma 108:3298과 맞춤)
- **2.1 Weather Card**: 350×285 → 350×307, padding 18 20 → 18 20 17, gap 14 → 12, 가운데 정렬. 기온 padding 위 1 · 아래 4 → 위 0 · 아래 2. 3D 날씨 아이콘 56 → 64. Picks head Caption Strong → Overline, Picks head → 8 → Meal timeline 묶음. 타임라인 = 카드 안쪽보다 양쪽 13 넓게, 칸 사이 4 → 2(칸 74 → 82). Meal Slot padding 8 0 10 0 → 8 4 10 4, 라벨 Overline → Caption Strong, 썸네일 46(코드 60) → 74, 빈 칸 `+` 18 → 36
- Figma: Weather Card 원본(136:4716)에 2.3 인스턴스의 정렬 · 패딩 오버라이드를 옮겨 2.1 · 2.2 · 2.3 · 2.6에 같이 적용
- **5.1 Kitchen timer**: 큰 링 선 12.65 → **19**(1.5배). 음식 이름 Display/M “…”(링 위) → 링 아래 **반투명 알약 박스**(Display/Quote, 이름이 있을 때만). **링 손잡이**(흰 점 + 빛 번짐 + 중심 쪽 바늘, 마지막 10초 맥박) 추가. **Reset all** 추가(확인 후 모든 타이머 초기화). "15s" 배지 bg/kick 원 → bg/emphasis 알약(Tagline). Active timer 위 30 → 22. Numeric/Timer Outfit Light 52/52 → **Fraunces SemiBold 52/58 +2**
- **5.1-1 첫 화면(타이머 없음)**: 안내 문구 삭제, 빈 트랙 + 컨트롤 3개(눌리지 않음). 타이머는 Add Timer로만 추가
- **5.2 끝남**: 큰 링 · 00:00 fg/done → fg/success, "{label} — done"(위) → "DONE"(아래)
- Figma: 타이머 화면 5개 링 두께 · 손잡이 · 5.2 링 fg/success 반영, 5.1-1을 첫 화면 모양으로, 15s 배지 · Reset all 테두리를 모든 타이머 화면에 맞춤, `icon/play` 컴포넌트 추가
- **Toast**: 아이콘 `acorn` 18(fg/inverse) → `acorn-color` 24
- **6.x 프로필 헤더**(126:4345): 날씨 줄을 홈 Weather Card와 같게(H/L · until 두 줄, 기온 padding 0 8 2 8, 3D 아이콘 56 → 64), 이름 → 핸들 간격 6 → 2, 카드 → 탭 12 → 18, 내 프로필 탭 아이콘 → **글자 탭**, 순서 Dishes → Diary → Saved → **Dishes → Saved → Diary**
- Figma: 07 Dish 샘플 요리를 김치찌개(사진은 훠궈) → **해물파전**(사진 Unsplash · sehoon ye, 출처 메모를 7.1 위에 둠) — 제목 · 설명 · 재료 · 단계 · 칼로리 · 댓글 · 7.3/7.4 Hero · 공유 미리보기
- **앱 아이콘**: 3D 도토리 + 유리 그라데이션(Figma 1065:22998). iOS 1024 · Android adaptive(배경 · 전경 · 단색)
- Display/Quote 자간 표기 −0.25 → −0.5(Figma · 코드와 맞춤)
- 문구 키 추가(9개 언어): `timer.resetAll` · `timer.resetAllTitle`. `timer.idleHint`는 이제 쓰지 않음

## v1.8.4 — 2026-11-20 (3D 날씨 아이콘 · 타이머 디자인 반영)

- **3D 날씨 아이콘**: Weather Card의 56 자리(홈 2.1 · 프로필 헤더 · Nearby)를 무드 오브(무드 top 35 % 원 + Lucide 28) → **3D 이미지만**(원형 배경 없음)으로. 18개 무드 이미지 `assets/weather3d/{mood}@2x/@3x.png`(Figma Weather 3D 1037:228에서 내보냄) · 코드 `WEATHER_3D`. 날씨 없음은 bg/muted 원 + `cloud` 그대로. 24 이하 작은 아이콘은 Lucide 유지. 앱을 열 때 지금 날씨 이미지만 미리 불러옴
- Figma: Weather Card 136:4508 · Profile Header 3개 변형(614:13901 등) · Weather Now 363:8179의 날씨 아이콘을 3D 비 이미지로(이전 아이콘은 숨김). Weather Now는 28 크기 그대로
- **5.1 Kitchen timer**: 큰 링 196.8 · 선 18 → **220 · 12.65**, 링 → 컨트롤 간격 24 → **28**, **Add Timer** 버튼 bg/inverse(어두운) → bg/subtle + 1px border/default + Elevation/1, 아이콘 · 글자 fg/default
- Figma: 타이머 링 프레임(`ring` · `Active timer` · `controls`)의 내용 자르기를 꺼서 링 가장자리와 버튼 그림자가 잘리지 않게(Screens · Timer Card)

## v1.8.3 — 2026-11-19 (TabBar 슬라이드 숨김 · 탭 상태 유지 · 활성 알약 이동)

- **TabBar 축소(Minimized · 48 원) 삭제** → 스크롤하면 바 전체(캡슐 + FAB)가 아래로 숨는 방식(유튜브식). 손가락을 따라 움직이고, 멈추면 마지막 스크롤 방향으로 spring 스냅. 맨 위 · 맨 아래 · 탭 누름 · 화면 진입 때는 항상 보임. Reduce Motion = 200ms 스냅만
- **탭 전환 모션**: 본문 페이드(200ms) 삭제, 화면은 즉시 바뀜. 활성 알약(bg/accent-subtle 82 % · glass/stroke-strong 0.5 · Elevation/1 Low)이 220ms ease-out expo로 새 탭으로 이동하고, 아이콘 · 라벨 색은 알약을 따라 크로스페이드
- **탭 상태 유지**: 네 탭이 한 Tabs 안에서 살아 있음(스크롤 · 데이터 유지). 지금 탭 다시 누르면 맨 위로. 푸시 화면의 TabBar를 누르면 그 화면을 닫고 탭으로. 탭 전환만으로는 3분 안에 다시 불러오지 않음
- 2.1 Weather Card Now: 기온 padding **위 1 · 좌우 8 · 아래 4**(Figma 883:13643), 상태 아래 H/L · until 두 줄
- 7.5 Send to: 7.1에서 시트를 여는 연결 삭제(파일만 남음)
- Figma: **TabBar 12:182 · CreateFAB 12:193을 앱 모양으로** — 캡슐 286×62 + 0.5 테두리, 탭 균등 폭 · 높이 54, 활성 알약 bg/accent-subtle 82 % + glass 테두리 + Elevation/1, 라벨 투명도 60 % → 100 %(활성 fg/accent · 비활성 fg/default), FAB 56 → 62 + 0.5 테두리. CreateFAB `State=Collapsed` 삭제(쓰는 곳 0)

## v1.8.2 — 2026-11-12 (Diary 재구성 · 이번 주 한 줄 · 식단 계획)

- 6.3 Diary 순서를 **이번 주 한 줄 → 월 요약 한 줄 → Fridge memo → Shopping list**로. 기존 "This week’s meals" 카드(가로 스크롤 7장)는 삭제하고 이번 주 한 줄로 합침
- **이번 주 한 줄** 추가: 로케일 주 시작 7칸 · 오늘 칸 border/focus · ‹ ›로 지난주/다음주 · "Month view". 지난 날 = 날씨 + 내가 만든 요리 사진, 오늘·앞으로 = 예보(아이콘 · 최고기온) + 계획한 요리, 없으면 `+` → 그날 식단 시트(예보로 추천 3개 + 저장한 요리). 길게 누르면 계획 삭제(확인)
- **월 달력을 화면에서 빼서 Month view 팝업**(타이머 팝업과 같은 모양)으로. 기능(내가 만든 요리만 · 날짜 → 목록 → 7.1)은 그대로. `Diary Day`는 이 팝업에서만 씀
- **월 요약 카드 → 한 줄**(아이콘 16 + Body/S, "{month}, mostly {날씨} · You cooked …", 요리 없으면 "A quiet {month}"만)
- Fridge memo: **"What you can cook now"를 냉장실/냉동실 상자 아래로** 이동
- 7.1 `more` 메뉴의 **Add to meal plan**(오늘 + 6일 · Lunch/Dinner) 문서화. 식단 계획은 기기에만 저장(AsyncStorage, 30일 지나면 삭제) — 06-data-model에 `PlanItem` 추가
- 문구 키 추가(9개 언어): `diary.thisWeek` · `diary.prevWeek` · `diary.nextWeek` · `diary.monthView` · `mealPlan.removeAsk` · `mealPlan.planDay`. `mealPlan.title`은 이제 쓰지 않음

## v1.8.1 — 2026-11-12 (Community Figma를 앱에 맞춤 · 오늘의 투표 삭제)

- Figma: 4.1(19:818)을 **4.1 Community · Explore**로 — 공통 헤더(무드 wash · 로고 · 벨 · 날짜 · 날씨 제목) · 밑줄 탭 Explore · Following · Challenges · 검색 · **Our area**(오늘 인기 · 동네 질문 + Ask · 이웃 요리 · See more) · Holidays 더보기(`chevron-right`). 4.4(183:5713) · Challenges 탭(680:11155, 섹션 순서 This week → Your challenges …)의 상단도 같은 헤더 · 탭으로. 3.1(19:663)을 **3.1 Nearby list**(TopBar "Our area", 탭 · Weather now · TabBar 없음)로. 새 프레임 **4.1b Holidays around the world**(724:11491)
- **Explore 검색창 삭제**, Our area의 **Neighbours’ dishes(이웃 요리 3개) + See more 삭제** — Figma · 앱 · 문서. 그래서 3.1 Nearby list는 여는 버튼이 없다(화면 코드 · Figma 프레임은 남겨 둠). Explore Together는 더 이상 Our area 요리를 빼지 않는다. 문구 키 `community.seeAll` · `community.area.neighboursTitle` 삭제(9개 언어)
- **Today’s vote(오늘의 투표) 삭제** — Figma · 앱 · 문서 모두. DB `neighborhood_votes`와 함수는 남겨 두고 쓰지 않음. 투표 문구 키는 9개 언어에서 지움
- 문서: 위 Figma 프레임을 각 화면 링크로 연결하고 "코드 기준 · Figma 없음" 표시를 뺌. Figma에 남은 차이: Festive Card 배지(Figma = 아이콘, 앱 = 국기), TabBar 컴포넌트(이전 모양)

## v1.8 — 2026-11-12 (문서를 실제 앱(시뮬레이터 확인)에 맞춤)

v1.7.1 이후 앱에서 바뀐 것을 문서에 반영했다. **Figma에는 없고 앱에서만 바뀐 부분은 본문에 "코드 기준"으로 표시**했다(Figma 프레임은 이전 디자인으로 남아 있음).

**온보딩(00 · 01)**
- 1.1b 손글씨 편지 → **앱 소개 화면**(제목 + 2×2 기능 카드 + "Get started"). 9.8 "A letter from us"는 이 화면을 다시 연다
- 새 단계 **1.3b Taste**(좋아하는 태그 여러 개 → profiles.favorite_tags, 건너뛰기 가능) · **1.5 Daily pick time**(30분 단위 시간 휠 → 알림 권한). 단계 표시 STEP n OF 4
- 1.4 Location: "Why do we need this?" 안내 박스, 다음 단계가 1.5로

**공통**
- Paper(종이 질감) 오버레이와 토큰 삭제
- **ScreenHeader · ScreenWash**: Home · Community · Timer · Profile이 같은 헤더(로고 · 오른쪽 버튼 · 날짜·위치 · 날씨 제목)와 무드 wash를 씀. 마지막 날씨 값을 기기에 저장해 다음 실행 때 먼저 보여 줌
- **UnderlineTabs**(전체 폭 1px 30 % 선 + 라벨 폭 3px 막대, 200ms 이동) — Community · Profile · 4.2 · 4.3
- **TabBar = Liquid Glass**(캡슐 62 + FAB 62 → 스크롤 따라 48 원으로), 탭 전환 애니메이션 없음, 축소 모션이 손가락을 뒤따름(120pt · 250ms · 정착 320ms)
- 아이콘 `bookmark` · `message-circle` 새 모양, `notebook-pen` · `shield-check` 추가 사용

**Home(02)**
- Today’s pick: 같은 날씨 계열 **±1 °C** → 없으면 같은 계열에서 가장 가까운 기온 → 전체에서 가장 가까운 기온. **내 요리는 제외**, 1.3b 취향 보너스
- Today’s pick의 Acorn Tag = 도토리 토글
- 문서에서 Mood Prompt · 피드 헤더 · Similar 칩 삭제(앱에 없음). Nearby card 문구 "Similar Bites / You Might Like"
- 헤더 오른쪽 = 알림 벨(ScreenHeader)

**Community(03 · 04)**
- 탭 **Explore · Following · Challenges**. Global과 Nearby를 Explore로 합침
- Explore 순서: 검색 → Story of the day → **Our area(Today’s table in our area)** → Trending Bites → Holidays → Trending tags → Explore Together. 데이터가 없어도 섹션이 사라지지 않게 기간을 넓혀 채움
- **Our area**: Popular today(오늘 이름별 Top 3, 범위 넓히기) · Today’s vote(v1.8.1에서 삭제) · 동네 질문 3–5개(넓혀 채움) + Ask · 이웃 요리 3개 + See more
- 새 화면 **3.1 Nearby list**(`/nearby-feed`, Our area 전체 목록 · 검색 결과) · **4.1b Holidays around the world**(명절 46개 2열)
- Festive Card: 명절 음식 사진 · 나라 국기 배지(세계 공통은 globe), 명절 46개 · 날짜 2026–2035 생성 스크립트
- 4.1 레이아웃을 Figma 19:818 간격에 맞춤(섹션 머리 → 내용 6/8, Story chevron, Country Card 국기 위치 · 아래 페이드)
- **4.2 Tag · 4.3 Country = v2**(사진 슬라이드 히어로 + 제목 카드 · 밑줄 탭 · 정보 알약 + 끼니 필터 · 동그란 카테고리 · TabBar). Figma v2 프레임 718:11114 · 718:11248
- **DM 다시 들어감**: 4.5 Message 버튼 → 4.11 대화, 받은 대화함 · 요청, 9.5 "Who can message you"(대화함 · Send to 시트를 여는 버튼은 아직 없음)

**Timer(05)**
- 큰 링 선 18 · 작은 링 9, 프레임 단위로 부드럽게, 숫자는 초에 맞춤. **링을 0.35초 누르고 돌려 시간 바꾸기**(햅틱)
- 프리셋 8개, Add timer = 가운데 대화상자(Food Name 칸)
- 방금 시작한 타이머가 큰 링으로("Food Name"이 따라 바뀜)
- 끝나면: 3번 진동 + 앱 안 "— done" 토스트(시스템 배너 대신), 앱 밖은 Time Sensitive 알림. Running 카드는 Done 배지 · done 테두리 · 맨 위로. 상단 Done banner 없음

**Profile(06)**
- 공통 헤더 = 유리 프로필 카드(내 날씨 · 아바타 · 이름 · "Total acorns" · 상태 메시지) + UnderlineTabs. 내 프로필은 **아이콘 탭 Dishes · Diary · Saved**(Diary가 Saved 앞)
- Dish Tile 2열, Acorn Tag = 도토리 토글(내 요리 · 다른 요리사)
- Saved: 컬렉션 다시 씀 — "+ New" 가운데 대화상자, 길게 눌러 컬렉션 삭제, 요리 길게 눌러 컬렉션에 담기
- Diary: 내가 올린 요리만(I ate this 기록 제외). 아래 **냉장고 메모**(냉장실 · 냉동실, 7일 지난 재료 강조, 기기에만 저장) + "What you can cook now"(재료가 겹치는 공개 레시피 5개)

**데이터(06-data-model)**
- 새 마이그레이션 `20261111000000_nearby_questions_wide.sql`(한 단계 넓은 칸 질문) · `20261112000000_neighborhood_votes.sql`(동네 투표 + 결과 RPC + 주변 9칸 함수)
- `places-nearby`: 검색 범위를 반경 사각형으로 제한, 반경 밖 결과 제거, 캐시 키 v3
- messages · collections 테이블을 앱이 다시 씀

## v1.7.1 — 2026-11-05 (00–01 구현 · 문서를 Figma에 맞춤)

**문서 정정(Figma가 맞고 문서가 옛 값이던 곳)**
- 1.1 Splash: `droplet` 아이콘 → **Logo Lockup=Acorn**(Acorn Symbol 36×46 + 워드마크 + 태그라인). 배경 Ellipse 크기·위치(390, y 215) 명시
- 1.1b: Mark · spring ripples(물결 원 3개) → **다람쥐 Ongi 일러스트 119×119**(`ongi_clear.png`). 물결 퍼짐 모션 삭제(시트 올라오기만 남김). CTA card 패딩 · 캡션 2줄 명시
- 1.2: 버튼 순서 Google → Apple → **Apple(698–744) → Google(754–800)**. 버튼 위치 규칙 줄의 옛 좌표(Google 688 · Apple 632) 정정
- 1.3 · 1.4: 블록 간격 명시. 1.4 무드 오브(Gradient/Sunset 원) → **3D 날씨 아이콘 오브 220**, 도시 pill 규격, 예시 "17° Partly cloudy" → "17° Clear"
- Input(02-components): 필드 bg/muted → **bg/subtle + 1px border/default**(Focus 2px border/focus), 높이 56 · radius 20
- Logo Compact · Auth Button 내부 수치, 타이포 3개(Wordmark/Compact · Auth label · Handwriting) 추가

**구현 메모 추가**
- 1.2 로그인 처리(Apple 네이티브 + nonce, Google = Supabase OAuth PKCE, 리디렉트 `ongdalsaem://auth-callback`), 실패 문구
- 1.3 사진 업로드(Storage `avatars`), 1.4 도시 pill 데이터 출처
- 06-data-model: User ↔ profiles 컬럼 연결, 새 마이그레이션 `20261106000000_profile_display_name_avatars.sql`(display_name · handle_auto_generated · handle_changed_at · username 형식 · avatars 버킷)
- Auth Button 브랜드 색은 팔레트 예외(`thirdPartyBrand`)로 명시

**Figma에 남은 확인 사항(디자인 쪽 수정 필요, 코드는 토큰/규정 우선)**
- 1.4 프레임 배경이 토큰이 아닌 그라데이션(`#FAFAF9` → `#E6F4FF`) — 코드는 bg/default
- 1.2 Apple 버튼 인스턴스 외곽선이 `#747775`(Google 색)로 덮여 있음 — 코드는 컴포넌트 값 검정(HIG)
- 토큰 밖 간격: 1.1b CTA 왼쪽 패딩 22, 1.4 도시 블록 위 28, Button L 좌우 패딩 28

## v1.7 — 2026-11-05

**Figma 컴포넌트 정리(쓰는 것만 남김, 섹션별)**
- 삭제 17개: 아무 데서도 안 쓰는 아이콘 10(`minus` · `droplets` · `arrow-left` · `sliders` · `play` · `eye-off` · `sun-medium` · `droplet` · `cloud-moon` · `squirrel`) + 99 Removed 화면에서만 쓰던 6(`calendar` · `phone` · `footprints` · `bus` · `car` · `arrow-up`) + **Chat Bubble**
- 이동: **Question Card** Screens 04c → Components **08 Lists & content** · 새 섹션 **10 Weather mood**(Weather Mood — 이름 "ㅋ" → **Weather Mood**, Foundations의 **Mood Motif**)
- 결과(Components 페이지): 01 Brand 4 · 02 Icons 82 · 03 Actions 6 · 04 Inputs 11 · 05 Navigation 6 · 06 Cards 13 · 07 Photo tags 4 · 08 Lists 14 · 09 Comments & alerts 4 · 10 Weather mood 2. 남은 컴포넌트의 변형은 그대로(변형 단위로는 지우지 않음). 화면에서 원본을 잃은 인스턴스 0

**가이드 추가**: `guides/weather-3d-icon-prompts.pdf` — 날씨 3D 아이콘 18종(ChatGPT, 점토 · 진주빛 3D, Weather Mood 2.0 색, 얼굴 없음, 투명 PNG 600 @3x, `assets/weather3d/weather3d_{mood}.png`)

**Mood/cloudy(구름많음) → Pearl · Mist Blue · Silver Grey**
- 은회색 · 안개 낀 파랑 · 진주빛 흰색 블롭 + 아주 옅은 진주 광택(따뜻한 · 차가운 톤 각 1) 5겹. `mood/cloudy/top` = `#B9C2CC`. 이 스타일을 쓰는 곳(Onigiri · Pancake 챌린지, Seollal 카드, 4.10c Hero, 4.9 썸네일, Weather Mood 견본)에 자동 반영

**1.3 프로필 사진 잘림 수정**
- 원인: Avatar 컴포넌트 **Size=88 원본이 88×106**(세로로 길어 원이 아님)이고, 1.3에서는 112×102 틀이 잘라내고 있었음 → 원본을 **88×88**로 고침(인스턴스 7곳 자동 반영, 81로 줄어 있던 1곳도 88로). 1.3 아바타 = 9.2와 같은 **Avatar edit 96×96**(배지 64, 64), 잘림 없음

**화면 번호 정리(빈 번호 없이 순서대로)** — 이 CHANGELOG의 이전 항목 · 99-removed 문서는 옛 번호 그대로
| 섹션 | 옛 → 새 |
|---|---|
| 01 | 1.5 Profile setup → **1.3** · 1.6 Location → **1.4** (1.5 State · No name → 1.3 State) |
| 04 | 4.4 Tag → **4.2** · 4.6 Country → **4.3** · 4.5 / 4.5b / 4.5c Following → **4.4 / 4.4b / 4.4c** · 4.8 Cook profile → **4.5** · 4.9 Cooks in your weather → **4.6** · 4.20 Tables → **4.7** · 4.21 / 4.21b Table → **4.8 / 4.8b** · 4.24 Challenges All → **4.9** · 4.22 / 4.22b / 4.22c Challenge → **4.10 / 4.10b / 4.10c** |
| 06 | 6.6 / 6.6b Offline → **6.4 / 6.4b** |
| 08 | 8.3 Details(+ 8.3a–e) → **8.2**(+ 8.2a–e) · 8.4 Preview → **8.3** · 8.5 / 8.5b → **8.4 / 8.4b** |
| 09 | 9.9 Help & policies(+ 9.9a–c) → **9.8**(+ 9.8a–c) · 9.10 Delete account → **9.9** |
- 그대로: 1.1 · 1.1b · 1.2 · 2.x · 2.1c · 3.x · 5.x · 6.1–6.3 · 7.x · 8.1 · 9.1–9.7. 99 섹션 프레임 이름 앞에 "× "(옛 번호 표시). 가이드 파일 이름(`9.9-help-policies-guide.pdf` 등)은 유지 — 안의 9.9 = 새 9.8. 앱 코드 주석(FollowingView.tsx) 4.5 → 4.4

**Weather Mood 2.0 — 메시 느낌 그라데이션**
- `Mood/*` 18개 스타일을 한 장 linear에서 **기본 페이드 + radial 블롭 2–3개**로 다시 디자인(브랜드 팔레트, 보라 없음, 아래는 항상 크림). `mood/<key>/top` 변수 새 값, `base`는 모두 `#F5F2ED`
- 새 **Mood Motif** 컴포넌트(18 변형: 해 고리 · 별과 달 · 빗줄기 · 번개 · 눈 점 · 안개 선 · 아지랑이 · 바람 베지어 등)와 Foundations 견본 보드 **Weather Mood 2.0 · Gradients**
- 화면 적용: 홈 · Nearby Mood wash 11곳(2.1 · 2.1c · 2.7 · 3.1 · 3.3–3.6 = rain, 2.2 = clear, 2.3 · 3.2 = snow)을 스타일 α0.85로, 4.22 · 4.22b · 4.22c Hero · 2.1c 배너 · 4.24 썸네일(복사된 옛 색)을 스타일에 연결. Challenge · Festive 카드는 스타일이라 자동 반영
- 같이 수정: 변수에 연결된 색인데 실제 저장 색이 회색(0.5)으로 남아 있던 칠 8곳(4.22 제목 등 — 화면에서 흐리게 보이던 원인) 정리

**화면 최소화(v1 범위 축소)** — 뺀 화면은 Figma **99 Removed in v1** 섹션과 [04-screens/99-removed-in-v1.md](04-screens/99-removed-in-v1.md)로 옮김(연결 없음)
- 이메일 로그인 제거: 1.2b · 1.3 · 1.4 · 1.4b + 상태 4개. 1.2 = Google · Apple 두 버튼(Apple이 y 744–800), 9.3 Password 행 · 9.10 비밀번호 입력 숨김(재인증 시트로)
- DM 제거: 4.11 · 7.5, 4.8 Message 버튼 · Feed Post Direct(`send`) · 7.4 Send in app · 9.5 WHO CAN MESSAGE YOU · "Messages" pill · 2.8 메시지 알림 숨김
- 마케팅 동의 제거: 9.9e, 9.4 ADS & EVENTS · 9.9 Marketing consent terms 행 숨김
- 컬렉션 제거: 7.6 · 7.6b — Save = 저장 토글
- 길찾기 제거: 2.4b — 식당 카드 → 기기 지도 앱
- 테이블 탭 제거: 4.21c · 4.21d, 4.21 · 4.21b 탭 줄 숨김
- 합침: 4.12 명절 → 4.4 태그 템플릿(날짜 헤더, Festive 카드 링크 5개 → 4.4) · 4.3 나라 전체 → 삭제(4.1 Trending by Country See all 끔) · 9.9d → 공통 연결 오류 · 2.2 · 2.3 → "(example of 2.1)" · 4.23 Eat together → 99 섹션
- 프로토타입: 뺀 화면으로 가던 연결 36개 삭제, 5개 재연결

**도토리 = 반응, 숟가락 = 기록**(같은 날 조정) — 문구는 최종 **"I ate this · 12" / "You ate this · 13"**, 7.1b = "State · Ate it", 알림 "ate your …"(아래 "I made this" 문구는 같은 날 되돌림)
- 7.1 하단 버튼(Acorn Button Bar)을 **기록 버튼**으로: `acorn` → **`utensils`**, "I ate this · 95" → **"I made this · 12"**, Eaten "You made this · 13". 7.1b 이름 "Acorn given" → **"Made it"**, 토스트 "Added to your diary · the cook will see you made it.", 사진 위 Acorn Tag는 Default 95로 되돌림
- 2.8 알림 문구: "ate your" → "gave acorns to your"(도토리) / "made your"(`utensils`, 기록)
- DB 역할: likes = 도토리 반응, food_eaten_logs = I made this 기록

**하트 → 도토리 하나로**
- Action Count에 **Acorn · Acorn given** 변형 추가, Feed Post Actions의 Like → **Acorn**(27개 인스턴스, 숫자 = 그 게시물 도토리 수). Feed Post 사진 위 Acorn Tag 숨김(숫자 중복)
- 하트 아이콘 정리: 무드 칩 Cozy `heart` → `coffee`(17곳), 태그 Comfort → `soup`, 9.4 "Acorns on your dishes" → `acorn`. 문서 · 추천 점수 · 데이터 모델에서 likes 삭제

**게시물 사진 날씨 상태 글자**
- Weather Tag에 **Condition · Show condition** 속성 추가. Feed Post 사진(27곳)에서 켬 → "`cloud-snow` Snow −4°" (Rain 16 · Clear 4 · Snow 4 · Drizzle 3)

**07 Dish 화면 번호 다시 매김**(7.4b · 7.5 삭제로 빈 번호 정리) — 이 CHANGELOG의 이전 항목은 옛 번호 그대로다
| 옛 번호 | 새 번호 |
|---|---|
| 7.3 Comments sheet | **7.2** |
| 7.4 Report / block | **7.3** |
| 7.6 Share sheet | **7.4** |
| 7.7 Send to | **7.5** |
| 7.8 Save to collection | **7.6** |
| 7.8b New collection | **7.6b** |
- 7.1 · 7.1b는 그대로. Figma 프레임 이름 · 간격(470) 정리, 모든 문서 참조 변경. 가이드 파일 `guides/7.4-report-moderation-guide.pdf`는 이름 유지(안의 "7.4" = 새 7.3). 앱 코드 주석 2곳(ReportBlockMenu.tsx · moderation.ts)도 7.3으로

**9.9 Help & policies 하위 화면**
- 9.9에 **Help center**(HELP 맨 위) · **A letter from us**(ABOUT, → 1.1b) 행 추가. 하단 캡션에서 자리표시자 사업자등록번호 · Unsplash 문구 삭제, "Weather data by OpenWeather" 추가(844 → 882)
- 새 **9.9a Contact support**(주제 칩 · 메시지 · 스크린샷 · 자동 첨부 안내 · 메일 링크 · Send) · **9.9b Open-source licenses** · **9.9c Document sheet**(약관 · 개인정보 · 위치 약관 · 가이드라인 · 도움말 공통, 시행일 표시) · **9.9d 문서 오프라인** · **9.9e Marketing consent**(옵트인 · 야간 별도 · 동의 날짜)
- **9.9b · 9.9e 오류 수정**: 그룹이 본문 폭을 채우지 않고 좁게 접혀 행 글자가 세로로 쪼개지고 회색으로 보이던 문제 → 그룹 FILL + ListRow 다시 배치(9.1과 같은 행 배경). 9.9b "Weather data by OpenWeather" 2줄 → 라벨 OpenWeather · 값 Weather data. 9.9e 프레임 이름이 빈 칸이던 것 복구. 9.9a 칩 "Report content" → "Report"(한 줄)
- DB `20261105010000_support_and_marketing.sql`(apply: `supabase/ongdalsaem_apply_20261105_support.sql`) — support_tickets, 마케팅 동의 컬럼 + 기록

**남은 상태 화면**
- 새 **4.21c Table · Questions** · **4.21d Table · About**(규칙 = Ingredients List 형식, Leave table) — 4.21 · 4.21b · 4.21c · 4.21d 탭끼리 연결
- 새 **4.22c Challenge · Ended**(Pancake Sunday, CTA 없음) — 4.24 ENDED 행 → 4.22c
- 새 **3.7b State · Location off**(Turn on location → 9.5)

**이름 · 아이콘 정리**
- 상단 제목 "World tables" → **"Community"**(3.1–3.6 · 4.1 · 4.5 · 4.5b, 9곳). 4.5 헤더 "New on your tables" → **"From people and tables you follow"**. "tables"는 Tables 기능 이름으로만 쓴다(FESTIVE TABLES 라벨은 유지)
- 반응 아이콘 구분: Question Card **Me too** `heart` → `users`, 3.8 **Helpful** `heart` → 새 아이콘 **`thumbs-up`**(Lucide). 하트는 게시물 좋아요에만
- Question Card에 **Source icon**(INSTANCE_SWAP): 동네 질문 `map-pin`, 테이블 질문 `utensils`
- **7.4b State · Report sent 삭제** — 7.4 Report → 2.1 + 신고 토스트(문서 7.4에 토스트 문구)

**Following 피드 나누기**
- 4.5에 **All · People · Tables** 칩(기본 All), 테이블에서 온 글 위에 **"from #SoloMeals"** 줄(`utensils`, → 4.21b). 같은 테이블 글 3개 연속 금지, Suggested는 게시물 5개 뒤
- 4.22 · 4.22b **How it works**: 검정 번호 pill(번호가 잘 안 보임) → 7.1 재료 목록과 같은 Ingredients List 형식(Join · Cook · Post), 빈 제목 글자 문제도 함께 해결
- **04c 가독성 점검**(WCAG 대비 계산): `bg/primary`가 검정(#1B1C22)인데 연한 배경처럼 써서 글자가 안 보이던 4곳 → **bg/accent-subtle** — Question Card Category pill, 3.7 안내 박스, 4.23 Meeting safely(대비 1.0 → 16), 4.24 Closing soon 배지
- 그라데이션 위 fg/secondary(대비 2.5) → fg/default: 4.22 · 4.22b Hero 설명, 2.1c Challenge Banner 메타
- "Asker’s pick" · "You’re in" 초록 글자(대비 3.5) → 글자 fg/default + 초록 `check` 아이콘
- 4.22 · 4.22b Latest entries 숫자 612 → 1,104(위 Entries 통계와 맞춤)
- **fg/muted** 라이트 값 stone/500 #7E7972 → 새 **stone/550 #716C65**(작은 회색 글자가 bg/default 위 3.9 → 4.5 이상). 다크 값(stone/400)은 그대로. stone/500은 팔레트에 유지
- **9.5 박스 모서리가 끊겨 보이던 문제**: Radio Row의 사방 1px 테두리가 박스 radius 16에 잘림 + 행 배경 없음(흰 화면 위 흰 박스) → 9.1과 같은 패턴(행 bg/default, 테두리 없음, 간격 0). 9.5 WHO SEES · MESSAGES · BLOCKED, 9.6 Language 행 11개도 같은 문제라 함께 수정
- **전체 검토(86화면)**: 끊긴 프로토타입 링크 0 · 화면 밖으로 나간 요소 0 · 빈 텍스트 0. 토큰 밖 값 정리 — 원/알약 모양 radius(36 · 28 · 18 · 7 · 6 · 5 · 3, 그래버 · 스켈레톤 · 아이콘 원) → 999, 10 → 12(7.8 커버 · 8.3a/8.3c 입력칸), 14 → 16(7.8b · 8.3b), 1.3 Checkbox 6 → 4, 간격 18 → 16 · 11 → 12 · 5 → 6. 4.5c 아이콘 원 패딩 21 → 72 고정, 4.22 · 4.22b · 4.23 하단 CTA 114 → 112(16/40). 03 섹션이 3.1을 감싸게 넓힘. 유지: Input 계열 radius 20(컴포넌트 값), 지도 그림(2.4b), 안전 영역 34 · 시트 시작 위치 같은 구조값
- 새 **4.5c State · No tables yet**(Tables 칩 + 테이블 없음 → Browse tables)
- Timer 탭은 그대로 유지

**동네 질문 · 위치 공개**
- 3.7: 질문의 장소 이름이 9.5 Shared precision을 따르도록 변경(전에는 설정과 무관하게 동 단위로 보였음). pill "Your area shows as Mangwon-dong" + **Change** → 9.5, 안내 문구에 "never your exact location" 추가
- 보는 범위는 서버에만 있는 약 5 km 칸으로 계산. DB `20261105000000_question_area_privacy.sql`(apply: `supabase/ongdalsaem_apply_20261105_question_privacy.sql`) — 질문 작성은 `ask_question()`만, 목록은 `nearby_questions()`

**Food challenges — 빠진 화면 채움**
- 새 **4.24 Food challenges · All**(YOU’RE IN · RUNNING · STARTING SOON · ENDED). 4.1 "See all" → 4.24
- 새 **2.1c Home · In a challenge**: 홈 Story Card 위 **Challenge Banner**(→ 4.22b, Post → 8.1) — 4.22 "shows up on Home"가 실제 화면을 갖게 됨
- 04c 섹션 틀이 496×496이라 화면이 밖으로 나가 있던 문제 → 모든 화면을 감싸게 넓힘

## v1.6 — 2026-10-30

**Community — 같이 쓰는 공간**(새 섹션 04c [467:9853](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=467-9853))
- **Tables**: 4.20 Tables · Browse, 4.21 Table · #SoloMeals, 4.21b Joined(토스트 + Post to table FAB). 4.5에 **Your tables** 줄(테이블 pill · Browse tables) 추가 — 들어간 테이블 게시물이 Following에 나온다
- **동네 질문**: 3.7 Ask the neighborhood, 3.8 Question 상세(Asker’s pick · Helpful · Composer). 3.1에 Ask 줄 + Question Card 추가(높이 928 → 1148). 새 컴포넌트 **Question Card**
- **Food challenges**: 4.22 Challenge 상세(Ends in · Cooking · Entries, Closing soon 배지, How it works, Latest entries), 4.22b Joined(Your progress, Post my entry → 8.1). 4.1 Challenge 카드 연결 4.4 → **4.22**, Join 보류 해제
- **Eat together**: 4.23 — **Phase 2** 설계 참고만(연결 · DB 없음)
- DB: `20261030020000_tables_questions_challenges.sql`(apply: `supabase/ongdalsaem_apply_20261030_community.sql`)

## v1.5 — 2026-10-30

**01 Sign in & setup**
- 1.2를 **보편적인 시작 화면**으로: 위 음식 사진 + 로고 · 문장, 아래 Apple · Google · **Continue with email**(검정). 이메일 입력은 새 **1.2b Log in with email**로 분리(옛 1.2 폼 재사용, Forgot · Create an account 링크 복구)
- **검정 주 버튼 위치 통일**: 01 전 화면 y 744–800 고정(`Block · Button (fixed)`, 고정 요소). 1.6은 Ghost 버튼을 그 위 680에
- 1.3: 약관 줄이 오른쪽 여백 밖으로 나가던 문제(359 → 350 FILL, 글 줄바꿈), 빈 사각형 → 체크된 Checkbox
- 1.4 Send reset link · 1.4b 뒤로 → 1.2b

**00 Launch**
- 1.1b: 스크롤 없이 한 화면(969 → 844) — 편지·문장 짧게, 마크 84, CTA 카드가 142폭으로 줄어 있던 문제 → 전체 폭, Skip이 시트 밖으로 나가던 문제 수정, Eyebrow 2개 삭제

**사진 위 태그**
- 6.1 Dish Tile만 Weather · Acorn Tag **Size=L**(18곳)
- 모든 태그를 사진 **아래쪽 양 끝**으로(Dish Tile 날씨 태그가 왼쪽 위에 있던 것 → 왼쪽 아래, 오른쪽 태그는 폭이 달라도 오른쪽 끝 맞춤). 228곳 확인
- 새 **Flag Tag**(국기 이모지, 높이 24 = Weather Tag L, Noto Color Emoji) 14개국 → Country Card의 `#Japan` 칩 대체(4.1 · 4.3), Challenge 카드

**Eyebrow 정리**
- 제목 위 장식용 대문자 줄 삭제: 홈 Story · Pick · 피드 헤더, 2.4, 4.1 전부(FESTIVE TABLES만 유지), 4.3 · 4.4 · 4.6 헤더, 4.5 · 4.5b · 4.9, 7.x · 8.4 hero "RAINY · 12° · DINNER", 1.1b. 정보가 있는 라벨(설정 그룹 · 알림 그룹 · 표 머리줄 · 날짜 · 썸네일 날씨 메타 · STEP)은 유지
- 4.1 SectionHeader 제목: "Food challenges", "Trending tags"

**04 Community**
- Food challenges 카드 새 디자인: 카드 전체 Mood 그라데이션, 국기 + 남은 기간 pill, 2줄 제목, 참여자 아바타, 원형 Join(기능은 보류)

**07 Dish**
- **7.1 오류 수정**: More from Minji 줄이 시트를 576폭으로 늘려 화면 밖으로 넘치던 문제(7.1 · 7.1b · 7.3 · 7.4 · 7.6–7.8b) → 줄 390 고정 + 가로 스크롤. Nearby 삭제 후 남은 빈 간격 32 삭제
- 7.4: 신고 사유 9개(★ Nudity/sexual · Child safety/illegal · Hate/violence · Someone else’s photo 추가, 급한 순), Radio Row 기본 높이 56 · 간격 0(시트 y 96). **오류 수정**: 시트가 화면 아래 38px를 비워 두던 문제, 그래버가 왼쪽에 붙어 있던 문제(Comments Sheet도)
- 추가 **7.4b State · Report sent**(홈 + 신고 토스트), 2.8에 "게시물 조치" 알림 행

**01 다시 검토(같은 날)**
- 1.2b 제목 위치 146 → 118(다른 화면과 같게), 숨긴 로고 레이어 삭제 · 1.2 제목 Display/M → Display/L
- 1.3 비밀번호 helper가 입력칸 오른쪽(375)으로 넘치던 문제 → Input 컴포넌트 4개 변형의 Helper를 FILL + 줄바꿈
- 1.5 handle 문구에 텍스트 스타일 적용(Caption + handle Caption Strong), 1.5 아바타 · 1.6 오브/도시 · 1.2b 하단 링크를 패딩(139 · 85 · 74 · 105)이 아니라 가운데 정렬로
- 토큰 밖 값 정리: 1.1b 시트 radius 36 → 32, CTA 22 → 24, 간격 18 → 16. 7.4 Radio Row를 임의로 줄였던 48 → 기본 56

**추가 수정(같은 날)**
- Flag Tag: 국기 이모지가 Figma에서 렌더링되지 않아(회색 pill만 보임) **국기 이미지(20×14, 퍼블릭 도메인)**로 교체 → 4.1 · 4.3 · Challenge 카드에 보이게 됨
- Feed Post Media: Weather · Acorn Tag를 **위쪽 양 끝**으로, Photo Counter를 **오른쪽 아래**로(서로 위치 교체, 컴포넌트에서 바꿔 홈 · 4.5 등 모든 피드에 적용)
- 01: 버튼 비활성 상태 화면 5개 추가(1.2b Empty · 1.3 Incomplete · 1.4 Empty · 1.4b Too short · 1.5 No name), 섹션 아래 STATES 줄

- 1.2 버그: 프레임 배경 변수 값이 검정으로 저장돼 아래쪽이 검게 보이고 제목·버튼이 묻히던 문제 → bg/default(크림)로 다시 연결. 같은 원인의 칠 4곳도 복구(Icons · 3.4 · 8.4 · 1.1b). 사진 520 → 420으로 줄여 글이 사진 위에 겹치지 않게, 약관의 Terms · Privacy Policy 강조

**코드 · DB**
- `supabase/migrations/20261030010000_moderation.sql` + SQL Editor용 `supabase/ongdalsaem_apply_20261030_moderation.sql`
- 앱: 신고 사유 9개(`src/services/moderation.ts` · `ReportBlockMenu.tsx`), 메모(note) 지원, 신고 후 "within 24 hours" 안내 + 뒤로

## v1.4 — 2026-10-30

**00 Launch**
- 1.1b Welcome letter 새 디자인: 선셋 띠 + 편지 시트(그래버 · Skip) · **옹달샘 물결 마크**(원 3개 + 샘 + 도토리) · "— A NOTE FROM OUR KITCHEN —" · Fraunces 문장 · 가운데 정렬 편지 · Gaegu 서명 · 도토리 장식선 · 어두운 **CTA 카드** "Share my first meal". 레퍼런스는 구성 아이디어만 참고(손글씨 카드 · 테이프 · 실링 삭제)

**04 Community**
- 4.1: **Trending tags + "More about comfort" 한 묶음**("#Comfort right now", 칩을 바꾸면 아래 카드가 바뀜 — 칩의 4.4 연결 삭제)
- 4.1: Trending by Country 아래 **Food challenges**(나라별 해시태그 이벤트 4개, Join) 추가 → 카드 · See all → 4.4. 마지막 섹션 아래 Tab bar 여백 120
- Country Card: 나라 해시태그 칩 → **사진 좌상단(12, 12)** 고정(4.1 · 4.3 모든 카드)

**07 Dish**
- 7.1 · 7.1b · 7.6–7.8b: **Nearby(Eat this nearby) 삭제**(7.1 2007 → 1791, 7.1b → 1892)
- 7.3 · 7.4: 뒤 화면을 사진 한 장 → **실제 7.1 화면**으로, 딤 = overlay/scrim(다크 모드 대응). 7.3 댓글 아바타를 Jae · Hana · 나(Jiyu) 사진으로
- **7.5 State · Blocked 삭제**(옛 Discover 레이아웃이었고 차단 결과는 토스트로 충분) → 7.4 Block → 2.1 + 토스트. 섹션 빈자리 정리
- 7.4 신고 처리 가이드 PDF(docs/guides)

**08 Share**
- 섹션을 MAIN FLOW / 8.3 SUB-SCREENS(폼 순서) / STATES로 다시 배치
- 8.3 · 8.3e · 8.5 · 8.5b: **Type을 Dish name 위로**. 8.3e "Where did you eat it?" 입력칸 삭제 → **설명 칸이 Travel일 때 "Where did you eat it?"으로 바뀜**
- 8.3 Recipe 행에서 kcal 삭제("6 · 3 steps")
- 8.3a: 사용자 수정 반영(안내 + 공통 힌트를 맨 위로) · 안내 1줄 "Ingredients first, then steps. Amounts are optional." · 하단 CTA에 가리던 내용 여백 확보(Group padding-bottom 143)
- 드래그 아이콘 `icon/grip-vertical`(2×3 점) 추가 → 8.3a · 8.3c 18곳
- 8.3c: 시트가 화면 아래로 44px 넘치던 문제 수정(416, y 428), 힌트 1줄, Quick pick 한 줄 가로 스크롤, 뒤 화면을 새 8.3a로 교체
- 8.3b: 뒤 화면 폼을 새 8.3(Type 위치)으로 교체, 추가 중인 "Rain-soaked" 칩은 숨김

## v1.3 — 2026-10-30

**언어 · 콘셉트**
- 앱 언어 **English**로 통일 — 화면의 한국어 문구 전부 번역(Weather Mood 라벨 · 2.6 노트 · 2.4b 주소 · 9.4 광고 표기 "Ad" · 9.9 Privacy policy · 1.1b 편지). 남은 한글 = 9.6 언어 자체 표기(Noto Sans KR)뿐
- 다국어 앱: **9.6 Language** 추가(검색 · Use device language · 언어 목록), 9.1에 Language 행. 한국어 로케일 광고 표기는 "(광고)"
- UX 라이팅 콘셉트 한 단어 = **Gentle(잔잔하게)**

**사진 위 태그(07 Photo tags)**
- 모든 화면의 Weather Tag · Acorn Tag · Photo Counter → **XL**. Size **M 삭제**(Weather · Acorn L/XL, Photo Counter XL만). M 전용 stroke 1.2 예외 삭제
- XL 변형에서 끊겨 있던 속성 연결 복구(Weather Tag Temp · Weather icon, Acorn Tag Count). 이 때문에 화면의 태그 114쌍이 기본값(12° · 128)으로 보이던 문제 → 문서 값으로 다시 채움(문서에 없던 4.8 타일 · 7.x More from Minji · 3.5 · 4.12는 새 예시 값을 정해 문서에도 적음)
- Dish Tile: Temp · Weather icon · Acorns 속성 대신 **Weather Tag · Acorn Tag 노출 인스턴스**
- 18px 날씨·도토리 아이콘 stroke 1.5로 통일(441곳)

**아이콘**
- 추가: `icon/arrow-down`(Mood Prompt 보내기, 2.1 Mood Prompt 포함) · `icon/squirrel`(미니멀 다람쥐 얼굴) · `icon/fish`(Seafood)
- 사용자 아이콘 수정 후 최신본으로 교체하는 과정에서 아이콘 크기가 24로 초기화된 것을 컴포넌트·화면별 크기 표로 복원(정확한 원래 값이 필요하면 Figma 버전 기록 2026-10-30 00:30 이전 참고)
- Button: Glass · White 변형의 Label이 속성에 연결되지 않던 문제 수정

**01 Sign in & setup**
- 1.1 → 1.1b 1.2초 자동 이동(AFTER_TIMEOUT)
- 1.2: Apple · Google을 맨 위로, "or" 아래 이메일 폼. Apple/Google → 1.5
- 1.3: Confirm password 삭제(눈 아이콘으로 확인), 체크박스 "I’m 14 or older and agree to the Terms and Privacy Policy."
- 추가: **1.4b Set new password**(메일 링크 진입, 뒤로 → 1.2). 1.3–1.6 뒤로 → Back

**04 Community · Global**
- 섹션을 MAIN / BROWSE / TEMPLATES로 정리. **4.2 #Spicy · 4.7 #Vegan 삭제**(4.4 템플릿과 같은 화면) → 링크는 4.4로
- 4.4 = 태그 템플릿 + "COOKED IN 18 COUNTRIES" 해시태그, 4.6 = 나라 템플릿 + "Local now" 3칸 · "SIGNATURE DISHES"
- 4.1 국가 칩 → **풍경 칩**(All · Forest · Sea · Lake · Mountain · Countryside · City)
- 4.1 **FESTIVE TABLES** 추가(Halloween · Christmas · Chuseok · Seollal · Diwali) → **4.12 Festive · Halloween** 템플릿 추가(사진은 자리표시자)
- Country Card: Eyebrow 삭제, 나라 해시태그 Glass 칩 추가
- 4.3: A–Z 탭 삭제 → 검색 "Search countries or cities"
- 4.4 · 4.12 나라 칩 → 4.6, "+N" → 4.3, 4.12 카드 → 7.1 연결. 3.x · 4.1 · 4.5 · 4.5b · 5.x · 7.5의 `bell` → 2.8 연결(빠져 있었음)

**05 Timer**
- 5.1 링 = fg/accent(오렌지). 5.2 = 새 **세이지 done 토큰**(fg/done · bg/done-subtle · border/done, 프리미티브 sage 50–800)

**08 Share**
- 8.3 Meal **여러 개 선택** + Vegan · Seafood 칩, Mood **여러 개 선택**(1–3) + 직접 만든 무드 길게 눌러 삭제
- 8.3 **Type**(Home-cooked · Travel) 추가 → **8.3e Details · Travel**(Recipe 숨김, "Where did you eat it?")
- Calories를 8.3에서 **8.3a로 이동**(8.3 · 8.3e · 8.5 · 8.5b의 Calorie Field 숨김, Recipe 행 "6 · 3 steps · 420 kcal")

**09 Settings**
- 9.2: "Change photo" 버튼 삭제 → 아바타 **편집 배지**(32, `camera`) → **9.2b Choose a photo**(한 장 선택 앨범) 추가
- 9.5 다시 디자인: At a glance pill · WHO SEES YOUR NEW DISHES(+ Allow comments) · **WHO CAN MESSAGE YOU** · Location 캡션 · Blocked → Your data 순서
- 9.9 각 항목이 여는 화면 가이드 PDF(docs/guides) — 검토 후 화면 추가 예정

**코드 · DB**
- `supabase/migrations/20261030000000_dish_type_privacy_language.sql`: foods(dish_type · place_name · allow_comments · region_precision), profiles(use_device_language · default_visibility · default_allow_comments · message_policy · location_enabled · shared_precision), 댓글 insert가 Allow comments를 따르게, start_thread가 "People I follow"를 따르게. SQL Editor용 `supabase/ongdalsaem_apply_20261030.sql`

## v1.2 — 2026-10-29

**프로토타입**
- 시작점 정리 16 → 14(주요 7 + 상태 7), 고정 요소 지정 25개 화면 추가(TabBar · Home Indicator 등), 푸시 화면 뒤로 14곳 → Back, 가로 스크롤 10곳 지정(줄 자체를 화면 폭 스크롤 컨테이너로, 가장자리까지)
- Weather Tag · Acorn Tag **Size=XL**(28) 추가 → 상세 게시물 hero(7.1 · 7.1b · 8.4 · 6.6b · 7.6–7.8b). Size=M 아이콘 stroke **1.2**. Photo Counter에도 Size M/XL 추가 → 상세 hero는 07 Photo tags 3종 모두 XL
- 홈 Story Card: "Why it fits now" · "Cooked by … · 40 min ago" 제거(Show focus · Show byline 속성 추가, 홈 2.x Off)

**전체 점검**
- 화면 67개 점검: 사진 없는 아바타 5곳(Story Card 요리사 · 4.1) 사진 채움, 시트 이름 정리(Bottom sheet), 깨진 연결 0
- 아이콘 1,324개 점검: CreateFAB의 분리된 `+`(아이콘 아닌 프레임) → `icon/plus` 인스턴스, 선 두께 규칙 위반 87곳 수정, 사진 위 Weather Tag 아이콘 색 fg/default → fg/on-photo 126곳, 5.2 Done banner 벨 색을 fg/accent 토큰으로
- Components 페이지를 화면 기준 9개 섹션으로 재정리: 01 Brand · 02 Icons · 03 Actions · 04 Inputs & selection · 05 Navigation · 06 Cards · **07 Photo tags** · **08 Lists & content** · **09 Comments, messages & alerts**. 각 컴포넌트 위 라벨을 "이름 · 사용 수"로 통일, 미사용 Badge 삭제. 문서 카탈로그도 같은 섹션으로

**화면**
- Story Card 사진이 카드 위쪽으로 밀려 비어 보이던 문제 수정(2.1 · 2.2 · 2.3 · 2.6 · 4.1 · Cover): 사진을 카드 fill로 넣어 높이와 관계없이 전체를 덮게 함
- 추가: **7.6 Share sheet** · **7.7 Send to**(Direct) · **7.8 Save to collection** · **7.8b New collection**. Feed Post Share · Direct · Save 16곳 연결, 6.2 "+ New" → 7.8b
- 8.3b 팝업 다시 디자인(아이콘 Head · 52 입력칸 + 글자 수 · Try 제안 칩 · "On your dish" 미리보기 · 버튼)
- Profile Header: Weather now pill이 화면 밖으로 나가던 문제 수정(Top row 왼쪽 padding 326 제거, 폭 FILL). "48 dishes" pill 삭제 → **Dishes 탭 "Dishes 48"**, 도토리 pill을 Handle 아래로(279 → 235)
- 8.3 Calories: 직접 수정하신 내용 반영 — Hint "· optional (a rough estimate)", helper 숨김(Calorie Field 기본값으로 올림, 8.5 · 8.5b 동일, 94 → 72)
- 6.1 Dish Tile 도토리 → 컬러(State=Eaten)
- Profile Header Top row에 **Weather now** pill(실시간 날씨·기온·위치, Show weather · Weather · Weather icon 속성). 4.8 = Osaka 14° cloudy, 6.6 = Last seen
- 추가: **6.6b State · Offline post**(6.6 카드 → 캐시된 게시물, 온라인 기능 비활성)
- 8.3 · 8.5 · 8.5b Calories에 "· optional"(Calorie Field Head에 Hint 추가)
- Weather Card Refresh = 아이콘만(32 원, "New picks" 글자 삭제)
- 2.6 Weather card를 2.1과 같은 규격으로("--°" · "No weather yet" · "Tap ↻ to retry", 326 → 285)
- 8.3b 다시 정리: Mood 줄이 팝업 위로 보이게 배치, 입력 Label "Mood name", 미리보기 칩 추가
- 8.3c 휠 → **숫자 직접 입력**(분 · 초 칸, 숫자 키패드), Quick pick 유지
- 8.4 Top bar: 7.1과 같은 Glass 뒤로 버튼 유지, 가운데 pill 높이 40 · Glass 효과로 맞춤
- Feed Post Actions 순서 Share ↔ Direct 교체(Like · Comment · Share · Direct ··· Save)
- 4.9 Suggested cooks + 4.10 Following → **4.9 Cooks in your weather** 한 화면(비슷한 날씨에 사는 사람, 요리 수 대신 받은 도토리 수, Follow/Following 함께). 4.10 삭제
- 4.5 · 4.5b Cook card 묶음 높이 100 고정 → 내용 맞춤(카드 176이 잘리던 문제)
- 4.8 · Profile Header: 도토리 아이콘 24 → 16(dishes 아이콘과 같게), "acorns received" → "acorns", **Show settings** 속성 추가(4.8은 Off로 빈 줄 숨김)

**컴포넌트**
- Weather Tag → 세트(Size M/L), Acorn Tag에 Size M/L 추가. L(높이 24 = 하트 박스) = 홈 · 상세, M(21) = 그리드 · 프로필 3열
- 추가: Photo Counter(사진 장수, 크기 유지) · Weather Now · Cook Card · Cook Row · Chat Bubble — 화면에 직접 그렸던 프레임을 컴포넌트로 교체(6 · 6 · 5 · 3곳)
- 삭제: Photo Pager(미사용)

**데이터**
- Supabase 마이그레이션 `20261029010000_save_collections.sql`: collections · collection_items(7.8 · 7.8b · 6.2), RLS 본인만
- Supabase 마이그레이션 `20261029000000_follows_and_messages.sql`: follows · message_threads · messages, RLS, `start_thread()`, 차단 시 팔로우 해제·대화 숨김

**화면 · 이전 묶음**
- **TabBar + CreateFAB 한 묶음**: FAB을 TabBar 컴포넌트 안으로(화면에 따로 있던 FAB 15개 삭제). Collapsed = pill 170×42 + FAB 42(CreateFAB `State=Collapsed` 추가), 같은 smart-animate 모션. 탭 순서를 Home · Community · Timer · Profile로 맞춤(Timer 화면에서 순서·FAB 빠짐 수정). 모든 화면 탭·FAB 연결 다시 지정
- 추가: **8.3c Set timer**(8.3a Add timer / 타이머 알약 → 바텀 시트: 분·초 휠, Quick pick 칩, No timer / Set 2:00 timer)
- IconButton `State=Pressed` 추가(하트 → `heart-filled` 면, fg/destructive) 8개 variant
- Profile Header "acorns received" 아이콘 → **컬러 도토리**(4.8 · 6.x)
- Community를 섹션 3개로: **03 Community · Nearby** · **04 Community · Global** · **04b Community · Following**(4.5 · 4.8 이동). 4.1 → 4.1 Community · Global
- 추가: 3.4 Search · Typing · 3.5 Search results · 3.6 Nearby · Within 1 km · 4.5b Following is empty · 4.9 Suggested cooks · 4.10 Following · 12 · 4.11 Message · Aoi. 연결 없던 버튼 연결(검색바 · 지역 칩 · 나라 칩 · 태그 칩 · Following 헤더 · See all · Cook card · Message)
- 추가: **2.8 Notifications** · 2.8b 빈 상태 + **Notification Row** 컴포넌트. `bell` 17곳 → 2.8
- 라인 도토리(`icon/acorn`) 115곳 점검: 크기별 선 두께·색 일치, 11px 1곳 1.3 → 1.4 수정
- **탭바 5 → 4개**(Home · Community · Timer · Profile). Glass 바를 왼쪽 292 폭으로 줄이고 **CreateFAB을 같은 줄 오른쪽 끝**에 배치(17개 화면). Collapsed pill 214 → 170. TabBar `Active=Discover` variant 삭제
- **Discover → Community의 Nearby 탭**: 4.1 · 4.5 탭 Global · **Nearby** · Following. 3.1–3.3을 Community · Nearby로 바꿈(상단 = 4.1과 같은 TopBar · 탭, 안쪽 For You/Nearby/Latest 탭 삭제). **현재 위치 날씨 Weather now 줄을 TopBar 아래 고정** + 홈과 같은 Mood wash(3.2는 대구 눈). 문서 03-discover → 03-nearby
- 홈 Weather Card에 **Picks head + Refresh("New picks")**: 누를 때마다 같은 날씨·기온·무드의 다른 요리로 네 슬롯 교체
- 추가: **Mood Prompt** 컴포넌트(Empty/Typed, 48 pill) — 홈 Weather card 아래 한 줄 기분 입력, 보내면 Today’s pick을 날씨·기온 + 기분에 맞게 다시 고름(2.1–2.3)
- 홈 피드 **해시태그 삭제**: Feed Post의 Tags 줄·속성 제거(2.x · 4.5 · 7.1 · 7.1b · 8.4)
- 8.3 · 8.5 · 8.5b Mood 끝에 **"+ Add your own"** 칩 → 새 화면 **8.3b Add your mood**(딤 + 가운데 팝업, 20자 입력, Cancel / Add mood). 데이터 `mood: 'custom'` + `customMood`
- 추가: **Calorie Field** 컴포넌트(Filled/Empty/Focus) — 입력칸 높이 56 → **48**(Comment Composer와 같음), pill, `flame` + 단위 kcal. 8.3 · 8.5 · 8.5b의 일반 Input 교체
- **09 Settings 10 → 8화면**: 9.6 Food & display 삭제(Appearance · Temperature는 9.1 선택 시트, 언어는 OS, 식단·측정 단위 없음), 9.8 Blocked accounts를 9.5 안으로 합치고 삭제, 9.5 → Privacy & location(공개 범위 Everyone/Only me, Personalization · App permissions 삭제), 9.1 Home city · 9.2 Home city 삭제, 9.7 → Choose city(위치 꺼짐 2.5 전용), 9.3 Security · 9.4 일부 알림 · 9.9 Help center/Report/Rate · 9.10 탈퇴 사유 삭제
- 게시물 상세를 **7.1 Post detail 하나로 통일**. 7.1의 사진·시트 디자인에 피드 게시물 구성(같은 사진·Counter·Weather Tag·Acorn Tag 위치, Feed Post 헤더·액션·캡션·태그·시간)을 합치고, 재료·단계·댓글·근처·작성자의 다른 요리를 한 스크롤에 담음
- 7.2 Recipe & comments, 7.6 Post detail 삭제 → 모든 연결을 7.1로(5.2 Back to recipe 포함)
- 댓글은 7.3 시트에서만: 7.1·7.1b의 Comments 섹션 삭제, Feed Post의 “View all N comments” 줄 삭제(댓글 수는 아이콘 옆 숫자). 7.3 제목 Comments · 18, 딤 탭 → 뒤로
- 아바타 사진 채움: 이니셜만 보이던 아바타 36곳에 사람별 사진 적용(가상 인물 11명 Figma AI 생성 + 내 사진). 사람과 무관하게 "J"이던 이니셜 수정, 4.8 Aoi 헤더에 잘못 들어간 내 사진 교체
- Feed Post의 시간 줄(“40 minutes ago”) 삭제 — 헤더 Meta(“Mapo, Seoul · 40m”)와 중복
- 2.1b Home · Scrolled 삭제 — 접힘 동작은 TabBar `State=Collapsed` variant + §3.1 규칙으로 충분, 02 Home 섹션 정렬
- Acorn Tag에 라인 도토리 추가: `State=Default`(안 먹음, 라인) / `State=Eaten`(먹음, 컬러). 사진 위 태그는 모두 Default, 7.1b만 Eaten. Eaten 도토리 = 직접 추가하신 `icon/acorn-color`(이름 오타 acon → acorn 수정), Acorn Button Eaten도 같은 아이콘
- 추가: **Comments Sheet** · **Comment Composer** 컴포넌트(7.3 적용). 입력칸은 Search Field와 같은 높이 48·규격, 흰색 톤(bg/subtle + border/default)
- 아이콘 추가: `heart-filled`(좋아요 누른 상태)
- 추가: **Action Count** 컴포넌트(Like · Liked · Comment, 아이콘+숫자). Feed Post 16곳 교체, 숫자·댓글 연결 유지
- 7.1 · 7.1b 태그 칩을 8.2 선택값 그대로(Rainy · Cool · Cozy · Dinner) 아이콘 칩으로 교체(이전 Cozy · Stew · Rainy day 글자 칩). 태그 = 아이콘 칩, 필터 = 글자 칩 규칙 추가
- 7.1 · 7.1b 사진 위 Weather Tag 아이콘이 검정으로 풀려 있던 것을 fg/on-photo로 수정
- 7.1 · 7.1b 조리 시간·칼로리·인분: 상단 카드 3개 → Steps 아래 3열 목록(Details, 보조 정보로 낮춤)
- 8.3 Calories → 화면 안 **숫자 입력**(총 칼로리만, "A rough estimate — it may not be exact."), Visibility → 화면 안 **Sharing 스위치 3개**(Share publicly · Show my neighborhood · Allow comments). 8.3c · 8.3e 삭제. 7.1 · 7.1b · 8.4 Details = "≈ 420 kcal" + 추정 안내 한 줄. 8.5 · 8.5b를 새 8.3 form으로 다시 맞춤. 8.3d는 검토 후 유지(위치 없는 사진·권한 없음·다른 장소)
- 8.3 · 8.5 Calories를 별도 박스로 분리(Recipe 묶음 안)
- 8.3a 재료를 **2열 표**로 다시 디자인: INGREDIENT · AMOUNT 머리줄, 줄 48, 표 맨 아래 인라인 추가 줄(이름 · 양 입력칸 + check)
- 8.3b 단계 추가 흐름: New step 카드(입력 · Timer/Photo/Tip · Cancel / **Add step**), 닫힌 상태 "+ Add step", Done 전 작성 중 단계 확인. Recipe Step 속성 정리(Text 1/2/3 → Number · Text, 12곳 값 유지)
- 8.3 · 8.5 버튼 "Share to ongdalsaem" → **"Confirm"**. 8.4 Shared(공유 완료) → **8.4 Preview**: 7.1과 같은 레이아웃에 내가 쓴 내용을 실제 게시물처럼 표시, 하단 "Share to ongdalsaem" → 2.1. Photo Pager는 미사용으로 보관
- 8.3 · 8.5 필수 항목 = Dish name · Meal · Mood("· required"), 재료 · 조리 단계 · 칼로리 = "Recipe · optional" 묶음
- 8.3 Mood 선택지 5 → 10개(Nostalgic · Celebrating · Lazy · Together · Hearty 추가), Visibility를 요리 정보 박스와 분리한 별도 박스로(8.3 · 8.5)
- 8.3a–8.3c 점검: 재료 줄을 감싼 칸이 100px 고정이던 것을 내용 맞춤(8.3a 1212 → 844), 칩 묶음 100px 고정 → 내용 맞춤(8.3a · 8.3b · 8.3c)
- **공유 흐름 3 → 2단계**: 8.2 Weather & mood를 8.3 Details에 합침. 날씨·기온·지역은 사진(EXIF) 기준 자동(Auto context 카드, 탭 → 8.3d에서 장소만 수정), Meal은 촬영 시각으로 미리 선택, Mood는 선택 사항. 8.3 Region 행 삭제, "지역 숨기기"는 8.3e Visibility로 이동, 8.3d → Edit place. Step Progress 2칸, 8.5도 같은 구성. 8.2 삭제
- 추가: **Ingredients List** 컴포넌트(7.1 · 7.1b). 재료 줄 간격 촘촘하게: 줄 사이 10 → 0, Ingredient Row 높이 43 → 39 → 재료 6개 345 → 269px
- City Row 속성 정리: 예시 값 이름(Busan · Bushehr · Text 1 …)으로 variant마다 달랐던 속성을 `City` · `Country` · `Temp` 공통 3개로 통일(7줄 값 유지). 8.3d 날씨 아이콘 `sun` → `cloud-rain`(서울 비 12°와 일치)
- 8.4 Shared: 세로 스크롤 사진 → **가로 스와이프 슬라이드**(`Photo Pager` 컴포넌트, Page 1–4, 드래그 → 다음 장 Smart Animate). 세로 점 표시 → 사진 아래 가로 점 4개, 태그를 4장 모두에 표시, 화면 844로 복귀
- 추가: **7.1b State · Acorn given**(도토리 버튼 Eaten + Toast · Undo)
- **8.3a Ingredients + 8.3b Recipe steps → 8.3a Recipe 한 화면**(세로 스크롤: 재료 표 → 단계 표, CTA "Done · 6 ingredients · 3 steps", 1237). 8.3 · 8.5 · 8.5b 두 줄 → "Ingredients & steps · 6 · 3 steps" 한 줄. 8.3b 삭제
- 8.3b 단계를 **2열 표**로 다시 디자인(8.3a와 같은 규격): # · STEP 머리줄, 단계 줄(드래그 · 번호 · 본문 · ×), 타이머는 본문 아래 "15:00" 알약, 표 맨 아래 인라인 추가 줄(번호 4 · 입력칸 · Add timer · check). New step 카드 · Photo/Tip 칩 · Cancel/Add step 버튼 · 밀어서 삭제 삭제 (1009 → 844)
- 8.3a "SUGGESTED FROM YOUR PHOTOS" 칩 삭제 → 이름 칸 자동완성(명세만)
- 8.3 · 8.5 · 8.5b Sharing의 "Show my neighborhood" 스위치 삭제 → 위치 표시 범위는 9.5 Shared precision을 따름. 데이터 `hideRegion` → `regionPrecision`
- 스크롤 화면 30개(7.1 · 7.1b 포함) 프레임을 내용 전체 길이로 늘려 캔버스에서 잘리던 내용이 모두 보이게 함. 하단 고정 요소는 맨 아래 + Bottom 고정, 고정 설정이 빠졌던 11개 화면(2.7 · 4.8 · 5.2 · 6.1 · 6.3 · 8.1 · 9.1 · 9.4 · 9.5 · 9.9 · 9.10) 보완

**아이콘 · 코드**
- `acorn` 아이콘의 숨은 레이어 2개 삭제
- 코드 주석의 옛 문서 참조를 새 docs 경로로 교체(supabase 마이그레이션 파일은 적용 기록이라 그대로)

## v1.1 — 2026-10-28

**화면**
- 추가: 00 Launch(1.1 Splash · **1.1b Welcome letter**), 4.3 Countries · 4.4 #Comfort · 4.5 Following · 4.6 Country · 4.7 #Vegan · 4.8 Cook profile, **7.6 Post detail**, 8.3a–8.3e 작성 화면, **8.5b Photo options**, 09 Settings(9.1–9.10, 출시 요건 반영)
- 1.5 Profile setup: 입력은 Display name 1개, username은 자동 생성(9.2에서 30일 1회 변경)
- 4.1 Country Card → 7.6 Post detail. 4.8 Follow · Message 버튼을 Dishes/Diary 탭 위로
- 8.5 실패 썸네일 → 8.5b 시트(재시도 · 교체 · 삭제 · 취소), 배너 → 8.3
- 8.4 Shared 사진을 피드와 같은 390×440으로

**컴포넌트**
- 추가: Auth Button(Apple/Google, 브랜드 규정), Weather Tag · Acorn Tag(모든 요리 사진 좌하단·우하단)
- Profile Header `Show actions`, TopBar `Show action`(기능 없는 `more` 숨김, 제목 가운데 유지)
- Story · Food · Country · Pick Card 정리, Weather Card 끼니 슬롯 같은 폭, Glyph·미사용 카드 제거
- Avatar·Button·IconButton·Chip·Tab을 variant 크기로만 사용, 배율(scale) 인스턴스 제거

**토큰**
- 컬러 확장(상태 · 사진 위 · 오버레이 · 유리 · 고정 + sunset/green/amber/red/alpha 프리미티브), 직접 입력 색 전부 토큰 연결, 미사용 색 삭제
- 그라데이션 정지점 = sunset 변수, 날씨 무드 `Mood/<key>` ×18, 효과 스타일 12개(Elevation · Blur · Surface)
- 간격 `space/10` · `space/14` 추가, 토큰 외 간격·라운드 정리

**아이콘**
- 새 `acorn` 아이콘으로 전체 교체(Acorn Button · Toast · Profile Header 등 20곳)
- 크기별 선 두께(22–24 → 1.6 · 17–21 → 1.5 · ≤16 → 1.4)를 전체 689개에 적용
- 사진 위 아이콘 = `fg/on-photo`, 어두운 면 = `fg/inverse`, 한 아이콘 안 색 혼용 제거

## v1.0 — 2026-10-28 (기준선)

최초 디자인. 화면 38개(8개 섹션), 컴포넌트·토큰·텍스트 스타일·프로토타입 전체. 홈 무한 스크롤 피드(Feed Post), 프로필 Profile Header · Dish Tile, 단일 CreateFAB.
