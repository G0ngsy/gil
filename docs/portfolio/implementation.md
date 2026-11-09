# 구현 현황과 근거

기준: 2026-11-09, 소스 `73404ca` 대조. ‘구현’은 코드 존재, ‘검증’은 명시한 환경에서의 결과다. 실서비스 완료를 뜻하지 않는다.

| 기능 | 현재 구현과 설계 | 검증 근거 | 미확인/남은 일 |
| --- | --- | --- | --- |
| 홈·검색·지도·카메라·재확인·도착 시안 | 한지색 UI, 로고, 화면별 문양, 예시 데이터 표시 | [앱 셸 검증](../validation-2026-11-06-app-shell.md), [디자인](../../DESIGN.md), [앱 코드](../../src/main.tsx) | 사용자 사용성·접근성 실사용 평가 |
| 앱/디자인 검토 화면 분리 | 기본 앱 영역, `preview=1`에서 검토 도구 | [이슈](../issues/2026-11-06-app-shell.md), [테스트](../../tests/browser/app-shell.spec.ts) | 모바일 실제 기기 화면 확인 |
| 장소 검색·도보 경로 서버 | 키를 서버에서 처리, 좌표·총계 정규화, 오류 메시지 분리, 요청 취소 | [이슈](../issues/2026-11-06-navigation.md), [서버](../../server/navigation.ts), [단위](../../tests/navigation.test.ts), [브라우저](../../tests/browser/navigation.spec.ts) | TMAP 실제 키 인증·검색 결과·지도 SDK 실응답 |
| 전체 도보 안내 | 제공된 단계 목록·빈 안내 상태, 지도 실패해도 목록/거리 유지 | [이슈](../issues/2026-11-06-route-directions.md), [UI](../../src/navigation/LiveNavigation.tsx) | 실제 경로의 자동 안내 연결 |
| 화면 닫기/종료 분리 | 시안에서 목적지·마지막 화면 보관, 홈 복귀 카드, 명시적 종료 | [이슈](../issues/2026-11-06-close-guide.md), [검증](../validation-2026-11-06-close-guide.md) | 백그라운드 안내·새로고침 상태 보존은 없음 |
| 실제 카메라 미리보기 | 선택형 영상, 마이크 미요청, 종료/늦은 스트림 해제, 가상 방향 숨김 | [코드](../../src/CameraPreview.tsx), [이슈](../issues/2026-11-06-camera.md), [검증](../validation-2026-11-06-camera.md) | 휴대폰 렌즈/권한창, AR 공간·방향 추적 |
| 최근 검색/목적지 | 모드별 기기 저장, 각 10개, 중복 제거·삭제·저장 실패 안내 | [코드](../../src/history.ts), [이슈](../issues/2026-11-06-history.md), [단위](../../tests/history.test.ts) | 실사용 삭제 경험·브라우저별 저장 정책 |
| 홈 기록 요약 | 최근 목적지 1개, 전체 관리 화면 분리 | [이슈](../issues/2026-11-06-history-summary.md), [검증](../validation-2026-11-06-history-summary.md) | 사용성 개선 수치 없음 |
| 경로 진행 계산 | 선분 투영, 남은 거리·단계, 이탈/복귀·도착,역방향 반영 | [계산](../../shared/tracking.ts), [초기 이슈](../issues/2026-11-08-mock-gps-tracking.md), [테스트](../../tests/tracking.test.ts) | 실제 보행 정확도·임계값 보정 |
| GPS 연속 수신 | 선택형 watch, 정확도/시각 검사, 수신 중단·권한 오류·종료/탭 숨김 해제 | [코드](../../src/navigation/useGpsTracking.ts), [이슈](../issues/2026-11-08-live-gps-tracking.md) | 실외 센서·모바일 OS 동작 |
| 오판 방지 | 진행 연속성, 속도 기반 점프 거부, 정확도 포함 도착 2회 확인 | [이슈](../issues/2026-11-08-gps-matching.md), [테스트](../../tests/tracking.test.ts) | 완전 중첩 경로의 방향 확정 불가, 현장 보정 |
| 이동 경로 도식 | 위치·진행·이탈 색·전체/현재 위치 보기, 안내 종료와 초기화 | [지도](../../src/navigation/TrackingMap.tsx), [이슈](../issues/2026-11-08-tracking-map.md) | 실제 도로 지도 아님, 원시 GPS 궤적 아님 |
| 현장 테스트 경로 | 2~20개 좌표 검증, 직선 도식·GPS 연결, 변경 시 추적 해제, 저장 안 함 | [파서](../../shared/fieldRoute.ts), [편집기](../../src/navigation/FieldRouteEditor.tsx), [이슈](../issues/2026-11-08-field-route.md), [단위](../../tests/fieldRoute.test.ts) | 통행 가능 경로 보장 없음·실외 테스트 필요 |
| 휴대폰·경로 방향 비교(2026-11-09) | 진북 기준 모의 방위와 경로 선분 비교, 정방향/좌우/반대/확인 불가, 오차·오래된 입력 검사 | [계산](../../shared/facing.ts), [단위](../../tests/facing.test.ts), [이슈](../issues/2026-11-09-facing-comparison.md) | 계산·모의 검증 완료, 후속 모의 UI는 아래 카드 항목 참조. 실제 센서/몸 방향 감지는 미연결 |
| 모의 방향 카드(2026-11-09) | 테스트 화면의 유지형 화살표·문구, 모의 각도/오차 조절, 800ms 안정화·확인 불가 즉시 숨김 | [카드](../../src/navigation/FacingGuide.tsx), [브라우저](../../tests/browser/facing.spec.ts), [이슈](../issues/2026-11-09-facing-card.md) | 모의 GPS에서만 동작. 실제 방위 센서·몸 방향 감지는 미연결 |
| 배포 | 과거 Vercel 배포와 ESM import 수정 기록 존재 | [배포 검증](../deployment-validation.md), [기록 요약 배포 확인](../validation-2026-11-06-history-summary.md) | 최신 GPS/현장 경로의 재배포 확인 없음. Git push를 배포 완료로 쓰지 않음 |

## 개발 문서 도구 — 2026-11-09 추가

OpenWiki 0.9.0 사용자 연동을 검토·설치했으나 코드 단순화라는 사용자 목적에 필수가 아니어서 같은 날 제거했다. 스킬·MCP 설정·전용 Node/패키지/설치 자료·실행 진입점 제거와 다른 Codex 설정 보존을 확인했다. 제거 전 전용 폴더 크기는 약 334MiB였다. 현재 설치/위키 생성 완료로 표시하지 않는다. 기존 `docs/issues/`와 `docs/portfolio/`로 문서를 관리한다. [설치·제거 기록](../issues/2026-11-09-openwiki-install.md)을 참고한다.

상세 테스트 조건·캡처 성격은 [근거 목록](evidence.md)을 따른다. 과거 이슈의 ‘미구현’이 이후 구현된 경우 현재 상태는 이 표와 최신 코드로 판단하고 과거 기록은 당시 상태로 보존한다.
