import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { ScheduledTask } from './types';
import type { TaskScheduler } from './task-scheduler';

export class TaskPersistence {
  private tasksPath: string;

  constructor() {
    this.tasksPath = join(homedir(), '.squid', 'scheduled-tasks.json');
  }

  async load(): Promise<ScheduledTask[]> {
    try {
      const data = await readFile(this.tasksPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async save(tasks: ScheduledTask[]): Promise<void> {
    await mkdir(join(homedir(), '.squid'), { recursive: true });
    await writeFile(this.tasksPath, JSON.stringify(tasks, null, 2));
  }

  async restoreTasks(scheduler: TaskScheduler): Promise<void> {
    const tasks = await this.load();
    for (const task of tasks) {
      if (task.enabled) {
        scheduler.register(task);
      }
    }
  }
}
