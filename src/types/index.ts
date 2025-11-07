export interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  hasClaude: boolean;
  hasAgents: boolean;
  hasSkills: boolean;
}

export interface ClaudeConfig {
  version?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Agent {
  name: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface Skill {
  name: string;
  command: string;
  description: string;
  enabled: boolean;
}

export interface TermuxConfig {
  workingDirectory: string;
  pythonPath?: string;
  nodePath?: string;
  gitPath?: string;
}

export interface TerminalSession {
  id: string;
  projectId?: string;
  cwd: string;
  createdAt: Date;
  active: boolean;
}

export interface ShellCommand {
  command: string;
  cwd: string;
}

export interface ShellOutput {
  output: string;
  exitCode: number;
  error?: string;
}

export type RootStackParamList = {
  Home: undefined;
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  ClaudeEditor: { projectId: string };
  AgentSettings: { projectId: string };
  SkillSettings: { projectId: string };
  TermuxSettings: undefined;
  Terminal: { projectId?: string; cwd?: string };
};
