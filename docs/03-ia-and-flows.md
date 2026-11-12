# 03 · IA & Flows

> 화면 구조(IA)와 화면 간 이동(프로토타입 연결). 화면 세부는 [04-screens/](04-screens/). 색인 → [README](README.md)

## 1. 정보 구조 (IA)

```
Launch      1.1 Splash → 1.1b Welcome(앱 소개, 첫 실행 1회)
Onboarding  1.2 Sign in(Welcome) → Apple · Google → 1.3 Profile setup → 1.3b Taste → 1.4 Location → 1.5 Daily pick time → Home (기존 계정은 바로 Home)
Tab bar (4)  Home(2.x) · Community(4.x · 3.x Our area/Nearby list) · Timer(5.x) · Profile(6.x)  + FAB(탭바 줄 오른쪽 끝)
Notifications  bell(2.x · 4.1 · 4.4 · 4.4b — 탭 화면 ScreenHeader) → 2.8 Notifications (2.8b empty)
Global       + FAB → Share a dish (8.1 Pick photos → 8.2 Details ⇄ 8.2e Travel → 8.3 Preview → 공유, 2단계 + 미리보기)
Dish         7.1 Post detail(모든 게시물 상세, 레시피·댓글 포함) ⇄ 7.1b Ate it / 7.2 Comments sheet / 7.3 Report·block (Report · Block → 2.1 + 토스트)
             Feed Post share → 7.4 Share sheet · bookmark = 저장 토글(6.2 Saved)
Community    탭: Explore(4.1) · Following(4.4) · Challenges
             4.1 Explore ─┬ 검색 · Our area See more → 3.1 Nearby list ─ 3.4 Search → 3.5 Results (3.3 no results) · 3.6 범위 칩 · 3.2 empty
                               │            └ Our area · 3.1 Ask → 3.7 Ask the neighborhood → 3.8 Question (위치 꺼짐 3.7b → 9.5)
                               ├ Holidays more → 4.1b Holidays around the world → 4.2(명절 태그)
                               ├ 4.4 Following ─ 4.6 Cooks in your weather · 4.4b empty
                               │            ├ 칩 All · People · Tables (Tables, 테이블 없음 → 4.4c)
                               │            └ 4.7 Tables · Browse → 4.8 Table ⇄ 4.8b Joined (→ 8.1 Post to table)
                               ├ Challenges 탭 · 4.9 Food challenges · All → 4.10 Challenge → 4.10b Joined → 8.1 (entry) · 홈 2.1c Banner → 4.10b
                               ├ 4.5 Cook profile ─ Message → 4.11 Messages(대화)
                               ├ 4.3 Country (v2, Trending Bites 카드에서)
                               ├ 4.2 Tag (v2: #Comfort · #Spicy · #Vegan … · 명절 태그도 같은 화면)
                               └ Story cook → 4.5
Settings     6.1 ⚙ → 9.1 Settings ─ 9.2 Edit profile ─ 9.2b Choose a photo · 9.3 Account & security ─ 9.9 Delete account
                               · 9.4 Notifications · 9.6 Language · 9.5 Privacy & location(차단 목록 포함) · 9.8 Help & policies
                               └ 9.8 ─ 9.8a Contact · 9.8b Licenses · 9.8c Document sheet · A letter → 1.1b(앱 소개 다시 보기)
             2.5 Location off → 9.7 Choose city
```

| 탭 | 역할 | 범위 |
|---|---|---|
| Home | 지금 날씨·시간에 맞는 오늘의 한 끼 + 주변 식당 | 내 위치(도시/동) |
| Timer | 주방 타이머 | — |
| Community | **Explore**(검색 · 오늘의 이야기 · **Our area**(오늘 인기 · 오늘의 투표 · 동네 질문 · 이웃 요리) · Trending Bites · 명절 · 트렌딩 태그 · Explore Together) · **Following** · **Challenges** | Global + Local |
| Profile | 내 요리, 저장, 다이어리, 설정 | 나 |

> 탭바는 4개. 내 동네는 Community Explore의 Our area(전체 목록 = 3.1 Nearby list). 태그 · 나라 · 명절 페이지는 Community 하위 템플릿이다.

