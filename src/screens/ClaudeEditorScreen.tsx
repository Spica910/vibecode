import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Project } from '../types';
import { StorageService } from '../utils/storage';
import { FileSystemService } from '../utils/fileSystem';

type ClaudeEditorScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ClaudeEditor'
>;
type ClaudeEditorScreenRouteProp = RouteProp<
  RootStackParamList,
  'ClaudeEditor'
>;

interface Props {
  navigation: ClaudeEditorScreenNavigationProp;
  route: ClaudeEditorScreenRouteProp;
}

const ClaudeEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProject();
  }, []);

  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const loadProject = async () => {
    const projects = await StorageService.getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
      await loadClaudeFile(found);
    }
  };

  const loadClaudeFile = async (proj: Project) => {
    const claudePath = FileSystemService.getClaudioConfigPath(proj.path);
    try {
      const fileContent = await FileSystemService.readFile(claudePath);
      setContent(fileContent);
      setOriginalContent(fileContent);
    } catch (error) {
      Alert.alert('오류', 'Claude.md 파일을 읽을 수 없습니다.');
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    const claudePath = FileSystemService.getClaudioConfigPath(project.path);
    try {
      await FileSystemService.writeFile(claudePath, content);
      setOriginalContent(content);
      Alert.alert('성공', 'Claude.md 파일이 저장되었습니다.');
    } catch (error) {
      Alert.alert('오류', '파일 저장에 실패했습니다.');
      console.error(error);
    }
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
          onPress: () => setContent(originalContent),
        },
      ]
    );
  };

  const insertTemplate = (template: string) => {
    let templateText = '';

    switch (template) {
      case 'system':
        templateText = `\n\n## System Prompt\nYou are a helpful AI assistant.\n`;
        break;
      case 'context':
        templateText = `\n\n## Context\n- Project type: \n- Tech stack: \n- Goal: \n`;
        break;
      case 'guidelines':
        templateText = `\n\n## Guidelines\n- Follow best practices\n- Write clean code\n- Add tests\n`;
        break;
      case 'examples':
        templateText = `\n\n## Examples\n\`\`\`\nExample code here\n\`\`\`\n`;
        break;
    }

    setContent(content + templateText);
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>프로젝트를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.templateButtons}>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => insertTemplate('system')}>
            <Text style={styles.templateButtonText}>System</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => insertTemplate('context')}>
            <Text style={styles.templateButtonText}>Context</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => insertTemplate('guidelines')}>
            <Text style={styles.templateButtonText}>Guidelines</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => insertTemplate('examples')}>
            <Text style={styles.templateButtonText}>Examples</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <TextInput
        style={styles.editor}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        placeholder="Claude.md 내용을 입력하세요..."
        placeholderTextColor="#999"
      />

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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
  },
  templateButtons: {
    paddingHorizontal: 12,
  },
  templateButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  templateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editor: {
    flex: 1,
    padding: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
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
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ClaudeEditorScreen;
