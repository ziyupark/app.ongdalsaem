# 대기질 기반 집밥 추천 카드 — 구현 계획 (초안)

> 상태: **계획만 정리함, 코드는 아직 고치지 않음.** 화면 · 문구 · 데이터가 확정되면 이 문서 내용을 02-home · 05-behavior · 06-data-model · 08-share에 옮기고 이 파일은 지운다.
> 레퍼런스 이미지: 유리 카드 · 왼쪽 위 작은 아이콘 + "대기질" · 큰 숫자 "49" · 등급 "좋음" · 파랑→초록→노랑→주황→빨강 막대와 현재 위치 점 · 한 줄 설명 "현재의 대기질 지수는 49 수준으로, 어제 이 시간보다 더 좋습니다."

---

## 0. 먼저 확인받을 것 (막힌 부분)

| # | 내용 | 왜 |
|---|---|---|
| A | **`src/copy/airquality-copy.ko.json` 파일이 저장소에 없음** (작업 트리 · git 이력 모두 없음) | 4번 항목(문구 구조에 맞춘 파일 목록)은 이 파일을 읽어야 끝낼 수 있다. 파일을 올려 주면 §4를 확정한다 |
| B | **Figma에 대기질 카드 디자인이 없음** (디자인 시스템 검색 결과 0개) | CLAUDE.md: Figma가 최종 기준이고, docs에 없는 화면은 확인받고 만든다. 카드 프레임(크기 · 간격 · 막대 색) 먼저 필요 |
| C | 큰 숫자를 **무엇으로 보여 줄지**: ① 통합 지수(US EPA AQI 0–500, 레퍼런스 "49 좋음"과 같은 방식) ② PM2.5 농도(µg/m³) ③ 둘 다 | 등급 기준과 막대 눈금이 달라진다 (§3.4) |
| D | 등급 기준: **한국 환경부 4단계**(좋음 · 보통 · 나쁨 · 매우나쁨) 하나로 갈지, 나라별로 바꿀지 | 앱은 9개 언어 · 전 세계 사용자 |
| E | 카드 위치: Home **Weather card 아래 · 피드 위**(제안) | 02-home은 "Today's pick · Nearby card 없앰"으로 정리돼 있어 새 카드가 들어가는 자리를 문서에 정해야 한다 |
| F | "요리 방식" 태그 입력 위치: 8.2 Details(제안) / 8.2a Recipe | §2.3 |

---

## 1. 기존 날씨 기반 추천 — 위치 · API · 위치 로직

### 1.1 흐름

```
useHere()  ─ src/lib/useHere.ts
  ├─ 위치: services/location.ts  requestDeviceLocation() (expo-location, Accuracy.Low)
  │        └ 권한 없음 · 9.7에서 도시 선택 → profiles.city (status 'off')
  ├─ 지명: reverseGeocodeCity() → BigDataCloud(무료, 키 없음) → 실패 시 OS 지오코더
  └─ 날씨: services/weather.ts  fetchForecast(coords | {city})
            └ supabase.functions.invoke('weather') ─ supabase/functions/weather/index.ts
                └ OpenWeather /data/2.5/weather · /data/2.5/forecast  (키 = 서버 secret OPENWEATHER_API_KEY)

app/(tabs)/home.tsx
  ├─ fetchPool()              services/recommend.ts — 최근 60일 공개 게시물 300개
  ├─ pickForSlot(pool, meal, ctx)  끼니 슬롯 4칸 (05-behavior §6.1)
  └─ <WeatherCard …/>          src/components/home/WeatherCard.tsx
```

### 1.2 알아 둘 점 (대기질에서 그대로 쓸 것)

