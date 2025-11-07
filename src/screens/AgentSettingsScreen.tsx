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
import { RootStackParamList, Agent, Project } from '../types';
import { StorageService } from '../utils/storage';
import { ClaudeCodeService } from '../utils/claudeCode';

type AgentSettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AgentSettings'
>;
type AgentSettingsScreenRouteProp = RouteProp<
  RootStackParamList,
  'AgentSettings'
>;

interface Props {
  navigation: AgentSettingsScreenNavigationProp;
  route: AgentSettingsScreenRouteProp;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    name: 'code-reviewer',
    description: 'Reviews code for best practices and potential issues',
    enabled: false,
    config: {
      trigger: 'on_commit',
      model: 'claude-3-sonnet'
    }
  },
  {
    name: 'test-generator',
    description: 'Automatically generates test cases',
    enabled: false,
    config: {
      trigger: 'manual',
      model: 'claude-3-sonnet'
    }
  },
  {
    name: 'documentation-agent',
    description: 'Generates and updates documentation',
    enabled: false,
    config: {
      trigger: 'manual',
      model: 'claude-3-sonnet'
    }
  },
  {
    name: 'bug-hunter',
    description: 'Finds potential bugs and vulnerabilities',
    enabled: false,
    config: {
      trigger: 'on_commit',
      model: 'claude-3-sonnet'
    }
  },
];

const AgentSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentTrigger, setAgentTrigger] = useState('manual');

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
        await loadAgents(found.path);
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

  const loadAgents = async (projectPath: string) => {
    try {
      // 먼저 .claude 디렉토리 초기화
      await ClaudeCodeService.initializeClaudeDirectory(projectPath);

      // Agent 로드
      const loadedAgents = await ClaudeCodeService.getAgents(projectPath);

      if (loadedAgents.length === 0) {
        // 기본 Agent 생성
        for (const defaultAgent of DEFAULT_AGENTS) {
          await ClaudeCodeService.saveAgent(projectPath, defaultAgent);
        }
        setAgents(DEFAULT_AGENTS);
      } else {
        setAgents(loadedAgents);
      }

      // 프로젝트 상태 업데이트
      await StorageService.updateProject(projectId, { hasAgents: true });
    } catch (error) {
      Alert.alert('오류', 'Agent 로드에 실패했습니다.');
      console.error(error);
    }
  };

  const handleToggleAgent = async (index: number) => {
    if (!project) return;

    try {
      const updatedAgents = [...agents];
      updatedAgents[index].enabled = !updatedAgents[index].enabled;

      // 파일 시스템에 저장
      await ClaudeCodeService.saveAgent(project.path, updatedAgents[index]);

      setAgents(updatedAgents);
      Alert.alert(
        '성공',
        `Agent "${updatedAgents[index].name}" ${updatedAgents[index].enabled ? '활성화' : '비활성화'}되었습니다.`
      );
    } catch (error) {
      Alert.alert('오류', 'Agent 토글에 실패했습니다.');
      console.error(error);
    }
  };

  const handleAddAgent = () => {
    setEditingIndex(null);
    setAgentName('');
    setAgentDescription('');
    setAgentTrigger('manual');
    setModalVisible(true);
  };

  const handleEditAgent = (agent: Agent, index: number) => {
    setEditingIndex(index);
    setAgentName(agent.name);
    setAgentDescription(agent.description);
    setAgentTrigger(agent.config?.trigger || 'manual');
    setModalVisible(true);
  };

  const handleSaveAgent = async () => {
    if (!project) return;

    if (!agentName.trim()) {
      Alert.alert('오류', 'Agent 이름을 입력해주세요.');
      return;
    }

    // 이름은 kebab-case로 변환
    const normalizedName = agentName.toLowerCase().replace(/\s+/g, '-');

    const newAgent: Agent = {
      name: normalizedName,
      description: agentDescription,
      enabled: false,
      config: {
        trigger: agentTrigger,
        model: 'claude-3-sonnet'
      }
    };

    try {
      let updatedAgents: Agent[];

      if (editingIndex !== null) {
        // 기존 Agent 수정
        const oldName = agents[editingIndex].name;

        // 이름이 변경되었으면 기존 파일 삭제
        if (oldName !== normalizedName) {
          await ClaudeCodeService.deleteAgent(project.path, oldName);
        }

        updatedAgents = [...agents];
        updatedAgents[editingIndex] = newAgent;
      } else {
        // 새 Agent 추가
        updatedAgents = [...agents, newAgent];
      }

      // 파일 시스템에 저장
      await ClaudeCodeService.saveAgent(project.path, newAgent);

      setAgents(updatedAgents);
      setModalVisible(false);

      Alert.alert('성공', `Agent "${newAgent.name}"이(가) 저장되었습니다.\n파일: .claude/agents/${normalizedName}.json`);
    } catch (error) {
      Alert.alert('오류', 'Agent 저장에 실패했습니다.');
      console.error(error);
    }
  };

  const handleDeleteAgent = (index: number) => {
    if (!project) return;

    const agent = agents[index];

    Alert.alert(
      'Agent 삭제',
      `"${agent.name}" Agent를 삭제하시겠습니까?\n파일이 영구적으로 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 파일 시스템에서 삭제
              await ClaudeCodeService.deleteAgent(project.path, agent.name);

              const updatedAgents = agents.filter((_, i) => i !== index);
              setAgents(updatedAgents);

              Alert.alert('성공', `Agent "${agent.name}"이(가) 삭제되었습니다.`);
            } catch (error) {
              Alert.alert('오류', 'Agent 삭제에 실패했습니다.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const renderAgent = ({ item, index }: { item: Agent; index: number }) => (
    <View style={styles.agentItem}>
      <TouchableOpacity
        style={styles.agentContent}
        onPress={() => handleEditAgent(item, index)}
        onLongPress={() => handleDeleteAgent(index)}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{item.name}</Text>
          <Text style={styles.agentDescription}>{item.description}</Text>
          <Text style={styles.agentTrigger}>
            Trigger: {item.config?.trigger || 'manual'}
          </Text>
        </View>
      </TouchableOpacity>
      <Switch
        value={item.enabled}
        onValueChange={() => handleToggleAgent(index)}
        trackColor={{ false: '#ddd', true: '#6200ee' }}
        thumbColor={item.enabled ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading agents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Agent 파일은 .claude/agents/*.json에 저장됩니다
        </Text>
      </View>

      <FlatList
        data={agents}
        renderItem={renderAgent}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Agent가 없습니다</Text>
            <Text style={styles.emptySubtext}>
              + 버튼을 눌러 Agent를 추가하세요
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddAgent}>
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
              {editingIndex !== null ? 'Agent 편집' : '새 Agent 추가'}
            </Text>

            <Text style={styles.inputLabel}>Agent 이름</Text>
            <TextInput
              style={styles.input}
              value={agentName}
              onChangeText={setAgentName}
              placeholder="code-reviewer"
              placeholderTextColor="#999"
            />
            <Text style={styles.hint}>kebab-case로 변환됩니다 (예: Code Review → code-review)</Text>

            <Text style={styles.inputLabel}>설명</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={agentDescription}
              onChangeText={setAgentDescription}
              placeholder="이 Agent가 하는 일을 설명하세요"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Trigger</Text>
            <View style={styles.triggerButtons}>
              <TouchableOpacity
                style={[styles.triggerButton, agentTrigger === 'manual' && styles.triggerButtonActive]}
                onPress={() => setAgentTrigger('manual')}>
                <Text style={[styles.triggerButtonText, agentTrigger === 'manual' && styles.triggerButtonTextActive]}>
                  Manual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.triggerButton, agentTrigger === 'on_commit' && styles.triggerButtonActive]}
                onPress={() => setAgentTrigger('on_commit')}>
                <Text style={[styles.triggerButtonText, agentTrigger === 'on_commit' && styles.triggerButtonTextActive]}>
                  On Commit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.triggerButton, agentTrigger === 'on_save' && styles.triggerButtonActive]}
                onPress={() => setAgentTrigger('on_save')}>
                <Text style={[styles.triggerButtonText, agentTrigger === 'on_save' && styles.triggerButtonTextActive]}>
                  On Save
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveAgent}>
                <Text style={[styles.buttonText, styles.buttonTextSave]}>
                  {editingIndex !== null ? '수정' : '추가'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  agentItem: {
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
  agentContent: {
    flex: 1,
  },
  agentInfo: {
    flex: 1,
    marginRight: 12,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  agentTrigger: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
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
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  triggerButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  triggerButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  triggerButtonActive: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  triggerButtonText: {
    fontSize: 12,
    color: '#666',
  },
  triggerButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
});

export default AgentSettingsScreen;
