import { CronScheduler } from './cron-scheduler';
import type { ScheduledTask, TaskExecutionRecord } from './types';
import type { ModelProvider } from '../models/types';
import { randomUUID } from 'crypto';
import { eventBridge } from '../channels/bridge/event-bridge';

export class TaskScheduler {
  private scheduler: CronScheduler;
  private tasks: Map<string, ScheduledTask> = new Map();
  private history: TaskExecutionRecord[] = [];
  private modelProvider: ModelProvider;

  constructor(modelProvider: ModelProvider) {
    this.scheduler = new CronScheduler();
    this.modelProvider = modelProvider;
  }

  register(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
    this.scheduler.schedule(task, async () => {
      await this.executeTask(task);
    });
  }

  unregister(taskId: string): void {
    this.scheduler.unschedule(taskId);
    this.tasks.delete(taskId);
  }

  enable(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      this.scheduler.start(taskId);
    }
  }

  disable(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.scheduler.stop(taskId);
    }
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    const startTime = Date.now();
    const record: TaskExecutionRecord = {
      taskId: task.id,
      executedAt: new Date(),
      status: 'success'
    };

    try {
      const messages = [{ role: 'user' as const, content: task.prompt }];
      const chunks: string[] = [];

      for await (const chunk of this.modelProvider.chat(messages, [], { stream: true })) {
        if (chunk.type === 'text' && chunk.content) {
          chunks.push(chunk.content);
        }
      }

      record.result = chunks.join('');
      task.lastRun = new Date();

      // 发送任务完成事件到 EventBridge
      const duration = Date.now() - startTime;
      eventBridge.notifyTaskComplete(task.id, {
        taskName: task.name || task.prompt.substring(0, 50),
        result: record.result,
        duration,
        status: 'success',
      });
    } catch (error) {
      record.status = 'failed';
      record.error = (error as Error).message;

      // 发送任务失败事件到 EventBridge
      const duration = Date.now() - startTime;
      eventBridge.notifyTaskComplete(task.id, {
        taskName: task.name || task.prompt.substring(0, 50),
        error: (error as Error).message,
        duration,
        status: 'failed',
      });
    }

    this.history.push(record);
  }

  getHistory(taskId?: string): TaskExecutionRecord[] {
    if (taskId) {
      return this.history.filter(r => r.taskId === taskId);
    }
    return this.history;
  }
}
