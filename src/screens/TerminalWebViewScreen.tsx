import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { ShellService } from '../utils/shell';
import { StorageService } from '../utils/storage';
import RNFS from 'react-native-fs';

type TerminalScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Terminal'
>;
type TerminalScreenRouteProp = RouteProp<RootStackParamList, 'Terminal'>;

interface Props {
  navigation: TerminalScreenNavigationProp;
  route: TerminalScreenRouteProp;
}

const TerminalWebViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { projectId, cwd: initialCwd } = route.params || {};
  const webViewRef = useRef<WebView>(null);
  const [cwd, setCwd] = useState(
    initialCwd || '/data/data/com.termux/files/home'
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectPath();
    }
  }, [projectId]);

  const loadProjectPath = async () => {
    if (!projectId) return;
    const projects = await StorageService.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCwd(project.path);
    }
  };

  const sendToTerminal = (type: string, data: any) => {
    if (webViewRef.current && isReady) {
      webViewRef.current.postMessage(
        JSON.stringify({ type, data })
      );
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'ready':
          setIsReady(true);
          sendToTerminal('cwd', cwd);
          break;

        case 'command':
          await executeCommand(message.command);
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  const executeCommand = async (command: string) => {
    const cmd = command.trim();

    // Handle built-in commands
    if (cmd === 'clear') {
      sendToTerminal('clear', '');
      return;
    }

    if (cmd === 'exit') {
      navigation.goBack();
      return;
    }

    if (cmd === 'help') {
      showHelp();
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
        sendToTerminal('output', result.output);
      }
      if (result.error && result.exitCode !== 0) {
        sendToTerminal('error', `Error (exit code ${result.exitCode}): ${result.error}`);
      }
    } catch (error) {
      sendToTerminal('error', `Error: ${error}`);
    }
  };

  const changeDirectory = async (path: string) => {
    try {
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

      const result = await ShellService.executeCommand(
        `test -d "${newPath}" && echo "exists"`,
        cwd
      );

      if (result.output.includes('exists')) {
        setCwd(newPath);
        sendToTerminal('cwd', newPath);
        sendToTerminal('output', `Changed directory to: ${newPath}\n`);
      } else {
        sendToTerminal('error', `Directory not found: ${newPath}\n`);
      }
    } catch (error) {
      sendToTerminal('error', `Failed to change directory: ${error}\n`);
    }
  };

  const showHelp = () => {
    const helpText = `
\x1b[1;36mVibeCode Terminal - Available Commands\x1b[0m

\x1b[1;33mBuilt-in Commands:\x1b[0m
  help          Show this help message
  clear         Clear terminal output
  exit          Exit terminal
  cd <path>     Change directory

\x1b[1;33mShell Commands:\x1b[0m
  ls            List directory contents
  pwd           Print working directory
  cat <file>    Display file contents
  mkdir <dir>   Create directory
  rm <file>     Remove file
  cp <src> <dst> Copy file
  mv <src> <dst> Move file

\x1b[1;33mPackage Management:\x1b[0m
  pkg install <package>  Install Termux package
  npm install <package>  Install NPM package
  pip install <package>  Install Python package

\x1b[1;33mGit Commands:\x1b[0m
  git status    Show git status
  git add .     Stage all changes
  git commit    Commit changes
  git push      Push to remote

All standard Unix commands are available!
`;
    sendToTerminal('output', helpText);
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VibeCode Terminal</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background-color: #1e1e1e;
      font-family: 'Consolas', 'Courier New', monospace;
      overflow: hidden;
      height: 100vh;
    }

    #terminal {
      width: 100%;
      height: 100vh;
      padding: 10px;
    }

    .xterm {
      height: 100%;
    }

    .xterm-viewport {
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="terminal"></div>

  <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <script>
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, Courier New, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      }
    });

    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);

    term.open(document.getElementById('terminal'));
    fitAddon.fit();

    let commandHistory = [];
    let historyIndex = -1;
    let currentCommand = '';
    let cwd = '/data/data/com.termux/files/home';

    term.writeln('\\x1b[1;36mVibeCode Terminal\\x1b[0m');
    term.writeln('Type \\x1b[1;32mhelp\\x1b[0m for available commands\\n');

    function writePrompt() {
      term.write('\\x1b[1;32m$\\x1b[0m ');
    }
    writePrompt();

    term.onData(data => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        term.write('\\r\\n');
        if (currentCommand.trim()) {
          commandHistory.push(currentCommand);
          historyIndex = -1;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'command',
            command: currentCommand,
            cwd: cwd
          }));
          currentCommand = '';
        } else {
          writePrompt();
        }
      } else if (code === 127) {
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          term.write('\\b \\b');
        }
      } else if (data === '\\x1b[A') {
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          historyIndex++;
          term.write('\\r\\x1b[K');
          writePrompt();
          currentCommand = commandHistory[commandHistory.length - 1 - historyIndex];
          term.write(currentCommand);
        }
      } else if (data === '\\x1b[B') {
        if (historyIndex > 0) {
          historyIndex--;
          term.write('\\r\\x1b[K');
          writePrompt();
          currentCommand = commandHistory[commandHistory.length - 1 - historyIndex];
          term.write(currentCommand);
        } else if (historyIndex === 0) {
          historyIndex = -1;
          term.write('\\r\\x1b[K');
          writePrompt();
          currentCommand = '';
        }
      } else if (code >= 32 && code < 127) {
        currentCommand += data;
        term.write(data);
      }
    });

    window.addEventListener('message', event => {
      const message = JSON.parse(event.data);

      if (message.type === 'output') {
        term.write(message.data);
        if (!message.data.endsWith('\\n')) {
          term.writeln('');
        }
        writePrompt();
      } else if (message.type === 'error') {
        term.writeln('\\x1b[1;31m' + message.data + '\\x1b[0m');
        writePrompt();
      } else if (message.type === 'cwd') {
        cwd = message.data;
      } else if (message.type === 'clear') {
        term.clear();
        writePrompt();
      }
    });

    window.addEventListener('resize', () => {
      fitAddon.fit();
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ready'
    }));
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webView}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  webView: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
});

export default TerminalWebViewScreen;
