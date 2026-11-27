# 01 · Foundations — 토큰

> 컬러 · 그라데이션 · 날씨 무드 · 간격/라운드 · 타이포 · 효과. 코드에서는 이 이름 그대로 CSS 변수/테마 키로 쓴다. 색인 → [README](README.md)

## 2. 디자인 토큰

### 2.1 컬러 — 시맨틱 (Light / Dark)

> **앱은 라이트 모드만 쓴다**(기기 다크 모드와 관계없이 Light 값, `app.json` userInterfaceStyle `light`). Dark 열은 Figma · 코드(`colors.ts`)에 보관만 하고 쓰지 않는다.

| 토큰 | CSS 변수 | Light | Dark | 용도 |
|---|---|---|---|---|
| bg/default | `--bg-default` | `#F5F2ED` | `#121318` | 앱 배경(크림) |
| bg/subtle | `--bg-subtle` | `#FFFFFF` | `#1B1C22` | 카드, 시트 |
| bg/muted | `--bg-muted` | `#EDE9E3` | `#2A2A2F` | 입력, 칩, 스켈레톤 |
| bg/emphasis | `--bg-emphasis` | `#E4DFD7` | `#403E3B` | 눌림 상태 |
| bg/inverse | `--bg-inverse` | `#1B1C22` | `#FBF9F6` | 토스트, 반전 영역 |
| bg/primary | `--bg-primary` | `#1B1C22` | `#FFFFFF` | Primary 버튼, FAB |
| bg/accent-subtle | `--bg-accent-subtle` | `#FFF3E6` | `#6E3214` | 강조 배경 |
| bg/kick | `--bg-kick` | `#F7A84A` | `#F7A84A` | Kick 버튼, Switch On 트랙 |
| bg/kick-subtle | `--bg-kick-subtle` | `#FFE4C7` | `#6E3214` | |
| fg/default | `--fg-default` | `#1B1C22` | `#FBF9F6` | 본문(잉크) |
| fg/secondary | `--fg-secondary` | `#5C5953` | `#D1CBC1` | 보조 텍스트 |
| fg/muted | `--fg-muted` | `#716C65` | `#A6A098` | 메타, 캡션 — 라이트 = stone/550(bg/default · bg/subtle 위 대비 4.5 이상) |
| fg/disabled | `--fg-disabled` | `#A6A098` | `#5C5953` | |
| fg/inverse | `--fg-inverse` | `#FFFFFF` | `#1B1C22` | |
| fg/on-primary | `--fg-on-primary` | `#FFFFFF` | `#1B1C22` | |
| fg/accent | `--fg-accent` | `#B5531F` | `#F7A84A` | 링크, 오버라인 강조 |
| fg/on-kick | `--fg-on-kick` | `#6E3214` | `#FFE4C7` | |
| fg/destructive | `--fg-destructive` | `#DC2626` | `#EF4444` | |
| border/default | `--border-default` | `#E4DFD7` | `#2A2A2F` | 구분선 |
| border/strong | `--border-strong` | `#D1CBC1` | `#403E3B` | Outline 버튼 |
| border/focus | `--border-focus` | `#EE8B3D` | `#F7A84A` | 입력 포커스 |
| border/accent | `--border-accent` | `#E2703E` | `#F7A84A` | |

**확장 토큰** — 상태·사진 위·오버레이·유리·고정 색. 화면의 모든 색은 아래 토큰 중 하나에 연결되어 있다(직접 입력 HEX 없음).

