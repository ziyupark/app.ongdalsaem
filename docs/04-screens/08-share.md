# Screens 08 · Share a dish

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 08 Share a dish — [섹션 59:2373](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2373)

2단계 + 미리보기 플로우(FAB `+`, 빈 끼니 슬롯, 3.2 CTA에서 진입). 각 단계 상단에 "Step n of 2" + 진행 표시.

섹션 배치(라벨 기준): **MAIN FLOW** 8.1(⇄ 8.1a Edit photo, Figma 없음) → 8.2 (또는 8.2e Travel) → 8.3 · **8.2 SUB-SCREENS**(폼 순서) 8.2d → 8.2b → 8.2a → 8.2c · **STATES** 8.4 · 8.4b(각 State note 아래).

### 8.1 Pick photos — [23:1201](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=23-1201)
- 스크롤. 상단 행: `x` 닫기(→ 2.1) · "Step 1 of 2" · "Next" → 제목 Display/M "Pick the photos / of your dish" → **선택된 사진 가로 줄**(순서 번호 1·2·3 배지, 첫 번째 = 커버) + Camera 타일 → "Recents" + "Up to 10 photos · first one is the cover" → 앨범 그리드 3열(선택 시 번호 배지) → [A] Button Primary L "Next · 3 photos"(선택 수 표시, 0장이면 Disabled).
- 이동: Next → 8.2. 드래그로 순서 변경.
- 선택된 사진(위 가로 줄)을 탭하면 시스템 메뉴: **Edit**(→ 8.1a) · Make cover · Move left / Move right · Remove · Cancel.

### 8.1a Edit photo — Figma 없음(앱 기본 컴포넌트로 구성)
8.1에서 선택한 사진 한 장을 고친다. 화면 이동 Fade, 스와이프 뒤로 가기 없음. iOS는 사진 앱 편집기를 다른 앱에 열어 주지 않아 앱 안에 직접 둔다.
- 상단 줄(높이 44, 좌우 20): **Cancel**(Body/M) · 제목 **"Edit photo"**(Title/S) · **Done**(Body/M Strong fg/accent, 저장 중 = 스피너).
- 가운데 무대(bg/subtle, 남은 높이 전부, 사진 둘레 여백 24): 사진을 비율 그대로 맞춰 보여 준다.
  - **Crop 탭**: 사진 전체 + 자르기 틀(흰 1px 테두리, 모서리 ㄱ자 22 · 두께 3, 틀 밖 overlay/scrim). 모서리 · 변을 끌면 크기, 안쪽을 끌면 위치(최소 64). 끄는 동안 3등분 선. 비율을 고정하면 모서리로만 크기를 바꾸고 모양을 지킨다.
  - **Adjust 탭**: 자른 결과만 보여 준다. 슬라이더를 움직이면 바로 바뀐다.
- `UnderlineTabs` **Crop · Adjust**(기본 Crop).
- 도구(위 16, 줄 간격 16, 아래 = Home Indicator 또는 20):
  - **Crop**: 비율 Chip 한 줄 — **Free**(기본) · **Original** · 1:1 · 4:5 · 16:9(고르면 사진 안 가장 큰 가운데 틀) → 버튼 줄 Outline S `rotate-ccw` **Rotate**(시계 반대 90°, 틀도 함께 돈다) · Outline S **Flip**(좌우 반전) · Ghost S **Reset**(자르기 · 회전 · 반전만 처음으로).
  - **Adjust**: 항목 Chip 한 줄 — **Brightness · Exposure · Contrast · Saturation · Warmth**(밝기 · 노출 · 대비 · 채도 · 따뜻함) → 고른 항목 이름(Body/S Strong) ··· 값(+25 / 0 · 0이 아니면 fg/accent) + Ghost S **Reset**(조정 5개 모두 0) → 슬라이더(−100 … 100, 가운데 0 눈금, 가운데에서 값까지 bg/primary로 채움, 손잡이 24). 0 근처(±4)는 0에 붙고 햅틱.
    - 노출 = 빛을 곱함(±1스톱) · 밝기 = 전체를 고르게 올림/내림 · 대비 = 중간 회색 기준으로 늘림/줄임 · 채도 = 같은 밝기의 회색 쪽/반대쪽 · 따뜻함 = 빨강↑ 파랑↓(또는 반대).
