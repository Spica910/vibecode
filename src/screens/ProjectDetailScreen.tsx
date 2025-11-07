import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Project } from '../types';
import { StorageService } from '../utils/storage';
import { FileSystemService } from '../utils/fileSystem';

type ProjectDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProjectDetail'
>;
type ProjectDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProjectDetail'
>;

interface Props {
  navigation: ProjectDetailScreenNavigationProp;
  route: ProjectDetailScreenRouteProp;
}

const ProjectDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    const projects = await StorageService.getProjects();
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
    }
  };

  const initializeClaudeConfig = async () => {
    if (!project) return;

    const claudePath = FileSystemService.getClaudioConfigPath(project.path);
    const claudeDir = `${project.path}/.claude`;

    try {
      const dirExists = await FileSystemService.fileExists(claudeDir);
      if (!dirExists) {
        await FileSystemService.createDirectory(claudeDir);
      }

      const defaultContent = `# Claude Configuration

## Project: ${project.name}

### System Prompt
You are a helpful AI assistant working on this project.

### Context
This is a development project managed with Claude Code.

### Guidelines
- Follow best practices
- Write clean, maintainable code
- Add comments where necessary
`;

      await FileSystemService.writeFile(claudePath, defaultContent);
      Alert.alert('성공', 'Claude.md 파일이 생성되었습니다.');

      // Update project status
      await StorageService.updateProject(projectId, { hasClaude: true });
      loadProject();
    } catch (error) {
      Alert.alert('오류', 'Claude.md 파일 생성에 실패했습니다.');
      console.error(error);
    }
  };

  const initializeAgents = async () => {
    if (!project) return;

    const agentsPath = FileSystemService.getAgentsPath(project.path);

    try {
      const exists = await FileSystemService.fileExists(agentsPath);
      if (!exists) {
        await FileSystemService.createDirectory(agentsPath);
      }

      Alert.alert('성공', 'Agents 디렉토리가 생성되었습니다.');
      await StorageService.updateProject(projectId, { hasAgents: true });
      loadProject();
    } catch (error) {
      Alert.alert('오류', 'Agents 디렉토리 생성에 실패했습니다.');
    }
  };

  const initializeSkills = async () => {
    if (!project) return;

    const skillsPath = FileSystemService.getSkillsPath(project.path);

    try {
      const exists = await FileSystemService.fileExists(skillsPath);
      if (!exists) {
        await FileSystemService.createDirectory(skillsPath);
      }

      Alert.alert('성공', 'Skills 디렉토리가 생성되었습니다.');
      await StorageService.updateProject(projectId, { hasSkills: true });
      loadProject();
    } catch (error) {
      Alert.alert('오류', 'Skills 디렉토리 생성에 실패했습니다.');
    }
  };

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>프로젝트를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const menuItems = [
    {
      title: '터미널',
      description: '프로젝트 디렉토리에서 터미널을 실행합니다',
      icon: '💻',
      available: true,
      onPress: () => navigation.navigate('Terminal', { projectId, cwd: project.path }),
      onInit: () => {},
    },
    {
      title: 'Git 관리',
      description: 'Git commit, push, pull 등을 관리합니다',
      icon: '🔄',
      available: true,
      onPress: () => navigation.navigate('GitManage', { project }),
      onInit: () => {},
    },
    {
      title: 'Claude.md 편집',
      description: 'Claude 설정 파일을 편집합니다',
      icon: '📝',
      available: project.hasClaude,
      onPress: () => navigation.navigate('ClaudeEditor', { projectId }),
      onInit: initializeClaudeConfig,
    },
    {
      title: 'Agent 설정',
      description: 'Agent를 설정하고 관리합니다',
      icon: '🤖',
      available: project.hasAgents,
      onPress: () => navigation.navigate('AgentSettings', { projectId }),
      onInit: initializeAgents,
    },
    {
      title: 'Skills 설정',
      description: 'Skills를 설정하고 관리합니다',
      icon: '⚡',
      available: project.hasSkills,
      onPress: () => navigation.navigate('SkillSettings', { projectId }),
      onInit: initializeSkills,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectPath}>{project.path}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <View key={index} style={styles.menuItemWrapper}>
            <TouchableOpacity
              style={[
                styles.menuItem,
                !item.available && styles.menuItemDisabled,
              ]}
              onPress={item.available ? item.onPress : item.onInit}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              {!item.available && (
                <View style={styles.initBadge}>
                  <Text style={styles.initBadgeText}>초기화 필요</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 24,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  projectPath: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  menuContainer: {
    padding: 16,
  },
  menuItemWrapper: {
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: '#666',
  },
  initBadge: {
    backgroundColor: '#ff6f00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  initBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ProjectDetailScreen;
