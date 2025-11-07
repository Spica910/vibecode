import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Project } from '../types';
import { StorageService } from '../utils/storage';
import { FileSystemService } from '../utils/fileSystem';

type ProjectListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProjectList'
>;

interface Props {
  navigation: ProjectListScreenNavigationProp;
}

const ProjectListScreen: React.FC<Props> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('/data/data/com.termux/files/home/');

  const loadProjects = async () => {
    const loadedProjects = await StorageService.getProjects();
    setProjects(loadedProjects);
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('오류', '프로젝트 이름을 입력해주세요.');
      return;
    }

    const fullPath = `${newProjectPath}${newProjectName}`;
    const exists = await FileSystemService.fileExists(fullPath);

    if (!exists) {
      Alert.alert(
        '확인',
        '해당 경로에 디렉토리가 없습니다. 생성하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '생성',
            onPress: async () => {
              try {
                await FileSystemService.createDirectory(fullPath);
                await addProject(fullPath);
              } catch (error) {
                Alert.alert('오류', '디렉토리 생성에 실패했습니다.');
              }
            },
          },
        ]
      );
    } else {
      await addProject(fullPath);
    }
  };

  const addProject = async (path: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      path: path,
      lastModified: new Date(),
      hasClaude: await FileSystemService.fileExists(
        FileSystemService.getClaudioConfigPath(path)
      ),
      hasAgents: await FileSystemService.fileExists(
        FileSystemService.getAgentsPath(path)
      ),
      hasSkills: await FileSystemService.fileExists(
        FileSystemService.getSkillsPath(path)
      ),
    };

    await StorageService.addProject(newProject);
    setProjects([...projects, newProject]);
    setModalVisible(false);
    setNewProjectName('');
    setNewProjectPath('/data/data/com.termux/files/home/');
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      '프로젝트 삭제',
      '이 프로젝트를 목록에서 제거하시겠습니까?\n(실제 파일은 삭제되지 않습니다)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
          },
        },
      ]
    );
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectItem}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
      onLongPress={() => handleDeleteProject(item.id)}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Text style={styles.projectPath}>{item.path}</Text>
      </View>
      <View style={styles.projectBadges}>
        {item.hasClaude && (
          <View style={[styles.badge, styles.badgeClaude]}>
            <Text style={styles.badgeText}>Claude.md</Text>
          </View>
        )}
        {item.hasAgents && (
          <View style={[styles.badge, styles.badgeAgent]}>
            <Text style={styles.badgeText}>Agents</Text>
          </View>
        )}
        {item.hasSkills && (
          <View style={[styles.badge, styles.badgeSkill]}>
            <Text style={styles.badgeText}>Skills</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>프로젝트가 없습니다</Text>
            <Text style={styles.emptySubtext}>
              + 버튼을 눌러 프로젝트를 추가하세요
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 프로젝트 추가</Text>

            <Text style={styles.inputLabel}>프로젝트 이름</Text>
            <TextInput
              style={styles.input}
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="my-project"
            />

            <Text style={styles.inputLabel}>프로젝트 경로</Text>
            <TextInput
              style={styles.input}
              value={newProjectPath}
              onChangeText={setNewProjectPath}
              placeholder="/data/data/com.termux/files/home/"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewProjectName('');
                  setNewProjectPath('/data/data/com.termux/files/home/');
                }}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonAdd]}
                onPress={handleAddProject}>
                <Text style={[styles.buttonText, styles.buttonTextAdd]}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  projectItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  projectHeader: {
    marginBottom: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectPath: {
    fontSize: 12,
    color: '#999',
  },
  projectBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  badgeClaude: {
    backgroundColor: '#6200ee',
  },
  badgeAgent: {
    backgroundColor: '#03dac6',
  },
  badgeSkill: {
    backgroundColor: '#ff6f00',
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
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
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  buttonCancel: {
    backgroundColor: '#f5f5f5',
  },
  buttonAdd: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonTextAdd: {
    color: '#fff',
  },
});

export default ProjectListScreen;