- **Done**: 바뀐 게 없으면 그냥 닫힘. 편집 결과(최대 2160px JPEG)로 그 자리의 사진을 바꾸고 8.1로 돌아간다(썸네일 · 커버 · 업로드 모두 편집본). 원본 사진첩은 그대로.
  - **다시 Edit을 열면 원본에서 지난 설정 그대로** 시작한다(편집을 겹쳐 쌓지 않음). 모두 처음으로 돌리고 Done → 원래 사진으로 돌아감.
  - 게시물 수정(editId)에서 올라가 있던 사진을 편집하면 새 사진으로 올라가고, 이전 사진은 저장할 때 저장소에서 지운다.
- **Cancel**: 바뀐 게 있으면 "Discard your edits?" — Keep editing · Discard. 없으면 바로 닫힘.
- 실패: 사진을 못 열면 "Couldn’t open this photo. Try again." 후 8.1, 저장 실패면 "Couldn’t save the edit. Try again."(화면 유지).
- 편집 화면은 Skia(네이티브)로 그린다 — 이 모듈이 없는 예전 빌드에서는 Edit을 누르면 "This needs the latest app build…" 안내만 뜬다.

### 8.2 Details — [23:1540](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=23-1540)
공유의 **두 번째이자 마지막 단계**. 날씨·기온·지역은 사진에서 자동으로 채우고, 사용자는 요리 이름 · Meal(미리 선택됨) · Mood만 정하면 바로 공유할 수 있다. 프레임 390×1366(세로 스크롤), Confirm 버튼은 아래 고정.
- 상단: `chevron-left`(→ 8.1) · "Step 2 of 2" · Step Progress 2칸 모두 채움 → 제목 "Tell us about it".
- form(좌우 20, 간격 16):
  1. **Auto context 카드**(bg/subtle, 1px border/default, radius 16, padding 12/12/12/14, gap 12): (303:403) **3D 날씨 이미지 53**(Weather 3D / 무드, 불러오는 중 = 스피너 · 날씨 없음 = `map-pin` 22, 같은 53 자리) → "Rainy 12° · Mapo, Seoul"(Body/M Strong) / **"Today 7:20 PM"**(Caption fg/muted, 시각만) → `chevron-right` 18. 탭 → 8.2d, 길게 누르면 날씨를 다시 찾는다.
     - **자동 채움 규칙**: 첫 사진의 촬영 시각·위치(EXIF) → 그 시각·장소의 날씨(상태·기온)와 동/구 단위 지역을 조회. EXIF가 없으면 현재 위치·시각. 위치 권한이 없으면 카드 문구 "Add where you ate it" → 8.3d에서 직접 고름.
     - 날씨 상태(Rainy 등)·기온 구간(Cool 등)은 사용자가 고르지 않는다(데이터 정확도). 장소를 바꾸면 그 장소 기준으로 다시 조회.
  2. **Type** "· changes what we ask next"(**Segmented control**, 단일 선택, 기본 Home-cooked): **Home-cooked** · **Eating Out** — Dish name 바로 위에 둔다(무엇을 물을지 먼저 정하도록).
     - Home-cooked(8.2): 설명 칸 = "What makes it special?", 아래에 Recipe 묶음.
     - **Eating Out**(→ **8.2e**, Figma 400:9707 · 저장 값 `travel`): 설명 칸이 **"Where did you eat it?"**로 바뀌고 Recipe 묶음을 숨긴다(밖에서 먹은 음식이라 레시피 없음). 전환은 Smart Animate 300ms. 이미 쓴 재료·단계는 숨겨 두었다가 Home-cooked로 돌아오면 다시 보인다(Travel로 게시하면 저장하지 않음).
  3. Input(Filled) **Dish name** "Kimchi jjigae for one"(필수).
  4. 텍스트영역 "What makes it special?" + 카운터 "74 / 150"(최대 150자).
  5. **Meal** "· required · pick all that fit"(**필수, 여러 개 선택**): 아이콘 칩 Breakfast · Lunch · **Dinner** · Snack · **Vegan**(`leaf`) · **Seafood**(`fish`) — 끼니(Breakfast–Snack)는 촬영 시각으로 하나를 미리 선택(05–10 Breakfast, 10–15 Lunch, 15–17 Snack, 17–22 Dinner, 그 외 Snack). Vegan · Seafood는 **식단 태그**로 끼니와 함께 고를 수 있다(예: Dinner + Vegan). 끼니가 하나 이상이어야 필수 충족. 화면 예: Dinner · Vegan 선택.
  6. **Mood** "· required · pick all that fit"(**필수, 여러 개 선택**, 미리 선택 없음): 아이콘 칩(줄바꿈 gap 6) — **Cozy**(`coffee`) · Calm(`leaf`) · Fresh(`sparkles`) · Energized(`zap`) · Comforting(`home`) · Nostalgic(`clock`) · Celebrating(`star`) · Lazy(`moon`) · Together(`users`) · Hearty(`soup`) · 내가 만든 칩(예: **"Rain-soaked"** `sparkles`) · 마지막 **"+ Add your own"** 칩(점선 border/focus, `plus` · 글자 fg/accent) → **8.2b**. 최대 3개(4번째를 누르면 "Pick up to 3 moods" 토스트). 화면 예: Cozy · Rain-soaked 선택.
     - 힌트(Caption fg/muted): "Press and hold one of your own tags to delete it."
     - **길게 누르기(500ms) → 삭제**: 내가 만든 칩에만 적용. 햅틱 + 칩이 흔들리며 `x` 배지 → 탭하면 삭제하고 Undo 토스트 "Mood removed · Undo"(4초). 기본 무드 칩은 길게 눌러도 반응 없음. 삭제하면 이 게시물과 최근 무드 기억(5개)에서 함께 지운다(이미 올린 다른 게시물의 태그는 남는다).
  6b. **Cooking method** "· optional"(**선택, 여러 개**, Home-cooked일 때만 · 코드 기준, Figma 없음 — Landscape 아래 · Recipe 위): 아이콘 칩 Grill(`flame`) · Stir-fry(`chef-hat`) · Pan-fry(`utensils`) · Simmer(`soup`) · Steam(`haze`) · Boil(`droplets`) · Quick & easy(`zap`). 미리 선택 없음, 다시 누르면 해제. 저장 = foods.cooking_methods, 수정 모드에서 그대로 채워진다. Home 대기질 카드가 이 값으로 메뉴를 고른다([§6.11](../05-behavior.md)).
  7. **Recipe** "· optional"(**선택**, Home-cooked일 때만): 박스(1px border/default, radius 16) ListRow(Value) **Ingredients & steps** "6 · 3 steps" › (→ 8.2a). 칼로리는 부가 정보라 8.2a 안에서만 입력하고 8.3에는 표시하지 않는다.
  8. **Sharing** "· off = only you, in your Diary"(제목 + 박스, 페이지 이동 없이 **스위치로 바로 설정**): ListRow(Switch) ×2, 기본값 = 설정(9.5)의 기본값
     - `globe` **Share publicly** — On = 모두(홈 · Community), Off = 나만(Diary에만 저장)
     - `message-circle` **Allow comments**
     - 위치 표시 범위는 게시물마다 묻지 않는다: 설정 9.5 **Shared precision**(Neighborhood · City only · Country only)을 그대로 따른다.
