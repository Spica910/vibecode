import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Skill, Project } from '../types';
import { StorageService } from '../utils/storage';
import { ClaudeCodeService } from '../utils/claudeCode';

type SkillSettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SkillSettings'
>;
type SkillSettingsScreenRouteProp = RouteProp<
  RootStackParamList,
  'SkillSettings'
>;

interface Props {
  navigation: SkillSettingsScreenNavigationProp;
  route: SkillSettingsScreenRouteProp;
}

const DEFAULT_SKILLS: Skill[] = [
  {
    name: 'format',
    command: 'prettier --write .',
    description: 'Format code with Prettier',
    enabled: false,
  },
  {
    name: 'lint',
    command: 'eslint . --fix',
    description: 'Lint code and auto-fix issues',
    enabled: false,
  },
  {
    name: 'test',
    command: 'npm test',
    description: 'Run test suite',
    enabled: false,
  },
  {
    name: 'build',
    command: 'npm run build',
    description: 'Build the project',
    enabled: false,
  },
];

const SkillSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillCommand, setSkillCommand] = useState('');
  const [skillDescription, setSkillDescription] = useState('');

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projects = await StorageService.getProjects();
      const found = projects.find(p => p.id === projectId);

      if (found) {
        setProject(found);
        await loadSkills(found.path);
      } else {
        Alert.alert('오류', '프로젝트를 찾을 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('오류', '프로젝트 로드에 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async (projectPath: string) => {
    try {
      await ClaudeCodeService.initializeClaudeDirectory(projectPath);
      const loadedSkills = await ClaudeCodeService.getSkills(projectPath);

      if (loadedSkills.length === 0) {
        for (const defaultSkill of DEFAULT_SKILLS) {
          await ClaudeCodeService.saveSkill(projectPath, defaultSkill);
        }
        setSkills(DEFAULT_SKILLS);
      } else {
        setSkills(loadedSkills);
      }

      await StorageService.updateProject(projectId, { hasSkills: true });
    } catch (error) {
      Alert.alert('오류', 'Skills 로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleToggleSkill = async (index: number) => {
    if (!project) return;
    try {
      const updatedSkills = [...skills];
      updatedSkills[index].enabled = !updatedSkills[index].enabled;
      await ClaudeCodeService.saveSkill(project.path, updatedSkills[index]);
      setSkills(updatedSkills);
    } catch (error) {
      Alert.alert('오류', 'Skill 토글에 실패했습니다.');
    }
  };

  const handleSaveSkill = async () => {
    if (!project || !skillName.trim() || !skillCommand.trim()) {
      Alert.alert('오류', 'Skill 이름과 명령어를 입력해주세요.');
      return;
    }

    const normalizedName = skillName.toLowerCase().replace(/\\s+/g, '-');
    const newSkill: Skill = {
      name: normalizedName,
      command: skillCommand,
      description: skillDescription,
      enabled: false
    };

    try {
      let updatedSkills: Skill[];
      if (editingIndex !== null) {
        const oldName = skills[editingIndex].name;
        if (oldName !== normalizedName) {
          await ClaudeCodeService.deleteSkill(project.path, oldName);
        }
        updatedSkills = [...skills];
        updatedSkills[editingIndex] = newSkill;
      } else {
        updatedSkills = [...skills, newSkill];
      }

      await ClaudeCodeService.saveSkill(project.path, newSkill);
      setSkills(updatedSkills);
      setModalVisible(false);
      Alert.alert('성공', `Skill "${newSkill.name}"이(가) 저장되었습니다.\\n파일: .claude/skills/${normalizedName}.sh`);
    } catch (error) {
      Alert.alert('오류', 'Skill 저장에 실패했습니다.');
    }
  };

  const handleDeleteSkill = (index: number) => {
    if (!project) return;
    const skill = skills[index];
    Alert.alert(
      'Skill 삭제',
      `"${skill.name}" Skill을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await ClaudeCodeService.deleteSkill(project.path, skill.name);
              setSkills(skills.filter((_, i) => i !== index));
              Alert.alert('성공', `Skill "${skill.name}"이(가) 삭제되었습니다.`);
            } catch (error) {
              Alert.alert('오류', 'Skill 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6f00" />
        <Text style={styles.loadingText}>Loading skills...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Skill 스크립트는 .claude/skills/*.sh에 저장됩니다
        </Text>
      </View>

      <FlatList
        data={skills}
        renderItem={({ item, index }) => (
          <View style={styles.skillItem}>
            <TouchableOpacity
              style={styles.skillContent}
              onPress={() => {
                setEditingIndex(index);
                setSkillName(item.name);
                setSkillCommand(item.command);
                setSkillDescription(item.description);
                setModalVisible(true);
              }}
              onLongPress={() => handleDeleteSkill(index)}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{item.name}</Text>
                <Text style={styles.skillCommand}>{item.command}</Text>
                <Text style={styles.skillDescription}>{item.description}</Text>
              </View>
            </TouchableOpacity>
            <Switch
              value={item.enabled}
              onValueChange={() => handleToggleSkill(index)}
              trackColor={{ false: '#ddd', true: '#ff6f00' }}
            />
          </View>
        )}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Skill이 없습니다</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingIndex(null);
          setSkillName('');
          setSkillCommand('');
          setSkillDescription('');
          setModalVisible(true);
        }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? 'Skill 편집' : '새 Skill 추가'}
            </Text>

            <TextInput
              style={styles.input}
              value={skillName}
              onChangeText={setSkillName}
              placeholder="Skill 이름"
            />
            <TextInput
              style={styles.input}
              value={skillCommand}
              onChangeText={setSkillCommand}
              placeholder="명령어"
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={skillDescription}
              onChangeText={setSkillDescription}
              placeholder="설명"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveSkill}>
                <Text style={[styles.buttonText, styles.buttonTextSave]}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerText: { fontSize: 12, color: '#666', textAlign: 'center' },
  list: { padding: 16 },
  skillItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', elevation: 2 },
  skillContent: { flex: 1 },
  skillInfo: { flex: 1, marginRight: 12 },
  skillName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  skillCommand: { fontSize: 11, color: '#999', fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: 4, marginBottom: 4 },
  skillDescription: { fontSize: 12, color: '#666' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999' },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#ff6f00', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  button: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginLeft: 12 },
  buttonCancel: { backgroundColor: '#f5f5f5' },
  buttonSave: { backgroundColor: '#ff6f00' },
  buttonText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  buttonTextSave: { color: '#fff' },
});

export default SkillSettingsScreen;