Figma 페이지 구성:

| 페이지 | 링크 |
|---|---|
| Cover | [65:389](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-389) |
| Planning P1 Product brief | [13:2](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=13-2) |
| Planning P2 Principles & MVP | [13:24](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=13-24) |
| Planning P3 IA | [13:90](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=13-90) |
| Planning P4 Key flows | [13:175](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=13-175) |
| Planning P5 Edge cases & states | [13:268](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=13-268) |
| Planning P6 A11y & UX writing | [13:306](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=13-306) |
| Planning P7 User flow | [66:347](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=66-347) |
| Foundations | [49:334](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=49-334) |
| Licenses | [92:2994](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=92-2994) |

## 8. 프로토타입 연결 요약 (화면 간 이동)

### 8.0 프로토타입 설정 (Screens 페이지)
- **기기**: iPhone 390×844. 프레임 높이가 844보다 크면 **세로 스크롤**(Overflow Vertical).
- **시작점(Flow)** 14개 — 주요 흐름: **A · First launch → 1.1** · **B · Home → 2.1** · **C · Community → 4.1** · **D · Share a dish → 8.1** · **E · Kitchen timer → 5.1** · **F · Profile → 6.1** · **G · Settings → 9.1**. 상태 확인용: S · Location off 2.5 · Weather unavailable 2.6 · Nearby empty 3.2 · Search no results 3.3 · Following empty 4.4b · Offline 6.4 · No notifications 2.8b.
- **고정(Fixed) 요소** = 프레임의 마지막 레이어들(`numberOfFixedChildren`): 탭 루트 = TabBar(+FAB) · Home Indicator, 상세 = Top bar · Action bar · Home Indicator, 작성 = 하단 버튼 · Home Indicator, 메시지 = Comment Composer · Home Indicator, 토스트가 있으면 Toast 포함. 시트·팝업 화면은 Scrim · 시트까지 고정.
- **가로 스크롤**: 칩 줄(3.x 범위 칩 · 4.1 Landscape chips · 4.1 Festive cards · 4.2/4.6 해시태그 칩 · 5.x presets)과 4.1 카드 carousel · 태그 줄, 7.1 More row는 줄 자체가 화면 폭(390) 스크롤 컨테이너(좌우 padding 20, Overflow Horizontal) — 첫 항목은 20 들여쓰기, 끝까지 밀면 화면 가장자리까지 보인다.
- **뒤로**: 푸시 화면(1.3 · 1.3b · 1.4 · 1.5 · 3.1 · 3.7 · 3.8 · 4.1b · 4.2 · 4.3 · 4.5 · 4.11 · 4.6 · 4.7–4.10 · 9.2–9.9 · 2.8 · 시트들)의 뒤로/닫기는 모두 **Back**(이전 화면으로). 딤 탭 = Back.
- **전환**: 탭 전환 = 즉시, 푸시 = Move in ← 300ms, 시트·팝업 = Move in ↑ 300ms / Dissolve 200ms(8.2b), 상태 전환 = Smart animate.
- 프로토타입에서 표현 못 하는 동작(구현 시 적용): TabBar Expanded ↔ Minimized 스크롤 전환([§6.4](05-behavior.md)), 피드 · 4.2/4.3 히어로 사진 가로 스와이프, 키보드.

