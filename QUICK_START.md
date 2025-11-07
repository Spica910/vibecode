# VibeCode 빠른 시작 가이드

VibeCode를 Galaxy Tab에서 실행하는 방법을 안내합니다.

## 🎯 가장 쉬운 방법: GitHub Actions로 APK 다운로드

**빌드 없이 바로 설치하세요!**

### APK 다운로드 방법

1. **GitHub 저장소 방문**
   - https://github.com/Spica910/vibecode

2. **Actions 탭 클릭**
   - 상단 메뉴에서 "Actions" 선택

3. **최신 빌드 선택**
   - "Build Android APK" 워크플로우 클릭
   - 가장 최근 성공한 빌드(초록색 체크마크) 선택

4. **APK 다운로드**
   - 하단 "Artifacts" 섹션에서:
     - `app-debug` - 디버그 APK (권장, 설치 쉬움)
     - `app-release` - 릴리스 APK (최적화됨)
   - ZIP 파일 다운로드 후 압축 해제

5. **APK 설치**
   - Galaxy Tab에서 다운로드한 `.apk` 파일 탭
   - "설치" 버튼 클릭

### 수동으로 새 APK 빌드하기

최신 코드로 새로운 APK가 필요한 경우:

1. **Actions 탭** → "Build Android APK" 워크플로우
2. **"Run workflow"** 버튼 클릭
3. 브랜치 선택 (기본: `claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az`)
4. **"Run workflow"** 클릭
5. 5-10분 대기 후 Artifacts에서 다운로드

---

## 📱 Termux에서 직접 빌드 (고급 사용자)

### 1단계: Termux 설치 및 준비

```bash
# Termux 패키지 업데이트
pkg update && pkg upgrade -y

# 필수 패키지 설치
pkg install -y nodejs git openjdk-17 gradle
```

### 2단계: 저장소 클론

```bash
# 홈 디렉토리로 이동
cd ~

# VibeCode 저장소 클론
git clone https://github.com/Spica910/vibecode.git

# 프로젝트 디렉토리로 이동
cd vibecode

# 최신 작업 브랜치로 전환
git checkout claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az
```

### 3단계: 의존성 설치

```bash
# NPM 패키지 설치 (3-5분 소요)
npm install
```

### 4단계: APK 빌드

#### Debug APK (개발/테스트용)

```bash
# Android 디렉토리로 이동
cd android

# Debug APK 빌드 (첫 빌드는 10-20분 소요)
./gradlew assembleDebug

# APK 위치 확인
ls -lh app/build/outputs/apk/debug/app-debug.apk
```

#### Release APK (배포용)

```bash
# Release APK 빌드
./gradlew assembleRelease

# APK 위치
ls -lh app/build/outputs/apk/release/app-release-unsigned.apk
```

### 5단계: APK 설치

#### 방법 1: Termux Storage 사용

```bash
# Termux storage 접근 허용 (처음 한 번만)
termux-setup-storage

# APK를 Download 폴더로 복사
cp app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/vibecode.apk
```

이제 파일 매니저에서 `Downloads/vibecode.apk`를 찾아 설치하세요.

#### 방법 2: ADB 사용 (PC 연결 시)

```bash
# Galaxy Tab을 PC에 연결 후
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 💻 PC에서 개발 환경 설정

PC에서 개발하고 Galaxy Tab에서 테스트하는 방법입니다.

### 사전 요구사항

- Node.js 18 이상
- JDK 17 이상
- Android SDK
- Android Studio (권장)

### 1. 저장소 클론

```bash
git clone https://github.com/Spica910/vibecode.git
cd vibecode
git checkout claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Android Studio에서 열기

```bash
# Android Studio에서 File > Open > vibecode/android 선택
```

### 4. 개발 서버 실행

```bash
# Metro bundler 시작
npm start
```

### 5. 앱 실행

