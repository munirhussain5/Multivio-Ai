import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { AIModelResponse, AIProvider, StudySession, SynthesisResult } from './types';
import { PROVIDER_REGISTRY, queryProvidersConcurrently } from './services/ai/providerRegistry';
import { synthesizeAnswers } from './services/ai/synthesizer';
import { validateComputerScienceQuestion } from './services/ai/questionValidator';
import {
  generateCSFollowUp,
  generateCSNotes,
  generateCSQuiz,
} from './services/ai/csToolsGenerator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function buildPartialSynthesisFallback(
  question: string,
  responses: Record<AIProvider, AIModelResponse>
): SynthesisResult {
  const succeeded = Object.values(responses).filter(
    (r) => r && r.status === 'success' && r.answer.trim().length > 0
  );
  const failed = Object.values(responses).filter((r) => r && r.status !== 'success');

  const first = succeeded[0];
  const combinedText = succeeded
    .map((r) => `### ${r.modelName}\n${r.answer}`)
    .join('\n\n---\n\n');

  return {
    simpleExplanation: first
      ? `Showing direct verified response from ${first.modelName} for "${question}". Review the detailed breakdown below.`
      : 'Partial AI results received.',
    detailedExplanation: combinedText,
    example: {
      codeOrContext: '',
      explanation: 'See the code and examples provided directly inside the AI model answer(s) above.',
      language: 'markdown',
    },
    importantPoints: succeeded.map(
      (r) => `${r.modelName} responded in ${(r.latencyMs / 1000).toFixed(2)}s.`
    ),
    commonMistakes: [],
    quickSummary: `Received ${succeeded.length} live AI response(s)${
      failed.length > 0 ? ` (${failed.length} provider(s) unavailable or failed)` : ''
    }. Cross-model synthesis could not run automatically, so raw verified model answers are displayed.`,
    practiceQuestions: [],
    consensusSummary: `${succeeded.length} of ${Object.keys(responses).length} selected AI provider(s) succeeded.`,
    agreements: [],
    differencesOrNuances: failed.map(
      (f) => `${f.modelName}: ${f.error || 'Unavailable'}`
    ),
  };
}

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Provider configuration status (never leaks secret keys)
  app.get('/api/providers/status', (_req: Request, res: Response) => {
    const chatgpt = PROVIDER_REGISTRY.chatgpt.isConfigured();
    const gemini = PROVIDER_REGISTRY.gemini.isConfigured();
    const claude = PROVIDER_REGISTRY.claude.isConfigured();
    const deepseek = PROVIDER_REGISTRY.deepseek.isConfigured();

    res.json({
      chatgpt,
      gemini,
      claude,
      deepseek,
      anyLiveProvider: chatgpt || gemini || claude || deepseek,
      supabase: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      supabaseProjectId: 'uxjlcvmgdnrvbwiczvgx',
    });
  });

  // Standalone CS-only question validation endpoint
  app.post('/api/validate-question', async (req: Request, res: Response) => {
    try {
      const { question, parentQuestion, history, document } = req.body || {};
      if (!question || typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: 'Please enter a Computer Science question.' });
        return;
      }

      const validation = await validateComputerScienceQuestion(question.trim(), {
        parentQuestion,
        history,
        document,
      });
      res.json(validation);
    } catch (err: any) {
      console.error('API /api/validate-question error:', err);
      res.status(500).json({ error: err.message || 'Validation error' });
    }
  });

  // Main study endpoint: validates CS domain BEFORE querying providers concurrently & synthesizing
  app.post('/api/study', async (req: Request, res: Response) => {
    try {
      const { question, models = ['chatgpt', 'gemini', 'claude', 'deepseek'], document } = req.body || {};

      const effectiveQuestion =
        question && typeof question === 'string' && question.trim()
          ? question.trim()
          : document?.name
            ? `Explain, analyze, and summarize the Computer Science concepts in lecture: ${document.name}`
            : '';

      if (!effectiveQuestion) {
        res.status(400).json({ error: 'Please enter a Computer Science question or attach a lecture document.' });
        return;
      }

      // 1. Validate Computer Science relevance BEFORE calling any AI providers
      const validation = await validateComputerScienceQuestion(effectiveQuestion, { document });
      if (validation.decision !== 'ALLOWED') {
        res.json({
          rejected: true,
          validation,
        });
        return;
      }

      const validProviders: AIProvider[] = ['chatgpt', 'gemini', 'claude', 'deepseek'];
      const selectedModels: AIProvider[] =
        Array.isArray(models) && models.length > 0
          ? models.filter((m): m is AIProvider => validProviders.includes(m))
          : validProviders;

      const modelsToQuery: AIProvider[] =
        selectedModels.length > 0 ? selectedModels : validProviders;

      const promptForLiveAI = document?.text
        ? `${effectiveQuestion}\n\n[Context from attached lecture document: "${document.name}"]:\n${document.text.slice(0, 8000)}`
        : effectiveQuestion;

      // 2. Query every selected provider independently in parallel
      const responses = await queryProvidersConcurrently(
        modelsToQuery,
        promptForLiveAI,
        Boolean(document)
      );

      const successfulResponses = Object.values(responses).filter(
        (r) => r && r.status === 'success' && r.answer.trim().length > 0
      );

      if (successfulResponses.length === 0) {
        res.status(503).json({
          error:
            'No selected AI model could generate an answer. Ensure at least one provider API key (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY) is configured and valid on the server.',
          allProvidersFailed: true,
          responses,
        });
        return;
      }

      // 3. Synthesize real responses + generate quiz & notes concurrently
      const withOptionalTimeout = <T>(p: Promise<T | null>, ms = 15000): Promise<T | null> =>
        Promise.race([
          p.catch(() => null),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
        ]);

      const [synthesized, generatedQuiz, generatedNotes] = await Promise.all([
        synthesizeAnswers(effectiveQuestion, responses),
        withOptionalTimeout(generateCSQuiz(effectiveQuestion, { count: 5 }), 25000),
        withOptionalTimeout(generateCSNotes(effectiveQuestion), 25000),
      ]);

      const synthesis = synthesized || buildPartialSynthesisFallback(effectiveQuestion, responses);

      const session: StudySession = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title:
          effectiveQuestion.length > 55
            ? effectiveQuestion.slice(0, 52) + '...'
            : effectiveQuestion,
        question: effectiveQuestion,
        timestamp: Date.now(),
        selectedModels: modelsToQuery,
        responses,
        synthesis,
        followUps: [],
        quiz: generatedQuiz || undefined,
        notes: generatedNotes || undefined,
        document: document || undefined,
      };

      res.json(session);
    } catch (err: any) {
      console.error('API /api/study error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // Follow-up chat endpoint (validates CS scope on follow-ups too)
  app.post('/api/followup', async (req: Request, res: Response) => {
    try {
      const { session, message, history = [] } = req.body || {};
      if (!session || !message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Session and a non-empty follow-up question are required.' });
        return;
      }

      const trimmedMessage = message.trim();

      // Validate Computer Science scope for follow-up questions
      const validation = await validateComputerScienceQuestion(trimmedMessage, {
        parentQuestion: session.question,
        history,
      });

      if (validation.decision !== 'ALLOWED') {
        res.json({
          rejected: true,
          validation,
          reply: validation.message,
          timestamp: Date.now(),
        });
        return;
      }

      const reply = await generateCSFollowUp(session, trimmedMessage, history);
      if (!reply) {
        res.status(503).json({
          error:
            'Unable to generate a follow-up response. Ensure a backend AI provider key is configured and reachable.',
        });
        return;
      }

      res.json({
        rejected: false,
        reply,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('API /api/followup error:', err);
      res.status(500).json({ error: err.message || 'Follow-up request failed.' });
    }
  });

  // Custom CS Quiz generator endpoint
  app.post('/api/quiz/generate', async (req: Request, res: Response) => {
    try {
      const { topic, question, count = 5, questionTypes, contextSummary } = req.body || {};
      const targetTopic = (topic || question || '').trim();

      if (!targetTopic) {
        res.status(400).json({ error: 'Please enter a Computer Science quiz topic.' });
        return;
      }

      const validation = await validateComputerScienceQuestion(targetTopic);
      if (validation.decision !== 'ALLOWED') {
        res.json({
          rejected: true,
          validation,
        });
        return;
      }

      const quiz = await generateCSQuiz(targetTopic, {
        count: Number(count) || 5,
        questionTypes,
        contextSummary,
      });

      if (!quiz) {
        res.status(503).json({
          error:
            'Could not generate quiz questions. Please verify your backend AI API key configuration.',
        });
        return;
      }

      res.json(quiz);
    } catch (err: any) {
      console.error('API /api/quiz/generate error:', err);
      res.status(500).json({ error: err.message || 'Quiz generation failed.' });
    }
  });

  // CS Study Notes generator endpoint
  app.post('/api/notes/generate', async (req: Request, res: Response) => {
    try {
      const { topic, question, synthesis } = req.body || {};
      const targetTopic = (topic || question || '').trim();

      if (!targetTopic) {
        res.status(400).json({ error: 'Please enter a Computer Science topic for study notes.' });
        return;
      }

      const validation = await validateComputerScienceQuestion(targetTopic);
      if (validation.decision !== 'ALLOWED') {
        res.json({
          rejected: true,
          validation,
        });
        return;
      }

      const notes = await generateCSNotes(targetTopic, synthesis);
      if (!notes) {
        res.status(503).json({
          error:
            'Could not generate study notes. Please verify your backend AI API key configuration.',
        });
        return;
      }

      res.json(notes);
    } catch (err: any) {
      console.error('API /api/notes/generate error:', err);
      res.status(500).json({ error: err.message || 'Notes generation failed.' });
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
    console.log(`Multivio / StudyMind CS server running on port ${PORT}`);
  });
}
