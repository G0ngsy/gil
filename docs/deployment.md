# 길빛 테스트 배포

## 배포 범위

- Vercel 프로젝트 gilbit, 팀 sunyoungs-projects-c61fca90, Hobby.
- 첫 배포는 Vercel 정책에 따라 사용자 승인 후 Production으로 진행했다. 기능 검증용 배포다. 현재 서버 TMAP_APP_KEY는 기존 Secret 설정을 사용하고 공개 지도 키는 보류한다.
- 주소: https://gilbit.vercel.app
- 최종 배포 ID: dpl_85iPo4fBSdqUYTYA7Ab39gKobLus
- React/Vite 정적 화면과 /api/navigation 함수를 함께 빌드한다.
- Node.js는 package.json의 22 이상 25 미만 조건에 따라 사용한다.
- 로컬 환경 파일·에이전트 설정·검증 캡처·문서는 .vercelignore로 CLI 업로드에서 제외한다.
- 현재 배포 방식: 2026-11-13 사용자가 GitHub push 시 Vercel에 자동 반영되도록 연결했다고 확인했다. 과거 CLI 배포 기록과 구분한다. push 후에도 공개 주소의 새 코드 반영을 별도로 검증한다.

## 휴대폰 확인 순서

1. 배포된 HTTPS 주소를 Chrome 또는 Safari에서 연다. Vercel 보호 화면이 나오면 해당 Vercel 계정으로 로그인한다.
2. 홈에서 예시 목적지 검색 → 장소 선택 → 길 안내 시작 → 카메라 안내를 누른다.
3. 실제 카메라 켜기 → 카메라 권한 허용 → 실제 후면 영상 표시를 확인한다. 장치에 따라 다른 카메라가 선택될 수 있다.
4. 영상 위에 가상 화살표·남은 거리·시간이 표시되지 않는지 확인한다.
5. 지도 보기, 카메라 끄기, 상단 X 각각에서 카메라 사용 표시가 종료되는지 확인한다.
6. X로 닫으면 홈의 진행 중인 안내 카드에서 복귀할 수 있는지 확인한다.
7. 탭을 벗어나면 카메라가 꺼지고, 복귀 후 다시 켜야 하는지 확인한다.
8. 권한을 거부하면 안내 문구와 재시도 버튼을 확인한다. 브라우저 사이트 설정에서 허용 후 다시 시도한다.
9. 실제 장소로 길찾기에서는 키 미설정 준비 안내가 나오는지 확인한다.

## 범위 구분

휴대폰 실기기 검증은 사용자가 실제 기기에서 확인해야 한다. 자동화 결과와 구분해 기록한다. 아직 실제 TMAP 검색·실시간 경로 추적·방향 센서·AR·음성·백그라운드 안내는 확인하지 않았다. 페이지 새로고침이나 탭 종료 시 시안 안내 상태는 유지되지 않는다.

## 앱 표시 방식

기본 주소는 앱만 표시한다. 디자인 검토 화면은 https://gilbit.vercel.app/?preview=1 에서 연다.

## 2026-11-11 최신 센서 버전

소스 9150069 배포와 실제 REST/GPS 주입 확인은 [최신 검증](validation-2026-11-11-release.md)을 따른다. 휴대폰은 [GPS·방위 확인 순서](device-check-2026-11-11.md)를 사용한다. 기존 초기 시안 절차와 구분한다.

## 2026-11-11 실제 검색 기본 전환

기본 주소는 실제 검색이다. 예시와 모의 센서는 preview=1 검토 링크로만 연다. 소스 b6f0e4c의 [기본 진입 검증](validation-2026-11-11-live-default.md)을 따른다.

## 2026-11-11 현재 위치 기준 검색

소스 1a9acd5. 현재 위치 버튼으로 GPS를 확인하고 주변 주소 표시 후 반경 10km 거리순 검색을 사용한다. [최신 검증](validation-2026-11-11-location-search.md)을 참고한다.

## 2026-11-11 경로 안내 화면 정리

소스 87d8231. 경로 확인에서 길 안내 시작을 누르고, 안내 중에는 상단 메뉴에서 일시중지/종료한다. 상세 GPS/전체 경로는 자세히 보기로 펼친다. [검증](validation-2026-11-11-journey-layout.md).


