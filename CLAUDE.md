# ongdalsaem — 개발 원칙

## 기준
- **디자인은 Figma가 최종 기준**: [ONGDALSAEM-1.0 — Design-System · UI](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI)(file key `GL8f8wHgzzK4GDUffY4NPW`). 화면은 이 디자인 그대로 구현하고, 문서와 Figma가 다르면 Figma를 따른다. `99 Removed in v1` 섹션은 만들지 않는다.
- 기능·이동·데이터의 기준 문서는 `docs/`다. 시작점은 [docs/README.md](docs/README.md).
- 토큰 [01-foundations](docs/01-foundations.md) · 컴포넌트 [02-components](docs/02-components.md) · 이동 [03-ia-and-flows](docs/03-ia-and-flows.md) · 화면 [04-screens/](docs/04-screens/) · 동작 [05-behavior](docs/05-behavior.md) · 데이터 [06-data-model](docs/06-data-model.md)

## 앱 정보
- 이름: 소문자 **ongdalsaem** · 번들 ID / 패키지: **`app.ongdalsaem`** · scheme `ongdalsaem://` · App Group(위젯) `group.app.ongdalsaem`
- 언어: 영어 기본 + 9개 언어(en · ko · es · pt-BR · id · ja · th · vi · zh-TW). 한국 사용자 광고 표기 "(광고)".

## 개발 원칙
1. 새 기능·화면은 docs에 정의된 것만 만든다. 없으면 먼저 확인받는다.
2. **문서는 사용자가 요청할 때만 고친다**(`docs/`, README, CHANGELOG 모두). 작업 결과가 문서와 달라지면 고치지 말고, 어느 문서의 어느 부분이 달라졌는지 작업 끝에 알려준다.
3. 색·글꼴·간격·라운드는 `src/theme` 토큰만 쓴다(HEX 하드코딩 금지, 보라 계열 금지). 글자는 `src/components/Text`만 쓴다.
4. 컴포넌트 크기는 디자인의 변형 크기 그대로(임의로 늘리거나 줄이지 않음). 아이콘 선 두께 = `iconStroke(size)`.
5. 지금 필요 없는 미래 기능을 위해 구조를 미리 복잡하게 만들지 않는다.
6. DB = Supabase. 실제 스키마는 `supabase/migrations/`가 기준(이미 원격 DB에 적용됨 — 적용된 파일은 고치지 않고 새 파일을 추가한다). 스키마를 바꾸면 docs/06-data-model.md와 달라진 점을 알려준다(문서 수정은 2번 규칙대로).
7. `_reference/`는 예전 앱(옛 이름)의 서비스 코드 — 로직을 옮겨 올 때만 참고하고, 옮긴 뒤에는 지운다.
8. **화면 문구는 i18n 키만 쓰고, 문구를 추가·수정할 때는 9개 언어를 같은 작업에서 함께 반영한다.** 9개 `src/i18n/<lang>.json`을 모두 직접 고친다(`i18n-src/*.txt`도 같이 맞춰 둔다). `i18n-src/build.py`는 지금 txt가 JSON보다 뒤처져 있어 돌리면 번역이 지워지니 쓰지 않는다. ja · zh-TW · id · th · vi에는 `_one` 키가 없는 것이 정상이다.
9. **키 · 비밀번호 · 토큰은 절대 코드, 설정 파일, 커밋, 채팅에 붙여넣지 않는다.** 비밀 값은 `.env`(커밋 안 함)에만 두고, 새 값이 필요하면 `.env.example`에 이름만 추가한다.
10. **작업이 끝나면 `npx tsc --noEmit`(= `npm run typecheck`)으로 확인**하고, 오류가 있으면 고친 뒤 결과를 그대로 알린다.

## 플랫폼
React Native(Expo SDK 58, expo-router), iOS 우선 + Android. 소셜 로그인(Apple · Google)과 위젯 때문에 **Dev Build**(expo-dev-client)로 실행한다 — Expo Go 아님.
