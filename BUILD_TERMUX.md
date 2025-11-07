# VibeCode - Termux 빌드 가이드

이 가이드는 Galaxy Tab의 Termux 환경에서 VibeCode APK를 빌드하는 방법을 설명합니다.

## 사전 요구사항

### 1. Termux 설치
Google Play Store 또는 F-Droid에서 Termux를 설치합니다.

### 2. 필수 패키지 설치

```bash
# Termux 패키지 업데이트
pkg update && pkg upgrade

# Node.js 설치
pkg install nodejs

# Git 설치
pkg install git

# JDK 설치 (Android 빌드에 필요)
pkg install openjdk-17

# Gradle 설치
pkg install gradle
```

### 3. Android SDK 설정 (선택사항)

Termux에서 전체 Android SDK를 설치하는 것은 복잡할 수 있습니다.
대신, 빌드에 필요한 최소한의 도구만 사용하거나,
PC에서 빌드 후 APK만 Termux로 전송하는 방법도 있습니다.

## 프로젝트 클론 및 빌드

### 1. 저장소 클론

```bash
# 홈 디렉토리로 이동
cd ~

# 저장소 클론
git clone https://github.com/Spica910/vibecode.git
cd vibecode

# 작업 브랜치로 전환
git checkout claude/android-termux-setup-011CUsc53RvhCRLRWo8u63az
```

### 2. 의존성 설치

```bash
# NPM 패키지 설치
npm install
```

### 3. APK 빌드

#### Debug APK (빠른 빌드)

```bash
# Android 디렉토리로 이동
cd android

# Debug APK 빌드
./gradlew assembleDebug
```

빌드가 완료되면 APK는 다음 위치에 생성됩니다:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release APK (배포용)

```bash
# Android 디렉토리로 이동
cd android

# Release APK 빌드
./gradlew assembleRelease
```

빌드가 완료되면 APK는 다음 위치에 생성됩니다:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**참고**: Release APK는 서명이 필요합니다. 서명 없이도 설치할 수 있지만,
Play Store에 업로드하거나 정식 배포하려면 키스토어로 서명해야 합니다.

### 4. APK 설치

```bash
# Debug APK 설치
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 또는 파일 매니저를 통해 수동 설치
```

## NPM Scripts 활용

`package.json`에 정의된 스크립트를 사용할 수도 있습니다:

```bash
# Android 빌드 및 실행 (에뮬레이터 또는 연결된 기기 필요)
npm run android

# Metro bundler 시작
npm start

# Release APK 빌드
npm run build:android
```

## 트러블슈팅

### 1. Gradle 빌드 실패

**문제**: `Plugin [id: 'org.jetbrains.kotlin.jvm'] was not found`

**해결**:
```bash
# Gradle 캐시 정리
cd android
./gradlew clean

# 다시 빌드
./gradlew assembleDebug
```

### 2. 메모리 부족

Gradle 빌드 시 메모리가 부족할 수 있습니다.

**해결**: `android/gradle.properties`에 다음 추가:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
org.gradle.daemon=true
org.gradle.parallel=true
```

### 3. Node 모듈 오류

**해결**:
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### 4. Gradle Wrapper 권한 오류

**해결**:
```bash
chmod +x android/gradlew
```

## 빌드 최적화

### 빠른 빌드를 위한 팁

1. **Gradle Daemon 사용**: 이미 설정되어 있음
2. **병렬 빌드**: `gradle.properties`에서 활성화됨
3. **증분 빌드**: 가능한 경우 `clean`을 피하고 바로 빌드

### 빌드 시간 단축

첫 빌드는 모든 의존성을 다운로드하므로 시간이 오래 걸립니다 (10-30분).
이후 빌드는 훨씬 빠릅니다 (1-5분).

## APK 공유

빌드된 APK를 다른 기기와 공유하려면:

```bash
# APK 파일 위치 확인
ls -lh android/app/build/outputs/apk/debug/

# Termux storage 접근 허용 (처음 한 번만)
termux-setup-storage

# APK를 Download 폴더로 복사
cp android/app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/vibecode.apk
```

이제 파일 매니저에서 `vibecode.apk`를 찾아 설치하거나 공유할 수 있습니다.

## 추가 정보

- **프로젝트 구조**: `CLAUDE_CODE_STRUCTURE.md` 참고
- **개발 가이드**: `README.md` 참고
- **이슈 보고**: GitHub Issues 사용

## 빌드 환경 정보

- **React Native**: 0.72.6
- **Node.js**: >=18
- **JDK**: 17 이상 권장
- **Gradle**: 8.0.1
- **Android**: minSdk 21, targetSdk 33

---

빌드 중 문제가 발생하면 GitHub Issues에 보고해주세요!
