# App Store 심사 사전 점검 (iOS)

- 점검일: 2026-11-26 · 기준 커밋: `1bf8276` (브랜치 `claude/fervent-pasteur-5um9qp`)
- 범위: 코드·설정 정적 점검. **이 점검에서는 코드를 고치지 않았다.** 11 · 12번은 고칠 곳과 방법만 적었다.
- 프로젝트는 Expo CNG(Continuous Native Generation)라 `ios/` 폴더가 없다. Info.plist · Xcode 설정은 `app.json` · `app.config.ts` · 각 Expo 플러그인이 빌드할 때 만든다. 그래서 근거는 그 설정 파일과 플러그인 소스다.
- 판정: **통과** = 지금 상태로 문제없음 · **위험** = 리젝트되거나 심사에서 지적될 수 있음 · **해당없음** = 앱에 그 기능이 없음

## 요약

| # | 항목 | 판정 | 한 줄 요약 |
|---|---|---|---|
| 1 | Xcode 26 / iOS 26 SDK, 최소 지원 버전 | 통과 (빌드 로그 확인 권장) | EAS 기본 이미지로 빌드한 9 · 10번이 TestFlight에 올라감. 최소 iOS 16.4 |
| 2 | 권한 문구 | **위험** | 쓰지 않는 "항상 위치" · "동작(Motion)" 권한 문구가 일반 문구로 자동으로 들어감 |
| 3 | 앱 내 계정 삭제 | 통과 | 설정 → 계정 → 계정 삭제, 서버에서 삭제하고 Apple 토큰 해지 |
| 4 | Sign in with Apple | 통과 | Google과 함께 Apple 로그인 제공 |
| 5 | 인앱결제 | 해당없음 | 유료 상품 · 구독 없음 |
| 6 | 개인정보처리방침 · ATT | **위험** | 개인정보처리방침 · 이용약관 링크가 비어 있음. 추적 SDK 없음(ATT 불필요) |
| 7 | UGC 신고 · 차단 · 필터 | 통과 (링크 빈칸 주의) | 신고 · 차단 · 금칙어 필터 · 24시간 처리 큐 있음. 커뮤니티 가이드라인 링크는 비어 있음 |
| 8 | 테스트 문구 · 더미 · 깨진 URL · 디버그 로그 | **위험** | "Coming before launch" 안내가 실제로 노출됨(6번과 같은 원인). 그 밖은 낮은 위험 |
| 9 | 네트워크 실패 · 권한 거부 | **위험 (낮음)** | 스플래시에서 오류가 나면 멈출 수 있음, 프로필 편집 로딩 무한 대기 가능 |
| 10 | iPad | 통과 | iPhone 전용(`supportsTablet: false`). iPad에서는 iPhone 호환 모드로 실행 |
| 11 | 언어별 텍스트 잘림 | **위험 (낮음)** | 375pt 폭 iPhone에서 일본어 탭 라벨 2개가 1px 넘침. 수정 안 함(아래 계획) |
| 12 | 닉네임(@handle) 변경 주기 30일 → 14일 | 변경 필요 (수정 안 함) | 서버 트리거 · 앱 상수 · 9개 언어 문구 · 문서 4곳을 함께 바꿔야 함 |

---

## 1. Xcode 26 / iOS 26 SDK 빌드 설정, 최소 지원 버전 — 통과 (확인 권장)

| 점검 | 결과 | 근거 |
|---|---|---|
| 빌드 환경 | `eas.json`에 `image` 지정이 없어서 SDK 58의 EAS 기본 macOS/Xcode 이미지로 빌드한다. 2026-11-26 빌드 9 · 10번이 App Store Connect 업로드와 TestFlight 배포까지 됐다. App Store Connect는 기준에 맞지 않는 SDK로 만든 빌드의 업로드를 거부하므로, 지금 이미지는 요건을 충족하는 것으로 본다. | `eas.json` · EAS 빌드 9(`3f5a3aa7-…`) |
| Expo / RN 버전 | Expo SDK 58 (`expo ~58.0.23`), React Native 0.88.1 | `package.json` |
| 최소 지원 iOS | **16.4**: Expo SDK 58 템플릿의 `IPHONEOS_DEPLOYMENT_TARGET`. RN 0.88 자체 최소는 15.1. `expo-build-properties`로 바꾼 값은 없음 | `node_modules/expo/template.tgz` → `ios/HelloWorld.xcodeproj/project.pbxproj` · `node_modules/react-native/scripts/cocoapods/helpers.rb:84` |
| 암호화 신고 | `ITSAppUsesNonExemptEncryption: false` | `app.json` › `ios.infoPlist` |
| 개인정보 매니페스트 | `privacyManifests` 있음(`NSPrivacyTracking: false`, API 사용 이유 4개, 수집 데이터 유형 선언) | `app.json` › `ios.privacyManifests` |

