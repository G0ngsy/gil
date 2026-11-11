# 카메라 미리보기 사용

1. 지도 안내 시안에서 카메라 안내로 이동한다. 또는 /?preview=1&screen=camera를 연다.
2. 실제 카메라 켜기를 누르고 브라우저 권한을 허용한다.
3. 카메라 끄기는 시안으로 복귀하고 지도 보기나 상단 X는 카메라를 해제한다. X는 안내 상태를 유지한다.
4. 탭을 숨기면 카메라는 꺼지고 복귀 후 다시 켜기 버튼을 눌러야 한다.

API 키는 필요 없다. HTTPS 또는 같은 기기의 localhost/127.0.0.1 주소가 필요하다. 휴대폰에서 PC의 일반 HTTP IP 주소로 접속하면 지원되지 않을 수 있다. 현재 카메라 버튼은 시안 카메라 화면에 있고 실제 검색 모드에는 아직 없다.

실제 미리보기에서는 가상 화살표와 경로 정보를 표시하지 않는다. 영상 녹화·서버 전송·방향 추적·실제 경로와의 결합은 구현하지 않았다. 휴대폰 실기기에서 후면 카메라 선택, 권한 허용/거부, 지도 전환 및 탭 숨김 시 카메라 표시등 종료를 추가 확인해야 한다.

참고: [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [트랙 해제](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop).