2026-11-11 카메라 방향 연결: 코드 `48ee0ab` 커밋/푸시 후 production `dpl_F9oLmWWr2SXjJdfeEeLkUUqzjnm4` READY, https://gilbit.vercel.app 별칭 반영. HTTP 200 및 신규 카메라 방향 안내 번들 포함 확인. 원격 실기기 센서·실외 정확도는 확인하지 않았다.


2026-11-11 센서 진단: 구현 `8a0c455` 커밋·푸시 후 production `dpl_3FJCEadcirgQbcKvduqpw2XxUxVd` READY. https://gilbit.vercel.app HTTP 200 및 gilbit-sensor-v1/복사 기능 번들 반영 확인. 갤럭시 실제 진단 결과 수집은 사용자 확인 대기.

2026-11-11 인트로 배포: 구현 d659a5c, production dpl_BwoVvCBa44vhqNQrUgAf6XnphCdc READY. https://gilbit.vercel.app/?intro=1 HTTP 200 및 원격 Chrome 390px에서 인트로→실제 홈 검색란 전환 확인. 실기기 성능은 미확인.

2026-11-11 홈 배경 배포: c0de56c → production dpl_FBSbKcSeccRpzEp97EteLA8qGkKt READY. 원격 Chrome 390px에서 HTTP 200·홈 CSS 수채 배경·기존 SVG 제거 확인.

2026-11-11 중앙 로고 순서 배포: 352d65a → dpl_J5y2wcGLXPtR2mTe2B1cgpsMHgaN READY. 원격 Chrome 390px HTTP 200, 문 내부 로고 없음→중앙 로고→퇴장→홈 전환 확인.

2026-11-11 홈 줌인 배포: d39a933 → dpl_9S9uKrEkt8PSSxgFxZ8aAVoqxwJE READY. 원격 Chrome 390px HTTP 200, 96% 시작·0.8초 전환·완료 후 transform 제거·검색란 노출 확인.


2026-11-12 실제 지도 검증: 코드 `bf4b9bb`, production `dpl_9htSF4E3eY8oAZ3QWud4drhGG55U` READY 및 gilbit.vercel.app 별칭 확인. 기존 AppKey로 지도 SDK HTTP 200, 지도 DOM·타일 HTTP 200·실제 서울도서관 검색 및 도보 경로 표시를 Chrome에서 확인했다. 공개 좌표 37.5665/126.978를 주입했으며 휴대폰 실외 GPS 검증은 아니다. 인증 값/URL은 출력하지 않았다. 캡처 `docs/portfolio/assets/2026-11-12-live-tmap-map-390.png`. 원격 최신 인트로/홈 디자인 커밋을 보존해 rebase 후 빌드·관련 브라우저 5개 재통과했다. 최초 비최신 작업본 배포 시도는 중단하고 최신 통합본으로 재배포했다.

2026-11-12 전통 구분선 배포: 구현 3f6d35c → production dpl_D28fgEdGH3hsHJqaiuS6JbFX23Ca READY. gilbit.vercel.app 원격 Chrome 390px에서 홈 마름모·도착 시안 연꽃·안내 마치기 버튼 확인. 최초 원격 확인은 비동기 시안 로딩 전에 검사해 실패했고 화면 로딩 대기 후 재확인 통과. 실제 GPS 도착 장식은 로컬 모의 GPS 검증이며 원격 실외 판정 검증은 아니다. 기존 지도 환경 설정을 유지했다.

2026-11-12 사용자 UI 배포: 코드 732db8a → production dpl_BPQwMiVgq2a3RHLtg7ehCGUowQfg READY. 원격 Chrome 390px에서 HTTP 200·기본 화면 개발 문구/푸터 없음·실제 TMAP 서울도서관 검색과 선택/복귀 카드 장식·명시적 시안 구름 확인. 위치/카메라 권한은 요청하지 않았다. 실제 검색 응답 확인이며 실외 GPS·방위 정확도 확인은 아니다. 캡처 assets/2026-11-12-user-home-production-390.png.


