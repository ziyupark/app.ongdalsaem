# Screens 01 · Sign in & setup

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 01 Sign in & setup — [섹션 59:2359](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2359)

1.2 Sign in(Welcome) · 1.3b Taste · 1.4 Location · 1.5 Daily pick time (이 순서, 1.3 Profile setup은 삭제 — @username 자동 생성). **1.3b · 1.5는 앱에만 있고 Figma 프레임이 없다**(코드 기준). 로그인은 **Apple · Google만**(이메일 로그인 1.2b · 1.3 · 1.4 · 1.4b는 [99-removed-in-v1](99-removed-in-v1.md)).

**공통 규칙(01 전 화면)**: TopBar가 있는 화면의 제목은 Display/L, 시작 위치 y 118(1.3b · 1.4 · 1.5는 STEP Overline이 118). 가운데 정렬 블록(아바타 · 오브 · 도시 · 하단 링크)은 패딩이 아니라 정렬(center)로 맞춘다.

**버튼 위치 규칙(01 전 화면 공통)**: 주 버튼(검정 Primary L, 56)은 항상 **화면 아래 y 744–800**에 고정한다(Home Indicator 위 10). 보조 버튼이 있으면 그 위에 쌓는다(1.4 "Choose a city instead" 680–736, gap 8 · 1.2 Apple 698–744 · Google 754–800, gap 10). 레이어 = `Block · Button (fixed)`(absolute, 고정 요소 — 스크롤·키보드와 관계없이 같은 자리). 키보드가 올라오면 버튼은 키보드 바로 위로 함께 올라간다(구현).

**흐름 원칙**: 신규 = 1.2(Apple/Google, @username 자동 생성) → 1.3b(건너뛰기 가능) → 1.4 → 1.5(건너뛰기 가능) → 2.1. 단계 표시는 **STEP n OF 3**(1.3b = 1 · 1.4 = 2 · 1.5 = 3). 기존 사용자 = 1.2 → 2.1.

### 1.2 Sign in (Welcome) — [14:67](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=14-67)
- 앱을 처음 열었을 때 보는 **보편적인 시작 화면**: 위 사진, 아래 로그인 버튼 2개(Apple · Google). 이메일 · 비밀번호 입력은 없다.
- 레이아웃(자유 배치, 스크롤 없음):
  0. 프레임 배경 = bg/default(크림)
  1. [A] 음식 사진 `photo:welcome` 390×420 + 아래 Fade(270–420, 투명 → bg/default) + 위 Scrim top(0–120, ink 45% → 0, StatusBar 가독성). 글은 사진 위가 아니라 크림 배경 위에 둔다.
  2. StatusBar(Tone=Light)
  3. Logo(Compact) "ongdalsaem"(x 20, y 424) → 10 → **Display/L**(다른 01 화면 제목과 같은 스타일) **"What’s the weather / on your table?"** → 8 → Body/M fg/secondary "Share what you cook in every kind of weather — and find what to eat next."(아래 끝 586)
  4. [고정] Block · Button(y 672–800, gap 10): Caption 가운데 "By continuing, you agree to our **Terms** and **Privacy Policy**."(두 단어 Caption Strong fg/secondary, 탭 → 9.8c 문서 시트) → **Auth Button(Apple)** "Continue with Apple"(698–744) → **Auth Button(Google)** "Continue with Google"(**y 754–800**, 01의 주 버튼 자리). 이메일 버튼은 없다.
  5. [A] Home Indicator
- 이동: Apple/Google → **1.3b**(첫 로그인, @username 자동 생성) 또는 2.1(기존 계정).
- Apple·Google 버튼은 각 사 브랜드 규정(로고·문구·크기)을 따른다([07-assets-licenses](../07-assets-licenses.md)). Apple 버튼 외곽선 = 검정 1px(Auth Button 컴포넌트 값, HIG White with outline).
- 로그인 처리(Supabase Auth): **Apple** = iOS 기본 Apple 로그인 시트 → identity token + nonce로 세션 생성(Android는 웹 로그인). Apple이 처음 한 번만 주는 이름은 계정 메타데이터에 저장해 @username 자동 생성에 쓴다. **Google** = Supabase OAuth를 앱 안 인증 창으로 열고 `ongdalsaem://auth-callback`으로 돌아와 코드 교환(PKCE).
- 요청 중에는 누른 버튼이 흐려지고 두 버튼 모두 비활성. 실패하면 Caption 자리에 fg/destructive "Sign-in is napping — tap to try again."

### 1.3 Profile setup — 삭제(닉네임 기능 없음)
- 닉네임(Display name)을 정하는 단계는 없다. **첫 로그인 때 @username을 자동으로 만든다**: Apple/Google에서 받은 이름(없으면 `cook`)을 소문자 로마자로 바꾸고(한글은 로마자 변환) 허용 문자 `a–z 0–9 . _`만 남긴 뒤 `_` + 4자리 숫자(예: Jiyu → `jiyu_4821`). 중복이면 숫자를 다시 뽑는다. 3–20자.
- 앱 어디서나 이름 = **@username**(댓글 · 게시물 · 프로필 · 설정). 바꾸기는 9.2에서만. 프로필 사진도 9.2에서 정한다.
- 로그인 직후 바로 **1.3b**로 간다. 온보딩을 마친 기준 = username이 있는지.

