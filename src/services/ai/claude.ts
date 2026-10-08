import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export async function queryClaude(question: string, apiKey?: string): Promise<{
  answer: string;
  latencyMs: number;
  modelName: string;
  source: 'live_api' | 'educational_engine';
}> {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.ANTHROPIC_API_KEY;

  if (effectiveKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: COMMON_EDUCATIONAL_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Student Question: ${question}

Provide an educational explanation that covers theoretical taxonomy, academic background, etymology if applicable, common student misconceptions, and behavioral contract principles.`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content?.[0]?.text || '';
        return {
          answer: content,
          latencyMs: Date.now() - startTime,
          modelName: 'Claude 3.5 Sonnet (Anthropic API)',
          source: 'live_api',
        };
      }
    } catch (err: any) {
      console.warn('Anthropic Claude API call failed, falling back to educational engine:', err.message);
    }
  }

  await new Promise(r => setTimeout(r, 850));
  return {
    answer: '',
    latencyMs: Date.now() - startTime,
    modelName: 'Claude 3.5 Sonnet',
    source: 'educational_engine',
  };
}
