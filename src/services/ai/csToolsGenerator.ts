import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  FollowUpMessage,
  QuizData,
  QuizQuestion,
  QuizType,
  StudyNote,
  StudySession,
  SynthesisResult,
} from '../../types';
import { COMMON_EDUCATIONAL_SYSTEM_PROMPT } from './providersConfig';

export interface QuizGenerationOptions {
  count?: number;
  questionTypes?: QuizType[];
  contextSummary?: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.trim() || key === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey: key.trim(),
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 14000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callConfiguredLLMText(
  systemInstruction: string,
  userPrompt: string
): Promise<string | null> {
  const ai = getGeminiClient();
  if (ai) {
    for (const model of ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']) {
      try {
        const res = await withTimeout(
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              ...(model === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
            },
          }),
          14000,
          `Gemini text (${model})`
        );
        if (res.text?.trim()) return res.text.trim();
      } catch (err: any) {
        console.warn(`LLM text call on Gemini (${model}) failed:`, err?.message || err);
      }
    }
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const res = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt },
            ],
          }),
        },
        14000
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      // continue to next provider
    }
  }

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    try {
      const res = await fetchWithTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY.trim(),
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            max_tokens: 1800,
            system: systemInstruction,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        },
        14000
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch {
      // continue to next provider
    }
  }

  if (process.env.DEEPSEEK_API_KEY?.trim()) {
    try {
      const res = await fetchWithTimeout(
        'https://api.deepseek.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt },
            ],
          }),
        },
        14000
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      // return null
    }
  }

  return null;
}

async function callConfiguredLLMJson<T>(
  systemInstruction: string,
  userPrompt: string,
  geminiSchema?: any
): Promise<T | null> {
  const ai = getGeminiClient();
  if (ai) {
    for (const model of ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']) {
      try {
        const res = await withTimeout(
          ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              ...(model === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              ...(geminiSchema ? { responseSchema: geminiSchema } : {}),
            },
          }),
          14000,
          `Gemini JSON (${model})`
        );
        if (res.text?.trim()) {
          return JSON.parse(res.text.trim()) as T;
        }
      } catch (err: any) {
        console.warn(`LLM JSON call on Gemini (${model}) failed:`, err?.message || err);
      }
    }
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const res = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: `${systemInstruction}\nRespond ONLY with valid JSON.` },
              { role: 'user', content: userPrompt },
            ],
          }),
        },
        14000
      );
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.trim();
        if (raw) return JSON.parse(raw) as T;
      }
    } catch {
      // continue
    }
  }

  if (process.env.DEEPSEEK_API_KEY?.trim()) {
    try {
      const res = await fetchWithTimeout(
        'https://api.deepseek.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: `${systemInstruction}\nRespond ONLY with valid JSON.` },
              { role: 'user', content: userPrompt },
            ],
          }),
        },
        14000
      );
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.trim();
        if (raw) return JSON.parse(raw) as T;
      }
    } catch {
      // continue
    }
  }

  return null;
}

export async function generateCSQuiz(
  topic: string,
  options: QuizGenerationOptions = {}
): Promise<QuizData | null> {
  const count = Math.min(Math.max(options.count || 5, 1), 10);
  const requestedTypes =
    options.questionTypes && options.questionTypes.length > 0
      ? options.questionTypes
      : (['mcq', 'true_false', 'conceptual', 'programming', 'short_answer'] as QuizType[]);

  const prompt = `Create a Computer Science quiz with ${count} questions on the topic:
"${topic}"

${options.contextSummary ? `Lesson context:\n${options.contextSummary.slice(0, 2500)}\n` : ''}
Allowed question types for this quiz: ${requestedTypes.join(', ')}.
Requirements:
- All questions must be strictly Computer Science / computing questions.
- Every question MUST include an educational "explanation" explaining why the correct answer is right.
- For "mcq", include exactly 4 options in "options".
- For "true_false", set "options" to ["True", "False"].
- For "short_answer", "conceptual", or "programming", omit "options" (or leave empty) and put a clear concise expected answer in "correctAnswer". For "programming" questions, include small code output/logic tracing or snippet completion.

Return JSON with shape:
{
  "topic": string,
  "questions": [
    {
      "id": string,
      "type": "mcq" | "true_false" | "short_answer" | "conceptual" | "programming",
      "question": string,
      "options": string[],
      "correctAnswer": string,
      "explanation": string
    }
  ]
}`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: {
              type: Type.STRING,
              enum: ['mcq', 'true_false', 'short_answer', 'conceptual', 'programming'],
            },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ['type', 'question', 'correctAnswer', 'explanation'],
        },
      },
    },
    required: ['topic', 'questions'],
  };

  const payload = await callConfiguredLLMJson<{ topic?: string; questions?: any[] }>(
    COMMON_EDUCATIONAL_SYSTEM_PROMPT,
    prompt,
    schema
  );

  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return null;
  }

  const questions: QuizQuestion[] = payload.questions.map((q, idx) => {
    const qType: QuizType =
      q.type === 'mcq' ||
      q.type === 'true_false' ||
      q.type === 'short_answer' ||
      q.type === 'conceptual' ||
      q.type === 'programming'
        ? q.type
        : q.options?.length === 2
          ? 'true_false'
          : q.options?.length >= 3
            ? 'mcq'
            : 'short_answer';

    return {
      id: q.id || `q-${idx + 1}-${Date.now()}`,
      type: qType,
      question: q.question,
      options:
        qType === 'mcq' || qType === 'true_false'
          ? q.options && q.options.length > 0
            ? q.options
            : qType === 'true_false'
              ? ['True', 'False']
              : ['Option A', 'Option B', 'Option C', 'Option D']
          : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  });

  return {
    id: `quiz-${Date.now()}`,
    topic: payload.topic || topic,
    questions,
    completed: false,
  };
}

