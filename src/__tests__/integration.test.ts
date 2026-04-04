import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ReadFileTool } from '../tools/read-file';
import type { ToolContext } from '../tools/base';

describe('Tool Integration', () => {
  const context: ToolContext = {
    workDir: '/tmp/test',
    taskId: 'test-task',
    mode: 'ask'
  };

  it('should have correct tool structure', () => {
    expect(ReadFileTool.name).toBe('read_file');
    expect(ReadFileTool.inputSchema).toBeDefined();
    expect(typeof ReadFileTool.call).toBe('function');
  });
});