| 그룹 | 토큰 | Light | Dark | 용도 |
|---|---|---|---|---|
| 상태 | fg/success | `#2F8F4E` | `#5BBF7A` | 완료·성공 아이콘/텍스트 |
| | bg/success-subtle | `#E8F3EB` | `#1E3325` | 성공 배너 배경 |
| | fg/warning | `#A16207` | `#F5B83D` | 주의 텍스트 |
| | bg/warning-subtle | `#FEF6E4` | `#3A2C10` | 주의 배너 배경 |
| | bg/destructive-subtle | `#FDECEC` | `#3A1C1C` | 오류/위험 배너 배경 |
| 완료(세이지) | **fg/done** | sage/600 `#5E8B6A` | sage/400 `#8FB394` | 끝난 타이머(5.2) 링·00:00·체크 아이콘. 실행 중(오렌지 fg/accent)과 구분 |
| | **bg/done-subtle** | sage/50 `#EEF4ED` | sage/800 `#2F4536` | 5.2 Done banner 배경 |
| | **border/done** | sage/100 `#DCE8DA` | sage/600 `#5E8B6A` | 5.2 Done banner 테두리 |
| 사진 위 | fg/on-photo | `#FFFFFF` | `#FFFFFF` | 사진·그라데이션 위 텍스트·아이콘(모드 무관 흰색) |
| | fg/on-photo-secondary | white 75% | white 75% | 사진 위 보조 텍스트(eyebrow, byline) |
| | fg/on-photo-tertiary | white 55% | white 55% | 사진 위 3차 텍스트 |
| 오버레이 | overlay/shade | ink 16% | ink 16% | 사진 선택 셀 음영 |
| | overlay/scrim-soft | ink 28% | ink 28% | 다이어리 기록일 딤 |
| | overlay/scrim | ink 45% | ink 45% | 사진 위 태그(Weather/Acorn Tag), 시트 뒤 딤 |
| | overlay/scrim-strong | ink 55% | ink 55% | 사진 카운터 pill |
| 유리 | glass/surface | white 88% | ink 88% | TabBar·TopBar·Weather Card·Glass IconButton 면(+ Blur 스타일) |
| | glass/fill | white 12% | white 12% | 사진 위 Glass 버튼 면 |
| | glass/fill-strong | white 24% | white 24% | 사진 위 Glass 칩 면 |
| | glass/stroke | white 32% | white 32% | Glass 칩 테두리 |
| | glass/stroke-strong | white 55% | white 55% | Glass 버튼 테두리 |
| 고정 | static/white | `#FFFFFF` | `#FFFFFF` | Switch 손잡이, White 버튼, 선택 번호 배지 |
| | static/ink | `#1B1C22` | `#1B1C22` | 밝은 무드 견본 위 텍스트 |

(ink = `#1B1C22`. 값 = 해당 색 + 투명도. 사진 위 보조 흰 글자 = 75%, 유리 면 = 88%)

### 2.2 컬러 — 프리미티브

```
stone:      0 #FFFFFF · 50 #FBF9F6 · 100 #F5F2ED · 150 #EDE9E3 · 200 #E4DFD7 · 300 #D1CBC1
            400 #A6A098 · 500 #7E7972 · **550 #716C65** · 600 #5C5953 · 700 #403E3B · 800 #2A2A2F · 900 #1B1C22 · 950 #121318
persimmon:  50 #FFF3E6 · 100 #FFE4C7 · 400 #F7A84A · 500 #EE8B3D · 600 #E2703E · 700 #B5531F · 800 #6E3214
sunset:     100 #FFDB29 · 200 #FFC450 · 300 #F9C152 · 400 #FEA344 · 500 #FFA528 · 600 #F2A04A
            700 #FE923F · 800 #FF773A · 900 #DD7350          (Signature gradients 전용)
red:        50 #FDECEC · 500 #EF4444 · 600 #DC2626 · 900 #3A1C1C
green:      50 #E8F3EB · 400 #5BBF7A · 600 #2F8F4E · 900 #1E3325
amber:      50 #FEF6E4 · 400 #F5B83D · 700 #A16207 · 900 #3A2C10
sage:       50 #EEF4ED · 100 #DCE8DA · 400 #8FB394 · 600 #5E8B6A · 800 #2F4536   (완료 상태 done 토큰 전용)
alpha:      white-12 · 16 · 24 · 28 · 32 · 45 · 55 · 75 · 88  |  ink-16 · 28 · 45 · 55 · 88   (#FFFFFF / #1B1C22 + 투명도%)
mood:       mood/<key>/top · mood/<key>/base  (18종, §2.4 표)
```
- Figma 컬러 라이브러리 = **Primitives**(stone · persimmon · sunset · red · green · amber · sage · alpha · mood) + **Color**(시맨틱, Light/Dark, §2.1) + 그라데이션 스타일(§2.3) + 효과 스타일(§2.7). 이 밖의 팔레트는 없다.
- Foundations 페이지의 Primitive palette · Semantic color · Signature gradients · Elevation & blur · Typography 표는 위 값과 1:1로 같다.
- 예외: Auth Button의 Apple · Google 브랜드 색은 팔레트 밖의 각 사 고정 값이다([02-components](02-components.md) Auth Button 브랜드 규정).
- 화면에는 시맨틱 토큰(§2.1)과 그라데이션 스타일만 쓴다. 프리미티브는 시맨틱 토큰과 무드 그라데이션의 원본 값으로만 쓴다.

