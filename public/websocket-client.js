/**
 * WebSocket 客户端 - 连接到 WebUI Channel 插件
 */
class WebSocketClient {
  constructor(url = 'ws://localhost:8080') {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // 初始重连延迟 1 秒
    this.heartbeatInterval = 30000; // 30 秒
    this.heartbeatTimer = null;
    this.messageHandlers = new Map();
    this.isConnecting = false;
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log('[WebSocket] 正在连接到', this.url);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();
        this.notifyConnectionStatus(true);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] 连接关闭');
        this.isConnecting = false;
        this.stopHeartbeat();
        this.notifyConnectionStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.maxReconnectAttempts = 0; // 禁止自动重连
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
      return true;
    } else {
      console.warn('[WebSocket] 连接未就绪，无法发送消息');
      return false;
    }
  }

  /**
   * 发送命令到引擎
   */
  sendCommand(command, args) {
    return this.send('command', { command, args });
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      // 处理心跳
      if (message.type === 'ping') {
        this.send('pong');
        return;
      }

      // 触发对应类型的处理器
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error('[WebSocket] 消息处理器错误:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] 解析消息失败:', error);
    }
  }

  /**
   * 注册消息处理器
   */
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);
  }

  /**
   * 移除消息处理器
   */
  off(type, handler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] 达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`[WebSocket] ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 通知连接状态变化
   */
  notifyConnectionStatus(connected) {
    const handlers = this.messageHandlers.get('connection');
    if (handlers) {
      handlers.forEach(handler => handler({ connected }));
    }
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// 创建全局实例
window.wsClient = new WebSocketClient();

// 页面加载时自动连接
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.wsClient.connect();
  });
} else {
  window.wsClient.connect();
}
