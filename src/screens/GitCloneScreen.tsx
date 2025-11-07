import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import ShellService from '../services/ShellService';
import { ClaudeCodeService } from '../utils/claudeCode';

interface Props {
  navigation: any;
}

const GitCloneScreen: React.FC<Props> = ({ navigation }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [branch, setBranch] = useState('main');
  const [clonePath, setClonePath] = useState('/data/data/com.termux/files/home/projects');
  const [isCloning, setIsCloning] = useState(false);
  const [output, setOutput] = useState('');

  const handleClone = async () => {
    if (!repoUrl.trim()) {
      Alert.alert('오류', 'Git 저장소 URL을 입력해주세요.');
      return;
    }

    // Extract project name from URL if not provided
    let finalProjectName = projectName.trim();
    if (!finalProjectName) {
      const match = repoUrl.match(/\/([^\/]+)\.git$/);
      if (match) {
        finalProjectName = match[1];
      } else {
        const parts = repoUrl.split('/');
        finalProjectName = parts[parts.length - 1].replace('.git', '');
      }
    }

    if (!finalProjectName) {
      Alert.alert('오류', '프로젝트 이름을 입력해주세요.');
      return;
    }

    setIsCloning(true);
    setOutput('클론 시작...\n');

    try {
      // Create parent directory if it doesn't exist
      const parentExists = await RNFS.exists(clonePath);
      if (!parentExists) {
        await RNFS.mkdir(clonePath);
        setOutput(prev => prev + `디렉토리 생성: ${clonePath}\n`);
      }

      const fullPath = `${clonePath}/${finalProjectName}`;

      // Check if directory already exists
      const exists = await RNFS.exists(fullPath);
      if (exists) {
        Alert.alert('오류', `프로젝트가 이미 존재합니다: ${fullPath}`);
        setIsCloning(false);
        return;
      }

      // Execute git clone
      setOutput(prev => prev + `Git 클론 중: ${repoUrl}\n`);
      setOutput(prev => prev + `위치: ${fullPath}\n\n`);

      const cloneCommand = branch === 'main' || !branch.trim()
        ? `cd "${clonePath}" && git clone "${repoUrl}" "${finalProjectName}"`
        : `cd "${clonePath}" && git clone -b "${branch}" "${repoUrl}" "${finalProjectName}"`;

      const result = await ShellService.executeCommand(cloneCommand, clonePath);

      setOutput(prev => prev + result.output + '\n');

      if (result.exitCode === 0) {
        // Initialize Claude Code structure
        setOutput(prev => prev + '\nClaude Code 디렉토리 초기화 중...\n');
        await ClaudeCodeService.initializeClaudeDirectory(fullPath);

        // Add project to AsyncStorage
        const projectsJson = await AsyncStorage.getItem('projects');
        const projects = projectsJson ? JSON.parse(projectsJson) : [];

        const newProject = {
          id: Date.now().toString(),
          name: finalProjectName,
          path: fullPath,
          description: `Git: ${repoUrl}`,
          createdAt: new Date().toISOString(),
        };

        projects.push(newProject);
        await AsyncStorage.setItem('projects', JSON.stringify(projects));

        setOutput(prev => prev + '\n✅ 클론 완료!\n');
        setOutput(prev => prev + `프로젝트가 추가되었습니다: ${finalProjectName}\n`);

        Alert.alert(
          '성공',
          `저장소가 클론되었습니다!\n\n경로: ${fullPath}`,
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        setOutput(prev => prev + '\n❌ 클론 실패\n');
        Alert.alert('오류', `Git clone 실패:\n${result.output}`);
      }
    } catch (error: any) {
      setOutput(prev => prev + `\n오류: ${error.message}\n`);
      Alert.alert('오류', error.message);
    } finally {
      setIsCloning(false);
    }
  };

  const suggestPath = () => {
    const suggestions = [
      '/data/data/com.termux/files/home/projects',
      '/data/data/com.termux/files/home',
      '/storage/emulated/0/Documents/projects',
    ];

    Alert.alert(
      '경로 선택',
      '클론할 위치를 선택하세요',
      suggestions.map(path => ({
        text: path,
        onPress: () => setClonePath(path),
      }))
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Git 저장소 URL *</Text>
        <TextInput
          style={styles.input}
          value={repoUrl}
          onChangeText={setRepoUrl}
          placeholder="https://github.com/user/repo.git"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>프로젝트 이름 (선택사항)</Text>
        <TextInput
          style={styles.input}
          value={projectName}
          onChangeText={setProjectName}
          placeholder="자동으로 URL에서 추출됩니다"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>브랜치 (선택사항)</Text>
        <TextInput
          style={styles.input}
          value={branch}
          onChangeText={setBranch}
          placeholder="main"
          placeholderTextColor="#666"
          autoCapitalize="none"
        />

        <View style={styles.pathContainer}>
          <View style={styles.pathInputContainer}>
            <Text style={styles.label}>클론 위치 *</Text>
            <TextInput
              style={[styles.input, styles.pathInput]}
              value={clonePath}
              onChangeText={setClonePath}
              placeholder="/data/data/com.termux/files/home/projects"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.pathButton} onPress={suggestPath}>
            <Text style={styles.pathButtonText}>📁</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.cloneButton, isCloning && styles.cloneButtonDisabled]}
          onPress={handleClone}
          disabled={isCloning}
        >
          {isCloning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cloneButtonText}>🔽 저장소 클론</Text>
          )}
        </TouchableOpacity>

        {output ? (
          <View style={styles.outputContainer}>
            <Text style={styles.outputTitle}>출력:</Text>
            <ScrollView style={styles.outputScroll}>
              <Text style={styles.outputText}>{output}</Text>
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>예제 URL:</Text>
          <TouchableOpacity
            onPress={() => setRepoUrl('https://github.com/Spica910/vibecode.git')}
          >
            <Text style={styles.exampleText}>
              • https://github.com/Spica910/vibecode.git
            </Text>
          </TouchableOpacity>
          <Text style={styles.exampleText}>
            • https://github.com/user/repo.git
          </Text>
          <Text style={styles.exampleText}>
            • git@github.com:user/repo.git
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#404040',
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  pathInputContainer: {
    flex: 1,
  },
  pathInput: {
    flex: 1,
  },
  pathButton: {
    backgroundColor: '#404040',
    padding: 12,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  pathButtonText: {
    fontSize: 20,
  },
  cloneButton: {
    backgroundColor: '#007acc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  cloneButtonDisabled: {
    backgroundColor: '#555',
  },
  cloneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outputContainer: {
    marginTop: 24,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  outputTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  outputScroll: {
    maxHeight: 200,
  },
  outputText: {
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  examplesContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
  },
  examplesTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});

export default GitCloneScreen;