### 2.3 그라데이션 (Paint styles)

| 이름 | 타입 | 정지점 | 용도 |
|---|---|---|---|
| Gradient/Sunset | radial | sunset/300 `#F9C152` 0% → sunset/600 `#F2A04A` 60% → sunset/900 `#DD7350` 100% | 무드 오브, Now 슬롯 링 |
| Gradient/Sunset linear | linear | sunset/100 `#FFDB29` 0% → sunset/200 `#FFC450` 23% → sunset/700 `#FE923F` 76% → sunset/400 `#FEA344` 100% | 홈 타이틀 강조 단어, 선셋 링 |
| Gradient/Ink metal | linear | `#6A6760` → `#1B1C22` | 다크 칩/배지 |
| Gradient/Photo scrim | linear(위→아래) | `#1B1C22` 0% α → `#1B1C22` α0.82 | 사진 아래쪽 텍스트 가독(Pick·Country 카드) |
| Gradient/Card scrim | linear(위→아래) | ink 45% 0% → 0% 30% → 0% 50% → ink 82% 100% | Story Card: 위 헤더 + 아래 본문을 한 장으로 |
| Gradient/Dusk | linear | sunset/500 `#FFA528` → sunset/800 `#FF773A` | **TabBar 활성 아이콘 색** |

- Sunset·Sunset linear·Dusk의 정지점은 **sunset 프리미티브 변수에 연결**되어 있다. 코드에서는 `--sunset-100…900` 변수로 그라데이션을 만든다.
| **Mood/<key>** ×18 | **Weather Mood 2.0** — 여러 겹(아래 → 위): ① linear 위→아래 `top` 0% → 55% → `bg/default` 100% ② radial 블롭 2–3개(색 α0.4–0.95 → 0, 가장자리로 갈수록 투명) | 홈 Mood wash · 3.x · Festive 카드. 키 · 값 §2.4 |

- Mood 그라데이션 스타일 이름: `Mood/clear`, `Mood/clear-night`, `Mood/cloudy`, `Mood/overcast`, `Mood/drizzle`, `Mood/rain`, `Mood/heavy-rain`, `Mood/shower`, `Mood/thunder`, `Mood/sleet`, `Mood/flurries`, `Mood/snow`, `Mood/heavy-snow`, `Mood/fog`, `Mood/dust`, `Mood/heat`, `Mood/cold`, `Mood/windy`.
- 코드: 레이어 순서 그대로 `background:` 에 여러 겹을 쓴다 — `radial-gradient(ellipse rx ry at cx cy, color a, color a×0.45 55%, transparent)` × 블롭 수, 맨 아래 `linear-gradient(180deg, var(--mood-<key>-top), var(--bg-default))`. React Native는 `react-native-svg`의 RadialGradient 여러 개 또는 `expo-linear-gradient` + 블롭 원(blur 대신 radial 투명도)으로 만든다.

### 2.4 Weather mood — 2.0 (메시 느낌 그라데이션)

화면 위에서 아래로 날씨 색이 번지다가 `bg/default`(크림)로 사라지는 워시. 날씨마다 **기본 페이드 + 흐린 색 덩어리(블롭) 2–3개 + 얇은 선 모티프**로 분위기를 표현한다. 브랜드 팔레트만(보라 없음), 아래쪽은 항상 크림이라 위에 얹는 글자(fg/default)가 읽힌다.
- 견본: Foundations **Weather Mood 2.0 · Gradients** [518:821](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=518-821) · 모티프 컴포넌트 **Mood Motif** [518:820](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=518-820)(Mood V ×18, 흰 선 · 점 α0.25–0.95, 180×220 기준, 그라데이션 위에 얹어 크기 조절).
- 홈 · Nearby의 **Mood wash**(390×420) = 해당 `Mood/<key>` 스타일 **α0.85**. 2.6 날씨 없음은 `Mood/overcast`(날씨 모션 없음).
- 블롭 좌표 = 박스 기준 비율(cx, cy, 가로 반지름 rx, 세로 반지름 ry), 색 · 가운데 불투명도.

