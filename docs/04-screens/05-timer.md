# Screens 05 · Timer

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 05 Timer — [섹션 59:2367](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2367)

### 5.1 Kitchen timer — [20:748](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-748) · 코드 기준
- 블록:
  1. **ScreenWash + ScreenHeader**(네 탭 공통 — 로고 · 오른쪽 빈 자리(벨 없음) · 날짜·위치 · 날씨 제목)
  2. **Reset all**([1094:23665](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1094-23665), 타이머가 하나라도 있을 때만): 헤더 제목 바로 아래, 왼쪽 정렬(좌우 20). 반투명 흰 알약(glass/fill — Figma 흰색 10 %) + 0.8 테두리(glass/stroke-strong — Figma 흰색 46 %), radius full, padding 2 9, Title/S fg/secondary "Reset all". 누르면 확인 창 "Reset all timers?"(Cancel / Reset all) → 모든 타이머를 처음 시간으로 되돌리고 멈춤(각 타이머의 Reset과 같음).
  3. **Active timer**(가운데 정렬, 위 **22**): **큰 링** 220, 선 두께 **19**(12.65 × 1.5, 도넛 안쪽 반지름 0.8275)(진행 = Gradient/Dusk, 끝나면 fg/success 가득) — 가운데 시간 Numeric/Timer(Fraunces SemiBold 52/58). → 28 → **음식 이름 박스**([1089:23399](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1089-23399)): 반투명 흰 알약(glass/fill), radius full, padding 6 22, **폭 150–322**, Display/Quote fg/default, 따옴표 없음, 1줄. 이름이 박스보다 길면 **왼쪽으로 흐른다**(끝 뒤 40 간격으로 이어 붙여 반복, 초당 32pt, 매 바퀴 시작에서 1.2초 멈춤 · Reduce Motion = …로 자름). **이름이 있을 때만**(Add Timer에서 입력 · 레시피 단계의 **단계 내용** · 프리셋 이름) — 이름 없는 타이머(예: 기본 라벨 "Timer")는 박스 없이 링만(5.1-1).
     - **링 손잡이**(코드 기준): 남은 시간 호의 움직이는 끝에 흰 점(선 두께 × 0.55) + Gradient/Dusk 빛 번짐 + 중심 쪽 가는 바늘(1.5 폭, 선 두께 × 1.1 길이). 매 프레임 카운트다운을 따라가고, 링을 끌 때는 손가락을 따라간다. 시간이 0이거나 끝나면 숨김. **마지막 10초**는 숫자가 바뀔 때마다 빛이 커졌다 작아진다(Reduce Motion이면 없음).
  4. **컨트롤**(28 아래 · 48 버튼 3개 간격 28): RoundBtn `rotate-ccw` Reset · 가운데 Primary `pause`/`play`(끝났으면 `check` — 레시피 단계 타이머면 "Back to recipe" → 그 요리 7.1, 아니면 "Done" = 타이머 삭제) · `plus` + **"15s" 칩**([1094:23662](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1094-23662) — bg/emphasis, radius full, padding 2.2 6, Tagline fg/default, + 버튼 오른쪽 위에서 위 −1 · 오른쪽 −11) = **15초 추가**(끝난 타이머는 다시 시작).
  5. **Add Timer** 버튼(Timer Button · Size=Bar 676:22600 — 350×52, bg/subtle + 1px border/default, radius full, Elevation/1 Low, `timer` 24 + Button/M fg/default) → 5.1b.
  6. **프리셋 칩**(가로 스크롤, `clock` 아이콘) **8개**: Soft egg 7 min · Hard egg 10 min · Ramen 4 min 30 s · Cup noodles 3 min · Pasta 9 min · Dumplings 8 min · Tea 3 min · Coffee 4 min. 탭 → 그 이름(음식 이름 = 프리셋 이름)으로 바로 시작, 큰 링으로.
  7. **Running**(Title/L): 큰 링에 없는 타이머 카드 목록. **끝난 타이머가 맨 위**. 카드 = 작은 링 52(선 9) · 이름 Body/S Strong fg/muted("음식 · 라벨") + 시간 Numeric/L · 오른쪽 원 버튼(bg/inverse: 일시정지 / 계속 / 끝났으면 `plus` = +1분). **끝난 카드**: 테두리 fg/done, 이름 옆 **Done** 배지(bg/success-subtle, fg/done), 시간 자리에 "Done". 카드 탭 → 큰 링으로, 길게 누름 → 삭제 확인("Remove “{label}”?"). 다른 타이머가 없으면 빈 자리 카드(점선 `+` 모양, 누를 수 없음). 타이머가 있으면 아래 Caption "Press and hold a timer to remove it."
  8. TabBar(Timer, CreateFAB) — 아래 여백 96 + 24.
