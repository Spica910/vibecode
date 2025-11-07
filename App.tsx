import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, StyleSheet } from 'react-native';

import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import ProjectListScreen from './src/screens/ProjectListScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import ClaudeEditorScreen from './src/screens/ClaudeEditorScreen';
import AgentSettingsScreen from './src/screens/AgentSettingsScreen';
import SkillSettingsScreen from './src/screens/SkillSettingsScreen';
import TermuxSettingsScreen from './src/screens/TermuxSettingsScreen';
import TerminalScreen from './src/screens/TerminalScreen';

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#6200ee" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6200ee',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'VibeCode' }}
            />
            <Stack.Screen
              name="ProjectList"
              component={ProjectListScreen}
              options={{ title: '프로젝트 목록' }}
            />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{ title: '프로젝트 상세' }}
            />
            <Stack.Screen
              name="ClaudeEditor"
              component={ClaudeEditorScreen}
              options={{ title: 'Claude.md 편집' }}
            />
            <Stack.Screen
              name="AgentSettings"
              component={AgentSettingsScreen}
              options={{ title: 'Agent 설정' }}
            />
            <Stack.Screen
              name="SkillSettings"
              component={SkillSettingsScreen}
              options={{ title: 'Skills 설정' }}
            />
            <Stack.Screen
              name="TermuxSettings"
              component={TermuxSettingsScreen}
              options={{ title: 'Termux 설정' }}
            />
            <Stack.Screen
              name="Terminal"
              component={TerminalScreen}
              options={{
                title: '터미널',
                headerStyle: {
                  backgroundColor: '#1e1e1e',
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
