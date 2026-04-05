// Automatic memory management - cleanup low-value memories
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { MemoryManager } from './manager';
import type { Memory } from './types';

const CLEANUP_THRESHOLD = 180; // Trigger cleanup at 180 memories
const CLEANUP_TARGET = 160; // Clean down to 160 memories
const PROTECTION_DAYS = 30; // Don't clean memories younger than 30 days

interface CleanupLogEntry {
  timestamp: string;
  removedCount: number;
  memories: Array<{
    id: string;
    name: string;
    score: number;
  }>;
}

export class AutoMemoryManager {
  private memoryManager: MemoryManager;
  private logPath: string;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
    const configDir = join(homedir(), '.squid');
    this.logPath = join(configDir, 'memory-cleanup.log');
  }

  async init(): Promise<void> {
    try {
      const configDir = join(homedir(), '.squid');
      await mkdir(configDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  // Check if cleanup is needed
  async shouldCleanup(): Promise<boolean> {
    const memories = await this.memoryManager.list();
    return memories.length >= CLEANUP_THRESHOLD;
  }

  // Calculate memory value score
  calculateMemoryScore(memory: Memory): number {
    const now = Date.now();
    const createdTime = new Date(memory.metadata.created).getTime();
    const ageInDays = (now - createdTime) / (1000 * 60 * 60 * 24);

    // Access count (default to 0 if not tracked yet)
    const accessCount = memory.metadata.accessCount || 0;

    // Type weights
    const typeWeight: Record<string, number> = {
      user: 1.5,
      feedback: 1.3,
      project: 1.2,
      reference: 1.0
    };

    const weight = typeWeight[memory.metadata.type] || 1.0;

    // Score = (accessCount + 1) * typeWeight / ageInDays
    // Higher score = more valuable
    return ((accessCount + 1) * weight) / Math.max(ageInDays, 1);
  }

  // Clean up low-value memories
  async cleanupLowValueMemories(): Promise<{
    success: boolean;
    removedCount: number;
    error?: string;
  }> {
    try {
      const memories = await this.memoryManager.list();

      if (memories.length < CLEANUP_THRESHOLD) {
        return { success: true, removedCount: 0 };
      }

      // Calculate scores for all memories
      const scoredMemories = memories.map(memory => ({
        memory,
        score: this.calculateMemoryScore(memory)
      }));

      // Sort by score (lowest first)
      scoredMemories.sort((a, b) => a.score - b.score);

      // Determine how many to remove
      const toRemoveCount = memories.length - CLEANUP_TARGET;
      const candidates = scoredMemories.slice(0, toRemoveCount);

      // Filter out protected memories (created within last 30 days)
      const now = Date.now();
      const protectionMs = PROTECTION_DAYS * 24 * 60 * 60 * 1000;

      const toRemove = candidates.filter(({ memory }) => {
        const createdTime = new Date(memory.metadata.created).getTime();
        return now - createdTime > protectionMs;
      });

      // Remove memories
      const removed: Array<{ id: string; name: string; score: number }> = [];

      for (const { memory, score } of toRemove) {
        const success = await this.memoryManager.delete(memory.id);
        if (success) {
          removed.push({
            id: memory.id,
            name: memory.metadata.name,
            score
          });
        }
      }

      // Log cleanup
      if (removed.length > 0) {
        await this.logCleanup({
          timestamp: new Date().toISOString(),
          removedCount: removed.length,
          memories: removed
        });
      }

      return {
        success: true,
        removedCount: removed.length
      };
    } catch (error: any) {
      return {
        success: false,
        removedCount: 0,
        error: error.message
      };
    }
  }

  // Log cleanup action
  private async logCleanup(entry: CleanupLogEntry): Promise<void> {
    try {
      const logLine = [
        `[${entry.timestamp}] Cleaned up ${entry.removedCount} memories:`,
        ...entry.memories.map(m => `  - ${m.name} (score: ${m.score.toFixed(4)})`),
        ''
      ].join('\n');

      await appendFile(this.logPath, logLine, 'utf-8');
    } catch (error) {
      console.error('Failed to write cleanup log:', error);
    }
  }

  // Check and run cleanup if needed
  async checkAndCleanup(): Promise<void> {
    if (await this.shouldCleanup()) {
      const result = await this.cleanupLowValueMemories();
      if (result.success && result.removedCount > 0) {
        console.log(`[AutoCleanup] Removed ${result.removedCount} low-value memories`);
      }
    }
  }
}