- 확인할 것: EAS 빌드 로그 맨 앞의 "Xcode version"이 26.x인지 한 번 확인한다(expo.dev → Builds → 빌드 9 → Logs).

## 2. Info.plist 권한 문구 — 위험

빌드할 때 Expo 플러그인이 만드는 권한 문구다. 값을 지정하지 않은 키에는 플러그인의 일반 기본 문구("Allow $(PRODUCT_NAME) to …")가 들어간다.

| 키 | 문구 | 실제 사용 | 판정 | 근거 |
|---|---|---|---|---|
| NSLocationWhenInUseUsageDescription | "ongdalsaem uses your rough location to show today’s weather and dishes cooked nearby. Your exact location is never shown to others." | 사용 (`requestForegroundPermissionsAsync`) | 통과 | `app.json` plugins › expo-location · `src/services/location.ts:28` |
| NSLocationAlwaysAndWhenInUseUsageDescription · NSLocationAlwaysUsageDescription | 기본 문구 "Allow $(PRODUCT_NAME) to access your location" | **사용 안 함**(백그라운드 위치 없음) | **위험**: 쓰지 않는 권한 + 구체적이지 않은 문구(5.1.1) | `node_modules/expo-location/plugin/build/withLocation.js:80,226-235` |
| NSMotionUsageDescription | 기본 문구 "Allow $(PRODUCT_NAME) to detect your current motion activity" | **사용 안 함** | **위험**: 쓰지 않는 권한 | 같은 파일 `:81,230` |
| NSLocationTemporaryUsageDescriptionDictionary | expo-location 기본 정확한 위치 문구 | 사용 안 함(`Accuracy.Low`만 씀) | 위험(낮음) | 같은 파일 `:192` · `src/services/location.ts:31` |
| NSCameraUsageDescription | "ongdalsaem uses the camera so you can take a photo of your dish." | 사용 (공유 사진 촬영) | 통과 | `app.json` plugins › expo-image-picker · `app/share/pick.tsx:91-93` |
| NSPhotoLibraryUsageDescription | "ongdalsaem uses your photos so you can share dishes you cooked or ate." | 사용 | 통과 | `app.json` plugins › expo-image-picker / expo-media-library · `app/share/pick.tsx:72` |
| NSMicrophoneUsageDescription | 없음(`microphonePermission: false`) | 사용 안 함 | 통과 | `app.json` |
| NSPhotoLibraryAddUsageDescription | 없음(`savePhotosPermission: false`) | 앨범 저장 없음(공유 시트 사용) | 통과 | `app.json` · `src/components/dish/ShareSheet.tsx:44-47` |
| NSUserTrackingUsageDescription | 없음 | 추적 없음 | 통과 | 6번 참고 |
| 알림 | Info.plist 문구 불필요. Time Sensitive 권한은 `app.config.ts`가 추가 | 사용 | 통과 | `app.config.ts` |

- 고치는 방법(아직 안 고침): `app.json`의 expo-location 플러그인 옵션에 `"locationAlwaysAndWhenInUsePermission": false`, `"locationAlwaysPermission": false`, `"motionUsagePermission": false`를 넣으면 키가 빠진다. 정확한 위치를 요청하지 않으면 `"locationFullAccuracyPermission": false`도 넣는다. 네이티브 설정이라 새 빌드가 필요하다.
- 확인할 것: 빌드된 `.ipa`의 Info.plist에서 위 키가 실제로 빠졌는지 확인한다.