- **API 키는 앱에 없다.** OpenWeather는 Edge Function `weather`를 통해서만 부른다. 요청 `{ kind: 'current' | 'forecast' | 'geo', lat?, lon?, city? }`.
- **서버 공유 캐시** `public.owm_cache`(key = kind + 쿼리 문자열, 마이그레이션 20261120000000): current 10분 · forecast 30분 · geo 30일.
- **호출 한도** `takeQuotas`: 전체 50회/분(OpenWeather 무료 60/분 안), 사용자당 200회/시간, 로그아웃 상태 IP당 30회/시간.
- **개인정보**: 좌표는 소수 2자리(≈1.1 km)로 반올림해서만 보낸다(`roundCoord`). 정확한 GPS는 보내지도 저장하지도 않는다.
- **한 번 읽어 공유**: `useHere`는 Home · Profile · Community가 같이 쓰는 단일 값, TTL 10분, 앱이 앞으로 올 때 다시 읽음, 마지막 값을 AsyncStorage `here.last`에 저장해 다음 실행 때 바로 보여 줌. 로그인 전에는 읽지 않음(함수가 401).
- **위치 꺼짐(2.5)**: 좌표 없이 `{ city }`로만 날씨를 읽는다. → 대기질 API는 대부분 **좌표가 필요**하므로, OpenWeather current 응답의 `coord`(도시 중심 좌표)를 `CurrentWeather`에 같이 담아 두면 추가 지오코딩 없이 쓸 수 있다.
- 추천 규칙은 서버 없이 **앱에서** 공개 게시물 풀을 점수로 고른다(`recommend.ts`). 날씨 계열(`sameGroup`) → 기온 → 도토리 × 신선도 × 거리 → 취향 보너스.
- 기존 Weather Mood에 `dust`(황사/미세먼지)가 있지만 OpenWeather 날씨 코드 7xx(먼지 · 모래 · 연무)에서만 나온다 — **농도 값은 지금 앱 어디에도 없다.**

---

## 2. 레시피 · 게시물 데이터 구조와 "요리 방식" 태그

### 2.1 구조

레시피와 게시물은 **같은 테이블 `foods`** 한 행이다(레시피 = 집밥 게시물의 선택 항목).

| 열 | 뜻 | 입력 화면 |
|---|---|---|
| `name` · `description` | 요리 이름 · 설명 | 8.2 |
| `dish_type` | `home` · `travel` (travel이면 레시피 없음) | 8.2 Type |
| `meal_type text[]` | 끼니 + vegan · seafood | 8.2 Meal (필수) |
| `mood_tags text[]` | 기본 무드 10개 + 직접 쓴 무드 | 8.2 Mood (필수 1–3) |
| `landscape text` | forest · sea · … (선택 1개, check 제약) | 8.2 |
| `ingredients jsonb` · `steps jsonb` | 재료 · 단계(타이머) | 8.2a |
| `servings` · `cook_minutes` · `difficulty` · `calories` | 인분 · 시간 · 난이도 · 칼로리 | 8.2a |
| `weather_condition` · `temperature_c` | 촬영 시각 · 장소의 날씨(자동) | — |
| `character_tags text[]` | 명절 태그 등 | 자동 |

코드 경로: 태그 목록 `src/lib/tags.ts` → 작성 중 값 `src/lib/shareDraft.ts` → 화면 `app/share/details.tsx`(8.2) · `app/share/recipe.tsx`(8.2a) → 저장 · 읽기 `src/services/foods.ts`(SELECT · insert · update · 수정 모드 prefill · 옛 스키마 fallback) → 추천 `src/services/recommend.ts`(SELECT · `PoolDish`).

### 2.2 제안 — 새 열 `foods.cooking_methods text[]`

```sql
-- supabase/migrations/20261203000000_foods_cooking_methods.sql (새 파일 — 적용된 파일은 고치지 않음)
alter table foods
  add column if not exists cooking_methods text[] not null default '{}'
    check (cooking_methods <@ array['grill','stirfry','panfry','simmer','steam','boil','quick']::text[]);
create index if not exists foods_cooking_methods_idx on foods using gin (cooking_methods);
```

| 키 | ko | 실내 미세먼지 발생(조리 연기) |
|---|---|---|
| `grill` | 굽기 | 많음 |
| `stirfry` | 볶기 | 많음 |
| `panfry` | 부치기 | 많음 |
| `simmer` | 끓이기 | 적음 |
| `steam` | 찌기 | 적음 |
| `boil` | 삶기 | 적음 |
| `quick` | 간단 요리 | 거의 없음 |

- `mood_tags` · `meal_type`에 섞지 않고 **열을 따로** 둔다 — 무드는 직접 입력 단어가 섞이고 "1–3개 필수" 규칙이 있어서, 섞으면 검사 · 취향 보너스가 꼬인다. `landscape`처럼 check 제약으로 키를 고정.
- 여러 개 선택(예: 볶은 뒤 끓이기). 선택 사항, Home-cooked일 때만.

