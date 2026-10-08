import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export async function queryDeepSeek(question: string, apiKey?: string): Promise<{
  answer: string;
  latencyMs: number;
  modelName: string;
  source: 'live_api' | 'educational_engine';
}> {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.DEEPSEEK_API_KEY;

  if (effectiveKey) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: COMMON_EDUCATIONAL_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Student Question: ${question}

Provide an educational explanation focusing on low-level engineering mechanics, memory layout/tables, performance tradeoffs, and compiler/CPU interactions.`,
            },
          ],
          temperature: 0.6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        return {
          answer: content,
          latencyMs: Date.now() - startTime,
          modelName: 'DeepSeek V3 (DeepSeek API)',
          source: 'live_api',
        };
      }
    } catch (err: any) {
      console.warn('DeepSeek API call failed, falling back to educational engine:', err.message);
    }
  }

  await new Promise(r => setTimeout(r, 920));
  return {
    answer: '',
    latencyMs: Date.now() - startTime,
    modelName: 'DeepSeek V3',
    source: 'educational_engine',
  };
}
