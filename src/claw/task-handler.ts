import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const CreateTaskSchema = z.object({
  prompt: z.string(),
  model: z.string().optional(),
  workDir: z.string().optional()
});

export interface ClawTask {
  id: string;
  prompt: string;
  model?: string;
  workDir?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  result?: string;
  error?: string;
}

export class ClawTaskHandler {
  private tasks: Map<string, ClawTask> = new Map();

  registerRoutes(server: FastifyInstance): void {
    server.post('/task', async (request: FastifyRequest, reply: FastifyReply) => {
      const body = CreateTaskSchema.parse(request.body);

      const task: ClawTask = {
        id: randomUUID(),
        prompt: body.prompt,
        model: body.model,
        workDir: body.workDir,
        status: 'pending',
        createdAt: new Date()
      };

      this.tasks.set(task.id, task);

      reply.code(201).send({ taskId: task.id });
    });

    server.get('/task/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const task = this.tasks.get(request.params.id);

      if (!task) {
        reply.code(404).send({ error: 'Task not found' });
        return;
      }

      reply.send(task);
    });
  }

  getTask(id: string): ClawTask | undefined {
    return this.tasks.get(id);
  }

  updateTask(id: string, updates: Partial<ClawTask>): void {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
    }
  }
}