### 2.3 입력 위치

- **제안: 8.2 Details, Landscape 아래 · Recipe 위** — `FieldHead "요리 방식" · optional` + `Chip` 7개(기존 `MEAL_TAGS`와 같은 방식). 레시피를 안 쓰는 사람도 한 번 탭으로 고를 수 있어 추천에 쓸 데이터가 빨리 쌓인다.
- 대안: 8.2a Recipe의 Cook time · Difficulty 옆. 화면은 더 자연스럽지만 레시피를 여는 사람만 고르게 되어 태그가 적게 모인다.
- 아이콘: `src/components/icons/ongdal`에 있는 Lucide에서 고른다(예: Flame · CookingPot · Soup · Droplets · Zap) — Figma에서 확정.
- 태그 없는 옛 게시물: 처음에는 **추천에서 방식 가중치만 빠지고**(감점 없음) 기존 날씨 규칙으로 고른다. 이름 · 단계 키워드로 자동 추정(allergens.ts 방식)은 데이터가 부족할 때 2단계로 검토.

---

## 3. 대기질 데이터 출처

### 3.1 후보 비교 (PM10 · PM2.5 농도 제공 우선)

| 후보 | PM10/PM2.5 농도 | 범위 · 방식 | 비용 · 키 | 어제 같은 시간 | 장점 | 단점 |
|---|---|---|---|---|---|---|
| **OpenWeather Air Pollution** `/data/2.5/air_pollution` (+ `/forecast`, `/history`) | ✅ µg/m³ (+ CO · NO₂ · O₃ · SO₂ · NH₃) | 전 세계, 좌표, 모델값(CAMS 기반) | **지금 쓰는 키 그대로**, 무료 플랜 포함 | ✅ `history`(start · end) | 기존 `weather` 함수 · `owm_cache` · 한도를 그대로 확장, 9개 언어 모든 나라에서 동작, 새 키 · 새 계약 없음 | 측정소 실측이 아니라 모델값 → 한국 공식 수치와 다를 수 있음. 제공 지수는 1–5 단계라 등급은 앱에서 직접 계산 |
| **에어코리아**(한국환경공단, 공공데이터포털) | ✅ 실측 µg/m³ + 공식 등급 | **한국만**, 측정소 단위 | 무료, 서비스키 필요, 개발계정 일일 호출 제한(운영 신청으로 늘림) | △ 측정소별 시간 자료로 비교 가능 | 한국 사용자에게 가장 정확 · 공식 기준 | 해외 사용자 지원 불가, 좌표 → TM 좌표 → 근처 측정소 조회가 따로 필요, 응답 지연 · 점검 시간 있음 |
| **Open-Meteo Air Quality** | ✅ 시간별 µg/m³ + European/US AQI | 전 세계, 모델값(CAMS) | 키 없음, 무료는 **비상업 용도만**(상업은 유료 플랜) | ✅ `past_days` | 응답 간단, 지난 시간 · 예보 한 번에 | 상업 앱이면 유료 계약 필요, OpenWeather와 같은 모델 계열이라 정확도 이득 적음 |
| **Google Air Quality API** | ✅ 농도 + 지역 지수(한국 지수 포함) + 건강 조언 | 전 세계, 고해상도 | 유료(호출당 과금) — 서버에 이미 Places 키 있음 | ✅ history | 품질 · 나라별 지수 제공이 가장 좋음 | 비용, Google 표시 요건 |
| **WAQI (aqicn.org)** | ✗ 주로 **AQI 부분 지수**(농도 아님) | 전 세계 측정소 | 무료 토큰, 출처 표기 · 비상업 조건 | △ | 측정소 실측 | 요구 조건(농도) 불충족, 이용 조건 제약 |
| **IQAir AirVisual** | △ 무료는 PM2.5 중심 US AQI | 전 세계 | 무료 커뮤니티 키 호출 제한 엄격 | ✗ (무료) | 인지도 | 무료 범위 좁음, PM10 부족 |

### 3.2 추천

