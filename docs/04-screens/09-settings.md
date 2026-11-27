# Screens 09 · Settings

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 09 Settings — [섹션 192:6130](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=192-6130)

출시에 **꼭 필요한 것만** 남긴 설정 화면 10개(9.1 · 9.2 · **9.2b** · 9.3 · 9.4 · 9.5 · **9.6** · 9.7 · 9.8 · 9.9)와 9.8 하위 화면 3개(9.8a · 9.8b · 9.8c)다. 화면이 따로 필요 없는 값(Temperature)은 9.1에서 선택 시트로 바꾸고, 차단 목록은 9.5 안에 둔다. 모든 화면 공통 골격과 규칙:
- **골격**: StatusBar → TopBar(Inline, 뒤로 → 9.1) → content(좌우 20, 그룹 간격 24) → Home Indicator. 세로 스크롤, TabBar·FAB 없음.
- **그룹 패턴**: Overline 제목(fg/muted) → 박스(bg/subtle, radius lg 16, clip, 행 간격 0) 안에 행 세로 나열 → 필요 시 Caption 설명(fg/muted). 행 높이 56, 아이콘 20.
  - 박스 안 **모든 행 = 배경 bg/default, 테두리 없음**(ListRow · Radio Row · Blocked row · Lang 행 공통). 화면 배경이 bg/subtle(흰색)이라 행 배경이 박스 모양을 만든다. Radio Row 기본의 사방 테두리는 박스 안에서 끈다(둥근 모서리에서 선이 잘려 보이기 때문).
- **ListRow 쓰는 법**: Trailing 값 Chevron(하위 화면), Switch(켜기/끄기), Value(현재 값 + 이동), None(정보·실행). 위험 동작은 Tone=Destructive.

**출시 요건 반영**(조사 출처는 [07-assets-licenses](../07-assets-licenses.md)):
- **계정 삭제**(9.3 → 9.9): Apple 5.1.1(v)·Google Play 공통 요건.
  - 앱 안에서 계정과 데이터 **전체 삭제**를 시작할 수 있어야 한다. 비활성화만으로는 안 된다.
  - 고객센터 연락을 강요하면 안 된다. 재인증 같은 확인 단계는 허용된다.
  - 처리 기간을 안내하고 완료를 알려야 한다. 법적으로 보관하는 데이터는 따로 고지한다.
  - Sign in with Apple 토큰은 REST API로 해지한다.
  - Google Play는 앱 밖 **웹 삭제 요청 페이지**도 필요하다(예: `ongdalsaem.app/delete-account`).
- **광고성 정보 수신 동의**(9.4):
  - OS 알림 권한과 **별도**로 받는다.
  - 야간(21:00–08:00) 광고는 **추가 동의**를 받는다.
  - 광고에는 광고 표기(영어 "Ad", **한국어 로케일은 반드시 "(광고)"**)와 무료 수신거부 방법을 넣는다.
  - 동의 일자를 표시하고, **2년마다 동의 상태를 다시 알린다**.
- **위치·개인정보**(9.5, 9.8) · **차단**(9.5, UGC 앱 요건):
  - 위치는 도시 단위만 쓴다.
  - 접근권한(위치·카메라·사진·알림)은 필수/선택과 목적을 고지한다.
  - 위치기반서비스 이용약관, 개인정보처리방침, 마케팅 수신 약관, 오픈소스 라이선스를 제공한다.

### 9.1 Settings — [26:2](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-2)
- TopBar "Settings" → **Profile card**: 가로, radius 16, bg/subtle, padding 14 16. 구성은 Avatar 56 + "@jiyu.cooks"(Title/S) / "Edit profile"(Body/S muted) + `chevron-right`. 탭 → 9.2.
- 그룹:
  - ACCOUNT: Account & security › (9.3)
  - PREFERENCES: Notifications › (9.4) · `thermometer` Temperature **°C**(선택 시트: °C / °F) · `globe` **Language** "English" › (9.6) · `salad` **Diet & allergies** › (값 = 식단 · 직접 넣은 식단 단어 · "Allergies: n", 없으면 "No restriction")
  - PRIVACY & SAFETY: Privacy & location › (9.5)
  - SUPPORT: Help & policies › (9.8)
  - (제목 없음) Sign out (Destructive) → 1.2
- 푸터 "ongdalsaem 1.0.0 (100) · Made for every weather". 뒤로 → 6.1.
- 언어: 기본은 기기 언어를 따르고, 9.6에서 앱만 다른 언어로 바꿀 수 있다(다국어 앱).

