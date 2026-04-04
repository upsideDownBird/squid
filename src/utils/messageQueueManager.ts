/**
 * 消息队列管理器
 * 用于管理定时任务和其他异步任务的执行队列
 */

export type QueuePriority = 'now' | 'next' | 'later';

export interface QueuedCommand {
  value: string;
  priority?: QueuePriority;
  isMeta?: boolean;
  source?: string;
  taskId?: string;
}

// 优先级顺序
const PRIORITY_ORDER: Record<QueuePriority, number> = {
  now: 0,
  next: 1,
  later: 2,
};

// 模块级别的命令队列
const commandQueue: QueuedCommand[] = [];

// 订阅者列表
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * 通知所有订阅者队列已变化
 */
function notifySubscribers(): void {
  subscribers.forEach(callback => callback());
}

/**
 * 订阅队列变化
 */
export function subscribeToCommandQueue(callback: Subscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * 获取队列快照
 */
export function getCommandQueueSnapshot(): readonly QueuedCommand[] {
  return [...commandQueue];
}

/**
 * 获取队列长度
 */
export function getCommandQueueLength(): number {
  return commandQueue.length;
}

/**
 * 检查队列是否有命令
 */
export function hasCommandsInQueue(): boolean {
  return commandQueue.length > 0;
}

/**
 * 添加命令到队列
 */
export function enqueue(command: QueuedCommand): void {
  commandQueue.push({ ...command, priority: command.priority ?? 'next' });
  notifySubscribers();
}

/**
 * 添加待处理通知到队列（默认优先级为 later）
 * 用于定时任务等系统生成的消息
 */
export function enqueuePendingNotification(command: QueuedCommand): void {
  commandQueue.push({ ...command, priority: command.priority ?? 'later' });
  notifySubscribers();
}

/**
 * 从队列中取出最高优先级的命令
 * 相同优先级按 FIFO 顺序
 */
export function dequeue(): QueuedCommand | undefined {
  if (commandQueue.length === 0) {
    return undefined;
  }

  // 找到最高优先级的命令
  let highestPriorityIndex = 0;
  let highestPriority = PRIORITY_ORDER[commandQueue[0].priority ?? 'next'];

  for (let i = 1; i < commandQueue.length; i++) {
    const priority = PRIORITY_ORDER[commandQueue[i].priority ?? 'next'];
    if (priority < highestPriority) {
      highestPriority = priority;
      highestPriorityIndex = i;
    }
  }

  const command = commandQueue.splice(highestPriorityIndex, 1)[0];
  notifySubscribers();
  return command;
}

/**
 * 清空队列
 */
export function clearCommandQueue(): void {
  commandQueue.length = 0;
  notifySubscribers();
}

/**
 * 重置队列（清空并通知）
 */
export function resetCommandQueue(): void {
  clearCommandQueue();
}

/**
 * 触发重新检查队列
 */
export function recheckCommandQueue(): void {
  if (commandQueue.length > 0) {
    notifySubscribers();
  }
}
