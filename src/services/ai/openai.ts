import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export async function queryOpenAI(question: string, apiKey?: string): Promise<{
  answer: string;
  latencyMs: number;
  modelName: string;
  source: 'live_api' | 'educational_engine';
}> {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.OPENAI_API_KEY;

  if (effectiveKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: COMMON_EDUCATIONAL_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Student Question: ${question}

Provide an educational explanation structured with clear headings, core definitions, standard taxonomies/hierarchies, and a clean code or problem-solving walkthrough.`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        return {
          answer: content,
          latencyMs: Date.now() - startTime,
          modelName: 'GPT-4o (OpenAI API)',
          source: 'live_api',
        };
      }
    } catch (err: any) {
      console.warn('OpenAI live API call failed, falling back to educational engine:', err.message);
    }
  }

  // Graceful simulation
  await new Promise(r => setTimeout(r, 750));
  return {
    answer: '',
    latencyMs: Date.now() - startTime,
    modelName: 'GPT-4o',
    source: 'educational_engine',
  };
}