### 9.2 Edit profile — [193:6134](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=193-6134)
- 위쪽(가운데 정렬): **Avatar edit**(96) = Avatar 88 + 오른쪽 아래 **편집 배지**(Edit, 32 원, bg/primary, 2px bg/default 테두리, `camera` 16 fg/on-primary). 아바타나 배지를 탭 → **9.2b**.
- 입력:
  - *(닉네임 Display name 입력칸 없음 — 앱 어디서나 @username이 이름이다)*
  - Username "@jiyu.cooks"(가입 때 자동 생성된 `jiyu_4821`을 사용자가 바꾼 예) — helper "ongdalsaem.app/@jiyu.cooks · changeable once every 30 days". 입력 중 실시간 중복 확인, 중복·허용 외 문자면 Error 상태. **30일에 1회만 변경**, 제한 중에는 Disabled + helper에 다음 변경 가능 날짜 표시. 바꾼 뒤 예전 handle은 14일간 예약(다른 사람이 못 씀).
  - Bio "Cooking for one, mostly when it rains." — helper "38 / 80"
- Button Primary L "Save changes": 변경이 없으면 Disabled. 저장하면 9.1로 돌아간다.

### 9.2b Choose a photo — [409:9973](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=409-9973)
- 9.2 아바타/배지에서 연다(MOVE_IN). 8.1 Pick photos를 바탕으로 한 **한 장 선택** 앨범 화면.
- 상단 행: "Cancel"(→ BACK) · "Profile photo" → 제목 "Choose a / profile photo" → Camera 타일 · "Recents" + "Pick one · you can move and zoom it next" → 앨범 그리드 3열(선택한 한 장에 체크 배지, 다른 사진을 누르면 선택이 옮겨감) → [A] Button Primary L **"Use photo"**(선택 전 Disabled). 8.1의 선택 사진 줄(순서 번호)은 숨김.
- Use photo → 원형 자르기(이동·확대, OS 기본 크롭 `allowsEditing`) → 9.2로 돌아가 아바타 교체(저장은 9.2 Save changes). 사진 권한이 없으면 OS 권한 요청 → 거부 시 "Allow photo access in Settings" 안내.

### 9.3 Account & security — [193:6247](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=193-6247)
- SIGN-IN: Email **jiyu@ongdalsaem.app**(Apple · Google 계정의 이메일, 표시만) — 비밀번호 행 없음(이메일 로그인 없음)
- CONNECTED ACCOUNTS: Apple **Connected** · Google **Connect**(행 아이콘 = logo/apple, logo/google)
  - 캡션: "Use any connected account to sign in. Keep at least one sign-in method." 마지막 남은 방법은 해제할 수 없다.
- DANGER ZONE: **Delete account**(Destructive) → 9.9
  - 캡션: "Permanently deletes your profile, dishes, photos, comments, acorns and diary. This can’t be undone."
- DANGER ZONE: **Deactivate account**(Destructive, `pause`) — Delete account 아래 → 9.3b

### 9.3b Deactivate account (Figma 없음 — 9.9 레이아웃 그대로)
- 골격 = 9.9: TopBar "Deactivate account" · Head(Display/M **Take a break?** · Body/M fg/secondary "Your account goes quiet for 30 days. Nothing is deleted yet — sign in again any time before then and it’s all back.") · 그룹 · 버튼, 간격 24
- WHILE DEACTIVATED(누를 수 없는 행): `user` Your profile is hidden · `image` Your dishes and photos are hidden · `message-circle` Comments, messages & follows are hidden
  - 캡션: "Sign in with Apple or Google within 30 days to come back. After that, your account and everything in it are deleted for good."
- 그룹(라벨 없음): `clock` **Deleted on** · 값 = 오늘 + 30일(앱 언어 날짜, 예 "December 27, 2026")
- Destructive L **Deactivate account** → 확인 팝업 "Deactivate your account?" / "Your account will be switched off and you’ll be signed out. If you don’t sign in again within 30 days, your account and everything in it will be deleted automatically." · Cancel · **Deactivate account** → `deactivate_own_account()` → 로그아웃 → 1.1 Splash
- Ghost L **Keep my account** → 9.3
- 비활성화 동안 다른 사람에게는 프로필(6.1 → 없는 계정 상태) · 요리 · 사진 · 댓글 · 질문 · 답변 · 메시지 대화 · 팔로우 · 도토리 · 테이블/챌린지 참여가 보이지 않고, 매일 추천 푸시에도 안 나온다(차단과 같은 방식)
- 30일 안에 다시 로그인 → `reactivate_own_account()` → 팝업 "Welcome back" / "Your account is active again. Your profile and dishes are visible as before." → 모두 그대로. 30일이 지나면 서버가 9.9 삭제와 똑같이 지운다(purge-deactivated-accounts, 매일 1번)

