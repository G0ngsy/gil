# 테스트 배포 준비 문제

## 문제
연결된 Vercel 도구에서 길빛 프로젝트 생성이 403 권한 오류로 거절됐다. 로컬 CLI는 로그아웃 상태였다.

## 원인
연결 도구의 현재 권한으로 프로젝트 생성이 허용되지 않았다. 계정 전체의 권한 문제로 단정하지 않았으며 CLI는 별도 인증이 필요했다.

## 해결방법
사용자가 브라우저에서 CLI 로그인을 승인했다. 계정·팀·Hobby 플랜을 확인한 뒤 동일 팀의 gilbit 프로젝트를 CLI로 생성했다. 키나 비밀번호를 채팅으로 수집하지 않았다. 배포 파일에서 환경 파일과 불필요한 자료를 제외했다.

## 결과
CLI 프로젝트 생성 성공. 배포 결과는 docs/deployment-validation.md에 기록한다. 연결 도구 자체의 권한은 변경하지 않았다.

## 배포 파일 사전 점검

- 문제: dry-run에서 outputs의 백업 ZIP 약 32MB와 일부 새 문서가 업로드 대상으로 확인됐다.
- 원인: 백업 폴더 제외 규칙 누락, 디렉터리 전체를 명시하지 않은 패턴.
- 해결방법: outputs/**와 docs/** 등 명시적인 재귀 제외 패턴을 적용했다.
- 결과: 배포 전 파일 목록 재검증으로 불필요한 업로드를 방지한다.

## 첫 Preview 배포 제한

- 문제: --environment preview 배포가 first_deployment_production으로 중단됐다. 업로드와 원격 빌드는 시작되지 않았다.
- 원인: Vercel CLI는 신규 프로젝트의 첫 배포를 Production으로 요구한다.
- 해결방법: 현재 준비한 코드로 기본 vercel.app 주소에 첫 배포할지 사용자 확인을 요청했다. 기존 다른 프로젝트 설정은 변경하지 않는다.
- 결과: 사용자가 첫 Production 배포를 승인했고 기본 주소 gilbit.vercel.app으로 배포했다.

## 배포 서버 모듈 참조 오류

- 문제: 첫 배포의 홈은 HTTP 200이지만 /api/navigation?action=config가 HTTP 500 FUNCTION_INVOCATION_FAILED를 반환했다.
- 원인: Node.js 24 ESM 환경에서 확장자가 없는 ../server/navigation 참조를 해석하지 못했다. 로컬 Vite/tsx에서는 재현되지 않았다. 서버 내부의 shared 참조도 같은 형태였다.
- 해결방법: API와 서버의 런타임 상대 import에 컴파일 후 파일 확장자 .js를 명시했다. TypeScript는 해당 .ts 소스로 해석한다.
- 결과: 로컬 빌드·단위 테스트 18개 통과. 재배포 후 설정 API HTTP 200 및 searchConfigured:false, UI 준비 안내 정상 표시 확인.
