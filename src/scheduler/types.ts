import { z } from 'zod';

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  workDir: z.string(),
  prompt: z.string(),
  model: z.string().optional(),
  cron: z.string(),
  enabled: z.boolean(),
  createdAt: z.date(),
  lastRun: z.date().optional(),
  nextRun: z.date().optional()
});

export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;

export interface TaskExecutionRecord {
  taskId: string;
  executedAt: Date;
  status: 'success' | 'failed';
  result?: string;
  error?: string;
}