- [고정] Block · Button(bg/default, padding 12/20/0/20) Button Primary L **"Confirm"** + Home Indicator.
- **필수: Dish name · Meal(끼니 1개 이상) · Mood(1–3개)**(모두 채워져야 Confirm 활성). Type 기본 Home-cooked. 재료 · 조리 단계 · 칼로리 · 설명(Travel = 먹은 곳)은 선택, Sharing은 9.5 기본값. 이동: 뒤로 → 8.1 · Auto context → 8.2d · Mood "+ Add your own" → 8.2b · **Travel → 8.2e** · Ingredients & steps → 8.2a(MOVE_IN 300ms, Done → 8.2, 행 Value 갱신) · **Confirm → 8.3 Preview**. 사진 업로드는 8.1 다음부터 뒤에서 진행되고, 실패하면 8.4.

### 8.2a Recipe — [204:6723](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=204-6723)
- TopBar "Recipe". **재료와 조리 단계를 한 화면에서 세로 스크롤**로 쓴다 — 위에 적은 재료를 보면서 단계를 작성하도록. 순서: 안내 → 재료 표 → 단계 표(그룹 간격 24).
- 맨 위 안내 묶음(gap 11): Body/S secondary **"Ingredients first, then steps. Amounts are optional."**(1줄) + Caption fg/muted "Drag ⋮⋮ to reorder · tap a row to edit · × to remove"(두 표 공통 안내 — 표 아래 캡션은 두지 않는다).
- **6 INGREDIENTS 표**(2열, bg/subtle, 1px border/default, radius 16, clip):
  - 머리줄(높이 34, bg/muted): 손잡이 자리 16 · **INGREDIENT**(FILL) · **AMOUNT**(폭 104) · × 자리 18 — Overline fg/muted.
  - 재료 줄 ×6(높이 48, padding 0/14/0/12, gap 10, 아래 1px border/default): `grip-vertical` 16 드래그(2×3 점, fg/muted) · 이름 Body/M(FILL) · 양 Body/M Strong(폭 104) · `x` 18 삭제(fg/muted).
    - Sour kimchi 1 cup · Pork belly 100 g · Tofu ½ block · Gochugaru 1 tbsp · Scallion 1 stalk · Anchovy stock 400 ml
    - 줄을 탭하면 그 자리에서 두 칸이 입력칸으로 바뀌어 고친다.
  - **추가 줄**(표 맨 아래, 높이 60, bg/default): `plus` 16(fg/accent) · 이름 입력칸(FILL, 높이 40, radius 12, bg/subtle, 포커스 1.5px border/focus) "Garlic" · 양 입력칸(폭 104, border/default, placeholder "2 cloves") · `check` 18(fg/accent) 추가. Return / check → 표에 추가하고 다음 추가 줄로 포커스.