### 9.4 Notifications — [193:6391](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=193-6391)
- ACTIVITY(Switch): Acorns on your dishes **on** · Comments & replies **on** · New followers **on**
- FOR YOU: Daily weather pick **on** · Pick time **7:30 AM**(Value, 시간 선택 시트) · Kitchen timer **on**
  - Pick time은 **최대 5개**(Figma에는 1개만): 시간마다 Pick time 행 1개(시각 순). 행 탭 → 시간 선택 시트(이미 고른 시간은 빼고) + 2개 이상이면 **Remove this time**(Destructive). 5개 미만이면 마지막에 `plus` **Add pick time** 행 → 시간 선택 시트. 시트 시간 = 7:00 · 7:30 · 8:00 · 9:00 · 11:30 · 12:00 · 15:00 · 17:30 · 18:00 · 20:00. Daily weather pick이 꺼지면 모두 비활성.
- 광고 · 이벤트 알림은 v1에 없다(ADS & EVENTS 그룹 숨김). 나중에 추가하면 옵트인 · 야간 별도 동의 · "(광고)" 표시 · 2년 재확인([99-removed-in-v1](99-removed-in-v1.md) 9.9e).
- OS 알림이 꺼져 있으면 맨 위에 Inline Banner(Neutral) "Notifications are off in system settings · Turn on"을 표시한다.

### 9.5 Privacy & location — [193:6566](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=193-6566)
- 맨 위 **At a glance** pill 4개(현재 설정 요약, 탭하면 해당 그룹으로 스크롤): "Dishes: Everyone" · "Shown: City only" · "Blocked: 2".
- **WHO SEES YOUR NEW DISHES**(Radio Row): **Everyone** · Only me + Switch **Allow comments**
  - 캡션: "These are the defaults for Share publicly and Allow comments in 8.2. You can still change them on each dish."
  - Only me를 고르면 Allow comments는 비활성(나만 보는 게시물이라).
- **WHO CAN MESSAGE YOU**(Radio Row): **Everyone** · People I follow — 캡션 "Requests have no read receipts and hide photos and links until you reply."(4.11)
- **LOCATION**: Use location for weather **on** · Shared precision **City only**
  - Shared precision(선택 시트): Neighborhood · **City only** · Country only — 게시물에 보이는 위치 범위(`Dish.regionPrecision`).
  - 캡션: "Your exact location never leaves your phone. Shared precision sets what others see on your dishes and is turned off when location is off. System permissions can be changed in Settings."
  - 버그 방지: Use location이 꺼지면 Shared precision 행은 Disabled(값 표시 "Off"), 홈은 2.5, 8.2 Auto context는 "Add where you ate it".
- **BLOCKED · 2**: 각 행(높이 HUG, padding 12 12 12 16, gap 12) Avatar 40 + [이름 Body/S Strong / 아이디·도시 Caption] + Button Outline S "Unblock".
  - Minji (@minji.cooks · Mapo, Seoul) · Dae (@dae.eats · Incheon)
  - 캡션: "Blocked cooks can’t see your dishes, follow you or comment. They aren’t notified."
  - Unblock → 확인 없이 해제하고 토스트 "Minji is unblocked · Undo". 목록이 비면 "No one is blocked." · 5명 넘으면 "See all"
- **YOUR DATA**: Download my data › → 이메일로 내보내기 파일(JSON + 사진). 계정 삭제는 9.3 Danger zone에 있다.
- 권한(위치·카메라·사진·알림)은 처음 쓰는 순간 OS 권한 요청과 목적 문구로 고지한다(별도 목록 화면 없음).

### 9.6 Language — [394:9167](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=394-9167)
- 9.1 Language 행에서 연다. TopBar "Language".
- Search Field "Search languages"
- **APP LANGUAGE**: Switch **Use device language**(on) — "Your phone is set to English (United States)"
  - 캡션: "Turn off to pick a language just for ongdalsaem. Dish posts stay in the language they were written in."
