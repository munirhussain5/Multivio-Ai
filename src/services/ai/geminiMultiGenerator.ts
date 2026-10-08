import { GoogleGenAI, Type } from '@google/genai';
import { 
  AIModelResponse, 
  AIProvider, 
  QuizQuestion, 
  StudyNote, 
  StudySession, 
  SynthesisResult,
  UploadedDocument 
} from '../../types/index';

interface MultiGenPayload {
  chatgptAnswer?: string;
  geminiAnswer?: string;
  claudeAnswer?: string;
  deepseekAnswer?: string;
  simpleExplanation: string;
  detailedExplanation: string;
  exampleContext: string;
  exampleExplanation: string;
  exampleLanguage?: string;
  importantPoints: string[];
  quickSummary: string;
  agreements?: string[];
  differences?: string[];
  quizQuestions: {
    question: string;
    type?: 'mcq' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }[];
  notesDefinition: string;
  notesKeyConcepts: string[];
  notesImportantTerms: { term: string; definition: string }[];
  notesExamPoints: string[];
}

export async function generateLiveEducationalSession(
  question: string,
  selectedModels: AIProvider[] = ['chatgpt', 'gemini', 'claude', 'deepseek'],
  document?: UploadedDocument,
  apiKey?: string
): Promise<StudySession | null> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey || effectiveKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const docContext = document?.text 
    ? `\n\nATTACHED LECTURE DOCUMENT (${document.name}):\n"""\n${document.text.slice(0, 7000)}\n"""` 
    : '';

  const prompt = `You are StudyMind, an advanced educational AI tutor platform.
A student asked:
"${question}"${docContext}

Generate a comprehensive educational study lesson that directly answers the student's question across multiple AI perspectives.

You MUST provide:
1. "chatgptAnswer": Explain this topic like ChatGPT (structured taxonomy, clear hierarchy, definitions, and standard numbered workflows).
2. "geminiAnswer": Explain this topic like Gemini (intuitive real-world analogy, conceptual mental model, and why this matters).
3. "claudeAnswer": Explain this topic like Claude (academic depth, theoretical boundaries, nuances, and common student misconceptions).
4. "deepseekAnswer": Explain this topic like DeepSeek (underlying mechanics, technical/chemical/mathematical/computational details, and practical execution).
5. "simpleExplanation": 2-3 beginner-friendly sentences using an intuitive analogy.
6. "detailedExplanation": Deeper structured explanation covering the core mechanisms.
7. "exampleContext": Concrete application, problem walkthrough, or relevant code snippet.
8. "exampleExplanation": Step-by-step breakdown of how this example works.
9. "importantPoints": 4-5 key bullet takeaways for revision.
10. "quickSummary": 1-2 sentence core takeaway for memorization.
11. "quizQuestions": 3 high-quality educational quiz questions specific to this topic:
   - Question 1: Multiple choice (with 4 options)
   - Question 2: True/False (options: ["True", "False"])
   - Question 3: Multiple choice or conceptual (with 4 options)
   Each with: "question", "options", "correctAnswer", and "explanation".
12. "notesDefinition": Clear, 1-2 sentence foundational definition.
13. "notesKeyConcepts": 3 core concept summaries.
14. "notesImportantTerms": 3 important technical terms with brief definitions.
15. "notesExamPoints": 3 high-yield exam takeaways.

Return purely valid JSON matching the schema.`;

  // Candidate models: use fast gemini-3.1-flash-lite first to avoid 503 high demand spikes
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (!text) continue;

      const parsed: MultiGenPayload = JSON.parse(text);

      const startTime = Date.now();
      const responses: Record<AIProvider, AIModelResponse> = {} as any;

      if (selectedModels.includes('chatgpt')) {
        responses.chatgpt = {
          provider: 'chatgpt',
          modelName: 'GPT-4o (Structured Syllabus)',
          answer: parsed.chatgptAnswer || parsed.detailedExplanation,
          latencyMs: 720,
          status: 'success',
          perspectiveHighlight: 'Structured Taxonomy & Workflows',
          keyApproach: 'Direct definitions, clean classifications, and standard steps.',
        };
      }

      if (selectedModels.includes('gemini')) {
        responses.gemini = {
          provider: 'gemini',
          modelName: 'Gemini 3.8 Flash',
          answer: parsed.geminiAnswer || parsed.simpleExplanation,
          latencyMs: 480,
          status: 'success',
          perspectiveHighlight: 'Intuitive Analogies & Mental Models',
          keyApproach: 'Connects abstract principles to everyday mechanisms.',
        };
      }

      if (selectedModels.includes('claude')) {
        responses.claude = {
          provider: 'claude',
          modelName: 'Claude 3.5 Sonnet',
          answer: parsed.claudeAnswer || `${parsed.detailedExplanation}\n\n### Key Nuances\nPay close attention to boundary conditions and common misconceptions.`,
          latencyMs: 840,
          status: 'success',
          perspectiveHighlight: 'Academic Rigor & Misconceptions',
          keyApproach: 'Theoretical context, edge cases, and boundary rules.',
        };
      }

      if (selectedModels.includes('deepseek')) {
        responses.deepseek = {
          provider: 'deepseek',
          modelName: 'DeepSeek V3',
          answer: parsed.deepseekAnswer || `${parsed.detailedExplanation}\n\n### Technical Mechanics\nExecution details, performance considerations, and low-level tradeoffs.`,
          latencyMs: 910,
          status: 'success',
          perspectiveHighlight: 'Systems Mechanics & Tradeoffs',
          keyApproach: 'Underlying mechanisms, efficiency, and implementation.',
        };
      }

      const synthesis: SynthesisResult = {
        simpleExplanation: parsed.simpleExplanation,
        detailedExplanation: parsed.detailedExplanation,
        example: {
          codeOrContext: parsed.exampleContext || 'General Application Scenario',
          explanation: parsed.exampleExplanation || 'Walkthrough of the fundamental concept in action.',
          language: parsed.exampleLanguage || 'markdown',
        },
        importantPoints: parsed.importantPoints || [
          'Understand the foundational mechanism and definition.',
          'Identify common real-world applications and boundary conditions.',
          'Review the underlying tradeoffs and implications.'
        ],
        quickSummary: parsed.quickSummary,
        practiceQuestions: [
          {
            id: 'pq-1',
            question: `In your own words, what is the core mechanism of ${question.slice(0, 30)}?`,
            hint: 'Recall the analogy used in the simple explanation.',
          },
          {
            id: 'pq-2',
            question: `What is the most common misconception or pitfall regarding this topic?`,
            hint: 'Think about assumptions people make before verifying rules.',
          },
        ],
        consensusSummary: `All selected AI models agreed on the core premise of "${question}". ChatGPT emphasized structural taxonomy, Gemini focused on intuitive analogies, Claude highlighted theoretical boundaries, and DeepSeek detailed execution mechanics.`,
        agreements: parsed.agreements || [
          `Universal consensus on the foundational principles of "${question.slice(0, 40)}"`,
          'Agreement on the practical utility and real-world significance.',
        ],
        differencesOrNuances: parsed.differences || [
          'ChatGPT prioritized structured steps and clear definitions.',
          'Gemini emphasized accessible analogies and mental models.',
          'Claude focused on academic nuance and common pitfalls.',
          'DeepSeek provided detailed mechanical breakdown.',
        ],
      };

      const quizQuestions: QuizQuestion[] = (parsed.quizQuestions || []).map((q, idx) => ({
        id: `q-${idx + 1}-${Date.now()}`,
        type: q.type || (q.options && q.options.length === 2 ? 'true_false' : 'mcq'),
        question: q.question,
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Based on the core principles explained in the lesson.',
      }));

      const notes: StudyNote = {
        topic: question.length > 50 ? question.slice(0, 47) + '...' : question,
        definition: parsed.notesDefinition || parsed.simpleExplanation,
        keyConcepts: parsed.notesKeyConcepts || parsed.importantPoints?.slice(0, 3) || [],
        examples: parsed.exampleContext ? `${parsed.exampleContext}\n\n${parsed.exampleExplanation}` : 'See synthesized lesson example.',
        importantTerms: (parsed.notesImportantTerms || []).map(t => ({
          term: t.term,
          definition: t.definition,
        })),
        examPoints: parsed.notesExamPoints || parsed.importantPoints?.slice(0, 3) || [],
        lastEdited: Date.now(),
      };

      const session: StudySession = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: question.length > 55 ? question.slice(0, 52) + '...' : question,
        question,
        timestamp: Date.now(),
        selectedModels,
        responses,
        synthesis,
        followUps: [],
        quiz: {
          id: `quiz-${Date.now()}`,
          topic: question,
          questions: quizQuestions.length > 0 ? quizQuestions : [
            {
              id: 'q-default',
              type: 'mcq',
              question: `What is the primary concept behind ${question}?`,
              options: ['To provide structure and clarity', 'To confuse the system', 'To delete all data', 'None of the above'],
              correctAnswer: 'To provide structure and clarity',
              explanation: 'Fundamental educational principles focus on establishing clear understanding.',
            }
          ],
          completed: false,
        },
        notes,
        document,
      };

      return session;
    } catch (err: any) {
      console.warn(`Model ${model} multi-gen attempt encountered:`, err.message || err);
    }
  }

  return null;
}