export async function generateCSNotes(
  topic: string,
  synthesis?: SynthesisResult
): Promise<StudyNote | null> {
  const prompt = `Create compact Computer Science revision study notes for:
"${topic}"

${
  synthesis
    ? `Use this verified lesson synthesis for grounding:
Simple Explanation: ${synthesis.simpleExplanation}
Detailed Explanation: ${synthesis.detailedExplanation.slice(0, 1500)}
Example: ${synthesis.example?.codeOrContext || ''}`
    : ''
}

Return JSON with:
- "topic": concise CS topic title
- "definition": clear 1-2 sentence foundational definition
- "keyConcepts": 3-4 concise CS bullet summaries
- "examples": practical code or technical example walkthrough
- "importantTerms": 3-4 objects { "term": string, "definition": string }
- "examPoints": 3-4 high-yield Computer Science exam points`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      definition: { type: Type.STRING },
      keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
      examples: { type: Type.STRING },
      importantTerms: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
          required: ['term', 'definition'],
        },
      },
      examPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['topic', 'definition', 'keyConcepts', 'examples', 'importantTerms', 'examPoints'],
  };

  const payload = await callConfiguredLLMJson<any>(
    COMMON_EDUCATIONAL_SYSTEM_PROMPT,
    prompt,
    schema
  );

  if (!payload || !payload.definition) return null;

  return {
    topic: payload.topic || (topic.length > 60 ? topic.slice(0, 57) + '...' : topic),
    definition: payload.definition,
    keyConcepts: Array.isArray(payload.keyConcepts) ? payload.keyConcepts : [],
    examples: payload.examples || '',
    importantTerms: Array.isArray(payload.importantTerms) ? payload.importantTerms : [],
    examPoints: Array.isArray(payload.examPoints) ? payload.examPoints : [],
    lastEdited: Date.now(),
  };
}

export async function generateCSFollowUp(
  session: StudySession,
  userMessage: string,
  history: FollowUpMessage[] = []
): Promise<string | null> {
  const historyContext = history
    .slice(-6)
    .map((h) => `${h.sender === 'student' ? 'Student' : 'Tutor'}: ${h.text}`)
    .join('\n\n');

  const isDetailRequest =
    /\b(detail|compare|all ai|all model|in depth|deep|format)\b/i.test(userMessage);

  const modelSnippets = Object.values(session.responses || {})
    .filter((r) => r && r.status === 'success' && r.answer)
    .map((r) => `=== ${r.modelName} ===\n${r.answer.slice(0, 800)}`)
    .join('\n\n');

  const prompt = isDetailRequest
    ? `Active Computer Science Topic: "${session.question}"

Synthesized Summary:
${session.synthesis?.simpleExplanation || ''}

Individual AI Model Responses:
${modelSnippets}

Recent Follow-up Conversation:
${historyContext || 'None'}

Student Request: "${userMessage}"

Provide a thorough, easy-to-follow Computer Science answer in basic English using these sections where appropriate:
## Simple Explanation
## Detailed Explanation
## How It Works
## Code Example
## Important Points
## Quick Summary
## Practice Questions`
    : `Active Computer Science Topic: "${session.question}"

Lesson Context Summary:
${session.synthesis?.quickSummary || session.synthesis?.simpleExplanation || ''}

Recent Conversation History:
${historyContext || 'None'}

Student's Follow-up Question:
"${userMessage}"

Answer clearly in basic English for a Computer Science student. Remember the full conversation context above. If the student asks for simpler terms, line-by-line code explanation, another example, comparison between two CS concepts, or an exam-style question, deliver that directly.`;

  return callConfiguredLLMText(COMMON_EDUCATIONAL_SYSTEM_PROMPT, prompt);
}