| key | top(`mood/<key>/top`) | 블롭(색 · cx,cy · rx×ry · α) | 모티프 | 판정 기준(기상청 기준 응용) |
|---|---|---|---|---|
| clear | `#FFCF73` | `#FFB13D` .76,.10 · .46×.38 · .95 / `#FF9E5E` .18,.04 · .42×.34 · .55 / 흰 빛 .78,.10 · .13 · .85 | 해 고리 2겹 | 맑음(운량 0–5), 낮 |
| clear-night | `#22335C`(55% `#6F7FA8`) | `#3A5A9C` .18,.06 · .5×.36 · .9 / 달빛 `#FFD27A` .8,.12 · .15 · .9 / `#FFE9B8` 작은 점 | 별 5개 + 초승달 | 맑음, 일몰 후 |
| cloudy | `#B9C2CC`(50% `#D6DEE5`) | **Pearl · Mist Blue · Silver Grey** — Silver Grey `#A9B1BA` .84,0 · .46×.34 · .85 / Mist Blue `#BFD3E3` .22,.06 · .48×.34 · .9 / Pearl `#F6F2EC` .46,.2 · .46×.2 · .95 / 진주 광택 `#EADFE0` .62,.16 · .22×.12 · .45 · `#E3F0F4` .34,.24 · .2×.1 · .55 | 부드러운 곡선 2 | 구름많음(운량 6–8) |
| overcast | `#AFB6BE` | `#8E98A3` .5,−.04 · .62×.36 · .85 / `#DCD8D1` .15,.28 · .38×.22 · .7 | 겹친 곡선 3 | 흐림(운량 9–10) |
| drizzle | `#A9C6D2` | `#7FB3C6` .72,.06 · .42×.34 · .8 / `#D3EAE3` .2,.2 · .36×.24 · .8 | 짧은 빗금 | 비 < 3 mm/h |
| rain | `#7C9EBA` | `#4F7DAD` .3,−.02 · .52×.36 · .9 / `#9BC6DE` .86,.22 · .34×.26 · .75 | 사선 빗줄기 | 비 3–15 mm/h |
| heavy-rain | `#4A6382`(55% `#9AABBF`) | `#2E4A6B` .5,−.06 · .62×.4 · .95 / `#6E95BA` .14,.26 · .36×.24 · .6 | 촘촘한 긴 빗줄기 | 비 ≥ 15 mm/h |
| shower | `#9ACFE6` | `#5DB8E6` .24,.06 · .42×.32 · .85 / 해 `#FFC27A` .86,.1 · .3×.24 · .85 / 흰 .6,.3 · .3×.16 · .6 | 빗줄기 + 해 고리 | 소나기 |
| thunder | `#3B4760`(55% `#8E97AA`) | `#232C40` .38,−.04 · .56×.38 · .95 / 번쩍 `#FFD86B` .76,.16 · .3×.26 · .4 / `#FFF2A8` .76,.16 · .09 · .95 | 번개 지그재그(빛 번짐) | 뇌우/낙뢰 |
| sleet | `#A6BACB` | `#C5DCEC` .24,.1 · .4×.28 · .9 / `#86A1B9` .82,.04 · .36×.3 · .8 | 빗금 + 점 섞임 | 진눈깨비 |
| flurries | `#CFE2EF` | 흰 .5,.1 · .5×.28 · .9 / `#AED2EE` .14,0 · .36×.3 · .8 | 점 7 | 눈날림 |
| snow | `#B4CDE4` | `#E8F2FA` .62,.14 · .46×.3 · .95 / `#93B9DD` .14,.04 · .36×.3 · .85 | 점 16 | 눈 < 1 cm/h |
| heavy-snow | `#89AACA` | `#6890B8` .5,−.04 · .56×.38 · .9 / `#E2EDF7` .8,.3 · .36×.24 · .85 | 점 30 | 눈 ≥ 1 cm/h |
| fog | `#CBC7C0` | `#B5B0A8` .2,0 · .42×.3 · .75 / 가로 띠 `#EEEBE6` .5,.22 · .75×.12 · .9 | 가로선 5 | 안개 |
| dust | `#DFC496` | `#CF9F5E` .72,.04 · .46×.34 · .85 / `#F3DFBB` .2,.22 · .36×.24 · .8 | 미세한 점 26 | 황사/미세먼지 나쁨 |
| heat | `#FFAE6A` | `#FF7438` .5,−.04 · .54×.38 · .9 / `#FFD27A` .16,.18 · .34×.26 · .85 / `#FFF4E0` .55,.12 · .16×.1 · .7 | 아지랑이 물결 3 | 기온 ≥ 33 °C |
| cold | `#A6C4E2` | `#7AA4D4` .82,0 · .46×.34 · .85 / `#E6F0F9` .2,.2 · .36×.24 · .9 | 얼음 결정 선 | 기온 ≤ −12 °C |
| windy | `#BBD6D3` | `#86BFBA` .14,.04 · .46×.32 · .85 / `#E6F1EC` .78,.22 · .5×.14 · .85 | 베지어 곡선 + 핸들(◇ ○) | 풍속 ≥ 14 m/s |

