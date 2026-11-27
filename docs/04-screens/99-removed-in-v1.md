# Screens 99 · Removed in v1

> v1을 작게 만들기 위해 뺀 화면. **이 문서의 화면 번호(1.2b · 4.3 · 4.11 · 4.12 · 4.21c · 9.9e …)는 빼기 전의 옛 번호**다 — 지금 같은 번호를 쓰는 다른 화면과 헷갈리지 않게 Figma 프레임 이름 앞에 "× "를 붙였다. 본문 속 살아 있는 화면 참조는 새 번호로 바꿨다. Figma **99 Removed in v1** 섹션에 그대로 두었고(프로토타입 연결 없음), 나중에 되살릴 때 아래 설명을 기준으로 한다. 색인 → [README](../README.md)

| 뺀 기능 | 화면 | 대신 |
|---|---|---|
| 이메일 로그인 | 1.2b · 1.3 · 1.4 · 1.4b (+ 상태 4개) | Apple · Google 로그인만(1.2) |
| ~~메시지(DM)~~ → **앱에 다시 들어감** | 4.11(대화함 · 대화) · 7.5 | 지금 명세는 [04-community 4.11](04-community.md). 7.5 Send to 시트는 파일만 남아 있고 어디서도 열지 않음 |
| 마케팅 수신 동의 | 9.9e (+ 9.4 ADS & EVENTS) | 광고 · 이벤트 푸시를 보내지 않음 |
| ~~컬렉션~~ → **6.2 Saved 안에 다시 들어감** | 7.6 · 7.6b | 지금 명세는 [06-profile 6.2](06-profile.md)(저장 시 7.6 시트는 없음) |
| 길찾기 | 2.4b | 식당 카드 → 지도 앱(카카오맵 · Apple 지도 · Google 지도) 열기 |
| 테이블 Questions · About 탭 | 4.21c · 4.21d | 동네 질문(3.7 · 3.8), 규칙 줄 → 규칙 시트(개발 단계) |
| 명절 템플릿 | 4.12 | 4.2 태그 템플릿(명절 태그) + 4.1b 명절 전체 목록 |
| 나라 전체 보기 | 4.3 | 4.1 Trending Bites(See all 없음) |
| 문서 오프라인 | 9.9d | 공통 연결 오류 처리 |
| Eat together | 4.23 | 2단계 |
| Food challenges | Challenges 탭 · 4.9 · 4.10 · 4.10b · 4.10c · 2.1c | 나중에 다시 넣음(아래 Food challenges) |

Figma 컴포넌트 중 이 화면들에서만 쓰던 것(Chat Bubble · `calendar` · `phone` · `footprints` · `bus` · `car` · `arrow-up` 아이콘)은 삭제했다 — 이 섹션의 해당 인스턴스는 원본 없이 모양만 남아 있다. 되살릴 때 Figma 버전 기록에서 복구한다.

DB 테이블 중 messages · message_threads · collections · collection_items는 앱이 다시 쓴다. marketing 컬럼 · challenges 테이블 등은 남아 있지만 쓰지 않는다.


## from 01-sign-in-setup.md

### 1.2b Log in with email — [449:10898](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=449-10898)
- TopBar(Inline, 뒤로 → 1.2) → 제목 Display/L "Welcome back. / Log in with email."(y 118 — 1.3 · 1.4 · 1.4b와 같은 위치) → Input(Filled) Email `jiyu@ongdalsaem.app` → Input(Focus) Password `••••••••••`(👁) → 링크 "Forgot password?"(fg/accent) → "New here? **Create an account**"
- [고정] Button Primary L **"Sign in"**(744–800).
- 이동: Sign in → 2.1 · Forgot password? → 1.4 · Create an account → 1.3 · 뒤로 → Back.
- 오류: 이메일·비밀번호가 틀리면 Password Input Error "That email and password don’t match." (어느 쪽이 틀렸는지 알려 주지 않음 — 보안).

