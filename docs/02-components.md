# 02 · Components

> 컴포넌트 카탈로그(노드 ID · props · 쓰임), TabBar 동작, 아이콘 규칙, Feed Post, 사진 위 태그, 공통 화면 골격. 색인 → [README](README.md)

## 3. 컴포넌트 카탈로그

Components 페이지는 섹션 9개로 나뉜다(세로로 01 → 09). 각 컴포넌트 위에 "이름 · 사용 수" 라벨이 있다. 아래 표는 **실제 화면에서 쓰는 컴포넌트만** 담는다(미사용 Badge · Photo Pager 삭제).

링크 형식: `…?node-id=<id>` (아래 ID의 `:`→`-`)

### [01 Brand](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3383)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| **Logo** | 4:18 | Tone V[Default/Inverse] · Lockup V[Type/Acorn/Compact] | Type = "ongdalsaem" 워드마크(+태그라인), Compact = 헤더용 작은 워드마크(Outfit Medium 24/26, −0.8), Acorn = Acorn Symbol 36×46 + 워드마크 + 태그라인(gap 10, 1.1). 워드마크 글자 칠 = Gradient/Ink metal(위→아래) |
| Acorn Symbol | 52:525 | — (20×24) | 커스텀 SVG. 도토리 수(앱의 유일한 반응) 표시에 사용 |
| **App Icon** | [1065:22998](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1065-22998) | — | 앱 아이콘: 3D 도토리(Brand 3D / acorn) + 부드러운 유리 그라데이션 배경. iOS = `assets/icon.png` 1024(불투명, 바깥 그림자 없음) · Android adaptive = 배경 그라데이션 + 안전 영역 안 도토리 전경 + 도토리 실루엣 단색. 스플래시 이미지는 별도 |
| logo/apple · logo/google | 201:781 · 201:788 | — (20×20) | 브랜드 로고(01 Brand 섹션). Lucide 아이콘이 아니다. 색·비율 변경 금지 |


### [02 Icons](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3385)

