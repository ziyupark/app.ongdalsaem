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
  - 로그인 세션이 있으면 → 2.7 Loading → 2.1

### 1.1b Welcome letter — [197:6526](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=197-6526)
- 목적: 처음 들어온 사용자에게 옹달샘을 만든 이유를 **손글씨 편지**로 전한다. **최초 1회만** 표시한다(로컬 플래그 `welcomeLetterSeen`).
- 레이아웃(**스크롤 없음, 390×844**): **위는 선셋 띠, 아래는 편지 시트**
  1. [A] **Sunset band** 390×160, Gradient/Sunset linear
  2. StatusBar(Tone=**Light**, 띠 위) + 아래 여백 10
  3. **Letter sheet**(y 64–844, bg/subtle, 위 모서리 32(radius/2xl), padding 10 32 40, 가운데 정렬):
     - Top(36): 그래버 36×5(border/strong, 가운데) · 오른쪽 Button Ghost S **"Skip"**(시트 안쪽 끝) → 1.2
     - 16 → **다람쥐 Ongi 일러스트**(119×119, `clear` — 투명 PNG `assets/ongi/ongi_clear.png`)
     - 0 → Display/M(Fraunces, 가운데) **"Some meals stay with us for years."**(2줄)
     - 16 → 편지 Body/M fg/secondary 가운데(아래 본문)
     - 14 → 서명 Gaegu Bold 20 fg/accent "— from the ongdalsaem kitchen"
     - 16 → Ornament: 선 56 · `acorn` 16 · 선 56
     - (남는 공간) → **CTA card**(FILL, bg/inverse, radius 24(radius/xl), padding 20 · 왼쪽 22, gap 12): Title/M **"Share my first meal"**(fg/inverse) ··· `arrow-right` 22(fg/inverse) → 1.2
     - 10 → Caption fg/muted 가운데 "You’ll see this letter once · Read it again in Settings / › Help & policies"(2줄) → 32 → 시트 끝(padding-bottom 40)
  4. [A] Home Indicator
- 편지 본문(English):

  ```
  We made ongdalsaem to remember the meals we shared
  with the people who made us happy.

  A warm table at home, a bowl across from a friend,
  even your first clumsy dish — each one holds a little time.

  Share your happiest meal here.
  ```
- 한국어판(ko): "행복했던 사람들과 나눈 한 끼를 오래 기억하려고 옹달샘을 만들었어요. / 집의 따뜻한 밥상, 친구와 마주한 한 그릇, 서툰 첫 요리까지 — 한 끼마다 작은 시간이 담겨 있어요. / 당신의 행복한 한 끼를 여기에 나눠 주세요." (i18n `welcome.letter`)
- 디자인 출처: 외부 레퍼런스(그라데이션 띠 + 시트 + 가운데 정렬 글 + 어두운 CTA 카드)의 **구성 아이디어만** 참고했다. 일러스트(다람쥐 Ongi)·장식(도토리)·문장·서체(Fraunces · Outfit · Gaegu)·색(브랜드 토큰)은 모두 ongdalsaem 고유 요소로 새로 만들었다.
- 모션: 진입 시 시트가 아래 24px에서 올라오며 페이드(400ms, 1회).
- 플래그 `welcomeLetterSeen`은 이 화면이 열릴 때 기기에 저장한다(Skip · CTA 어느 쪽이든 다시 보이지 않음).
- 9.8 Help & policies에 "A letter from us" 항목을 추가해 다시 볼 수 있게 한다(구현 시).