- `mood/<key>/base` 변수는 모두 `#F5F2ED`(= bg/default)로 통일했다(그라데이션 끝이 항상 화면 배경과 같게).
- 블롭 가운데 → 55% 지점은 α×0.45, 끝은 0(흐린 가장자리). 블롭은 위쪽 40% 안에 두고, 글자가 올라가는 아래쪽은 비운다.

**우선순위**(동시 조건): thunder > heavy-rain/heavy-snow > sleet > rain/snow/shower > drizzle/flurries > heat/cold > dust > fog > windy > overcast > cloudy > clear/clear-night.

각 무드에 매핑되는 Lucide 아이콘: clear `sun`, clear-night `moon`, cloudy `cloud-sun`, overcast `cloud`, drizzle `cloud-drizzle`, rain `cloud-rain`, heavy-rain `cloud-rain-wind`, shower `cloud-sun-rain`, thunder `cloud-lightning`, sleet `cloud-hail`, flurries `snowflake`, snow `cloud-snow`, heavy-snow `cloud-snow`, fog `cloud-fog`, dust `haze`, heat `thermometer-sun`, cold `thermometer-snowflake`, windy `wind`.
**3D 날씨 아이콘**(큰 날씨 아이콘 전용): 18개 무드 모두 투명 배경 3D 이미지 `assets/weather3d/{mood}@2x.png` · `@3x.png`(Figma **Weather 3D** [1037:228](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=1037-228)에서 내보냄, 코드 `WEATHER_3D` · `src/theme/weatherIcons.ts`). 쓰는 곳 = Weather Card의 56 자리(홈 · 프로필 헤더 · Nearby) — 원형 배경 없이 이미지만, 다크 모드도 같은 이미지(색 반전 없음), 접근성 라벨 = 날씨 이름. 날씨를 아직 모르면 bg/muted 35 % 원 + Lucide `cloud` 28(fg/muted). 앱을 열 때 지금 날씨 이미지 하나만 미리 불러온다. **24 이하 작은 아이콘**(끼니 칩 · 게시물 날씨 태그 · 리스트 메타)은 위 Lucide 그대로.
**Weather Mood 모션**(WeatherMoodLayer — 코드 기준, 값 `src/theme/weatherFx.ts`): Mood wash 바로 위 · 콘텐츠 아래에 깔리는 **느리고 잔잔한** 배경 움직임. 터치는 통과하고, 아래 40 %에서 투명해져 카드 · 글자를 가리지 않는다.
- 무드별: **clear** = 빛 번짐이 숨 쉬듯 확대 · 축소(1 → 1.06, 8초) + 옅은 빛 입자 몇 개가 천천히 떠오름(12–20초) · **cloudy / overcast / fog** = 반투명 구름 2–3장이 서로 다른 속도로 좌 → 우(40 · 60 · 90초, parallax) · **drizzle / rain / heavy-rain / shower / sleet** = 약 10° 기운 가는 흰 빗줄기, 한 줄기가 1.2–2초에 지나감, 투명도 0.15–0.35(drizzle은 적고 짧고 흐리게) · **snow / flurries / heavy-snow / cold** = 2–6 pt 흐린 눈송이가 8–14초에 내리며 10–24 pt 좌우로 흔들림, 앞(크고 빠름) · 뒤(작고 느림) 깊이감 · **thunder** = rain + 6–14초 랜덤 간격 번개(흰 플래시 0 → 0.35 → 0.1 → 0.25 → 0, 약 400ms, 최대 0.35, 1초에 3회 미만) + 3번에 1번 상단 지그재그 번개 줄기 150ms · **windy** = 가는 바람 선이 좌 → 우로 천천히(3.2–5.2초) · **night** = 입자 밝기 60 %, 맑은 밤은 별이 0.3 ↔ 0.8로 3–6초에 반짝임.
- 입자 수 상한: 비 60 · 눈 40 · 그 밖 20. transform · opacity만 움직인다(레이아웃 변경 없음, UI 스레드). **1.2 Sign in만 입자 3배**(`density` 3 — 비 · 눈 · 진눈깨비 · 빛 입자 · 별 · 바람 줄의 개수와 상한 ×3, 구름 · 안개 덩어리 · 해 빛 번짐은 그대로).
- 무드가 바뀌면 이전 효과 800ms 페이드아웃 + 새 효과 1200ms 페이드인(크로스페이드). 앱 첫 실행 때만 wash가 400ms 페이드인되고 300ms 뒤 모션이 1200ms에 걸쳐 나타난다. 화면 · 탭 전환 · 뒤로가기 · 백그라운드 복귀에서는 페이드 없이 멈춘 자리에서 이어진다.
- **Reduce Motion**: 움직이지 않는 한 장만 보이고 번개는 아예 없다.
- 보이는 곳: 네 탭(전역 WeatherBackdrop) · 7.1 Post detail · **1.2 Sign in**(LaunchBackdrop 하늘 420 위, 로그인 전 기기 위치 날씨 — 모르면 clear, 입자 3배).
- 개발용: 홈 로고 길게 누르기 → "Weather mood preview"에서 18개 무드 × 낮/밤을 바로 바꿔 볼 수 있다(개발 빌드만).

