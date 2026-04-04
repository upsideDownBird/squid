import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebUIChannelPlugin } from '../channels/plugins/webui/plugin';
import { eventBridge } from '../channels/bridge/event-bridge';

// Mock WebSocket
vi.mock('ws', () => {
  const mockClients = new Set();

  class MockWebSocket {
    readyState = 1; // OPEN
    send = vi.fn();
    close = vi.fn();
    on = vi.fn();
  }

  class MockWebSocketServer {
    clients = mockClients;
    on = vi.fn((event, handler) => {
      if (event === 'connection') {
        this.connectionHandler = handler;
      }
    });
    close = vi.fn((callback) => callback?.());

    simulateConnection() {
      const ws = new MockWebSocket();
      mockClients.add(ws);
      this.connectionHandler?.(ws);
      return ws;
    }
  }

  return {
    WebSocketServer: MockWebSocketServer,
    WebSocket: MockWebSocket,
  };
});

describe('WebUIChannelPlugin', () => {
  let plugin: WebUIChannelPlugin;

  beforeEach(() => {
    plugin = new WebUIChannelPlugin();
  });

  afterEach(async () => {
    if (plugin.setup) {
      await plugin.setup.cleanup();
    }
  });

  describe('基本属性', () => {
    it('应该有正确的 ID', () => {
      expect(plugin.id).toBe('webui');
    });

    it('应该有正确的元信息', () => {
      expect(plugin.meta.name).toBe('WebUI Channel');
      expect(plugin.meta.category).toBe('builtin');
    });

    it('应该声明正确的能力', () => {
      expect(plugin.capabilities.outbound.text).toBe(true);
      expect(plugin.capabilities.inbound.commands).toBe(true);
    });
  });

  describe('配置', () => {
    it('应该能获取配置', () => {
      const port = plugin.config.get<number>('port');
      expect(port).toBe(8080);
    });

    it('应该能设置配置', () => {
      plugin.config.set('port', 9090);
      expect(plugin.config.get<number>('port')).toBe(9090);
    });

    it('应该能获取所有配置', () => {
      const config = plugin.config.getAll();
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('heartbeatInterval');
    });

    it('配置验证应该通过', () => {
      expect(plugin.config.validate()).toBe(true);
    });
  });

  describe('状态检查', () => {
    it('初始化前应该返回未启动状态', async () => {
      const status = await plugin.status.check();
      expect(status.healthy).toBe(false);
      expect(status.message).toContain('未启动');
    });

    it('初始化后应该返回健康状态', async () => {
      if (plugin.setup) {
        await plugin.setup.initialize();
      }

      const status = await plugin.status.check();
      expect(status.healthy).toBe(true);
      expect(status.message).toContain('运行中');
    });
  });

  describe('出站消息', () => {
    it('应该能发送文本消息', async () => {
      const result = await plugin.outbound.sendText({
        content: '测试消息',
      });

      expect(result.success).toBe(true);
    });

    it('应该能发送通知消息', async () => {
      const result = await plugin.outbound.sendNotification({
        id: 'test-1',
        title: '测试通知',
        content: '这是一条测试通知',
        type: 'info',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('EventBridge 集成', () => {
    it('应该订阅任务完成事件', async () => {
      if (plugin.setup) {
        await plugin.setup.initialize();
      }

      // 模拟任务完成
      eventBridge.notifyTaskComplete('task-123', {
        taskName: '测试任务',
        result: 'success',
      });

      // 验证消息被广播（通过 mock 验证）
      // 实际测试中需要检查 WebSocket 的 send 方法是否被调用
    });
  });
});
