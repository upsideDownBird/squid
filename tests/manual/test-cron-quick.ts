/**
 * 定时任务快速测试
 * 创建一个立即执行的任务，验证执行流程
 */

import { cronManager } from './src/tools/cron-manager';

let executionCount = 0;

// 模拟任务执行器
cronManager.setTaskExecutor(async (prompt: string, taskId: string) => {
  console.log(`\n[测试执行器] 收到任务 ${taskId}`);
  console.log(`[测试执行器] Prompt: ${prompt}`);

  // 模拟执行
  await new Promise(resolve => setTimeout(resolve, 500));

  const result = `已执行: ${prompt}`;
  console.log(`[测试执行器] 结果: ${result}\n`);

  executionCount++;

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

// 创建一个每秒执行的测试任务
console.log('创建测试定时任务（每秒执行）...');
const result = cronManager.createTask('* * * * * *', '列出当前目录的文件');

if (result.success) {
  console.log(`✅ 任务创建成功: ${result.taskId}`);
  console.log('等待任务触发...\n');

  // 等待 3 秒后退出
  setTimeout(() => {
    console.log(`\n测试完成，共执行 ${executionCount} 次`);
    cronManager.clear();
    process.exit(0);
  }, 3500);
} else {
  console.error(`❌ 任务创建失败: ${result.error}`);
  process.exit(1);
}