Weather Mood 컴포넌트: [72:787](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=72-787)

### 2.5 Spacing / Radius

```
--space-0:0  --space-2:2  --space-4:4  --space-6:6  --space-8:8  --space-10:10  --space-12:12  --space-14:14
--space-16:16 --space-20:20 --space-24:24 --space-32:32 --space-40:40 --space-56:56
--radius-xs:4 --radius-sm:8 --radius-md:12 --radius-lg:16 --radius-xl:24 --radius-2xl:32 --radius-full:999
```
- 화면 좌우 패딩: **20**. 카드 내부 패딩: 14–24. 섹션 간격: 24–40.
- 간격·패딩·radius는 **위 토큰 값만** 사용한다. 예외: 프로필 그리드 간격 3px(390 = 128×3 + 3×2), 하단 고정 바의 safe-area 여백(28/34, 기기 홈 인디케이터 높이 기준).
- radius: 사진 썸네일 lg(16), 카드 xl(24)–2xl(32), 큰 사진 카드(Story · Weather Card · Nearby Card) 2xl(32). 버튼/칩/탭바/pill: full.
- 컴포넌트 크기는 variant 크기 그대로 사용한다(인스턴스를 임의로 늘리거나 줄이지 않음). Avatar = 24/32/40/56/88만, Button 높이 = L 56 / M 46 / S 36, Chip 높이 36, Tab 높이 43, IconButton = L 48 / M 40, Auth Button 46.

### 2.6 타이포그래피