## 3. 앱 내 계정 삭제 — 통과

| 점검 | 결과 | 근거 |
|---|---|---|
| 진입 경로 | 설정 → 계정 및 보안 → Danger 그룹 "Delete account" | `app/settings/account.tsx:23-24` |
| 삭제 처리 | 확인 창 → `deleteMyAccount()` → 서버 함수로 계정 · 파일 삭제, 실패하면 안내 | `app/settings/delete.tsx:29-45` · `supabase/functions/delete-account/` |
| Apple 토큰 해지 | 로그인할 때 받은 Apple 인증 코드를 서버에 보관했다가 삭제할 때 해지 | `src/services/auth.ts:63-67` · `supabase/functions/apple-token/` |
| 로그아웃 후 로컬 데이터 | 기기에 남은 사용자 데이터 정리 | `src/services/auth.ts:100-104` |

## 4. 서드파티 로그인 사용 시 Sign in with Apple — 통과

| 점검 | 결과 | 근거 |
|---|---|---|
| 제공 로그인 | Apple · Google 두 가지(이메일 없음). Apple 버튼이 먼저 나옴 | `app/sign-in.tsx:105-106` |
| Apple 로그인 방식 | iOS 기본 시트 + nonce + `signInWithIdToken` | `src/services/auth.ts:44-73` |
| 버튼 규정 | Auth Button 컴포넌트가 Apple · Google 브랜드 규정을 따름 | `src/components/AuthButton.tsx` · `docs/02-components.md` |
| 예외 빌드 | `FREE_APPLE_TEAM=1`(개인 테스트용)일 때만 Apple 버튼을 숨김. 스토어 빌드는 해당 없음 | `app.config.ts` · `app/sign-in.tsx:19,105` |

## 5. 인앱결제 — 해당없음

| 점검 | 결과 | 근거 |
|---|---|---|
| 결제 · 구독 코드 | StoreKit · RevenueCat · Stripe · 구독 화면 없음. 코드의 "subscription"은 Supabase 인증 이벤트 구독, "PRICE_LEVEL"은 장소의 가격대 표시 | `package.json` · `src/lib/push.ts:110` · `supabase/functions/places-nearby/` |
| 외부 결제 링크 | 없음 | — |
| 구매 복원 · 약관 · 가격 표시 | 판매 상품이 없어 해당없음 | — |

## 6. 개인정보처리방침 링크, ATT — 위험

| 점검 | 결과 | 판정 | 근거 |
|---|---|---|---|
| 앱 안 개인정보처리방침 | 링크가 **비어 있음** → 누르면 "Coming before launch" 안내 시트가 뜬다 | **위험**(5.1.1: 앱 안에서 쉽게 열 수 있는 방침 필요) | `src/lib/legal.ts:12-18` · `app/settings/document.tsx:39-40` |
| 이용약관(EULA) | 로그인 화면의 "Terms" 링크도 비어 있음. UGC 앱은 약관 동의가 필요함 | **위험**(1.2) | `src/lib/legal.ts:13` · `app/sign-in.tsx:97-99` |
| 위치 이용약관 · 커뮤니티 가이드라인 · 도움말 | 모두 비어 있음 | 위험 | `src/lib/legal.ts:15-17` |
| App Store Connect 개인정보처리방침 URL | 앱 밖 설정이라 이 점검에서는 확인 불가 | 확인 필요 | — |
| 추적 SDK · ATT | 광고 · 분석 · 추적 SDK 없음, `NSPrivacyTracking: false` → ATT 요청 불필요 | 통과 | `package.json` · `app.json` |

- 고치는 방법: `src/lib/legal.ts`의 `LEGAL_URLS`에 공개 웹 페이지 주소를 넣는다(en · ko). 같은 개인정보처리방침 주소를 App Store Connect의 앱 정보에도 넣는다.

## 7. UGC 신고 · 차단 · 필터 — 통과 (링크 빈칸 주의)

