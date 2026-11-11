# 2026-11-11 최신 GPS·방위 기능 회귀

## 기준과 변경

기준 원격 main 1d6e986. 새 작업 폴더에서 npm ci 후 검증했다. 제품 코드는 변경하지 않았고 tests/browser/heading.spec.ts의 주입 이벤트 fixture를 격리했다. docs/issues/2026-11-11-sensor-regression.md에 재현과 수정 범위를 기록했다.

## 실행 결과

- npm ci: 잠금 파일 기준 설치, 변경 없음.
- npm test: 단위 100개 통과.
- npm run build: 타입 검사와 Vite 빌드 통과. 테스트 fixture 수정 후 재빌드 통과.
- 최초 전체 브라우저 79개: 78개 통과/방향 테스트 1개 실패. 수정 전 해당 항목 단독 3회 중 2회 실패.
- 수정 후 실패 항목 5회 반복 통과.
- 수정 후 npm run test:e2e 전체 재실행: 79개 모두 통과(단독 재검증 합산이 아닌 전체 결과).
- 실제 TMAP 응답 대신 모의 API/GPS/방위 이벤트와 가상 카메라를 사용했다. 실기기 권한·나침반 정확도·실외 보행은 미확인.

## 배포 정책

Vercel 팀 sunyoungs-projects-c61fca90, 프로젝트 gilbit/prj_GKoDIwJ815m9xKiyLPDkTbn5PVCD, Production. 기존 서버 TMAP_APP_KEY는 Secret 설정을 그대로 사용하고 읽거나 출력하지 않는다. VITE_TMAP_MAP_KEY는 빈 값으로 빌드한다. 서버 키를 브라우저에 공유하지 않는다. 배포 결과는 확인 후 아래에 추가한다.

휴대폰 확인은 docs/device-check-2026-11-11.md에 따른다. 에이전트가 실제 휴대폰을 조작한 결과로 표현하지 않는다.
