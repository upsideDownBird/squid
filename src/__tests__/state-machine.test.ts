import { describe, it, expect, beforeEach } from 'vitest';
import { TaskStateMachine } from '../tasks/state-machine';

describe('TaskStateMachine', () => {
  let stateMachine: TaskStateMachine;

  beforeEach(() => {
    stateMachine = new TaskStateMachine('ask');
  });

  it('should initialize with ask mode', () => {
    expect(stateMachine.getCurrentMode()).toBe('ask');
  });

  it('should transition from ask to craft', () => {
    stateMachine.transition('craft');
    expect(stateMachine.getCurrentMode()).toBe('craft');
  });

  it('should transition from ask to plan', () => {
    stateMachine.transition('plan');
    expect(stateMachine.getCurrentMode()).toBe('plan');
  });

  it('should transition from craft to ask', () => {
    stateMachine.transition('craft');
    stateMachine.transition('ask');
    expect(stateMachine.getCurrentMode()).toBe('ask');
  });

  it('should throw error on invalid transition', () => {
    expect(() => stateMachine.transition('invalid' as any)).toThrow();
  });
});
