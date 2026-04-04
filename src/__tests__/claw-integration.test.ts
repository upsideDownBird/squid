import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ClawServer } from '../claw/server';
import { ClawTaskHandler } from '../claw/task-handler';

describe('Claw Server Integration', () => {
  let server: ClawServer;
  let handler: ClawTaskHandler;
  const port = 3001;

  beforeAll(async () => {
    server = new ClawServer({ port, host: 'localhost' });
    handler = new ClawTaskHandler();
    handler.registerRoutes(server.getServer());
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should create task via POST /task', async () => {
    const response = await fetch(`http://localhost:${port}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test task' })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.taskId).toBeDefined();
  });

  it('should get task status via GET /task/:id', async () => {
    const createRes = await fetch(`http://localhost:${port}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test task' })
    });
    const { taskId } = await createRes.json();

    const getRes = await fetch(`http://localhost:${port}/task/${taskId}`);
    expect(getRes.status).toBe(200);
    const task = await getRes.json();
    expect(task.id).toBe(taskId);
    expect(task.prompt).toBe('test task');
  });

  it('should return 404 for non-existent task', async () => {
    const response = await fetch(`http://localhost:${port}/task/non-existent-id`);
    expect(response.status).toBe(404);
  });
});
