import { GoogleGenAI } from '@google/genai';
import { AIModelResponse } from '../../types';
import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() && key !== 'MY_GEMINI_API_KEY');
}

export async function queryGemini(
  question: string,
  hasDocument = false
): Promise<AIModelResponse> {
  const startTime = Date.now();
  const effectiveKey = process.env.GEMINI_API_KEY;

  const baseMeta = {
    provider: 'gemini' as const,
    perspectiveHighlight: hasDocument
      ? 'Contextual Grounding on Attached Lecture'
      : 'Intuitive Analogies & Conceptual Grounding',
    keyApproach: 'Connects abstract CS concepts to real-life mechanisms and clear code.',
  };

  if (!effectiveKey || effectiveKey === 'MY_GEMINI_API_KEY') {
    return {
      ...baseMeta,
      modelName: 'Gemini 4 Hydrogen',
      answer: '',
      latencyMs: Date.now() - startTime,
      status: 'unavailable',
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  const ai = new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const promptText = `Computer Science Student Question:
${question}

Use clear basic English, simple real-life analogies, technical term definitions, and step-by-step code or problem-solving examples where helpful.`;

  const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError = 'Gemini API request failed.';

  for (const model of candidateModels) {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Gemini (${model}) request timed out.`)),
          20000
        );
        ai.models
          .generateContent({
            model,
            contents: promptText,
            config: {
              systemInstruction: COMMON_EDUCATIONAL_SYSTEM_PROMPT,
            },
          })
          .then((res) => {
            clearTimeout(timer);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });

      const text = response.text?.trim() || '';
      if (text) {
        return {
          ...baseMeta,
          modelName: model === 'gemini-4-hydrogen' ? 'Gemini 4 Hydrogen' : 'Gemini 3.1 Flash Lite',
          answer: text,
          latencyMs: Date.now() - startTime,
          status: 'success',
        };
      }
      lastError = 'Gemini returned an empty response.';
    } catch (err: any) {
      lastError = err?.message || 'Gemini API request failed.';
      console.warn(`Gemini live API call on ${model} failed (${lastError})`);
    }
  }

  return {
    ...baseMeta,
    modelName: 'Gemini 4 Hydrogen',
    answer: '',
    latencyMs: Date.now() - startTime,
    status: 'error',
    error: lastError,
  };
}
