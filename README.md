
<parameter name="StartLine">1

고가용성 MCP(Model Context Protocol) 서버 관리 미들웨어

## 개요

MCP Gateway는 여러 MCP 서버를 단일 진입점으로 통합하여 AI 클라이언트(Claude, Gemini 등)가 효율적으로 접근할 수 있도록 하는 미들웨어입니다.

### 주요 기능

- **프로세스 관리**: 로컬 MCP 서버의 생명주기 자동 관리
- **원격 서버 지원**: SSE를 통한 원격 MCP 서버 연결
- **스마트 라우팅**: 도구 호출을 적절한 서버로 자동 라우팅
- **웹 대시보드**: 실시간 서버 모니터링 및 제어
- **장애 격리**: 개별 서버 장애가 전체 시스템에 영향을 주지 않음

## 설치

```bash
npm install
cd dashboard
npm install
```

## 설정

`gateway-config.json` 파일을 생성하여 서버를 구성합니다:

```json
{
  "servers": [
    {
      "id": "filesystem",
      "name": "File System Server",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
      "transport": "stdio",
      "enabled": true,
      "restartPolicy": {
        "mode": "on-failure",
        "maxRetries": 3,
        "backoffBase": 1000
      }
    }
  ]
}
```

## 실행

### 1. Gateway 서버 시작

```bash
npm run build
node dist/index.js
```

Gateway는 다음 포트에서 실행됩니다:
- **MCP Protocol**: stdio (AI 클라이언트 연결용)
- **Control Plane API**: 3001 (대시보드 API)

### 2. 대시보드 시작

```bash
cd dashboard
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 검증

```bash
# Phase 0 검증 (기초)
npm run build
node dist/verify-foundation.js

# Phase 1 검증 (핵심 로직)
node dist/verify-phase1.js
```

## 라이선스

MIT
