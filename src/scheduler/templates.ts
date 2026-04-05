import type { ScheduledTask } from './types';
import { randomUUID } from 'crypto';

export const taskTemplates: Omit<ScheduledTask, 'id' | 'createdAt'>[] = [
  {
    name: '每日 AI 新闻摘要',
    workDir: '~/.squid/scheduler/ai-news',
    prompt: '请搜索并总结今天最重要的 AI 行业新闻，包括技术突破、产品发布、行业动态等。以简洁的要点形式呈现。',
    model: 'claude-sonnet-4',
    cron: '0 9 * * *',
    enabled: false
  },
  {
    name: '周报生成',
    workDir: '~/.squid/scheduler/weekly-report',
    prompt: '基于本周的工作记录，生成一份周报，包括：1) 本周完成的主要工作 2) 遇到的问题和解决方案 3) 下周计划',
    model: 'claude-sonnet-4',
    cron: '0 17 * * 5',
    enabled: false
  },
  {
    name: '代码仓库健康检查',
    workDir: '~/.squid/scheduler/repo-health',
    prompt: '检查代码仓库的健康状况：1) 未关闭的 issue 数量 2) 待审核的 PR 3) 代码覆盖率 4) 依赖更新情况',
    model: 'claude-sonnet-4',
    cron: '0 10 * * 1',
    enabled: false
  },
  {
    name: '每日任务提醒',
    workDir: '~/.squid/scheduler/daily-tasks',
    prompt: '根据日历和待办事项，生成今日任务清单，按优先级排序，并提供时间分配建议。',
    model: 'claude-sonnet-4',
    cron: '0 8 * * *',
    enabled: false
  }
];

export function createTaskFromTemplate(templateIndex: number): ScheduledTask {
  const template = taskTemplates[templateIndex];
  return {
    ...template,
    id: randomUUID(),
    createdAt: new Date()
  };
}
