import { AIModelResponse } from '../../types';
import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim());
}

export async function queryDeepSeek(
  question: string,
  hasDocument = false
): Promise<AIModelResponse> {
  const startTime = Date.now();
  const effectiveKey = process.env.DEEPSEEK_API_KEY;

  const baseMeta = {
    provider: 'deepseek' as const,
    perspectiveHighlight: hasDocument
      ? 'Systems & Lecture Implementation Analysis'
      : 'Low-Level Systems & Complexity',
    keyApproach: 'Execution mechanics, memory/CPU behavior, time-space complexity, and practical code.',
  };

  if (!effectiveKey || !effectiveKey.trim()) {
    return {
      ...baseMeta,
      modelName: 'DeepSeek V3',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'unavailable',
      error: 'DEEPSEEK_API_KEY is not configured on the server.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey.trim()}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: COMMON_EDUCATIONAL_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Computer Science Student Question:
${question}

Explain this clearly in basic English for a CS student, highlighting underlying mechanics, execution/complexity steps, and step-by-step programming or problem-solving examples where helpful.`,
          },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errDetail = `DeepSeek API returned HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch {
        // keep HTTP status error
      }
      return {
        ...baseMeta,
        modelName: 'DeepSeek V3',
        answer: '',
        latencyMs: Date.now() - startTime,
        status: 'error',
        error: errDetail,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    if (!content) {
      return {
        ...baseMeta,
        modelName: data.model || 'DeepSeek V3',
        answer: '',
        latencyMs: Date.now() - startTime,
        status: 'error',
        error: 'DeepSeek returned an empty response.',
      };
    }

    return {
      ...baseMeta,
      modelName: data.model || 'DeepSeek V3',
      answer: content,
      latencyMs: Date.now() - startTime,
      status: 'success',
    };
  } catch (err: any) {
    return {
      ...baseMeta,
      modelName: 'DeepSeek V3',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'error',
      error: err?.name === 'AbortError' ? 'DeepSeek request timed out.' : (err?.message || 'DeepSeek request failed.'),
    };
  } finally {
    clearTimeout(timeout);
  }
}