| From | 트리거 | To |
|---|---|---|
| 1.1 | 1.2초 자동(AFTER_TIMEOUT) | 1.1b(첫 실행) / 1.2 |
| 1.1b | Get started | 1.2(다시 보기로 열었으면 BACK) |
| 1.2 | Continue with Google · Apple | 1.3(첫 로그인) / 2.1(기존) |
| 1.3 · 1.3b · 1.4 · 1.5 | 뒤로 | Back |
| 1.3 | Continue | 1.3b |
| 1.3b | Continue / Skip | 1.4 |
| 1.4 | Use my location / Choose a city instead(또는 권한 거부) | 1.5 / 1.5(→ Home은 2.5 상태) |
| 1.5 | Turn on notifications / Skip | 2.1(위치 꺼짐이면 2.5) |
| 2.1·2.2·2.3·2.6 | 채워진 슬롯 · Story card / 빈 슬롯 · FAB / Similar Bites / Refresh 아이콘 · Story card Acorn Tag | 7.1 / 8.1 / 2.4 / (같은 화면에서 추천 갱신 · 도토리 토글) |
| 2.1·2.2·2.3·2.6 피드 | 게시물 사진 / 댓글 아이콘 | 7.1 / 7.2 |
| 2.4 | 식당 카드 | 기기 지도 앱(길찾기) |
| 2.5 | Choose city / Allow location | 9.7 / 2.1 |
| 2.6 | 날씨 카드 탭(재시도) | 2.1 |
| 2.7 | 1.2초 자동 | 2.1 |
| 3.1 | 뒤로 / 검색 / 범위 칩 / 카드 / Ask 줄 / Question Card | 4.1 / 3.4 / 3.6(같은 화면) / 7.1 / 3.7 / 3.8 |
| 3.7 | Post question / Change(보이는 장소) / 뒤로 | 3.8 / 9.5 / Back |
| 3.8 | 뒤로 | Back |
| 3.4 | 제안 행 · Return / 결과 없음 / 뒤로 | 3.5 / 3.3 / 3.1 |
| 3.5 · 3.6 | 카드 / 검색바 · All | 7.1 / 3.4 · 3.1 |
| 3.2 | Share a dish | 8.1 |
| 3.3 | 날씨 칩 / 태그 칩 | 3.1(Same weather) / 4.2 |
| 4.1 | Following · Challenges 탭 / 검색 보내기 / Story card / Our area: 인기 행 · Ask a question · 질문 카드 · 이웃 타일 · See more / Country Card / Festive 카드 · 더보기 / Trending tags See all (칩 = 같은 화면 전환) / Row 카드 / `bell` | 4.4 · Challenges / 3.1 / 7.1 / 7.1 · 3.7 · 3.8 · 7.1 · 3.1 / **4.3** / 4.2(명절) · 4.1b / 4.2 / 7.1 / 2.8 |
| 4.1b | 카드 / 뒤로 | 4.2 / Back |
| 4.2 | 사진 · 카드 / 탭 · 카테고리 · 끼니 필터 (같은 화면 전환) / 뒤로 / TabBar | 7.1 / — / Back / 탭 |
| 4.3 | 사진 · 카드 / 도시 탭 · 카테고리 · 끼니 필터 (같은 화면 전환) / 뒤로 / TabBar | 7.1 / — / Back / 탭 |
| 4.5 | Follow / Message | (그 자리 토글) / 4.11 |
| 4.4 | Following 헤더 / Suggested See all · Cook card / Explore · Challenges 탭 / 게시물 헤더 / 사진 / 댓글 / 테이블 pill / Browse tables / from #테이블 줄 (칩 = 같은 화면 전환) | 4.6 / 4.6 · 4.5 / 4.1 · Challenges / 4.5 / 7.1 / 7.2 / 4.8b / 4.7 / 4.8b |
| 4.4c | Browse tables | 4.7 |
| 4.7 | 테이블 pill · Joined 행 / 다른 행 | 4.8b / 4.8 |
| 4.8 | Join / 뒤로 | 4.8b / Back |
| 4.8b | 뒤로 | Back |
| 4.10 | Join challenge | 4.10b |
| 4.10b | Post my entry | 8.1 |
| 4.9 | 참여 중 행 / 진행 · 곧 시작 행 / 끝난 행 / 뒤로 | 4.10b / 4.10 / 4.10c / Back |
| 3.7b | Turn on location | 9.5 |
| 9.8 | Help center · Guidelines · Terms · Privacy · Location terms / Contact / Licenses / A letter from us | 9.8c / 9.8a / 9.8b / 1.1b |
| 9.8a | Send | Back(토스트) |
| 9.8c | 닫기 · Scrim | Back |
| 2.1c | Challenge Banner / Post (그 밖은 2.1과 같음) | 4.10b / 8.1 |
| 4.5 | Dish Tile / Follow / 뒤로 | 7.1 / (토글) / Back |
| 4.4b | Find cooks | 4.6 |
| 4.6 | Cook row / Follow·Following / 뒤로 | 4.5 / (토글) / Back |
| 2.8 | 알림 행(도토리 · 댓글 · 날씨 · 팔로워 · 타이머 · 게시물 조치) / settings | 7.1 · 7.2 · 2.1 · 4.5 · 5.1 · 9.8 / 9.4 |
| 2.8b | Notification settings | 9.4 |
| 공통 | `bell` | 2.8 |
| 5.1 | Add Timer / 프리셋 · Running 카드 (같은 화면) / 타이머 종료 | 5.1b / — / 5.2 |
| 5.2 | Back to recipe(가운데 `check`) / Running 카드 `plus` / 앱 안 "— done" 토스트 | 7.1 / +1분 / 5.1(그 타이머) |
| 6.1–6.3 | 탭 전환 · settings | 6.x · 9.1 |
| 6.4 | 저장 카드 | 6.4b |
| 6.4b | 뒤로 / Cook along | 6.4 / 5.1 |
| 9.1 | Profile card / Account & security / Notifications / Appearance · Temperature / Language | 9.2 / 9.3 / 9.4 / (선택 시트) / 9.6 |
| 9.1 | Privacy & location / Help & policies / Sign out | 9.5 / 9.8 / 1.2 |
| 9.2 | Avatar · 편집 배지 / Save changes | 9.2b / 9.1 |
| 9.2b | Cancel / Use photo | Back / Back(9.2) |
| 9.3 | Delete account | 9.9 |
| 9.9 | Delete account / Keep my account | 1.1 / 9.3 |
| 9.2–9.6 · 9.8 · 9.8a · 9.8b · 9.9 | 뒤로 | Back |
| 9.7 | 도시 선택 / 뒤로 | 2.x(해당 도시 홈) / 2.5 |
| 7.1 | 뒤로 / more / 작성자·More See all / 댓글 아이콘 / Start 15:00 timer·Cook along / I ate this | Back / 7.3 / 4.5 / 7.2 / 5.1 / 7.1b |
| 7.1b | You ate this(다시 탭) / Toast Undo | 7.1 / 7.1 |
| 7.3 | Report / Block / 딤 | 2.1(신고 토스트) / 2.1(차단 토스트) / Back |
| Feed Post(2.x · 4.4 · 7.1 · 7.1b) | Acorn / Share / Save | (도토리 토글) / 7.4 / (저장 토글) |
| 7.4 | Cancel · 딤 (Copy link · Share card · More = OS 동작, 연결 없음) | Back |
| 8.1 | Next | 8.2 |
| 8.2 | Auto context / Ingredients & steps / Mood "+ Add your own" / Type Travel / Confirm | 8.2d / 8.2a / 8.2b / 8.2e / 8.3 (업로드 실패 8.4) — Sharing은 화면 안 스위치, Calories는 8.2a |
| 8.2e | Type Home-cooked | 8.2 (Smart Animate) |
| 8.3 | 뒤로 / Share to ongdalsaem | 8.2 / 2.1 |
| 8.2d | Use (장소) | 8.2 |
| 8.2a · 8.2d | 뒤로 · 하단 CTA(Done / Use) | 8.2 |
| 8.2b | Add mood / Cancel · 딤 | 8.2(새 무드 선택됨) / 8.2 |
| 8.2a | Add timer · 타이머 알약 | 8.2c |
| 8.2c | Set / No timer · 딤 | 8.2a |
| 8.4 | 배너(재시도) / 실패 썸네일 | 8.2 / 8.4b |
| 8.4b | Try again / Replace / Remove / Cancel·딤 | 8.2 / 8.1 / 8.2 / 8.4 |
| 탭 루트 공통 | TabBar 4개 · FAB | 2.1 · 4.1 · 5.1 · 6.1 · 8.1 |

FAB은 TabBar 안에 있어 **TabBar가 있는 모든 화면에 함께** 나온다(2.x · 4.1 · 4.2 · 4.3 · 4.4 · 4.5 · 5.x · 6.x). 스크롤 다운 때 바와 함께 Minimized 크기(48)로 줄어든다([§3.1](02-components.md)). 푸시 · 모달 화면에는 TabBar도 FAB도 없다.
