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

## 원격 Production 확인

- 배포 소스 커밋 9150069a6c82c273d6e98eb497d0a7674dac97aa. 배포 dpl_2bzAEJkdTUopX3p8YpBS8Zd1DRz8 READY, 기본 주소 https://gilbit.vercel.app.
- 기존 서버 Secret은 그대로 유지했고 지도 빌드 변수는 빈 값으로 지정했다. 비밀 값 조회·출력·추가 저장 없음.
- 원격 Chrome 390×844에서 config 200/searchConfigured:true, 실제 서울도서관 검색 200, 실제 보행 경로 200 확인. 검색·경로 API는 모의하지 않았고 각각 1회 호출했다.
- 출발 GPS만 서울시청 인근 공공 좌표로 주입했다. 실제 사용자 GPS가 아니다. 경로 358m·305초·안내점 8개 확인.
- GPS watch는 테스트 콜백으로 주입해 자동 시작 없음, 시작/위치 반영/중지와 clearWatch 호출 확인. 실제 휴대폰 하드웨어 수신 증거가 아니다.
- 공개 지도 SDK 요청 0건, 브라우저 pageerror 0건. 지도 키 보류와 별개로 REST·안내 버튼이 작동함을 확인했다.
- /?mode=simulation의 실제 GPS·방향 센서 버튼 표시 확인. 원격 브라우저에서 실제 방위 정확도는 확인하지 않았다.
- 화면 근거 docs/portfolio/assets/2026-11-11-live-gps-deployed-390.png. 실제 배포·실제 REST·공공 GPS 주입 혼합 검증이다. 키/사용자 실좌표/실기기 나침반 캡처가 아니다.
- 자료 생성과 자동 검증·수정·문서화는 사용자 지시하에 AI 지원으로 수행했다. 사용성 향상·GPS 정확도 성과 수치는 측정하지 않았다.
