import { describe, it, expect } from 'vitest';
import { TaskStateMachine } from '../tasks/state-machine';
import { WorkspaceSandbox } from '../workspace/sandbox';

describe('TaskStateMachine', () => {
  it('should transition from ask to craft', () => {
    const sm = new TaskStateMachine('ask');
    sm.transition('craft');
    expect(sm.getCurrentMode()).toBe('craft');
  });

  it('should throw on invalid transition', () => {
    const sm = new TaskStateMachine('ask');
    expect(() => sm.transition('invalid' as any)).toThrow();
  });
});

describe('WorkspaceSandbox', () => {
  it('should validate path within workspace', async () => {
    const sandbox = new WorkspaceSandbox('/workspace');
    await expect(sandbox.validatePath('/workspace/file.txt')).resolves.toBeUndefined();
  });

  it('should reject path outside workspace', async () => {
    const sandbox = new WorkspaceSandbox('/workspace');
    await expect(sandbox.validatePath('/etc/passwd')).rejects.toThrow();
  });

  it('should reject path traversal', async () => {
    const sandbox = new WorkspaceSandbox('/workspace');
    await expect(sandbox.validatePath('/workspace/../etc/passwd')).rejects.toThrow();
  });
});
