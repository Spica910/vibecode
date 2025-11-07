#!/bin/bash

# VibeCode 빠른 빌드 스크립트
# Galaxy Tab Termux 환경용

set -e

echo "======================================"
echo "  VibeCode APK 빌드 스크립트"
echo "======================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 환경 확인
echo -e "${BLUE}[1/6] 환경 확인 중...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo "설치: pkg install nodejs"
    exit 1
fi

if ! command -v gradle &> /dev/null; then
    echo -e "${RED}❌ Gradle이 설치되어 있지 않습니다.${NC}"
    echo "설치: pkg install gradle"
    exit 1
fi

if ! command -v javac &> /dev/null; then
    echo -e "${RED}❌ JDK가 설치되어 있지 않습니다.${NC}"
    echo "설치: pkg install openjdk-17"
    exit 1
fi

echo -e "${GREEN}✅ 모든 필수 패키지가 설치되어 있습니다.${NC}"
echo ""

# 2. 의존성 확인
echo -e "${BLUE}[2/6] NPM 의존성 확인 중...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules가 없습니다. npm install을 실행합니다...${NC}"
    npm install
else
    echo -e "${GREEN}✅ node_modules가 존재합니다.${NC}"
fi
echo ""

# 3. Android 디렉토리 확인
echo -e "${BLUE}[3/6] Android 프로젝트 확인 중...${NC}"

if [ ! -d "android" ]; then
    echo -e "${RED}❌ android 디렉토리를 찾을 수 없습니다.${NC}"
    exit 1
fi

cd android
echo -e "${GREEN}✅ Android 프로젝트 확인됨${NC}"
echo ""

# 4. Gradle wrapper 권한 설정
echo -e "${BLUE}[4/6] Gradle wrapper 권한 설정...${NC}"
chmod +x gradlew
echo -e "${GREEN}✅ 권한 설정 완료${NC}"
echo ""

# 5. APK 빌드
echo -e "${BLUE}[5/6] APK 빌드 시작...${NC}"
echo -e "${YELLOW}⏳ 첫 빌드는 10-20분 정도 소요될 수 있습니다.${NC}"
echo ""

# 빌드 타입 선택
BUILD_TYPE=${1:-debug}

if [ "$BUILD_TYPE" = "release" ]; then
    echo -e "${YELLOW}Release APK를 빌드합니다...${NC}"
    gradle assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
else
    echo -e "${YELLOW}Debug APK를 빌드합니다...${NC}"
    gradle assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

echo ""

# 6. 빌드 결과 확인
echo -e "${BLUE}[6/6] 빌드 결과 확인...${NC}"

if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}✅ APK 빌드 성공!${NC}"
    echo ""
    echo "======================================"
    echo -e "${GREEN}  빌드 완료!${NC}"
    echo "======================================"
    echo ""
    echo "APK 위치: android/$APK_PATH"
    echo ""

    # APK 크기 확인
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "APK 크기: $APK_SIZE"
    echo ""

    # 다음 단계 안내
    echo -e "${YELLOW}다음 단계:${NC}"
    echo ""
    echo "1. Termux storage 접근 허용 (처음 한 번만):"
    echo "   termux-setup-storage"
    echo ""
    echo "2. APK를 Download 폴더로 복사:"
    echo "   cp $APK_PATH ~/storage/downloads/vibecode.apk"
    echo ""
    echo "3. 파일 매니저에서 vibecode.apk를 찾아 설치"
    echo ""

    # 자동 복사 옵션
    read -p "지금 Download 폴더로 복사하시겠습니까? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -d "$HOME/storage/downloads" ]; then
            cp "$APK_PATH" "$HOME/storage/downloads/vibecode.apk"
            echo -e "${GREEN}✅ APK가 Download 폴더로 복사되었습니다!${NC}"
            echo "파일 매니저에서 'vibecode.apk'를 찾아 설치하세요."
        else
            echo -e "${YELLOW}⚠️  storage가 설정되지 않았습니다.${NC}"
            echo "먼저 'termux-setup-storage'를 실행한 후 다시 시도하세요."
        fi
    fi

else
    echo -e "${RED}❌ APK 빌드 실패${NC}"
    echo "로그를 확인하고 오류를 해결한 후 다시 시도하세요."
    exit 1
fi

echo ""
echo "======================================"
echo "  VibeCode를 사용해주셔서 감사합니다!"
echo "======================================"
