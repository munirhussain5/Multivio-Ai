import { AIModelResponse, AIProvider } from '../../types';
import { isClaudeConfigured, queryClaude } from './claude';
import { isDeepSeekConfigured, queryDeepSeek } from './deepseek';
import { isGeminiConfigured, queryGemini } from './gemini';
import { isOpenAIConfigured, queryOpenAI } from './openai';

export interface ProviderModule {
  id: AIProvider;
  label: string;
  isConfigured: () => boolean;
  query: (prompt: string, hasDocument?: boolean) => Promise<AIModelResponse>;
}

/**
 * Modular provider registry: adding a new AI provider only requires registering
 * an implementation conforming to ProviderModule here.
 */
export const PROVIDER_REGISTRY: Record<AIProvider, ProviderModule> = {
  chatgpt: {
    id: 'chatgpt',
    label: 'OpenAI (ChatGPT)',
    isConfigured: isOpenAIConfigured,
    query: queryOpenAI,
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    isConfigured: isGeminiConfigured,
    query: queryGemini,
  },
  claude: {
    id: 'claude',
    label: 'Anthropic Claude',
    isConfigured: isClaudeConfigured,
    query: queryClaude,
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek AI',
    isConfigured: isDeepSeekConfigured,
    query: queryDeepSeek,
  },
};

export async function queryProvidersConcurrently(
  selectedModels: AIProvider[],
  prompt: string,
  hasDocument = false
): Promise<Record<AIProvider, AIModelResponse>> {
  const settled = await Promise.allSettled(
    selectedModels.map(async (provider) => {
      const mod = PROVIDER_REGISTRY[provider];
      if (!mod) {
        return {
          provider,
          modelName: provider,
          answer: '',
          latencyMs: 0,
          status: 'unavailable' as const,
          error: `Unknown provider "${provider}".`,
        };
      }
      return mod.query(prompt, hasDocument);
    })
  );

  const responses: Record<AIProvider, AIModelResponse> = {} as Record<AIProvider, AIModelResponse>;
  settled.forEach((result, idx) => {
    const provider = selectedModels[idx];
    if (result.status === 'fulfilled') {
      responses[provider] = result.value;
    } else {
      responses[provider] = {
        provider,
        modelName: PROVIDER_REGISTRY[provider]?.label || provider,
        answer: '',
        latencyMs: 0,
        status: 'error',
        error: result.reason?.message || 'Unexpected provider execution error.',
      };
    }
  });

  return responses;
}
