import cron from 'node-cron';
import type { ScheduledTask } from './types';

export class CronScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  schedule(task: ScheduledTask, callback: () => Promise<void>): void {
    if (this.tasks.has(task.id)) {
      this.unschedule(task.id);
    }

    const cronTask = cron.schedule(task.cron, async () => {
      await callback();
    }, {
      scheduled: task.enabled
    });

    this.tasks.set(task.id, cronTask);
  }

  unschedule(taskId: string): void {
    const cronTask = this.tasks.get(taskId);
    if (cronTask) {
      cronTask.stop();
      this.tasks.delete(taskId);
    }
  }

  start(taskId: string): void {
    const cronTask = this.tasks.get(taskId);
    if (cronTask) {
      cronTask.start();
    }
  }

  stop(taskId: string): void {
    const cronTask = this.tasks.get(taskId);
    if (cronTask) {
      cronTask.stop();
    }
  }
}
