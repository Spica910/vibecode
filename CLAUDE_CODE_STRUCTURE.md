# Claude Code 실제 구조 분석

## 파일 시스템 구조

```
project/
└── .claude/
    ├── Claude.md              # 메인 설정 파일
    ├── agents/                # Agent 설정
    │   ├── code-reviewer.json
    │   └── test-generator.json
    ├── skills/                # Skills 스크립트
    │   ├── format.sh
    │   ├── lint.sh
    │   └── test.sh
    ├── commands/              # 슬래시 커맨드
    │   ├── review.md
    │   └── test.md
    ├── hooks/                 # Git hooks
    │   ├── pre-commit.sh
    │   └── post-commit.sh
    └── mcp/                   # MCP 서버 설정
        └── config.json
```

## Agent 설정 형식

`.claude/agents/code-reviewer.json`:
```json
{
  "name": "code-reviewer",
  "description": "Reviews code for best practices",
  "enabled": true,
  "trigger": "on_commit",
  "config": {
    "model": "claude-3-sonnet",
    "temperature": 0.3
  }
}
```

## Skills 형식

`.claude/skills/format.sh`:
```bash
#!/bin/bash
# Skill: format
# Description: Format code with prettier

prettier --write .
```

## 현재 구현의 문제점

1. **AsyncStorage만 사용**: 실제 파일 시스템에 저장하지 않음
2. **Agent 구조**: JSON 파일이 아닌 단순 객체
3. **Skills 구조**: 실행 가능한 스크립트가 아닌 단순 명령어
4. **전역 vs 프로젝트**: 구분이 명확하지 않음

## 수정 필요사항

1. Agent → `.claude/agents/*.json` 파일로 저장
2. Skills → `.claude/skills/*.sh` 실행 스크립트로 저장
3. 전역 설정 vs 프로젝트별 설정 분리
4. 터미널 → WebView + xterm.js로 개선
