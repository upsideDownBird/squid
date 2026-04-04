import type { ModelProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { DeepSeekProvider } from './deepseek';

export class ModelRegistry {
  private providers: Map<string, ModelProvider> = new Map();

  register(provider: ModelProvider) {
    this.providers.set(provider.id, provider);
  }

  get(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  list(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  static createDefault(apiKeys: Record<string, string>): ModelRegistry {
    const registry = new ModelRegistry();

    if (apiKeys.anthropic) {
      registry.register(new AnthropicProvider(apiKeys.anthropic));
    }
    if (apiKeys.openai) {
      registry.register(new OpenAIProvider(apiKeys.openai));
    }
    if (apiKeys.deepseek) {
      registry.register(new DeepSeekProvider(apiKeys.deepseek));
    }

    return registry;
  }
}
