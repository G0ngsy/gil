> 2026-11-26 변경: 기본은 기존 문 연출(세션 노출), 문 부분만 개선했다. 아래 splashSeen 설명은 두 대체안을 독립적으로 사용할 때의 정책이다. DEFAULT_SPLASH 상수는 제거됐고 현재 App 분기가 기본 문/명시적 비교 주소를 선택한다.

## 수정 사항 요약

### 변경 파일
- `src/splashes/knots/Splash.tsx`, `Splash.css`: 매듭의 합.
- `src/splashes/steps/Splash.tsx`, `Splash.css`: 차분한 세 걸음.
- `src/App.tsx`: 하나의 연출만 선택하고 홈 조작을 잠시 막는 연결부.
- `src/main.tsx`: 기존 콘텐츠를 App으로 감싸서 실행.
- `tests/browser/splash.spec.ts`, `tests/fixtures/splash-harness.tsx`: 저장·건너뛰기·타이머 정리 검증.

### 동작 흐름
1. 기본 진입은 매듭 안을 사용한다. `splashSeen`이 `true`이면 바로 홈으로 간다.
2. 첫 방문에는 선택한 연출 하나를 2.8초간 실행한다.
3. 탭·Enter·Space 또는 동작 줄이기 설정으로 즉시 끝낼 수 있다.
4. 완료 시 `localStorage.splashSeen=true`를 기록하고 홈을 조작할 수 있게 한다.
5. `?splash=knots` / `?splash=steps`는 저장 기록을 바꾸지 않는 비교용 재생이다.
6. 기존 문 연출은 `?intro=1`을 직접 지정했을 때만 실행한다. 새 연출과 이어 붙이지 않는다.

### 조절 가능한 값
| 항목 | 현재 값 | 위치 / 조절 방법 |
|---|---|---|
| 기본 컨셉 | knots | App.tsx의 DEFAULT_SPLASH를 steps로 바꾸기 |
| 전체 길이 | 2.8초 | TSX의 DURATION=2800과 CSS의 2.8s를 함께 변경 |
| 첫 방문 저장 키 | splashSeen | 두 Splash.tsx의 KEY를 같은 값으로 유지 |
| 로고 등장 시작 | 1.25초 | identity의 44.64% |
| 로고 등장 완료 | 1.75초 | identity의 62.5% |
| 홈 전환 시작 | 2.5초 | leave의 89.28% |
| 매듭 이동량 | 14px | north/east/south/west의 --x, --y |
| 발자국 간격 | .12/.43/.74초 | first/second/third의 animation-delay |
| 로고 교체 | brand 속성 | brand={<Brand />} 전달, 생략하면 명조 길빛 |
| 한지/소나무/황토 | #F7F3EA / #245447 / #B58A52 | 각 Splash.css의 단색 값 |

저장소 접근이 차단된 환경에서는 기록을 보존할 수 없어 다음 접속에 다시 표시될 수 있다. 그래도 건너뛰기와 홈 이동은 동작한다. 로컬 폰트 파일 두 개는 현재 프로젝트의 assets를 사용한다.
