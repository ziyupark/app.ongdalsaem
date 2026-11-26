# Screens 02 · Home

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 02 Home — [섹션 59:2361](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2361)

### 홈 공통 레이아웃 (2.1 / 2.2 / 2.3 / 2.6)
1. [A] **Mood wash** — 현재 날씨 무드([§2.4](../01-foundations.md)) 그라데이션 85 % + **날씨 모션**(WeatherMoodLayer), 높이 420. 스크롤하면 내용과 함께 올라가며 사라진다. 앱 전체에 **하나뿐인 전역 배경**(WeatherBackdrop)이라 **Home · Community · Timer · Profile 네 탭이 같은 wash**를 쓰고, 탭을 옮겨도 모션이 끊기지 않는다([02-components §3.1b](../02-components.md)).
2. StatusBar(글자색은 wash 밝기에 맞춤).
3. **ScreenHeader**(네 탭 공통, 좌우 20, 아래 12):
   - 헤더 행(높이 40): 좌 Logo(Compact) "ongdalsaem"(길게 누르면 개발용 메뉴), 우 IconButton(Soft, M) `bell`(알림 → **2.8**, 안 읽은 알림이 있으면 6px 점). *Map 버튼 없음.*
   - 20 → **날짜·위치 오버라인**: "Tue, Oct 27 · Mapo, Seoul".
   - 12 → **대제목** Display/XL 두 톤: "Rainy evening"(날씨 단어 강조 + 시간대는 fg/disabled 톤) — 날씨 무드 + 시간대(morning/afternoon/evening/night) 조합. 한 줄, 넘치면 글자 크기를 줄여 맞춘다.
   - 글자색은 wash 위치별 잉크(로고 12 % · 오버라인 26 % · 제목 33 % 지점의 밝기)에 맞춘다.
4. **Weather card**([136:4716](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=136-4716) — glass/surface + blur, 1px bg/subtle 테두리, Elevation/3, radius 2xl 32, 350×307, padding 위 18 · 좌우 20 · 아래 17, gap 12, 가운데 정렬):
   - 큰 기온 Numeric/XL "12°"(padding 위 0 · 좌우 8 · 아래 2) → 4 → 상태 Title/M "Light rain" → 6 → Body/S 두 줄 "H 14° · L 8°" / "until 9 PM"(줄 간격 2) → 14 → **3D 날씨 아이콘 64**(우측, 원형 배경 없음 — [§2.4](../01-foundations.md)). 날씨가 없으면 bg/muted 원 + `cloud`.
   - 구분선 → 12 → [**Picks head** → 8 → **Meal timeline**](한 묶음).
   - **Picks head**: Overline fg/muted "Picks for this weather" ··· **Refresh** 아이콘 버튼(`rotate-ccw` 32 원, 글자 없음). 탭할 때마다 같은 날씨·기온·무드에 맞는 **다른 요리**로 네 슬롯을 다시 채운다([§6.1](../05-behavior.md)).
   - **Meal timeline**: 4개 슬롯 가로 배치 — 이전 끼니 · **Now** · 다음 · 그다음. 각 슬롯 = 끼니 라벨 + 썸네일 원 + 예보 기온. Now 슬롯은 **선셋 그라데이션 링**.
     - **네 칸은 항상 같은 폭**: 타임라인은 카드 안쪽 폭(308)보다 **양쪽 13씩 넓다**(카드 바깥 가장자리에서 8 안쪽, 칸이 카드 가장자리에서 9). 칸 사이 2 → 390 화면에서 칸당 82(`flex: 1 1 0`). 라벨 길이와 관계없이 폭이 같고, 라벨은 칸 가운데 정렬.
     - 칸(Meal Slot): padding 8 4 10 4, gap 6 — 라벨 Caption Strong(대문자 아님) → 썸네일 원 **74** → 날씨 아이콘 14 + 기온(Body/S Strong).
   - 빈 슬롯(아직 아무도 올리지 않은 시간대)은 점선 원 + `+` 36 → 8.1.
   - Mood Prompt(기분 입력)는 홈에 없다.
