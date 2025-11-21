# Contributing to MCP Gateway

MCP Gateway에 기여해주셔서 감사합니다! 🎉

## 📋 목차
- [행동 강령](#행동-강령)
- [시작하기](#시작하기)
- [개발 워크플로우](#개발-워크플로우)
- [코딩 스타일](#코딩-스타일)
- [커밋 메시지 규칙](#커밋-메시지-규칙)
- [Pull Request 프로세스](#pull-request-프로세스)

## 행동 강령

이 프로젝트는 모든 참여자가 존중받는 환경을 유지하기 위해 노력합니다. 참여함으로써 여러분은 이 행동 강령을 준수하는 데 동의하게 됩니다.

## 시작하기

### 1. 저장소 Fork 및 Clone

```bash
# Fork 후 클론
git clone https://github.com/YOUR_USERNAME/mcp-gateway.git
cd mcp-gateway

# 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/ysh6342/mcp-gateway.git
```

### 2. 의존성 설치

```bash
# 백엔드 의존성
npm install

# 대시보드 의존성
cd dashboard
npm install
cd ..
```

### 3. 빌드 및 테스트

```bash
# TypeScript 빌드
npm run build

# 검증 스크립트 실행
node dist/verify-foundation.js
node dist/verify-phase1.js
```

## 개발 워크플로우

### 브랜치 전략

- `main`: 안정적인 프로덕션 코드
- `develop`: 개발 중인 코드 (선택사항)
- `feature/기능명`: 새로운 기능 개발
- `fix/버그명`: 버그 수정
- `docs/문서명`: 문서 업데이트

### 브랜치 생성 예시

```bash
# 최신 main 브랜치로 업데이트
git checkout main
git pull upstream main

# 새 기능 브랜치 생성
git checkout -b feature/add-metrics-dashboard

# 버그 수정 브랜치 생성
git checkout -b fix/connection-pool-leak
```

## 코딩 스타일

### TypeScript 스타일

- **들여쓰기**: 4 스페이스
- **따옴표**: 작은따옴표 (`'`) 사용
- **세미콜론**: 항상 사용
- **네이밍**:
  - 클래스: PascalCase (`ConnectionPool`)
  - 함수/변수: camelCase (`getClient`)
  - 상수: UPPER_SNAKE_CASE (`MAX_RETRIES`)
  - 파일: kebab-case (`connection-pool.ts`)

### 코드 품질

```bash
# TypeScript 컴파일 확인
npm run build

# 린트 (설정된 경우)
npm run lint
```

## 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

### 예시

```bash
feat(router): add caching for tool discovery

Implement LRU cache to store tool discovery results,
reducing redundant calls to MCP servers.

Closes #42
```

## Pull Request 프로세스

### 1. 변경사항 커밋

```bash
git add .
git commit -m "feat: add hot reloading support"
```

### 2. 최신 upstream 반영

```bash
git fetch upstream
git rebase upstream/main
```

### 3. Fork에 푸시

```bash
git push origin feature/your-feature-name
```

### 4. PR 생성

1. GitHub에서 "New Pull Request" 클릭
2. PR 템플릿에 따라 내용 작성
3. 관련 이슈 링크
4. 리뷰어 지정 (선택사항)

### 5. 리뷰 대응

- 리뷰어의 피드백에 성실히 응답
- 요청된 변경사항 반영
- 추가 커밋 후 푸시

### 6. 머지

- 모든 리뷰 승인 후 메인테이너가 머지
- Squash merge 또는 Rebase merge 사용

## 테스트 가이드

### 새로운 기능 추가 시

```typescript
// src/verify-your-feature.ts
import { YourFeature } from './core/your-feature.js';
import { logger } from './utils/logger.js';

async function main() {
    logger.info('Testing YourFeature...');
    
    const feature = new YourFeature();
    const result = await feature.doSomething();
    
    if (result.success) {
        logger.info('Test passed!');
    } else {
        throw new Error('Test failed');
    }
}

main().catch(err => {
    logger.error({ err }, 'Test failed');
    process.exit(1);
});
```

## 질문이나 도움이 필요하신가요?

- 이슈를 생성해주세요: [GitHub Issues](https://github.com/ysh6342/mcp-gateway/issues)
- 기존 이슈와 PR을 확인해보세요

감사합니다! 🙏
