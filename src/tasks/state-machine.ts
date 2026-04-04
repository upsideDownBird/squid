import type { Task } from './types';

export type TaskMode = 'ask' | 'craft' | 'plan';

export class TaskStateMachine {
  private currentMode: TaskMode;

  constructor(initialMode: TaskMode) {
    this.currentMode = initialMode;
  }

  getCurrentMode(): TaskMode {
    return this.currentMode;
  }

  canTransition(to: TaskMode): boolean {
    const transitions: Record<TaskMode, TaskMode[]> = {
      ask: ['craft', 'plan'],
      craft: ['ask', 'plan'],
      plan: ['ask', 'craft']
    };
    return transitions[this.currentMode].includes(to);
  }

  transition(to: TaskMode): void {
    if (!this.canTransition(to)) {
      throw new Error(`Cannot transition from ${this.currentMode} to ${to}`);
    }
    this.currentMode = to;
  }
}
