# 길빛 테스트 배포

## 배포 범위

- Vercel 프로젝트 gilbit, 팀 sunyoungs-projects-c61fca90, Hobby.
- 첫 배포는 Vercel 정책에 따라 사용자 승인 후 Production으로 진행했다. 기능 검증용 배포다. 현재 서버 TMAP_APP_KEY는 기존 Secret 설정을 사용하고 공개 지도 키는 보류한다.
- 주소: https://gilbit.vercel.app
- 최종 배포 ID: dpl_85iPo4fBSdqUYTYA7Ab39gKobLus
- React/Vite 정적 화면과 /api/navigation 함수를 함께 빌드한다.
- Node.js는 package.json의 22 이상 25 미만 조건에 따라 사용한다.
- 로컬 환경 파일·에이전트 설정·검증 캡처·문서는 .vercelignore로 CLI 업로드에서 제외한다.
- CLI 배포를 사용한다. GitHub push 자동 배포 연결은 아직 설정하지 않았다.

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
