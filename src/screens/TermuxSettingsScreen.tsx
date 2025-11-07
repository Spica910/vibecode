import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, TermuxConfig } from '../types';
import { StorageService } from '../utils/storage';
import { FileSystemService } from '../utils/fileSystem';

type TermuxSettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'TermuxSettings'
>;

interface Props {
  navigation: TermuxSettingsScreenNavigationProp;
}

const TermuxSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [config, setConfig] = useState<TermuxConfig>({
    workingDirectory: '/data/data/com.termux/files/home',
    pythonPath: '',
    nodePath: '',
    gitPath: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<TermuxConfig>(config);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
  }, [config, originalConfig]);

  const loadConfig = async () => {
    const loadedConfig = await StorageService.getTermuxConfig();
    if (loadedConfig) {
      setConfig(loadedConfig);
      setOriginalConfig(loadedConfig);
    }
  };

  const handleSave = async () => {
    await StorageService.saveTermuxConfig(config);
    setOriginalConfig(config);
    Alert.alert('성공', 'Termux 설정이 저장되었습니다.');
  };

  const handleDiscard = () => {
    Alert.alert(
      '변경사항 취소',
      '저장하지 않은 변경사항을 취소하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          style: 'destructive',
          onPress: () => setConfig(originalConfig),
        },
      ]
    );
  };

  const detectPaths = async () => {
    // Detect common paths
    const detectedConfig: Partial<TermuxConfig> = {};

    const pythonPaths = [
      '/data/data/com.termux/files/usr/bin/python',
      '/data/data/com.termux/files/usr/bin/python3',
    ];

    const nodePaths = [
      '/data/data/com.termux/files/usr/bin/node',
    ];

    const gitPaths = [
      '/data/data/com.termux/files/usr/bin/git',
    ];

    for (const path of pythonPaths) {
      if (await FileSystemService.fileExists(path)) {
        detectedConfig.pythonPath = path;
        break;
      }
    }

    for (const path of nodePaths) {
      if (await FileSystemService.fileExists(path)) {
        detectedConfig.nodePath = path;
        break;
      }
    }

    for (const path of gitPaths) {
      if (await FileSystemService.fileExists(path)) {
        detectedConfig.gitPath = path;
        break;
      }
    }

    setConfig({ ...config, ...detectedConfig });
    Alert.alert('탐지 완료', '환경 경로를 자동으로 감지했습니다.');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 경로</Text>

          <Text style={styles.label}>작업 디렉토리</Text>
          <TextInput
            style={styles.input}
            value={config.workingDirectory}
            onChangeText={(text) =>
              setConfig({ ...config, workingDirectory: text })
            }
            placeholder="/data/data/com.termux/files/home"
          />
          <Text style={styles.hint}>
            Claude Code 프로젝트의 기본 작업 디렉토리
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>실행 파일 경로</Text>

          <Text style={styles.label}>Python 경로</Text>
          <TextInput
            style={styles.input}
            value={config.pythonPath}
            onChangeText={(text) => setConfig({ ...config, pythonPath: text })}
            placeholder="/data/data/com.termux/files/usr/bin/python"
          />

          <Text style={styles.label}>Node.js 경로</Text>
          <TextInput
            style={styles.input}
            value={config.nodePath}
            onChangeText={(text) => setConfig({ ...config, nodePath: text })}
            placeholder="/data/data/com.termux/files/usr/bin/node"
          />

          <Text style={styles.label}>Git 경로</Text>
          <TextInput
            style={styles.input}
            value={config.gitPath}
            onChangeText={(text) => setConfig({ ...config, gitPath: text })}
            placeholder="/data/data/com.termux/files/usr/bin/git"
          />

          <TouchableOpacity
            style={styles.detectButton}
            onPress={detectPaths}>
            <Text style={styles.detectButtonText}>자동 감지</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termux 설정 가이드</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              1. 필수 패키지 설치:{'\n'}
              <Text style={styles.codeText}>
                pkg install nodejs python git
              </Text>
            </Text>
            <Text style={styles.infoText}>
              {'\n'}2. Android 스토리지 권한:{'\n'}
              <Text style={styles.codeText}>termux-setup-storage</Text>
            </Text>
            <Text style={styles.infoText}>
              {'\n'}3. Claude Code 설치:{'\n'}
              <Text style={styles.codeText}>npm install -g @anthropic-ai/claude-code</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {hasChanges && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonDiscard]}
              onPress={handleDiscard}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={handleSave}>
              <Text style={[styles.buttonText, styles.buttonTextSave]}>
                저장
              </Text>
            </TouchableOpacity>
          </>
        )}
        {!hasChanges && (
          <Text style={styles.savedText}>모든 변경사항이 저장되었습니다</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  detectButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#333',
    color: '#fff',
    padding: 4,
    borderRadius: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  buttonDiscard: {
    backgroundColor: '#ddd',
  },
  buttonSave: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonTextSave: {
    color: '#fff',
  },
  savedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default TermuxSettingsScreen;
