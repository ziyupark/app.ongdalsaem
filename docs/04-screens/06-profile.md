# Screens 06 · Profile

> 블록 순서 = DOM 순서. 공통 골격·컴포넌트는 [02-components](../02-components.md), 이동 전체 표는 [03-ia-and-flows](../03-ia-and-flows.md). 색인 → [README](../README.md)

## 06 Profile — [섹션 59:2369](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=59-2369)

### 프로필 공통 헤더 (6.1 / 6.2 / 6.3 / 6.4) — 컴포넌트 `Profile Header`
- 컴포넌트 [126:4345](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=126-4345), 390 × 279, StatusBar 바로 아래. Variant `Tab = Dishes / Saved / Diary`(활성 탭). Text props: Name · Handle · Bio · Acorns · Weather, Dishes 탭 숫자는 노출된 Tab 인스턴스 Label("Dishes 48"). 높이 235.
- 구성(세로, 좌우 padding 20): **Top row** = 왼쪽 **Weather now** pill(실시간 점 · `cloud-rain` · "Light rain · 12° · Mapo, Seoul") + 오른쪽 `settings`(→ 9.1) → Avatar 88 + [Name "Jiyu"(Display/M) / Handle "@jiyu.cooks · Seoul" / 도토리 pill `acorn-color` "312 acorns"] → Bio "Cooking for one, mostly when it rains." → 탭 **Dishes 48** · Saved · Diary(요리 개수 pill 없음 — Dishes 탭 오른쪽 숫자).
- Weather now(Top row 왼쪽, 폭은 내용 맞춤 · 오른쪽 settings와 양 끝 맞춤, 화면 안 20–222) = 프로필 주인의 **현재 위치 날씨·기온·동네**(9.5 Shared precision 단위). 15분마다 · 앱 복귀 때 갱신, 날씨 아이콘도 함께 바뀐다. 위치를 끈 사람은 pill을 숨긴다. 오프라인(6.4)은 마지막 값 "Last seen · 12° · Mapo, Seoul".
- 헤더 하단에 1px 구분선(border/default, 컴포넌트 하단 stroke). 활성 탭 밑줄이 이 선 위에 겹친다.
- 탭 이동: Dishes → 6.1 · Saved → 6.2 · Diary → 6.3.

### 6.1 Profile · Dishes — [20:974](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-974)
- **세로 스크롤** 화면(하단 Tab bar spacer 96). 3열 사진 그리드(전체 폭 390, 셀 128 × 160, 가로·세로 간격 3). 셀은 컴포넌트 **`Dish Tile`** [128:4188](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=128-4188) (사진은 Photo 레이어 fill, 태그는 노출된 Weather Tag · Acorn Tag 인스턴스로 값 입력). 셀 모서리 **radius/xs = 4px**, clip.
- 셀마다 태그 2개([§3.4](../02-components.md)) — **모든 셀에 동일 적용**:
  - **Weather Tag**(좌하단 left 8, bottom 8, **Size=L** — 6.1만 L): 날씨 아이콘 16px(stroke 1.4px) + 기온.
  - Acorn Tag(우하단 right 8, bottom 8, **Size=L**)는 **컬러 도토리**(State=Eaten) — 내 요리가 받은 도토리 수.
  - **Acorn Tag**(우하단 right 8, bottom 8): Acorn Symbol + 받은 도토리 수.
- 예시 데이터(왼→오, 위→아래):

  | 셀 | 날씨 아이콘 | 기온 | 도토리 |
  |---|---|---|---|
  | 1 | cloud-rain | 12° | 128 |
  | 2 | sun | 24° | 64 |
  | 3 | cloud-snow | −2° | 41 |
  | 4 | cloud | 17° | 212 |
  | 5 | cloud-drizzle | 8° | 37 |
  | 6 | sun | 21° | 89 |
  | 7 | cloud-sun | 15° | 56 |
  | 8 | wind | 5° | 23 |
  | 9 | cloud-snow | −6° | 18 |