**에뮬레이터 사용:**
```bash
npm run android
```

**실제 기기 (Galaxy Tab) 사용:**
```bash
# USB 디버깅 활성화 후
adb devices  # 기기 연결 확인
npm run android
```

## 🔧 트러블슈팅

### Gradle 빌드 실패

**문제**: `Plugin [id: 'org.jetbrains.kotlin.jvm'] was not found`

**해결**:
```bash
cd android
./gradlew clean
./gradlew assembleDebug --refresh-dependencies
```

### 메모리 부족

Termux에서 빌드 시 메모리가 부족할 수 있습니다.

**해결**: `android/gradle.properties` 수정
```properties
org.gradle.jvmargs=-Xmx1536m -XX:MaxPermSize=512m
org.gradle.daemon=true
org.gradle.parallel=false
```

### Node 모듈 오류

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 이미 사용 중

```bash
# Metro bundler port 충돌 시
npx react-native start --port 8082
```

## 📂 프로젝트 구조

```
vibecode/
├── android/              # Android 네이티브 코드
│   ├── app/
│   │   └── src/main/java/com/vibecode/
│   │       └── modules/
│   │           └── ShellModule.java  # Shell 실행 모듈
│   └── build.gradle
├── src/
│   ├── screens/          # 모든 화면 컴포넌트
│   │   ├── HomeScreen.tsx
│   │   ├── ProjectListScreen.tsx
│   │   ├── ProjectDetailScreen.tsx
│   │   ├── GitCloneScreen.tsx         # Git 클론 화면
│   │   ├── GitManageScreen.tsx        # Git 관리 화면
│   │   ├── TerminalWebViewScreen.tsx  # 터미널
│   │   └── ...
│   ├── services/
│   │   └── ShellService.ts           # Shell 명령 실행
│   ├── utils/
│   │   └── claudeCode.ts            # Claude Code 파일 시스템
│   └── types/
│       └── index.ts                 # TypeScript 타입
├── App.tsx              # 메인 앱 컴포넌트
├── package.json
└── README.md
```

## ✨ 주요 기능

### 🔽 Git 저장소 클론
- URL 입력만으로 간편한 클론
- 자동 프로젝트 추가
- Claude Code 구조 자동 초기화

### 🔄 Git 관리
- Status, Pull, Add, Commit, Push
- **한 번에 Commit & Push**
- 커밋 메시지 자동 생성
- 실시간 명령 출력

### 💻 WebView 터미널
- VS Code 스타일 터미널
- xterm.js 기반
- 색상 및 포맷팅 지원

### 📝 Claude Code 통합
- `.claude/` 디렉토리 구조
- Agent 설정 (`.claude/agents/*.json`)
- Skills 설정 (`.claude/skills/*.sh`)
- Claude.md 편집

## 🚀 다음 단계

1. **앱 설치 후 첫 실행**
   - Termux 경로 확인: `/data/data/com.termux/files/home/`
   - 프로젝트 추가 또는 Git 클론

2. **Git 저장소 클론**
   - 프로젝트 목록에서 🔽 버튼
   - GitHub URL 입력
   - 자동으로 프로젝트 추가됨

3. **프로젝트 작업**
   - Claude.md 작성
   - Agent/Skills 설정
   - 터미널에서 코드 실행

4. **변경사항 업로드**
   - Git 관리 메뉴
   - 커밋 메시지 입력
   - 🚀 Commit & Push 버튼

## 📖 추가 문서

- **상세 빌드 가이드**: `BUILD_TERMUX.md`
- **Claude Code 구조**: `CLAUDE_CODE_STRUCTURE.md`
- **프로젝트 README**: `README.md`

## 🐛 이슈 보고

문제가 발생하면 GitHub Issues에 보고해주세요:
https://github.com/Spica910/vibecode/issues

---

**현재 최신 브랜치**: `claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az`

모든 기능이 완성되어 있습니다! 🎉
