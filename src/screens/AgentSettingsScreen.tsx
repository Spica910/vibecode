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
import { RootStackParamList, Agent, Project } from '../types';
import { StorageService } from '../utils/storage';

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
    name: 'Code Review Agent',
    description: '코드 리뷰를 수행하는 에이전트',
    enabled: false,
  },
  {
    name: 'Test Generator',
    description: '테스트 코드를 자동으로 생성',
    enabled: false,
  },
  {
    name: 'Documentation Agent',
    description: '문서를 자동으로 생성하고 업데이트',
    enabled: false,
  },
  {
    name: 'Bug Hunter',
    description: '잠재적 버그를 찾아내는 에이전트',
    enabled: false,
  },
];

const AgentSettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const loadedAgents = await StorageService.getAgents(projectId);
    if (loadedAgents.length === 0) {
      setAgents(DEFAULT_AGENTS);
      await StorageService.saveAgents(projectId, DEFAULT_AGENTS);
    } else {
      setAgents(loadedAgents);
    }
  };

  const handleToggleAgent = async (index: number) => {
    const updatedAgents = [...agents];
    updatedAgents[index].enabled = !updatedAgents[index].enabled;
    setAgents(updatedAgents);
    await StorageService.saveAgents(projectId, updatedAgents);
  };

  const handleAddAgent = () => {
    setEditingAgent(null);
    setAgentName('');
    setAgentDescription('');
    setModalVisible(true);
  };

  const handleEditAgent = (agent: Agent, index: number) => {
    setEditingAgent({ ...agent, config: { index } });
    setAgentName(agent.name);
    setAgentDescription(agent.description);
    setModalVisible(true);
  };

  const handleSaveAgent = async () => {
    if (!agentName.trim()) {
      Alert.alert('오류', 'Agent 이름을 입력해주세요.');
      return;
    }

    const newAgent: Agent = {
      name: agentName,
      description: agentDescription,
      enabled: false,
    };

    let updatedAgents: Agent[];
    if (editingAgent && editingAgent.config?.index !== undefined) {
      updatedAgents = [...agents];
      updatedAgents[editingAgent.config.index] = newAgent;
    } else {
      updatedAgents = [...agents, newAgent];
    }

    setAgents(updatedAgents);
    await StorageService.saveAgents(projectId, updatedAgents);
    setModalVisible(false);
  };

  const handleDeleteAgent = (index: number) => {
    Alert.alert('Agent 삭제', '이 Agent를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const updatedAgents = agents.filter((_, i) => i !== index);
          setAgents(updatedAgents);
          await StorageService.saveAgents(projectId, updatedAgents);
        },
      },
    ]);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Agent를 활성화하여 자동화된 작업을 수행하세요
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
              {editingAgent ? 'Agent 편집' : '새 Agent 추가'}
            </Text>

            <Text style={styles.inputLabel}>Agent 이름</Text>
            <TextInput
              style={styles.input}
              value={agentName}
              onChangeText={setAgentName}
              placeholder="Code Review Agent"
            />

            <Text style={styles.inputLabel}>설명</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={agentDescription}
              onChangeText={setAgentDescription}
              placeholder="이 Agent가 하는 일을 설명하세요"
              multiline
              numberOfLines={4}
            />

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
                  {editingAgent ? '수정' : '추가'}
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
