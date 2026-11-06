# 홈 기록 요약 검증

- npm run build 통과, 브라우저 테스트 35개 통과.
- 실제/예시 모드 모두 홈에는 최신 목적지 1개만 표시하고 검색어·이전 목적지 목록은 표시하지 않음 확인.
- 기록 자세히 보기 → 별도 전체 기록 → 개별 삭제 → 뒤로 가기 → 다음 최신 목적지 표시 확인.
- 기존 저장·새로고침 유지·전체 삭제 취소/확정·실제/예시 분리 검증 유지.
- 360px 긴 목적지 상세 목록 가로 넘침 없음, 기존 모바일 360·390·430px 및 카메라 회귀 통과.
- 저장 키·데이터 스키마 변경 없음. TMAP 실제 인증은 이번 UI 수정 범위가 아님.

- 원격 https://gilbit.vercel.app 에서 요약·상세·삭제·홈 복귀와 설정 API HTTP200 확인. 배포 dpl_n5aTBaj1VApfB2mVAc6W9FLCxxkG READY.
- 배포 캡처 gilbit-history-summary.png, gilbit-history-details.png 저장. 요약 캡처 육안 확인.
