import { ChannelRegistry } from './registry';
import { WebUIChannelPlugin } from './plugins/webui/plugin';

/**
 * 全局 Channel Registry 实例
 */
export const channelRegistry = new ChannelRegistry();

/**
 * 初始化内置 channel 插件
 */
export async function initializeBuiltinChannels(): Promise<void> {
  // 注册 WebUI Channel
  const webuiPlugin = new WebUIChannelPlugin();
  channelRegistry.register(webuiPlugin);

  // 初始化插件
  if (webuiPlugin.setup) {
    await webuiPlugin.setup.initialize();
  }

  console.log('[Channels] 内置 channel 插件初始化完成');
}

/**
 * 清理所有 channel 插件
 */
export async function cleanupChannels(): Promise<void> {
  const plugins = channelRegistry.list();

  for (const plugin of plugins) {
    if (plugin.setup) {
      await plugin.setup.cleanup();
    }
  }

  channelRegistry.clear();
  console.log('[Channels] 所有 channel 插件已清理');
}
