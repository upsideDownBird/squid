// Notification Manager - 通知路由层
import type { ChannelPlugin, NotificationMessage, NotificationResult } from '../channels/types';
import type { ChannelRegistry } from '../channels/registry';

/**
 * 通知选项
 */
export interface NotifyOptions {
  channels?: string[];  // 指定渠道 ID，不指定则广播到所有启用的渠道
  filter?: (plugin: ChannelPlugin) => boolean;  // 自定义过滤器
}

/**
 * 通知管理器
 *
 * 负责将通知路由到多个渠道
 */
export class NotificationManager {
  constructor(private registry: ChannelRegistry) {}

  /**
   * 发送通知
   *
   * @param message 通知消息
   * @param options 通知选项
   * @returns 每个渠道的发送结果
   */
  async notify(
    message: NotificationMessage,
    options?: NotifyOptions
  ): Promise<NotificationResult[]> {
    const channels = this.selectChannels(options);

    if (channels.length === 0) {
      console.warn('[NotificationManager] No channels available for notification');
      return [];
    }

    console.log(`[NotificationManager] Sending notification to ${channels.length} channel(s): ${message.title}`);

    // 并发发送到所有渠道
    const results = await Promise.allSettled(
      channels.map(async (plugin) => {
        try {
          const result = await plugin.outbound.sendNotification(message);
          return {
            channelId: plugin.id,
            ...result
          };
        } catch (error) {
          console.error(`[NotificationManager] Error sending to ${plugin.id}:`, error);
          return {
            channelId: plugin.id,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    // 转换结果
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          channelId: channels[index].id,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });
  }

  /**
   * 选择要发送的渠道
   */
  private selectChannels(options?: NotifyOptions): ChannelPlugin[] {
    let channels = this.registry.list();

    // 按 ID 过滤
    if (options?.channels && options.channels.length > 0) {
      channels = channels.filter(plugin => options.channels!.includes(plugin.id));
    }

    // 自定义过滤器
    if (options?.filter) {
      channels = channels.filter(options.filter);
    }

    return channels;
  }
}
