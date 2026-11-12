# Screens 00 · Launch

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

> 표기: **[F]** 흐름(스택) 블록, **[A]** 고정/절대 위치 블록. "→ X" = 탭 시 X 화면으로 이동.

## 00 Launch — [섹션 197:6524](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=197-6524)

### 1.1 Splash — [14:2](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=14-2)
- 목적: 브랜드 첫인상, 세션 확인.
- 레이아웃: [A] 배경 Ellipse(390×390, y 215, Gradient/Sunset 큰 원 · 블러 — 옅은 선셋 빛) · [F] StatusBar · [F] **Logo(Lockup=Acorn)**: Acorn Symbol 36×46 → 워드마크 "ongdalsaem"(Wordmark, Gradient/Ink metal) → 태그라인 "A spring of daily food ideas"(Tagline fg/muted), 가운데 정렬 gap 10 — 로고 블록 790(StatusBar 아래, padding-bottom 65) 안에서 세로 가운데 · [A] Home Indicator.
- 동작: **1.2초 후 자동 이동**(프로토타입: AFTER_TIMEOUT 1.2s → 1.1b).
  - 처음 설치한 사용자 → **1.1b Welcome(앱 소개)**
  - 편지를 이미 본 비로그인 사용자 → 1.2
  - 로그인 세션이 있으면 → 프로필 설정이 안 끝났으면 1.3, 아니면 2.7 Loading → 2.1

### 1.1b Welcome — 앱 소개(온보딩 0) · 코드 기준(Figma 프레임 197:6526은 옛 손글씨 편지 디자인)
- 목적: 로그인 전에 앱이 무엇을 하는지 한 화면으로 보여 준다. **최초 1회만** 표시한다(로컬 플래그 `welcomeLetterSeen`, 화면이 열릴 때 저장).
- 레이아웃(bg/default, 세로 스크롤):
  1. StatusBar
  2. 제목 블록(padding 위 40 · 좌우 20, gap 12): Display/L **"Your daily meal, / with the weather."** → Body/M fg/secondary "See what people cook in weather like yours, and find what to eat today."
  3. 32 → **기능 카드 2×2**(좌우 20, gap 12). 카드 = bg/subtle + 1px border/default, radius lg(16), 위 이미지(4:3, bg/muted) + 아래 글(padding 12, gap 4: Body/M Strong 제목 2줄 · Body/S fg/muted 설명 3줄):
     - **Today’s weather pick** — "A dish that fits the sky right now."(3D 날씨 아이콘 `weather3d_clear`, contain)
     - **Places nearby** — "Where to eat it close to you."(명절 음식 사진 `samgyeopsal`)
     - **Kitchen timer** — "Several timers at once while you cook."(`pasta_day`)
     - **World holidays** — "Festive dishes from around the world."(`chuseok`)
  4. [고정] Button Primary L **"Get started"**(좌우 20, 아래 = 안전 영역 + 10) → 1.2
- 한국어(ko): "날씨와 함께 고르는 / 오늘의 한 끼." · "나와 같은 날씨에 사람들이 만든 요리를 보고, 오늘 뭐 먹을지 정해요." · 오늘 날씨 추천 · 근처 가게 · 키친 타이머 · 세계의 명절 · "시작하기".
- 다시 보기: 9.8 Help & policies의 **"A letter from us"** 행이 이 화면을 `replay`로 연다(이때 "Get started" = 뒤로).
- 옛 손글씨 편지(선셋 띠 + 편지 시트 + 다람쥐 Ongi + "Share my first meal")는 앱에서 쓰지 않는다. 문구 키(`welcome.letter` 등)만 i18n 파일에 남아 있다.
