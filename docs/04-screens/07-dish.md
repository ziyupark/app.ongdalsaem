# Screens 07 · Dish

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 07 Dish — [섹션 59:2371](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2371)

### 7.1 Post detail — [20:1380](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-1380)
사람들이 올린 게시물의 **유일한 상세 화면**. 홈 피드 게시물·Story Card·Food Card·Country Card·Dish Tile 등 모든 요리 카드가 여기로 온다(목업 데이터 = 홈 피드의 Minji 김치찌개 게시물, 구현 시 게시물 id로 내용만 바뀜). 피드 게시물을 누르면 **같은 사진·같은 태그 위치·같은 헤더·같은 캡션**이 그대로 이어지도록 Feed Post 컴포넌트를 재사용한다.
- **배경 = 내 현재 날씨**(코드 기준): 탭과 같은 Mood wash(높이 420, 85 %) + **날씨 모션**(WeatherMoodLayer)을 이 화면 안에 그린다(푸시 화면은 투명할 수 없어 전역 WeatherBackdrop 대신 자기 wash). 스크롤하면 내용과 함께 올라가며 300pt까지 사라진다. 뒤로 · 작성자 줄 글자색 = wash 잉크(8 % · 20 % 지점). 화면이 가려지거나 앱이 백그라운드면 모션 멈춤, 날씨 값이 없으면(2.6) wash만, 위치 꺼짐 + 도시 없음이면 wash 없음. 게시물의 날씨는 사진 위 Weather Tag로만 보인다.
- **댓글은 이 화면에 펼치지 않는다** — 댓글 아이콘을 누르면 7.2 시트로만 본다.
- **골격**: 프레임 390×2030(내용 전체 길이) — 기기 화면 390×844에서 세로 스크롤(overflow Vertical). Top bar는 위, Action bar·Home Indicator는 **아래에 고정**(constraint Bottom). 레이어 순서 = Hero(absolute, 함께 스크롤) → Hero spacer 528 → Sheet → [고정] Top bar · Action bar · Home Indicator(numberOfFixedChildren 3). TabBar·FAB 없음(푸시 화면).
- **Hero**(390×560, clip):
  - 사진 `photo:kimchi1`(피드와 같은 사진) + 하단 Photo scrim + 상단 scrim.
  - Counter "1 / 3": 오른쪽 위(오른쪽 16, y 112), overlay/scrim-strong 55%, radius full, 패딩 4/9, Caption Strong fg/on-photo — Feed Post Counter와 같은 규격. 사진 좌우 스와이프로 장 넘김.
  - 제목 블록(x 24, 아래 끝 y 471): Display/XL "Kimchi jjigae / for one"(fg/on-photo). 날씨·끼니 Overline은 두지 않는다(사진 위 Weather Tag와 Dish 태그 칩이 같은 정보를 보여 줌).
  - **Weather Tag**(좌하단, `cloud-rain` 12°) · **Acorn Tag**(우하단, 95) — 둘 다 **Size=XL(높이 28)**, 우상단 Photo Counter도 **Size=XL**(45×28), 인셋 16, 시트 시작선(y 528) 16 위(y 484).