### 1.3 Sign up — [14:131](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=14-131)
- 블록: StatusBar → TopBar(Inline, 뒤로) → 제목 "Pull up a chair." + 설명 "Share what you cook on rainy Tuesdays and sunny Sundays." → Input(Filled) Email → Input(Default) Password placeholder "At least 8 characters", helper "At least 8 characters, with letters and a number. Tap 👁 to check it." → **체크박스(22, radius 4, 선택 = bg/primary + `check` 14)** + 글(FILL, 줄바꿈, 화면 안쪽 20 안에서) "I’m 14 or older and agree to the **Terms** and **Privacy Policy**."(Terms·Privacy Policy는 링크 → 9.9의 같은 문서 웹뷰) → [고정] Button Primary L "Create account"(744–800).
- 비밀번호 확인은 비밀번호 칸의 눈(👁) 아이콘(보이기/숨기기)으로 한다. 확인용 두 번째 칸은 두지 않는다.
- 검증: 이메일 형식, 비밀번호 ≥ 8자 + 문자·숫자. 미충족 시 해당 Input Error. 체크박스 미동의 시 버튼 Disabled.
- 연령: 만 14세 미만 가입 불가(법정대리인 동의 절차를 두지 않기 위해). 체크박스 한 줄로 연령 확인 + 약관·개인정보처리방침 동의를 받는다. 마케팅 동의는 여기서 받지 않고 9.4/9.9에서 따로(선택, 기본 꺼짐).
- 이동: 뒤로 → BACK · Create account → 1.3.

### 1.4 Forgot password — [26:490](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-490)
- 블록: StatusBar → TopBar(Inline) → 제목 "Forgot it? / Happens on cold days." + "Enter your email and we’ll send a link to set a new password." → Input(Focus) Email → Button Primary L "Send reset link" → 성공 안내(전송 후 표시) "Sent! Check your inbox — the link lasts 30 minutes."
- 보안: 가입되지 않은 이메일이어도 같은 성공 문구를 보여준다(가입 여부 노출 방지).
- 이동: 뒤로 → BACK · Send reset link → (성공 표시 후) 1.2b. 버튼은 [고정] 744–800.

### 1.4b Set new password — [408:9399](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=408-9399)
- 진입: 1.4에서 보낸 메일의 링크(딥링크 `ongdalsaem://reset?token=…`, Supabase `PASSWORD_RECOVERY` 이벤트). 앱 안 다른 화면에서는 들어오지 않는다.
- 블록: StatusBar → TopBar(Inline, `chevron-left` → 1.2b) → 제목 "Set a new password." + "Pick something you’ll remember on a sleepy morning." → Input New password(👁) helper "At least 8 characters, with letters and a number." → Button Primary L **"Save and sign in"**. (1.4의 "Sent!" 안내 블록은 숨김)
- 링크 만료(30분) 시: Inline Banner Warning "This link has expired. Send a new one." → 1.4.
- 이동: Save and sign in → 2.1(바로 로그인 상태) · 뒤로 → 1.2b. 버튼은 [고정] 744–800.

## from 02-home.md

### 2.4b Mapo Jjigae House · Directions — [109:3225](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=109-3225)
- 목적: 식당 탭 시 **지도가 자동으로 열리고 내 위치 → 식당 길안내**.
- 레이아웃(스크롤 없음, 전면 지도):
  - [A] Map(전체 배경): 도로 라벨(Wausan-ro, Yanghwa-ro, Seogyo park), 내 위치 점, 경로 폴리라인(fg/accent), 목적지 핀 + 말풍선 "Mapo Jjigae House / Kimchi jjigae · ₩9,000", 경로 라벨 "5 min · 350 m".
  - [A] 좌상단 IconButton(Soft) 뒤로, 우상단 IconButton(Soft) 공유/내 위치.
  - [A] 교통수단 세그먼트: 도보 5 min(선택) · 대중교통 9 min · 차 4 min (`footprints`/`bus`/`car`).
  - [A] 하단 시트(bg/subtle, radius 2xl 상단): "Open till 22:00 · 5 min walk" → 식당명 → "Kimchi jjigae · ₩9,000" → 주소 행 "12 Yanghwa-ro 7-gil, Mapo-gu, Seoul" + **Copy** 버튼(`copy`) + 한글 주소 "서울 마포구 양화로7길 12" → 단계별 안내(`corner-up-right` 등): "Head west on Yanghwa-ro · 40 m" / "Turn right toward Seogyo park · 130 m" / "Turn right, then left onto 7-gil · 180 m" → Button Primary L "Start walking" + IconButton(Soft, L) `phone` 전화 + IconButton(Soft, L) View dish.
