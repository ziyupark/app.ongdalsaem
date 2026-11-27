# Screens 01 · Sign in & setup

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 01 Sign in & setup — [섹션 59:2359](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2359)

1.2 Sign in(Welcome) · 1.3b Taste · 1.4 Location · 1.5 Daily pick time (이 순서, 1.3 Profile setup은 삭제 — @username 자동 생성). **1.3b · 1.5는 앱에만 있고 Figma 프레임이 없다**(코드 기준). 로그인은 **Apple · Google만**(이메일 로그인 1.2b · 1.3 · 1.4 · 1.4b는 [99-removed-in-v1](99-removed-in-v1.md)).

**공통 규칙(01 전 화면)**: TopBar가 있는 화면의 제목은 Display/L, 시작 위치 y 118(1.3b · 1.4 · 1.5는 STEP Overline이 118). 가운데 정렬 블록(아바타 · 오브 · 도시 · 하단 링크)은 패딩이 아니라 정렬(center)로 맞춘다.

**버튼 위치 규칙(01 전 화면 공통)**: 주 버튼(검정 Primary L, 56)은 항상 **화면 아래 y 744–800**에 고정한다(Home Indicator 위 10). 보조 버튼이 있으면 그 위에 쌓는다(1.4 "Choose a city instead" 680–736, gap 8 · 1.2 Apple 698–744 · Google 754–800, gap 10). 레이어 = `Block · Button (fixed)`(absolute, 고정 요소 — 스크롤·키보드와 관계없이 같은 자리). 키보드가 올라오면 버튼은 키보드 바로 위로 함께 올라간다(구현).

**흐름 원칙**: 신규 = 1.2(Apple/Google, @username 자동 생성) → 1.3b(건너뛰기 가능) → 1.4 → 1.5(건너뛰기 가능) → 2.1. 단계 표시는 **STEP n OF 3**(1.3b = 1 · 1.4 = 2 · 1.5 = 3). 기존 사용자 = 1.2 → 2.1.

### 1.2 Sign in (Welcome) — [1207:10884](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1207-10884)
- 앱을 처음 열었을 때 보는 **보편적인 시작 화면**: 위 날씨 헤더(지금 내 위치 날씨, 가운데 정렬), 지금 날씨 3D, 아래 로그인 버튼 2개(Apple · Google). 이메일 · 비밀번호 입력은 없다. **하늘 · 모션 · 3D 아이콘은 지금 날씨를 따른다.**
- 레이아웃(자유 배치, 스크롤 없음):
  0. 프레임 배경 = bg/default(크림) → **아래 풍경**(Rectangle 22: 1.1과 같은 `assets/launch/splash-landscape.png`, 390×650 상자 y 194–844 안에서 188.64 % × 67.27 %, 위치 0.01 % / **43.2 %** — 1.1보다 아래로 잘림, 날씨와 관계없이 같음) → LaunchBackdrop: **하늘 390×420** = 맑음은 `photo:welcome`(1.1과 같은 Mood/clear 하늘), 그 밖의 날씨는 그 무드의 `Mood/<key>`(100 %, 1200ms 페이드) + **Weather Mood 모션**([§2.4](../01-foundations.md) — 비 · 눈 · 구름 · 해 빛 번짐 등, 낮/밤) + Scrim top 0–120 + 흰 글로 2개(1.1과 같음)
  1. StatusBar(Tone=Dark)
  2. **weather header**(y 54, 좌우 20, gap 22, 가운데 정렬): Logo(Compact) 줄(높이 40, 가운데) → Overline fg/default 대문자 **"TUE, OCT 27 · MAPO, SEOUL"**(날짜 = 앱 언어 형식 요일 · 월 · 일, 장소 = 구 · 도시) → **Weather card · small**(배경 없음, padding 12 16, radius 24, 가운데): 기온 **Numeric/XL "32°"**(padding 1 8 4) → 4 → [Title/M 상태 "Clear" → 6 → Body/S fg/muted "H 14° · L 9°" / (2) "until 9 PM"(바뀔 시각을 알 때만)] — 홈 Weather Card Now 줄과 같은 문구
  3. **Weather 3D**(지금 날씨의 3D 아이콘, 모르면 `clear`) 303×305, 카드 바로 아래 가운데(y 225–530). 작은 화면(iPhone SE)은 버튼 위 14를 남기고 줄어든다.
  4. [고정] Block · Button(y 544–668, Home Indicator 위 142, gap 10): **Auth Button(Apple)** "Continue with Apple" → **Auth Button(Google)** "Continue with Google" → Caption 가운데 "By continuing, you agree to our **Terms** and **Privacy Policy**."(두 단어 Caption Strong fg/secondary, 탭 → 9.8c 문서 시트). 이메일 버튼은 없다.
  5. [A] Home Indicator
