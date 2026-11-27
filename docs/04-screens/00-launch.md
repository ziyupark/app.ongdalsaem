# Screens 00 · Launch

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

> 표기: **[F]** 흐름(스택) 블록, **[A]** 고정/절대 위치 블록. "→ X" = 탭 시 X 화면으로 이동.

## 00 Launch — [섹션 197:6524](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=197-6524)

### 1.1 Splash — [14:2](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=14-2)
- 목적: 브랜드 첫인상, 세션 확인.
- 레이아웃: [A] 배경 Ellipse(390×390, y 215, Gradient/Sunset 큰 원 · 블러 — 옅은 선셋 빛) · [F] StatusBar · [F] **Logo(Lockup=Acorn)**: Acorn Symbol 36×46 → 워드마크 "ongdalsaem"(Wordmark, Gradient/Ink metal) → 태그라인 "A spring of daily food ideas"(Tagline fg/muted), 가운데 정렬 gap 10 — 로고 블록 790(StatusBar 아래, padding-bottom 65) 안에서 세로 가운데 · [A] Home Indicator.
- 동작: **1.2초 후 자동 이동**(프로토타입: AFTER_TIMEOUT 1.2s → 1.1b).
  - 처음 설치한 사용자 → **1.1b Welcome letter**
  - 편지를 이미 본 비로그인 사용자 → 1.2
  - 로그인 세션이 있으면 → 프로필 설정이 안 끝났으면 1.3, 아니면 2.7 Loading → 2.1

### 1.1b Welcome letter — [197:6526](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=197-6526)
- 목적: 로그인 전에 앱을 만든 마음을 편지 한 장으로 전한다. **최초 1회만** 표시한다(로컬 플래그 `welcomeLetterSeen`, 화면이 열릴 때 저장).
- 레이아웃(bg/default):
  1. **Sunset band**(위 160, Mood/clear 그라데이션) 위에 StatusBar(흰 글자) + 10
  2. **Letter sheet**(bg/subtle, 위 모서리 32, 남은 높이 채움, padding 위 10 · 좌우 32 · 아래 40, gap 15, 가운데 정렬, 작은 화면은 세로 스크롤):
     - Top(높이 36): 가운데 Grabber 36×5 border/strong
     - 16 → **Brand 3D / squirrel-acorn** 120×131(`assets/brand/squirrel-acorn-3d.png`)
     - 제목 Display/L 가운데 **"Some meals stay / with us for years."**
     - 편지(폭 364 — 시트 padding보다 양쪽 19 넓게, gap 13, 가운데 정렬): 본문 3문단 `Body/Letter`(Outfit 15/22, −0.05) fg/secondary — "We made ongdalsaem to hold on to the memories of meals shared with the people who make us happy." / "A warm table at home, a meal shared with a friend, even your first clumsy dish / each one holds a little piece of time." / "Share the meals that make you happiest." → 서명 Handwriting(Gaegu 20) fg/accent "— from the ongdalsaem kitchen"
     - 40 → **Continue**(bg/inverse 알약 56, 좌우 20, Title/M fg/inverse + `arrow-right` 22, gap 12, 시트 폭 채움) → 1.2
     - Caption fg/muted 가운데 "You’ll see this letter once · Read it again in Settings / › Help & policies"
- 문구 키: `welcome.title · letter(문단은 빈 줄로 나눔) · signature · cta · note`.
- 다시 보기: 9.8 Help & policies의 **"A letter from us"** 행이 이 화면을 `replay`로 연다(이때 Continue = 뒤로).
