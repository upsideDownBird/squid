import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class SecureStorage {
  private configDir: string;
  private configFile: string;
  private algorithm = 'aes-256-gcm';

  constructor() {
    this.configDir = join(homedir(), '.squid');
    this.configFile = join(this.configDir, 'config.enc');
  }

  async init() {
    await mkdir(this.configDir, { recursive: true });
  }

  async saveApiKeys(keys: Record<string, string>, password: string) {
    const salt = randomBytes(16);
    const key = scryptSync(password, salt, 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(keys), 'utf8'),
      cipher.final()
    ]);

    const authTag = (cipher as any).getAuthTag();
    const data = Buffer.concat([salt, iv, authTag, encrypted]);

    await writeFile(this.configFile, data);
  }

  async loadApiKeys(password: string): Promise<Record<string, string>> {
    const data = await readFile(this.configFile);

    const salt = data.subarray(0, 16);
    const iv = data.subarray(16, 32);
    const authTag = data.subarray(32, 48);
    const encrypted = data.subarray(48);

    const key = scryptSync(password, salt, 32);
    const decipher = createDecipheriv(this.algorithm, key, iv);
    (decipher as any).setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}
