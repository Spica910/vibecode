import RNFS from 'react-native-fs';

export const FileSystemService = {
  async readFile(path: string): Promise<string> {
    try {
      return await RNFS.readFile(path, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },

  async writeFile(path: string, content: string): Promise<void> {
    try {
      await RNFS.writeFile(path, content, 'utf8');
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  },

  async fileExists(path: string): Promise<boolean> {
    try {
      return await RNFS.exists(path);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  },

  async createDirectory(path: string): Promise<void> {
    try {
      await RNFS.mkdir(path);
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  },

  async listDirectory(path: string): Promise<string[]> {
    try {
      const items = await RNFS.readDir(path);
      return items.map(item => item.name);
    } catch (error) {
      console.error('Error listing directory:', error);
      return [];
    }
  },

  async deleteFile(path: string): Promise<void> {
    try {
      await RNFS.unlink(path);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  getTermuxHome(): string {
    return '/data/data/com.termux/files/home';
  },

  getClaudioConfigPath(projectPath: string): string {
    return `${projectPath}/.claude/Claude.md`;
  },

  getAgentsPath(projectPath: string): string {
    return `${projectPath}/.claude/agents`;
  },

  getSkillsPath(projectPath: string): string {
    return `${projectPath}/.claude/skills`;
  },
};
