// Channel Registry - 管理所有渠道插件
import type { ChannelPlugin, ChannelCapabilities } from './types';

/**
 * 渠道注册表
 *
 * 负责管理所有渠道插件的注册、查询和生命周期
 */
export class ChannelRegistry {
  private channels: Map<string, ChannelPlugin> = new Map();

  /**
   * 注册渠道插件
   */
  register(plugin: ChannelPlugin): void {
    if (this.channels.has(plugin.id)) {
      throw new Error(`Channel plugin with id "${plugin.id}" is already registered`);
    }
    this.channels.set(plugin.id, plugin);
    console.log(`[ChannelRegistry] Registered channel: ${plugin.id} (${plugin.meta.name})`);
  }

  /**
   * 注销渠道插件
   */
  unregister(channelId: string): boolean {
    const deleted = this.channels.delete(channelId);
    if (deleted) {
      console.log(`[ChannelRegistry] Unregistered channel: ${channelId}`);
    }
    return deleted;
  }

  /**
   * 获取渠道插件
   */
  get(channelId: string): ChannelPlugin | undefined {
    return this.channels.get(channelId);
  }

  /**
   * 列出所有渠道插件
   */
  list(): ChannelPlugin[] {
    return Array.from(this.channels.values());
  }

  /**
   * 按能力查询渠道
   *
   * @example
   * // 查找所有支持文本输出的渠道
   * registry.listByCapability('outbound', 'text')
   */
  listByCapability(
    type: 'outbound' | 'inbound',
    capability: string
  ): ChannelPlugin[] {
    return this.list().filter(plugin => {
      const caps = plugin.capabilities[type] as any;
      return caps && caps[capability] === true;
    });
  }

  /**
   * 检查渠道是否已注册
   */
  has(channelId: string): boolean {
    return this.channels.has(channelId);
  }

  /**
   * 获取已注册渠道数量
   */
  get size(): number {
    return this.channels.size;
  }

  /**
   * 清空所有渠道
   */
  clear(): void {
    this.channels.clear();
    console.log('[ChannelRegistry] Cleared all channels');
  }
}
