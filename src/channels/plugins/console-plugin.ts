// Console Channel Plugin - 控制台通知插件
import type {
  ChannelPlugin,
  ChannelMeta,
  ChannelCapabilities,
  ChannelConfigAdapter,
  ChannelOutboundAdapter,
  ChannelStatusAdapter,
  NotificationMessage,
  NotificationResult
} from '../types';

/**
 * 控制台通知插件
 *
 * 简单的控制台输出，用于调试
 */
export class ConsoleChannelPlugin implements ChannelPlugin {
  id = 'console';

  meta: ChannelMeta = {
    name: '控制台',
    description: '在控制台输出通知（调试用）',
    category: 'builtin'
  };

  capabilities: ChannelCapabilities = {
    outbound: {
      text: true,
      media: false,
      rich: false,
      streaming: false
    },
    inbound: {
      text: false,
      commands: false,
      interactive: false
    }
  };

  config: ChannelConfigAdapter = {
    get: () => undefined,
    set: () => {},
    getAll: () => ({}),
    validate: () => true
  };

  outbound: ChannelOutboundAdapter = {
    sendText: async (params) => {
      console.log(`[Console] ${params.title || 'Notification'}: ${params.content}`);
      return { success: true };
    },

    sendNotification: async (message: NotificationMessage) => {
      const icon = this.getTypeIcon(message.type);
      const timestamp = message.timestamp.toLocaleString();

      console.log(`\n${icon} [${message.type.toUpperCase()}] ${message.title}`);
      console.log(`   ${message.content}`);
      console.log(`   Time: ${timestamp}`);

      if (message.metadata) {
        console.log(`   Metadata:`, message.metadata);
      }

      return { success: true };
    }
  };

  status: ChannelStatusAdapter = {
    check: async () => {
      return {
        healthy: true,
        message: 'Console channel is always available'
      };
    }
  };

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }
}