- **자동완성**(화면에 따로 그리지 않음): 추가 줄 이름 칸에 2글자 이상 입력하면 입력칸 아래 목록에 최대 5개 제안(내가 쓴 재료 → 인기 재료 순). 탭하면 이름이 채워지고 양 칸으로 포커스. 추천 칩 묶음은 두지 않는다.
- **3 STEPS 표**(2열, 재료 표와 같은 규격):
  - 머리줄(높이 34, bg/muted, padding 0/14/0/12, gap 10): 손잡이 자리 16 · **#**(폭 24) · **STEP**(FILL) · × 자리 18 — Overline fg/muted.
  - 단계 줄 ×3(높이 = 내용, padding 14/14/14/12, gap 10, 위 정렬, 아래 1px border/default): `grip-vertical` 16 드래그(2×3 점, fg/muted) · 번호 원 24(bg/inverse, Caption Strong fg/inverse) · 본문 Body/M(FILL, 여러 줄) · `x` 18 삭제(fg/muted, 1.5).
    - 1 "Sauté the kimchi and pork together for 5 minutes, until the edges caramelize."
    - 2 "Pour in the stock and gochugaru. Simmer gently." + 타이머 알약(본문 아래 gap 6, bg/accent-subtle, radius full, `timer` 14 + Caption Strong "15:00" fg/accent). 탭 → 8.3c에서 수정/삭제.
    - 3 "Add tofu and scallion. One more boil, then straight to the table."
    - 줄을 탭하면 그 자리에서 본문이 입력칸으로 바뀌어 고친다.
  - **추가 줄**(표 맨 아래, bg/default): `plus` 16(fg/accent) · 번호 원 24 "4"(bg/muted, fg/default) · 입력칸(FILL, radius 12, bg/subtle, 포커스 1.5px border/focus, 여러 줄) "Rest for 2 minutes before serving." 아래 텍스트 버튼 `timer` **"Add timer"**(Caption Strong fg/accent → **8.2c**) · `check` 18(fg/accent) 추가. Return / check → 표에 추가하고 다음 추가 줄로 포커스.