### 1.3b Taste — 앱 전용(Figma 프레임 없음)
- 목적: 좋아하는 한 끼 취향을 골라 Today’s pick 추천에 반영한다. 여러 개 고를 수 있고 건너뛸 수 있다.
- 블록: StatusBar → TopBar(Inline, 오른쪽 Button Ghost S **"Skip"**) → Overline "STEP 1 OF 3" + 12 + Display/L **"What kind of meal / do you love?"** + 12 + Body/M fg/secondary "Pick as many as you like. We’ll lean your picks this way." → 24 → **취향 카드 2열**(좌우 20, gap 10).
  - 카드 = 가로(padding 16, gap 10, radius lg, 1px 테두리): 태그 아이콘 22 · Body/M Strong 라벨 · 오른쪽 체크 원 22. 기본 bg/subtle + border/default, 아이콘 fg/secondary, 빈 원(1px border/strong). **선택** = bg/accent-subtle + border/accent, 아이콘 fg/accent, 원 bg/inverse + `check` 14 fg/inverse.
  - 태그 13개: 무드 10(cozy · calm · fresh · energized · comforting · nostalgic · celebrating · lazy · together · hearty) + 끼니 3(vegan · seafood · snack). 라벨은 8.2의 태그 이름과 같다.
  - [고정] Button Primary L **"Continue"**. 저장 실패 시 버튼 위 Caption fg/destructive "Didn’t save — tap Continue to retry."
- 저장: 고른 태그 → `profiles.favorite_tags`. 아무것도 안 골랐으면 저장 없이 넘어간다.
- 이동: 뒤로 → BACK · Continue / Skip → 1.4.

### 1.4 Location — [14:314](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=14-314)
- 블록: StatusBar → TopBar(Inline) → "STEP 2 OF 3" + 제목 "Let the weather / help you choose." + 본문 "We use your city’s forecast to suggest what others cooked in the same weather. Only your city is shared — never your exact location."(gap 12) → 40 → **날씨 오브** 220 원(지금 날씨의 3D 날씨 아이콘 `assets/weather3d/weather3d_{mood}.png`, 없는 무드는 `clear`) → 28 → **도시 pill**(bg/default + 1px border/default, radius full, padding 12 16, gap 10): `map-pin` 20 fg/accent · "Seoul, KR"(Body/M Strong) · "· 17° Clear"(Body/S fg/muted, 상태 이름 = Weather Tag 짧은 영어) → 24 → **Why 박스**(좌우 20, bg/subtle + 1px border/default, radius lg, padding 16, gap 8): `shield-check` 20 fg/accent + Body/M Strong "Why do we need this?" / Body/S fg/secondary "For your neighborhood’s weather and places close by. We never save your exact coordinates — only your area is used." → [고정] Button Ghost L "Choose a city instead"(680–736) + Button Primary L `navigation` "Use my location"(744–800).
- 도시 pill은 위치 권한이 이미 있으면 기기 도시, 없으면 기본 도시(Seoul)의 지금 날씨를 보여 준다.
- 이동: 뒤로 → BACK · Use my location → (권한 요청) → **1.5** · Choose a city instead / 권한 거부 → **1.5**(위치 꺼짐 상태를 넘겨, 1.5 다음 Home이 2.5로 열림).
- 개인정보: 서버에는 **도시/구 단위만** 전송(profiles.city · country · location_enabled). 좌표는 기기 안에서 도시 이름 · 날씨 조회에만 쓴다.


### 1.5 Daily pick time — 앱 전용(Figma 프레임 없음)
- 목적: 매일 Today’s pick 알림을 받을 시간을 정하고 알림 권한을 묻는다.
- 블록: StatusBar → TopBar(Inline, 오른쪽 Button Ghost S **"Skip"**) → Overline "STEP 3 OF 3" + Display/L **"When should we send / your daily pick?"** + Body/M fg/secondary "One dish for today’s weather, every day at this time. You can change it in Settings." → 40 → **시간 휠**(좌우 20, 5줄 보임, 줄 높이 46, 30분 간격 48개, 시각 표기는 앱 언어 형식). 가운데 줄 = bg/subtle + 1px border/default radius md 강조, 글자 Title/L fg/default · 나머지 Body/L fg/muted(한 칸 떨어지면 70 %, 그 밖 40 %). 처음 위치 = 저장된 시간(기본 07:30).
  - [고정] Button Primary L `bell` **"Turn on notifications"**
- 동작: 버튼 → `prefs.pickTime` 저장 + Daily pick 알림 켬 → 시스템 알림 권한 요청 → 기기 토큰과 시간을 서버에 저장 → Home. Skip → 저장 없이 Home.
- 이동: 1.4에서 위치가 꺼진 채 왔으면 Home은 2.5 상태로 연다.
- 휠은 VoiceOver에서 조절 가능한 항목(위·아래로 30분씩).

---

### STATES · 버튼 비활성(Disabled) — 섹션 아래 줄
입력이 준비되기 전에는 주 버튼이 **Disabled**(같은 자리 744–800, 탭해도 반응 없음, 프로토타입 연결 없음). 버튼 바로 위에 Caption(가운데, fg/muted)으로 **무엇이 부족한지** 한 줄 알려 준다. 조건이 채워지면 즉시 Default로 바뀐다(검증은 입력할 때마다, 오류 표시는 칸을 벗어날 때).

| 화면 | 상태 | 버튼이 켜지는 조건 | 안내 문구 |
|---|---|---|---|

- 1.2 · 1.4는 입력이 없어 항상 활성.
- 서버 요청 중(Sign in · Create account · Send reset link · Save and sign in)에는 버튼 안 글자 대신 로딩 점 3개 + 버튼 Disabled(두 번 누름 방지).

