/**
 * 测试定时任务是否正常工作
 * 创建一个立即执行的任务
 */

import { cronManager } from './src/tools/cron-manager';

console.log('=== 定时任务测试 ===\n');

// 设置任务执行器
cronManager.setTaskExecutor(async (prompt: string, taskId: string) => {
  console.log(`\n✅ 任务执行器被调用！`);
  console.log(`   任务ID: ${taskId}`);
  console.log(`   Prompt: ${prompt}\n`);

  return {
    success: true,
    result: `测试成功: ${prompt}`,
  };
});

// 设置通知回调
cronManager.setNotificationCallback((taskId: string, content: string) => {
  console.log(`\n📢 通知回调被调用！`);
  console.log(`   任务ID: ${taskId}`);
  console.log(`   内容: ${content}\n`);
});

// 创建一个每秒执行的任务
console.log('创建测试任务（每秒执行）...');
const result = cronManager.createTask('* * * * * *', '这是一个测试任务');

if (result.success) {
  console.log(`✅ 任务创建成功: ${result.taskId}\n`);
  console.log('等待任务触发...\n');

  // 5秒后退出
  setTimeout(() => {
    console.log('\n测试完成，清理任务...');
    cronManager.clear();
    process.exit(0);
  }, 5000);
} else {
  console.error(`❌ 任务创建失败: ${result.error}`);
  process.exit(1);
}
