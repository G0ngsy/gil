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