2026-11-12 배포 검증: 코드 `6c423a4` + 보완/문서 `b89663b`, production `dpl_8tdkWjzBaHZ79J59mpUYbaJ86Zmy` READY 및 https://gilbit.vercel.app 반영. 실제 TMAP 검색/도보 응답(서울도서관), 실제 지도 SDK/타일에서 파란 현재 위치·녹색 깃발 목적지·밝은 외곽 경로·정확도 Circle 렌더링을 확인했다. 공개 테스트 출발 좌표 37.5657/126.9768 및 경로 첫 좌표를 GPS 대신 주입했으며 실제 사용자 이동 검증이 아니다. 360/390/430px 가로 넘침 없음, 카메라 버튼 화면 내 표시 확인. 캡처 `assets/2026-11-12-map-route-redesign-390.png`, `assets/2026-11-12-map-active-redesign-390.png`, `assets/2026-11-12-map-active-redesign-360.png`, `assets/2026-11-12-map-active-redesign-430.png` (portfolio 기준). 배포 URL/로그에 인증 값을 출력하지 않았다.


2026-11-12 헤더 축소 배포: 코드 `ca1f16d`, production `dpl_Byt7wU7YDKX3RLtEG9M3BG8xPJWU` READY. gilbit.vercel.app HTTP 200 및 guidance-header 52px CSS 반영 확인. 조작/배치 검증은 로컬 브라우저 6개이며 배포 실기기 재측정은 미실시.


2026-11-12 최종 배포: 구현 `5a38dd2`, 실제 SDK 해제 보완 `212f33c`, 일시중지 스크롤 보완 `91e358b`. Production `dpl_CXH8A1kXKJksqtgbeXp2Xa9LZQ2U` READY 및 https://gilbit.vercel.app 반영. 실제 TMAP 서울도서관 검색·도보 경로/타일과 주입 공개 GPS로 X→홈→안내 복귀→일시중지→재개→확인 종료를 검증했다. X 이동 중 watch 유지, 일시중지/종료 때만 해제, 복귀 카드 제거, 일시중지 직후 scrollTop 0, 페이지 오류 0개 확인. 실제 실외 GPS/화면 잠금 중 추적은 검증 또는 지원 완료로 표현하지 않는다. 캡처: portfolio 기준 `assets/2026-11-12-session-active-390.png`, `assets/2026-11-12-session-home-390.png`, `assets/2026-11-12-session-paused-390.png`. 최초 전체 125개 통과 후 실제 SDK 정리 보완 관련 28개, 최종 스크롤 보완 관련 12개/빌드 통과. 전체125개를 마지막 보완 후 재실행한 것은 아니다. 인증 값·인증 URL은 출력하지 않았다.


2026-11-12 수동 일시중지 제거 배포: 코드 `bee4e87`, production `dpl_Hd4q8dwKC41bVRGcumYpYkPcYo4g` READY. gilbit.vercel.app에서 모의 경로/GPS를 사용해 일시중지 버튼 없음, 남은 거리 옆 종료 버튼 높이 44px 이상, 종료 확인창/취소 확인. 실제 센서·실외 검증과 구분.


2026-11-12 최종 배포 확인: 코드 `eec5efe`, 지도 여백 보완 `7c3e1e4`. Production `dpl_5TssdsyvZG17ZLmjt2ffzyTxdNqL` READY/https://gilbit.vercel.app 반영. 실제 TMAP 서울도서관 검색·도보 응답/지도 SDK에 공개 출발 좌표와 경로 첫 지점을 GPS 대신 주입해 ‘43m 앞 왼쪽’을 확인했다. 390/360/430px에서 안내 카드 하단 150px, 목적지 핀 상단 각각193/203/186px로 가림 없음을 확인했다. 상세 영역 없음·가로 넘침 없음·X 홈 복귀·종료 확정·페이지 오류0 확인. 캡처 `assets/2026-11-12-minimal-guidance-390.png`, `-360.png`, `-430.png` (portfolio 기준). 빌드·단위120개·관련 브라우저36개, 마지막 지도 여백 조정 후 관련9개 재통과. 실외 실제 GPS 정확도는 미검증. 인증 값/인증 URL은 출력하지 않았다.


