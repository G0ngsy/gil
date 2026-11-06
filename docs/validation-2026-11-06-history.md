# 최근 이용 기록 검증

- npm run build 통과.
- npm test: 21개 통과. 저장 데이터 정규화·중복·10개 제한·좌표 제외·손상 데이터 검증 포함.
- npm run test:e2e: 33개 통과. 기존 안내·카메라·앱 레이아웃 회귀 포함.
- 새로고침 후 검색·목적지 유지, 재검색, 개별 삭제, 전체 삭제 취소와 확정 후 재방문 확인.
- 실제 모드는 모의 API로 성공 응답과 장소 선택 후 저장 확인. 실제 TMAP 인증은 검증하지 않음.
- 실제와 예시 별도 저장, localStorage에 lat/lng 없음 확인.
- 손상 JSON과 setItem 차단 시 오류 없이 화면 사용 및 경고 표시 확인.
- 긴 이름·주소의 360px 기록 목록에 가로 넘침 없음. docs/previews/gilbit-history.png 육안 확인.
- React 점검: 공통 기록 UI, 안정적인 key, 접근성 이름, 상태 안내, storage 리스너 해제, 명시적 저장 필드 확인.

## 실제 배포 확인

- https://gilbit.vercel.app 배포 dpl_ER61fG8P3oV7itWiKC4f2138SfEt READY.
- 실제 배포에서 예시 검색·목적지 저장과 새로고침 유지, 전체 삭제 후 localStorage 키 제거 확인.
- 서버 설정 API HTTP200, 브라우저 pageerror 없음.
- docs/previews/gilbit-history-deployed.png는 배포된 예시 기록 화면 캡처.