- **ALL LANGUAGES**(Radio Row, 스위치가 켜져 있으면 Disabled): 각 행 = 영어 이름 + **그 언어 자체 표기**(Noto Sans KR — 한/중/일 글자 표시용): English (United States) ✓ · Korean 한국어 · Japanese 日本語 · Chinese, Simplified 简体中文 · Spanish Español · French Français · German Deutsch · Italian Italiano · Portuguese Português (Brasil)
- 캡션: "Weather words, mood tags and dates follow the language you pick. Units (°C / °F) are set separately."
- 언어를 바꾸면 앱 문구가 즉시 바뀐다(재시작 없음, `i18next` + `expo-localization`). 사용자가 쓴 글(요리 이름·설명·직접 만든 무드)은 번역하지 않는다.
- 출시 1차 언어: English · Korean. 나머지는 번역이 준비된 언어만 목록에 보인다.

### Diet & allergies (코드 기준, Figma 없음)
- 9.1 Diet & allergies 행에서 연다(온보딩 Taste 다음 단계와 같은 폼). 누를 때마다 바로 저장.
- **DIET**: Chip "No restriction" · Vegetarian · Vegan · Pescatarian(하나만) + 직접 넣은 단어 + **Add your own**(Chip · Add, `plus`). "No restriction"을 누르면 식단과 직접 넣은 식단 단어를 모두 지운다.
- **ALLERGIES**: 9개 알레르기 Chip(여러 개) + 직접 넣은 단어 + **Add your own**.
- **Add your own** → 다이얼로그(8.2b Add your mood와 같은 카드): `plus` 배지 · 제목/설명 · 입력칸(1–20자, 카운터) · 이미 있는 항목(고정 항목 이름 포함, 대소문자 무시)이면 "You already have this one." · Cancel / Add. 넣은 단어는 선택된 Chip으로 보이고, 탭하면 "Remove “…”?" 확인 후 지운다. 목록당 최대 20개.
- 직접 넣은 단어가 요리 이름이나 재료에 있으면 추천 · 검색에서 뺀다. 직접 넣은 알레르기는 7.1 알레르기 경고에도 그 단어 그대로 나온다.

### 9.7 Choose city — [26:248](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-248)
- **위치를 끈 사용자 전용**(2.5 "Choose city"에서만 진입). 위치가 켜져 있으면 날씨는 항상 현재 위치 기준이라 이 화면을 쓰지 않는다.
- TopBar(Inline) "Choose city" → Search Field "Bus" → "Use current location"(`navigation`) → City Row 목록(도시 / 국가 / 현재 기온):
  - Busan 21° South Korea · Bushehr 29° Iran · Busto Arsizio 15° Italy · Bussum 11° Netherlands
- 아래 팁: "Home will match Busan’s weather from now on."
- 이동: Busan → 2.2 · Use current location → 위치 권한 요청 → 2.1 · 뒤로 → 2.5.

### 9.8 Help & policies — [194:6602](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=194-6602)
- 각 행이 여는 화면과 무료 · 법적으로 안전한 운영 방법은 가이드 [guides/9.9-help-policies-guide.pdf](../guides/9.9-help-policies-guide.pdf). 세로 882.
- **HELP**: **Help center**(`compass`) → 9.8c · Contact support(`mail`) → **9.8a** · Community guidelines(`users`) → 9.8c
- **LEGAL**: Terms of service · Privacy policy · Location-based service terms → **9.8c**(문서 시트) · Open-source licenses → **9.8b**(Marketing consent terms 행은 숨김 — 광고 없음)
- **ABOUT**: **A letter from us**(`acorn`) → **1.1b** Welcome(앱 소개) 다시 보기 · Version **1.0.0 (100) · latest**(누르지 않음, 새 버전이 있을 때만 "Update available" → 스토어)
  - 캡션: "ongdalsaem · app.ongdalsaem@gmail.com · Weather data by OpenWeather · Fonts: Fraunces, Outfit, Noto Sans KR (OFL) · Icons: Lucide (ISC)". 사업자로 등록하면 이 줄에 실제 사업자등록번호를 추가한다(자리표시자 번호는 쓰지 않음).
- 문서 종류별 여는 방식: 긴 문서(약관 · 개인정보 · 위치 약관 · 가이드라인 · 도움말) = **웹뷰 시트**(호스팅한 웹 문서, expo-web-browser), 앱 데이터가 필요한 것(문의 · 라이선스 · 마케팅 동의) = 네이티브 푸시 화면.