- **[고정] Top bar**: StatusBar(Light) + 행(x 20, y 56, 양끝 정렬): IconButton Glass M `chevron-left`(뒤로) · IconButton Glass M `more-horizontal`(→ 7.3).
- **Sheet**(bg/default, 상단 radius 32, 위 패딩 12, Hero를 32px 덮음):
  1. `Feed Post` 인스턴스([1219:18732](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1219-18732), 홈 피드와 같은 규격) — Header(padding 12 21 · gap 10: Avatar **40** · 이름 Body/M Strong / 위치·시간 **Caption** fg/muted · `more-horizontal` 24 fg/default) → **Media 350×402**(좌우 20, radius 32, Weather Tag 왼쪽 위 18 · 18, Photo Counter **왼쪽 아래** 18 · 16) → Actions(padding 12 **38** 8, 간격 18) → 24 → Meta. Header "minji.cooks" / "Mapo, Seoul · 40m" → Actions(`acorn` 95 · `message-circle` 18 · `share` · `bookmark`) → **Meta**(601:12639: 제목 Display/L → 13 → 캡션 **Body/M fg/default**, 둘 다 좌우 20) — Caption 전문(줄 수 제한 없음) "Old kimchi from my mom’s fridge — the sourer, the better on a rainy night." → "40 minutes ago". **이 Caption이 게시물 본문(상세 설명)이다.**
  2. **Dish**(좌우 20, 간격 16): **태그 칩 = 게시물 값 그대로**(Weather · Temperature는 자동, Mood · Meal은 8.3에서 작성자가 고른 값), Chip(Default, **Icon=Yes**, 아이콘 18 fg/default stroke 1.5, 줄바꿈 gap 8): `cloud-rain` Rainy · `thermometer-snowflake` Cool · `heart` Cozy · `cooking-pot` Dinner (Weather · Temperature · Mood · Meal 순).
  3. Divider(border/default 1px, 위아래 28).
  4. **Ingredients** = `Ingredients List`(제목 → 재료 줄 gap 0, 줄 높이 39) ×6: Sour kimchi 1 cup · Pork belly 100 g · Tofu ½ block · Gochugaru 1 tbsp · Scallion 1 stalk · Anchovy stock 400 ml.
  5. **Steps**(Title/L) → `Recipe Step` ×3: 1 "Sauté the kimchi and pork together for 5 minutes, until the edges caramelize." 2 "Pour in the stock and gochugaru. Simmer gently." + **Timer=Yes "Start 15:00 timer"** 3 "Add tofu and scallion. One more boil, then straight to the table." 단계 안의 시간 표현을 파싱해 타이머 버튼을 자동 생성.
  6. **Details**(Steps 아래 보조 정보): 좌우 20, 위아래 1px border/default 사이 한 줄(padding 14/0, 세로 가운데): 왼쪽 Overline "CALORIES · TOTAL"(fg/muted) + Body/M Strong **"≈ 420 kcal"** · 오른쪽 Caption fg/muted "Estimated by the cook · may not be exact". 칼로리를 입력하지 않은 게시물은 이 줄을 숨긴다.
  7. **More from Minji**([601:13045](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=601-13045), 위아래 20 · 간격 12): `SectionHeader`(eyebrow 숨김, Title/L + 오른쪽 `chevron-right` 20 fg/muted = See all, 접근성 "See all") → **Dish Tile 02**(폭 131, 사진 163) 가로 스크롤 ×4(좌우 20, 간격 8). "I made this" 버튼은 없다("I ate this"와 겹침). 태그 값: `cloud` 13° · 61 / `cloud-rain` 9° · 48 / `sun` 18° · 35 / `cloud-drizzle` 11° · 27 (7.1b · 7.4–7.6b 동일).
  8. Bottom spacer 140. 섹션 간격 32.
- Sheet(390 폭, 위 y 528) 안의 More from Minji 줄은 폭 390 고정 + 가로 스크롤(줄이 시트를 넓히지 않음).
- **[고정] Action bar**(화면 맨 아래, 높이 114, 그라데이션 배경): `Acorn Button` Bar Default **"I ate this · 12"**(`utensils`, FILL — 기록 버튼, 도토리 반응은 위 Feed Post Actions). 오른쪽 타이머 버튼(Cook along)은 없앴다 — 타이머는 단계의 Start timer로만.
- 이동: 뒤로 → **이전 화면(Back)** · `more` → 메뉴(**Add to meal plan** · 남의 요리 = Report → 7.3 / 내 요리 = Edit …) · 작성자(아바타·이름) / More from Minji `chevron-right` → 작성자 프로필(4.5 템플릿) · 게시물 댓글 아이콘(18) → 7.2 · Start 15:00 timer → 5.1_0(게시물 위에 푸시, 뒤로 = 이 게시물) · **Acorn Button → 7.1b** · 하트·저장 = 그 자리에서 토글.
- **Add to meal plan**(코드 기준, Figma 없음): BottomSheet "Add to meal plan" — Overline "DAY" 칩(Today + 6일, 요일 · 날짜) · Overline "FOR" 칩 Lunch / **Dinner**(기본) → Button "Add" → 그날 그 끼니 식단에 저장(같은 끼니는 교체) · Toast "Added to your meal plan". 6.3 이번 주 한 줄에 보인다.
- 데이터: `Dish`([§7](../06-data-model.md)) 전체 — author, photos[], weather, acorns, comments 수, caption, tags, kcalTotal(선택), ingredients, steps, 작성자의 다른 요리 4개.

### 7.1b State · Ate it — [253:327](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=253-327)
- 7.1에서 도토리 버튼을 누른 직후 상태. 레이아웃은 7.1과 같고 바뀌는 것만:
  - 하단 버튼 → **Eaten** "You ate this · 13"(bg/accent-subtle, 테두리 border/accent, 글자 fg/accent, `utensils` fg/accent). 사진 위 Acorn Tag는 그대로 95(기록은 도토리 수를 바꾸지 않는다).
  - [고정] `Toast`(x 20, Action bar 바로 위, 아래 고정) "Added to your diary · the cook will see you ate it." + "Undo"(bg/kick 글자), 4초 뒤 사라짐.
- 이동: 버튼(Eaten) 다시 탭 → 7.1(기록 취소, −1) · Undo → 7.1. 햅틱 1회. 기록하면 6.3 Diary에 그 날짜로 남고, 후기(별점 없이 한 줄)를 이어서 쓸 수 있다.

