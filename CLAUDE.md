# ongdalsaem — 개발 원칙

## 기준
- `docs/`가 유일한 기준 문서다. 시작점은 [docs/README.md](docs/README.md).
- 디자인: Figma [ONGDALSAEM-1.0 — Design-System · UI](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI) — 화면은 이 디자인 그대로 구현한다. `99 Removed in v1` 섹션은 만들지 않는다.
- 토큰 [01-foundations](docs/01-foundations.md) · 컴포넌트 [02-components](docs/02-components.md) · 이동 [03-ia-and-flows](docs/03-ia-and-flows.md) · 화면 [04-screens/](docs/04-screens/) · 동작 [05-behavior](docs/05-behavior.md) · 데이터 [06-data-model](docs/06-data-model.md)

## 앱 정보
- 이름: 소문자 **ongdalsaem** · 번들 ID / 패키지: **`app.ongdalsaem`** · scheme `ongdalsaem://` · App Group(위젯) `group.app.ongdalsaem`
- 언어: 영어 기본 + 다국어(i18n 키). 한국 사용자 광고 표기 "(광고)".

## 개발 원칙
1. 새 기능·화면은 docs에 정의된 것만 만든다. 없으면 먼저 확인받는다.
2. 기능·화면·데이터가 문서와 다르면 문서를 먼저 고치고 그에 맞춰 개발한다.
3. 색·글꼴·간격·라운드는 `src/theme` 토큰만 쓴다(HEX 하드코딩 금지, 보라 계열 금지). 글자는 `src/components/Text`만 쓴다.
4. 컴포넌트 크기는 디자인의 변형 크기 그대로(임의로 늘리거나 줄이지 않음). 아이콘 선 두께 = `iconStroke(size)`.
5. 지금 필요 없는 미래 기능을 위해 구조를 미리 복잡하게 만들지 않는다.
6. DB = Supabase. 실제 스키마는 `supabase/migrations/`가 기준(이미 원격 DB에 적용됨 — 적용된 파일은 고치지 않고 새 파일을 추가한다). 스키마를 바꿀 때는 docs/06-data-model.md를 먼저 갱신한다.
7. `_reference/`는 예전 앱(옛 이름)의 서비스 코드 — 로직을 옮겨 올 때만 참고하고, 옮긴 뒤에는 지운다.

## 플랫폼
React Native(Expo SDK 58, expo-router), iOS 우선 + Android. 소셜 로그인(Apple · Google)과 위젯 때문에 **Dev Build**(expo-dev-client)로 실행한다 — Expo Go 아님.