5. 16 → **Story Card "Today’s pick"**(Show focus · Show byline **Off**): "Today’s pick"(Eyebrow 없음) → 문장 = 고른 요리 이름 + 요리사 Avatar 40 → 맨 아래 Tags 줄(Weather Tag · **Acorn Tag**). 태그 값: 2.1/2.1b/2.6 `cloud-rain` 12° · 128, 2.2 `sun` 21° · 96, 2.3 `cloud-snow` −4° · 141. 카드 탭 → 7.1.
   - **Acorn Tag = 도토리 주기 토글**(피드와 같음): 탭하면 주고 다시 탭하면 취소, 준 상태는 채운 도토리. 숫자는 바로 바뀌고 실패하면 되돌린다. 픽이 바뀔 때마다 내가 이미 줬는지 다시 읽는다.
   - 고르는 규칙은 [§6.2](../05-behavior.md). 후보가 하나도 없으면 카드(와 아래 Nearby card)를 숨긴다.
6. 16 → **Nearby card "Similar Bites"** (가로, padding 14, gap 14, radius 2xl(32), bg/subtle + 1px border/default): 72×72 사진(오늘의 픽 사진, radius lg 16) → 글자 3줄(gap 8, Figma 131:4544): "Eat this nearby"(Overline fg/muted) / "Similar Bites"(Title/M) / "You Might Like"(Body/S fg/secondary) → `chevron-right`. 탭 → 2.4(오늘의 픽 요리 이름으로 검색).
7. **Block · feed — 피드** (Nearby card 아래, 전체 폭, padding-top 40, 게시물 사이 24):
   - 피드 헤더 · Similar 칩 줄은 없다. **Feed Post ×N**([§3.3](../02-components.md))만 이어진다.
   - 20개 이상이면 끝에 **Loading more**(16px 원호 스피너 fg/accent + Caption fg/muted `Loading more like this…`).
   - **Tab bar spacer** 96px.
   - 피드 내용 규칙은 [§6.7](../05-behavior.md).
8. [A] TabBar(Home, CreateFAB 포함) · [A] Home Indicator · [A] Toast(새로고침 안내, TabBar 위 96).
- 다른 탭에서 돌아왔을 때 날씨를 이미 읽어 두었으면 2.7 스켈레톤 없이 바로 보인다. 탭 상태는 유지된다(스크롤 위치 · 피드 그대로, [§6.4](../05-behavior.md)).

### 2.1 Home · Rainy evening — [19:191](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=19-191)
- 데이터: "Tue, Oct 27 · Mapo, Seoul" / "Rainy evening" / 12° Light rain / H 14° · L 8° · until 9 PM.
- 슬롯: Lunch 13° · **Now** 10° · Late 8° · Dawn 7°(빈 슬롯).
- 이동: Lunch/Now/Late → 7.1 · Dawn(빈) → 8.1 · Story card → 7.1(Acorn Tag = 도토리 토글) · Similar Bites → 2.4 · 피드 사진 → 7.1 · 피드 댓글 → 7.2 · 탭바 Community 4.1 / Timer 5.1 / Profile 6.1 · FAB → 8.1.
- 스크롤: 세로(피드 무한). 아래로 스크롤하면 TabBar(+CreateFAB)가 아래로 숨고, 위로 조금만 올려도 다시 나타난다([§3.1](../02-components.md)). Home 탭을 다시 누르면 맨 위로. 별도 화면 없음.
- **피드**(예시 데이터):

  | # | Name | Meta | Weather(아이콘) | 사진 | Counter | 💬 | Caption |
  |---|---|---|---|---|---|---|---|
  | 1 | minji.cooks | Mapo, Seoul · 40m | Rainy 12° (`cloud-rain`) | kimchi1 | 1 / 3 | 18 | Old kimchi from my mom’s fridge — the sourer, the better on a rainy night. |
  | 2 | jae.eats | Sinchon, Seoul · 1h | Drizzle 11° (`cloud-drizzle`) | hotpot | 1 / 4 | 9 | Budae jjigae for four. Spam, rice cakes, and one slice of cheese melting on top. |
  | 3 | sora.home | Incheon · 2h | Rainy 10° (`cloud-rain`) | tofu | 1 / 2 | 6 | Sundubu with a cracked egg — silky tofu for a grey afternoon. |

  사진 위 태그: Weather Tag = Weather 열의 아이콘 + 기온(예: `cloud-rain` `12°`), Acorn Tag = 1번 95 · 2번 74 · 3번 44 (2.6도 동일).


