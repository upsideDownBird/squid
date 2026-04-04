import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { TaskExecutionRecord } from './types';

export class ExecutionHistory {
  private historyPath: string;
  private records: TaskExecutionRecord[] = [];

  constructor() {
    this.historyPath = join(homedir(), '.jobopx', 'scheduler-history.json');
  }

  async load(): Promise<void> {
    try {
      const data = await readFile(this.historyPath, 'utf-8');
      this.records = JSON.parse(data);
    } catch {
      this.records = [];
    }
  }

  async save(): Promise<void> {
    await mkdir(join(homedir(), '.jobopx'), { recursive: true });
    await writeFile(this.historyPath, JSON.stringify(this.records, null, 2));
  }

  add(record: TaskExecutionRecord): void {
    this.records.push(record);
    this.save();
  }

  getByTask(taskId: string): TaskExecutionRecord[] {
    return this.records.filter(r => r.taskId === taskId);
  }

  getAll(): TaskExecutionRecord[] {
    return this.records;
  }

  clear(taskId?: string): void {
    if (taskId) {
      this.records = this.records.filter(r => r.taskId !== taskId);
    } else {
      this.records = [];
    }
    this.save();
  }
}
