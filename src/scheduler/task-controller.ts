import type { TaskScheduler } from './task-scheduler';
import type { ScheduledTask } from './types';

export class TaskController {
  private scheduler: TaskScheduler;

  constructor(scheduler: TaskScheduler) {
    this.scheduler = scheduler;
  }

  start(taskId: string): void {
    this.scheduler.enable(taskId);
  }

  stop(taskId: string): void {
    this.scheduler.disable(taskId);
  }

  restart(taskId: string): void {
    this.stop(taskId);
    this.start(taskId);
  }

  remove(taskId: string): void {
    this.scheduler.unregister(taskId);
  }

  add(task: ScheduledTask): void {
    this.scheduler.register(task);
  }
}
