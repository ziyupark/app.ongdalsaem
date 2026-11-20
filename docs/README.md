# ongdalsaem (옹달샘) — Design & Implementation Docs

> "A spring of daily food ideas." 날씨·시간·동네가 오늘 먹을 음식을 골라 주는 음식 공유 앱.
> 이 폴더는 앱을 **Figma 디자인 그대로** 구현하기 위한 유일한 기준 문서다. 각 화면의 Figma 링크를 열어 `get_design_context` / `get_screenshot`으로 수치를 교차 확인한다.

- **Figma**: [ONGDALSAEM-1.0 — Design-System · UI](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI) · fileKey `GL8f8wHgzzK4GDUffY4NPW`
  - 노드 링크 = 파일 URL + `?node-id=<id의 ':'를 '-'로>`
- **기준 기기**: iPhone 390 × 844 pt · 라이트 모드 기본(다크 모드 토큰 준비됨)
- **언어**: 앱 기본 언어 **English**(Figma 화면 문구 = 영어). **다국어 앱** — 1차 English · Korean, 기기 언어를 따르고 9.6에서 바꿀 수 있다. 문구는 i18n 키로 분리한다([05-behavior §9](05-behavior.md)).
- **버전**: 앱 1.0.0 · 문서 v1.8.4(기준선 v1.0) — 이력은 [CHANGELOG](CHANGELOG.md)
- **"코드 기준" 표시**: Figma보다 앱에서 먼저 바뀐 화면·규칙은 본문에 "코드 기준"이라고 적었다. 그 부분은 **문서 = 앱**이고 Figma 프레임은 이전 디자인이다.

## 문서 구성

| 파일 | 내용 |
|---|---|
| [01-foundations.md](01-foundations.md) | §2 토큰 — 컬러(시맨틱·프리미티브), 그라데이션, 날씨 무드, 간격·라운드, 타이포, 효과 |
| [02-components.md](02-components.md) | §3 컴포넌트 카탈로그 · TabBar 동작 · 아이콘 규칙 · Feed Post · 사진 위 태그 / §4 공통 화면 골격 |
| [03-ia-and-flows.md](03-ia-and-flows.md) | §1 정보 구조(IA) / §8 화면 간 이동(프로토타입 연결) |
| [04-screens/](04-screens/) | §5 화면별 명세 — 섹션별 파일 10개(아래 표) |
| [05-behavior.md](05-behavior.md) | §6 동작 규칙(비즈니스 로직) / §9 접근성 · UX 라이팅 |
| [06-data-model.md](06-data-model.md) | §7 데이터 형태(목업 JSON · API 계약) |
| [07-assets-licenses.md](07-assets-licenses.md) | §10 폰트 · 아이콘 · 사진 · 로고 라이선스, 출시 요건 출처 |
| [CHANGELOG.md](CHANGELOG.md) | 디자인 버전별 변경 요약 |

