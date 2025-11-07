import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Agent, Skill, TermuxConfig } from '../types';

const STORAGE_KEYS = {
  PROJECTS: '@vibecode:projects',
  AGENTS: '@vibecode:agents',
  SKILLS: '@vibecode:skills',
  TERMUX: '@vibecode:termux',
};

export const StorageService = {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  },

  async saveProjects(projects: Project[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  },

  async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    projects.push(project);
    await this.saveProjects(projects);
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates };
      await this.saveProjects(projects);
    }
  },

  async deleteProject(projectId: string): Promise<void> {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    await this.saveProjects(filtered);
  },

  // Agents
  async getAgents(projectId: string): Promise<Agent[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.AGENTS}:${projectId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading agents:', error);
      return [];
    }
  },

  async saveAgents(projectId: string, agents: Agent[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.AGENTS}:${projectId}`, JSON.stringify(agents));
    } catch (error) {
      console.error('Error saving agents:', error);
    }
  },

  // Skills
  async getSkills(projectId: string): Promise<Skill[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.SKILLS}:${projectId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading skills:', error);
      return [];
    }
  },

  async saveSkills(projectId: string, skills: Skill[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.SKILLS}:${projectId}`, JSON.stringify(skills));
    } catch (error) {
      console.error('Error saving skills:', error);
    }
  },

  // Termux Config
  async getTermuxConfig(): Promise<TermuxConfig | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TERMUX);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading termux config:', error);
      return null;
    }
  },

  async saveTermuxConfig(config: TermuxConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TERMUX, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving termux config:', error);
    }
  },
};
