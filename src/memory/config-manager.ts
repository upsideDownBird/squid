// Configuration management for memory extraction
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { ExtractionConfig } from './types';

const DEFAULT_CONFIG: ExtractionConfig = {
  enabled: true,
  triggerAfterTurns: 5,
  triggerOnEnd: true,
  cooldownMinutes: 5
};

export class ConfigManager {
  private configPath: string;
  private config: ExtractionConfig;

  constructor() {
    const configDir = join(homedir(), '.jobopx');
    this.configPath = join(configDir, 'extraction-config.json');
    this.config = { ...DEFAULT_CONFIG };
  }

  async init(): Promise<void> {
    try {
      const configDir = join(homedir(), '.jobopx');
      await mkdir(configDir, { recursive: true });
      await this.load();
    } catch (error) {
      // Use default config if load fails
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  // Load config from disk
  async load(): Promise<ExtractionConfig> {
    try {
      const content = await readFile(this.configPath, 'utf-8');
      const loaded = JSON.parse(content);
      this.config = this.validate(loaded);
      return this.config;
    } catch (error) {
      // File doesn't exist, use defaults
      this.config = { ...DEFAULT_CONFIG };
      return this.config;
    }
  }

  // Save config to disk
  async save(config: Partial<ExtractionConfig>): Promise<ExtractionConfig> {
    this.config = this.validate({ ...this.config, ...config });

    try {
      await writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save extraction config:', error);
    }

    return this.config;
  }

  // Get current config
  get(): ExtractionConfig {
    return { ...this.config };
  }

  // Validate config values
  private validate(config: Partial<ExtractionConfig>): ExtractionConfig {
    return {
      enabled: typeof config.enabled === 'boolean' ? config.enabled : DEFAULT_CONFIG.enabled,
      triggerAfterTurns: this.validateNumber(config.triggerAfterTurns, 1, 20, DEFAULT_CONFIG.triggerAfterTurns),
      triggerOnEnd: typeof config.triggerOnEnd === 'boolean' ? config.triggerOnEnd : DEFAULT_CONFIG.triggerOnEnd,
      cooldownMinutes: this.validateNumber(config.cooldownMinutes, 0, 60, DEFAULT_CONFIG.cooldownMinutes)
    };
  }

  private validateNumber(value: any, min: number, max: number, defaultValue: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }
}
