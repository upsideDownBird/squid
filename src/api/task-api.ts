// Task execution API
import { TaskExecutor } from '../tasks/executor';
import { TaskMode } from '../tasks/types';
import { WorkspaceSandbox } from '../workspace/sandbox';
import { SkillLoader } from '../skills/loader';
import { ToolRegistry } from '../tools/registry';
import { ExpertManager } from '../experts/manager';
import { ConversationManager } from '../conversation/manager';
import { MemoryManager } from '../memory/manager';
import type { MemoryCreateInput, MemoryUpdateInput } from '../memory/types';
import { saveMemoryTool } from '../tools/save-memory';
import { WebFetchTool } from '../tools/web-fetch';
import { FileEditTool } from '../tools/file-edit';
import { BashTool } from '../tools/bash';
import { PowerShellTool } from '../tools/powershell';
import { WebSearchTool } from '../tools/web-search';
import { CronCreateTool } from '../tools/cron-create';
import { CronDeleteTool } from '../tools/cron-delete';
import { CronListTool } from '../tools/cron-list';
import { SkillTool } from '../tools/skill';
import { BriefTool } from '../tools/brief';
import { AgentTool } from '../tools/agent';

export interface TaskRequest {
  mode: TaskMode;
  workspace: string;
  instruction: string;
  apiKey?: string;
  baseURL?: string;
  modelName?: string;
  skill?: string;
  expertId?: string;
  conversationId?: string;
}

export interface TaskResponse {
  success: boolean;
  output?: string;
  error?: string;
  files?: string[];
}

export interface TaskListItem {
  id: string;
  instruction: string;
  mode: TaskMode;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  workspace: string;
  expertId?: string;
}

export class TaskAPI {
  private executor: TaskExecutor;
  private skillLoader: SkillLoader;
  private toolRegistry: ToolRegistry;
  private expertManager: ExpertManager;
  private conversationManager: ConversationManager;
  private memoryManager: MemoryManager;
  private tasks: Map<string, TaskListItem> = new Map();
  private currentConversationId: string | null = null;

  constructor() {
    this.skillLoader = new SkillLoader();
    this.toolRegistry = new ToolRegistry();
    this.expertManager = new ExpertManager();
    this.conversationManager = new ConversationManager();
    this.memoryManager = new MemoryManager();

    // 注册 Tools
    this.toolRegistry.register(saveMemoryTool);
    this.toolRegistry.register(WebFetchTool);
    this.toolRegistry.register(FileEditTool);
    this.toolRegistry.register(BashTool);
    this.toolRegistry.register(PowerShellTool);
    this.toolRegistry.register(WebSearchTool);
    this.toolRegistry.register(CronCreateTool);
    this.toolRegistry.register(CronDeleteTool);
    this.toolRegistry.register(CronListTool);
    this.toolRegistry.register(SkillTool);
    this.toolRegistry.register(BriefTool);
    this.toolRegistry.register(AgentTool);

    this.executor = new TaskExecutor(
      this.skillLoader,
      this.toolRegistry
    );

    // 初始化对话管理器和记忆管理器
    this.conversationManager.init();
    this.memoryManager.init();
  }