1. **1단계: OpenWeather Air Pollution** — 새 키 · 새 서비스 없이 `weather` Edge Function에 kind만 추가해 바로 붙일 수 있고 전 세계에서 동작한다. 원 농도(PM10 · PM2.5)를 받아 등급은 앱 규칙으로 계산한다.
2. **2단계(선택)**: 한국 정확도가 문제가 되면 `countryCode === 'KR'`일 때만 에어코리아로 바꾸는 서버 분기 추가(서비스키는 서버 secret).

### 3.3 서버 — `supabase/functions/weather/index.ts` 확장

- `kind: 'air'` → `/data/2.5/air_pollution?lat&lon` · TTL **30분**(OpenWeather 갱신 주기가 대략 1시간)
- `kind: 'air_history'` → `/data/2.5/air_pollution/history?lat&lon&start&end` — 어제 같은 시각 ±1시간, `start`를 **정시로 내림**해 캐시 키가 모이게 하고 TTL **6시간**
- 좌표 필수(도시 이름 불가) → 위치 꺼짐이면 forecast 응답의 `coord` 사용
- 캐시 · 한도는 기존 `owm_cache` · `takeQuotas` 그대로(새 테이블 · 새 마이그레이션 없음). 화면당 호출이 1→3회로 늘어나므로 사용자당 한도(200/시간)는 충분, 전체 50/분 한도는 사용자 수에 따라 다시 볼 것.

### 3.4 등급 계산 (확인 C · D에 따라)

한국 환경부 기준(µg/m³, 제안):

| 등급 | PM10 | PM2.5 |
|---|---|---|
| 좋음 | 0–30 | 0–15 |
| 보통 | 31–80 | 16–35 |
| 나쁨 | 81–150 | 36–75 |
| 매우나쁨 | 151+ | 76+ |

- 카드 등급 = 두 값 중 **나쁜 쪽**.
- 큰 숫자를 지수(레퍼런스 "49")로 보여 준다면 US EPA AQI 구간 계산을 쓰고, 막대 눈금은 0–300(+)으로. 이때 US AQI의 "매우 나쁨" 보라색은 **보라 계열 금지** 규칙에 걸리므로 진한 빨강 계열 토큰으로 대신한다.
- 어제 비교 문장: 현재 값 vs 어제 같은 시각 값 차이가 기준(예: 5 µg/m³ 또는 지수 5) 안이면 "비슷", 아니면 "더 좋음 / 더 나쁨". 어제 값이 없으면 비교 문장 없이 등급 설명만.

### 3.5 추천 규칙 (05-behavior에 새 §으로 추가할 내용)

- **나쁨 · 매우나쁨** → 창문을 닫고 요리하는 날: `steam` · `boil` · `simmer` · `quick` 요리에 가중치, `grill` · `stirfry` · `panfry`는 뒤로.
- **좋음 · 보통** → 환기하기 좋은 날: 방식 가중치 없음(또는 `grill` · `panfry` 소폭 가중).
- 후보 = 기존 `pickToday` 풀(내 요리 제외 · 식단/알레르기 제외 · 날씨 계열 우선) 위에 방식 가중치를 곱한다. **날씨 규칙을 이기지 않는다**(취향 보너스와 같은 원리).
- 태그 있는 후보가 없으면 방식 가중치 없이 기존 규칙으로 고른다(카드가 비지 않게).
- 대기질을 못 읽으면 카드 숨김(2.6처럼 빈 카드를 남길지는 Figma로 확정).

---

## 4. 문구 파일 구조대로 구현할 때 바꿀 파일

> ⚠️ `src/copy/airquality-copy.ko.json`이 없어 **키 구조는 아직 반영하지 못했다.** 아래는 지금 코드 기준으로 반드시 바뀌는 파일이고, 문구 파일을 받으면 i18n 키 이름과 비교 문장 분기(좋음/비슷/나쁨, 어제 값 없음 등)를 맞춰 확정한다.
>
> 규칙 8 때문에 `src/copy/*.json`을 앱이 **직접 읽게 하지 않는다.** 내용을 9개 `src/i18n/<lang>.json`의 새 네임스페이스(예: `airQuality.*`, 태그는 `cookingMethod.*`)로 옮기고, ko 파일은 원본으로만 쓴 뒤 지운다(또는 남길지 확인).

