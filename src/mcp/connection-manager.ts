import { MCPClient, type MCPServerConfig } from './client';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface ConnectionStatus {
  name: string;
  connected: boolean;
  error?: string;
}

export class MCPConnectionManager {
  private client: MCPClient;
  private configPath: string;
  private connections: Map<string, ConnectionStatus> = new Map();

  constructor() {
    this.client = new MCPClient();
    this.configPath = join(homedir(), '.squid', 'mcp-servers.json');
  }

  async loadConfigs(): Promise<MCPServerConfig[]> {
    try {
      const data = await readFile(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveConfigs(configs: MCPServerConfig[]): Promise<void> {
    await mkdir(join(homedir(), '.squid'), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(configs, null, 2));
  }

  async connectAll(): Promise<void> {
    const configs = await this.loadConfigs();
    for (const config of configs) {
      try {
        await this.client.connect(config);
        this.connections.set(config.name, { name: config.name, connected: true });
      } catch (error) {
        this.connections.set(config.name, {
          name: config.name,
          connected: false,
          error: (error as Error).message
        });
      }
    }
  }

  async addServer(config: MCPServerConfig): Promise<void> {
    const configs = await this.loadConfigs();
    configs.push(config);
    await this.saveConfigs(configs);

    try {
      await this.client.connect(config);
      this.connections.set(config.name, { name: config.name, connected: true });
    } catch (error) {
      this.connections.set(config.name, {
        name: config.name,
        connected: false,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async removeServer(name: string): Promise<void> {
    await this.client.disconnect(name);
    this.connections.delete(name);

    const configs = await this.loadConfigs();
    const filtered = configs.filter(c => c.name !== name);
    await this.saveConfigs(filtered);
  }

  getStatus(): ConnectionStatus[] {
    return Array.from(this.connections.values());
  }

  getClient(): MCPClient {
    return this.client;
  }
}