  async listTasks(): Promise<TaskListItem[]> {
    return Array.from(this.tasks.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async listSkills(): Promise<Array<{ name: string; description: string; effort: string }>> {
    const skills = await this.skillLoader.loadAll();
    return Array.from(skills.values()).map(skill => ({
      name: skill.metadata.name,
      description: skill.metadata.description,
      effort: skill.metadata.effort
    }));
  }

  async generateSkill(description: string): Promise<{ success: boolean; yaml?: string; error?: string }> {
    try {
      // TODO: 调用 LLM 生成技能 YAML
      // 这里先返回一个模板
      const yaml = `---
name: custom-skill
description: ${description}
when-to-use: 根据用户需求使用
allowed-tools:
  - Read
  - Write
  - Bash
effort: medium
user-invocable: true
---

你是一个专业的助手，专注于：${description}

请根据用户的指令完成任务。`;

      return {
        success: true,
        yaml
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveSkill(yaml: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { mkdir, writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const skillsDir = join(homedir(), '.jobopx', 'skills');
      await mkdir(skillsDir, { recursive: true });

      // 从 YAML 中提取技能名称
      const nameMatch = yaml.match(/name:\s*(.+)/);
      const name = nameMatch ? nameMatch[1].trim() : 'custom-skill';

      const filePath = join(skillsDir, `${name}.md`);
      await writeFile(filePath, yaml, 'utf-8');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async previewSkill(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let content: string;

      // 判断是 URL 还是本地路径
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // 从远程获取
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        content = await response.text();
      } else {
        // 从本地读取
        const { readFile } = await import('fs/promises');
        content = await readFile(url, 'utf-8');
      }

      // 解析技能文件
      const parts = content.split('---\n');
      if (parts.length < 3) {
        throw new Error('Invalid skill file format');
      }

      const yamlContent = parts[1];
      const lines = yamlContent.split('\n');
      const metadata: any = {};
      let currentKey = '';
      let currentArray: string[] = [];

      for (const line of lines) {
        if (line.includes(':')) {
          if (currentKey && currentArray.length > 0) {
            metadata[currentKey] = currentArray;
            currentArray = [];
          }
          const [key, value] = line.split(':').map(s => s.trim());
          currentKey = key;
          if (value) {
            metadata[key] = value === 'true' ? true : value === 'false' ? false : value;
          }
        } else if (line.trim().startsWith('-')) {
          currentArray.push(line.trim().substring(1).trim());
        }
      }

      if (currentKey && currentArray.length > 0) {
        metadata[currentKey] = currentArray;
      }

      return {
        success: true,
        data: {
          name: metadata.name || 'unknown',
          description: metadata.description || '',
          allowedTools: metadata['allowed-tools'] || [],
          hooks: metadata.hooks || {},
          content
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async installSkill(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { mkdir, writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const skillsDir = join(homedir(), '.jobopx', 'skills');
      await mkdir(skillsDir, { recursive: true });

      const filePath = join(skillsDir, `${data.name}.md`);
      await writeFile(filePath, data.content, 'utf-8');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeTask(request: TaskRequest): Promise<TaskResponse> {
    try {
      console.log('Executing task:', request);

      // Generate task ID
      const taskId = Date.now().toString();

      // Store task
      this.tasks.set(taskId, {
        id: taskId,
        instruction: request.instruction,
        mode: request.mode,
        status: 'running',
        createdAt: new Date().toISOString(),
        workspace: request.workspace,
        expertId: request.expertId
      });

      // Validate workspace
      const sandbox = new WorkspaceSandbox(request.workspace);
      await sandbox.validatePath(request.workspace);

      // Execute task
      const result = await this.executor.execute({
        mode: request.mode,
        instruction: request.instruction,
        workspace: request.workspace,
        apiKey: request.apiKey || process.env.ANTHROPIC_API_KEY || ''
      });

      // Update task status
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'completed';
      }

      return {
        success: true,
        output: JSON.stringify(result, null, 2),
        files: result.files || []
      };
    } catch (error: any) {
      console.error('Task execution failed:', error);

      // Update task status
      const taskId = Array.from(this.tasks.values()).find(t => t.status === 'running')?.id;
      if (taskId) {
        const task = this.tasks.get(taskId);
        if (task) {
          task.status = 'failed';
        }
      }

      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  async executeTaskStream(request: TaskRequest, onChunk: (chunk: string) => void): Promise<void> {
    try {
      console.log('Executing task with streaming:', request);

      // 加载模型配置
      const modelConfig = await this.getModelConfig();
      const apiKey = request.apiKey || modelConfig.apiKey || process.env.ANTHROPIC_API_KEY || '';
      const baseURL = request.baseURL || modelConfig.apiEndpoint;
      const modelName = request.modelName || modelConfig.modelName;

      // 设置 API 配置到 ConversationManager（用于自动提取记忆）
      if (apiKey) {
        this.conversationManager.setApiKey(apiKey, baseURL, modelName);
      }

      // 创建或获取对话
      let conversationId = request.conversationId || this.currentConversationId;
      if (!conversationId) {
        conversationId = await this.conversationManager.createConversation(request.workspace);
        this.currentConversationId = conversationId;
      }

      // 添加用户消息到对话历史
      await this.conversationManager.addMessage(conversationId, 'user', request.instruction);

      // 获取对话历史
      const conversationHistory = this.conversationManager.getMessages(conversationId);

      // Generate task ID
      const taskId = Date.now().toString();

      // Store task
      this.tasks.set(taskId, {
        id: taskId,
        instruction: request.instruction,
        mode: request.mode,
        status: 'running',
        createdAt: new Date().toISOString(),
        workspace: request.workspace,
        expertId: request.expertId
      });

      // Validate workspace
      const sandbox = new WorkspaceSandbox(request.workspace);
      await sandbox.validatePath(request.workspace);

      // 收集完整的响应
      let fullResponse = '';

      // Execute task with streaming
      await this.executor.executeStream({
        mode: request.mode,
        instruction: request.instruction,
        workspace: request.workspace,
        apiKey: apiKey,
        conversationHistory
      }, (chunk: string) => {
        fullResponse += chunk;
        onChunk(chunk);
      });

      // 添加助手响应到对话历史
      await this.conversationManager.addMessage(conversationId, 'assistant', fullResponse);

      // Update task status
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = 'completed';
      }
    } catch (error: any) {
      console.error('Task execution failed:', error);

      // Update task status
      const taskId = Array.from(this.tasks.values()).find(t => t.status === 'running')?.id;
      if (taskId) {
        const task = this.tasks.get(taskId);
        if (task) {
          task.status = 'failed';
        }
      }

      throw error;
    }
  }

  async listExperts() {
    return this.expertManager.list();
  }

  async getExpert(id: string) {
    return this.expertManager.get(id);
  }

  async switchExpert(taskId: string, expertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        };
      }

      // 更新任务的专家
      task.expertId = expertId;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createCustomExpert(data: {
    name: string;
    role: string;
    expertise: string[];
    promptTemplate: string;
  }): Promise<{ success: boolean; expert?: any; error?: string }> {
    try {
      const expert = {
        id: `custom-${Date.now()}`,
        name: data.name,
        role: data.role,
        expertise: data.expertise,
        promptTemplate: data.promptTemplate
      };

      await this.expertManager.addCustomExpert(expert);

      return {
        success: true,
        expert
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async clearConversation(): Promise<{ success: boolean }> {
    try {
      if (this.currentConversationId) {
        this.conversationManager.clearConversation(this.currentConversationId);
      }
      // 创建新对话
      this.currentConversationId = null;
      return { success: true };
    } catch (error: any) {
      return { success: false };
    }
  }

  async getConversationHistory(): Promise<any[]> {
    try {
      if (this.currentConversationId) {
        return this.conversationManager.getMessages(this.currentConversationId);
      }
      return [];
    } catch (error: any) {
      return [];
    }
  }

  async generateExpertFromDescription(description: string): Promise<{ success: boolean; expert?: any; error?: string }> {
    try {
      // TODO: 调用 LLM 生成专家定义
      // 这里先返回一个模板
      const expert = {
        name: '自定义专家',
        role: description,
        expertise: ['通用技能'],
        promptTemplate: `你是一位专业的助手，专注于：${description}\n\n请根据用户的需求提供专业的帮助。`
      };

      return {
        success: true,
        expert
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getModelConfig(): Promise<any> {
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const configPath = join(homedir(), '.jobopx', 'config.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.model || {};
    } catch (error: any) {
      return {};
    }
  }

  async saveModelConfig(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { mkdir, readFile, writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const configDir = join(homedir(), '.jobopx');
      await mkdir(configDir, { recursive: true });

      const configPath = join(configDir, 'config.json');

      let existingConfig: any = {};
      try {
        const content = await readFile(configPath, 'utf-8');
        existingConfig = JSON.parse(content);
      } catch {
        // File doesn't exist, use empty config
      }

      existingConfig.model = config;
      await writeFile(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testModelConfig(config: any): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // 根据不同的提供商测试连接
      if (config.provider === 'openai') {
        const response = await fetch(config.apiEndpoint || 'https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          success: true,
          message: 'OpenAI API 连接成功'
        };
      } else if (config.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: config.modelName || 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }]
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }

        return {
          success: true,
          message: 'Anthropic API 连接成功'
        };
      } else if (config.provider === 'custom') {
        // 自定义端点，根据协议类型测试
        if (config.apiProtocol === 'openai') {
          const response = await fetch(`${config.apiEndpoint}/models`, {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return {
            success: true,
            message: '自定义端点（OpenAI 协议）连接成功'
          };
        } else if (config.apiProtocol === 'anthropic') {
          const response = await fetch(`${config.apiEndpoint}/messages`, {
            method: 'POST',
            headers: {
              'x-api-key': config.apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: config.modelName || 'claude-3-5-sonnet-20241022',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            })
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
          }

          return {
            success: true,
            message: '自定义端点（Anthropic 协议）连接成功'
          };
        }
      }

      return {
        success: false,
        error: '未知的提供商类型'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getWorkspaceConfig(): Promise<any> {
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const configPath = join(homedir(), '.jobopx', 'config.json');
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return { workspace: config.workspace || '/tmp/jobopx-test' };
    } catch (error: any) {
      return { workspace: '/tmp/jobopx-test' };
    }
  }

  async saveWorkspaceConfig(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { mkdir, readFile, writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const configDir = join(homedir(), '.jobopx');
      await mkdir(configDir, { recursive: true });

      const configPath = join(configDir, 'config.json');

      let existingConfig: any = {};
      try {
        const content = await readFile(configPath, 'utf-8');
        existingConfig = JSON.parse(content);
      } catch {
        // File doesn't exist, use empty config
      }

      existingConfig.workspace = config.workspace;
      await writeFile(configPath, JSON.stringify(existingConfig, null, 2), 'utf-8');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Memory API methods
  async listMemories(type?: string): Promise<{ success: boolean; memories?: any[]; error?: string }> {
    try {
      const memories = await this.memoryManager.list(type as any);
      return {
        success: true,
        memories: memories.map(m => ({
          id: m.id,
          name: m.metadata.name,
          description: m.metadata.description,
          type: m.metadata.type,
          created: m.metadata.created,
          updated: m.metadata.updated,
          content: m.content
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getMemory(id: string): Promise<{ success: boolean; memory?: any; error?: string }> {
    try {
      const memory = await this.memoryManager.read(id);
      if (!memory) {
        return {
          success: false,
          error: 'Memory not found'
        };
      }
      return {
        success: true,
        memory: {
          id: memory.id,
          name: memory.metadata.name,
          description: memory.metadata.description,
          type: memory.metadata.type,
          created: memory.metadata.created,
          updated: memory.metadata.updated,
          content: memory.content
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createMemory(input: MemoryCreateInput): Promise<{ success: boolean; memory?: any; error?: string }> {
    try {
      const memory = await this.memoryManager.create(input);
      return {
        success: true,
        memory: {
          id: memory.id,
          name: memory.metadata.name,
          description: memory.metadata.description,
          type: memory.metadata.type,
          created: memory.metadata.created,
          updated: memory.metadata.updated,
          content: memory.content
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateMemory(id: string, input: MemoryUpdateInput): Promise<{ success: boolean; memory?: any; error?: string }> {
    try {
      const memory = await this.memoryManager.update(id, input);
      if (!memory) {
        return {
          success: false,
          error: 'Memory not found'
        };
      }
      return {
        success: true,
        memory: {
          id: memory.id,
          name: memory.metadata.name,
          description: memory.metadata.description,
          type: memory.metadata.type,
          created: memory.metadata.created,
          updated: memory.metadata.updated,
          content: memory.content
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteMemory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await this.memoryManager.delete(id);
      if (!deleted) {
        return {
          success: false,
          error: 'Memory not found'
        };
      }
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async searchMemories(query: string): Promise<{ success: boolean; memories?: any[]; error?: string }> {
    try {
      const memories = await this.memoryManager.search(query);
      return {
        success: true,
        memories: memories.map(m => ({
          id: m.id,
          name: m.metadata.name,
          description: m.metadata.description,
          type: m.metadata.type,
          created: m.metadata.created,
          updated: m.metadata.updated,
          content: m.content
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async compressConversation(conversationId?: string, manual: boolean = false): Promise<{ success: boolean; strategy?: string; tokensSaved?: number; usage?: number; error?: string }> {
    try {
      const id = conversationId || this.currentConversationId;
      if (!id) {
        return {
          success: false,
          error: 'No active conversation'
        };
      }

      const result = await this.conversationManager.compressConversation(id, manual);

      if (result.success) {
        const usage = this.conversationManager.getUsagePercentage(id);
        return {
          success: true,
          strategy: result.strategy,
          tokensSaved: result.tokensSaved,
          usage
        };
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getConversationUsage(conversationId?: string): Promise<{ success: boolean; usage?: number; error?: string }> {
    try {
      const id = conversationId || this.currentConversationId;
      if (!id) {
        return {
          success: false,
          error: 'No active conversation'
        };
      }

      const usage = this.conversationManager.getUsagePercentage(id);
      return {
        success: true,
        usage
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Trigger manual memory extraction
  async triggerManualExtraction(conversationId?: string): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const id = conversationId || this.currentConversationId;
      if (!id) {
        return {
          success: false,
          created: 0,
          skipped: 0,
          errors: ['No active conversation']
        };
      }

      return await this.conversationManager.manualExtraction(id);
    } catch (error: any) {
      return {
        success: false,
        created: 0,
        skipped: 0,
        errors: [error.message]
      };
    }
  }

  // Get extraction config
  async getExtractionConfig(): Promise<{
    success: boolean;
    config?: any;
    error?: string;
  }> {
    try {
      const { ConfigManager } = await import('../memory/config-manager');
      const configManager = new ConfigManager();
      await configManager.init();
      const config = configManager.get();

      return {
        success: true,
        config
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save extraction config
  async saveExtractionConfig(config: any): Promise<{
    success: boolean;
    config?: any;
    error?: string;
  }> {
    try {
      const { ConfigManager } = await import('../memory/config-manager');
      const configManager = new ConfigManager();
      await configManager.init();
      const updated = await configManager.save(config);

      return {
        success: true,
        config: updated
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get extraction stats
  async getExtractionStats(): Promise<{
    success: boolean;
    stats?: {
      totalAutoCreated: number;
      totalMemories: number;
      lastExtractionTime: string | null;
    };
    error?: string;
  }> {
    try {
      const memories = await this.memoryManager.list();
      const autoCreated = memories.filter(m => (m.metadata as any).autoCreated);

      return {
        success: true,
        stats: {
          totalAutoCreated: autoCreated.length,
          totalMemories: memories.length,
          lastExtractionTime: null // TODO: Track this in extraction state
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
