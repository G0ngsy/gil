# 검색과 화면 전환 사용법

- 검색창을 누르면 이 브라우저에 저장된 최근 검색어가 최대5개 나온다. 입력한 글자와 맞는 기록만 표시하며 검색어를 누르면 검색한다. 기록이 없으면 직접 입력해 검색한다.
- 후보의 X는 그 검색어 기록만 삭제한다. Escape는 후보를 닫으며 키보드 Tab/Enter로 선택할 수 있다.
- 장소 목록은 짧은 페이드업, 선택 시 카드에서 경로 확인 화면으로 확장한다. 최근 목적지의 기록 자세히 보기는 옆으로 밀려 들어오며 뒤로가기에도 반대 방향을 사용한다.
- 움직임을 줄이는 기기 설정은 모든 연출보다 우선한다. 전환을 지원하지 않아도 검색과 이동은 그대로 사용할 수 있다.
- 길 안내의 정보 펼치기→전체 경로 상세 보기에서 출발·각 안내·도착을 타임라인으로 읽는다. 경로에 없는 단계별 시간이나 거리는 표시하지 않는다.

## 변경 파일
RecentSearchSuggestions.tsx, navigation/screenMotion.ts/css, navigation/useAppHistory.ts, navigation/LiveNavigation.tsx, navigation/RouteJourney.tsx, style.css.

## 검증
빌드/기본 테스트, 관련 브라우저66개와 최종 전환 ready8개 재검증 통과. API/GPS/지도 SDK는 모의 입력이며 실외 성능 검증은 별도다. [이슈](issues/2026-11-26-search-motion-timeline.md).

## 2026-11-26 검색·전환·타임라인 운영 검증
제품 `1972f83`의 GitHub Vercel 상태 success와 공개 https://gilbit.vercel.app/ 반영을 확인했다. 배포 ID `57QecSxbdFDWH5myDW5ZeJT8TyC5`.

설치된 Chrome 390×844에서 최근 검색어 선택→실제 TMAP 장소 검색200→장소 카드 확장→실제 보행 경로200→응답과 같은4단계 타임라인을 확인했다. 네이티브 화면 전환 ready가 카드 이동/복귀 및 기록 push-forward/push-back 모두 성공했고 브라우저 뒤로가기로 홈에 복귀했다. [운영 캡처](portfolio/assets/2026-11-26-search-experience-production-390.png).

출발 위치만 서울시청 인근 공개 좌표와 오차8m를 주입했고 검색·경로 응답과 지도 SDK는 운영 연결을 사용했다. 실기기 센서·실외 이동·휴대폰별 애니메이션 성능은 미확인이다. 자동화 기본 Chromium 실행 파일이 없어 설치된 Chrome 채널로 검증했다. 이 후속 변경은 기록/캡처이며 기능 코드는 변경하지 않는다.
