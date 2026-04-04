import type { ClawTask } from './task-handler';
import type { ModelProvider } from '../models/types';

export class ClawTaskExecutor {
  private queue: ClawTask[] = [];
  private running = false;
  private modelProvider: ModelProvider;

  constructor(modelProvider: ModelProvider) {
    this.modelProvider = modelProvider;
  }

  enqueue(task: ClawTask): void {
    this.queue.push(task);
    if (!this.running) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.running = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await this.executeTask(task);
    }

    this.running = false;
  }

  private async executeTask(task: ClawTask): Promise<void> {
    task.status = 'running';

    try {
      const messages = [{ role: 'user' as const, content: task.prompt }];
      const chunks: string[] = [];

      for await (const chunk of this.modelProvider.chat(messages, [], { stream: true })) {
        if (chunk.type === 'text' && chunk.content) {
          chunks.push(chunk.content);
        }
      }

      task.result = chunks.join('');
      task.status = 'completed';
    } catch (error) {
      task.error = (error as Error).message;
      task.status = 'failed';
    }
  }
}
