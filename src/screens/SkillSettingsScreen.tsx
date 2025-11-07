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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Skill, Project } from '../types';
import { StorageService } from '../utils/storage';

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
    description: '코드 포맷팅을 수행합니다',
    enabled: false,
  },
  {
    name: 'lint',
    command: 'eslint . --fix',
    description: 'Linting을 수행하고 자동 수정합니다',
    enabled: false,
  },
  {
    name: 'test',
    command: 'npm test',
    description: '테스트를 실행합니다',
    enabled: false,
  },
  {
    name: 'build',
    command: 'npm run build',
    description: '프로젝트를 빌드합니다',
    enabled: false,
  },
];

const SkillSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{ skill: Skill; index: number } | null>(null);
  const [skillName, setSkillName] = useState('');
  const [skillCommand, setSkillCommand] = useState('');
  const [skillDescription, setSkillDescription] = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    const loadedSkills = await StorageService.getSkills(projectId);
    if (loadedSkills.length === 0) {
      setSkills(DEFAULT_SKILLS);
      await StorageService.saveSkills(projectId, DEFAULT_SKILLS);
    } else {
      setSkills(loadedSkills);
    }
  };

  const handleToggleSkill = async (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index].enabled = !updatedSkills[index].enabled;
    setSkills(updatedSkills);
    await StorageService.saveSkills(projectId, updatedSkills);
  };

  const handleAddSkill = () => {
    setEditingSkill(null);
    setSkillName('');
    setSkillCommand('');
    setSkillDescription('');
    setModalVisible(true);
  };

  const handleEditSkill = (skill: Skill, index: number) => {
    setEditingSkill({ skill, index });
    setSkillName(skill.name);
    setSkillCommand(skill.command);
    setSkillDescription(skill.description);
    setModalVisible(true);
  };

  const handleSaveSkill = async () => {
    if (!skillName.trim() || !skillCommand.trim()) {
      Alert.alert('오류', 'Skill 이름과 명령어를 입력해주세요.');
      return;
    }

    const newSkill: Skill = {
      name: skillName,
      command: skillCommand,
      description: skillDescription,
      enabled: false,
    };

    let updatedSkills: Skill[];
    if (editingSkill) {
      updatedSkills = [...skills];
      updatedSkills[editingSkill.index] = newSkill;
    } else {
      updatedSkills = [...skills, newSkill];
    }

    setSkills(updatedSkills);
    await StorageService.saveSkills(projectId, updatedSkills);
    setModalVisible(false);
  };

  const handleDeleteSkill = (index: number) => {
    Alert.alert('Skill 삭제', '이 Skill을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const updatedSkills = skills.filter((_, i) => i !== index);
          setSkills(updatedSkills);
          await StorageService.saveSkills(projectId, updatedSkills);
        },
      },
    ]);
  };

  const renderSkill = ({ item, index }: { item: Skill; index: number }) => (
    <View style={styles.skillItem}>
      <TouchableOpacity
        style={styles.skillContent}
        onPress={() => handleEditSkill(item, index)}
        onLongPress={() => handleDeleteSkill(index)}>
        <View style={styles.skillInfo}>
          <View style={styles.skillHeader}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text style={styles.skillCommand}>{item.command}</Text>
          </View>
          <Text style={styles.skillDescription}>{item.description}</Text>
        </View>
      </TouchableOpacity>
      <Switch
        value={item.enabled}
        onValueChange={() => handleToggleSkill(index)}
        trackColor={{ false: '#ddd', true: '#ff6f00' }}
        thumbColor={item.enabled ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Skill을 활성화하여 커스텀 명령어를 사용하세요
        </Text>
      </View>

      <FlatList
        data={skills}
        renderItem={renderSkill}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Skill이 없습니다</Text>
            <Text style={styles.emptySubtext}>
              + 버튼을 눌러 Skill을 추가하세요
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddSkill}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSkill ? 'Skill 편집' : '새 Skill 추가'}
            </Text>

            <Text style={styles.inputLabel}>Skill 이름</Text>
            <TextInput
              style={styles.input}
              value={skillName}
              onChangeText={setSkillName}
              placeholder="format"
            />

            <Text style={styles.inputLabel}>명령어</Text>
            <TextInput
              style={styles.input}
              value={skillCommand}
              onChangeText={setSkillCommand}
              placeholder="prettier --write ."
            />

            <Text style={styles.inputLabel}>설명</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={skillDescription}
              onChangeText={setSkillDescription}
              placeholder="이 Skill이 하는 일을 설명하세요"
              multiline
              numberOfLines={3}
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
                <Text style={[styles.buttonText, styles.buttonTextSave]}>
                  {editingSkill ? '수정' : '추가'}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  skillItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skillContent: {
    flex: 1,
  },
  skillInfo: {
    flex: 1,
    marginRight: 12,
  },
  skillHeader: {
    marginBottom: 6,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  skillCommand: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 4,
    borderRadius: 4,
  },
  skillDescription: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#ff6f00',
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
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
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
  buttonSave: {
    backgroundColor: '#ff6f00',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonTextSave: {
    color: '#fff',
  },
});

export default SkillSettingsScreen;
