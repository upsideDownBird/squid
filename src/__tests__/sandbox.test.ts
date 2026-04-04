import { describe, it, expect } from 'vitest';
import { WorkspaceSandbox } from '../workspace/sandbox';

describe('WorkspaceSandbox', () => {
  const workspaceRoot = '/test/workspace';
  let sandbox: WorkspaceSandbox;

  beforeEach(() => {
    sandbox = new WorkspaceSandbox(workspaceRoot);
  });

  it('should allow path within workspace', async () => {
    await expect(sandbox.validatePath('/test/workspace/file.txt')).resolves.toBeUndefined();
  });

  it('should allow nested path within workspace', async () => {
    await expect(sandbox.validatePath('/test/workspace/subdir/file.txt')).resolves.toBeUndefined();
  });

  it('should reject path outside workspace', async () => {
    await expect(sandbox.validatePath('/etc/passwd')).rejects.toThrow('outside workspace');
  });

  it('should reject path traversal with ..', async () => {
    await expect(sandbox.validatePath('/test/workspace/../etc/passwd')).rejects.toThrow('outside workspace');
  });

  it('should reject absolute path outside workspace', async () => {
    await expect(sandbox.validatePath('/tmp/file.txt')).rejects.toThrow('outside workspace');
  });
});
