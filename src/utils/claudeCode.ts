import RNFS from 'react-native-fs';
import { Agent, Skill } from '../types';

/**
 * Claude Code 파일 시스템 관리
 * 실제 .claude/ 디렉토리 구조에 맞게 파일을 관리합니다
 */

export class ClaudeCodeService {
  /**
   * Claude 설정 디렉토리 구조 초기화
   */
  static async initializeClaudeDirectory(projectPath: string): Promise<void> {
    const claudeDir = `${projectPath}/.claude`;

    const directories = [
      claudeDir,
      `${claudeDir}/agents`,
      `${claudeDir}/skills`,
      `${claudeDir}/commands`,
      `${claudeDir}/hooks`,
      `${claudeDir}/mcp`,
    ];

    for (const dir of directories) {
      const exists = await RNFS.exists(dir);
      if (!exists) {
        await RNFS.mkdir(dir);
      }
    }

    // Claude.md 파일이 없으면 생성
    const claudeMdPath = `${claudeDir}/Claude.md`;
    const mdExists = await RNFS.exists(claudeMdPath);
    if (!mdExists) {
      const defaultContent = this.getDefaultClaudeMd(projectPath);
      await RNFS.writeFile(claudeMdPath, defaultContent, 'utf8');
    }
  }

  private static getDefaultClaudeMd(projectPath: string): string {
    const projectName = projectPath.split('/').pop() || 'Project';
    return `# Claude Configuration

## Project: ${projectName}

### System Prompt
You are a helpful AI assistant working on this project.

### Context
This is a development project managed with Claude Code.

### Guidelines
- Follow best practices
- Write clean, maintainable code
- Add comments where necessary
- Test your changes

### Project Structure
Describe your project structure here.

### Key Commands
- \`npm install\` - Install dependencies
- \`npm test\` - Run tests
- \`npm run build\` - Build project
`;
  }

  /**
   * Agent 관리
   */
  static async getAgents(projectPath: string): Promise<Agent[]> {
    const agentsDir = `${projectPath}/.claude/agents`;
    const exists = await RNFS.exists(agentsDir);
    if (!exists) {
      return [];
    }

    const files = await RNFS.readDir(agentsDir);
    const agents: Agent[] = [];

    for (const file of files) {
      if (file.name.endsWith('.json')) {
        try {
          const content = await RNFS.readFile(file.path, 'utf8');
          const agent = JSON.parse(content);
          agents.push(agent);
        } catch (error) {
          console.error(`Error reading agent file ${file.name}:`, error);
        }
      }
    }

    return agents;
  }

  static async saveAgent(projectPath: string, agent: Agent): Promise<void> {
    const agentPath = `${projectPath}/.claude/agents/${agent.name}.json`;
    const agentData = {
      name: agent.name,
      description: agent.description,
      enabled: agent.enabled,
      trigger: agent.config?.trigger || 'manual',
      config: agent.config || {}
    };

    await RNFS.writeFile(agentPath, JSON.stringify(agentData, null, 2), 'utf8');
  }

  static async deleteAgent(projectPath: string, agentName: string): Promise<void> {
    const agentPath = `${projectPath}/.claude/agents/${agentName}.json`;
    const exists = await RNFS.exists(agentPath);
    if (exists) {
      await RNFS.unlink(agentPath);
    }
  }

  /**
   * Skills 관리
   */
  static async getSkills(projectPath: string): Promise<Skill[]> {
    const skillsDir = `${projectPath}/.claude/skills`;
    const exists = await RNFS.exists(skillsDir);
    if (!exists) {
      return [];
    }

    const files = await RNFS.readDir(skillsDir);
    const skills: Skill[] = [];

    for (const file of files) {
      if (file.name.endsWith('.sh')) {
        try {
          const content = await RNFS.readFile(file.path, 'utf8');
          const skill = this.parseSkillScript(file.name, content);
          skills.push(skill);
        } catch (error) {
          console.error(`Error reading skill file ${file.name}:`, error);
        }
      }
    }

    return skills;
  }

