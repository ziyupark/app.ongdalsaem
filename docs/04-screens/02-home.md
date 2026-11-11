# Screens 02 · Home

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 02 Home — [섹션 59:2361](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2361)

### 홈 공통 레이아웃 (2.1 / 2.2 / 2.3 / 2.6)
1. [A] **Mood wash** — 현재 날씨 무드([§2.4](../01-foundations.md)) 그라데이션. 앱 진입 시 가장 먼저 페이드인.
2. StatusBar.
3. **헤더 행**: 좌 Logo(Compact) "ongdalsaem", 우 IconButton(Soft, M) `bell`(알림 → **2.8**, 안 읽은 알림이 있으면 6px 점). *Map 버튼 없음.*
4. **날짜·위치 오버라인**: "Tue, Oct 27 · Mapo, Seoul".
5. **대제목** Display/XL 두 톤: "Rainy evening"(날씨 단어 강조) — 날씨 무드 + 시간대(morning/afternoon/evening/night) 조합.
6. **Weather card** (bg/subtle, radius 2xl 32, padding 20):
   - 큰 기온 Numeric/XL "12°" + 상태 "Light rain" + "H 14° · L 8° · until 9 PM" + 무드 오브(우측).
   - **Meal timeline**: 4개 슬롯 가로 배치 — 이전 끼니 · **Now** · 다음 · 그다음. 각 슬롯 = 끼니 라벨 + 썸네일 원 + 예보 기온. Now 슬롯은 **선셋 그라데이션 링**.
     - **네 칸은 항상 같은 폭**: 타임라인 폭(308)을 4등분, 칸 사이 4 → 칸당 74px(`flex: 1 1 0`). 라벨 길이(예: `BREAKFAST`)와 관계없이 폭이 같고, 라벨은 칸 가운데 정렬. 가장 긴 라벨 BREAKFAST(약 71px)도 74px 안에 들어간다.
   - 빈 슬롯(아직 아무도 올리지 않은 시간대)은 점선 원 + `+` → 8.1.
   - **Picks head**(구분선과 타임라인 사이): "Picks for this weather" ··· **Refresh** 아이콘 버튼(`rotate-ccw` 32 원, 글자 없음). 탭할 때마다 같은 날씨·기온·무드에 맞는 **다른 요리**로 네 슬롯을 다시 채운다([§6.1](../05-behavior.md)).
   - **Mood Prompt**(카드 아래 12, 350×48): "How do you feel right now?" 한 줄 입력 + 보내기. 보내면 아래 Today’s pick이 날씨·기온 + 내 기분에 더 가깝게 바뀐다([§6.2](../05-behavior.md)).
7. **Story Card "Today’s pick"**(Show focus · Show byline **Off** — "Why it fits…" 줄과 "Cooked by … · 40 min ago" 줄 없음): "Today’s pick"(Eyebrow 없음) → 문장 "Kimchi jjigae for the first cold rain" + 요리사 Avatar 40 → 맨 아래 Tags 줄(Weather Tag · Acorn Tag). Mood Prompt를 보낸 뒤에는 문장과 요리가 바뀌고, 보낸 문구는 Mood Prompt 칸에 남아 무엇을 기준으로 골랐는지 보여 준다. 태그 값: 2.1/2.1b/2.6 `cloud-rain` 12° · 128, 2.2 `sun` 21° · 96, 2.3 `cloud-snow` −4° · 141. 탭 → 7.1.
8. **Nearby card** (가로, padding 14, gap 14, radius 2xl(32), bg/subtle + 1px border/default): 72×72 사진(radius lg 16) → "Eat this nearby"(Overline) / "3 places serve kimchi jjigae"(Title/M) / "Closest 350 m · open now"(Body/S) → `chevron-right`. 탭 → 2.4.
9. **Block · feed — 무한 스크롤 피드** (Nearby card 바로 아래, 전체 폭, padding-top 40):
   - **Feed header**(padding 0 20 14 20, gap 6): Title/L fg/default(예: `Kimchi jjigae & friends`) — 위 Overline 없음.
   - **Similar chips**(가로 스크롤, gap 8, padding 0 20 8 20): 첫 칩 `All` Selected, 나머지 Default — [오늘의 픽 요리명] · [요리 카테고리] · [현재 날씨+기온]. 칩 선택 시 피드 필터.
   - **Feed Post ×N**([§3.3](../02-components.md)), 게시물 사이 간격 = 각 게시물 padding-bottom 24.
   - **Loading more**(가로 가운데, gap 10, padding 8 0 24): 16px 원호 스피너(fg/accent) + Caption fg/muted `Loading more like this…`. 리스트 끝 600px 전에 다음 페이지 요청.
   - **Tab bar spacer** 96px.
   - 피드 내용 규칙은 [§6.7](../05-behavior.md).
