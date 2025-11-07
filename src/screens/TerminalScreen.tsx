import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { ShellService } from '../utils/shell';
import { StorageService } from '../utils/storage';

type TerminalScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Terminal'
>;
type TerminalScreenRouteProp = RouteProp<RootStackParamList, 'Terminal'>;

interface Props {
  navigation: TerminalScreenNavigationProp;
  route: TerminalScreenRouteProp;
}

interface TerminalLine {
  type: 'output' | 'command' | 'error';
  text: string;
  timestamp: Date;
}

const TerminalScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId, cwd: initialCwd } = route.params || {};
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState(
    initialCwd || '/data/data/com.termux/files/home'
  );
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    // Load project path if projectId is provided
    if (projectId) {
      loadProjectPath();
    }

    // Add welcome message
    addLine('output', `VibeCode Terminal\nWorking directory: ${cwd}\n`);
    addLine('output', 'Type "help" for available commands\n');

    return () => {
      if (isInteractive) {
        ShellService.stopShell();
      }
    };
  }, []);

  const loadProjectPath = async () => {
    if (!projectId) return;
    const projects = await StorageService.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCwd(project.path);
      addLine('output', `Loaded project: ${project.name}\n`);
    }
  };

  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines(prev => [...prev, { type, text, timestamp: new Date() }]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    const cmd = command.trim();
    addLine('command', `$ ${cmd}`);
    setCommandHistory(prev => [...prev, cmd]);
    setCommand('');
    setHistoryIndex(-1);

    // Handle built-in commands
    if (cmd === 'help') {
      showHelp();
      return;
    }

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'exit') {
      navigation.goBack();
      return;
    }

    if (cmd.startsWith('cd ')) {
      const newDir = cmd.substring(3).trim();
      await changeDirectory(newDir);
      return;
    }

    // Execute shell command
    try {
      const result = await ShellService.executeCommand(cmd, cwd);
      if (result.output) {
        addLine('output', result.output);
      }
      if (result.error && result.exitCode !== 0) {
        addLine('error', `Error (exit code ${result.exitCode}): ${result.error}`);
      }
    } catch (error) {
      addLine('error', `Error: ${error}`);
    }
  };

  const changeDirectory = async (path: string) => {
    try {
      // Resolve path
      let newPath = path;
      if (path === '~') {
        newPath = '/data/data/com.termux/files/home';
      } else if (path === '..') {
        const parts = cwd.split('/').filter(p => p);
        parts.pop();
        newPath = '/' + parts.join('/');
      } else if (!path.startsWith('/')) {
        newPath = `${cwd}/${path}`;
      }

      // Verify directory exists
      const result = await ShellService.executeCommand(`test -d "${newPath}" && echo "exists"`, cwd);
      if (result.output.includes('exists')) {
        setCwd(newPath);
        addLine('output', `Changed directory to: ${newPath}\n`);
      } else {
        addLine('error', `Directory not found: ${newPath}\n`);
      }
    } catch (error) {
      addLine('error', `Failed to change directory: ${error}\n`);
    }
  };

  const showHelp = () => {
    const helpText = `
VibeCode Terminal - Available Commands:

Built-in Commands:
  help          Show this help message
  clear         Clear terminal output
  exit          Exit terminal
  cd <path>     Change directory

Shell Commands:
  ls            List directory contents
  pwd           Print working directory
  cat <file>    Display file contents
  mkdir <dir>   Create directory
  rm <file>     Remove file
  cp <src> <dst> Copy file
  mv <src> <dst> Move file

Package Management:
  pkg install <package>  Install Termux package
  npm install <package>  Install NPM package
  pip install <package>  Install Python package

Git Commands:
  git status    Show git status
  git add .     Stage all changes
  git commit    Commit changes
  git push      Push to remote

All standard Unix commands are available!
`;
    addLine('output', helpText);
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;

    let newIndex = historyIndex;
    if (direction === 'up') {
      newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
    } else {
      newIndex = Math.max(historyIndex - 1, -1);
    }

    setHistoryIndex(newIndex);
    if (newIndex >= 0) {
      setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
    } else {
      setCommand('');
    }
  };

  const quickCommands = [
    { label: 'ls', command: 'ls -la' },
    { label: 'pwd', command: 'pwd' },
    { label: 'clear', command: 'clear' },
    { label: 'git status', command: 'git status' },
    { label: 'npm install', command: 'npm install' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.quickCommandBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickCommands.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickCommand}
              onPress={() => setCommand(item.command)}>
              <Text style={styles.quickCommandText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.terminalOutput}
        contentContainerStyle={styles.terminalContent}>
        {lines.map((line, index) => (
          <View key={index} style={styles.lineContainer}>
            <Text
              style={[
                styles.terminalText,
                line.type === 'command' && styles.commandText,
                line.type === 'error' && styles.errorText,
              ]}>
              {line.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.cwdBar}>
        <Text style={styles.cwdText}>{cwd}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.prompt}>$</Text>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          onSubmitEditing={executeCommand}
          placeholder="Enter command..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={executeCommand}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyButtons}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigateHistory('up')}>
          <Text style={styles.historyButtonText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigateHistory('down')}>
          <Text style={styles.historyButtonText}>↓</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  quickCommandBar: {
    backgroundColor: '#252526',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e42',
  },
  quickCommand: {
    backgroundColor: '#3e3e42',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  quickCommandText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  terminalOutput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  terminalContent: {
    padding: 12,
  },
  lineContainer: {
    marginBottom: 4,
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 20,
  },
  commandText: {
    color: '#4ec9b0',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f48771',
  },
  cwdBar: {
    backgroundColor: '#252526',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#3e3e42',
  },
  cwdText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#858585',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252526',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#3e3e42',
  },
  prompt: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#4ec9b0',
    marginRight: 8,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#cccccc',
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#0e639c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyButtons: {
    flexDirection: 'row',
    position: 'absolute',
    right: 12,
    bottom: 80,
  },
  historyButton: {
    backgroundColor: '#3e3e42',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  historyButtonText: {
    color: '#cccccc',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default TerminalScreen;
