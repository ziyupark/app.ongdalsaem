# Screens 05 · Timer

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 05 Timer — [섹션 59:2367](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2367)

### 5.1 Kitchen timer — [20:748](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-748)
- 블록: StatusBar → TopBar(Large) "Kitchen timer" → **Active timer 카드**: 링 가운데 라벨 "Simmer the stew"(Caption Strong), "12:08"(Numeric/Timer), "of 20:00 · done at 7:42 PM"(Caption), 원형 진행 링 **fg/accent(오렌지) — 실행 중**, 컨트롤 IconButton Soft L(`rotate-ccw` 리셋) · Solid L(`pause`/`play`) · Soft L(`plus` +1분) → 프리셋 칩: "Soft egg 6:30" · "Rice 15:00" · "Tea 3:00" → SectionHeader "Running" + action "+ Add timer" → Timer Card ×2: "Boil noodles 03:42", "Rest the dough 24:10" → TabBar(Timer, CreateFAB 포함 — 다른 탭과 같은 Home · Community · Timer · Profile 순서). TopBar `bell` → 2.8.
- 동작: 여러 타이머 동시 실행, 백그라운드 로컬 알림. 종료 시 5.2.

### 5.2 State · Timer finished — [76:3268](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3268)
- 노트: *Triple feedback: sound, haptic and a pinned banner. Banner deep-links back to the recipe step.*
- 색: 끝난 상태는 **세이지 그린(done) 토큰**으로 실행 중(오렌지)과 구분한다.
- 블록: TopBar 아래 **Done banner**(bg/done-subtle, 1px border/done, 왼쪽 `check` 아이콘 fg/done): "Stew is ready" / "Kimchi jjigae · step 3 of 3" + Button S "+1 min" → Active timer 카드: "Simmer the stew — done" / **"00:00"(fg/done)**, 링 **fg/done(가득 참)** / "Next: add tofu and scallion" / Button Secondary M "+1 min" + Primary M "Back to recipe" → 프리셋, Running 리스트 동일.
- 화면은 **세로 스크롤**(배너가 들어와 콘텐츠가 길어지므로 하단 Tab bar spacer 96).
- 이동: +1 min → 5.1(1분 추가) · Back to recipe / 배너 → 7.1(해당 단계의 Steps 위치로 스크롤).

---

### Kitchen timer란?
레시피 단계와 연결된 **요리용 타이머**. 7.1 상세의 Steps나 8.3c에서 단계에 시간을 붙여 두면 "Start 15:00"으로 바로 시작된다. 여러 개를 동시에 돌릴 수 있고(Running 목록), 자주 쓰는 시간은 프리셋 칩(Soft egg · Rice · Tea)으로 한 번에 시작. 앱을 나가도 로컬 알림(소리·진동)이 오고, 끝나면 5.2에서 "+1 min" 또는 "Back to recipe"(그 단계로 돌아감).

