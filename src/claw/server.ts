import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

export interface ClawServerConfig {
  port: number;
  host: string;
}

export class ClawServer {
  private server: FastifyInstance;
  private config: ClawServerConfig;

  constructor(config: ClawServerConfig) {
    this.config = config;
    this.server = Fastify({ logger: true });
  }

  async start(): Promise<void> {
    await this.server.listen({
      port: this.config.port,
      host: this.config.host
    });
  }

  async stop(): Promise<void> {
    await this.server.close();
  }

  getServer(): FastifyInstance {
    return this.server;
  }
}