- **첫 화면(타이머 없음, 5.1-1 [1094:23513](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1094-23513))**: Reset all 없음 · 빈 트랙만(진행 호 · 손잡이 없음) + "00:00" · 음식 이름 박스 없음 · 컨트롤 3개(`rotate-ccw` · `play` · `plus` + 15s)는 **보이지만 눌리지 않는다**. 타이머는 **Add Timer 버튼**(또는 프리셋 칩 · 레시피 "Start timer")으로만 추가된다. Running = 점선 빈 카드, 안내 문구 없음.
- **큰 링 고르기**: 방금 시작한 타이머(Add Timer · 프리셋 · 레시피 단계 "Start timer" — 화면을 열기 10초 안에 시작한 것 포함)가 항상 큰 링으로 온다 → 그다음 사용자가 탭한 것 → 끝난 것 → 가장 빨리 끝나는 것.
- **링 드래그로 시간 바꾸기**: 큰 링을 **0.35초 누르고 있다가** 링을 따라 돌리면 남은 시간이 바뀐다(5초 단위, 최대 24시간, 반시계 = 늘림). 시작할 때 진동(중간), 단계마다 선택 햅틱. 드래그 중엔 스크롤이 멈춘다. 놓으면 그 시간으로(실행 중이었으면 계속 실행).
- 링은 프레임마다 부드럽게 줄어들고, 숫자는 초 경계에 맞춰 바뀐다.

### 5.1_0 Kitchen timer · 레시피 단계에서 — [1219:18053](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1219-18053)
- 7.1 레시피 단계의 **Start timer** → 타이머를 시작하고 **게시물 위에 5.1을 푸시**(`/cook-timer`). 탭을 바꾸지 않는다.
- 5.1과 같은 화면, 차이: 맨 위 로고 줄 대신 **TopBar Type=timer**(높이 52, 좌우 12: `chevron-left` 22 뒤로 · 가운데 Compact 로고 · 빈 40). 음식 이름 박스 = **그 단계 내용**(길면 왼쪽으로 흐름). Mood wash는 화면 안에 그린다(날씨 모션 없음).
- 뒤로 → **타이머를 누른 게시물로, 보던 스크롤 위치 그대로**. 끝난 타이머의 `check`(Back to recipe)도 뒤로와 같다. TabBar의 다른 탭 → 그 탭으로(게시물은 닫힘).

### 5.1b Add timer — [669:11033](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=669-11033)
- **가운데 대화상자**(8.2c Set timer와 같은 카드: 딤 + bg/default 카드, radius xl, 최대 폭 360): Overline fg/accent "NEW TIMER" → Input "Food Name"(placeholder "food name...", 40자) → 분 : 초 칸 → 힌트 → QUICK PICK 칩 1 · 2 · 5 · 10 · 15 min → Button **"Set m:ss timer"**(0이면 비활성). 최대 99:59. "No timer" 버튼 없음.
- 설정하면 라벨 "Timer"로 시작하고 큰 링으로.

### 5.2 State · Timer finished — [76:3268](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3268) · 코드 기준
- 색: 끝난 상태는 초록으로 실행 중(오렌지)과 구분한다 — 큰 링 · 00:00 = **fg/success**, Running 카드 · Done 배지 = **세이지 그린(done) 토큰**.
- 끝나면: 큰 링 = **fg/success** 가득 + "00:00"(fg/success) → 25 → Overline fg/muted **"DONE"**(시간 아래), 손잡이 없음. 음식 이름 박스는 그대로. 가운데 버튼이 `check`(Back to recipe / Done). Running 카드는 위 7번의 끝난 모양(fg/done 세이지)으로 맨 위로.
- **알림**: 휴대폰이 **3번 진동**(Success, 0 · 0.4 · 0.8초). 앱이 열려 있으면 시스템 배너 대신 **앱 안 토스트 "{label} — done"**(어느 화면에서든, 하나씩 차례로; 탭하면 그 타이머를 5.1 큰 링으로) — 소리만 시스템 알림으로 난다. 앱이 닫혀 있으면 로컬 알림(제목 "{음식} · {라벨}", 레시피 단계면 본문 "{요리} · n/m", 소리, iOS **Time Sensitive**).
- 상단 Done banner · "Next: …" 줄 · "+1 min" 버튼은 없다(Running 카드의 `plus`가 +1분).

---

### Kitchen timer란?
레시피 단계와 연결된 **요리용 타이머**. 7.1 상세의 Steps나 8.2c에서 단계에 시간을 붙여 두면 "Start timer"로 바로 시작된다. 여러 개를 동시에 돌릴 수 있고(Running 목록), 자주 쓰는 시간은 프리셋 칩 8개로 한 번에 시작. 타이머는 기기에만 저장된다. 앱을 나가도 로컬 알림(소리·진동)이 오고, 끝나면 "Back to recipe"(그 요리로) 또는 +1분.
