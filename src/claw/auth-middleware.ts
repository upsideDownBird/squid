import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';

export class ClawAuthMiddleware {
  private tokenHash: string;

  constructor(token: string) {
    this.tokenHash = this.hashToken(token);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const providedHash = this.hashToken(token);

    if (providedHash !== this.tokenHash) {
      reply.code(403).send({ error: 'Invalid token' });
      return;
    }
  }
}
