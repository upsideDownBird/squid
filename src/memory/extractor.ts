// Memory extractor - AI-powered conversation analysis and automatic memory creation
import OpenAI from 'openai';
import { MemoryManager } from './manager';
import { buildExtractionPrompt } from './prompts';
import type { ExtractedMemory, Memory } from './types';
import type { Message } from '../conversation/manager';

export class MemoryExtractor {
  private memoryManager: MemoryManager;
  private client: OpenAI | null = null;
  private modelName: string = 'gpt-4';
  private baseURL: string | undefined;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  setApiKey(apiKey: string, baseURL?: string, modelName?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseURL || 'https://api.openai.com/v1'
    });
    this.modelName = modelName || 'gpt-4';
    if (baseURL) {
      this.baseURL = baseURL;
    }
  }

  // Main extraction method
  async extractAndSave(
    messages: Message[],
    apiKey?: string,
    baseURL?: string,
    modelName?: string
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    if (apiKey) {
      this.setApiKey(apiKey, baseURL, modelName);
    }

    if (!this.client) {
      throw new Error('API key not configured');
    }

    const errors: string[] = [];
    let created = 0;
    let skipped = 0;

    try {
      // Step 1: Extract memories using AI
      const extracted = await this.extractMemories(messages);

      // Step 2: Filter by confidence
      const highConfidence = this.filterByConfidence(extracted, 0.7);

      // Step 3: Check duplicates and save
      for (const memory of highConfidence) {
        try {
          const duplicate = await this.checkDuplicates(memory);

          if (duplicate.isDuplicate) {
            skipped++;
            continue;
          }

          // Save memory directly
          await this.saveMemory(memory);
          created++;
        } catch (error: any) {
          errors.push(`Failed to save memory "${memory.name}": ${error.message}`);
        }
      }

      return { created, skipped, errors };
    } catch (error: any) {
      errors.push(`Extraction failed: ${error.message}`);
      return { created, skipped, errors };
    }
  }

  // Call AI to analyze conversation and extract memories
  private async extractMemories(messages: Message[]): Promise<ExtractedMemory[]> {
    if (!this.client) {
      throw new Error('API client not initialized');
    }

    // Format conversation for AI
    const conversation = this.formatConversation(messages);

    // Get existing memories summary
    const existingMemories = await this.getExistingMemoriesSummary();

    // Build prompt
    const prompt = buildExtractionPrompt(conversation, existingMemories);

    // Call AI using OpenAI-compatible API
    const response = await this.client.chat.completions.create({
      model: this.modelName,
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return this.parseExtractionResponse(content);
  }

  // Parse AI response JSON
  private parseExtractionResponse(response: string): ExtractedMemory[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const lines = jsonStr.split('\n');
        jsonStr = lines.slice(1, -1).join('\n');
        if (jsonStr.startsWith('json')) {
          jsonStr = jsonStr.substring(4).trim();
        }
      }

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        console.warn('AI response is not an array, returning empty');
        return [];
      }

      // Validate each memory
      return parsed.filter(item => {
        return (
          item.type &&
          item.name &&
          item.description &&
          item.content &&
          typeof item.confidence === 'number'
        );
      });
    } catch (error) {
      console.error('Failed to parse extraction response:', error);
      return [];
    }
  }

  // Filter memories by confidence threshold
  private filterByConfidence(
    memories: ExtractedMemory[],
    threshold: number
  ): ExtractedMemory[] {
    return memories.filter(m => m.confidence >= threshold);
  }

  // Check if memory is duplicate of existing ones
  private async checkDuplicates(
    memory: ExtractedMemory
  ): Promise<{ isDuplicate: boolean; duplicateOf?: string }> {
    const existing = await this.memoryManager.list();

    for (const existingMemory of existing) {
      const similarity = this.calculateSimilarity(
        existingMemory.content,
        memory.content
      );

      if (similarity > 0.7) {
        return {
          isDuplicate: true,
          duplicateOf: existingMemory.id
        };
      }
    }

    return { isDuplicate: false };
  }

  // Calculate Jaccard similarity between two texts
  private calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  // Tokenize text into words
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }

  // Save memory directly
  private async saveMemory(memory: ExtractedMemory): Promise<void> {
    await this.memoryManager.create({
      name: memory.name,
      description: memory.description,
      type: memory.type,
      content: memory.content
    });
  }

  // Format conversation for AI prompt
  private formatConversation(messages: Message[]): string {
    return messages
      .map(msg => {
        const role = msg.role === 'user' ? '用户' : 'AI';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');
  }

  // Get summary of existing memories
  private async getExistingMemoriesSummary(): Promise<string> {
    const memories = await this.memoryManager.list();

    if (memories.length === 0) {
      return '（暂无已有记忆）';
    }

    return memories
      .map(m => `- ${m.metadata.name} (${m.metadata.type}): ${m.metadata.description}`)
      .join('\n');
  }
}