| 점검 | 결과 | 근거 |
|---|---|---|
| 신고 | 게시물 · 댓글 · 답변 · 메시지 · 사용자 · 질문 신고 | `src/services/moderation.ts:13-39` · `src/services/community.ts:664` · `src/components/dish/ReportSheet.tsx` |
| 차단 | 사용자 차단 · 해제. 차단하면 서로의 콘텐츠가 숨겨짐 | `src/services/moderation.ts:50-56` · `supabase/migrations/20261120000000_security_hardening.sql` |
| 금칙어 필터 | 사용자가 쓰는 공개 텍스트마다 서버 트리거로 걸러 냄(banned_terms) | `supabase/migrations/20261121000000_ugc_safety.sql:2,13` · `src/services/moderation.ts:45` |
| 운영자 처리 | 신고 큐 · 24시간 처리 기한 · 신고 알림 함수 · 조건부 즉시 숨김 | `supabase/migrations/20261030010000_moderation.sql:8` · `supabase/functions/report-alert/` · `…security_hardening.sql:465` |
| 커뮤니티 가이드라인 | 화면은 있지만 링크가 비어 있음(6번과 같음) | `src/lib/legal.ts:16` |

## 8. 테스트 문구 · "준비 중" · 더미 데이터 · 깨진 URL · 디버그 로그 — 위험

| 점검 | 결과 | 판정 | 근거 |
|---|---|---|---|
| "Coming before launch" 안내 | 법률 문서 링크가 비어 있어 실제 사용자에게 노출됨 | **위험**(2.1 미완성) | `src/i18n/en.json` `documents.pendingTitle` · `app/settings/document.tsx:39` |
| "곧 열려요" 빈 상태 | Tables 빈 상태 "New ones open soon." 데이터가 없으면 미완성 기능으로 보일 수 있음 | 위험(낮음): 심사 전에 실제 콘텐츠를 채워 둘 것 | `src/i18n/en.json` `emptyBody` |
| 쓰지 않는 문구 | `share.comingSoon` "Soon": 코드에서 쓰지 않음 | 통과(노출 안 됨) | `src/i18n/en.json:327` |
| 더미 이미지 | `assets/mock/` 9개 파일: 코드에서 참조하지 않아 번들에 안 들어감 | 통과(정리 권장) | `assets/mock/` |
| 개발용 기능 | 테스트 계정 버튼 · 날씨 미리보기는 `__DEV__`에서만 보임 | 통과 | `app/sign-in.tsx` · `src/services/auth.ts:81-90` · `app/dev/weather.tsx` |
| placeholder URL | `https://placeholder.supabase.co`는 환경변수가 없을 때의 대체값. 스토어 빌드에는 EAS 값이 들어감 | 통과 | `src/lib/supabase.ts:18` |
| http:// 주소 | 없음. 외부 주소는 모두 https | 통과 | `src/`, `app/` 검색 |
| 고객 지원 메일 | `app.ongdalsaem@gmail.com`: 실제로 받을 수 있는 주소인지 확인 필요 | 확인 필요 | `src/lib/support.ts:3` |
| 디버그 로그 | `__DEV__` 밖 `console.warn` 12곳(오류 기록용, 개인정보 없음). `console.log` 없음 | 통과(낮음) | `app/sign-in.tsx:59` · `app/(tabs)/home.tsx:57,86` · `app/setup/*.tsx` · `src/services/weather.ts:18` · `src/services/foods.ts:447` 등 |

## 9. 네트워크 실패 · 권한 거부 시 크래시 · 무한 로딩 — 위험 (낮음)