| 화면 파일 | 화면 |
|---|---|
| [00-launch](04-screens/00-launch.md) | 1.1 Splash · 1.1b Welcome(앱 소개) |
| [01-sign-in-setup](04-screens/01-sign-in-setup.md) | 1.2 Sign in(Apple · Google) · 1.3 Profile setup · 1.3b Taste · 1.4 Location · 1.5 Daily pick time · STATES |
| [02-home](04-screens/02-home.md) | 2.1 Home(2.2 · 2.3 = 날씨별 예시) · 2.4 · 2.5–2.7 상태 · 2.8 Notifications |
| [03-nearby](04-screens/03-nearby.md) | 3.1 Nearby list(지금 여는 버튼 없음) · 3.2–3.3 상태 · 3.4 Search · 3.5 Results · 3.6 범위 칩 · 3.7 Ask (3.7b 위치 꺼짐) · 3.8 Question |
| [04-community](04-screens/04-community.md) | **Explore**(4.1 + Our area · 4.1b Holidays · 템플릿 4.2 Tag(명절 포함) · 4.3 Country, v2) · **Following**(4.4 · 4.4b · 4.4c · 4.5 · 4.6 · 4.11 Messages) · **Tables · Challenges**(4.7 · 4.8 · 4.8b · 4.10 · 4.10b · 4.10c · 4.9 · 2.1c) |
| [05-timer](04-screens/05-timer.md) | 5.1 Kitchen timer · 5.2 Timer finished |
| [06-profile](04-screens/06-profile.md) | 6.1 Dishes · 6.2 Saved · 6.3 Diary · 6.4 Offline · 6.4b Offline post |
| [07-dish](04-screens/07-dish.md) | 7.1 Post detail · 7.1b Ate it · 7.2 Comments · 7.3 Report / block · 7.4 Share |
| [08-share](04-screens/08-share.md) | 8.1 Pick photos · 8.2 Details · 8.2e Travel(+ 8.2a Recipe · 8.2b Add your mood · 8.2c Set timer · 8.2d Edit place) · 8.3 Preview · 8.4 / 8.4b 상태 |
| [09-settings](04-screens/09-settings.md) | 9.1 · 9.2 · 9.2b · 9.3 · 9.4 · 9.5 · 9.6 Language · 9.7 · 9.8 · 9.9 Settings(10화면) + 9.8a Contact · 9.8b Licenses · 9.8c Document sheet |
| [99-removed-in-v1](04-screens/99-removed-in-v1.md) | v1에서 뺀 화면(이메일 로그인 · DM · 컬렉션 · 길찾기 · 마케팅 동의 · 테이블 탭 · 명절 · 나라 전체 · 문서 오프라인 · Eat together) — 참고용 |

| 가이드 | 내용 |
|---|---|
| [guides/9.9-help-policies-guide.pdf](guides/9.9-help-policies-guide.pdf) | 9.8 Help & policies 각 항목이 여는 화면 · 무료 호스팅 · 법적 체크(검토용) |
| [guides/7.4-report-moderation-guide.pdf](guides/7.4-report-moderation-guide.pdf) | 7.3 신고 처리 — 처리 단계 · 법·스토어 요건 · 사유별 기준 · 운영자 보호 원칙(검토용) |
| [guides/weather-3d-icon-prompts.pdf](guides/weather-3d-icon-prompts.pdf) | 날씨 3D 아이콘 18종 ChatGPT 프롬프트(기준 1장 + 짧은 프롬프트 + 값 표, ★ 먼저 만들 6개) — 1.4 오브 · 홈 날씨 카드용 |
| [guides/squirrel-weather-mood-prompts.pdf](guides/squirrel-weather-mood-prompts.pdf) · [ongi-parts-png-prompts.pdf](guides/ongi-parts-png-prompts.pdf) · [ongi-rive-handoff.xlsx](guides/ongi-rive-handoff.xlsx) | 다람쥐 Ongi 수채화 일러스트 프롬프트 · Rive용 부위 PNG 프롬프트 · Rive 핸드오프 표 |

문서 안의 `§숫자`는 위 표의 섹션 번호다(예: §2.6 = 01-foundations의 타이포그래피).

## 구현 규칙 (먼저 읽기)

