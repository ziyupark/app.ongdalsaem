# ongdalsaem 법률 문서

앱 9.8 Help & policies가 여는 웹 문서 원본이다. 한국어(ko)가 한국 사용자에게 공식본, 그 밖의 언어는 영어(en)를 연다(`src/lib/legal.ts`).

| 문서 | 한국어 | English | `LEGAL_URLS` 키 |
|---|---|---|---|
| 이용약관 | [ko/terms.md](ko/terms.md) | [en/terms.md](en/terms.md) | `terms` |
| 개인정보처리방침 | [ko/privacy.md](ko/privacy.md) | [en/privacy.md](en/privacy.md) | `privacy` |
| 위치기반서비스 이용약관 | [ko/location-terms.md](ko/location-terms.md) | [en/location-terms.md](en/location-terms.md) | `location` |
| 커뮤니티 가이드라인 | [ko/community-guidelines.md](ko/community-guidelines.md) | [en/community-guidelines.md](en/community-guidelines.md) | `guidelines` |
| 도움말 | [ko/help.md](ko/help.md) | [en/help.md](en/help.md) | `help` |

## 게시 전에 채울 것
- `[운영자 성명]` · `[시행일]` 자리표시자 — 모든 문서
- 사업자로 등록하면 상호 · 사업자등록번호 · 주소를 개인정보처리방침 1조와 위치기반서비스 약관 1조에 추가
- 위치정보: 한국에서 위치기반서비스를 제공하려면 **방송통신위원회에 위치기반서비스사업 신고**가 필요하다(위치정보법 제9조). 신고 후 위치 약관의 신고 사항을 채운다.
- 게시: 문서를 웹에 공개(예: Google Docs "웹에 게시" · Notion 공개 페이지 · GitHub Pages)하고 주소를 `src/lib/legal.ts`의 `LEGAL_URLS`와 App Store Connect(개인정보처리방침 URL · 지원 URL)에 넣는다.
- 문서에 적었지만 앱에 아직 없는 것(출시 전에 앱을 맞추거나 문구를 빼야 함):
  - **만 14세 이상 확인**: 가입 화면에 나이 확인이 없다.
  - **알레르기(민감정보) 별도 동의**: 식단 · 알레르기 화면에 별도 동의가 없다.
  - **위치정보 이용 · 제공사실 확인자료 자동 기록(6개월 보관)**: 위치정보법 의무인데 서버에 기록하는 곳이 없다.
- `[서버 리전 국가]`: Supabase 대시보드 › Project Settings › General의 Region으로 채운다.
- 이 문서는 앱 코드와 설정에서 확인한 사실로 쓴 초안이다. 출시 전에 법률 전문가 검토를 권한다.