### 새 파일

| 파일 | 내용 |
|---|---|
| `supabase/migrations/20261203000000_foods_cooking_methods.sql` | §2.2 |
| `src/services/airQuality.ts` | `fetchAirQuality(coords)` → `{ pm10, pm25, grade, index?, yesterday? }`, 등급 · 비교 계산 (`owm()` 재사용) |
| `src/components/home/AirQualityCard.tsx` | 레퍼런스 카드 + 추천 요리 1개(썸네일 · 이름 → 7.1). 글자는 `Text`만, 색 · 간격 · 라운드는 토큰만 |

### 고칠 파일 — 코드

| 파일 | 바뀌는 점 |
|---|---|
| `supabase/functions/weather/index.ts` | `kind: 'air' · 'air_history'`, TTL, 좌표 필수 검사, 상단 주석 |
| `src/services/weather.ts` | `CurrentWeather`에 `coord` 추가(위치 꺼짐일 때 대기질 좌표) |
| `src/lib/useHere.ts` | `Here`에 `air` 추가, `read()`에서 날씨와 병렬로 읽기, `here.last`에 저장 |
| `src/lib/tags.ts` | `COOKING_METHODS` 7개 + 아이콘, `cookingMethodIcon()` |
| `src/lib/shareDraft.ts` | `cookingMethods: string[]` 기본값 `[]` |
| `app/share/details.tsx` | 요리 방식 칩 줄(Home-cooked일 때만) — 또는 `app/share/recipe.tsx`(확인 F) |
| `app/share/preview.tsx` | 8.3 미리보기에 보여 줄지 결정 후 반영 |
| `src/services/foods.ts` | SELECT · insert · update에 `cooking_methods`, 수정 모드 prefill, 옛 스키마 fallback(466행 근처)에서 새 열 제거 |
| `src/services/recommend.ts` | `SELECT` · `PoolDish.methods`, `pickForAir()`(§3.5) |
| `app/(tabs)/home.tsx` | Weather card와 피드 사이에 `AirQualityCard`, 추천 계산 |
| `app/dish/[id].tsx` | 7.1에 요리 방식 표시 여부(확인 필요) |
| `src/theme/colors.ts` · `src/theme/gradients.ts` | 대기질 막대 그라데이션 · 등급 색 토큰(HEX는 토큰 파일에만, 보라 제외) |
| `src/i18n/{en,ko,es,pt-BR,id,ja,th,vi,zh-TW}.json` | `airQuality.*`(제목 · 등급 4개 · 설명/비교 문장 · 추천 줄 · 출처) + `cookingMethod.*` 7개 + `share.cookingMethod`. ja · zh-TW · id · th · vi는 `_one` 없음 |
| `i18n-src/*.txt` | 위와 같은 키 맞춰 두기(`build.py`는 돌리지 않음) |

### 고칠 파일 — 문서 (구현하는 작업에서 같이)

| 문서 | 고칠 부분 |
|---|---|
| `docs/04-screens/02-home.md` | 홈 공통 레이아웃에 블록 추가, 2.5 · 2.6 · 2.7 상태에서의 모습 |
| `docs/04-screens/08-share.md` | 8.2(또는 8.2a)에 요리 방식 줄 |
| `docs/05-behavior.md` | 새 § 대기질 추천 규칙(§3.4 · §3.5) |
| `docs/06-data-model.md` | `Dish.cookingMethods` · DB 열 · 대기질 읽기(앱 저장 없음, 서버 캐시만) |
| `docs/01-foundations.md` · `docs/02-components.md` | 막대 그라데이션 토큰 · Air Quality Card 컴포넌트 |
| `docs/07-assets-licenses.md` | 대기질 데이터 출처 표기(OpenWeather) |
| `docs/CHANGELOG.md` | 맨 위 항목 |

---

## 5. 작업 순서 제안

1. 확인 A–F 답 받기 · Figma 카드 프레임
2. 마이그레이션 + 태그 입력(8.2) — 데이터가 먼저 쌓이도록
3. Edge Function `air` · `air_history` 배포 → `airQuality.ts` → `useHere`
4. `AirQualityCard` + 추천 규칙 + 9개 언어
5. 문서 반영 · `npm run typecheck`