- 동작: Copy → 클립보드에 주소 복사 + Toast "Address copied". Start walking → 외부 지도 앱 딥링크(카카오맵/네이버지도/Apple Maps). 전화 → `tel:`. View dish → 7.1. 뒤로 → 2.4.

## from 04-community.md

### 4.3 Countries · See all — [183:5353](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=183-5353)
- 푸시 화면(TabBar 없음, 세로 스크롤).
- 블록: TopBar(Inline) "Trending by country" → 헤더 Display "Six kitchens, / six skies." / "Local weather · updated every hour" → **검색 필드** "Search countries or cities"(`search`) → 탭 **Trending** · Same weather → **Country Card 세로 목록(폭 350 FILL, 간격 12)**:

  | 국기 | Title | 사진 | Weather Tag | Acorn |
  |---|---|---|---|---|
  | 🇯🇵 | Oyakodon tonight | donburi | `cloud` 14° | 87 |
  | 🇮🇹 | Panzanella at noon | panz | `sun` 22° | 64 |
  | 🇲🇽 | Elote by the street | elote | `sun` 27° | 112 |
  | 🇰🇷 | Kimchi jjigae for the first rain | kimchi1 | `cloud-rain` 12° | 128 |
  | 🇹🇭 | Khao soi at dusk | noodleSoup | `cloud-sun` 29° | 73 |
  | 🇨🇳 | Dumplings for a cold night | dumpl | `cloud` 6° | 58 |
- 검색: 나라 이름·도시 이름(영어 + 현지어, 예: "Japan · 日本 · Osaka") 부분 일치, 250ms 디바운스. 결과 0개 → "No countries match “…”" + 지우기.
- 정렬: Trending = 최근 24h 도토리 증가순, Same weather = 내 날씨 무드와 같은 나라 먼저.
- 이동: 카드 → 4.3 · 뒤로 → BACK.

### 4.12 Festive · Halloween (template) — [398:9012](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=398-9012)
- **명절 페이지 템플릿**(Christmas · Chuseok · Seollal · Diwali …). TopBar "Halloween" → 오버라인 "OCT 31 · HALLOWEEN · TOMORROW" / "Pumpkins, candles, / slow soups." / "Cooked in 21 countries · 640 dishes this week" → **CELEBRATED IN** #USA · #UK · #Ireland · #Canada · #Mexico · "+16" → 탭 Popular · Latest · Near me → Food Card Grid:
  - Roasted pumpkin soup (Halloween · Dinner, `cloud` 9° · 134)
  - Soul cakes (Halloween · Snack, `wind` 7° · 88)
  - Colcannon (Halloween · Dinner, `cloud-drizzle` 10° · 71)
  - Candy apples (Halloween · Snack, `sun` 13° · 56)
- 데이터: 게시물에 명절 태그(`festive:halloween` 등)가 붙은 것. 작성 시 날짜가 명절 ±3일이면 8.3에서 태그 제안.
- 사진: 현재 카드 사진은 **자리표시자**(다른 요리 사진). 출시 전 라이선스가 확인된 사진으로 바꾼다.
- 저작권: 명절 이름·음식 이름은 일반 명사라 문제없다. 캐릭터(예: 유명 영화·만화의 호박 캐릭터) 그림은 쓰지 않는다.
- 이동: 나라 칩 → 4.3 · 카드 → 7.1 · 뒤로 → BACK.