1. **이름**: 앱 이름은 항상 소문자 `ongdalsaem`. 옛 이름(Hungi · Kozycast 등)은 코드·문구·식별자 어디에도 쓰지 않는다. 프로젝트 폴더명 `03_ongdalsam`은 그대로 둔다.
2. **컬러**: 시맨틱 토큰([01-foundations §2.1](01-foundations.md))만 쓴다. **보라색 계열 금지.** 하드코딩 HEX 대신 테마 변수(`var(--bg-default)` 등).
3. **폰트**: Display = **Fraunces**(serif), UI 전부 = **Outfit**(sans), 손글씨 = **Gaegu**(지금 쓰는 화면 없음). **Noto Sans KR**은 한·중·일 글자 표시용(9.6의 언어 자체 표기, 한국어 로케일, 사용자가 쓴 한글). 크기·행간·자간은 [§2.6 타이포그래피](01-foundations.md) 그대로.
4. **로고**: 텍스트 로고 `ongdalsaem`만. 심볼은 **도토리(Acorn Symbol)**만.
5. **TabBar · FAB**: 탭은 4개(Home · Community · Timer · Profile). 공유 버튼(FAB)은 `+` 아이콘만, 라벨 없음, **TabBar 안에 포함된 한 묶음**(오른쪽 끝). 스크롤 다운 때 바와 함께 아래로 숨는다.
6. **지도**: 앱 안에 지도 화면이 없다. 2.4 식당 카드 → 기기의 지도 앱으로 길찾기.
7. **레이아웃**: 모든 화면은 세로 스택(auto layout). 문서의 블록 순서 = DOM 순서. `[고정]` 요소(TabBar · FAB · Home Indicator · 하단 액션바 · 시트)만 fixed/absolute.
8. **텍스트 잘림**: 카드 제목·바이라인은 지정된 줄 수에서 말줄임(`…`)([02-components](02-components.md) 컴포넌트별 명시).
9. **아이콘**: Lucide(ISC) + 커스텀 `acorn` · `acorn-color` · `heart-filled`(v1 미사용) · `grip-vertical`. 크기별 선 두께·색 규칙은 [§3.2](02-components.md). Lucide는 `absoluteStrokeWidth`로 쓴다.
10. **데이터**: 화면 문구는 Figma 예시 데이터다. 구현 시 목업 JSON([06-data-model](06-data-model.md))으로, UI 문구는 i18n 파일(`en.json` · `ko.json`)로 분리한다.
11. **사진 위 태그**: Weather Tag · Acorn Tag · Photo Counter는(게시물 Feed Post 사진 = 좌상단 Weather Tag만, **날씨 상태 글자 포함** "Snow −4°", 도토리 수는 Actions에) **Size=XL**(높이 28), 예외 = 6.1 내 프로필 Dish Tile만 **L**(24). 위치: 카드·타일·상세 hero = 사진 **아래쪽 양 끝**(왼쪽 = 날씨, 오른쪽 = 도토리, 인셋 8 / 큰 사진 16), 상세 hero의 Photo Counter = 오른쪽 위. **피드(Feed Post)만 반대로** 태그 = 위쪽 양 끝, Photo Counter = 오른쪽 아래. 국기 Flag Tag = 왼쪽 위.
12. **Eyebrow(제목 위 작은 대문자 줄)는 쓰지 않는다**. 남기는 것은 정보가 있는 라벨뿐 — 설정·목록 그룹 제목(ACCOUNT · NEW · RESULTS 등), 표 머리줄, 날짜·남은 기간, 작은 썸네일의 날씨 메타("DINNER · 10°"), 단계 표시(STEP 1 OF 2), FESTIVE TABLES.

스택: 이 저장소는 React Native(Expo) + Supabase. 명세는 플랫폼 중립으로 썼다. **DB의 실제 테이블은 `supabase/` 마이그레이션이 기준**이고, [06-data-model](06-data-model.md)은 화면이 필요로 하는 데이터 형태다. 둘이 다르면 데이터 모델 문서를 먼저 고친 뒤 마이그레이션을 만든다.

## 구현 순서

1. 토큰([01-foundations](01-foundations.md)) → 테마 파일·폰트 로드.
2. 기본 컴포넌트: Button · IconButton · Chip · Tab · Input · Switch · Radio · Avatar · Badge · Toast · ListRow · SectionHeader · TopBar · Auth Button.
3. TabBar(스크롤 숨김 · 활성 알약 이동) + CreateFAB + 탭 라우팅.
4. 카드: Weather Card(+ Refresh) · Story · Food(Grid/Row) · Country · Pick · Timer · Feed Post · Dish Tile · Weather Tag / Acorn Tag.
5. Launch·온보딩(00–01) → Home 2.1 → 상태 2.5/2.6/2.7 → 2.4.
6. Community(Explore · Following · Challenges) → Timer → Profile → Dish → Share → Settings.
7. 화면마다 Figma 링크의 `get_screenshot`과 비교 검수.

## 문서 갱신 규칙

- Figma 디자인이 바뀌면 **같은 작업 안에서** 해당 파일(토큰 → 01, 컴포넌트 → 02, 화면 → 04-screens/, 이동 → 03)과 [CHANGELOG](CHANGELOG.md)를 함께 고친다.
- 본문에는 **최종 상태만** 적는다(“기존 → 변경” 같은 이력은 CHANGELOG에만).
- 노드 ID가 바뀌면 링크도 같이 바꾼다.