10. [A] TabBar(Home, CreateFAB 포함) · [A] Home Indicator.

### 2.1 Home · Rainy evening — [19:191](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=19-191)
- 데이터: "Tue, Oct 27 · Mapo, Seoul" / "Rainy evening" / 12° Light rain / H 14° · L 8° · until 9 PM.
- 슬롯: Lunch 13° · **Now** 10° · Late 8° · Dawn 7°(빈 슬롯).
- 이동: Lunch/Now/Late → 7.1 · Dawn(빈) → 8.1 · Story card → 7.1 · Eat this nearby → 2.4 · 피드 사진 → 7.1 · 피드 댓글 → 7.2 · 탭바 Community 4.1 / Timer 5.1 / Profile 6.1 · FAB → 8.1.
- 스크롤: 세로(피드 무한). 아래로 스크롤 시 TabBar → **Collapsed**(TabBar `State=Collapsed` variant) + CreateFAB 숨김, 위로 스크롤하면 Expanded로 복귀([§3.1](../02-components.md)). 별도 화면 없음.
- **피드**: 헤더 `Kimchi jjigae & friends`, 칩 `All` · `Kimchi jjigae` · `Stews` · `Rainy 12°`.

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
- Pick: "Naengmyeon, icy and bright" / "Cooked by Jae in Haeundae · 1h ago". Nearby: "5 places serve naengmyeon" / "Closest 600 m · open now". 무드 = clear.
- **피드**: 헤더 `Naengmyeon & cool bowls`, 칩 `All` · `Naengmyeon` · `Cold noodles` · `Clear 21°`.

  | # | Name | Meta | Weather | 사진 | Counter | 💬 | Caption |
  |---|---|---|---|---|---|---|---|
  | 1 | jae.eats | Haeundae, Busan · 1h | Clear 21° (`sun`) | naeng | 1 / 3 | 12 | Icy broth, a splash of vinegar, mustard on the side. Summer isn’t over in Busan. |
  | 2 | hana.kitchen | Suyeong, Busan · 2h | Clear 22° (`sun`) | bibimguksu | 1 / 2 | 7 | Bibim guksu with cucumber ribbons — sweet, spicy, and cold. |
  | 3 | dongwoo.b | Seomyeon, Busan · 3h | Sunny 23° (`sun`) | bingsu | 1 / 1 | 4 | Patbingsu after lunch. Too early? Never. |

  사진 위 태그: Weather Tag = Weather 열의 아이콘 + 기온, Acorn Tag = 85 · 54 · 39.

### 2.3 Home · Snowy night — [26:647](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-647)
- "Thu, Oct 29 · Sapporo" / "Snowy night" / "Light snow" −4° / H −1° · L −7° · until midnight.
- 슬롯: Dinner · **Now** −2° · Dawn −7° · Breakfast −6°(빈 → 8.1).
- Pick: "Miso butter corn ramen, late" / "Cooked by Aoi in Sapporo · 20 min ago". Nearby: "4 shops serve miso ramen" / "Closest 450 m · open late". 무드 = snow(야간 톤).
- **피드**: 헤더 `Ramen & warm bowls`, 칩 `All` · `Miso ramen` · `Noodle soup` · `Snowy −4°`.

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
- 정렬: 거리 오름차순. 필터 기본값 Open now.
- 이동: 뒤로 → 2.1 · 카드 탭 → 기기의 지도 앱으로 길찾기(카카오맵 · Apple 지도 · Google 지도 중 설치된 것, 목적지 = 식당 좌표). 앱 안 지도 화면은 없다.