- **지금 내 위치 날씨(로그인 전)**: 화면이 열리면 위치 권한을 묻는다(시스템 창, 이미 정했으면 묻지 않음). 허용 → 기기 좌표(소수 2자리로 반올림해 전송)로 장소 이름 · 지금 날씨 · 오늘 최고/최저 · 바뀔 시각을 읽어 Overline 장소, 기온 카드, 하늘 · 모션, 3D 아이콘에 보여 준다. 읽는 중 · 거부 · 위치 꺼짐 · 읽기 실패 → Overline은 날짜만, 기온 카드 자리는 비워 둠(자리 유지), 하늘 · 모션 · 3D = 맑음. 앱이 백그라운드면 모션 정지, Reduce Motion이면 정지 한 장. 로그인 전 날씨는 `weather` 함수가 **좌표로 읽는 current · forecast만**, IP당 시간 30회까지 허용한다(도시 검색 · 도시 이름 조회는 로그인 필요). 이 읽기는 저장하지 않으며, 로그인 후에는 공유 읽기(useHere)가 다시 읽는다.
- 이동: Apple/Google → **1.3b**(첫 로그인, @username 자동 생성) 또는 2.1(기존 계정).
- Apple·Google 버튼은 각 사 브랜드 규정(로고·문구·크기)을 따른다([07-assets-licenses](../07-assets-licenses.md)). Apple 버튼 외곽선 = 검정 1px(Auth Button 컴포넌트 값, HIG White with outline).
- 로그인 처리(Supabase Auth): **Apple** = iOS 기본 Apple 로그인 시트 → identity token + nonce로 세션 생성(Android는 웹 로그인). Apple이 처음 한 번만 주는 이름은 계정 메타데이터에 저장해 @username 자동 생성에 쓴다. **Google** = Supabase OAuth를 앱 안 인증 창으로 열고 `ongdalsaem://auth-callback`으로 돌아와 코드 교환(PKCE).
- 요청 중에는 누른 버튼이 흐려지고 두 버튼 모두 비활성. 실패하면 Caption 자리(버튼 아래)에 fg/destructive "Sign-in is napping — tap to try again."

### 1.3 Profile setup — 삭제(닉네임 기능 없음)
- 닉네임(Display name)을 정하는 단계는 없다. **첫 로그인 때 @username을 자동으로 만든다**: Apple/Google에서 받은 이름(없으면 `cook`)을 소문자 로마자로 바꾸고(한글은 로마자 변환) 허용 문자 `a–z 0–9 . _`만 남긴 뒤 `_` + 4자리 숫자(예: Jiyu → `jiyu_4821`). 중복이면 숫자를 다시 뽑는다. 3–20자.
- 앱 어디서나 이름 = username, **@는 어디에도 붙이지 않는다**(`jiyu_4821` — 댓글 · 질문 답변 · 게시물 · 질문 카드 · 프로필 카드 · 설정 · 차단 목록). 바꾸기는 9.2에서만. 프로필 사진도 9.2에서 정한다.
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
- 도시 pill은 위치 권한이 이미 있으면(1.2에서 허용했으면 이미 있음) 기기 도시, 없으면 기본 도시(Seoul)의 지금 날씨를 보여 준다.
- 이동: 뒤로 → BACK · Use my location → (권한 요청) → **1.5** · Choose a city instead / 권한 거부 → **1.5**(위치 꺼짐 상태를 넘겨, 1.5 다음 Home이 2.5로 열림).
- 개인정보: 서버에는 **도시/구 단위만** 전송(profiles.city · country · location_enabled). 좌표는 기기 안에서 도시 이름 · 날씨 조회에만 쓴다.


### 1.5 Daily pick time — 앱 전용(Figma 프레임 없음)
- 목적: 매일 Today’s pick 알림을 받을 시간을 정하고 알림 권한을 묻는다.
- 블록: StatusBar → TopBar(Inline, 오른쪽 Button Ghost S **"Skip"**) → Overline "STEP 3 OF 3" + Display/L **"When should we send / your daily pick?"** + Body/M fg/secondary "One dish for today’s weather, every day at this time. You can change it in Settings." → 40 → **시간 휠**(좌우 20, 5줄 보임, 줄 높이 46, 30분 간격 48개, 시각 표기는 앱 언어 형식). 가운데 줄 = bg/subtle + 1px border/default radius md 강조, 글자 Title/L fg/default · 나머지 Body/L fg/muted(한 칸 떨어지면 70 %, 그 밖 40 %). 처음 위치 = 저장된 시간(기본 07:30).
  - [고정] Button Primary L `bell` **"Turn on notifications"**
- 동작: 버튼 → `prefs.pickTimes` = [고른 시간] 저장(시간 추가는 9.4에서, 최대 5개) + Daily pick 알림 켬 → 시스템 알림 권한 요청 → 기기 토큰과 시간을 서버에 저장 → Home. Skip → 저장 없이 Home.
- 이동: 1.4에서 위치가 꺼진 채 왔으면 Home은 2.5 상태로 연다.
- 휠은 VoiceOver에서 조절 가능한 항목(위·아래로 30분씩).

---

### STATES · 버튼 비활성(Disabled) — 섹션 아래 줄
입력이 준비되기 전에는 주 버튼이 **Disabled**(같은 자리 744–800, 탭해도 반응 없음, 프로토타입 연결 없음). 버튼 바로 위에 Caption(가운데, fg/muted)으로 **무엇이 부족한지** 한 줄 알려 준다. 조건이 채워지면 즉시 Default로 바뀐다(검증은 입력할 때마다, 오류 표시는 칸을 벗어날 때).

| 화면 | 상태 | 버튼이 켜지는 조건 | 안내 문구 |
|---|---|---|---|

- 1.2 · 1.4는 입력이 없어 항상 활성.
- 서버 요청 중(Sign in · Create account · Send reset link · Save and sign in)에는 버튼 안 글자 대신 로딩 점 3개 + 버튼 Disabled(두 번 누름 방지).

