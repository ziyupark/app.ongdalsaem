# 07 · Assets & licenses

> 폰트·아이콘·사진·브랜드 로고 출처와 라이선스, 출시 요건 조사 출처. 색인 → [README](README.md)

## 10. 에셋 · 라이선스

- **사진**: Unsplash(Unsplash License, 무료 상업 사용, 출처 표기 권장). Figma "Assets & Licenses" 페이지에 `kit:<key>` 39장 + 크레딧. 구현 시 Figma에서 export하거나 동일 사진을 Unsplash API로 사용.
- **아이콘**: Lucide — ISC License(일부 Feather 파생 MIT). 상업 사용 가능, 라이선스 고지 유지.
- **폰트**: Fraunces, Outfit, Noto Sans KR, Gaegu(JIKJI SOFT, 손글씨) — 모두 SIL Open Font License 1.1 (Google Fonts). 앱에 번들하고 9.8 Open-source licenses에 고지한다.
- **아바타 사진**: 다른 사용자 11명(Minji · Jae · Sora · Hana · Dongwoo · Aoi · Kenji · Yuki · Luca · Sol · Dae)은 Figma AI(gemini-3.1-flash-lite-image)로 만든 **가상 인물** 사진이다(실존 인물 아님, 초상권 대상 없음). 원본은 Figma "Assets & Licenses" 페이지의 "Avatar photos" 프레임(`photo:avatar-<이름>`). 내 프로필(Jiyu)은 `photo:avatar-me`. 실제 서비스에서는 사용자가 올린 프로필 사진으로 바뀐다.
- **(옛) 1.1b 편지 화면** — 지금 앱은 앱 소개 화면으로 바뀌어 쓰지 않음: 외부 레퍼런스에서 "손글씨 편지로 맞이하는 화면"이라는 아이디어만 참고했다. 구체적인 배치·장식·문구는 새로 만들었다. 일러스트는 자체 다람쥐 Ongi(가이드 `guides/squirrel-weather-mood-prompts.pdf`)이고 출처가 있는 외부 이미지 에셋은 쓰지 않았다.
- **앱 번들 에셋(00–01)**: Figma에서 내보낸 파일 — `assets/images/welcome.png`(1.2 photo:welcome, Unsplash) · `assets/ongi/ongi_clear.png`(옛 1.1b, 지금 미사용) · `assets/weather3d/weather3d_clear.png`(1.4 오브 · 앱 소개) · `assets/weather3d/{mood}@2x.png` · `@3x.png` 18종(큰 날씨 아이콘, Figma Weather 3D 1037:228 — Figma AI로 만든 자체 이미지, 외부 저작권 없음) · `assets/brand/acorn-symbol.svg` · `assets/icons/acorn.svg` · `assets/brand/logo-apple.svg` · `assets/brand/logo-google.svg`. 받는 방법: `bash scripts/fetch-figma-assets.sh`(Figma 링크는 7일 뒤 만료 → 다시 내보내기).
- **커스텀**: acorn · acorn-color · heart-filled 아이콘, ongdalsaem 워드마크 — 자체 제작(squirrel 얼굴 아이콘은 쓰는 곳이 없어 삭제, 다람쥐 Ongi 일러스트는 별도 가이드). squirrel은 특정 캐릭터·마스코트를 참고하지 않은 기본 도형(원·귀·눈·입)으로 그렸다.
- **명절 페이지 사진**(4.2 명절 헤더, 99의 4.12 참고): 지금은 다른 요리 사진을 쓴 **자리표시자**. 출시 전 라이선스가 확인된 사진(Unsplash 등)으로 바꾸고 이 목록에 추가한다. 명절 이름·음식 이름은 일반 명사라 저작권 대상이 아니다. 영화·만화 캐릭터(호박 캐릭터, 산타 캐릭터 상품 등)는 그리지 않는다.
- **국기 이미지**(Flag Tag): Wikimedia Commons 국기 — 퍼블릭 도메인(googlefonts/noto-emoji `third_party/region-flags`의 LICENSE 확인). 상업 사용 가능, 표기 의무 없음(9.8 라이선스 화면에 출처만 적어 둔다).
- **대기질 데이터**: 같은 OpenWeather 키의 Air Pollution API(무료 플랜 포함) — Home 대기질 카드에 "출처 OpenWeather · {시각} 기준"을 직접 표기하고, 아래 9.8b · 9.8 표기("Weather data by OpenWeather")도 그대로 덮는다.
- **날씨 데이터 출처 표기**: OpenWeather 무료 플랜은 출처 표기 조건이 있다 — **9.8b** Open-source licenses의 DATA SOURCES와 9.8 하단 캡션에 "Weather data by OpenWeather" 표기(링크 포함).
- **레퍼런스 앱(Moonly · Hungi 등)**: 구조·아이디어만 참고하고, 화면 배치·문구·아이콘·일러스트를 복제하지 않는다(완전 복사 금지).
- 라이선스 프레임: [92:2994](https://www.figma.com/design/GL8f8wHgzzK4GDUffY4NPW/ONGDALSAEM-1.0-%E2%80%94-Design-System---UI?node-id=92-2994)

**9.8 Help & policies 가이드**: [guides/9.9-help-policies-guide.pdf](guides/9.9-help-policies-guide.pdf) — 각 행이 여는 화면, 무료 호스팅, 법적 체크, 출처.

**Settings 출시 요건 참고 자료**(2026-10 조사, 출시 전 최신 법령·정책을 다시 확인할 것)
- [Apple App Review 5.1.1(v) Account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- [Google Play — app account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [앱 푸시 운영: 수신 권한과 광고 동의(정보통신망법 제50조 해설)](https://www.digitalmarketer.co.kr/class/app-marketing-campaigns/push-notification-operations)
- [광고성 정보 수신 동의 여부 정기 확인(2년)](https://help.stibee.com/tip/agree-to-receive-advertising-information)
- [위치기반서비스 이용약관 예시](https://polle.com/policy/location)
- [14세 미만 아동 개인정보 별도 동의](https://www.lawtalk.co.kr/posts/65681)

**소셜 로그인 브랜드 규정 참고 자료**
- [Apple HIG — Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- [Sign in with Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines)
- 로고 벡터 출처: Wikimedia Commons의 Apple logo(black) · Google "G" logo SVG. 출시 빌드에서는 Apple Design Resources와 Google 공식 다운로드 번들의 원본 파일로 교체할 것.