> 챌린지에 참여 중일 때의 홈 = **2.1c Home · In a challenge** [484:11596](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=484-11596)(Story Card 위 Challenge Banner) — [04-community](04-community.md)

### 2.2 Home · Clear morning — [19:491](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=19-491)
- "Wed, Oct 28 · Haeundae, Busan" / "Clear morning" / 19° "Clear and breezy" / H 24° · L 16°.
- 슬롯: **Now** · Lunch 23° · Snack 24° · Dinner 20°(빈 → 8.1).
- Pick: "Naengmyeon, icy and bright". 무드 = clear.
- **피드**(예시 데이터):

  | # | Name | Meta | Weather | 사진 | Counter | 💬 | Caption |
  |---|---|---|---|---|---|---|---|
  | 1 | jae.eats | Haeundae, Busan · 1h | Clear 21° (`sun`) | naeng | 1 / 3 | 12 | Icy broth, a splash of vinegar, mustard on the side. Summer isn’t over in Busan. |
  | 2 | hana.kitchen | Suyeong, Busan · 2h | Clear 22° (`sun`) | bibimguksu | 1 / 2 | 7 | Bibim guksu with cucumber ribbons — sweet, spicy, and cold. |
  | 3 | dongwoo.b | Seomyeon, Busan · 3h | Sunny 23° (`sun`) | bingsu | 1 / 1 | 4 | Patbingsu after lunch. Too early? Never. |

  사진 위 태그: Weather Tag = Weather 열의 아이콘 + 기온, Acorn Tag = 85 · 54 · 39.

### 2.3 Home · Snowy night — [26:647](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-647)
- "Thu, Oct 29 · Sapporo" / "Snowy night" / "Light snow" −4° / H −1° · L −7° · until midnight.
- 슬롯: Dinner · **Now** −2° · Dawn −7° · Breakfast −6°(빈 → 8.1).
- Pick: "Miso butter corn ramen, late". 무드 = snow(야간 톤).
- **피드**(예시 데이터):

  | # | Name | Meta | Weather | 사진 | Counter | 💬 | Caption |
  |---|---|---|---|---|---|---|---|
  | 1 | aoi.sapporo | Sapporo · 20m | Snowy −4° (`cloud-snow`) | ramen1 | 1 / 3 | 21 | Miso butter corn ramen at 11 PM. The snow can wait. |
  | 2 | kenji.eats | Otaru · 1h | Snowy −3° (`cloud-snow`) | ramenEgg | 1 / 2 | 8 | Shoyu ramen, jammy egg, steamed-up windows. |
  | 3 | yuki.home | Asahikawa · 2h | Heavy snow −7° (`snowflake`) | misoSoup | 1 / 1 | 5 | Just miso soup and rice tonight. That’s enough. |

  사진 위 태그: Weather Tag = Weather 열의 아이콘 + 기온, Acorn Tag = 108 · 60 · 32.

