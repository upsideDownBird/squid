// 测试 EventBridge 通知
import { eventBridge } from './src/channels/bridge/event-bridge';

console.log('测试 EventBridge...');

// 模拟任务完成
eventBridge.notifyTaskComplete('test-task-123', {
  taskName: '测试任务',
  result: '测试成功',
  duration: 1000,
  status: 'success',
});

console.log('已发送测试通知');

// 等待 2 秒后退出
setTimeout(() => {
  console.log('测试完成');
  process.exit(0);
}, 2000);
