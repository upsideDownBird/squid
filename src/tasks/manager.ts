import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { Task, TaskCreateOptions } from './types';
import { randomUUID } from 'crypto';

export class TaskManager {
  private tasksDir: string;
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.tasksDir = join(homedir(), '.jobopx', 'tasks');
  }

  async init() {
    await mkdir(this.tasksDir, { recursive: true });
  }

  async createTask(options: TaskCreateOptions): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      title: options.title,
      mode: options.mode,
      workDir: options.workDir || process.cwd(),
      messages: [{ role: 'user', content: options.initialPrompt }],
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelProvider: options.modelProvider,
      skillId: options.skillId,
      expertId: options.expertId
    };

    this.tasks.set(task.id, task);
    await this.saveTask(task);
    return task;
  }

  async getTask(id: string): Promise<Task | undefined> {
    if (this.tasks.has(id)) {
      return this.tasks.get(id);
    }

    try {
      const data = await readFile(join(this.tasksDir, `${id}.json`), 'utf-8');
      const task = JSON.parse(data) as Task;
      this.tasks.set(id, task);
      return task;
    } catch {
      return undefined;
    }
  }

  private async saveTask(task: Task) {
    await writeFile(
      join(this.tasksDir, `${task.id}.json`),
      JSON.stringify(task, null, 2)
    );
  }
}
