import React, { useState, useEffect } from 'react';
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
import ShellService from '../services/ShellService';

interface Props {
  navigation: any;
  route: any;
}

const GitManageScreen: React.FC<Props> = ({ route }) => {
  const { project } = route.params;
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [gitStatus, setGitStatus] = useState('');
  const [branch, setBranch] = useState('');

  useEffect(() => {
    loadGitStatus();
    loadCurrentBranch();
  }, []);

  const loadGitStatus = async () => {
    try {
      const result = await ShellService.executeCommand('git status', project.path);
      setGitStatus(result.output);
    } catch (error: any) {
      setGitStatus(`오류: ${error.message}`);
    }
  };

  const loadCurrentBranch = async () => {
    try {
      const result = await ShellService.executeCommand('git branch --show-current', project.path);
      setBranch(result.output.trim());
    } catch (error: any) {
      setBranch('unknown');
    }
  };

  const handleGitStatus = async () => {
    setIsLoading(true);
    setOutput('Git status 확인 중...\n');

    try {
      const result = await ShellService.executeCommand('git status', project.path);
      setOutput(result.output);
      setGitStatus(result.output);
    } catch (error: any) {
      setOutput(`오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitPull = async () => {
    setIsLoading(true);
    setOutput('Git pull 실행 중...\n');

    try {
      const result = await ShellService.executeCommand('git pull', project.path);
      setOutput(result.output);

      if (result.exitCode === 0) {
        Alert.alert('성공', 'Pull이 완료되었습니다.');
        loadGitStatus();
      } else {
        Alert.alert('오류', `Pull 실패:\n${result.output}`);
      }
    } catch (error: any) {
      setOutput(`오류: ${error.message}`);
      Alert.alert('오류', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitAdd = async () => {
    setIsLoading(true);
    setOutput('모든 변경사항 추가 중...\n');

    try {
      const result = await ShellService.executeCommand('git add .', project.path);
      setOutput(prev => prev + result.output + '\n');

      const statusResult = await ShellService.executeCommand('git status', project.path);
      setOutput(prev => prev + '\n현재 상태:\n' + statusResult.output);
      setGitStatus(statusResult.output);

      Alert.alert('성공', '모든 변경사항이 스테이징되었습니다.');
    } catch (error: any) {
      setOutput(`오류: ${error.message}`);
      Alert.alert('오류', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitCommit = async () => {
    if (!commitMessage.trim()) {
      Alert.alert('오류', '커밋 메시지를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setOutput('커밋 생성 중...\n');

    try {
      // First add all changes
      await ShellService.executeCommand('git add .', project.path);
      setOutput(prev => prev + 'Changes staged.\n');

      // Then commit
      const escapedMessage = commitMessage.replace(/"/g, '\\"');
      const commitCmd = `git commit -m "${escapedMessage}"`;
      const result = await ShellService.executeCommand(commitCmd, project.path);

      setOutput(prev => prev + result.output + '\n');

      if (result.exitCode === 0) {
        Alert.alert('성공', '커밋이 생성되었습니다.');
        setCommitMessage('');
        loadGitStatus();
      } else {
        Alert.alert('정보', result.output);
      }
    } catch (error: any) {
      setOutput(`오류: ${error.message}`);
      Alert.alert('오류', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitPush = async () => {
    Alert.alert(
      '푸시 확인',
      `${branch} 브랜치로 푸시하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '푸시',
          onPress: async () => {
            setIsLoading(true);
            setOutput(`Pushing to ${branch}...\n`);

            try {
              const result = await ShellService.executeCommand('git push', project.path);
              setOutput(result.output);

              if (result.exitCode === 0) {
                Alert.alert('성공', '푸시가 완료되었습니다.');
                loadGitStatus();
              } else {
                Alert.alert('오류', `푸시 실패:\n${result.output}`);
              }
            } catch (error: any) {
              setOutput(`오류: ${error.message}`);
              Alert.alert('오류', error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) {
      Alert.alert('오류', '커밋 메시지를 입력해주세요.');
      return;
    }

    Alert.alert(
      '커밋 & 푸시',
      `변경사항을 커밋하고 ${branch} 브랜치로 푸시하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '실행',
          onPress: async () => {
            setIsLoading(true);
            setOutput('커밋 & 푸시 실행 중...\n');

            try {
              // Add all
              await ShellService.executeCommand('git add .', project.path);
              setOutput(prev => prev + 'Changes staged.\n');

              // Commit
              const escapedMessage = commitMessage.replace(/"/g, '\\"');
              const commitResult = await ShellService.executeCommand(
                `git commit -m "${escapedMessage}"`,
                project.path
              );
              setOutput(prev => prev + commitResult.output + '\n');

              // Push
              const pushResult = await ShellService.executeCommand('git push', project.path);
              setOutput(prev => prev + pushResult.output + '\n');

              if (pushResult.exitCode === 0) {
                Alert.alert('성공', '커밋 및 푸시가 완료되었습니다!');
                setCommitMessage('');
                loadGitStatus();
              } else {
                Alert.alert('오류', `푸시 실패:\n${pushResult.output}`);
              }
            } catch (error: any) {
              setOutput(prev => prev + `오류: ${error.message}\n`);
              Alert.alert('오류', error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const generateCommitMessage = () => {
    const messages = [
      'Update project files',
      'Fix bugs and improve stability',
      'Add new features',
      'Refactor code',
      'Update documentation',
      'Improve performance',
    ];
    const random = messages[Math.floor(Math.random() * messages.length)];
    setCommitMessage(random);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Branch Info */}
        <View style={styles.branchContainer}>
          <Text style={styles.branchLabel}>현재 브랜치:</Text>
          <Text style={styles.branchName}>{branch || 'Loading...'}</Text>
        </View>

        {/* Git Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Git Status</Text>
            <TouchableOpacity onPress={handleGitStatus} disabled={isLoading}>
              <Text style={styles.refreshButton}>🔄 새로고침</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.statusScroll}>
            <Text style={styles.statusText}>{gitStatus || 'Loading...'}</Text>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>빠른 작업</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.pullButton]}
              onPress={handleGitPull}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>⬇️ Pull</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.addButton]}
              onPress={handleGitAdd}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>➕ Add All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={handleGitStatus}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>📊 Status</Text>
          </TouchableOpacity>
        </View>

        {/* Commit Section */}
        <View style={styles.commitContainer}>
          <Text style={styles.sectionTitle}>커밋 & 푸시</Text>

          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={commitMessage}
              onChangeText={setCommitMessage}
              placeholder="커밋 메시지를 입력하세요..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateCommitMessage}
            >
              <Text style={styles.generateButtonText}>🎲</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.commitButton]}
              onPress={handleGitCommit}
              disabled={isLoading || !commitMessage.trim()}
            >
              <Text style={styles.actionButtonText}>💾 Commit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.pushButton]}
              onPress={handleGitPush}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>⬆️ Push</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.commitPushButton,
              (!commitMessage.trim() || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleCommitAndPush}
            disabled={isLoading || !commitMessage.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>🚀 Commit & Push</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Output */}
        {output ? (
          <View style={styles.outputContainer}>
            <Text style={styles.outputTitle}>출력:</Text>
            <ScrollView style={styles.outputScroll}>
              <Text style={styles.outputText}>{output}</Text>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  content: {
    padding: 16,
  },
  branchContainer: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchLabel: {
    color: '#888',
    fontSize: 14,
  },
  branchName: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  statusContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    color: '#007acc',
    fontSize: 14,
  },
  statusScroll: {
    maxHeight: 150,
  },
  statusText: {
    color: '#0f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  commitContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pullButton: {
    backgroundColor: '#2196F3',
  },
  addButton: {
    backgroundColor: '#9C27B0',
  },
  statusButton: {
    backgroundColor: '#607D8B',
  },
  commitButton: {
    backgroundColor: '#4CAF50',
  },
  pushButton: {
    backgroundColor: '#FF9800',
  },
  commitPushButton: {
    backgroundColor: '#007acc',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  messageInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#404040',
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#404040',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  generateButtonText: {
    fontSize: 20,
  },
  outputContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 8,
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
});

export default GitManageScreen;
