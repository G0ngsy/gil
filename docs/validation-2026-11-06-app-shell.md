# 앱 기본 화면 검증

- npm run build 통과, 브라우저 테스트 30개 통과.
- 360·430·1440px 기본 주소의 검토 설명판·가짜 상태표시·프레임·시안 메뉴 없음 확인.
- 기본 앱 영역의 테두리/모서리 0, 화면 높이 900px 및 최대 너비 480px 확인.
- preview=1에서 기존 검토 도구와 메뉴 접근 확인.
- 안내 전환·종료·복귀·실제 검색 모의 응답·카메라 관련 회귀 검증 통과.
- https://gilbit.vercel.app 원격 배포에서 PC와 390px 앱 화면 및 API HTTP200 확인. 캡처는 docs/previews/gilbit-app-desktop.png와 gilbit-app-mobile.png.
- 최종 배포: dpl_C7PDHp94AeLUqS9gek1SgiK8nUVU (READY).
- 실제 기기·실제 TMAP·공간 추적 기능은 이번 UI 수정 검증 범위가 아니다.