- 음수 기온은 하이픈(-)이 아닌 마이너스 기호(−, U+2212)로 표시.
- 셀 탭 → 7.1.
- 이동: Saved → 6.2 · Diary → 6.3.

### 6.2 Profile · Saved — [58:1788](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=58-1788)
- Profile Header(Tab=Saved) → SectionHeader "Collections" + action **"+ New"**(컬렉션 그룹 만들기, 유지) → 필터 칩: **All** · Rainy · Snowy · Clear(아이콘) → Food Card Row: "SAVED · RAINY 12° / Kimchi jjigae for one / Minji · saved 2 days ago", "SAVED · CLEAR 21° / Naengmyeon, icy and bright / Jae · saved 5 days ago".
- **컬렉션 카드(가로 콜라주) 줄은 없음**. "+ New"는 새 컬렉션 이름 입력 시트를 연다(*Figma 화면 없음*). 만든 컬렉션은 필터 칩 줄에 칩으로 추가된다.
- 이동: 카드 → 7.1 · Dishes → 6.1 · Diary → 6.3.

### 6.3 Profile · Diary — [20:1110](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=20-1110)
- Profile Header(Tab=Diary) → 월 헤더 "October 2026" + `chevron-left`/`chevron-right` → 캘린더(7열, 셀 **47 × 46**, 간격 4/6) → 월 요약 카드("October, mostly rainy" / "You cooked 12 times — 6 of them in the rain. Stews won.").
- 날짜 셀 = 컴포넌트 **`Diary Day`** [132:4501](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=132-4501) — `State = Blank`(달 시작 전 빈칸) / `Plain`(기록 없음, 숫자만) / `Logged`(요리 사진 배경 + 딤 + 흰 숫자 + 날씨 아이콘 12px).
- 2026년 10월 기록일: 2(cloud) · 5, 6(cloud-rain) · 9, 12(sun) · 14(cloud) · 17(cloud-rain) · 19(sun) · 21(cloud-rain) · 23(cloud) · 24, 26(cloud-rain).
- 화면은 **세로 스크롤**(월 요약 카드가 TabBar에 가리지 않도록 하단 Tab bar spacer 96).
- 날짜 탭 → 그날 요리(7.1). TabBar(+CreateFAB) 동일.

> 설정은 **09 Settings**(9.1 Settings). 프로필의 `settings` 아이콘은 9.1로 간다.

### 6.4 State · Offline — [76:3380](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=76-3380)
- 노트: *Saved dishes and Diary stay readable. Sharing is queued and sent when back online.*
- 6.2 레이아웃(컬렉션 카드 줄 없음) + 프로필 헤더 아래 `Inline Banner`(Tone=Neutral, `wifi-off`) "You’re offline — saved dishes still open."
- 구현: 저장 요리·다이어리는 로컬 캐시. 공유는 큐에 넣고 재연결 시 전송.
- 이동: 저장 카드 → **6.4b**.

### 6.4b State · Offline post — [366:8906](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=366-8906)
- 오프라인에서 저장한 요리를 열었을 때. **7.1과 같은 레이아웃**(캐시된 사진 · 본문 · 재료 · 단계 · Details).
- Sheet 맨 위 `Inline Banner`(Neutral, `wifi-off`) "You’re offline — this saved copy still works. Acorns and comments come back online."
- 네트워크가 필요한 것은 **비활성(투명도 35–40%, 탭 안 됨)**: Feed Post Acorn · Comment · Share, Action bar Acorn Button, Top bar `more`(숨김). Nearby · More from 섹션은 없음.
- 그대로 되는 것: 재료 · 단계 읽기, **Cook along / Start timer**(로컬 타이머), 저장 해제(재연결 때 동기화).
- 다시 연결되면 7.1로 조용히 바뀐다(배너 사라짐, 숫자 갱신).

---