### 9.8a Contact support — [497:10459](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=497-10459)
- 푸시(TopBar Inline "Contact support"). **What’s it about?** Chip 한 줄: **Bug**(Selected) · Account · Report · Other(1개 필수, DB topic = bug · account · report_content · other).
- 메시지 칸(bg/default, focus 테두리 1.5, radius 16, Body/M, 5–1000자) + 아래 줄 **Screenshot**(`image`, 선택 1장) ··· "92 / 1000".
- 안내 박스(bg/accent-subtle, `alert-circle`): "We’ll attach app version 1.0.0 (100), iOS 18.2 and English to help us fix it. We reply to minji@example.com within 3 days." — 버전 · OS · 언어는 자동으로 붙는다. 답장 주소 = 로그인 이메일.
- 링크 "Or email app.ongdalsaem@gmail.com"(`mail`, fg/accent) → 메일 앱(mailto, 제목에 버전 · 기기 자동 입력).
- [고정] Button Primary L **Send**(y 744) → Back + Toast "Thanks — we’ll reply by email within 3 days." 입력 전에는 Disabled.
- DB `support_tickets`(본인만 보내기 · 읽기, 처리 완료 후 3년 보관).

### 9.8b Open-source licenses — [497:11726](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=497-11726)
- 푸시. 그룹 박스(ListRow Value — 오른쪽 = 라이선스 이름):
  - ICONS: Lucide · ISC
  - FONTS: Fraunces · Outfit · Noto Sans KR — OFL 1.1
  - LIBRARIES: React Native · Expo · Supabase JS — MIT + 캡션 "Generated from the app’s dependencies when it’s built. Tap a library to read its full license."
  - DATA SOURCES: **OpenWeather** · Weather data(출처 표기 "Weather data by OpenWeather"는 9.8 하단 캡션과 행 상세에) · Flag images · Public domain
- 그룹(Overline + 박스)은 본문 폭 FILL, 박스 안 행 = ListRow(bg/default, 테두리 없음). 라벨은 한 줄에 들어가게 짧게.
- 목록은 빌드 때 의존성에서 자동 생성(license-checker 등). 행 탭 → 라이선스 전문(같은 문서 시트 형식).

### 9.8c Document · Privacy policy — [499:10631](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=499-10631)
- **문서 시트 템플릿**(Terms · Privacy · Location terms · Community guidelines · Help center 공통). 9.8 위 Scrim(탭 → 닫기) + 시트(y 58부터 화면 끝, 위 모서리 24, bg/default).
- 그래버 → 헤더: `x` 닫기(IconButton Ghost) · 제목 Title/M 가운데 · `corner-up-right` 외부 브라우저로 열기 → 구분선 → 본문(좌우 20):
  - "Effective Nov 1, 2026 · Last updated Nov 1, 2026"(Caption fg/muted) — 모든 문서 맨 위에 시행일 · 최종 수정일
  - 섹션 제목 Title/S + 본문 Body/S fg/secondary: 1. What we collect · 2. Why we use it · 3. Who helps us(Supabase · OpenWeather · Expo, 해외 이전 포함) · 4. How long we keep it · 5. Your choices
  - 언어 안내(bg/subtle radius 12): "For users in Korea, the Korean version (한국어) is the official one."
- 문서 URL은 언어 코드로 나눈다(/privacy/en, /privacy/ko). 9.6 Language 설정을 따른다. 내용은 직접 작성하고 정부 표준약관 · 작성지침을 참고한다(다른 서비스 문서 복사 금지). 법률 자문이 아니므로 출시 전 개인정보보호위원회 · KISA 무료 상담으로 확인.

### 9.9 Delete account — [194:6780](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=194-6780)
- 제목 "Delete your account?"(Display/M) + 본문 "This removes everything below for good. If you just need a break, you can sign out instead."
- WHAT GETS DELETED(ListRow None): Profile, settings & sign-in · 48 dishes and their photos · Comments, acorns & follows · Diary & saved dishes
  - 캡션: "Finished within 7 days — we’ll email you when it’s done. Records we must keep by law (e.g., consent logs) are stored separately and never shown. Sign in with Apple / Google access is revoked."
- 비밀번호 입력 없음. **Delete account**를 누르면 Apple · Google 재인증 시트(Face ID 또는 Google 계정 확인)로 본인 확인 후 삭제.
- 버튼:
  - Destructive L **Delete account** → 1.1 Splash(로그아웃 상태). 이메일로 완료를 알린다.
  - Ghost L **Keep my account** → 9.3
- 구독 기능이 생기면 삭제 전에 "구독은 스토어에서 해지" 안내를 추가한다(Apple 요건).
