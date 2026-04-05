// Intelligent memory selection with 4-layer compression
import { MemoryStorage } from './storage';
import { MemoryManager } from './manager';
import type { Memory, MemoryType } from './types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const MAX_MEMORIES = 200;
const MAX_INDEX_LINES = 200;
const MAX_INDEX_BYTES = 25000;
const MAX_SELECTED = 5;
const MAX_MEMORY_LINES = 200;
const MAX_MEMORY_BYTES = 4096;

export interface MemorySelectionResult {
  memories: Memory[];
  indexContent: string | null;
  truncated: boolean;
  message?: string;
}

export class MemorySelector {
  private storage: MemoryStorage;
  private memoryManager: MemoryManager;
  private memoryDir: string;
  private surfacedMemories: Set<string>;

  constructor(memoryManager: MemoryManager) {
    this.storage = new MemoryStorage();
    this.memoryManager = memoryManager;
    this.memoryDir = join(homedir(), '.squid', 'memory');
    this.surfacedMemories = new Set();
  }

  async init(): Promise<void> {
    await this.storage.init();
  }

  // Layer 1: Scan and limit memory files (max 200)
  async scanMemories(): Promise<Memory[]> {
    const memories = await this.storage.listMemories();
    return memories.slice(0, MAX_MEMORIES);
  }

  // Layer 2: Load and compress MEMORY.md index (200 lines or 25KB)
  async loadIndex(): Promise<{ content: string; truncated: boolean }> {
    try {
      const indexPath = join(this.memoryDir, 'MEMORY.md');
      let content = await readFile(indexPath, 'utf-8');
      const lines = content.split('\n');
      const byteCount = Buffer.byteLength(content, 'utf-8');

      let truncated = false;

      if (lines.length > MAX_INDEX_LINES || byteCount > MAX_INDEX_BYTES) {
        truncated = true;
        const truncatedLines = lines.slice(0, MAX_INDEX_LINES);
        content = truncatedLines.join('\n');

        if (Buffer.byteLength(content, 'utf-8') > MAX_INDEX_BYTES) {
          const lastNewline = content.lastIndexOf('\n', MAX_INDEX_BYTES);
          content = content.substring(0, lastNewline > 0 ? lastNewline : MAX_INDEX_BYTES);
        }

        content += '\n\n> Index truncated. Use Read tool to view full memories.';
      }

      return { content, truncated };
    } catch (error) {
      return { content: '', truncated: false };
    }
  }

  // Layer 3: AI model call to select most relevant 5 memories
  async selectRelevant(
    userQuery: string,
    memories: Memory[],
    aiSelectFn?: (query: string, memories: Memory[]) => Promise<string[]>
  ): Promise<Memory[]> {
    // Filter out already surfaced memories
    const unsurfaced = memories.filter(m => !this.surfacedMemories.has(m.id));

    if (unsurfaced.length === 0) {
      // All memories have been surfaced, reset and use all
      this.surfacedMemories.clear();
      return memories.slice(0, MAX_SELECTED);
    }

    // If AI selection function provided, use it
    if (aiSelectFn) {
      try {
        const selectedIds = await aiSelectFn(userQuery, unsurfaced);
        const selected = unsurfaced.filter(m => selectedIds.includes(m.id));

        // Mark as surfaced
        selected.forEach(m => this.surfacedMemories.add(m.id));

        return selected.slice(0, MAX_SELECTED);
      } catch (error) {
        console.error('AI selection failed, falling back to recent memories:', error);
      }
    }

    // Fallback: use most recent 5 memories
    const recent = unsurfaced.slice(0, MAX_SELECTED);
    recent.forEach(m => this.surfacedMemories.add(m.id));
    return recent;
  }

  // Layer 4: Read and compress individual memory content (200 lines or 4KB)
  compressMemoryContent(memory: Memory): { content: string; truncated: boolean } {
    const lines = memory.content.split('\n');
    const byteCount = Buffer.byteLength(memory.content, 'utf-8');

    let content = memory.content;
    let truncated = false;

    if (lines.length > MAX_MEMORY_LINES || byteCount > MAX_MEMORY_BYTES) {
      truncated = true;
      const truncatedLines = lines.slice(0, MAX_MEMORY_LINES);
      content = truncatedLines.join('\n');

      if (Buffer.byteLength(content, 'utf-8') > MAX_MEMORY_BYTES) {
        content = content.substring(0, MAX_MEMORY_BYTES);
      }

      content += `\n\n> [Content truncated. Memory ID: ${memory.id}]`;
    }

    return { content, truncated };
  }

  // Main selection method combining all 4 layers
  async select(
    userQuery: string,
    aiSelectFn?: (query: string, memories: Memory[]) => Promise<string[]>
  ): Promise<MemorySelectionResult> {
    // Layer 1: Scan memories
    const allMemories = await this.scanMemories();

    if (allMemories.length === 0) {
      return {
        memories: [],
        indexContent: null,
        truncated: false,
        message: 'No memories found'
      };
    }

    // Layer 2: Load index
    const { content: indexContent, truncated: indexTruncated } = await this.loadIndex();

    // Layer 3: Select relevant memories
    const selected = await this.selectRelevant(userQuery, allMemories, aiSelectFn);

    // Increment access count for selected memories
    for (const memory of selected) {
      this.memoryManager.incrementAccessCount(memory.id).catch(err => {
        console.error('Failed to increment access count:', err);
      });
    }

    // Layer 4: Compress individual memories
    const compressed = selected.map(memory => {
      const { content, truncated } = this.compressMemoryContent(memory);
      return {
        ...memory,
        content,
        truncated
      } as Memory;
    });

    return {
      memories: compressed,
      indexContent,
      truncated: indexTruncated || compressed.some((m: any) => m.truncated),
      message: compressed.length > 0 ? `Selected ${compressed.length} relevant memories` : undefined
    };
  }

  // Reset surfaced memories tracking
  resetSurfaced(): void {
    this.surfacedMemories.clear();
  }

  // Format memories for injection into system prompt
  formatForPrompt(result: MemorySelectionResult): string {
    if (result.memories.length === 0) {
      return '';
    }

    const sections: string[] = [];

    // Add index if available
    if (result.indexContent) {
      sections.push('# Memory Index\n\n' + result.indexContent);
    }

    // Add selected memories
    sections.push('# Selected Memories\n');
    for (const memory of result.memories) {
      sections.push(`## ${memory.metadata.name} (${memory.metadata.type})\n`);
      sections.push(`**Description:** ${memory.metadata.description}\n`);
      sections.push(memory.content);
      sections.push('');
    }

    if (result.truncated) {
      sections.push('> Some memories were truncated. Use the Read tool to view full content.');
    }

    return sections.join('\n');
  }
}