- 단계에 붙는 것은 **타이머 하나뿐**(사진 · 팁 없음). 타이머는 7.1 Steps의 "Start mm:ss timer" 버튼과 5.1 Kitchen timer로 이어진다.
- **Calories group**(단계 표 아래, 그룹 간격 24, 별도 Overline 없음): **Calorie Field**(State=Filled) "Calories (total)" "· optional (a rough estimate)" "420 kcal"(숫자 키패드). 총 칼로리만 받는다. 비우면 게시물에 칼로리를 표시하지 않는다. 재료를 보며 칼로리를 가늠할 수 있게 이 화면에 둔다.
- CTA(하단 고정) **"Done · 6 ingredients · 3 steps"**(개수 실시간) → 8.2. 추가 줄에 쓰다 만 글이 있으면 Done 때 함께 추가한다. 8.3에서 열 때 맨 위(재료)부터 보인다.

### 8.2b Add your mood — [327:7249](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=327-7249)
- 8.2 Mood의 "+ Add your own" 칩에서 연다(Dissolve 200ms). 8.2 위에 **딤(overlay/scrim-strong) + 가운데 팝업**. 뒤 화면은 **Mood 칩 줄이 팝업 위쪽(y 122–357)에 보이도록** 스크롤된 상태(딤 아래로 비침).
- 팝업(Dialog 342, x 24, Mood 줄 바로 아래 y 381, 높이 371, radius 24, bg/subtle, padding 24 20 20, gap 18, Elevation):
  1. Head(가로 gap 12): 40 원 bg/accent-subtle + `sparkles` 20 fg/accent · ["Add your own mood"(Title/M) / "A word or two, your way. It becomes a mood tag on this dish."(Body/S secondary)]
  2. 입력칸 302×52(radius 16, bg/default, 1.5 border/focus): "Rain-soaked" + 커서(fg/accent) ··· "11 / 20"(Caption muted). 최대 20자, 열리면 키보드.
  3. Try(Caption Strong muted) + 제안 칩 Homesick · Post-run — 탭하면 입력칸에 채움(내가 전에 쓴 무드 · 인기 무드).
  4. 미리보기 줄(bg/default, radius 16): "On your dish" ··· Selected 칩 `sparkles` + 입력 글자(실시간).
  5. 버튼 줄(gap 8, 각 FILL): Outline M "Cancel" · Primary M "Add mood"(빈 값이면 Disabled).
- Add mood → 팝업 닫힘, Mood 칩 줄의 "+ Add your own" 앞에 새 칩(`sparkles` + 입력 글자)이 **선택된 상태**로 추가(Mood는 여러 개 선택이라 다른 칩 선택은 그대로, 이미 3개면 가장 먼저 고른 것이 풀림). Cancel · 딤 탭 → 닫힘. 빈 값이면 Add mood Disabled.
- 직접 쓴 무드는 내 기기에 최근 5개까지 기억해 다음 공유 때 칩으로 다시 보여 준다.

### 8.2c Set timer — [346:7187](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=346-7187)
- 8.2a 단계 표의 "Add timer" 또는 타이머 알약("15:00")을 누르면 아래에서 올라오는 **바텀 시트**(MOVE_IN 300ms). 뒤 화면은 딤(overlay/scrim), 단계 표가 보이게 스크롤된 상태.
- 시트(bg/subtle, 위 모서리 28, padding 10 20 34, gap 20, 높이 416, **화면 아래에 붙음** — y 428–844, Home Indicator와 겹치지 않게 아래 padding 34). 분·초 칸을 탭하면 숫자 키패드가 올라오고 시트가 키패드 위로 함께 올라간다(화면에는 키패드를 그리지 않음).
- 뒤 화면: 현재 8.3a를 그대로(단계 표의 추가 줄이 시트 바로 위 16에 보이도록 스크롤된 상태).
  1. 그래버 36×5(border/default)
  2. Overline "STEP 4 · TIMER"(fg/accent) → 단계 본문 "Rest for 2 minutes before serving."(Title/M)
  3. **직접 입력**: 분 칸 · `:` · 초 칸(각 120×72, radius 16, bg/default, 값 Display/M, 아래 단위 "min" / "sec" Caption). 열리자마자 분 칸에 포커스(1.5 border/focus + 커서)와 **숫자 키패드**. 분 2자리를 치면 초 칸으로 넘어간다. 분 0–180, 초 0–59(60 이상은 분으로 올림).
     - 힌트(1줄) "Tap a box and type — the number pad opens."
  4. QUICK PICK 칩 **한 줄 가로 스크롤**: 1 min · **2 min**(Selected) · 5 min · 10 min · 15 min — 누르면 두 칸이 그 값으로 채워진다.
  5. 버튼 줄: Ghost L **"No timer"**(타이머 없애기, 처음 추가할 때는 그냥 닫기) · Primary L(FILL) **"Set 2:00 timer"**(값 실시간).