| 스타일 | 폰트 | size / line-height | letter-spacing(px) | 비고 |
|---|---|---|---|---|
| Display/XL | Fraunces Bold | 46 / 49 | −1.5 | 홈 대제목 |
| Display/L | Fraunces Bold | 34 / 37 | −0.9 | |
| Display/M | Fraunces SemiBold | 24 / 29 | −0.45 | 화면 타이틀(온보딩, 공유) |
| Display/Quote | Fraunces SemiBold | 22 / 29 | −0.5 | 인용/스토리, 5.1 음식 이름 박스 |
| Title/L | Outfit Medium | 22 / 27 | −0.35 | |
| Title/M | Outfit Medium | 18 / 18 | −0.2 | 카드 제목 |
| Title/S | Outfit Medium | 16 / 21 | −0.1 | |
| Body/L | Outfit Regular | 17 / 22 | −0.15 | 홈 Meal Slot 기온 |
| Body/M | Outfit Regular | 15 / 20 | 0.13 | 기본 본문 |
| Body/M Strong | Outfit Medium | 15 / 21 | 0 | |
| Body/S | Outfit Regular | 13 / 16 | 0 | |
| Body/S Strong | Outfit Medium | 13 / 18 | 0 | |
| Caption | Outfit Regular | 12 / 16 | 0.1 | 메타 |
| Caption Strong | Outfit Medium | 12 / 15 | 0.1 | |
| Overline | Outfit Medium | 13 / 14 | 1 | **UPPERCASE** |
| XXL 80 | Outfit Light | 80 / 66 | −2.6 | 홈 Weather Card · 6.1 프로필 기온, `tabular-nums` |
| Numeric/XL | Outfit Light | 72 / 66 | −2.6 | 2.6 시각 "6:40" 등, `tabular-nums` |
| Numeric/Timer | Fraunces SemiBold | 52 / 58 | 2 | 5.1/5.2 진행 링 안 타이머 숫자, `tabular-nums` |
| Numeric/L | Outfit | 28 / 31 | — | |
| Numeric/M | Outfit | 17 / 21 | — | |
| Numeric/S | Outfit | 12 / 15 | — | |
| Statement | Outfit Medium | 24 / 29 | — | 스토리카드 문장 |
| Button/L | Outfit Medium | 17 / 22 | — | |
| Button/M | Outfit Medium | 15 / 20 | — | |
| Tab label | Outfit | 11 / 13 | 0.2 | 세그먼트 탭 |
| **Nav label** | Outfit Regular | 11 / 13 | **−0.2** | TabBar 라벨 |
| Wordmark | Outfit Medium | 34 / 36 | −1.2 | 로고 |
| Wordmark/Compact | Outfit Medium | 24 / 26 | −0.8 | 헤더용 작은 로고(Logo Compact, 1.2) |
| Auth label | Outfit Medium | 20 / 24 | −0.2 | Auth Button 제목(버튼 높이의 43%) |
| Body/Letter | Outfit Regular | 15 / 22 | −0.05 | 1.1b 편지 본문만(Figma에서는 스타일 없는 텍스트) |
| Handwriting | Gaegu Bold | 20 / 24 | 0 | 1.1b 편지 서명만 |
| Tagline | Outfit | 11 / 14 | 2.4 | UPPERCASE |

> **글자 잘림 방지(코드)**: 줄 높이가 글꼴 자체 높이보다 작은 스타일(Title/M 18/18 · Overline 13/14 · Display/XL 46/49 · Display/L 34/37 · 큰 숫자 등)은 `Text`가 글꼴 자체 줄 높이로 그리고 위아래 음수 여백으로 줄여, 자리 높이는 토큰 그대로 두면서 글자 위 · 아래(g · y · p)가 잘리지 않게 한다.

- 한글(Noto Sans KR): line-height 1.6 (16px 이상은 1.55), letter-spacing −0.2 ~ −0.4px.
- 숫자는 모두 `font-variant-numeric: tabular-nums`.
- 홈 Display/XL 제목은 **두 톤**: 앞 단어 `fg/default`, 날씨 단어(예: "Rainy")는 Gradient/Sunset linear 텍스트 채움 또는 `fg/accent`.

### 2.7 효과 스타일 — Elevation & Blur

그림자 색은 모두 `#1A1A21`. 화면마다 제각각이던 그림자·블러 13종을 아래 12개 스타일로 통합했다.

| 스타일 | 값 | 사용처 |
|---|---|---|
| Elevation/1 Low | y4 blur12 · 6% | Soft IconButton, 작은 칩 |
| Elevation/2 Raised | y6 blur18 · 12% | White 버튼, ETA 칩, 지도 핀 |
| Elevation/3 Float | y10 blur30 · 8% | CreateFAB |
| Elevation/4 Overlay | y12 blur32 · 14% | Done 배너, 떠 있는 패널 |
| Elevation/Sheet | y−8 blur30 · 12% | 바텀시트 |
| Blur/Glass S · M · L · XL | background blur 12 · 16 · 20 · 24 | Counter(S), Glass 버튼·칩(M), 8.3 Top band·Action bar(L), 패널(XL) |
| Surface/Glass bar | Blur XL + Elevation 3 | TabBar Glass bar |
| Surface/Glass card | Blur L + Elevation 3 | Weather Card |
| Surface/Glass panel | Blur XL + Elevation 4 | 유리 패널(현재 화면 미사용) |

- 코드: `--shadow-1…4`, `--shadow-sheet`, `--blur-s/m/l/xl`(backdrop-filter)로 정의한다. 유리 면 = `glass/surface` + blur.
