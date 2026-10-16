import type { AIProvider, GeneratePrompt, GeneratedContent, AIProviderStatus } from './types.js';
import { TemplateProvider } from './template.provider.js';
import { OllamaProvider } from './ollama.provider.js';
import { logger } from '../../lib/logger.js';

const template = new TemplateProvider();
const ollama = new OllamaProvider();

const providers: Record<string, AIProvider> = {
  template,
  ollama,
};

/**
 * Get all providers with status. Never exposes credentials.
 */
export async function getAllProviderStatuses(): Promise<AIProviderStatus[]> {
  return Promise.all(Object.values(providers).map((p) => p.getStatus()));
}

/**
 * Generate outreach content using the specified provider or the default cascade.
 * Cascade: specified provider → template fallback.
 */
export async function generateWithFallback(
  prompt: GeneratePrompt,
  preferredProviderId?: string,
): Promise<GeneratedContent & { usedFallback: boolean }> {
  const preferredProvider = preferredProviderId ? providers[preferredProviderId] : null;
  const defaultProviderId = process.env.AI_DEFAULT_PROVIDER ?? 'template';
  const defaultProvider = providers[defaultProviderId] ?? template;

  const attemptOrder: AIProvider[] = [];

  if (preferredProvider && preferredProvider.id !== 'template') {
    attemptOrder.push(preferredProvider);
  }
  if (defaultProvider.id !== 'template') {
    attemptOrder.push(defaultProvider);
  }
  attemptOrder.push(template); // Always last resort

  let lastError: unknown;

  for (const provider of attemptOrder) {
    if (!provider.isConfigured()) continue;

    try {
      const available = await provider.checkAvailability();
      if (!available) {
        logger.warn({ provider: provider.id }, 'Provider not available, trying next');
        continue;
      }

      const result = await provider.generate(prompt);
      const usedFallback = provider.id === 'template' && attemptOrder[0]?.id !== 'template';
      logger.info({ provider: provider.id }, 'Outreach generated');
      return { ...result, usedFallback };
    } catch (err) {
      lastError = err;
      logger.warn({ provider: provider.id, err }, 'Provider generation failed, trying next');
    }
  }

  // Template should always work — if we get here, use it unconditionally
  logger.warn('All providers failed, forcing template fallback');
  const result = await template.generate(prompt);
  return { ...result, usedFallback: true };
}
