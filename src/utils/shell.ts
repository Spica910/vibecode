import { NativeModules, NativeEventEmitter } from 'react-native';
import { ShellCommand, ShellOutput } from '../types';

const { ShellModule } = NativeModules;
const shellEventEmitter = new NativeEventEmitter(ShellModule);

export class ShellService {
  private static outputListeners: ((output: string) => void)[] = [];
  private static errorListeners: ((error: string) => void)[] = [];

  static async executeCommand(
    command: string,
    cwd: string = '/data/data/com.termux/files/home'
  ): Promise<ShellOutput> {
    try {
      const result = await ShellModule.executeCommand(command, cwd);
      return result;
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  static async startInteractiveShell(
    cwd: string = '/data/data/com.termux/files/home'
  ): Promise<boolean> {
    try {
      const result = await ShellModule.startInteractiveShell(cwd);

      // Set up event listeners
      shellEventEmitter.addListener('onShellOutput', (output: string) => {
        this.outputListeners.forEach(listener => listener(output));
      });

      shellEventEmitter.addListener('onShellError', (error: string) => {
        this.errorListeners.forEach(listener => listener(error));
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to start shell: ${error}`);
    }
  }

  static async writeToShell(input: string): Promise<boolean> {
    try {
      return await ShellModule.writeToShell(input);
    } catch (error) {
      throw new Error(`Failed to write to shell: ${error}`);
    }
  }

  static async stopShell(): Promise<boolean> {
    try {
      shellEventEmitter.removeAllListeners('onShellOutput');
      shellEventEmitter.removeAllListeners('onShellError');
      this.outputListeners = [];
      this.errorListeners = [];
      return await ShellModule.stopShell();
    } catch (error) {
      throw new Error(`Failed to stop shell: ${error}`);
    }
  }

  static onOutput(callback: (output: string) => void): () => void {
    this.outputListeners.push(callback);
    return () => {
      this.outputListeners = this.outputListeners.filter(cb => cb !== callback);
    };
  }

  static onError(callback: (error: string) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
    };
  }

  static async checkCommand(command: string): Promise<{ exists: boolean; path: string | null }> {
    try {
      return await ShellModule.checkCommand(command);
    } catch (error) {
      return { exists: false, path: null };
    }
  }

  // Helper methods for common operations
  static async listDirectory(path: string): Promise<string> {
    const result = await this.executeCommand(`ls -la "${path}"`, path);
    return result.output;
  }

  static async changeDirectory(path: string): Promise<string> {
    const result = await this.executeCommand(`cd "${path}" && pwd`, path);
    return result.output.trim();
  }

  static async getCurrentDirectory(cwd: string): Promise<string> {
    const result = await this.executeCommand('pwd', cwd);
    return result.output.trim();
  }

  static async installPackage(packageName: string, manager: 'npm' | 'pip' = 'npm'): Promise<ShellOutput> {
    const command = manager === 'npm'
      ? `npm install -g ${packageName}`
      : `pip install ${packageName}`;
    return await this.executeCommand(command);
  }

  static async checkEnvironment(): Promise<{
    node: boolean;
    python: boolean;
    git: boolean;
  }> {
    const [node, python, git] = await Promise.all([
      this.checkCommand('node'),
      this.checkCommand('python'),
      this.checkCommand('git'),
    ]);

    return {
      node: node.exists,
      python: python.exists,
      git: git.exists,
    };
  }
}
