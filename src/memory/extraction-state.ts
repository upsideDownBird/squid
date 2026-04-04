// Extraction state persistence manager
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface ExtractionState {
  inProgress: boolean;
  lastExtractionTime: number;
  turnCount: number;
}

export class ExtractionStateManager {
  private statePath: string;
  private states: Map<string, ExtractionState>;

  constructor() {
    this.statePath = join(homedir(), '.jobopx', 'extraction-state.json');
    this.states = new Map();
  }

  async init(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const content = await readFile(this.statePath, 'utf-8');
      const data = JSON.parse(content);
      this.states = new Map(Object.entries(data));
    } catch (error) {
      // 文件不存在，使用空 Map
      this.states = new Map();
    }
  }

  private async save(): Promise<void> {
    const data = Object.fromEntries(this.states);
    await writeFile(this.statePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getState(conversationId: string): ExtractionState {
    if (!this.states.has(conversationId)) {
      this.states.set(conversationId, {
        inProgress: false,
        lastExtractionTime: 0,
        turnCount: 0
      });
    }
    return this.states.get(conversationId)!;
  }

  async updateState(conversationId: string, state: Partial<ExtractionState>): Promise<void> {
    const current = this.getState(conversationId);
    this.states.set(conversationId, { ...current, ...state });
    await this.save();
  }

  async resetState(conversationId: string): Promise<void> {
    this.states.delete(conversationId);
    await this.save();
  }
}