### 4.11 Message · Aoi — [352:9114](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=352-9114)
- 4.5 **Message**와 2.8 메시지 알림에서 연다. TopBar(Inline) "Aoi"(뒤로).
- 날짜 칩 "Today"(bg/muted pill) → 말풍선: 내 것 = 오른쪽, bg/primary + fg/on-primary, 오른쪽 아래 모서리 6 / 상대 = 왼쪽, bg/subtle, 왼쪽 아래 모서리 6. 최대 폭 260, 아래 시간 Caption("6:06 PM · Seen").
- 안내 "Messages from cooks you don’t follow arrive as requests. Report or block from ··· anytime."
- [고정] **Comment Composer**(내 아바타 · 48 pill 입력 "Message Aoi…" · `arrow-right`) + Home Indicator.
- 규칙: 누구에게나 보낼 수 있지만, 상대가 나를 팔로우하지 않으면 상대 쪽에서는 **메시지 요청**으로 받는다(수락 전에는 읽음 표시 없음, 사진·링크 차단). 차단하면 대화가 숨겨지고 더 받지 않는다. 신고는 7.3과 같은 흐름.

### 4.21c Table · Questions — [502:10835](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=502-10835)
- 4.21b와 같은 위(Hero · Meta · 규칙 줄), 탭 **Questions** active. 본문: **Ask the table** 줄(bg/subtle + border/default, radius 16, `message-circle` · "Ask #SoloMeals…") → **Question Card** ×2(Source icon `utensils`, Where "#SoloMeals · 1h ago", 사진 끔):
  - Hana — "Is it worth buying a small rice cooker just for one?"(Ingredients · 6 answers · Me too 14)
  - Jae — "How do you stop a whole cabbage of kimchi from going sour before you finish it?"(Recipe help · 3 answers · Me too 9)
- 캡션 "Questions here are open to everyone in the table, wherever they live." 테이블 질문은 동네 제한이 없고 장소 이름 대신 테이블 이름이 나온다. 질문은 멤버만 할 수 있다(아니면 Ask 줄 대신 Join).
- 이동: Ask 줄 → 3.7(테이블이 미리 선택, 장소 pill 대신 "#SoloMeals") · 카드 → 3.8.

### 4.21d Table · About — [502:12274](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=502-12274)
- 탭 **About** active, Post to table 버튼 없음. 본문(gap 24): 소개 Body/M "A table for anyone cooking for one. Small portions, smart leftovers, and meals that still feel like a treat on a quiet night." → **Table rules**(Ingredients List 형식): One-person portions · Always / Your own cooking or eating · Photos you took / Be kind · No shaming portions / No ads or selling · Removed → **Facts** 박스(bg/subtle): `calendar` Started Oct 2026 · `users` 12.4k members · 86 posts today · `acorn` Hosted by ongdalsaem → Button Ghost M **Leave table**(확인 시트는 개발 단계에서).

### 4.23 Eat together · Dumpling night (Phase 2) — [470:11548](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=470-11548)
- **2단계 설계 참고용 — v1에서 만들지 않는다**(화면 맨 위 점선 "PHASE 2" 표시, 프로토타입 연결 없음, DB 없음).
- 블록: 사진 → "Dumpling night, we fold together" / 설명 → 상세 박스(`calendar` 날짜 · `map-pin` **동네만, 정확한 장소는 수락 후** · `users` 2 of 4 seats left · `utensils` 장보기 나눠 내기) → 호스트(아바타 40, "Hosted 3 times · ID verified") → **Meeting safely** 안내(bg/accent-subtle, 제목 fg/default · 본문 fg/secondary) → CTA **Ask to join**(호스트가 수락).
- 2단계에서 정할 것: 본인 확인, 최대 인원, 미성년자 제한, 노쇼 · 신고 처리, 장소 공개 시점.

### Food challenges (Challenges 탭 · 4.9 · 4.10 · 4.10b · 4.10c · 2.1c) — 2026-11-27에 뺌
- 나중에 다시 넣을 예정. 앱 코드(Challenges 탭 · `/challenges` · `/challenge/[slug]` · 공유 흐름의 챌린지 참가 · 챌린지 테마 그림 `assets/holidays/*.jpg`)와 문구 `challenge.*` · `community.challenges` · `community.challengesTab` · `share.inChallenge` · `share.challengeOnePhoto` · `share.pickHintChallenge`는 지웠다 — git 기록에서 되살린다.
- DB 테이블 challenges · challenge_participants · challenge_entries는 남아 있지만 앱이 쓰지 않는다.
- Challenges 탭 맨 아래에 있던 **Viral Bites**도 탭과 함께 빠졌다(4.7 Viral 상세 화면 코드는 남아 있지만 여는 곳이 없음).
- 아래는 뺄 때의 명세 그대로.

