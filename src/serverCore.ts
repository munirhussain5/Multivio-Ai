import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { AIModelResponse, AIProvider, StudySession } from './types';
import { queryGemini } from './services/ai/gemini';
import { queryOpenAI } from './services/ai/openai';
import { queryClaude } from './services/ai/claude';
import { queryDeepSeek } from './services/ai/deepseek';
import { synthesizeAnswers } from './services/ai/synthesizer';
import { generateLiveEducationalSession, generateLiveFollowUp } from './services/ai/geminiMultiGenerator';
import { generateEducationalResponse, generateFollowUpAnswer } from './services/ai/mockGenerator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Check providers status
  app.get('/api/providers/status', (_req: Request, res: Response) => {
    res.json({
      chatgpt: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      supabase: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      supabaseProjectId: 'uxjlcvmgdnrvbwiczvgx',
      isDemoModeSupported: true,
    });
  });

  // Main study endpoint: queries models concurrently & synthesizes
  app.post('/api/study', async (req: Request, res: Response) => {
    try {
      const { question, models = ['chatgpt', 'gemini', 'claude', 'deepseek'], document } = req.body;
      
      const effectiveQuestion = (question && typeof question === 'string' && question.trim()) 
        ? question.trim() 
        : (document?.name ? `Explain, analyze, and summarize key concepts from lecture: ${document.name}` : '');

      if (!effectiveQuestion) {
        res.status(400).json({ error: 'A question or an attached document is required' });
        return;
      }

      const selectedModels: AIProvider[] = Array.isArray(models) && models.length > 0 
        ? models 
        : ['chatgpt', 'gemini', 'claude', 'deepseek'];

      // 1. Primary: Generate full, tailored live study session using Google Gemini API
      try {
        const liveSession = await generateLiveEducationalSession(
          effectiveQuestion,
          selectedModels,
          document
        );
        if (liveSession) {
          res.json(liveSession);
          return;
        }
      } catch (liveErr) {
        console.warn('Live multi-session generation notice:', liveErr);
      }

      // Always prepare baseline educational responses with document integration
      const baseline = generateEducationalResponse(effectiveQuestion, selectedModels, document);

      const promptForLiveAI = document?.text 
        ? `${effectiveQuestion}\n\n[Context from attached lecture document: "${document.name}"]:\n${document.text.slice(0, 8000)}` 
        : effectiveQuestion;

      // Concurrently query available live APIs with 10s timeout
      const modelPromises = selectedModels.map(async (provider): Promise<AIModelResponse> => {
        const timeoutPromise = new Promise<AIModelResponse>((resolve) => {
          setTimeout(() => {
            // If live provider times out or isn't configured, use baseline
            resolve(baseline.responses[provider]);
          }, 10000);
        });

        const queryPromise = (async (): Promise<AIModelResponse> => {
          try {
            if (provider === 'gemini') {
              const res = await queryGemini(promptForLiveAI);
              if (res.answer) {
                return {
                  provider: 'gemini',
                  modelName: res.modelName,
                  answer: res.answer,
                  latencyMs: res.latencyMs,
                  status: 'success',
                  perspectiveHighlight: document ? 'Contextual Grounding on Attached Lecture' : 'Intuitive Analogies & Contextual Grounding',
                  keyApproach: 'Relates abstract logic to real-world mechanisms.',
                };
              }
            } else if (provider === 'chatgpt') {
              const res = await queryOpenAI(promptForLiveAI);
              if (res.answer) {
                return {
                  provider: 'chatgpt',
                  modelName: res.modelName,
                  answer: res.answer,
                  latencyMs: res.latencyMs,
                  status: 'success',
                  perspectiveHighlight: document ? 'Syllabus & Lecture Structural Breakdown' : 'Structured Hierarchy & Taxonomy',
                  keyApproach: 'Direct definitions, clean classifications, and code steps.',
                };
              }
            } else if (provider === 'claude') {
              const res = await queryClaude(question);
              if (res.answer) {
                return {
                  provider: 'claude',
                  modelName: res.modelName,
                  answer: res.answer,
                  latencyMs: res.latencyMs,
                  status: 'success',
                  perspectiveHighlight: 'Pedagogical Rigor & Nuance',
                  keyApproach: 'Theoretical context, common misconceptions, and contract rules.',
                };
              }
            } else if (provider === 'deepseek') {
              const res = await queryDeepSeek(question);
              if (res.answer) {
                return {
                  provider: 'deepseek',
                  modelName: res.modelName,
                  answer: res.answer,
                  latencyMs: res.latencyMs,
                  status: 'success',
                  perspectiveHighlight: 'Low-Level Systems & Complexity',
                  keyApproach: 'CPU/memory layout, execution overhead, and performance tradeoffs.',
                };
              }
            }
          } catch (e: any) {
            console.error(`Error querying provider ${provider}:`, e);
          }
          // Fall back gracefully to high-quality educational baseline
          return baseline.responses[provider];
        })();

        return Promise.race([queryPromise, timeoutPromise]);
      });

      const responsesArray = await Promise.all(modelPromises);
      const responses: Record<AIProvider, AIModelResponse> = {} as any;
      responsesArray.forEach((r) => {
        responses[r.provider] = r;
      });

      // Synthesize answers with 6s timeout race
      const synthTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
      let synthesis = await Promise.race([
        synthesizeAnswers(effectiveQuestion, responses),
        synthTimeout,
      ]);
      if (!synthesis) {
        synthesis = baseline.synthesis;
      }

      const session: StudySession = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: question.length > 50 ? question.slice(0, 47) + '...' : question,
        question,
        timestamp: Date.now(),
        selectedModels,
        responses,
        synthesis,
        followUps: [],
        quiz: {
          id: `quiz-${Date.now()}`,
          topic: question,
          questions: baseline.quizQuestions,
          completed: false,
        },
        notes: baseline.notes,
      };

      res.json(session);
    } catch (err: any) {
      console.error('API /api/study error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Follow-up chat endpoint
  app.post('/api/followup', async (req: Request, res: Response) => {
    try {
      const { session, message, history = [] } = req.body;
      if (!session || !message) {
        res.status(400).json({ error: 'Session and message are required' });
        return;
      }

      let reply: string | null = null;
      try {
        reply = await generateLiveFollowUp(session, message, history);
      } catch (liveErr) {
        console.warn('Live follow-up generation failed, falling back:', liveErr);
      }

      if (!reply) {
        reply = generateFollowUpAnswer(session, message, history);
      }

      res.json({
        reply,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Quiz generator endpoint
  app.post('/api/quiz/generate', (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      const baseline = generateEducationalResponse(question || 'Object-Oriented Programming', ['gemini']);
      res.json({
        id: `quiz-${Date.now()}`,
        topic: question || 'Concept Quiz',
        questions: baseline.quizQuestions,
        completed: false,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Notes generator endpoint
  app.post('/api/notes/generate', (req: Request, res: Response) => {
    try {
      const { question } = req.body;
      const baseline = generateEducationalResponse(question || 'Object-Oriented Programming', ['gemini']);
      res.json(baseline.notes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Frontend integration via Vite
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(projectRoot, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(projectRoot, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Multivio server running on port ${PORT}`);
  });
}
