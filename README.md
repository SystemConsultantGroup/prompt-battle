# Prompt Battle

프롬프트를 입력해 주어진 UI 목표를 달성하는 **실시간 경쟁 게임**입니다. 플레이어는 목표 화면을 보고 그것을 재현하는 프롬프트를 작성하고, AI(Claude)가 그 프롬프트로 UI를 구현한 뒤 채점 기준과 비교해 점수를 매깁니다. 호스트 화면에 등수가 표시됩니다.

- **가볍게**: 프로덕션 의존성은 `ws` 하나. 나머지는 전부 Node 내장 모듈. 프론트엔드는 빌드 단계 없는 순수 ES 모듈 + 기본 CSS.
- **서버 권위**: 게임 phase·타이머·제출·채점·문제 선택은 모두 서버가 결정합니다. 클라이언트는 서버가 내려주는 상태를 그리기만 합니다.

---

## 빠른 시작

```bash
npm install                 # 설치 (Node >= 24 필요)
cp .env.example .env        # 환경변수 (ADMIN_PASSWORD 등 설정)
npm run seed                # 50문제 시드 삽입
npm run dev                 # 개발 서버 (자동 재시작)  — 또는 npm start
```

시작하면 콘솔에 접속 URL이 출력됩니다:

```
  Local (this machine):
    Player: http://localhost:3000/client/
    Host:   http://localhost:3000/host/
    Admin:  http://localhost:3000/admin/
  LAN (same-network devices — share these):
    Player: http://192.168.0.42:3000/client/   ...
```

> **LLM 프로바이더**: `.env`에 `OPENAI_API_KEY`가 있으면 **OpenAI**(기본 모델 `gpt-4o-mini`), 없고 `ANTHROPIC_API_KEY`가 있으면 **Claude**, 둘 다 없으면 **FakeProvider**(오프라인·가짜 결과)를 씁니다. 키 형식: OpenAI `sk-...`, Anthropic `sk-ant-...`. 자세히는 [시작하기](docs/getting-started.md#3-환경변수-env).

세 진입점: **플레이어** `/client/` · **호스트** `/host/` · **관리자** `/admin/`.

## 문서

| 문서 | 내용 |
|---|---|
| [시작하기](docs/getting-started.md) | 요구사항, 설치, 환경변수, 시드, 실행, **로컬/LAN 호스팅**, 트러블슈팅 |
| [호스트 가이드](docs/hosting-guide.md) | 방 개설, 4가지 문제 선택 모드, 게임 진행, 결과, 재접속 |
| [플레이어 가이드](docs/player-guide.md) | 입장, 프롬프트 작성, 자동 제출, 재접속 |
| [관리자 가이드](docs/admin-guide.md) | 계정·문제·바리에이션 관리, **채점 기준 작성 가이드**, 채점 방식, 인젝션 방어 |

설계 스펙과 구현 계획은 [`docs/superpowers/`](docs/superpowers/)에 있습니다.

---

## 아키텍처

```
Node 서버 (단일 프로세스)
  HTTP        정적 프론트 서빙 + 렌더 엔드포인트 + 관리자 REST(/api/*)
  WS(ws)      방/실시간 동기화 (로비·타이핑 미러·게임 상태 브로드캐스트)
  GameManager 인메모리 방 상태 + 서버 타이머 (권위 상태, 재접속·유예·슬롯 정리)
  SQLite      문제·바리에이션·채점기준·계정 (node:sqlite)
  LLMProvider 인터페이스 → OpenAIProvider / ClaudeProvider / FakeProvider
  grading     implement → grade → 결정적 점수/등수 산출
```

- **인젝션 방어**: 플레이어 프롬프트는 `<`/`>`/`&`를 이스케이프해 격리, 채점 단계는 코드+기준만 봄, 생성/목표 UI는 엄격한 CSP + `sandbox="allow-scripts"` iframe에서만 렌더. 자세히는 [관리자 가이드](docs/admin-guide.md#인젝션-방어).
- **관리자 API**: 모든 `/api/*`는 `x-admin-password` 게이트를 통과해야 하며, 인증은 어떤 DB 변경보다 먼저 검사됩니다(상수 시간 비교).

## 프로젝트 구조

```
src/
  server.ts          HTTP + WS 부팅, 라우팅, 채점 연결
  http/              정적 서빙, 샌드박스 렌더(renderDoc/GenStore), LAN 배너
  game/              types, GameManager(방·phase·타이머·재접속·슬롯 정리), hub(WS 라우팅), select(문제 선택)
  db/                schema.sql + node:sqlite 접근 계층
  llm/               LLMProvider 인터페이스, OpenAIProvider, ClaudeProvider, FakeProvider, 프롬프트 새니타이즈
  grading/           채점 파이프라인 + 결정적 점수 계산
  admin/             계정·문제·바리에이션 CRUD REST
  util/              상수시간 비교 등
public/
  client/            플레이어 앱     host/  호스트 앱(대시보드·룰렛·결과)
  admin/             관리자 콘솔     shared/ ws·dom 유틸
seed/                50문제 시드 데이터 + 타입
scripts/seed.ts      시드 러너
test/                node:test 단위·통합 테스트
docs/                사용자 가이드 + 설계 스펙/구현 계획
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (자동 재시작) |
| `npm start` | 서버 1회 실행 |
| `npm run seed [-- --reset]` | 문제 시드 |
| `npm test` | 테스트 (node:test) |
| `npm run typecheck` | `tsc --noEmit` 타입 검사 |

## 테스트

```bash
npm test          # 100개 테스트
npm run typecheck
```
