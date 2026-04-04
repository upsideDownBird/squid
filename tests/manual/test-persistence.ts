import { ReadFileTool } from './src/tools/read-file';
import { processToolResultBlock } from './src/tools/tool-result-storage';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function testPersistence() {
  console.log('🧪 测试工具结果持久化系统\n');

  // 1. 创建一个大文件用于测试
  const testDir = './test-data';
  const testFile = join(testDir, 'large-file.txt');

  try {
    await mkdir(testDir, { recursive: true });

    // 生成 60KB 的内容（超过 50K 阈值）
    const largeContent = 'x'.repeat(60000);
    await writeFile(testFile, largeContent, 'utf-8');
    console.log('✅ 创建测试文件: large-file.txt (60KB)\n');

    // 2. 调用 ReadFileTool
    console.log('📖 调用 ReadFileTool 读取大文件...');
    const result = await ReadFileTool.call(
      { file_path: 'test-data/large-file.txt' },
      {
        workDir: process.cwd(),
        taskId: 'test-task',
        mode: 'ask'
      }
    );

    if (result.error) {
      console.error('❌ 读取失败:', result.error);
      return;
    }

    console.log(`✅ 读取成功，内容大小: ${result.data.length} 字符\n`);

    // 3. 测试映射方法
    console.log('🔄 测试映射方法...');
    const mapped = ReadFileTool.mapToolResultToToolResultBlockParam(
      result.data,
      'test-tool-use-id'
    );
    console.log('✅ 映射成功');
    console.log(`   - type: ${mapped.type}`);
    console.log(`   - tool_use_id: ${mapped.tool_use_id}`);
    console.log(`   - content length: ${typeof mapped.content === 'string' ? mapped.content.length : 'N/A'}\n`);

    // 4. 测试持久化
    console.log('💾 测试持久化处理...');
    const sessionId = 'test-session-' + Date.now();
    const processed = await processToolResultBlock(
      ReadFileTool,
      result.data,
      'test-tool-use-id',
      sessionId
    );

    console.log('✅ 持久化处理完成');

    if (typeof processed.content === 'string' && processed.content.includes('<persisted-output>')) {
      console.log('✅ 结果已持久化到磁盘');
      console.log('\n预览消息:');
      console.log('---');
      console.log(processed.content.substring(0, 500) + '...');
      console.log('---\n');
    } else {
      console.log('⚠️  结果未持久化（可能未超过阈值）');
    }

    // 5. 测试小文件（不应该持久化）
    console.log('\n📖 测试小文件（不应该持久化）...');
    const smallFile = join(testDir, 'small-file.txt');
    const smallContent = 'Hello World!';
    await writeFile(smallFile, smallContent, 'utf-8');

    const smallResult = await ReadFileTool.call(
      { file_path: 'test-data/small-file.txt' },
      {
        workDir: process.cwd(),
        taskId: 'test-task-2',
        mode: 'ask'
      }
    );

    const processedSmall = await processToolResultBlock(
      ReadFileTool,
      smallResult.data,
      'test-tool-use-id-2',
      sessionId
    );

    if (typeof processedSmall.content === 'string' && !processedSmall.content.includes('<persisted-output>')) {
      console.log('✅ 小文件未持久化（符合预期）');
      console.log(`   内容: ${processedSmall.content}`);
    } else {
      console.log('⚠️  小文件被持久化了（不符合预期）');
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testPersistence();
