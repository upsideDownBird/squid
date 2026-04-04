import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBridge } from '../channels/bridge/event-bridge';

describe('EventBridge', () => {
  let eventBridge: EventBridge;

  beforeEach(() => {
    eventBridge = new EventBridge();
  });

  describe('notifyTaskComplete', () => {
    it('应该发送任务完成事件', () => {
      const callback = vi.fn();
      eventBridge.onTaskComplete(callback);

      eventBridge.notifyTaskComplete('task-123', {
        taskName: '测试任务',
        result: { success: true },
        duration: 1000,
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-123',
          result: expect.objectContaining({
            taskName: '测试任务',
            result: { success: true },
            duration: 1000,
          }),
          timestamp: expect.any(Number),
        })
      );
    });

    it('应该支持多个订阅者', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBridge.onTaskComplete(callback1);
      eventBridge.onTaskComplete(callback2);

      eventBridge.notifyTaskComplete('task-123');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('应该包含时间戳', () => {
      const callback = vi.fn();
      eventBridge.onTaskComplete(callback);

      const beforeTime = Date.now();
      eventBridge.notifyTaskComplete('task-123');
      const afterTime = Date.now();

      const event = callback.mock.calls[0][0];
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('onTaskComplete', () => {
    it('应该注册回调函数', () => {
      const callback = vi.fn();
      eventBridge.onTaskComplete(callback);

      eventBridge.notifyTaskComplete('task-123');

      expect(callback).toHaveBeenCalled();
    });

    it('应该支持移除回调', () => {
      const callback = vi.fn();
      eventBridge.onTaskComplete(callback);
      eventBridge.offTaskComplete(callback);

      eventBridge.notifyTaskComplete('task-123');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('sendCommand', () => {
    it('应该发送命令事件', () => {
      const callback = vi.fn();
      eventBridge.onCommand(callback);

      eventBridge.sendCommand('restart-task', { taskId: 'task-123' }, 'webui');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'restart-task',
          args: { taskId: 'task-123' },
          channelId: 'webui',
          timestamp: expect.any(Number),
        })
      );
    });

    it('应该支持不带参数的命令', () => {
      const callback = vi.fn();
      eventBridge.onCommand(callback);

      eventBridge.sendCommand('refresh');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'refresh',
          args: undefined,
          channelId: undefined,
        })
      );
    });
  });

  describe('onCommand', () => {
    it('应该注册命令回调', () => {
      const callback = vi.fn();
      eventBridge.onCommand(callback);

      eventBridge.sendCommand('test');

      expect(callback).toHaveBeenCalled();
    });

    it('应该支持移除命令回调', () => {
      const callback = vi.fn();
      eventBridge.onCommand(callback);
      eventBridge.offCommand(callback);

      eventBridge.sendCommand('test');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('订阅者抛出错误不应影响其他订阅者', () => {
      const callback1 = vi.fn(() => {
        throw new Error('测试错误');
      });
      const callback2 = vi.fn();

      eventBridge.onTaskComplete(callback1);
      eventBridge.onTaskComplete(callback2);

      // 不应该抛出错误
      expect(() => {
        eventBridge.notifyTaskComplete('task-123');
      }).not.toThrow();

      // callback2 应该仍然被调用
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('内存管理', () => {
    it('移除监听器后不应再收到事件', () => {
      const callback = vi.fn();

      eventBridge.onTaskComplete(callback);
      eventBridge.notifyTaskComplete('task-1');
      expect(callback).toHaveBeenCalledTimes(1);

      eventBridge.offTaskComplete(callback);
      eventBridge.notifyTaskComplete('task-2');
      expect(callback).toHaveBeenCalledTimes(1); // 仍然是 1 次
    });
  });
});
