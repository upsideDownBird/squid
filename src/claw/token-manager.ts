import { randomBytes } from 'crypto';
import { SecureStorage } from '../models/secure-storage';

export class ClawTokenManager {
  private storage: SecureStorage;
  private readonly TOKEN_KEY = 'claw_api_token';
  private readonly PASSWORD = 'default-password';

  constructor() {
    this.storage = new SecureStorage();
  }

  async generateToken(): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.saveToken(token);
    return token;
  }

  async saveToken(token: string): Promise<void> {
    const keys = await this.loadAllKeys();
    keys[this.TOKEN_KEY] = token;
    await this.storage.saveApiKeys(keys, this.PASSWORD);
  }

  async getToken(): Promise<string | null> {
    const keys = await this.loadAllKeys();
    return keys[this.TOKEN_KEY] || null;
  }

  async revokeToken(): Promise<void> {
    const keys = await this.loadAllKeys();
    delete keys[this.TOKEN_KEY];
    await this.storage.saveApiKeys(keys, this.PASSWORD);
  }

  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  private async loadAllKeys(): Promise<Record<string, string>> {
    try {
      return await this.storage.loadApiKeys(this.PASSWORD);
    } catch (error) {
      return {};
    }
  }
}