### 7.2 Comments sheet — [26:537](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-537)
- 뒤 화면 = **실제 7.1**(Hero 사진 · 시트 · Top bar · Action bar, 레이어 "Behind · 7.1 Post detail") + 딤(overlay/scrim) + 바텀시트(핸들): "Comments · 18" → 댓글(Comment 132:4846: Avatar 40 · **@username** Body/M Strong + 시간 Caption fg/disabled → 본문 Body/M) @sora 12m "Made this tonight. Rain + this = perfect." / Jae 1h "The sour-kimchi tip changed everything." / Hana 3h "Saving for the next typhoon day 🌧" → [A] 하단 **Comment Composer**(Avatar 40 + 흰색 입력칸 42 "Say something warm…" + 전송 `arrow-right`). 시트 = **Comments Sheet** 컴포넌트.
- 댓글을 보는 **유일한 화면**(7.1·피드의 댓글 아이콘에서 연다). 딤 탭 / 시트 드래그 다운 → 이전 화면(Back) · 전송 → 7.1.

### 7.3 Report / block — [26:595](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=26-595)
- 뒤 화면 = **실제 7.1**(7.2과 같음) + 딤(overlay/scrim, 탭 → Back) + 바텀시트(화면 아래 끝까지 붙음, y 96–844, 위 모서리 28, padding 12 20 34): 그래버(가운데) → "What’s wrong with this dish?" → **Radio Row ×9**(컴포넌트 기본 높이 56, 간격 0, 급한 것부터):
  1. Nudity or sexual content · 2. Child safety or illegal content · 3. Harassment · 4. Hate or violence · 5. Someone else’s photo · 6. Spam or advertising · 7. Unsafe recipe(선택 예시) · 8. Not food / off-topic · 9. Something else
  → Button Primary L "Report" + Destructive L "Block Minji".
- **Report** → 신고자 화면에서 그 게시물을 바로 숨기고 **홈(2.1)으로 돌아가 Toast** "Thanks — we’ll review this within 24 hours. You won’t see this dish anymore."(4초, TabBar 위). 7.1로 돌아가지 않는 이유 = 신고한 게시물은 더 이상 보이지 않기 때문. 같은 게시물을 서로 다른 3명 이상이 신고하거나 사유가 1·2번이면 모든 사람에게서 자동으로 임시 숨김(운영자 24시간 안에 검토). 사유 값 = DB `reports.reason`(sexual · child_safety · harassment · hate_violence · copyright · spam · unsafe_recipe · off_topic · other).
- **Block Minji** → 확인 없이 차단하고 홈(2.1)으로, 토스트 "Minji is blocked. You won’t see their dishes. · Undo"(4초). 관리 = 9.5 Blocked.
- 게시자에게는 조치 결과가 2.8 알림(게시물 조치)과 이메일로 간다(사유 + 이의 제기).
- 처리 기준 = [guides/7.4-report-moderation-guide.pdf](../guides/7.4-report-moderation-guide.pdf).
- 이동: Report → 2.1 · Block → 2.1 · 딤 → Back.

### 공유 · 보내기 · 저장 시트 공통
- 7.1 위에 딤(overlay/scrim, 탭 → 닫힘) + **바텀 시트**(bg/subtle, 위 모서리 28, padding 10 20 34, 그래버 36×5). 홈 피드 · 4.4 · 7.1 · 7.1b의 Feed Post Actions에서 연다(MOVE_IN 300ms).

### 7.4 Share sheet — [367:8515](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=367-8515)
- Feed Post `share`.
- "Share this dish"(Title/M) → **요리 미리보기**(bg/default, radius 16: 사진 56 radius 12 · 이름 Body/M Strong · "by minji.cooks · Rainy 12° · Dinner" · 링크 `ongdalsaem.app/d/k7x2` Caption Strong fg/accent)
- 동작 4개(각 76 폭, 56 원 bg/default + 1px border/default + 아이콘 22 · 라벨 Caption):
  - `copy` **Copy link** → 링크 복사, 시트 닫힘 + 토스트 "Link copied"
  - `image` **Share card** → 사진 + Weather Tag가 들어간 세로 카드 이미지(1080×1350)를 만들어 OS 공유 시트로(인스타 스토리·저장 등)
  - `more-horizontal` **More** → 이 시트를 닫고 **OS 기본 공유 시트**(iOS 공유 시트 / Android Sharesheet)를 연다. 내용 = 링크 `ongdalsaem.app/d/k7x2` + 문구 "Kimchi jjigae for one by minji.cooks on ongdalsaem". 카카오톡·메시지·메일 등 설치된 앱이 OS 목록에 나온다(앱이 따로 화면을 그리지 않음, React Native `Share.share`). 프로토타입에서는 OS 화면이라 연결하지 않는다.
- 안내 "Links open the dish in ongdalsaem — or on the web if the app isn’t installed. Share card saves a photo card with the weather tag." → Ghost L "Cancel".