2026-11-12 배포 확인: 코드 `318b5c8`, production `dpl_5MPcvrNQLNBPRyTYx1hJ1R3EBLgb` READY 및 gilbit.vercel.app 반영. 배포 UI에 모의 주소/경로/GPS를 주입하여 360/390/430px 검색→안내 카드→위치 카드 간격24px 이하, 위치 카드100px 이하, 가로 넘침 없음 확인. 실제 사용자 위치나 실외 정확도 검증은 아니다. 캡처 portfolio 기준 `assets/2026-11-12-compact-home-idle-390.png`, `assets/2026-11-12-compact-home-active-390.png`, `-360.png`, `-430.png`. 안내 없음/진행 중 모두 검토했다.

## 2026-11-13 카메라 안내 자동 배포 확인 진행

카메라 경로 안내 구현 3fd1d4f를 origin/main에 푸시했다. 사용자가 GitHub→Vercel 자동 배포가 연결됐다고 확인해 수동 CLI 배포를 하지 않고 문서 정정 커밋을 푸시한다. 최초 공개 주소는 HTTP200이나 이전 번들 `/assets/index-DP__EJNe.js`였으며 새 카메라 문구/고정 경로 카드는 미반영이었다. config는200/searchConfigured true였다. 모의 원격 카메라 검증도 새 카드가 없어 실패해 배포 완료로 보고하지 않았다.

Vercel 연결 도구는 사용자 팀을 조회했지만 프로젝트 목록이 비고 gilbit/배포 조회가404여서 배포 상태를 확인하지 못했다. 로컬 CLI/로그인 설정도 찾지 못했다. 브라우저 접근은 자동 승인 검토에서 허용되지 않아 우회하지 않았다. 새 프로젝트/새 키/환경변수는 만들거나 바꾸지 않았다. 최종 공개 주소 반영 여부는 후속 검증 결과를 따른다.

## 2026-11-13 Git 연결 후 자동 배포 재시도

사용자가 제공한 화면에서 G0ngsy/gil 연결과 Connected just now를 확인했다. 연결 이후 새 push 이벤트를 발생시키기 위해 이 기록을 커밋·푸시한다. 앱 코드는3fd1d4f와 동일하며 카메라 단순화 구현을 포함한다. 문서 변경만 있어 변경 형식 검사를 수행한다. 새 푸시 성공과 Vercel 빌드/공개 주소 반영은 별도로 확인한다.

## 2026-11-13 자동 배포 최종 성공

연결 후 커밋 `2050677`의 GitHub Vercel 상태가 pending→success로 전환됐다. [배포 상태](https://vercel.com/sunyoungs-projects-c61fca90/gilbit/2tDwBCM3MeSEPdDdM9F8LygCnsrd). https://gilbit.vercel.app HTTP200 및 새 번들 `/assets/index-D93Yix_3.js`, 카메라 경로 안내 문구 반영을 확인했다. API config200/searchConfigured true.

Production 앱에 모의 카메라(canvas)·GPS·144m 경로/API 응답을 주입해 직진·회전 접근/회전 후·이탈·GPS45m 오차·2표본 도착을 확인했다. 방향 센서 없이 동작하며 페이지 예외0개, 도착 문구 가로 넘침 없음. 원격 모의 검증이며 실제 사용자 GPS/카메라·실외 정확도 검증은 아니다. 실제 TMAP 검색 호출은 이번 배포 검증에서 수행하지 않았다. [Production 캡처](portfolio/assets/2026-11-13-camera-route-production-390.png). 임시 검증 스크립트는 제거했고 인증 값/URL은 출력하지 않았다.

## 2026-11-13 PWA 설치 설정 배포

코드948777a의 Vercel 상태success와 공개 주소 manifest/PNG아이콘/standalone 설정 반영 확인. [배포](https://vercel.com/sunyoungs-projects-c61fca90/gilbit/2FNC95ihTptxzXwJbQZfAV77CDoZ). 원격 일반 Chrome에서 CDP manifest/설치가능 오류0, static offline 안내만 캐시/오프라인 탐색/온라인 복귀 통과. 실제 Android 설치 승인은 미확인. [설치 방법](pwa-setup.md).
