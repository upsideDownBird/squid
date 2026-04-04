import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WorkspaceManager } from '../workspace/manager';
import { ReadFileTool } from '../tools/read-file';
import { WriteFileTool } from '../tools/write-file';
import { GlobTool } from '../tools/glob';
import { GrepTool } from '../tools/grep';
import type { ToolContext } from '../tools/base';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

describe('End-to-End Workflow', () => {
  let workspaceManager: WorkspaceManager;
  let workDir: string;
  let context: ToolContext;

  beforeAll(async () => {
    workspaceManager = new WorkspaceManager();
    workDir = await workspaceManager.bindWorkDir('e2e-test');
    context = {
      workDir,
      taskId: 'e2e-test',
      mode: 'craft'
    };
  });

  afterAll(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('should complete full file workflow', async () => {
    // 1. Write a file
    const writeResult = await WriteFileTool.call({
      file_path: 'test.txt',
      content: 'Hello World\nLine 2\nLine 3'
    }, context);
    expect(writeResult.data).toBeDefined();

    // 2. Read the file back
    const readResult = await ReadFileTool.call({
      file_path: 'test.txt'
    }, context);
    expect(readResult.data).toContain('Hello World');

    // 3. Search for files
    const globResult = await GlobTool.call({
      pattern: '*.txt'
    }, context);
    expect(globResult.data).toContain('test.txt');

    // 4. Search file content
    const grepResult = await GrepTool.call({
      pattern: 'Hello',
      path: workDir
    }, context);
    expect(grepResult.data.length).toBeGreaterThan(0);
    if (grepResult.data.length > 0) {
      expect(grepResult.data[0].content).toContain('Hello');
    }
  });

  it('should handle multiple files', async () => {
    // Create multiple files
    await WriteFileTool.call({
      file_path: 'file1.js',
      content: 'console.log("file1");'
    }, context);

    await WriteFileTool.call({
      file_path: 'file2.js',
      content: 'console.log("file2");'
    }, context);

    // Find all JS files
    const result = await GlobTool.call({
      pattern: '*.js'
    }, context);

    expect(result.data).toContain('file1.js');
    expect(result.data).toContain('file2.js');
  });

  it('should search across multiple files', async () => {
    await WriteFileTool.call({
      file_path: 'search1.txt',
      content: 'The quick brown fox'
    }, context);

    await WriteFileTool.call({
      file_path: 'search2.txt',
      content: 'The lazy dog'
    }, context);

    // Give filesystem time to sync
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await GrepTool.call({
      pattern: 'The',
      path: workDir
    }, context);

    // Should find at least the files we just created
    expect(result.data.length).toBeGreaterThan(0);
  });
});
