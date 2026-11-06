# 2026-11-06 첫 배포 검증

## 배포

- 계정 g0ngsy, 팀 sunyoungs-projects-c61fca90, 프로젝트 gilbit, Hobby.
- 사용자 승인 후 Production 배포. 최종 주소 https://gilbit.vercel.app
- 최종 배포 dpl_Ey3PZhc2pmhz2AhRKeB3inVT1sWr, 상태 READY.
- CLI 65.12.1 사용. TMAP 서버·지도 키는 빈 값. 자동 Git 배포는 미연결.
- 최초 배포에서 ESM 확장자 오류 발견 후 api/navigation.ts와 server/navigation.ts import를 수정하고 재배포했다.

## 확인 결과

- 로컬 npm run build 통과, npm test 18개 통과.
- 배포 홈 HTTP 200, 제목·목적지 검색 입력 표시. 390×844 캡처 육안 확인.
- 실제 배포 /api/navigation?action=config HTTP 200, {"searchConfigured":false} 확인. 브라우저 API 응답을 모의하지 않았다.
- /?mode=live에서 실제 검색 준비 문구 표시 확인.
- /?screen=camera에서 Chrome 가상 장치로 실제 getUserMedia 호출과 videoWidth 640 확인. HTTPS isSecureContext:true.
- X로 닫은 뒤 홈의 진행 중인 안내 카드 표시 확인. 페이지 실행 오류 없음.
- 캡처: docs/previews/gilbit-deployed-home.png, docs/previews/gilbit-deployed-camera.png. 카메라 캡처는 가상 장치 영상이다.

## 미확인 사항

휴대폰 실기기·후면 렌즈 선택·모바일 운영체제 권한 창·실제 탭 전환과 표시등·실제 TMAP 연동·AR 및 백그라운드 안내는 미검증. 휴대폰 절차는 docs/deployment.md 참고.
