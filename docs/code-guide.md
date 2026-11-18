# 코드 읽는 순서

기능 이름으로 파일을 찾기 쉽게 소스 파일 상단과 핵심 함수에 한국어 주석을 추가했다. 아래 순서로 읽으면 앱 전체 흐름을 따라갈 수 있다.

| 확인할 기능 | 시작 파일 | 읽을 부분 |
| --- | --- | --- |
| 앱 실행/실제·시안 구분 | src/main.tsx | 실행 모드 선택과 앱 마운트 |
| 검색부터 안내 종료 | src/navigation/LiveNavigation.tsx | submitSearch → choose → getRoute → startGuidance → beginGuidance → finishGuidance |
| 뒤로가기 | src/navigation/useAppHistory.ts | go / back / home, popstate 처리 |
| API·현재 위치 | src/navigation/client.ts | navigationRequest / validPayload / getUserPosition |
| 서버·제공사 연결 | api/navigation.ts, server/navigation.ts | createNavigationHandler, 응답 변환 함수 |
| GPS 수신/진행 판단 | src/navigation/useGpsTracking.ts, shared/tracking.ts | 수신 상태 관리와 updateProgress 계산 분리 |
| 지도/다음 행동 카드 | src/navigation/WalkingMap.tsx, RouteJourney.tsx | 경로/위치 레이어와 JourneyInstruction |
| 카메라 | src/CameraPreview.tsx, navigation/LiveCameraGuide.tsx | start / release / close, 경로 안내 오버레이 |
| 이탈 재탐색 | src/navigation/LiveNavigation.tsx | rerouteGuidance: 성공 시에만 경로 교체 |
| 새로고침 후 안내 복원 | src/navigation/savedGuidance.ts, LiveNavigation.tsx | 저장 데이터 검사와 restoreGuidance |
| 최근 검색·목적지 | src/history.ts, RecentHistory.tsx | 기록 저장·목록·삭제 |
| 설치/전통 장식 | src/pwa.ts, PwaInstall.tsx, Motif.tsx | 설치 상태와 화면 장식 |
| 센서 시험 | src/navigation/SimulationNavigation.tsx | 검토 전용 화면. 실제 길찾기와 구분 |

## 읽을 때 주의할 구분

- 검색 중인 장소와 진행 중인 안내 목적지는 서로 다른 상태다.
- 지도 참고용 GPS 관측과 경로 진행에 채택한 GPS는 다르다.
- 뒤로가기/X는 화면 이동이며, 안내 종료에서만 안내 세션을 정리한다.
- 카메라 위 행동 카드는 GPS 경로 안내다. 실제 지면에 정렬된 AR이나 시선 방향 검출 기능은 아니다.
- 안내 복원용 경로 좌표는 기기에 저장하지만 실시간 GPS 관측 이력과 영상은 저장하지 않는다.
- 주석은 현재 코드의 역할을 설명하며 실제 기기 검증 완료를 뜻하지 않는다.
