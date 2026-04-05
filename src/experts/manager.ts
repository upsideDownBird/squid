import type { Expert } from './types';
import { builtInExperts } from './types';

export class ExpertManager {
  private experts: Map<string, Expert> = new Map();

  constructor() {
    this.loadBuiltInExperts();
    this.loadCustomExperts();
  }

  private loadBuiltInExperts() {
    builtInExperts.forEach(expert => {
      this.experts.set(expert.id, expert);
    });
  }

  get(id: string): Expert | undefined {
    return this.experts.get(id);
  }

  list(): Expert[] {
    return Array.from(this.experts.values());
  }

  search(query: string): Expert[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(expert =>
      expert.name.toLowerCase().includes(lowerQuery) ||
      expert.role.toLowerCase().includes(lowerQuery) ||
      expert.expertise.some(e => e.toLowerCase().includes(lowerQuery))
    );
  }

  async addCustomExpert(expert: Expert): Promise<void> {
    this.experts.set(expert.id, expert);
    await this.saveCustomExperts();
  }

  async removeExpert(id: string): Promise<void> {
    this.experts.delete(id);
    await this.saveCustomExperts();
  }

  private async saveCustomExperts(): Promise<void> {
    const { mkdir, writeFile } = await import('fs/promises');
    const { join } = await import('path');
    const { homedir } = await import('os');

    const expertsDir = join(homedir(), '.squid', 'experts');
    await mkdir(expertsDir, { recursive: true });

    const customExperts = this.list().filter(e => !builtInExperts.find(b => b.id === e.id));
    const filePath = join(expertsDir, 'custom.json');
    await writeFile(filePath, JSON.stringify(customExperts, null, 2), 'utf-8');
  }

  async loadCustomExperts(): Promise<void> {
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const { homedir } = await import('os');

      const filePath = join(homedir(), '.squid', 'experts', 'custom.json');
      const content = await readFile(filePath, 'utf-8');
      const customExperts: Expert[] = JSON.parse(content);

      customExperts.forEach(expert => {
        this.experts.set(expert.id, expert);
      });
    } catch {
      // 文件不存在或读取失败，忽略
    }
  }
}
