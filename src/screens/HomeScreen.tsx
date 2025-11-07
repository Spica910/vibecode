import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const menuItems = [
    {
      title: '프로젝트 관리',
      description: 'Claude Code 프로젝트를 생성하고 관리합니다',
      icon: '📁',
      onPress: () => navigation.navigate('ProjectList'),
    },
    {
      title: '터미널',
      description: '내장 터미널에서 명령어를 실행합니다',
      icon: '💻',
      onPress: () => navigation.navigate('Terminal'),
    },
    {
      title: 'Termux 설정',
      description: 'Termux 환경을 구성하고 관리합니다',
      icon: '⚙️',
      onPress: () => navigation.navigate('TermuxSettings'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VibeCode</Text>
        <Text style={styles.subtitle}>
          Claude Code Manager for Termux
        </Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>주요 기능</Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✓ Claude.md 편집 및 관리</Text>
          <Text style={styles.featureItem}>✓ Agent 설정 및 활성화</Text>
          <Text style={styles.featureItem}>✓ Skills 커스터마이징</Text>
          <Text style={styles.featureItem}>✓ 프로젝트별 설정 관리</Text>
          <Text style={styles.featureItem}>✓ 내장 터미널 (VS Code 스타일)</Text>
          <Text style={styles.featureItem}>✓ Termux 통합</Text>
        </View>
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
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default HomeScreen;