- Set → 시트 닫힘, 그 단계 본문 아래 타이머 알약 "2:00"이 생긴다. 딤 탭 · 아래로 스와이프 → 변경 없이 닫힘.
- 저장된 타이머는 7.1 Steps의 "Start 2:00 timer" 버튼과 5.1 Kitchen timer 프리셋으로 이어진다.

### 8.2d Edit place — [204:7131](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=204-7131)
- 8.2 Auto context 카드에서 연다. TopBar "Place".
- **필요한 이유**(검토 결과 유지): 날씨는 장소로 정해지므로 장소가 틀리면 게시물의 날씨 데이터가 틀린다. ① 사진에 위치 정보가 없을 때(스크린샷·받은 사진·카메라 위치 끔) ② 위치 권한을 주지 않았을 때 ③ 먹은 곳과 올리는 곳이 다를 때 — 이 세 경우를 고치는 유일한 경로. 평소에는 열 일이 없는 보조 화면.
- Search Field(Clear=Yes) "Mapo" → ListRow(Value) "Use current location" **Mapo, Seoul**(`navigation`)
- RESULTS 박스: City Row — **Mapo, Seoul** 12°(Selected) · Mapo-dong, Seoul 12° · Mapo-ri, Gimpo 11° (국가 · 현재 기온, 아이콘 `cloud-rain` = 그곳 날씨)
  - 캡션: "Only your neighborhood is shown on the dish — never your exact address."
- CTA "Use Mapo, Seoul"(선택한 지역 이름) → 8.2(카드의 지역과 날씨를 이 장소 기준으로 다시 채움).
- 동/구 단위까지만 저장한다(9.5 위치 정책과 같음).

### 8.2e Details · Travel — [401:9231](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=401-9231)
- 8.3과 같은 화면에서 Type = **Travel**을 고른 상태(프레임 390×1261). 레이어 이름이 8.3과 같아 Smart Animate로 전환된다.
- 설명 칸 라벨 **"Where did you eat it?"**, 예시 "Mangwon Market, the third stall from the gate — cash only, worth the queue." · 카운터 "75 / 150". 장소·분위기를 자유롭게 쓴다(지도 위치는 9.5 Shared precision을 따름 — 이 글은 지도에 쓰지 않음). Dish name 예시 "Kalguksu at the market".
- Recipe 묶음 숨김(재료·단계·칼로리를 받지 않음).
- 게시물(7.1)에서는 캡션 자리에 이 글이 보이고, Ingredients · Steps · Calories 영역과 "Cook along" 버튼이 없다.
- 이동: Home-cooked → 8.2 (Smart Animate) · 나머지는 8.3과 같음.

**8.2 하위 화면 공통 골격**(08 섹션 둘째 줄, 폼 순서대로: 8.2d Edit place · 8.2b Add your mood · 8.2a Recipe · 8.2c Set timer)
- StatusBar → TopBar(Inline, 뒤로 → 8.2) → content(좌우 20, 그룹 간격 24, 세로 스크롤)
- **하단 고정 CTA**: Block · Button(bg/default, 위 1px border/default, padding 16 20 12) + Button Primary L. 아래에 Home Indicator 띠(bg/default 34). 고정 레이어 3개(Bottom band · Block · Button · Home Indicator).
- content 끝에 CTA 높이만큼 CTA spacer를 둔다.
- 그룹 패턴은 09 Settings와 같다(Overline 제목 → bg/subtle 박스 → Caption).