| 위치 | 문제 | 판정 | 근거 |
|---|---|---|---|
| 1.1 스플래시 | `nextRoute().then(...)`에 `.catch`가 없다. 세션 · 저장소 읽기에서 예외가 나면 다음 화면으로 넘어가지 않고 스플래시에 멈춘다 | **위험** | `app/index.tsx:35-42` |
| 9.2 프로필 편집 | 불러오기 실패 시 Alert만 띄우고 `a`가 계속 null → 스피너가 계속 돈다(뒤로 가기는 됨) | 위험(낮음) | `app/settings/edit-profile.tsx:32,35` |
| 사진 선택 | `MediaLibrary.requestPermissionsAsync`에 try/catch가 없다(예외 시 처리 안 된 Promise 거부) | 위험(낮음) | `app/share/pick.tsx:70-78` |
| 카메라 권한 거부 | 거부하면 아무 안내 없이 끝남(크래시는 아님). 설정으로 안내하는 문구가 있으면 좋음 | 통과(UX 개선 여지) | `app/share/pick.tsx:91-92` |
| 위치 권한 거부 | 거부 · 위치 서비스 꺼짐 · 오류 모두 null을 반환하고, 홈은 도시 선택 카드를 보여 줌 | 통과 | `src/services/location.ts:26-36` · `src/components/home/Cards.tsx:116-117` |
| 목록 화면들 | 실패하면 빈 목록 · 오류 상태로 바뀜(무한 스피너 없음) | 통과 | `app/cooks-weather.tsx:27` · `app/viral/[name].tsx:45` · `app/question/[id].tsx:38` |
| 로그인 실패 | 오류를 잡아 안내 문구 표시 | 통과 | `app/sign-in.tsx:48-64` |
| 계정 삭제 실패 | 오류를 잡아 Alert, 버튼 다시 사용 가능 | 통과 | `app/settings/delete.tsx:40-43` |

- 확인할 것: 비행기 모드에서 처음 실행 · 로그인 · 홈 · 공유 · 설정을 한 번씩 열어 본다.

## 10. iPad 지원 — 통과

| 점검 | 결과 | 근거 |
|---|---|---|
| 지원 기기 | `supportsTablet: false` → iPhone 전용. iPad에서는 iPhone 호환 모드(iPhone 크기 창)로 실행되어 레이아웃은 iPhone과 같음 | `app.json` › `ios.supportsTablet` |
| 방향 | 세로 고정 | `app.json` › `orientation: "portrait"` |
| 주의 | 심사는 iPad에서 호환 모드로 진행될 수 있다. Apple 로그인 · 사진 선택 · 공유 시트가 iPad 호환 모드에서 열리는지 한 번 확인 권장 | — |

## 11. 언어별 텍스트 잘림 — 위험 (낮음), 수정 안 함

방법: 9개 언어 JSON에서 영어보다 1.6배 이상 넓은 짧은 라벨을 뽑았다. 공간이 고정된 곳은 실제 글꼴(Outfit · Noto Sans KR)로 폭을 쟀다. ja · th · vi · zh-TW는 기기에서 시스템 글꼴을 쓰므로 비슷한 글꼴로 잰 근사치다.

| 위치 | 결과 | 판정 | 근거 |
|---|---|---|---|
| TabBar 라벨(Nav label 11, 1줄) | 탭 하나의 폭은 390pt 기기에서 69.5pt, 375pt 기기(SE · mini)에서 65.75pt. **ja "コミュニティ" 66.4 · "プロフィール" 66.1**이 375pt 기기에서 약 1pt 넘쳐 말줄임(…)될 수 있다. es "Temporizador" · pt-BR "Comunidade"는 들어감 | 위험(낮음) | `src/components/TabBar.tsx:35,91,213,217,317` · `src/i18n/ja.json` `home.tabs` |
| 타이머 프리셋 칩 | es "Huevo pasado por agua" · id "Telur setengah matang"이 가장 길다. 가로 스크롤 칩이라 잘리지 않고 칩이 길어짐 | 통과(확인 권장) | `src/i18n/es.json` · `src/i18n/id.json` `timer.presets` |
| 날씨 이름 | pt-BR "Predominantemente ensolarado" · id "Malam sebagian besar cerah"가 1줄 칸에서 잘릴 수 있음 | 위험(낮음): 홈 Weather Card · 프로필 헤더 확인 | `src/i18n/*.json` `weatherDetail.*` |
| 짧은 버튼 · 칩 | es "Estado de ánimo"(Mood) · pt-BR "Cartão para compartilhar" · vi "+ Lên kế hoạch" · ja "どのアプリで開きますか？" | 확인 필요 | `share.mood` · `shareSheet.card` · `mealPlan.plan` · `mapApps.title` |
| 1줄 제한 사용처 | `numberOfLines={1}` 112곳, `adjustsFontSizeToFit` 4곳 | — | `app/` · `src/components/` |