  private static parseSkillScript(filename: string, content: string): Skill {
    const name = filename.replace('.sh', '');
    let description = '';
    let enabled = true;

    // Parse comments for description
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# Description:')) {
        description = line.substring('# Description:'.length).trim();
      } else if (line.startsWith('# Enabled:')) {
        enabled = line.substring('# Enabled:'.length).trim() === 'true';
      }
    }

    // Extract command (everything after shebang and comments)
    const commandLines = lines.filter(
      line => !line.startsWith('#') && line.trim() !== ''
    );
    const command = commandLines.join('\n');

    return {
      name,
      description: description || `Execute ${name} script`,
      command,
      enabled
    };
  }

  static async saveSkill(projectPath: string, skill: Skill): Promise<void> {
    const skillPath = `${projectPath}/.claude/skills/${skill.name}.sh`;
    const scriptContent = `#!/bin/bash
# Skill: ${skill.name}
# Description: ${skill.description}
# Enabled: ${skill.enabled}

${skill.command}
`;

    await RNFS.writeFile(skillPath, scriptContent, 'utf8');

    // Make executable (if on Unix-like system)
    // Note: This may not work on all Android devices
    try {
      // await RNFS.chmod(skillPath, 0o755);
    } catch (error) {
      // Ignore chmod errors on Android
    }
  }

  static async deleteSkill(projectPath: string, skillName: string): Promise<void> {
    const skillPath = `${projectPath}/.claude/skills/${skillName}.sh`;
    const exists = await RNFS.exists(skillPath);
    if (exists) {
      await RNFS.unlink(skillPath);
    }
  }

  /**
   * 전역 vs 프로젝트 설정
   */
  static getGlobalClaudeDir(): string {
    return '/data/data/com.termux/files/home/.claude';
  }

  static async getGlobalAgents(): Promise<Agent[]> {
    return this.getAgents('/data/data/com.termux/files/home');
  }

  static async getGlobalSkills(): Promise<Skill[]> {
    return this.getSkills('/data/data/com.termux/files/home');
  }

  /**
   * MCP 서버 설정
   */
  static async getMCPConfig(projectPath: string): Promise<any> {
    const mcpConfigPath = `${projectPath}/.claude/mcp/config.json`;
    const exists = await RNFS.exists(mcpConfigPath);

    if (!exists) {
      return { servers: [] };
    }

    const content = await RNFS.readFile(mcpConfigPath, 'utf8');
    return JSON.parse(content);
  }

  static async saveMCPConfig(projectPath: string, config: any): Promise<void> {
    const mcpDir = `${projectPath}/.claude/mcp`;
    const exists = await RNFS.exists(mcpDir);
    if (!exists) {
      await RNFS.mkdir(mcpDir);
    }

    const mcpConfigPath = `${mcpDir}/config.json`;
    await RNFS.writeFile(mcpConfigPath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Slash Commands
   */
  static async getCommands(projectPath: string): Promise<Array<{name: string; content: string}>> {
    const commandsDir = `${projectPath}/.claude/commands`;
    const exists = await RNFS.exists(commandsDir);
    if (!exists) {
      return [];
    }

    const files = await RNFS.readDir(commandsDir);
    const commands: Array<{name: string; content: string}> = [];

    for (const file of files) {
      if (file.name.endsWith('.md')) {
        try {
          const content = await RNFS.readFile(file.path, 'utf8');
          commands.push({
            name: file.name.replace('.md', ''),
            content
          });
        } catch (error) {
          console.error(`Error reading command file ${file.name}:`, error);
        }
      }
    }

    return commands;
  }

  static async saveCommand(projectPath: string, name: string, content: string): Promise<void> {
    const commandPath = `${projectPath}/.claude/commands/${name}.md`;
    await RNFS.writeFile(commandPath, content, 'utf8');
  }

  /**
   * 유틸리티
   */
  static async checkClaudeSetup(projectPath: string): Promise<{
    hasClaude: boolean;
    hasAgents: boolean;
    hasSkills: boolean;
    hasCommands: boolean;
    hasMCP: boolean;
  }> {
    const claudeDir = `${projectPath}/.claude`;
    const hasClaude = await RNFS.exists(`${claudeDir}/Claude.md`);
    const hasAgents = await RNFS.exists(`${claudeDir}/agents`);
    const hasSkills = await RNFS.exists(`${claudeDir}/skills`);
    const hasCommands = await RNFS.exists(`${claudeDir}/commands`);
    const hasMCP = await RNFS.exists(`${claudeDir}/mcp`);

    return {
      hasClaude,
      hasAgents,
      hasSkills,
      hasCommands,
      hasMCP
    };
  }
}