### 2.5 State · Location off — [76:2923](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-2923)
- 노트: *Home still works. Defaults to the last chosen city and invites a manual pick — never blocks the feed.*
- 블록: StatusBar → 헤더(로고+벨) → 안내 카드: "Location off · showing Seoul" / 제목 "Hello there" / "Weather unknown" / "Where are you cooking?" / Button Primary M "Choose city" + Outline M "Allow location" → Pick Card(맨 아래 태그 `cloud-rain` 12° · 128): "Kimchi jjigae for the first cold rain", "Minji · Mapo, Seoul · 40 min ago" → TabBar/FAB.
- 이동: Choose city → 9.7 · Allow location → (권한) 2.1.

### 2.6 State · Weather unavailable — [108:3297](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=108-3297)
- 노트: 홈과 **같은 화면 구조**를 유지하고, 날씨 대신 **지금 시간(끼니) + 내 취향**(도토리·저장·다이어리 기록)으로 추천. 날씨 카드를 탭하면 다시 불러온다.
- 차이점만:
  - 오버라인 "Tue, Oct 27 · Mapo, Seoul · 6:40 PM", 제목 "Dinner time".
  - **Weather card는 2.1과 같은 규격**(350×285, Now 줄 높이 64): 큰 숫자 "--°" · 상태 "No weather yet" · 보조 "Tap ↻ to retry" · 오른쪽 `cloud`(fg/muted). Picks head = "Picks for your taste" + Refresh(탭 → 날씨 다시 불러오기).
  - 슬롯 라벨 아래 숫자 = 시간(Lunch 12:30 · Now 7:00 · Late 10:00 · Dawn 7:30).
  - Story: "Kimchi jjigae — you gave stews 12 acorns this month".
  - Mood wash = 시간대 기본 톤(evening).
  - **피드**: 헤더 `Kimchi jjigae & your favourites`, 칩 `All` · `Kimchi jjigae` · `Stews` · `You saved`(날씨 칩 대신 저장 기반). 게시물 3개는 2.1과 동일(각 게시물의 날씨 pill은 작성 당시 날씨라 그대로 표시).
- 이동: 날씨 카드("6:40") 탭 → 재시도 → 성공 시 2.1. 나머지는 2.1과 동일.

### 2.7 State · Loading — [76:2961](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-2961)
- 노트: *Skeletons echo final layout; the weather gradient fades in first so the mood arrives before content.*
- **2.1과 같은 위치·크기**의 스켈레톤(막대 = bg/muted, 카드 = bg/subtle + 1px border/default). 위→아래:
  1. Mood wash(실제 그라데이션, 가장 먼저 표시)
  2. StatusBar
  3. 헤더(높이 40): 로고 자리 125×26 r8 · 벨 자리 40 원
  4. 날짜 172×14 r999 → 제목 250×49 r12 → **Weather card 스켈레톤** 350×239 r32(padding 20): [기온 96×56 r12 + 줄 110×14·150×12] → 구분선 → 끼니 슬롯 4칸(라벨 36×10 · 원 52 · 기온 28×10)
  5. Story card 자리 350×273 r32 → Nearby card 스켈레톤 350×100 r32(썸네일 72 r16 + 줄 3개)
  6. 피드: 헤더(150×11, 220×24) → 칩 4개(높이 36, 폭 49/110/72/92) → 게시물 1개(아바타 32 + 줄 2개, 사진 390×440 r4)
  7. TabBar(Home, Expanded, CreateFAB 포함) · Home Indicator. 스크롤 없음.
- shimmer: 좌→우 1.2초 반복, bg/muted ↔ bg/emphasis.
- 순서: Mood wash 페이드인(200ms) → 콘텐츠 페이드인. 프로토타입상 1.2초 후 → 2.1.

---

### 2.8 Notifications — [356:8637](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=356-8637)
- 진입: 홈 헤더 `bell`, Community(Global · Nearby · Following) · Timer TopBar의 `bell`. 푸시 알림을 탭해도 해당 화면으로 바로 가고, 이 목록에서 읽음 처리된다.
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

