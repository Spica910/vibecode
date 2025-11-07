# 내장 터미널 사용 가이드

VibeCode는 VS Code 스타일의 내장 터미널을 제공하여 **Termux를 별도로 설치할 필요 없이** 앱 내에서 직접 명령어를 실행할 수 있습니다.

## 주요 특징

### 🚀 Termux 설치 불필요!

- VibeCode 앱 하나만 설치하면 모든 기능 사용 가능
- 네이티브 Android 셸 직접 실행
- Termux 의존성 없음

### 💻 VS Code 스타일 UI

- 어두운 테마의 전문적인 터미널 인터페이스
- 명령어 히스토리 (↑↓ 버튼)
- 빠른 명령어 버튼
- 실시간 출력 표시

### 📁 프로젝트별 터미널

- 각 프로젝트에서 해당 디렉토리로 자동 이동
- 작업 디렉토리 표시
- 컨텍스트 유지

## 터미널 열기

### 1. 홈 화면에서

```
홈 → 터미널 💻
```

기본 작업 디렉토리 (`/data/data/com.termux/files/home`)에서 시작

### 2. 프로젝트에서

```
프로젝트 목록 → 프로젝트 선택 → 터미널 💻
```

해당 프로젝트 디렉토리에서 자동 시작

## 사용 가능한 명령어

### 내장 명령어

| 명령어 | 설명 |
|--------|------|
| `help` | 도움말 표시 |
| `clear` | 화면 지우기 |
| `exit` | 터미널 종료 |
| `cd <path>` | 디렉토리 이동 |

### Shell 명령어

VibeCode는 Android의 네이티브 셸을 사용하므로 표준 Unix 명령어를 지원합니다:

#### 파일 관리
```bash
ls          # 파일 목록
ls -la      # 상세 파일 목록
pwd         # 현재 경로
cd ~        # 홈 디렉토리로
cd ..       # 상위 디렉토리로
mkdir dir   # 디렉토리 생성
rm file     # 파일 삭제
cp a b      # 파일 복사
mv a b      # 파일 이동
cat file    # 파일 내용 보기
```

#### Git 명령어
```bash
git status
git add .
git commit -m "message"
git push
git pull
git log
```

#### Node.js (설치된 경우)
```bash
node -v
npm -v
npm install
npm start
npm run build
```

#### Python (설치된 경우)
```bash
python --version
pip install package
python script.py
```

## 빠른 명령어 버튼

터미널 상단의 버튼을 탭하면 자동으로 명령어가 입력됩니다:

- **ls**: 파일 목록 (`ls -la`)
- **pwd**: 현재 경로
- **clear**: 화면 지우기
- **git status**: Git 상태
- **npm install**: 패키지 설치

## 명령어 히스토리

터미널 우측 하단의 ↑↓ 버튼:

- **↑**: 이전 명령어
- **↓**: 다음 명령어

자주 사용하는 명령어를 빠르게 다시 실행할 수 있습니다.

## 디렉토리 이동

### 절대 경로
```bash
cd /data/data/com.termux/files/home/myproject
```

### 상대 경로
```bash
cd myproject
cd ..
cd ../otherproject
```

### 홈 디렉토리
```bash
cd ~
```

현재 작업 디렉토리는 터미널 하단에 표시됩니다.

## Termux vs VibeCode 터미널

### Termux 필요성

#### ❌ Termux가 필요 없는 경우:
- 기본 파일 관리
- Git 명령어
- 이미 시스템에 설치된 도구 사용
- Claude Code 프로젝트 관리

#### ✅ Termux가 필요한 경우:
- 패키지 관리자 (`pkg install`)
- 전체 Linux 환경 필요
- 복잡한 개발 툴체인 설치
- SSH 서버 실행 등

### 권장 사용 방법

**VibeCode만 사용:**
```bash
# Git 작업
git clone https://github.com/user/repo.git
cd repo
git status
git add .
git commit -m "update"

# 파일 편집 (앱 내 편집기 사용)
# 프로젝트 관리
# Claude Code 설정
```

**VibeCode + Termux 함께:**
```bash
# Termux에서 패키지 설치
pkg install nodejs python

# VibeCode 터미널에서 사용
node -v
python --version
npm install
```

## 고급 사용법

### 1. 환경 변수 설정

