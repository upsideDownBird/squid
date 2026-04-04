import * as cron from 'node-cron';
import { enqueuePendingNotification } from '../utils/messageQueueManager';

export interface CronTask {
  id: string;
  expression: string;
  content: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

// 通知回调类型
type NotificationCallback = (taskId: string, content: string) => void;

// 任务执行回调类型
type TaskExecutor = (prompt: string, taskId: string) => Promise<{ success: boolean; result: string }>;

class CronManager {
  private tasks: Map<string, { task: cron.ScheduledTask; info: CronTask }> = new Map();
  private notificationCallback?: NotificationCallback;
  private taskExecutor?: TaskExecutor;

  /**
   * 设置通知回调
   */
  setNotificationCallback(callback: NotificationCallback) {
    this.notificationCallback = callback;
  }

  /**
   * 设置任务执行器
   */
  setTaskExecutor(executor: TaskExecutor) {
    this.taskExecutor = executor;
  }

  /**
   * 创建定时任务
   */
  createTask(expression: string, content: string): { success: boolean; taskId?: string; error?: string } {
    // 验证 cron 表达式
    if (!cron.validate(expression)) {
      return {
        success: false,
        error: `无效的 cron 表达式: ${expression}`
      };
    }

    const taskId = `cron-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const taskInfo: CronTask = {
        id: taskId,
        expression,
        content,
        createdAt: new Date(),
        isRunning: false
      };

      const scheduledTask = cron.schedule(expression, async () => {
        taskInfo.lastRun = new Date();
        taskInfo.isRunning = true;

        console.log(`[Cron ${taskId}] 任务触发: ${content}`);

        try {
          // 将任务加入消息队列
          enqueuePendingNotification({
            value: content,
            priority: 'later',
            isMeta: true,
            source: 'cron',
            taskId: taskId,
          });

          console.log(`[Cron ${taskId}] 任务已加入消息队列`);

          // 如果设置了任务执行器，直接执行
          if (this.taskExecutor) {
            console.log(`[Cron ${taskId}] 开始执行任务...`);
            const result = await this.taskExecutor(content, taskId);

            console.log(`[Cron ${taskId}] 任务执行完成:`, result);

            // 触发通知回调
            if (this.notificationCallback) {
              this.notificationCallback(taskId, result.result || content);
            }

            // 如果支持系统通知，发送通知
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('定时任务完成', {
                body: result.success ? result.result : `执行失败: ${result.result}`,
                icon: '/icon.png'
              });
            }
          } else {
            console.warn(`[Cron ${taskId}] 未设置任务执行器，任务仅加入队列`);

            // 没有执行器时，仍然触发通知
            if (this.notificationCallback) {
              this.notificationCallback(taskId, content);
            }
          }
        } catch (error) {
          console.error(`[Cron ${taskId}] 任务执行失败:`, error);

          // 触发失败通知
          if (this.notificationCallback) {
            this.notificationCallback(taskId, `执行失败: ${(error as Error).message}`);
          }
        } finally {
          taskInfo.isRunning = false;
        }
      });

      // 启动定时任务
      scheduledTask.start();

      this.tasks.set(taskId, { task: scheduledTask, info: taskInfo });

      return {
        success: true,
        taskId
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 删除定时任务
   */
  deleteTask(taskId: string): { success: boolean; error?: string } {
    const taskEntry = this.tasks.get(taskId);

    if (!taskEntry) {
      return {
        success: false,
        error: `任务不存在: ${taskId}`
      };
    }

    try {
      taskEntry.task.stop();
      this.tasks.delete(taskId);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 获取所有任务
   */
  listTasks(): CronTask[] {
    return Array.from(this.tasks.values()).map(entry => ({ ...entry.info }));
  }

  /**
   * 获取单个任务
   */
  getTask(taskId: string): CronTask | undefined {
    const taskEntry = this.tasks.get(taskId);
    return taskEntry ? { ...taskEntry.info } : undefined;
  }

  /**
   * 清空所有任务
   */
  clear(): void {
    this.tasks.forEach(entry => entry.task.stop());
    this.tasks.clear();
  }
}

// 单例实例
export const cronManager = new CronManager();
