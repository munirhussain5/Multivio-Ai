import { AIModelResponse } from '../../types';
import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim());
}

export async function queryOpenAI(
  question: string,
  hasDocument = false
): Promise<AIModelResponse> {
  const startTime = Date.now();
  const effectiveKey = process.env.OPENAI_API_KEY;

  const baseMeta = {
    provider: 'chatgpt' as const,
    perspectiveHighlight: hasDocument
      ? 'Syllabus & Lecture Structural Breakdown'
      : 'Structured Hierarchy & CS Taxonomy',
    keyApproach: 'Clear definitions, structured headings, and step-by-step code walkthroughs.',
  };

  if (!effectiveKey || !effectiveKey.trim()) {
    return {
      ...baseMeta,
      modelName: 'GPT-4o',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'unavailable',
      error: 'OPENAI_API_KEY is not configured on the server.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey.trim()}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: COMMON_EDUCATIONAL_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Computer Science Student Question:
${question}

Provide a structured educational explanation in basic English with clear headings, technical term definitions, practical use cases, and step-by-step code or problem-solving examples where applicable.`,
          },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errDetail = `OpenAI API returned HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) errDetail = errJson.error.message;
      } catch {
        // keep HTTP status error
      }
      return {
        ...baseMeta,
        modelName: 'GPT-4o',
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
        modelName: data.model || 'GPT-4o',
        answer: '',
        latencyMs: Date.now() - startTime,
        status: 'error',
        error: 'OpenAI returned an empty response.',
      };
    }

    return {
      ...baseMeta,
      modelName: data.model || 'GPT-4o',
      answer: content,
      latencyMs: Date.now() - startTime,
      status: 'success',
    };
  } catch (err: any) {
    return {
      ...baseMeta,
      modelName: 'GPT-4o',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'error',
      error: err?.name === 'AbortError' ? 'OpenAI request timed out.' : (err?.message || 'OpenAI request failed.'),
    };
  } finally {
    clearTimeout(timeout);
  }
}
