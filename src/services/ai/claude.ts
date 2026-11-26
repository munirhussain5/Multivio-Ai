import { AIModelResponse } from '../../types';
import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export function isClaudeConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key.trim());
}

export async function queryClaude(
  question: string,
  hasDocument = false
): Promise<AIModelResponse> {
  const startTime = Date.now();
  const effectiveKey = process.env.ANTHROPIC_API_KEY;

  const baseMeta = {
    provider: 'claude' as const,
    perspectiveHighlight: hasDocument
      ? 'Academic Rigor & Lecture Analysis'
      : 'Pedagogical Rigor & Boundary Conditions',
    keyApproach: 'Theoretical clarity, edge cases, common student misconceptions, and practical intuition.',
  };

  if (!effectiveKey || !effectiveKey.trim()) {
    return {
      ...baseMeta,
      modelName: 'Claude 3.5 Sonnet',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'unavailable',
      error: 'ANTHROPIC_API_KEY is not configured on the server.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveKey.trim(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1800,
        system: COMMON_EDUCATIONAL_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Computer Science Student Question:
${question}

Explain this Computer Science concept clearly in basic English, breaking difficult parts into smaller pieces, explaining technical terms, noting edge cases/misconceptions, and showing step-by-step code or calculations when useful.`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errDetail = `Anthropic API returned HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch {
        // keep HTTP status error
      }
      return {
        ...baseMeta,
        modelName: 'Claude 3.5 Sonnet',
        answer: '',
        latencyMs: Date.now() - startTime,
        status: 'error',
        error: errDetail,
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim() || '';
    if (!content) {
      return {
        ...baseMeta,
        modelName: data.model || 'Claude 3.5 Sonnet',
        answer: '',
        latencyMs: Date.now() - startTime,
        status: 'error',
        error: 'Claude returned an empty response.',
      };
    }

    return {
      ...baseMeta,
      modelName: data.model || 'Claude 3.5 Sonnet',
      answer: content,
      latencyMs: Date.now() - startTime,
      status: 'success',
    };
  } catch (err: any) {
    return {
      ...baseMeta,
      modelName: 'Claude 3.5 Sonnet',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'error',
      error: err?.name === 'AbortError' ? 'Claude request timed out.' : (err?.message || 'Claude request failed.'),
    };
  } finally {
    clearTimeout(timeout);
  }
}