### 8.3 Preview — [309:7358](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=309-7358)
공유 직전 **미리보기**. 내가 쓴 내용을 실제 게시물(7.1 Post detail)과 **같은 레이아웃**으로 보여 준다(7.1을 복제해 내 데이터로 채움). 프레임 390×1548, 세로 스크롤.
- [고정] Top bar: **7.1과 같은 규격**(StatusBar + Row 350×40, y 56) — 왼쪽 IconButton Glass M `chevron-left`(뒤로 → 8.2, 고치기, 다른 화면과 같은 BACK) · 가운데 pill "Preview · not shared yet"(높이 40 = 버튼과 같은 높이, glass/surface + Surface/Glass 효과, Caption Strong fg/default) · 오른쪽 빈칸 40(가운데 정렬 유지).
- Hero: 내 첫 사진(같은 사진) · Counter "1 / 4" · 제목 "Kimchi jjigae for one" · Weather Tag(자동 `cloud-rain` 12°) · Acorn Tag 0(Default 라인).
- Sheet: Feed Post(Media 숨김) — 작성자 **jiyu.cooks**(내 사진) / "Mapo, Seoul · Just now", 도토리 0 · 댓글 0, Caption = 8.2 설명, Tags → 태그 칩 Rainy · Cool · Cozy · Dinner(자동 날씨·기온 + 내가 고른 Mood · Meal) → Ingredients List → Steps → Details(COOK · PER SERVING · SERVING).
  - 입력하지 않은 선택 항목(재료 · 단계 · 칼로리)은 해당 섹션을 숨긴다.
  - 공유 전이라 근처 식당 · More from 섹션은 없다.
- [고정] Action bar: Button Primary L **"Share to ongdalsaem"**(FILL) → 업로드 완료 후 2.1(해당 끼니 슬롯에 내 요리 + Toast "Shared to your table").
- 이동: 뒤로 → 8.2 · Share to ongdalsaem → 2.1.

### 8.4 State · Upload failed — [76:3797](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3797)
- 노트: *Inline retry on the failed thumbnail. Tags and text are kept — nothing to retype.*
- **8.3과 같은 form**(Auto context · Dish name · 설명 · Meal · Mood · Type · Recipe · Sharing 스위치, 프레임 390×1500) + 맨 위 `Inline Banner`(Tone=Warning, `alert-circle`) "1 photo didn’t upload — tap to retry. Your notes are saved." 실패 썸네일에 `rotate-ccw`. 하단 버튼 "Confirm" **Disabled**(재시도 성공 시 활성, Disabled 상태에서는 링크 없음).
- 이동: 배너 탭 → 재업로드 시도 후 8.2(성공 시 Confirm 활성) · **실패 썸네일 탭 → 8.4b**(바로 8.1로 가지 않는다 — 작성한 태그·메모와 나머지 사진을 잃지 않게).

### 8.4b State · Photo options — [207:7065](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=207-7065)
- 실패 썸네일을 눌렀을 때 뜨는 하단 시트. 배경 = 8.5와 같은 form(배너 포함, Confirm Disabled) + 딤(overlay/scrim), 시트 = bg/default, 상단 radius xl, Elevation/Sheet, 상단 그랩바.
- 시트 내용: 실패한 사진 미리보기 + 제목 "This photo didn’t upload" → ListRow 3개 + Cancel.
  - `rotate-ccw` **Try uploading again** → 재업로드, 8.3으로 복귀(성공 시 Confirm 활성).
  - `image` **Replace with another photo** → 8.1 Pick photos(교체 모드: 1장만 선택, 선택 후 같은 자리에 들어가고 8.3으로 복귀).
  - `trash` **Remove this photo**(Tone=Destructive) → 사진 제거 후 8.2. 남은 사진이 0장이면 Confirm 비활성.
  - **Cancel** / 딤 탭 → 8.4.
- 규칙: 어떤 선택이든 Dish name·태그·메모 등 입력 내용은 유지한다.

---
