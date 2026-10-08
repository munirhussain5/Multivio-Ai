import { GoogleGenAI } from '@google/genai';
import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export async function queryGemini(question: string, apiKey?: string): Promise<{
  answer: string;
  latencyMs: number;
  modelName: string;
  source: 'live_api' | 'educational_engine';
}> {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveKey && effectiveKey !== 'MY_GEMINI_API_KEY') {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `Student Question: ${question}

Please answer using this educational approach:
- Begin with an intuitive, real-world analogy.
- Break down the underlying concept clearly.
- Provide a concise code or concrete application.
- State why this concept matters and what happens when it is missing.`;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction: COMMON_EDUCATIONAL_SYSTEM_PROMPT,
            temperature: 0.7,
          },
        });

        const text = response.text || '';
        if (text.trim()) {
          return {
            answer: text,
            latencyMs: Date.now() - startTime,
            modelName: model === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Gemini 3.1 Flash Lite',
            source: 'live_api',
          };
        }
      } catch (err: any) {
        console.warn(`Gemini live API call on ${model} failed (${err.message || err}), checking next candidate...`);
      }
    }
  }

  // Fallback to simulated latency & response
  await new Promise(r => setTimeout(r, 650));
  return {
    answer: '',
    latencyMs: Date.now() - startTime,
    modelName: 'Gemini 3.8 Flash',
    source: 'educational_engine',
  };
}
