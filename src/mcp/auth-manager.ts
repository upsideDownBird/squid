import { SecureStorage } from '../models/secure-storage';

export interface ConnectorCredentials {
  [key: string]: string;
}

export class ConnectorAuthManager {
  private storage: SecureStorage;
  private readonly PASSWORD = 'default-password';

  constructor() {
    this.storage = new SecureStorage();
  }

  async saveCredentials(connectorName: string, credentials: ConnectorCredentials): Promise<void> {
    const keys = await this.loadAllKeys();
    const key = `mcp:${connectorName}`;
    keys[key] = JSON.stringify(credentials);
    await this.storage.saveApiKeys(keys, this.PASSWORD);
  }

  async getCredentials(connectorName: string): Promise<ConnectorCredentials | null> {
    const keys = await this.loadAllKeys();
    const key = `mcp:${connectorName}`;
    const data = keys[key];
    return data ? JSON.parse(data) : null;
  }

  async deleteCredentials(connectorName: string): Promise<void> {
    const keys = await this.loadAllKeys();
    const key = `mcp:${connectorName}`;
    delete keys[key];
    await this.storage.saveApiKeys(keys, this.PASSWORD);
  }

  async hasCredentials(connectorName: string): Promise<boolean> {
    const credentials = await this.getCredentials(connectorName);
    return credentials !== null;
  }

  private async loadAllKeys(): Promise<Record<string, string>> {
    try {
      return await this.storage.loadApiKeys(this.PASSWORD);
    } catch (error) {
      return {};
    }
  }
}
