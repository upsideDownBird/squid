export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  requestCount: number;
}

export class CostTracker {
  private stats: Map<string, UsageStats> = new Map();

  track(providerId: string, inputTokens: number, outputTokens: number, cost: number) {
    const current = this.stats.get(providerId) || {
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
      requestCount: 0
    };

    this.stats.set(providerId, {
      inputTokens: current.inputTokens + inputTokens,
      outputTokens: current.outputTokens + outputTokens,
      totalCost: current.totalCost + cost,
      requestCount: current.requestCount + 1
    });
  }

  getStats(providerId: string): UsageStats | undefined {
    return this.stats.get(providerId);
  }

  getAllStats(): Map<string, UsageStats> {
    return new Map(this.stats);
  }

  reset(providerId?: string) {
    if (providerId) {
      this.stats.delete(providerId);
    } else {
      this.stats.clear();
    }
  }
}