Lucide + 커스텀 `acorn` · `acorn-color` · `heart-filled`(v1 미사용). 목록과 크기별 선 두께는 [§3.2](#32-아이콘-목록-lucide--custom).

### [03 Actions](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3387)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| **Button** | 6:192 | Label T · Show icon B · Icon I · Variant V[Primary/Secondary/Outline/Ghost/Kick/Destructive/Glass/White] · Size V[L/M/S] · State V[Default/Disabled] | 높이 L 56 / M 46 / S 36, radius full. Primary = bg/primary + fg/on-primary. Glass = 반투명 흰색 + blur(사진 위). **Label 텍스트는 모든 Variant(Glass · White 포함)에서 `Label` prop에 연결** — 인스턴스에서 Label만 바꾸면 된다 |
| **IconButton** | 6:217 | Icon I · Style V[Solid/Soft/Glass/Ghost] · Size V[L/M] · **State V[Default/Pressed]** | L 48, M 40 원형. Soft = bg/subtle + 테두리. **Pressed** = 누른 상태(하트 variant — v1에서는 쓰지 않음, 반응은 도토리 하나). Pressed variant에는 Icon 교체 속성이 없다 |
| **CreateFAB** | 12:193 | State V[Default] · Label T(숨김) | **TabBar 안에 포함**(화면에 따로 놓지 않음). **62 원**, bg/kick + 0.5 border/default, 흰 `+` 24(선 2), Elevation/3 Float. Label "Share a dish"는 숨김 레이어(접근성 라벨). 축소(Collapsed) 상태 없음 — 스크롤하면 바와 함께 아래로 숨는다([§3.1](#31-tabbar-동작-중요--코드-기준liquid-glass)). 탭 → 8.1 |
| Acorn Button(이름 유지, 역할 = **I ate this 버튼**) | 12:309 | State V[Default/Eaten] · Size V[Bar/Compact] | **기록 버튼**: `utensils` + "I ate this · 12" 토글 → Eaten = "You ate this · 13"(bg/accent-subtle, `utensils` fg/accent). 7.1 Action bar에만 쓴다. 도토리(반응)와 다른 값 — 내 다이어리에 "만들었어요/먹었어요" 기록 + 후기. Compact(도토리+숫자)는 v1 미사용 |
| **Action Count** | [288:7682](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=288-7682) | Type V[**Acorn/Acorn given**/Comment · Like/Liked(v1 미사용)] · Count T | 아이콘 24 + 숫자(Body/S Strong), gap 6. **Acorn = `acorn`(라인) fg/default · Acorn given = `acorn-color`(컬러)** · Comment = `message-circle`. Feed Post Actions에 사용 |
| **Auth Button** | [201:801](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=201-801) | Provider V[Apple/Google] | 소셜 로그인 버튼, 350×46(FILL), radius full, padding 0 16, 가운데 정렬 [로고 20 + 제목 Outfit Medium 20/24], 로고–제목 간격 Apple 6 · Google 10. 아래 **브랜드 규정**을 지킨다 |

**Auth Button 브랜드 규정**(출시 필수, 출처는 [§10](07-assets-licenses.md))
- **Apple (Sign in with Apple HIG)**
  - 스타일: **White with outline** — 흰 바탕 `#FFFFFF`, 검정 외곽선 1px `#000000`, 로고·제목 **검정만**. 밝은 배경에 쓰는 스타일이다. 어두운 배경에서는 White, 밝은 배경에서는 Black도 허용된다.
  - 제목: "Sign in with Apple", "Sign up with Apple", "Continue with Apple" 중 하나만 쓴다. 우리는 **Continue with Apple**.
  - 제목 크기 = 버튼 높이의 약 43%(46 → Outfit Medium 20/24). 로고는 제목 왼쪽, 세로 가운데. 오른쪽 여백 ≥ 버튼 폭의 8%. 최소 140×30, 주변 여백 ≥ 높이의 1/10.
  - 다른 로그인 버튼보다 **작으면 안 된다** → 1.2의 "Sign in" 버튼도 같은 M(46)으로 맞췄다.
  - 로고는 Apple Design Resources의 공식 아트워크만 쓴다. 직접 그리면 안 된다. 코드에서는 iOS `ASAuthorizationAppleIDButton` 시스템 버튼을 쓰면 규정을 자동으로 지킨다. 커스텀 버튼을 쓸 때는 공식 SVG를 넣는다.
- **Google (Sign in with Google branding guidelines)**
  - Light 테마: 바탕 `#FFFFFF`, 외곽선 1px inside `#747775`, 제목 `#1F1F1F`
  - 표준 4색 "G" 로고만 쓰고 **색·비율을 바꾸지 않는다**.
  - 제목: "Continue with Google"(또는 Sign in / Sign up with Google)
  - 크기: Apple 버튼과 같은 크기·시각적 무게. iOS 여백 기준은 좌 16 · 로고–제목 12 · 우 16.
  - 권장 폰트는 Google Sans/Roboto Medium이다. 우리는 Apple 버튼과 맞추려고 Outfit Medium 20을 쓴다. 공식 SDK 버튼을 쓰면 SDK 기본 스타일이 우선한다.
- 순서: Apple → Google(위 → 아래). 두 버튼은 같은 폭·높이.
- 브랜드 색(`#000000` · `#747775` · `#1F1F1F` · `#FFFFFF`)은 ongdalsaem 팔레트가 아닌 각 사 고정 값이다. 코드에서는 `thirdPartyBrand`(src/theme/gradients.ts)로만 쓰고 Auth Button 밖에서는 쓰지 않는다.

### [04 Inputs & selection](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3389)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| **Input** | 6:337 | Label T · Value T · Helper T · Show helper B · State V[Default/Focus/Filled/Error] | 라벨(Body/S Strong, 앱에서는 생략 가능 — 냉장고 메모 · 투표 직접 입력) → gap 6 → 필드 높이 56(앱에서 바꿀 수 있음, 냉장고 메모 48), radius 20, bg/subtle, padding 0 16, 값 Body/M(Default = 자리표시 fg/muted) → helper Caption fg/muted. 테두리: Default · Filled = 1px border/default, Focus = 2px border/focus, Error = 1px fg/destructive + helper fg/destructive |
| **Calorie Field** | [325:7926](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=325-7926) | State V[Filled/Empty/Focus] · Value T · Show helper B | 칼로리 입력: Head = Label "Calories (total)" + Hint "· optional (a rough estimate)"(Caption fg/muted) → Field **높이 48**(Comment Composer와 같음), radius full, bg/subtle, 1px border/default(Focus 1.5 border/focus), `flame` 18 · 숫자 Body/M · 단위 "kcal" Body/M Strong fg/muted → Helper(Show helper, **기본 Off** — 추정 안내는 Hint에 합침). 8.2 · 8.4 · 8.4b |
| Search Field | 132:4454 | Clear V[No/Yes] · 값 T | 350×48 검색창(3.1, 3.2, 3.3, 9.6, 9.7). Clear=Yes = 오른쪽 지우기 아이콘 |
| **Mood Prompt** | [329:389](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=329-389) | State V[Empty/Typed] | 한 줄 기분 입력 350×48(Comment Composer 입력칸과 같은 높이·pill): `sparkles` 18 fg/accent · 텍스트 Body/M(1줄 말줄임, Empty = "How do you feel right now?" fg/muted) · Send 36 원(Empty bg/muted · Typed bg/primary, `arrow-down` 18). Typed = 1.5px border/focus. **앱에서 쓰지 않음**(홈에 기분 입력 없음) |
| **Chip** | 6:245 | Label T · Icon I · State V[Default/Selected/Glass] · Icon V[Yes/No] | 높이 36, radius full. Selected = bg/primary + 흰 글자. 테두리 색을 바꿀 수 있음(냉장고 메모: 7일 넘은 재료 fg/accent) |
| Tab | 6:252 | Label T · Active V[true/false] | 세그먼트/언더라인 탭. 탭 화면 · 4.2 · 4.3은 **UnderlineTabs**(§3.1c), 이 컴포넌트 모양(24×3 bg/primary)은 그 밖의 탭 줄 |
| Switch | 6:253 | On V[true/false] | 51×31, 손잡이 27(안쪽 2, Elevation/4), On = bg/primary 트랙 · Off = bg/emphasis. 시스템 스위치가 아니라 직접 그림(iOS 26 시스템 스위치는 크기가 달라 행에서 어긋남) |
| Radio | 41:515 | Selected V[true/false] | |
| Radio Row | 132:4897 | Label T | 7.3 신고 사유 행(Radio + 텍스트) |
| Photo Pick Cell | 132:4983 | Selected V[Yes/No] · 순번 T | 8.1 앨범 셀 129×129 |
| Selected Photo | 132:5027 | 순번 T | 8.1 선택된 사진 76×76 |

### [05 Navigation](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3391)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| StatusBar | 6:286 | Tone V[Dark/Light] | 시스템 영역(44). 구현 시 SafeArea |
| **TopBar** | 12:224 | Title T · Type V[Large/Inline/Overlay] · Show action B(기본 On) | Large = 좌측 대형 타이틀(탭 루트), Inline = 뒤로가기+가운데 타이틀, Overlay = 사진 위 Glass 버튼. **Show action Off** = 오른쪽 버튼만 숨기고 자리(Inline 40×40)는 유지해 제목이 가운데에 머문다. 기능 없는 `more`는 두지 않는다: 1.3 · 1.4 · 8.2a · 8.2d · 9.x는 Off |
| **TabBar** | 12:182 | Active V[Home/Community/Timer/Profile] · State V[Expanded] | §3.1(Liquid Glass)과 같음. 유리 캡슐 286×62(glass/surface · 0.5 border/default · Surface/Glass bar) + **CreateFAB** 62, 간격 10. 활성 알약 54(bg/accent-subtle 82 % · 0.5 glass/stroke-strong · Elevation/1 Low), 라벨 활성 fg/accent · 비활성 fg/default |
| Home Indicator | 6:291 | Tone V[Dark/Light] | 시스템 영역(34) |
| Flow Top Bar | 132:4918 | 단계 텍스트 T | 공유 플로우 상단(닫기/뒤로 + "Step n of 3" + Next) |
| Step Progress | 132:4957 | — (3칸 fill override) | 공유 플로우 3단 진행바 350×4 |

### [06 Cards](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3393)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| **Feed Post** | [119:601](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=119-601) | Name T · Meta T · Weather T · Weather icon I · Counter T · Caption T · (Like · Comment = Action Count 노출) | 홈 무한 피드용 인스타그램형 게시물. §3.3 참조 |
| **Story Card** | 41:493 | Eyebrow T · Title T · Statement T · Byline T · Focus T · Show cook B · **Show focus B · Show byline B**(홈 2.x는 둘 다 Off) · (Weather Tag · Acorn Tag 노출) | 350×420(홈은 350×273, 4.1은 350×400으로 높이만 지정), radius 2xl 32, 세로 오토레이아웃(padding 24, space-between) 사진은 **카드 자체 fill(이미지 cover)** 로 넣는다 — 높이를 바꾼 인스턴스에서도 사진이 항상 카드 전체를 덮는다(Photo 레이어는 기본값용, 인스턴스에서는 숨김) |
| Pick Card | 54:554 | Eyebrow T · Title T · Byline T · (Weather Tag · Acorn Tag 노출) | 350×280 사진 카드(2.5). 아래 정렬: Meta → Tags 줄 |
| **Food Card** | 12:399 | Title T · Byline T · Type V[Grid/Row] · (Grid: Weather Tag · Acorn Tag 노출) | Grid(167×251) = Media 167×208(좌하단 Weather Tag·우하단 Acorn Tag) + **Text 블록**(세로, gap 2, **좌우 padding 20**: 제목 Title/S **1줄 말줄임** + 태그 바이라인 Caption 1줄). 텍스트는 사진 가장자리보다 20px 안쪽에서 시작한다(디자이너 지정). Row(12:384) = 가로 리스트, 썸네일 80 · gap 14: Overline "DINNER · 10°" → **4** → Title/S 제목 → **3** → Caption 바이라인, 오른쪽 `bookmark` **24 fg/default** |
| Country Card | 12:400 | Title T · **Flag**(노출 인스턴스 Flag Tag, Country 변형) · (Weather Tag · Acorn Tag 노출) | 280×180(4.1 가로 스크롤) . 나라는 사진 위 **국기 Flag Tag**(**좌상단 x 12 · y 12 고정**, absolute — 카드 폭이 바뀌어도 위치 유지)로, 날씨·기온은 Weather Tag. Title 1줄 말줄임 |
| Dish Tile | 128:4188 · 670:20058 | (Weather Tag · Acorn Tag **노출 인스턴스**) | **앱(코드 기준) = 670:20058 모양**: 미디어 167:208 비율(radius xl, Our area는 2xl) + 좌하단 Weather Tag · 우하단 Acorn Tag(XL, 인셋 8) → 아래 제목 Title/S 1줄 · 바이라인 Caption "Comfort · Dinner"(Our area에서 넓혀 가져온 타일은 앞에 장소 라벨). 2열 그리드(열 16 · 줄 20)로 6.1 · 4.5 · 4.2 · 4.3 · 3.1에서 쓴다. **Acorn Tag = 도토리 토글**(6.1 · 4.5: 탭하면 주고/취소, 준 상태 = 채운 도토리). 128×160 3열(4:4 radius)은 이전 6.1 디자인 |
| Weather Card | 136:4716 | 텍스트 props(기온·상태·H/L 등) | 홈 날씨 카드 350×308, radius 2xl 32, padding 18 20 14, gap **14**, 가운데 정렬: Now 블록(padding 3 0 4 — 기온 padding 0 6 2 2 바로 옆에 상태 · H/L · until, 오른쪽 3D 아이콘 64) + 구분선 + [**Picks head**(높이 32, Overline "Picks for this weather" ··· **Refresh** 32 원 아이콘 버튼: `rotate-ccw` 16만, 1px 테두리, 글자 없음, 접근성 라벨 "New picks") → 8 → Meal Slot ×4(칸 사이 2, 카드 안쪽보다 양쪽 13 넓게)] (2.1/2.2/2.3/2.6). Now 오른쪽 64 자리(136:4508) = **3D 날씨 아이콘**(원형 배경 없음). Refresh 동작 [§6.1](05-behavior.md) |
| Meal Slot | 131:4280 | State V[Filled/Empty] · 라벨·기온 T | 홈 끼니 타임라인 칸(390 화면에서 82 폭). 세로(131:4278 — 높이 hug, padding 8 0 10, 가운데 정렬): [라벨(Caption Strong, 대문자 아님, **가운데 정렬, 칸 폭 채움**) → 7 → 썸네일 원 74] → 3 → Weather Tag(배경 없음, 높이 hug 32, padding 5 12 5 9, gap 5, 아이콘 18 + 기온 Body/L). Filled = 썸네일 사진, Now 칸은 bg/muted 배경 + 선셋 링 override. Empty = 점선 원 + `+` 36 |
| **Weather Now** | [363:8179](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=363-8179) | Now T · Place T · Range T | 350: glass/surface, radius 16, padding 10 16, gap 12 — 현재 날씨 **3D 아이콘 52** · Now Body/M Strong / (2) Place Caption fg/muted · Range Caption Strong fg/muted. 3.1–3.6 |
| Nearby Card | 131:4542 | 3줄 텍스트 T, 사진 fill | 홈 "Eat this nearby" 카드(홈 전용 — 7.1 상세에는 두지 않음) |
| Place Card | 131:4620 | 거리·이름·메뉴·도토리 수·메모 T | 2.4 식당 카드 |
| Timer Card | 12:406 | Label T | 350×88 |
| Diary Day | 132:4501 | State V[Blank/Plain/Logged] · 날짜 T | 6.3 Month view 팝업의 달력 칸(이번 주 한 줄은 이 컴포넌트를 쓰지 않음) |
| Weather Mood | 72:787 | Mood V[18종] | [§2.4](01-foundations.md) |

- 레이어 순서(아래→위): **Photo**(카드 전체 STRETCH) → **Scrim**(Gradient/Card scrim 한 장) → Top(Eyebrow + Title, chevron) ↔ Footer(Body + Cook = **Avatar 40**(사진 없으면 이니셜), 그 아래 Tags 줄).
- 줄 수 제한: Eyebrow·Title·Focus·Byline 1줄, Statement 최대 3줄(말줄임).
- `Show cook` = Cook Avatar 표시 여부. |

**Question Card** — [469:10124](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=469-10124) (Components › **08 Lists & content**, 350 FILL) · 동네 질문 한 개(3.1 · 3.8 · 4.8 Questions 탭)
- bg/subtle + border/default 1, radius 16, padding 16, 세로 gap 12. 위 줄: 아바타 32 · Name(Body/S Strong) / **Where row**(**Source icon** 12 + Where Caption fg/muted) ··· Category pill(bg/accent-subtle, Caption Strong fg/accent) → Question(Body/M, 최대 4줄) → Photo(radius 12, 높이 140) → Footer: `message-circle` 16 "4 answers" · `users` 16 "Me too · 7"(Caption Strong fg/secondary).
- **질문 출처**: 동네 질문 = Source icon `map-pin` + "Mangwon-dong · 12 min ago"(장소 이름은 9.5 Shared precision 단위), 테이블 질문 = `utensils` + "#SoloMeals · 12 min ago". 3.1에는 동네 질문만, 4.8 Questions 탭에는 그 테이블 질문만 나온다.
- **반응 아이콘 구분**: 도토리 = `acorn`(게시물의 유일한 반응) · **Me too** = `users`(질문에 "나도 궁금해") · **Helpful** = `thumbs-up`(답에 "도움 됐어요"). 하트 아이콘은 쓰지 않는다(무드 칩 Cozy = `coffee`, 태그 Comfort = `soup`).
- 속성: Name · Where · Category · Question · Answers · MeToo(TEXT) · **Show photo**(BOOLEAN, 3.1 피드는 끔) · **Source icon**(INSTANCE_SWAP, `map-pin` / `utensils`).

### [07 Photo tags](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=378-9965)

Weather Tag · Acorn Tag · Photo Counter — 규격은 [§3.4](#34-사진-위-날씨도토리-태그-모든-요리-사진-공통).

### [08 Lists & content](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=65-3395)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| SectionHeader | 12:225 | Eyebrow T · Title T · Action T · Show eyebrow B · Show action B | 오버라인 + Title/M + 우측 "See all" |
| ListRow | 12:263 | Label T · Icon I · Trailing V[Chevron/Switch/Value/None] · Tone V[Default/Destructive] | 설정 행, 높이 52 |
| Avatar | 6:307 | Size V[24/32/40/56/88] | 원형, 정사각(24·32·40·56·88 × 같은 높이). 사진 편집이 붙는 곳(1.3 · 9.2)은 **Avatar edit** 96×96 = Avatar 88(4, 4) + 카메라 배지 32(64, 64), 잘림(clip) 없음 |
| Profile Header | 126:4345 | Tab V[Dishes/Saved/Diary] · … | **앱은 이 컴포넌트 모양이 아니라** [06-profile](04-screens/06-profile.md) 공통 헤더(ScreenHeader + 유리 프로필 카드: 날씨 줄 · 아바타 · 이름 · @username · "Total acorns" 칩 · 상태 메시지 · Follow/Message → UnderlineTabs, 내 프로필은 글자 탭 Dishes · Diary · Saved). 이 컴포넌트는 Figma 이전 구성 |
| **Cook Card** | [363:8256](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=363-8256) | Name T · Description T · Button(노출) | 추천 요리사 카드 110×176(4.4 · 4.4b): Avatar 56 → 이름 → 도시 · 분야 → Button Outline S Follow |
| **Cook Row** | [363:8344](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=363-8344) | Name T · Meta T · Acorns T · Button(노출) | 요리사 목록 한 줄(4.6): Avatar 40 · 이름 Body/M Strong / "도시 · 지금 날씨" Caption / `acorn-color` 14 + "842 acorns" Caption Strong · Button S Follow(Primary) / Following(Secondary) |
| City Row | 132:4683 | Selected V[Yes/No] · **City T · Country T · Temp T**(두 variant 공통) | 350×68 장소 선택 목록 한 줄: 날씨 아이콘 18(그 장소의 **현재 날씨**, stroke 1.5) → City / Country → 오른쪽 Temp. Selected=Yes = 체크 표시. 9.7 Change city(내 도시) · 8.2d Region(요리 지역)에서 사용 |
| **Ingredients List** | [300:429](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=300-429) | Title T | 350 폭 재료 섹션: Title(Title/L "Ingredients") → gap 8 → Rows(Ingredient Row ×n, **gap 0** — 줄 구분선만). 6개 = 269px. 7.1 · 7.1b |
| Ingredient Row | 132:4774 | 이름·양 T | 재료 한 줄 350×39: padding 8/0, 이름 Body/M ··· 양 Body/M Strong, 아래 1px border/default. 7.1(8.2a 작성 화면은 표 형식 재료 줄) |
| Recipe Step | 132:4806 | Timer V[No/Yes] · **Number T · Text T**(두 variant 공통) | 조리 단계 한 줄(번호 원 28 → 14 → 본문 Body/M, **본문 위 4** — 첫 줄 가운데를 번호와 맞춤). Timer=Yes = "Start 15:00 timer" 버튼 포함. 7.1(8.2a 작성 화면은 표 형식 단계 줄) |
| Feed Loader | 131:4592 | Text T | 피드 끝 스피너 + "Loading more like this…" |
| Inline Banner | 136:5108 | Tone V[Neutral/Warning] · Text T | 아이콘 + 한 줄 안내(6.4 오프라인 = Neutral, 8.4 업로드 실패 = Warning) |
| Toast | 12:264 | Message T | 350×42, bg/inverse, 하단 TabBar 위. 앞 아이콘 **`acorn-color` 24**(컬러 도토리, 색 바꾸지 않음). 4초 뒤 사라짐(길이 바꿀 수 있음), 전체를 누를 수 있게 할 수 있음(타이머 "— done" 토스트 → 5.1) |

### [09 Comments, messages & alerts](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=378-9966)

| 컴포넌트 | ID | Props (T=text, B=boolean, I=instance swap, V=variant) | 구현 메모 |
|---|---|---|---|
| **Comments Sheet** | [287:367](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=287-367) | Title T | 390×560 바텀시트, bg/default, 상단 radius 28, 세로(padding 12/20, gap 16): Handle 40×5(bg/emphasis) → Title(Title/M, "Comments · 18") → Comment 목록. 7.2에서 사용 |
| Comment | 132:4848 | Time V[Yes/No] · 이름·시간·본문 T | 댓글 한 줄(Comments Sheet 안): gap 10, Avatar 40 → [**@username** Body/M Strong + 시간 Caption fg/disabled(gap 6)] → 2 → 본문 Body/M fg/default |
| Input helper | — | — | 모든 Input 변형의 Helper 글은 **FILL + 줄바꿈**(입력칸 폭 350을 넘지 않음) |
| Checkbox | 화면 프레임(v1 사용처 없음 — 1.3 제거) | — | 22×22, radius 4. 선택 = bg/primary + `check` 14(fg/on-primary, 1.4) · 해제 = 1.5px border/strong. 글과 위 정렬, 간격 10, 글은 FILL로 줄바꿈 |
| **Comment Composer** | [287:334](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=287-334) | Placeholder T | 390 폭 하단 입력 바, bg/default, 위쪽 1px border/default, padding 10/20/40/20, 세로 가운데, gap 10: Avatar 40(내 사진) → **Field**(높이 42, padding 0/20, radius full, Body/M fg/muted "Say something warm…", **흰색 톤** bg/subtle + 1px border/default) → `arrow-right` 22(전송). 7.2 하단 고정 |
| **Notification Row** | [356:8636](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=356-8636) | Unread V[Yes/No] · Show avatar B · Show icon B · Show badge B · Show thumb B · Show action B | 알림 한 줄 390 폭, padding 12 20, gap 12, 세로 가운데: Lead 44(Avatar 40 **또는** Icon 원 40 bg/muted + 글리프 20) + 오른쪽 아래 Badge 20 원(bg/subtle, 종류 아이콘 14: `acorn-color` · `message-circle` · `send` · `user`) → Body(Text Body/S 여러 줄 · Meta: 안 읽음 점 6 fg/accent + 시간 Caption) → Thumb 44 radius 10(게시물 사진) 또는 Action(Button Primary S "Follow back"). Unread=Yes = 배경 bg/accent-subtle. 2.8 |

### 10 Weather mood
| 컴포넌트 | ID | Props | 메모 |
|---|---|---|---|
| **Weather Mood** | [72:787](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=72-787) | Mood V ×18 | 날씨 무드 견본(그라데이션 = `Mood/<key>` 스타일). 이전 이름 "ㅋ" → Weather Mood |
| **Mood Motif** | [518:820](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=518-820) | Mood V ×18 | 그라데이션 위에 얹는 흰 선 · 점 무늬(180×220 기준). 규칙 [01-foundations §2.4](01-foundations.md) |

### 3.1 TabBar 동작 (중요) — 코드 기준(Liquid Glass)

**TabBar와 CreateFAB은 항상 한 묶음**이다. TabBar가 있는 모든 화면(2.x · 4.1 · 4.2 · 4.3 · 4.5 · 5.x · 6.x)에서 FAB도 함께 보인다. Figma TabBar 12:182 · CreateFAB 12:193은 이 모양과 같다(정지 화면). 축소(Minimized · 48 원) 상태는 없다.

- **Expanded**(기본, 스크롤 최상단): 하단(홈 인디케이터 위, 바닥 84 기준) 한 줄에 **유리 캡슐(왼쪽, 좌우 16) + FAB(오른쪽 끝)**, 간격 10.
  - 유리 캡슐: 높이 62, radius full, 블러 + glass/surface, 1px border/default, Elevation/3 Float. 4개 아이템 = 아이콘 22 + Nav label(`Home · Community · Timer · Profile`). **활성** = 아이콘 Gradient/Dusk + 라벨 fg/accent, 뒤에 **활성 알약**(높이 54, radius full, bg/accent-subtle 82 % + glass/stroke-strong 0.5 테두리 + Elevation/1 Low — 살짝 비치는 유리 칩). 비활성 = 아이콘 · 라벨 fg/default.
  - FAB: **62 원**, bg/kick + 1px border/default, 흰 `+` 24(선 2), Elevation/3 Float. 접근성 라벨 "Share a dish". 탭 → 8.1.
- **스크롤하면 아래로 숨는다**(유튜브식): 아래로 스크롤하면 바 전체(캡슐 + FAB)가 손가락 이동량만큼 아래로 내려간다(최대 = 바 높이 62 + 하단 safe area, 투명도는 그대로). 위로 스크롤하면 같은 비율로 올라온다. 손을 떼거나 스크롤이 140ms 멈추면 **마지막 스크롤 방향**으로 스냅(위 = 보임, 아래 = 숨김, spring damping 20 · stiffness 220) — 위로 조금만 올려도 다 나타난다. 반 넘게 숨은 동안은 터치를 막지 않는다(뒤 콘텐츠를 누를 수 있음).
- **항상 보이는 때**: 맨 위(y ≤ 0) · 맨 아래 도달 · 탭을 누를 때 · 화면에 들어오거나 돌아올 때.
- **Reduce Motion**: 손가락을 따라가지 않고, 반을 넘거나 멈췄을 때 200ms 타이밍으로 보임/숨김만.
- **탭 전환**: 화면은 **애니메이션 없이 즉시** 바뀐다. 활성 알약만 새 탭으로 **미끄러진다**(220ms ease-out expo — 약 70ms 안에 90 % 도착해 화면 전환과 맞음). 아이콘(Gradient/Dusk)과 라벨(fg/accent)은 알약 위치를 따라 비활성 ↔ 활성으로 크로스페이드. Reduce Motion = 알약 · 색이 바로 바뀜.
- **지금 탭을 다시 누르면** 그 탭 화면이 맨 위로 스크롤된다.
- **탭 상태 유지**: 네 탭은 한 번 열면 계속 살아 있어 다른 탭에 갔다 와도 스크롤 위치 · 불러온 내용이 그대로다. 안 보이는 탭은 다시 그리지 않는다. 탭을 눌러 옮겨 왔을 때 그 탭을 3분 안에 불러왔으면 다시 불러오지 않는다(처음 열 때 · 조건이 바뀔 때 · 푸시 화면에서 돌아올 때는 다시 불러옴).
- **푸시 화면에서 탭을 누르면**(4.2 · 4.3 · 4.5 등 TabBar가 있는 푸시 화면): 그 화면을 닫고 그 탭으로 돌아간다(탭이 두 벌 쌓이지 않음). ([§6.4](05-behavior.md))
- 아이콘: Home `home`, Community `users`, Timer `timer`, Profile `user`.

### 3.1b ScreenHeader · ScreenWash · WeatherBackdrop — 네 탭 공통(코드 기준)
- **WeatherBackdrop**(전역 날씨 배경): bg/default → 날씨 무드 그라데이션 85 % → **날씨 모션**([§2.4](01-foundations.md) Weather Mood 모션), 높이 420. 앱 루트(내비게이터 바깥)에 **하나만** 있어 탭 전환 · 푸시 · 뒤로가기에서 다시 만들어지지 않고 모션이 끊기지 않는다. 화면 전환 애니메이션은 화면만 움직이고 배경은 고정. 위치가 꺼지고 도시도 없으면 wash 없음.
  - **보이는 화면**: 네 탭(Home · Community · Timer · Profile)만 — 탭 배경이 투명해서 비친다. 목록은 코드 한 곳(`WEATHER_BG_ROUTES`)에서 관리하고 화면마다 wash 높이를 정할 수 있다(바뀌면 400ms에 걸쳐 변함).
  - **그 밖의 모든 화면**(7.x 상세 · 설정 · 알림 · Question · Special days 등 푸시 화면): 각자 불투명 bg/default. 배경은 300ms에 페이드아웃한 뒤 멈추고, 탭으로 돌아오면 300ms 페이드인하며 멈춘 자리에서 이어진다. 네이티브 스택에서 푸시 화면을 투명하게 하면 아래 탭이 비쳐서 투명 배경은 탭만 쓴다.
  - 2.6(날씨 없음)은 wash만 두고 모션은 숨기고 멈춘다. 앱이 백그라운드에 가면 멈추고, 돌아오면 페이드 없이 이어진다.
- **ScreenWash**(각 탭 화면): 지금 탭의 스크롤 위치를 WeatherBackdrop에 넘겨, wash가 내용과 함께 올라가며 300pt에서 사라지게 한다. StatusBar 글자색도 wash 밝기에 맞춘다. 자체 wash가 있는 푸시 화면(다른 요리사 프로필 · Tag · Country)은 움직임 없는 wash를 따로 그린다.
- **ScreenHeader** = Figma 컴포넌트 **weather header** [1238:15501](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1238-15501)(좌우 20, 아래 12): 안전 영역 → 행 40(왼쪽 Logo Compact — 다른 요리사 프로필은 뒤로 버튼 / 오른쪽 `bell`(Home · Community, 안 읽음 점) · `settings`(내 프로필) · 빈 40(Timer · 다른 요리사)) → **22** → Overline 날짜 · 위치 → **13** → Display/XL 날씨 제목(네 탭 모두 같은 위치 · 1238:15195; 제목 아래: 홈 · 프로필 20 → Weather card(y 212로 같은 자리) · Community · Timer 12)("Rainy " + fg/disabled 톤 "evening", 한 줄 맞춤). 위치 꺼짐 = "Location off · showing {city}" / "Hello there".
- 글자색은 **고정**: 오버라인 · 제목 fg/default, 제목 둘째 단어("evening")는 **반투명 유리** — 글자 모양 안에서 뒤 wash를 흐리게(블러 24) 비추고 fg/disabled 75 %를 덮는다(MaskedView + BlurView). 로고만 wash 위치(12 %)의 밝기에 맞춘 잉크. 마지막 날씨 값은 앱을 다시 열 때도 먼저 보여 준다(기기 캐시).

### 3.1c UnderlineTabs — 코드 기준
- X 스타일 밑줄 탭: 전체 폭 **1px border/default 선(30 % 투명)** + 선택 탭 아래 **3px fg/default 막대**(라벨 글자 폭, radius full). 탭을 바꾸면 막대가 200ms에 미끄러져 간다. 탭 높이 43(위 10 · 아래 12). 선택 = fg/default, 나머지 fg/muted(wash 위에서는 wash 잉크). 글자 기본 Body/M Strong(선택) · Body/M, `labelVariant`로 한 스타일 지정(4.1 Community = Title/M). 아이콘 탭도 가능(6.x 내 프로필).
- 쓰는 곳: Community(Explore · Following) · Profile · 4.2 · 4.3. Figma `Tab` 6:252(24×3 bg/primary 막대)는 쓰지 않는다.

### 3.2 아이콘 목록 (Lucide + custom) — Figma에 남긴 82개(화면에서 쓰는 것만)

```
home compass timer users user plus search heart thumbs-up bookmark share message-circle map-pin
sun cloud cloud-sun cloud-rain cloud-snow moon wind thermometer utensils chef-hat clock flame
chevron-left chevron-right chevron-down arrow-right x check settings bell image camera
more-horizontal globe pause rotate-ccw lock mail eye log-out trash flag
ban alert-circle wifi-off sparkles star trending-up list book-open navigation snowflake
thermometer-snowflake thermometer-sun zap coffee cookie cooking-pot leaf soup
folder grid cloud-drizzle cloud-lightning cloud-fog haze cloud-sun-rain cloud-hail cloud-rain-wind
map copy corner-up-right arrow-down send fish grip-vertical
custom: acorn(라인) · acorn-color(컬러) · heart-filled(채운 하트, v1 미사용 — Action Count Like 변형이 참조)
```
- 앱 코드는 Lucide 라이브러리를 그대로 쓰므로, Figma에 없는 아이콘(예: `cloud-moon` · `calendar`)도 코드에서는 필요할 때 쓸 수 있다. 새로 쓰면 이 목록과 Figma에 추가한다
- 앱에서 Figma 목록 밖으로 쓰는 아이콘: `notebook-pen`(6.x Diary 탭) · `shield-check`(1.4 Why 박스) · `check`(1.3b 취향 카드). `bookmark` · `message-circle`은 Figma 3:42 · 3:50의 새 모양을 앱 커스텀 아이콘으로 옮겨 쓴다(bookmark 14×18, 둥근 말풍선)..
```
기본 크기 20–24.

**아이콘 선 두께 규칙(축소 시 뭉쳐 보이지 않게)** — 아이콘 크기에 따라 화면에 보이는 stroke를 고정한다(크기에 비례해 줄이지 않음).

| 아이콘 크기 | stroke |
|---|---|
| 22–24px | 1.6px |
| 17–21px | 1.5px |
| 16px 이하(12·14·16) | 1.4px |

- 구현: Lucide `strokeWidth`를 위 값으로 넘기고 `absoluteStrokeWidth`를 켠다(크기와 무관하게 실제 px 유지). 예: `<CloudRain size={12} strokeWidth={1.4} absoluteStrokeWidth />`.
- 아이콘은 항상 정사각형, 정수 px 크기(12/14/16/18/20/22/24). 컴포넌트 안 아이콘 크기는 컴포넌트가 정한다(IconButton L = 22, M = 20). **인스턴스를 배율(scale)로 키우거나 줄이지 않는다**.
- **색**: 아이콘의 모든 선·면은 한 가지 토큰(한 아이콘 안 색 혼용 금지, `acorn`의 Stem도 같은 색).
  - 사진·그라데이션 위(Weather Tag · Acorn Tag · Story Card · Diary Day Logged · 4.x hero) = `fg/on-photo`
  - 어두운 면(bg/inverse: Acorn Button Default · Toast) = `fg/inverse` · 주 버튼(Solid) = `fg/on-primary` · 위험 행(ListRow Destructive) = `fg/destructive`
  - 그 밖 = `fg/default`(보조는 `fg/secondary`·`fg/muted`)
- **custom `acorn`**(icon/acorn 134:10304, 24×24): Cap·Nut = stroke(위 규칙의 두께), Stem = 채움. 짝이 되는 **`icon/acorn-color`**(134:10227, 같은 24×24 모양, 그라데이션 색 고정)는 먹음(Eaten) 상태에 쓴다. **라인 = 아직 안 먹음(기본), 컬러 = 먹음.** 브랜드 로고·심볼에는 `Acorn Symbol`(52:525).
- **`icon/arrow-down`**: `arrow-up`을 세로로 뒤집은 것(Lucide arrow-down과 같은 모양). (Mood Prompt 보내기 버튼용, 지금 앱에서 Mood Prompt는 안 씀)
- **custom `icon/grip-vertical`**(427:10106, 24×24): 드래그 손잡이 — 채운 점 6개(2열 × 3줄, 지름 3.2, 열 x 9 · 15, 줄 y 5 · 12 · 19). 선이 아니라 **면(fill)** 이라 색은 fill로 준다(8.2a 표 손잡이 = fg/muted). Lucide `grip-vertical`과 같은 배치. 8.2a 재료·단계 표, 8.2c 배경.
- **`icon/fish`**: Lucide `fish`(ISC). 8.2 Meal의 **Seafood** 칩.
- **`icon/heart-filled`**(285:741): v1에서는 쓰지 않는다(반응 = 도토리).
- 아이콘 + 텍스트가 한 줄에 있는 행은 세로 가운데 정렬. 아이콘이 앞에 오는 pill은 아이콘 쪽 여백을 1–2px 좁게 둔다(시각 보정, 예: 6 / 7).

### 3.3 Feed Post 상세 (390 × 652, 전체 폭)

세로 스택, gap 0, padding-bottom 18. 사진 카드는 좌우 20 안쪽(390 폭 → 350), Header는 좌우 21, Actions · Caption은 좌우 38.

| 순서 | 레이어 | 스펙 |
|---|---|---|
| 1 | **Header** | 가로, padding 12 21, gap 10, 세로 가운데 정렬. Avatar 40 → Who(세로, gap 1, 남은 폭 채움): **Name** Body/M Strong fg/default(`minji.cooks`) + **Meta** Caption fg/muted(`Mapo, Seoul · 40m`) → `more-horizontal` 24px(fg/secondary). *(날씨는 헤더가 아니라 사진 위 태그로 표시)* |
| 2 | **Media** | **350 × 402**(좌우 20 안쪽), 사진 cover, clip, **radius 2xl = 32**. 안쪽 padding 18 18 16 18. **좌상단(18, 18) Weather Tag**(Size=XL, **Show condition = On** → "`cloud-snow` Snow −4°", §3.4). 도토리 수는 Actions에 있으므로 사진 위 Acorn Tag는 숨김, **좌하단(left 18, bottom 16) Photo Counter**(`1 / 3`, 노출 인스턴스 — 인스턴스에서 Count 값을 바꾼다). 피드는 사진을 넘기는 곳이라 장수 표시를 아래(넘기는 손 쪽)에 둔다. 가로 스와이프로 여러 장(사진 수 = Counter 분모) |
| 3 | **Actions** | 가로, padding 12 38 8 38, gap 18, 아이콘 24px fg/default. **Acorn** = `Action Count`(Type=Acorn, 누르면 Acorn given, 숫자 = 받은 도토리) → **Comment** = `Action Count`(Type=Comment, → 7.2) → **Share** `share` → (spacer) → **Save** `bookmark`(오른쪽 끝). Direct(`send`)는 숨김(DM은 4.5 Message로만 시작) |
| 4 | **Caption block** | 세로, padding 0 38. **Caption** Body/M fg/default, **1줄 말줄임**. 캡션이 없으면 블록째 숨김(1219:18732). 해시태그 줄은 두지 않는다(요리 속성은 사진 위 Weather Tag와 7.1 태그 칩으로 보여 준다) |

인터랙션:
- Media 탭 → 7.1 Post detail(상세에서도 같은 Feed Post를 Media 숨김으로 재사용해 헤더·액션·캡션이 그대로 이어진다). 더블탭 → 도토리 주기(`acorn-color` 팝 애니메이션, 숫자 +1).
- Acorn 탭 → `acorn`(라인) ↔ **`acorn-color`**(컬러) 토글, 숫자 ±1. (7.1 Action bar의 I ate this와는 다른 값)
- Comment 탭 → 7.2 Comments sheet. 댓글 수는 Comment 아이콘 옆 숫자로만 보여 준다(“View all N comments” 줄 없음).
- Share 탭 → **7.4 Share sheet**(딥링크 `ongdalsaem.app/d/{dishId}`).
- Save 탭 → 바로 저장/해제(토글, 아이콘 채움) + Toast "Saved · Undo". 저장한 요리는 6.2 Saved에 날씨별로 모인다(컬렉션 없음).
- Header 이름/아바타 탭 → 작성자 프로필(4.5 Cook profile 템플릿).
- `more-horizontal` → 7.3 Report / block 시트.

**도토리 = 반응, 숟가락 = 기록.** 도토리(`acorn`)는 하트를 대신하는 공개 반응(피드 Actions · 더블탭 · 프로필 통계 · 사진 위 Acorn Tag). **I ate this**(`utensils`)는 7.1 Action bar의 기록 버튼으로, 내 다이어리에 남고 숫자는 7.1에서만 보인다. 하트는 없다. Feed Post에서는 Actions에 숫자가 있으므로 **사진 위 Acorn Tag를 숨기고** Weather Tag만 둔다(그리드 · 카드에서는 Acorn Tag 유지).

### 3.4 사진 위 날씨·도토리 태그 (모든 요리 사진 공통)

사용자 요리 사진 위에는 **항상** 왼쪽 아래에 날씨·기온, 오른쪽 아래에 도토리 수를 표시한다.

| 컴포넌트 | ID | 스펙 |
|---|---|---|
| **Photo Counter** | [383:333](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=383-333) · **Size V[XL]** | Count T | 사진 장수 pill, radius full, overlay/scrim-strong, fg/on-photo `1 / 3`. **XL 45×28**(padding 5 11, Body/S Strong 13) — 모든 사진(피드 · 상세 hero). 우상단 16 |
| **Weather Tag** | [362:332](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=362-332) · **Size V[L/XL]** · Temp T · Weather icon I · **Condition T · Show condition B**(기본 Off) | 가로, radius full, overlay/scrim, 날씨 아이콘 fg/on-photo. **XL = 높이 28**(padding 5 12 5 9, gap 5, 아이콘 18 stroke 1.5, 기온 Body/S Strong 13; Show condition = On이면 아이콘과 기온 사이에 날씨 상태 글자 "Rain"이 같은 스타일로 붙는다 — 게시물(Feed Post) 사진에서만 켠다. 상태 이름 = 날씨 아이콘에 맞춘 짧은 영어(Clear · Partly cloudy · Cloudy · Drizzle · Rain · Heavy rain · Showers · Thunder · Sleet · Snow · Fog · Haze · Windy · Hot · Cold · Clear night), 다국어는 i18n 키) — 사진 위 태그 기본값(피드 · 카드 · 4.5 Dish Tile · 상세 hero). **L = 높이 24**(padding 4 9 4 7, 아이콘 16 stroke 1.4, Caption Strong 12) — **6.1 내 프로필 Dish Tile 3열만**. Props: Temp T · Weather icon I(텍스트·아이콘이 두 변형 모두 prop에 연결됨) |
| **Flag Tag** | [443:10854](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=443-10854) · Country V[Japan/Italy/Mexico/Korea/Thailand/China/USA/UK/Ireland/Canada/India/France/Spain/Vietnam] | 나라 표시 pill — 국기만(글자 없음). **높이 24 = Weather Tag L**, padding 5 8, radius full, Weather Tag와 같은 면(overlay/scrim). 국기 = **20×14 이미지**(radius 3, 흰 0.5px 안쪽 선) — 출처 Wikimedia Commons 국기(퍼블릭 도메인, noto-emoji `third_party/region-flags`). 이모지 글꼴은 기기마다 다르게 보여서 쓰지 않는다. 접근성 라벨 = 나라 이름. Country Card 좌상단. 구현: `assets/flags/{ISO2}.png`(@2x 40×28, @3x 60×42) |
| **Acorn Tag** | [284:7293](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=284-7293) · State V[Default/Eaten] · **Size V[L/XL]** | 크기 규칙은 Weather Tag와 같음(XL 28 / L 24). 가로, radius full, overlay/scrim α0.45, Count(prop `Count`) fg/on-photo. **Default**(내가 아직 도토리를 안 줌) = 라인 `acorn`(XL 18, stroke 1.5, fg/on-photo). **Eaten**(내가 도토리를 준 상태 — 변형 이름은 그대로) = 컬러 `icon/acorn-color`. 두 상태 폭이 같다. 화면에는 보는 사람 기준 상태로 표시(목업은 7.1b와 내 프로필 6.1이 Eaten) |

| 사용처 | 위치(안쪽 여백) |
|---|---|
| Dish Tile (6.1 · 4.5 · 4.2 · 4.3 · 3.1, 167:208 미디어) | 좌하단 8 / 우하단 8 |
| Food Card Grid (3.1 · 3.5 · 3.6 · 4.2 · 4.3) | 좌하단 8 / 우하단 8 |
| **Feed Post Media**(홈 피드 · 4.4 · 6.4b · 8.3 피드 미리보기) | Weather Tag **좌상단 18 / 18** · Photo Counter **좌하단 left 18 · bottom 16** |
| 상세 hero (7.x · 8.3 · 6.4b) | 좌하단 16 / 우하단 16(시트 시작선 위) · Photo Counter 우상단 |
| Story Card (홈 2.x, 4.1) | 카드 맨 아래 Tags 줄(좌우 24, 아래 24). 그 위에 Body + Cook(Avatar 40) |
| Pick Card (2.5) | 카드 맨 아래 Tags 줄(좌우 20, 아래 20). 그 위에 Meta |
| Country Card (4.1) | 카드 맨 아래 Tags 줄(좌우 18, 아래 14). 그 위에 Title. 국기 Flag Tag는 사진 좌상단 12 |

- Story / Pick / Country 카드는 **아래 정렬 오토레이아웃**(Meta → Tags). 제목이 2줄로 늘어나면 텍스트가 위로 자라고 태그와 겹치지 않는다.
- **Chip 쓰임 구분**: 요리의 속성 **태그**(8.2 Meal · Mood 선택, 7.1 상세의 Weather · Temperature · Mood · Meal) = `Icon=Yes`(아이콘 + 글자). 목록을 거르는 **필터**(홈 피드 · Nearby · 4.1 풍경 칩 등) = `Icon=No`(글자만).
- Weather Tag의 기온·아이콘은 **사진을 올린 시점의 날씨**. 날씨 아이콘을 바꿔 끼우면(instance swap) 색 지정이 풀리므로, 바꾼 뒤 아이콘 색 = `fg/on-photo`, stroke 1.5(18px)를 다시 확인한다(구현에서는 Weather Tag가 아이콘 색을 항상 on-photo로 고정). Acorn Tag 탭 = 도토리 주기 토글: Default(라인) → Eaten(컬러), 수 +1.
- 작은 썸네일(80px 이하: Food Card Row, Nearby Card, Place Card, Meal Slot)에는 태그를 넣지 않는다. 대신 텍스트 줄(예: "DINNER · 10°")로 날씨를 보여 준다.

## 4. 공통 화면 골격

```
<Screen bg=var(--bg-default)>
  [WeatherBackdrop]    앱 루트에 하나, 높이 420, 무드 그라데이션 85 % + 날씨 모션 — 네 탭(투명 배경)에서만 보임(§3.1b)
  ScreenHeader         탭 화면 공통(§3.1b)
  StatusBar            44
  ...content (vertical stack, padding-x 20)
  [TabBar]   고정       bottom 34(홈 인디케이터 위), 탭 루트 화면만 — CreateFAB 포함
  Home Indicator       34
</Screen>
```
- `scroll: yes` 화면은 콘텐츠가 세로 스크롤되고 고정 요소는 그대로 남는다.
- **Figma 프레임 높이 = 내용 전체 길이**(기기 화면은 390×844). 프로토타입에서 844 화면 안에서 세로 스크롤된다. 아래 고정 요소(TabBar(+FAB) · 하단 버튼/액션바 · Toast · Home Indicator)는 프레임 맨 아래에 두고 constraint Bottom + 고정(스크롤해도 안 움직임). 위 고정 요소(StatusBar · Top bar)는 constraint Top.
- 스크롤 콘텐츠 하단에 TabBar 높이만큼(≈ 110) 여백을 둔다.
