# 시작하기 (설치 · 실행 · 호스팅)

로컬 PC 한 대에서 Prompt Battle 서버를 띄우고, 같은 네트워크의 다른 기기에서 접속하기까지의 전 과정을 다룹니다.

---

## 1. 요구사항

- **Node.js >= 24** — 내장 `node:sqlite` 안정 버전을 사용하므로 별도 DB 라이브러리나 네이티브 컴파일이 필요 없습니다.

버전 확인:

```bash
node --version   # v24 이상이어야 함
```

## 2. 설치

```bash
npm install
```

프로덕션 의존성은 `ws` 하나뿐입니다. 나머지는 전부 Node 내장 모듈 + 개발용 `tsx`/`typescript`입니다.

## 3. 환경변수 (`.env`)

`.env.example`를 복사해 `.env`를 만듭니다:

```bash
cp .env.example .env
```

```dotenv
PORT=3000                        # 서버 포트
ADMIN_PASSWORD=change-me         # 관리자 콘솔 + 호스트 진입 비밀번호
ANTHROPIC_API_KEY=sk-ant-...     # 없으면 FakeProvider로 폴백 (아래 참고)
CLAUDE_MODEL=claude-opus-4-8     # 사용할 Claude 모델
```

| 변수 | 필수 | 설명 |
|---|---|---|
| `PORT` | 아니오 (기본 3000) | HTTP/WS 포트 |
| `ADMIN_PASSWORD` | 권장 (기본 `change-me`) | 관리자 API와 호스트 인증에 공용. **실제 운영 시 반드시 변경** |
| `ANTHROPIC_API_KEY` | 아니오 | 실제 AI 구현/채점에 필요. 없으면 가짜 응답으로 흐름만 시험 |
| `CLAUDE_MODEL` | 아니오 (기본 `claude-opus-4-8`) | 구현/채점에 쓸 모델 |
| `DB_PATH` | 아니오 (기본 `data/app.sqlite`) | SQLite 파일 경로 |

> **API 키 없이도 동작합니다.** `ANTHROPIC_API_KEY`가 없으면 서버가 `FakeProvider`로 폴백해 전체 흐름(구현·채점·결과)을 검증할 수 있습니다. 실제 UI 구현/채점 품질을 보려면 키를 넣으세요. 서버 시작 시 `No ANTHROPIC_API_KEY — using FakeProvider` 경고가 출력됩니다.

## 4. 문제 시드

50개의 컴포넌트 단위 UI 문제 세트가 `seed/`에 포함되어 있습니다. DB에 넣으려면:

```bash
npm run seed              # 아직 없는 문제만 추가 (제목 기준 멱등)
npm run seed -- --reset   # 기존 문제를 모두 지우고 50개 재삽입
```

- 멱등이므로 여러 번 실행해도 중복 삽입되지 않습니다.
- DB 파일은 `data/app.sqlite`에 생성됩니다(git 무시). 경로 변경은 `DB_PATH`.

## 5. 실행

```bash
npm run dev      # 개발: tsx watch (파일 변경 시 자동 재시작)
npm start        # 운영: 1회 실행
```

시작하면 접속 URL이 콘솔에 출력됩니다:

```
Prompt Battle server running.

  Local (this machine):
    Player: http://localhost:3000/client/
    Host:   http://localhost:3000/host/
    Admin:  http://localhost:3000/admin/index.html

  LAN (same-network devices — share these):
    Player: http://192.168.0.42:3000/client/
    Host:   http://192.168.0.42:3000/host/
    Admin:  http://192.168.0.42:3000/admin/index.html

  If a device cannot connect, allow this port through the OS firewall.
```

세 진입점:

| 대상 | 경로 | 용도 |
|---|---|---|
| **플레이어** | `/client/` | 방 코드 + 이름으로 입장, 프롬프트 작성 |
| **호스트** | `/host/` | 방 개설, 문제 선택, 게임 진행, 결과 표시 |
| **관리자** | `/admin/index.html` | 계정·문제·바리에이션 관리 |

## 6. 로컬 / LAN 호스팅

서버는 모든 네트워크 인터페이스에 바인딩되므로, **같은 네트워크(LAN)** 의 다른 기기(노트북·휴대폰)는 위에 출력된 **LAN URL** 로 바로 접속할 수 있습니다. 별도 배포 없이 호스트 PC 한 대로 현장 이벤트를 진행할 수 있습니다.

전형적인 현장 세팅:

1. 호스트 PC에서 `npm start` → 콘솔의 LAN URL 확인.
2. 호스트는 `/host/`를 큰 화면(프로젝터 등)에 띄웁니다.
3. 플레이어들은 각자 기기에서 LAN의 `/client/` URL에 접속.
4. 진행 방법은 [호스트 가이드](hosting-guide.md) 참고.

- 접속이 안 되면 **OS 방화벽에서 해당 포트를 허용**하세요 (Windows Defender 등).
- 모든 기기가 **동일한 Wi-Fi/LAN** 에 있어야 합니다.
- 인터넷 배포도 동일 서버(Node 프로세스 하나)를 그대로 올리면 됩니다.

## 7. 트러블슈팅

| 증상 | 원인 / 조치 |
|---|---|
| `node:sqlite` 관련 에러 | Node 24 미만. `node --version` 확인 후 업그레이드 |
| 문제 목록이 비어 있음 | 시드 미실행. `npm run seed` |
| AI 결과가 이상/단순함 | `ANTHROPIC_API_KEY` 미설정 → FakeProvider. 실제 키 설정 |
| LAN 기기가 접속 불가 | 방화벽에서 포트 허용, 같은 네트워크인지 확인 |
| 관리자/호스트 로그인 실패 | `.env`의 `ADMIN_PASSWORD` 확인 |
| 포트 충돌 | `PORT` 변경 후 재시작 |

## 8. 스크립트 요약

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (자동 재시작) |
| `npm start` | 서버 1회 실행 |
| `npm run seed [-- --reset]` | 문제 시드 |
| `npm test` | 테스트 (node:test) |
| `npm run typecheck` | `tsc --noEmit` 타입 검사 |

---

다음: [호스트 가이드](hosting-guide.md) · [플레이어 가이드](player-guide.md) · [관리자 가이드](admin-guide.md)
