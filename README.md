# VibeCode

Claude Code Manager for Android Termux

VibeCode는 갤럭시 탭과 Termux 환경에서 Claude Code를 더 쉽게 사용할 수 있도록 도와주는 Android 앱입니다.

## 주요 기능

- **프로젝트 관리**: Claude Code 프로젝트를 한 곳에서 관리
- **Claude.md 편집기**: 프로젝트별 Claude 설정 파일 편집
- **Agent 설정**: Agent를 활성화하고 관리
- **Skills 설정**: 커스텀 명령어(Skills) 설정
- **Termux 통합**: Termux 환경 설정 및 관리

## 기술 스택

- React Native 0.72
- TypeScript
- React Navigation
- AsyncStorage
- React Native FS

## Termux에서 빌드하기

### 1. 필수 패키지 설치

```bash
# 기본 패키지
pkg update && pkg upgrade
pkg install nodejs python git

# Android SDK 설치 (필수)
pkg install openjdk-17
pkg install android-tools

# Gradle 설치
wget https://services.gradle.org/distributions/gradle-8.0.1-bin.zip
unzip gradle-8.0.1-bin.zip
mv gradle-8.0.1 $HOME/gradle
export PATH=$PATH:$HOME/gradle/bin
```

### 2. Android SDK 설정

```bash
# Android SDK 다운로드 및 설치
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mkdir -p Android/Sdk/cmdline-tools
mv cmdline-tools Android/Sdk/cmdline-tools/latest

# 환경 변수 설정
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# SDK 설치
sdkmanager "platforms;android-33"
sdkmanager "build-tools;33.0.0"
sdkmanager "platform-tools"
```

### 3. 프로젝트 설정

```bash
# 프로젝트 클론
git clone https://github.com/yourusername/vibecode.git
cd vibecode

# 의존성 설치
npm install

# Android 권한 설정
chmod +x android/gradlew
```

### 4. 빌드

```bash
# Debug APK 빌드
cd android
./gradlew assembleDebug

# Release APK 빌드
./gradlew assembleRelease

# APK 위치
# Debug: android/app/build/outputs/apk/debug/app-debug.apk
# Release: android/app/build/outputs/apk/release/app-release.apk
```

### 5. 설치

```bash
# 디바이스에 설치 (USB 디버깅 필요)
adb install android/app/build/outputs/apk/release/app-release.apk

# 또는 APK 파일을 직접 디바이스로 전송하여 설치
```

## 개발 모드 실행

```bash
# Metro 서버 시작
npm start

# 다른 터미널에서 Android 앱 실행
npm run android
```

## 프로젝트 구조

```
vibecode/
├── android/                 # Android 네이티브 코드
├── src/
│   ├── screens/            # 화면 컴포넌트
│   │   ├── HomeScreen.tsx
│   │   ├── ProjectListScreen.tsx
│   │   ├── ProjectDetailScreen.tsx
│   │   ├── ClaudeEditorScreen.tsx
│   │   ├── AgentSettingsScreen.tsx
│   │   ├── SkillSettingsScreen.tsx
│   │   └── TermuxSettingsScreen.tsx
│   ├── components/         # 재사용 가능한 컴포넌트
│   ├── utils/             # 유틸리티 함수
│   │   ├── storage.ts     # AsyncStorage 관리
│   │   └── fileSystem.ts  # 파일 시스템 작업
│   └── types/             # TypeScript 타입 정의
├── App.tsx                # 메인 App 컴포넌트
├── package.json
└── tsconfig.json
```

## 사용 방법

### 1. 프로젝트 추가

1. 홈 화면에서 "프로젝트 관리" 선택
2. 우측 하단 "+" 버튼 클릭
3. 프로젝트 이름과 경로 입력
4. "추가" 버튼 클릭

### 2. Claude.md 편집

1. 프로젝트 목록에서 프로젝트 선택
2. "Claude.md 편집" 선택 (초기화 필요 시 먼저 초기화)
3. 템플릿 버튼을 사용하여 섹션 추가
4. 내용 편집 후 "저장" 버튼 클릭

### 3. Agent 설정

1. 프로젝트 상세에서 "Agent 설정" 선택
2. 기본 Agent 목록 확인
3. 스위치로 Agent 활성화/비활성화
4. "+" 버튼으로 커스텀 Agent 추가 가능

### 4. Skills 설정

1. 프로젝트 상세에서 "Skills 설정" 선택
2. 기본 Skills 확인 (format, lint, test, build)
3. 스위치로 활성화/비활성화
4. "+" 버튼으로 커스텀 Skills 추가

### 5. Termux 설정

1. 홈 화면에서 "Termux 설정" 선택
2. "자동 감지" 버튼으로 경로 자동 탐지
3. 수동으로 경로 수정 가능
4. "저장" 버튼으로 설정 저장

## Termux 환경 설정

### 스토리지 권한

```bash
termux-setup-storage
```

### Claude Code 설치

```bash
npm install -g @anthropic-ai/claude-code
```

### 프로젝트 디렉토리 생성

```bash
cd ~
mkdir my-projects
cd my-projects
```

## 문제 해결

### Gradle 빌드 오류

```bash
# Gradle 캐시 정리
cd android
./gradlew clean

# 다시 빌드
./gradlew assembleRelease
```

### 파일 권한 오류

```bash
# gradlew 실행 권한 부여
chmod +x android/gradlew

# 스토리지 권한 재설정
termux-setup-storage
```

### Metro 서버 오류

```bash
# Metro 캐시 정리
npm start -- --reset-cache

# node_modules 재설치
rm -rf node_modules
npm install
```

## 라이선스

MIT License

## 기여

Pull Request는 언제나 환영합니다!

## 문의

이슈가 있으시면 GitHub Issues에 등록해주세요.
