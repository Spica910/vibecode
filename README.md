# VibeCode

<div align="center">

![VibeCode Logo](https://img.shields.io/badge/VibeCode-Claude_Code_Manager-6200ee?style=for-the-badge)

**Galaxy Tab용 Claude Code 관리 앱**

[![React Native](https://img.shields.io/badge/React_Native-0.72-61dafb?style=flat-square&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-21+-3ddc84?style=flat-square&logo=android)](https://www.android.com/)

</div>

## 📱 소개

VibeCode는 Galaxy Tab과 Termux 환경에서 Claude Code 프로젝트를 편리하게 관리할 수 있는 Android 앱입니다.

### ✨ 주요 기능

- 🔽 **Git 저장소 원클릭 클론** - URL만 입력하면 자동으로 프로젝트 추가
- 🔄 **Git 관리** - Commit, Push, Pull을 버튼 하나로
- 💻 **내장 터미널** - VS Code 스타일의 WebView 터미널 (xterm.js)
- 📝 **Claude.md 편집** - Claude 설정 파일 편집기
- 🤖 **Agent 관리** - `.claude/agents/*.json` 파일 기반
- ⚡ **Skills 관리** - `.claude/skills/*.sh` 실행 가능한 스크립트
- 📂 **프로젝트 관리** - 여러 Claude Code 프로젝트 동시 관리
- 🎨 **다크 테마** - 개발자 친화적인 UI

## 🚀 빠른 시작

### 방법 1: GitHub Actions로 APK 다운로드 (가장 쉬움!)

빌드 없이 바로 사용 가능한 APK를 다운로드하세요:

1. **GitHub Repository 방문**: https://github.com/Spica910/vibecode
2. **Actions 탭** 클릭
3. 최신 성공한 워크플로우 선택
4. **Artifacts** 섹션에서 다운로드:
   - `app-debug.apk` - 디버그 버전 (권장)
   - `app-release.apk` - 릴리스 버전

또는 **수동으로 빌드 트리거**:
1. Actions 탭 → "Build Android APK" 선택
2. "Run workflow" 버튼 클릭
3. 빌드 완료 후 Artifacts 다운로드

### 방법 2: Termux에서 직접 빌드

```bash
# 1. 필수 패키지 설치
pkg update && pkg install -y nodejs git openjdk-17 gradle

# 2. 저장소 클론
git clone https://github.com/Spica910/vibecode.git
cd vibecode
git checkout claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az

# 3. 의존성 설치
npm install

# 4. APK 빌드
cd android
./gradlew assembleDebug

# 5. APK 설치
termux-setup-storage
cp app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/vibecode.apk
```

**자세한 내용**: **[빠른 시작 가이드](QUICK_START.md)** 참고

## 📖 문서

- **[빠른 시작 가이드](QUICK_START.md)** - 설치 및 실행 방법
- **[Termux 빌드 가이드](BUILD_TERMUX.md)** - 상세 빌드 설명
- **[Claude Code 구조](CLAUDE_CODE_STRUCTURE.md)** - 파일 시스템 구조

## 🎯 사용 예시

### 1. Git 저장소 클론

```
프로젝트 목록 → 🔽 버튼 → URL 입력 → 클론
```

자동으로 `.claude/` 디렉토리가 생성되고 프로젝트 목록에 추가됩니다.

### 2. 프로젝트 작업

```
프로젝트 선택 →
  • 💻 터미널에서 코드 실행
  • 📝 Claude.md 편집
  • 🤖 Agent 설정
  • ⚡ Skills 추가
```

### 3. 변경사항 업로드

```
Git 관리 → 커밋 메시지 입력 → 🚀 Commit & Push
```

## 🛠️ 기술 스택

### Frontend
- **React Native** 0.72 - 크로스 플랫폼 모바일 앱
- **TypeScript** 5.3 - 타입 안정성
- **React Navigation** - 화면 내비게이션
- **AsyncStorage** - 로컬 데이터 저장
- **React Native FS** - 파일 시스템 접근

### Backend/Native
- **Android** (Java) - 네이티브 Shell 모듈
- **Node.js** - JavaScript 런타임
- **xterm.js** - 터미널 에뮬레이터

### Build System
- **Gradle** 8.0 - Android 빌드
- **Metro** - React Native 번들러

## 📂 프로젝트 구조

```
vibecode/
├── android/                    # Android 네이티브
│   ├── app/src/main/java/com/vibecode/
│   │   └── modules/
│   │       └── ShellModule.java  # Shell 실행 모듈
│   ├── build.gradle
│   └── settings.gradle
├── src/
│   ├── screens/               # UI 화면
│   │   ├── HomeScreen.tsx
│   │   ├── ProjectListScreen.tsx
│   │   ├── ProjectDetailScreen.tsx
│   │   ├── GitCloneScreen.tsx         # Git 클론
│   │   ├── GitManageScreen.tsx        # Git 관리
│   │   ├── TerminalWebViewScreen.tsx  # 터미널
│   │   ├── ClaudeEditorScreen.tsx
│   │   ├── AgentSettingsScreen.tsx
│   │   ├── SkillSettingsScreen.tsx
│   │   └── TermuxSettingsScreen.tsx
│   ├── services/              # 비즈니스 로직
│   │   └── ShellService.ts
│   ├── utils/                 # 유틸리티
│   │   ├── claudeCode.ts      # Claude Code 파일 시스템
│   │   ├── storage.ts
│   │   └── fileSystem.ts
│   └── types/                 # TypeScript 타입
│       └── index.ts
├── App.tsx
├── package.json
├── README.md
├── QUICK_START.md             # 빠른 시작 가이드
├── BUILD_TERMUX.md            # Termux 빌드 가이드
└── CLAUDE_CODE_STRUCTURE.md   # Claude Code 구조
```

## 🔧 개발 환경

### 요구사항

- **Node.js**: >= 18
- **JDK**: 17 이상
- **Android SDK**: API 21+ (minSdk 21, targetSdk 33)
- **Gradle**: 8.0+

### 개발 서버 실행

```bash
# Metro bundler 시작
npm start

# Android 앱 실행 (에뮬레이터 또는 실제 기기)
npm run android
```

### 빌드

```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK
cd android && ./gradlew assembleRelease
```

## 📱 앱 기능 상세

### 🔽 Git 클론 화면
- GitHub, GitLab 등 모든 Git 저장소 지원
- HTTPS 및 SSH URL 지원
- 브랜치 선택 기능
- 클론 경로 커스터마이징
- 실시간 클론 진행 상황 표시
- 자동 `.claude/` 디렉토리 초기화

### 🔄 Git 관리 화면
- **Status**: 현재 변경사항 확인
- **Pull**: 원격 저장소에서 최신 변경사항 가져오기
- **Add All**: 모든 변경사항 스테이징
- **Commit**: 변경사항 커밋
- **Push**: 원격 저장소로 푸시
- **Commit & Push**: 한 번에 커밋+푸시 (가장 많이 사용!)
- 🎲 커밋 메시지 자동 생성 버튼
- 현재 브랜치 표시
- 실시간 Git 명령 출력

### 💻 터미널 화면
- xterm.js 기반 WebView 터미널
- ANSI 색상 지원
- 명령 히스토리
- 탭 완성
- VS Code와 유사한 UI/UX
- 프로젝트별 작업 디렉토리 자동 설정

### 📝 Claude.md 편집기
- 섹션별 템플릿 제공
- 실시간 편집 및 저장
- `.claude/` 디렉토리 자동 생성
- 프로젝트별 독립적인 설정

### 🤖 Agent 설정
- `.claude/agents/*.json` 파일 관리
- 실행 가능한 JSON 기반 설정
- Agent 활성화/비활성화 토글
- 커스텀 Agent 추가
- Trigger 설정 지원

### ⚡ Skills 설정
- `.claude/skills/*.sh` 실행 스크립트 관리
- Shell 명령어 기반
- Skills 활성화/비활성화
- 커스텀 명령어 추가
- 실행 권한 자동 설정

## 🐛 문제 해결

### Gradle 빌드 오류

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

## 🤝 기여하기

기여를 환영합니다! 다음과 같은 방법으로 참여하실 수 있습니다:

1. 이슈 보고
2. 기능 제안
3. Pull Request 제출
4. 문서 개선

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🙏 감사의 말

- **Claude** by Anthropic - AI 코딩 어시스턴트
- **Claude Code** - CLI 도구
- **React Native** - 크로스 플랫폼 프레임워크
- **xterm.js** - 터미널 에뮬레이터
- **Termux** - Android 터미널 앱

## 📧 문의

- **GitHub Issues**: https://github.com/Spica910/vibecode/issues
- **Repository**: https://github.com/Spica910/vibecode

---

<div align="center">

**현재 최신 브랜치**

`claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az`

Made with ❤️ for Claude Code users on Galaxy Tab

</div>