### 2.4 Eat this nearby — [99:3302](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=99-3302)
- 목적: 오늘의 픽 요리를 파는 **주변 식당 리스트**(지도 아님). 스크롤.
- 블록: StatusBar → 헤더 행 IconButton(Soft, M) 뒤로 → 제목 "Kimchi jjigae nearby" → 필터 칩: **Open now**(Selected) · Walkable · Under ₩10,000 → 장소 카드 리스트(각 카드: 사진, 메타 "350 m · 5 min walk · open till 22:00", 식당명 Title/M, "Kimchi jjigae · ₩9,000", 도토리 수 212, 메모 "Aged kimchi, pork belly").
  - Mapo Jjigae House — 350 m · 5 min · till 22:00 · ₩9,000 · 212 · Aged kimchi, pork belly
  - Seogyo Kitchen — 700 m · 9 min · till 23:00 · Kimchi jjigae set ₩10,000 · 96 · Tuna, extra tofu
  - Hapjeong Sikdang — 950 m · 12 min · till 21:30 · ₩8,500 · 74 · Comes with rice refill
- 화면 위 **날씨 카드**는 2.1 Weather card의 Now 줄과 같은 규칙(기온 · 상태 · H/L · until · 오른쪽 3D 날씨 아이콘 56).
- 정렬: 거리 오름차순. 필터 기본값 Open now.
- 이동: 뒤로 → 2.1 · 카드 탭 → 기기의 지도 앱으로 길찾기(카카오맵 · Apple 지도 · Google 지도 중 설치된 것, 목적지 = 식당 좌표). 앱 안 지도 화면은 없다.

### 2.5 State · Location off — [76:2923](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-2923)
- 노트: *Home still works. Defaults to the last chosen city and invites a manual pick — never blocks the feed.*
- 블록: StatusBar → ScreenHeader(로고 + 벨, 오버라인 "Location off · showing Seoul", 제목 "Hello there" — wash 없음) → 안내 카드: "Weather unknown" / "Where are you cooking?" / Button Primary M "Choose city" + Outline M "Allow location" → Pick Card(맨 아래 태그 `cloud-rain` 12° · 128): "Kimchi jjigae for the first cold rain", "Minji · Mapo, Seoul · 40 min ago" → TabBar/FAB.
- 이동: Choose city → 9.7 · Allow location → (권한) 2.1.

### 2.6 State · Weather unavailable — [108:3297](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=108-3297)
- 노트: 홈과 **같은 화면 구조**를 유지하고, 날씨 대신 **지금 시간(끼니) + 내 취향**(도토리·저장·다이어리 기록)으로 추천. 날씨 카드를 탭하면 다시 불러온다.
- 차이점만:
  - 오버라인 "Tue, Oct 27 · Mapo, Seoul · 6:40 PM", 제목 "Dinner time".
  - **Weather card는 2.1과 같은 규격**(350×307, Now 줄 높이 68): 큰 숫자 "--°" · 상태 "No weather yet" · 보조 "Tap ↻ to retry" · 오른쪽 `cloud`(fg/muted). Picks head = "Picks for your taste" + Refresh(탭 → 날씨 다시 불러오기).
  - 슬롯 라벨 아래 숫자 = 시간(Lunch 12:30 · Now 7:00 · Late 10:00 · Dawn 7:30).
  - Story: "Kimchi jjigae — you gave stews 12 acorns this month".
  - Mood wash = `Mood/overcast`(Figma 108:3298). 날씨 데이터가 없으므로 **날씨 모션은 숨기고 멈춘다**(wash 그라데이션만).
  - 피드: 2.1과 같은 규칙(현재 날씨가 없으면 정렬 없이 최신순).
- 이동: 날씨 카드("6:40") 탭 → 재시도 → 성공 시 2.1. 나머지는 2.1과 동일.

