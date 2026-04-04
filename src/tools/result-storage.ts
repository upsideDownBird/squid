import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

export class ResultStorage {
  private storageDir: string;

  constructor() {
    this.storageDir = join(homedir(), '.jobopx', 'results');
  }

  async init() {
    await mkdir(this.storageDir, { recursive: true });
  }

  async persist(data: string, maxSize: number): Promise<{ stored: boolean; path?: string; preview?: string }> {
    if (data.length <= maxSize) {
      return { stored: false };
    }

    const id = randomUUID();
    const path = join(this.storageDir, `${id}.txt`);
    await writeFile(path, data, 'utf-8');

    const preview = data.slice(0, 1000) + `\n\n... (${data.length} chars total, saved to ${path})`;

    return { stored: true, path, preview };
  }
}
