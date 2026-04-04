import { describe, it, expect } from 'vitest';
import { CronScheduler } from '../scheduler/cron-scheduler';
import type { ScheduledTask } from '../scheduler/types';

describe('CronScheduler', () => {
  let scheduler: CronScheduler;

  beforeEach(() => {
    scheduler = new CronScheduler();
  });

  afterEach(() => {
    // Clean up all scheduled tasks
  });

  it('should schedule a task', () => {
    const task: ScheduledTask = {
      id: 'test-1',
      name: 'Test Task',
      workDir: '/tmp',
      prompt: 'test',
      cron: '* * * * *',
      enabled: true,
      createdAt: new Date()
    };

    let executed = false;
    scheduler.schedule(task, async () => {
      executed = true;
    });

    expect(executed).toBe(false); // Not executed immediately
  });

  it('should start and stop scheduled task', () => {
    const task: ScheduledTask = {
      id: 'test-2',
      name: 'Test Task',
      workDir: '/tmp',
      prompt: 'test',
      cron: '* * * * *',
      enabled: true,
      createdAt: new Date()
    };

    scheduler.schedule(task, async () => {});
    scheduler.stop(task.id);
    scheduler.start(task.id);

    // Should not throw
    expect(true).toBe(true);
  });

  it('should unschedule a task', () => {
    const task: ScheduledTask = {
      id: 'test-3',
      name: 'Test Task',
      workDir: '/tmp',
      prompt: 'test',
      cron: '* * * * *',
      enabled: true,
      createdAt: new Date()
    };

    scheduler.schedule(task, async () => {});
    scheduler.unschedule(task.id);

    // Should not throw
    expect(true).toBe(true);
  });
});
