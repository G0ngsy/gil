# 설치형 웹앱 설정 누락 보완

## 문제
사용자가 다른 PWA처럼 길빛을 설치하려 했으나 링크 공유/바로가기만 된다고 보고했다. 기존 코드는 favicon만 있고 manifest·설치 PNG 아이콘·설치 UI·서비스워커가 없었다. 이전에 Chrome 메뉴만 안내해 설치형 앱 설정 누락을 확인하지 못했다.

## 원인
웹페이지를 공유/홈 화면 바로가기로 만드는 기능과 설치형 웹앱 메타데이터를 혼동했다. 브라우저별 설치 기준·프로모션 시점도 다르다. [Google 설치 가이드](https://web.dev/learn/pwa/installation), [Chrome 설치 기준 변경 안내](https://developer.chrome.com/blog/update-install-criteria)를 확인했다. manifest와 정적 오프라인 안내를 구성하며 설치/오프라인 길찾기를 구분한다.

## 해결방법
루트 id/scope/start_url, standalone, 길빛 이름·색상·PNG192/512/maskable512 manifest 및 iOS 아이콘을 추가했다. 홈에 브라우저가 제공한 beforeinstallprompt를 사용자 클릭으로만 실행하는 설치 버튼을 넣고, 이벤트 미제공 브라우저에는 메뉴 설치 방법을 안내한다. 취소/실패 후 자동 재요청하지 않으며 appinstalled/standalone에서는 숨긴다.

SW는 정적 연결 안내만 캐시한다. API·TMAP·위치·앱 번들은 캐시하지 않는다. 탐색 실패 때 오프라인 페이지를 보여주고 재연결 시 다시 실제 앱을 받는다. 강제 활성화/새로고침으로 진행 중 안내를 끊지 않는다. 종속 패키지 추가 없이 구현했다.

## 검증
- production 빌드 통과, 단위120개 통과, 설치 UI/카메라/안내 세션 브라우저17개 통과.
- 별도 일반 Chrome 프로필의 CDP Page.getAppManifest 오류0, Page.getInstallabilityErrors 오류0. 실제 길빛 설치 버튼을 캡처했다.
- SW CacheStorage는 gilbit-offline-v1의 /offline.html 한 개만 확인, 오프라인 탐색 안내 및 온라인 재연결 통과.
- 첫 설치 판정은 자동화 시크릿 context라 in-incognito였다. 실제 사용자 프로필을 사용하지 않는 persistent 테스트 프로필로 재실행해 오류0을 확인했다.
- 실제 Android OS WebAPK 설치/홈 화면 실행/휴대폰 권한은 미확인이다. 브라우저 설치 가능 판정과 사용자 설치 완료를 구분한다.
- [사용 방법/재현 명령](../pwa-setup.md), [로컬 화면](../portfolio/assets/2026-11-13-pwa-install-390.png). 배포 결과는 후속 기록 참조.

기준31c485c 이후 변경. AI 지원 코드 확인·구현·기존 아이콘 렌더링·자동 검증·문서화. 기존 시안/실제 모드 정책과 카메라/GPS 세션을 보존한다.