- 고치는 방법(아직 안 고침):
  1. 일본어 탭 라벨 줄이기 → 예: "コミュニティ" → "みんな", "プロフィール" → "マイページ". 문구를 바꿀 때는 규칙 8번대로 9개 언어 파일과 `i18n-src/ja.txt`를 함께 맞춘다.
  2. 또는 Nav label에 `adjustsFontSizeToFit` + `minimumFontScale 0.9`를 준다. 디자인 크기를 바꾸는 것이라 Figma 확인이 먼저 필요하다.
  3. 날씨 이름 · 버튼은 Dev Build에서 언어를 바꿔 가며 375pt 시뮬레이터(iPhone SE)로 실제로 확인한 뒤 고칠 곳을 정한다.

## 12. 닉네임(@handle) 변경 주기 30일 → 14일 — 변경 필요, 수정 안 함

"닉네임"은 앱의 **@handle(username)** 이다. 표시 이름(Display name)에는 변경 제한이 없다. 서버가 실제로 막고 앱은 미리 안내만 하므로 **서버와 앱을 함께** 바꿔야 한다.

| 바꿀 곳 | 지금 | 바꿀 내용 | 근거 |
|---|---|---|---|
| 서버 트리거(실제 제한) | `interval '30 days'` | **새 마이그레이션 파일**로 함수를 다시 정의해 `interval '14 days'`로 바꾼다. 이미 적용된 파일은 고치지 않는다(규칙 6번) | `supabase/migrations/20261120000000_security_hardening.sql:50-55` |
| 앱 상수 | `HANDLE_COOLDOWN_DAYS = 30` | `14` | `src/services/settings.ts:29,72` (주석 `:78`도 함께) |
| 입력 안내 문구(9개 언어) | `settings.usernameHelper` "…changeable once every 30 days" | 14일(2주) 문구로 9개 언어 모두 수정 + `i18n-src/*.txt`도 맞춤 | `src/i18n/{en,ko,es,pt-BR,id,ja,th,vi,zh-TW}.json` (en · ko 649행, es · pt-BR 637행, id · ja · th · vi · zh-TW 632행) |
| 제한 중 오류 문구 | `settings.handleCooldown`(다음 가능 날짜만 표시) | 날짜 계산은 상수를 따르므로 문구 수정 불필요 | `app/settings/edit-profile.tsx:40` |
| 문서 | "30일에 1회" | 14일로 수정(문서는 요청이 있을 때만 수정) | `docs/04-screens/09-settings.md:45` · `docs/06-data-model.md:16` · `docs/CHANGELOG.md:455` |

- 참고: 바꾼 뒤 예전 handle을 다른 사람이 못 쓰게 막아 두는 기간 **14일**(`docs/04-screens/09-settings.md:45`)은 별개 규칙이다. 그대로 둘지 결정이 필요하다.
- 순서: ① 마이그레이션을 원격 DB에 적용 → ② 앱 상수 · 문구를 바꾼 빌드 배포. 서버를 먼저 바꾸면 예전 앱에서도 14일이 지나면 저장된다(예전 앱은 30일로 안내만 함).

---

## 심사 제출 전 추가 확인 (앱 밖)

| 항목 | 내용 |
|---|---|
| 심사용 계정 | 로그인해야 쓸 수 있는 앱이다. Apple · Google 로그인만 있으므로 App Review 노트에 "Sign in with Apple로 바로 이용 가능"이라고 적거나, 데모용 Google 계정을 적어 둔다 |
| 개인정보 라벨 | App Store Connect의 "앱 개인정보"를 `app.json`의 `NSPrivacyCollectedDataTypes`(이메일 · 이름 · 사진 · 사용자 콘텐츠 · 대략적 위치 · 사용자 ID 등)와 맞춘다 |
| 지원 URL · 개인정보처리방침 URL | App Store Connect에 필수. 6번의 링크와 같은 주소를 쓴다 |
| 연령 등급 | UGC · 메시지가 있으므로 설문에서 "사용자 생성 콘텐츠"를 고른다 |