### 2.7 State · Loading — [76:2961](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-2961)
- 노트: *Skeletons echo final layout; the weather gradient fades in first so the mood arrives before content.*
- **2.1과 같은 위치·크기**의 스켈레톤(막대 = bg/muted, 카드 = bg/subtle + 1px border/default). 위→아래:
  1. Mood wash(실제 그라데이션, 가장 먼저 표시)
  2. StatusBar
  3. **헤더는 스켈레톤이 아니라 실제 ScreenHeader**(로고 · 벨 · 날짜 · 제목)가 그대로 보인다. 본문만 shimmer.
  4. **Weather card 스켈레톤** 350×239 r32(padding 20): [기온 96×56 r12 + 줄 110×14·150×12] → 구분선 → 끼니 슬롯 4칸(라벨 36×10 · 원 52 · 기온 28×10)
  5. Story card 자리 350×273 r32 → Nearby card 스켈레톤 350×100 r32(썸네일 72 r16 + 줄 3개)
  6. 피드: 헤더(150×11, 220×24) → 칩 4개(높이 36, 폭 49/110/72/92) → 게시물 1개(아바타 32 + 줄 2개, 사진 390×440 r4)
  7. TabBar(Home, Expanded, CreateFAB 포함) · Home Indicator. 스크롤 없음.
- shimmer: 좌→우 1.2초 반복, bg/muted ↔ bg/emphasis.
- 순서: Mood wash 페이드인(200ms) → 콘텐츠 페이드인. 프로토타입상 1.2초 후 → 2.1.

---

### 2.8 Notifications — [356:8637](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=356-8637)
- 진입: Home · Community 헤더(ScreenHeader)의 `bell`. 푸시 알림을 탭해도 해당 화면으로 바로 가고, 이 목록에서 읽음 처리된다.
- 골격: StatusBar → TopBar(Inline) "Notifications"(뒤로 · 오른쪽 `settings` → 9.4) → 필터 칩 **All**(Selected) · Activity · For you → 그룹별 **Notification Row** 목록 → "Notifications older than 30 days are cleared." 세로 스크롤(390×992).
- 그룹: **NEW**(안 읽음, 배경 bg/accent-subtle + 점) → **TODAY** → **THIS WEEK** → EARLIER.
  | 종류 | 예시 문구 | Lead · Badge | 오른쪽 | 탭 → |
  |---|---|---|---|---|
  | 도토리(반응) | "minji.cooks and 11 others gave acorns to your Kimchi jjigae for one." | Avatar · `acorn-color` | 사진 썸네일 | 7.1 |
  | 댓글·답글 | "hana.kitchen commented: “Need this tonight…”" | Avatar · `message-circle` | 썸네일 | 7.2 |
  | 날씨 픽(For you) | "Rain starts around 6 PM in Mapo. Today’s pick: …" | 아이콘 원 `cloud-rain`(현재 날씨) | — | 2.1 |
  | 새 팔로워 | "kenji.eats started following you." | Avatar · `user` | Button S **Follow back**(이미 팔로우 중이면 숨김) | 4.5 |
  | 주방 타이머 | "“Simmer the stew” is done. Back to step 3?" | 아이콘 원 `timer` | — | 5.1 |
  | **게시물 조치**(신고 처리 결과) | "Your dish “Late-night ramen” is hidden — reported as Spam or advertising. Tap to see why or appeal." | 아이콘 원 `flag` | — | 이유·이의 제기(9.8 Contact support의 Appeal) |
  | 내일 예보 픽 | "Clear and 21° tomorrow morning — your daily pick arrives at 7:30 AM." | 아이콘 원 `sun` | — | — |
- 묶기: 같은 게시물의 도토리는 1시간 단위로 "A and N others"로 합친다. 댓글은 각각.
- Activity = 도토리 · 댓글 · 팔로워 · 메시지, For you = 날씨 픽 · 예보 · 타이머.
- 이동: 뒤로 → 이전 화면 · `settings` → 9.4.

### 2.8b State · No notifications — [356:8998](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=356-8998)
- 2.8과 같은 상단. 가운데 빈 상태: 72 원(bg/muted) + `bell` 30 → "All quiet for now"(Title/L) → "Acorns, comments, new followers and weather picks will show up here." → Button Outline M "Notification settings" → 9.4.
- OS 알림이 꺼져 있으면 9.4와 같은 Inline Banner "Notifications are off in system settings · Turn on"을 맨 위에 둔다.

