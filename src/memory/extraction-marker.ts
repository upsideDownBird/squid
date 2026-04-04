// Extraction marker management - tracks which messages have been analyzed
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { ExtractionCursor } from './types';

export class ExtractionMarker {
  private markerPath: string;
  private markers: ExtractionCursor = {};

  constructor() {
    const configDir = join(homedir(), '.jobopx');
    this.markerPath = join(configDir, 'extraction-marker.json');
  }

  async init(): Promise<void> {
    try {
      const configDir = join(homedir(), '.jobopx');
      await mkdir(configDir, { recursive: true });
      await this.load();
    } catch (error) {
      // Ignore errors, will create on first save
    }
  }

  // Load markers from disk
  private async load(): Promise<void> {
    try {
      const content = await readFile(this.markerPath, 'utf-8');
      this.markers = JSON.parse(content);
    } catch (error) {
      // File doesn't exist yet, start with empty markers
      this.markers = {};
    }
  }

  // Save markers to disk
  private async save(): Promise<void> {
    try {
      await writeFile(
        this.markerPath,
        JSON.stringify(this.markers, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save extraction marker:', error);
    }
  }

  // Get marker for a conversation
  getMarker(conversationId: string): number {
    return this.markers[conversationId] || 0;
  }

  // Save marker for a conversation
  async saveMarker(conversationId: string, messageIndex: number): Promise<void> {
    this.markers[conversationId] = messageIndex;
    await this.save();
  }

  // Reset marker for a conversation
  async resetMarker(conversationId: string): Promise<void> {
    delete this.markers[conversationId];
    await this.save();
  }

  // Reset all markers
  async resetAll(): Promise<void> {
    this.markers = {};
    await this.save();
  }
}
