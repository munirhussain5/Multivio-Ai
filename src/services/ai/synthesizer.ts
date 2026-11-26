import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { AIModelResponse, AIProvider, SynthesisResult } from '../../types';
import { SYNTHESIS_SYSTEM_PROMPT } from './providersConfig';

function buildSynthesisUserPrompt(
  question: string,
  modelResponses: Record<AIProvider, AIModelResponse>
): string {
  const formatProvider = (id: AIProvider, label: string) => {
    const r = modelResponses[id];
    if (!r) return `=== ${label} ===\n[Not selected for this query]`;
    if (r.status === 'success' && r.answer.trim()) {
      const trimmed = r.answer.trim();
      const snippet = trimmed.length > 2200 ? `${trimmed.slice(0, 2200)}\n...[truncated]` : trimmed;
      return `=== ${label} (${r.modelName}) ===\n${snippet}`;
    }
    return `=== ${label} ===\n[Unavailable: ${r.error || 'No response generated'}]`;
  };

  return `You are the StudyMind educational answer synthesizer.

StudyMind is designed specifically for Computer Science students.

The student's question is:

${question}

The following AI models provided answers:

${formatProvider('chatgpt', 'OpenAI')}

${formatProvider('gemini', 'Gemini')}

${formatProvider('claude', 'Claude')}

${formatProvider('deepseek', 'DeepSeek')}

Your task is to compare the available responses and create one high-quality educational answer in basic English for a Computer Science student.
- Highlight consistent facts across responses without assuming correctness solely from agreement.
- Explicitly note contradictions, differences, or unsupported claims if any exist.
- Explain technical terms clearly and include step-by-step code or real-life examples when helpful.

Return ONLY valid JSON matching the requested schema.`;
}

function normalizeSynthesisPayload(parsed: any): SynthesisResult | null {
  if (!parsed || typeof parsed.simpleExplanation !== 'string' || !parsed.simpleExplanation.trim()) {
    return null;
  }

  return {
    simpleExplanation: parsed.simpleExplanation.trim(),
    detailedExplanation: (parsed.detailedExplanation || '').trim(),
    howItWorks: (parsed.howItWorks || '').trim() || undefined,
    example: {
      codeOrContext: parsed.exampleCodeOrContext || parsed.example?.codeOrContext || '',
      explanation: parsed.exampleExplanation || parsed.example?.explanation || '',
      language: parsed.exampleLanguage || parsed.example?.language || 'python',
    },
    importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
    commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
    quickSummary: (parsed.quickSummary || '').trim(),
    practiceQuestions: Array.isArray(parsed.practiceQuestions)
      ? parsed.practiceQuestions.map((pq: any, i: number) => ({
          id: pq?.id || `pq-${i + 1}`,
          question: pq?.question || '',
          hint: pq?.hint,
        }))
      : [],
    consensusSummary: parsed.consensusSummary || '',
    agreements: Array.isArray(parsed.agreements) ? parsed.agreements : [],
    differencesOrNuances: Array.isArray(parsed.differencesOrNuances)
      ? parsed.differencesOrNuances
      : [],
  };
}

async function synthesizeWithGemini(prompt: string): Promise<SynthesisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });

  const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  for (const model of candidateModels) {
    try {
      const response = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Synthesis Gemini (${model}) timed out.`)),
          20000
        );
        ai.models
          .generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: SYNTHESIS_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              ...(model === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              responseSchema: {
            type: Type.OBJECT,
            properties: {
              simpleExplanation: {
                type: Type.STRING,
                description: 'Beginner-friendly explanation in basic English using a simple real-life analogy.',
              },
              detailedExplanation: {
                type: Type.STRING,
                description: 'Structured detailed explanation comparing model answers, noting agreements, contradictions, and technical terms.',
              },
              howItWorks: {
                type: Type.STRING,
                description: 'Step-by-step breakdown of how the concept or mechanism works in computing.',
              },
              exampleCodeOrContext: {
                type: Type.STRING,
                description: 'Clean programming code example or concrete CS scenario.',
              },
              exampleExplanation: {
                type: Type.STRING,
                description: 'Step-by-step explanation of how the code or example works.',
              },
              exampleLanguage: {
                type: Type.STRING,
                description: 'Programming language name (e.g. python, cpp, java, javascript, sql, markdown).',
              },
              importantPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key bullet points for Computer Science revision.',
              },
              commonMistakes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Common misconceptions, bugs, or exam traps and how to avoid them.',
              },
              quickSummary: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence core takeaway for quick recall.',
              },
              practiceQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    hint: { type: Type.STRING },
                  },
                  required: ['id', 'question'],
                },
              },
              consensusSummary: {
                type: Type.STRING,
                description: 'Summary of cross-model consensus and any contradictions or unique points.',
              },
              agreements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              differencesOrNuances: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'simpleExplanation',
              'detailedExplanation',
              'howItWorks',
              'exampleCodeOrContext',
              'exampleExplanation',
              'importantPoints',
              'quickSummary',
              'practiceQuestions',
            ],
          },
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

      const parsed = JSON.parse(response.text || '{}');
      const normalized = normalizeSynthesisPayload(parsed);
      if (normalized) return normalized;
    } catch (err: any) {
      console.warn(`Synthesis on Gemini (${model}) failed:`, err?.message || err);
    }
  }

  return null;
}

async function synthesizeWithOpenAICompatible(
  prompt: string,
  provider: 'openai' | 'deepseek'
): Promise<SynthesisResult | null> {
  const apiKey =
    provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const url =
    provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.deepseek.com/chat/completions';
  const model =
    provider === 'openai'
      ? process.env.OPENAI_MODEL || 'gpt-4o-mini'
      : process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `${SYNTHESIS_SYSTEM_PROMPT}

Return a JSON object with EXACT keys:
simpleExplanation (string), detailedExplanation (string), howItWorks (string), exampleCodeOrContext (string), exampleExplanation (string), exampleLanguage (string), importantPoints (string[]), commonMistakes (string[]), quickSummary (string), practiceQuestions ({id, question, hint}[]), consensusSummary (string), agreements (string[]), differencesOrNuances (string[]).`,
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    return normalizeSynthesisPayload(JSON.parse(raw));
  } catch (err: any) {
    console.warn(`Synthesis via ${provider} failed:`, err?.message || err);
    return null;
  }
}

export async function synthesizeAnswers(
  question: string,
  modelResponses: Record<AIProvider, AIModelResponse>
): Promise<SynthesisResult | null> {
  const hasAnySuccess = Object.values(modelResponses).some(
    (r) => r && r.status === 'success' && r.answer.trim().length > 0
  );
  if (!hasAnySuccess) {
    return null;
  }

  const prompt = buildSynthesisUserPrompt(question, modelResponses);

  // Prefer Gemini, then OpenAI, then DeepSeek
  const fromGemini = await synthesizeWithGemini(prompt);
  if (fromGemini) return fromGemini;

  const fromOpenAI = await synthesizeWithOpenAICompatible(prompt, 'openai');
  if (fromOpenAI) return fromOpenAI;

  const fromDeepSeek = await synthesizeWithOpenAICompatible(prompt, 'deepseek');
  if (fromDeepSeek) return fromDeepSeek;

  return null;
}
