# GitHub Rulesets 사용 가이드

## 📋 생성된 Ruleset 파일

### 1. `main-branch-protection.json` (CI 포함)
**포함 규칙:**
- ✅ Pull Request 필수
- ✅ 코멘트 해결 필수
- ✅ CI 통과 필수
- ✅ Force push 금지
- ✅ 브랜치 삭제 금지

**사용 시기:** CI 워크플로우가 실행된 후

---

### 2. `main-branch-protection-no-ci.json` (CI 없음)
**포함 규칙:**
- ✅ Pull Request 필수
- ✅ 코멘트 해결 필수
- ❌ CI 체크 없음
- ✅ Force push 금지
- ✅ 브랜치 삭제 금지

**사용 시기:** 지금 바로 사용 가능

---

## 🚀 Import 방법

### 방법 1: GitHub CLI 사용 (추천)

```bash
# GitHub CLI 설치 확인
gh --version

# 로그인
gh auth login

# Ruleset import (CI 없음 버전)
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/ysh6342/mcp-gateway/rulesets \
  --input .github/rulesets/main-branch-protection-no-ci.json

# 또는 CI 포함 버전 (첫 PR 후)
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/ysh6342/mcp-gateway/rulesets \
  --input .github/rulesets/main-branch-protection.json
```

---

### 방법 2: GitHub 웹 UI에서 Import

**⚠️ 현재 GitHub 웹 UI는 ruleset JSON import를 직접 지원하지 않습니다.**

대신 수동으로 설정:

1. https://github.com/ysh6342/mcp-gateway/settings/rules
2. "New ruleset" → "New branch ruleset"
3. 다음 설정 입력:

**Ruleset name:** `Protect main branch`

**Target branches:**
- Branch name pattern: `main`

**Rules:**
- ✅ Require a pull request before merging
  - Required approvals: 0
  - Require conversation resolution: ✅
- ✅ Block force pushes
- ✅ Restrict deletions

4. "Create" 클릭

---

### 방법 3: REST API 직접 호출

```bash
# Personal Access Token 필요
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/ysh6342/mcp-gateway/rulesets \
  -d @.github/rulesets/main-branch-protection-no-ci.json
```

---

## 📝 Ruleset vs Branch Protection Rules

### Rulesets (신규, 추천)
- ✅ JSON으로 export/import 가능
- ✅ 여러 브랜치에 한 번에 적용
- ✅ 더 세밀한 제어
- ✅ Organization 전체 적용 가능

### Branch Protection Rules (기존)
- ✅ 웹 UI에서 쉽게 설정
- ❌ Export/import 불가
- ❌ 브랜치별 개별 설정

---

## 🎯 추천 사용 순서

### 1단계: 지금 바로 (CI 없음)
```bash
# GitHub CLI로 import
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/ysh6342/mcp-gateway/rulesets \
  --input .github/rulesets/main-branch-protection-no-ci.json
```

### 2단계: 첫 PR 생성 및 CI 실행
```bash
git checkout -b test/first-pr
echo "# Test" >> test.md
git add test.md
git commit -m "test: first PR"
git push origin test/first-pr
```

### 3단계: CI 포함 Ruleset으로 업데이트
```bash
# 기존 ruleset ID 확인
gh api /repos/ysh6342/mcp-gateway/rulesets

# 업데이트 (ID는 위에서 확인한 값 사용)
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/ysh6342/mcp-gateway/rulesets/RULESET_ID \
  --input .github/rulesets/main-branch-protection.json
```

---

## ✅ 확인 방법

Ruleset이 적용되었는지 확인:

```bash
# 모든 rulesets 조회
gh api /repos/ysh6342/mcp-gateway/rulesets

# 또는 웹에서 확인
# https://github.com/ysh6342/mcp-gateway/settings/rules
```

---

## 🔧 문제 해결

### "Resource not accessible by personal access token"
→ GitHub CLI 재인증 필요:
```bash
gh auth refresh -s admin:org
```

### "Rulesets are not available for this repository"
→ 저장소가 Public이어야 합니다 (또는 GitHub Team 플랜)

### CI 체크 오류
→ 첫 PR 후 ruleset 업데이트 필요

---

## 📚 참고 자료

- [GitHub Rulesets Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub CLI Manual](https://cli.github.com/manual/)
