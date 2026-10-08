import { GoogleGenAI, Type } from '@google/genai';
import { AIModelResponse, AIProvider, SynthesisResult } from '../../types';
import { SYNTHESIS_SYSTEM_PROMPT } from './providersConfig';

export async function synthesizeAnswers(
  question: string,
  modelResponses: Record<AIProvider, AIModelResponse>,
  apiKey?: string
): Promise<SynthesisResult | null> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (effectiveKey && effectiveKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const responseBundle = Object.entries(modelResponses)
        .map(([provider, res]) => `=== ${res.modelName || provider} ===\n${res.answer}`)
        .join('\n\n');

      const prompt = `You are the StudyMind educational answer synthesizer.

The student asked:
"${question}"

The following AI models provided answers:

${responseBundle}

Synthesize these perspectives into one unified, student-friendly answer. Return your output as structured JSON.`;

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: SYNTHESIS_SYSTEM_PROMPT,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  simpleExplanation: {
                    type: Type.STRING,
                    description: 'Beginner-friendly explanation using an intuitive analogy.',
                  },
                  detailedExplanation: {
                    type: Type.STRING,
                    description: 'Deeper academic and conceptual explanation with structured points.',
                  },
                  exampleCodeOrContext: {
                    type: Type.STRING,
                    description: 'Code snippet or concrete example scenario.',
                  },
                  exampleExplanation: {
                    type: Type.STRING,
                    description: 'Step-by-step breakdown of how the example works.',
                  },
                  exampleLanguage: {
                    type: Type.STRING,
                    description: 'Programming language or context type (e.g. typescript, python, markdown).',
                  },
                  importantPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Key bullet points for student revision.',
                  },
                  quickSummary: {
                    type: Type.STRING,
                    description: '1-2 sentence core takeaway for quick memory.',
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
                    description: 'Summary of what all models agreed on vs unique nuances.',
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
                  'exampleCodeOrContext',
                  'exampleExplanation',
                  'importantPoints',
                  'quickSummary',
                  'practiceQuestions',
                ],
              },
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          if (parsed.simpleExplanation) {
            return {
              simpleExplanation: parsed.simpleExplanation,
              detailedExplanation: parsed.detailedExplanation,
              example: {
                codeOrContext: parsed.exampleCodeOrContext || '',
                explanation: parsed.exampleExplanation || '',
                language: parsed.exampleLanguage || 'typescript',
              },
              importantPoints: parsed.importantPoints || [],
              quickSummary: parsed.quickSummary || '',
              practiceQuestions: parsed.practiceQuestions || [],
              consensusSummary: parsed.consensusSummary,
              agreements: parsed.agreements || [],
              differencesOrNuances: parsed.differencesOrNuances || [],
            };
          }
        } catch (mErr: any) {
          console.warn(`Synthesis on ${model} failed, trying next candidate:`, mErr.message || mErr);
        }
      }
    } catch (err: any) {
      console.warn('Synthesis via Gemini API failed or returned invalid JSON, falling back:', err.message);
    }
  }

  return null;
}
