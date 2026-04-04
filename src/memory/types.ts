// Memory type definitions

export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'] as const;

export type MemoryType = typeof MEMORY_TYPES[number];

export interface MemoryMetadata {
  name: string;
  description: string;
  type: MemoryType;
  created: string;
  updated: string;
  accessCount?: number;
  autoCreated?: boolean;
}

export interface Memory {
  id: string;
  metadata: MemoryMetadata;
  content: string;
}

export interface MemoryHeader {
  filename: string;
  filePath: string;
  mtimeMs: number;
  description: string | null;
  type: MemoryType | undefined;
}

export interface MemoryCreateInput {
  name: string;
  description: string;
  type: MemoryType;
  content: string;
}

export interface MemoryUpdateInput {
  name?: string;
  description?: string;
  type?: MemoryType;
  content?: string;
}

// Extraction types
export interface ExtractedMemory {
  type: MemoryType;
  name: string;
  description: string;
  content: string;
  confidence: number;
}

export interface ExtractionConfig {
  enabled: boolean;
  triggerAfterTurns: number;
  triggerOnEnd: boolean;
  cooldownMinutes: number;
}

export interface ExtractionCursor {
  [conversationId: string]: number; // Last analyzed message index
}

export interface ExtractionStats {
  totalAutoCreated: number;
  lastExtractionTime: string | null;
  lastCleanupTime: string | null;
}
