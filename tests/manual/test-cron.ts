/**
 * 定时任务测试脚本
 * 测试定时任务是否能正确执行 prompt
 */

import { cronManager } from './src/tools/cron-manager';

// 模拟任务执行器
cronManager.setTaskExecutor(async (prompt: string, taskId: string) => {
  console.log(`\n[测试执行器] 收到任务 ${taskId}`);
  console.log(`[测试执行器] Prompt: ${prompt}`);

  // 模拟执行
  await new Promise(resolve => setTimeout(resolve, 1000));

  const result = `已执行: ${prompt}`;
  console.log(`[测试执行器] 结果: ${result}\n`);

  return {
    success: true,
    result: result,
  };
});

// 设置通知回调
cronManager.setNotificationCallback((taskId: string, content: string) => {
  console.log(`\n✅ [通知] 任务 ${taskId} 完成`);
  console.log(`   内容: ${content}\n`);
});

// 创建一个每 10 秒执行的测试任务
console.log('创建测试定时任务...');
const result = cronManager.createTask('*/10 * * * * *', '列出当前目录的文件');

if (result.success) {
  console.log(`✅ 任务创建成功: ${result.taskId}`);
  console.log('等待任务触发（每 10 秒执行一次）...');
  console.log('按 Ctrl+C 退出\n');
} else {
  console.error(`❌ 任务创建失败: ${result.error}`);
  process.exit(1);
}

// 保持进程运行
process.on('SIGINT', () => {
  console.log('\n清理任务...');
  cronManager.clear();
  console.log('退出');
  process.exit(0);
});
