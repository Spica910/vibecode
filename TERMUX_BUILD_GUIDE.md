# Termux에서 VibeCode 빌드하기

이 가이드는 Android 기기의 Termux 환경에서 VibeCode를 직접 빌드하는 방법을 설명합니다.

## 사전 요구사항

- Android 기기 (갤럭시 탭 등)
- Termux 앱 설치
- 최소 5GB 이상의 저장 공간
- 안정적인 인터넷 연결

## 1단계: Termux 기본 설정

### Termux 업데이트

```bash
pkg update && pkg upgrade -y
```

### 스토리지 권한 설정

```bash
termux-setup-storage
```

스토리지 권한 요청 시 "허용"을 선택하세요.

## 2단계: 필수 패키지 설치

### Node.js 및 기본 도구

```bash
pkg install nodejs python git wget unzip -y
```

### OpenJDK 17 설치

```bash
pkg install openjdk-17 -y
```

### 환경 변수 확인

```bash
java -version
node -v
npm -v
```

## 3단계: Gradle 설치

```bash
# Gradle 다운로드
cd ~
wget https://services.gradle.org/distributions/gradle-8.0.1-bin.zip

# 압축 해제
unzip gradle-8.0.1-bin.zip

# 이동
mv gradle-8.0.1 gradle

# 환경 변수 설정
echo 'export PATH=$PATH:$HOME/gradle/bin' >> ~/.bashrc
source ~/.bashrc

# 확인
gradle -v
```

## 4단계: Android SDK 설치

### Command Line Tools 다운로드

```bash
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
```

### SDK 디렉토리 구조 생성

```bash
mkdir -p Android/Sdk/cmdline-tools
mv cmdline-tools Android/Sdk/cmdline-tools/latest
```

### 환경 변수 설정

```bash
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

### SDK 컴포넌트 설치

```bash
# 라이선스 동의
yes | sdkmanager --licenses

# 필수 컴포넌트 설치
sdkmanager "platforms;android-33"
sdkmanager "build-tools;33.0.0"
sdkmanager "platform-tools"
sdkmanager "cmdline-tools;latest"
```

설치에는 시간이 걸릴 수 있습니다 (10-30분).

## 5단계: 프로젝트 클론 및 설정

### 저장소 클론

```bash
cd ~
git clone https://github.com/yourusername/vibecode.git
cd vibecode
```

### 의존성 설치

```bash
npm install
```

설치에는 5-15분이 걸릴 수 있습니다.

### 권한 설정

```bash
chmod +x android/gradlew
```

## 6단계: 빌드

### Debug 빌드 (개발용)

```bash
cd android
./gradlew assembleDebug
```

빌드 완료 후 APK 위치:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release 빌드 (배포용)

```bash
cd android
./gradlew assembleRelease
```

빌드 완료 후 APK 위치:
```
android/app/build/outputs/apk/release/app-release.apk
```

첫 빌드는 30분-1시간 정도 걸릴 수 있습니다.

## 7단계: APK 설치

### 방법 1: ADB 사용 (USB 디버깅)

```bash
# USB 디버깅 활성화 필요
pkg install android-tools
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 방법 2: 파일 직접 전송

```bash
# APK를 공유 스토리지로 복사
cp android/app/build/outputs/apk/release/app-release.apk ~/storage/downloads/

# 파일 앱에서 다운로드 폴더의 APK를 찾아 설치
```

## 개발 모드 실행

### Metro 서버 시작

```bash
cd ~/vibecode
npm start
```

### 다른 Termux 세션에서 앱 실행

```bash
cd ~/vibecode
npm run android
```

## 최적화 팁

### 빌드 속도 향상

`android/gradle.properties`에 추가:

```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
```

### 메모리 부족 시

```bash
# Gradle에 더 많은 메모리 할당
export GRADLE_OPTS="-Xmx2048m -XX:MaxPermSize=512m"
```

### 빌드 캐시 정리

```bash
cd android
./gradlew clean
rm -rf ~/.gradle/caches/
```

## 문제 해결

### "Out of memory" 오류

```bash
# Gradle 데몬 중지
./gradlew --stop

# 캐시 정리 후 재시도
./gradlew clean
./gradlew assembleRelease
```

### "SDK not found" 오류

```bash
# 환경 변수 재설정
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
source ~/.bashrc

# SDK 경로 확인
ls $ANDROID_HOME
```

### "Permission denied" 오류

```bash
# 권한 부여
chmod +x android/gradlew
chmod -R 755 android/
```

### Gradle 버전 충돌

```bash
# Gradle wrapper 재생성
cd android
gradle wrapper --gradle-version=8.0.1
```

### 네트워크 오류

```bash
# Gradle 다운로드 타임아웃 증가
echo "systemProp.http.socketTimeout=60000" >> android/gradle.properties
echo "systemProp.http.connectionTimeout=60000" >> android/gradle.properties
```

## 빌드 시간 예상

| 단계 | 시간 |
|------|------|
| 패키지 설치 | 10-20분 |
| SDK 다운로드 | 10-30분 |
| npm install | 5-15분 |
| 첫 빌드 | 30-60분 |
| 이후 빌드 | 5-10분 |

**총 예상 시간: 1-2시간 (첫 설정)**

## 유용한 명령어

```bash
# 빌드 정보 확인
cd android && ./gradlew -v

# 프로젝트 정보
./gradlew projects

# 의존성 확인
./gradlew dependencies

# 빌드 변형 확인
./gradlew tasks

# APK 서명 확인
jarsigner -verify -verbose -certs app-release.apk
```

## 추가 리소스

- [Termux Wiki](https://wiki.termux.com)
- [React Native Documentation](https://reactnative.dev)
- [Android Developer Guide](https://developer.android.com)

## 주의사항

1. **배터리**: 빌드 중 충전기를 연결하세요
2. **메모리**: 다른 앱을 종료하여 메모리 확보
3. **네트워크**: 안정적인 WiFi 사용 권장
4. **저장 공간**: 최소 5GB 여유 공간 필요

## 성공적인 빌드 후

APK 설치 완료 후:

1. 앱 실행
2. "Termux 설정"에서 환경 설정
3. 프로젝트 추가
4. Claude Code 사용 시작!

## 지원

문제가 발생하면 GitHub Issues에 다음 정보와 함께 올려주세요:

- Termux 버전
- Android 버전
- 오류 메시지
- 빌드 로그 (`./gradlew assembleRelease --stacktrace`)