### 4.1 Community · Challenges(탭, 뺌) — [680:11155](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=680-11155)
- Community 세 번째 탭. 위에서부터(섹션마다 SectionHeader):
  1. **This week’s challenge**(Overline "SEASONAL TABLES"): 큰 카드(테마 사진 + 아래 scrim) — 위 유리 pill "Live · {남은 시간}"(점 fg/accent) → 제목 · 설명 → 참여자 아바타 24 겹침 + "{n} cooking · {n} entries" → 버튼: 참여 전 White M **Join challenge** · 참여 후 Kick M `upload` **Post my entry**(→ 8.1, 태그 미리 붙음) · 올린 뒤 Glass M `check` **Entry posted**(비활성). 카드 탭 → 4.10.
  2. **Your challenges**: 참여 중 챌린지 행(올렸으면 "Entry posted", 곧 시작 "Starts …", 아니면 "Post before …" + **Post** 버튼).
  3. **Top entries** + See all(→ 4.10): 그 챌린지 인증 사진 그리드.
  4. **Coming up** + See all(→ **4.9**): 가로 카드(남은 기간 대문자 · Join / Join early / Joined).
- 간격([4.10 826:15539](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=826-15539)): **This week’s challenge** 제목(Title/L) 위 **22** → 제목 → 카드 **15**(3 + 6 + 6). **Coming up** = 섹션 위 32 + 제목 묶음 위 **22** · 아래 **3** → 12 → 카드(제목 → 카드 15). Recently ended · Viral Bites = 섹션 위 32, 제목 패딩 없음 → 12(Viral 6) → 카드. **진행 중 챌린지가 없으면**([4.10 No Challenge 1269:18199](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1269-18199)) This week’s challenge · Join · Ends in · Latest entries가 통째로 빠지고 **Coming up이 맨 위** — 섹션 위 32 없이 탭 바로 아래 제목 묶음 위 22부터 → Recently ended(위 32) → Viral Bites.
  5. **Recently ended**: 끝난 챌린지 행(흐리게, "Ended {date} · {n} entries").
  - 맨 아래 **Viral Bites**(Figma 1113:25966, 위 32 · gap 6): SectionHeader "Viral Bites" → Country Card **전체 폭 × 180** 세로로 최대 3장(gap 12, r32, padding 14 18, 아래 120 잉크 페이드) — 위 Flag Tag(18, 12) + Viral badge(62, 12: "🔥 +n% this week" bg/kick · "✦ Editor’s pick" bg/inverse) · 아래 Display/M 요리 이름 → Weather Tag · Acorn Tag. 탭 → 4.7. 편집자 픽 먼저, 그다음 뜨는 요리. 없거나 실패하면 섹션을 숨긴다(챌린지가 없어도 보임). 모아 보는 목록 화면이 없어 제목 옆 ›는 두지 않는다.
  6. **How it works**: Join("Shows up on Home") · Cook(그 챌린지 규칙) · Post(#태그) + Caption "Challenges are made by ongdalsaem and last 3–14 days. Post one public dish with the tag while it runs."
- 챌린지가 없으면 EmptyState `flag` "No challenges right now".

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

## from 07-dish.md

### 7.5 Send to — [367:9340](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=367-9340)
- Feed Post `send`(Direct) 또는 7.4 Send in app.
- "Send to" ··· "2 selected"(fg/accent) → Search Field "Search people" → 사람 목록(bg/default, radius 16, 행: Avatar 40 · 이름 / 관계 "Follow each other" · "You follow" · "Follows you" · 선택 원 24 — 선택 = bg/primary + `check`). 맨 위는 최근 대화 · 서로 팔로우 순.
- "Kimchi jjigae for one will be attached as a dish card"(`image` 16) → 메시지 입력 48 pill "Add a message… (optional)" → Primary L **Send to 2**(선택 수 실시간, 0이면 Disabled).
- 보내면 사람마다 4.11 대화에 요리 카드 + 메시지로 들어가고 토스트 "Sent to aoi.sapporo and 1 other". 나를 팔로우하지 않는 사람에게는 메시지 요청으로 간다.

### 7.6 Save to collection — [370:9014](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=370-9014)
- Feed Post `bookmark`를 누르면 **바로 저장**(All saved)되고 이 시트가 올라온다. 6.2 Saved의 Collections(그룹)와 같은 데이터.
- Head: 32 원 bg/accent-subtle + `bookmark` · "Saved"(Title/M) / "Kimchi jjigae for one · also add it to a collection?"
- 컬렉션 목록(bg/default, radius 16, 행: 커버 사진 44 radius 12 · 이름 Body/M Strong / 개수 Caption · 선택 원 24):
  - **All saved** "49 dishes · always" — 항상 포함(`lock`, 끌 수 없음)
  - Rainy day bowls 6 ✓ · Weeknight dinners 4 · For guests 2 — 여러 개 선택 가능, 탭 즉시 반영
  - `plus` 점선 칸 **New collection** → 7.6b
- 안내 "Weather groups (Rainy · Snowy · Clear) fill in on their own from the weather each dish was cooked in." — 6.2의 날씨 칩은 자동 분류, 컬렉션은 사용자가 만든 그룹.
- 버튼: Ghost L **Remove from saved**(저장 해제 + 모든 컬렉션에서 빠짐, Undo 토스트) · Primary L **Done**.

### 7.6b New collection — [370:9856](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=370-9856)
- 7.6 New collection · 6.2 Collections "+ New"에서 연다.
- "New collection" → 입력칸 52(1.5 border/focus) "Cold-night soups" ··· "16 / 30" → IDEAS FROM YOUR SAVED DISHES 칩(`cloud-rain` Rainy evenings · `cloud-snow` Snow-day ramen · `clock` Quick lunch — 탭하면 이름 채움) → "Kimchi jjigae for one goes in first" 줄(7.6에서 열었을 때만) → Ghost L Cancel · Primary L **Create**(빈 이름 Disabled).
- 만들면 7.6로 돌아가 새 컬렉션이 선택된 상태로 목록 맨 위에 보인다.

## from 09-settings.md

### 9.9d State · Document offline — [499:12002](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=499-12002)
- 9.9c를 열었는데 인터넷이 없을 때. 시트 본문: 72 원 `wifi-off` → "Can’t load right now"(Title/L) → "Check your connection. Terms and Privacy policy have a saved copy you can read offline." → Button Primary M **Retry** · Outline M **Read saved copy**(→ 9.8c, 앱에 넣어 둔 사본). 사본이 없는 문서(Help center 등)에서는 Read saved copy를 숨긴다.

### 9.9e Marketing consent — [497:11870](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=497-11870)
- 푸시. 요약 박스(bg/accent-subtle): "Optional · you can change this anytime" / "We’d like to send occasional news about challenges, festive tables and events. For Korean users, every ad starts with “(광고)” and includes how to stop receiving them."
- **PUSH & EMAIL**(ListRow Switch): **Ads & events**(On) · **Night-time ads · 9 PM–8 AM**(Off, Ads & events가 켜져 있어야 켤 수 있음)
- 캡션: "You agreed on Nov 5, 2026. We’ll confirm your choice every 2 years and tell you within 14 days whenever it changes. Same setting as Notifications › Ads & events."
- 기본값은 둘 다 꺼짐(옵트인). 바꿀 때마다 Toast "Ads turned on · Nov 5, 2026"(날짜 포함). DB profiles.marketing_ads · marketing_night_ads · marketing_consented_at + marketing_consent_log.


### 1.3 Profile setup — [14:260](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=14-260)
- 닉네임(Display name) 입력 + 프로필 사진 + handle 미리보기 단계. 닉네임 기능을 빼면서 삭제했다 — @username은 첫 로그인 때 자동 생성, 사진 · username 변경은 9.2.