VibeCode 터미널은 Android 셸 환경 변수를 사용합니다:

```bash
# 현재 PATH 확인
echo $PATH

# 홈 디렉토리
echo $HOME
```

### 2. 스크립트 실행

```bash
# Bash 스크립트
sh script.sh

# Python 스크립트 (Python 설치 필요)
python script.py

# Node.js 스크립트 (Node 설치 필요)
node script.js
```

### 3. 파이프와 리다이렉션

```bash
# 파일 출력 리다이렉션
ls -la > files.txt

# 검색
cat file.txt | grep "search"

# 여러 명령어 실행
cd project && npm install && npm start
```

### 4. 긴 명령어 실행

터미널은 비동기로 명령어를 실행하므로 긴 작업도 가능합니다:

```bash
# 빌드 작업
npm run build

# 패키지 설치
npm install

# Git 클론
git clone https://github.com/large-repo.git
```

## 제한사항

### 지원되지 않는 기능

❌ **인터랙티브 명령어**
```bash
vim file.txt    # X
nano file.txt   # X
top             # X
htop            # X
```

→ 대신 VibeCode 내장 편집기 사용

❌ **백그라운드 프로세스**
```bash
npm start &     # X
```

❌ **Termux 전용 명령어**
```bash
pkg install     # X (Termux 필요)
termux-setup    # X (Termux 필요)
```

### 해결 방법

**파일 편집:**
- VibeCode 내장 편집기 사용
- 또는 `cat` + `echo`로 수정

```bash
echo "new content" > file.txt
```

**인터랙티브 작업:**
- Termux 앱 사용
- 또는 웹 기반 IDE

## 트러블슈팅

### "Permission denied" 오류

```bash
# 권한 없는 경로 접근
cd /system/app
```

**해결:** 접근 가능한 경로 사용
```bash
cd /data/data/com.termux/files/home
```

### 명령어를 찾을 수 없음

```bash
node: command not found
```

**해결:** Termux에서 패키지 설치
```bash
# Termux 앱에서
pkg install nodejs

# VibeCode 터미널에서 확인
node -v
```

### 출력이 표시되지 않음

일부 명령어는 출력이 없을 수 있습니다:

```bash
cd mydir    # 출력 없음 (정상)
pwd         # 경로 확인
```

### 터미널이 멈춤

무한 루프나 긴 작업:
- "종료" 버튼 탭
- 터미널 화면 나가기
- 다시 터미널 열기

## 팁과 트릭

### 1. 자주 사용하는 명령어 모음

```bash
# 프로젝트 상태 확인
git status && npm run lint

# 빌드 및 테스트
npm run build && npm test

# 정리
rm -rf node_modules && npm install
```

### 2. 앨리어스 활용

```bash
# 짧은 명령어로 긴 경로 접근
alias proj='cd /data/data/com.termux/files/home/myproject'
proj
```

### 3. 명령어 체이닝

```bash
# 성공 시에만 다음 실행
git pull && npm install && npm start

# 실패 시에만 다음 실행
npm test || echo "Tests failed!"
```

### 4. 명령어 히스토리 활용

자주 쓰는 명령어:
1. 한 번 입력
2. ↑ 버튼으로 불러오기
3. 수정 후 실행

## 예제: 일반적인 워크플로우

### Git 프로젝트 작업

```bash
# 1. 프로젝트로 이동
cd ~/myproject

# 2. 최신 변경사항 가져오기
git pull

# 3. 변경사항 확인
git status

# 4. 파일 추가
git add .

# 5. 커밋
git commit -m "Update feature"

# 6. 푸시
git push
```

### Node.js 프로젝트

```bash
# 1. 프로젝트로 이동
cd ~/nodejs-app

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. 테스트
npm test
```

### Claude Code 작업

```bash
# 1. 프로젝트 디렉토리로
cd ~/claude-project

# 2. Claude.md 확인
cat .claude/Claude.md

# 3. 변경사항 커밋
git add .claude/
git commit -m "Update Claude config"
```

## 추가 리소스

- [VibeCode README](README.md)
- [Termux 빌드 가이드](TERMUX_BUILD_GUIDE.md)
- [Android Shell Commands](https://developer.android.com/studio/command-line/adb)

## 피드백

터미널 기능 개선 제안이 있으시면 GitHub Issues에 올려주세요!
