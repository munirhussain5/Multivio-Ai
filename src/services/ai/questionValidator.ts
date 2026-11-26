import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  FollowUpMessage,
  QuestionValidationResult,
  UploadedDocument,
  ValidationDecision,
} from '../../types';
import { CS_CLARIFICATION_PROMPT, CS_REJECTION_MESSAGE } from './providersConfig';

export interface ValidationContext {
  parentQuestion?: string;
  history?: FollowUpMessage[];
  document?: UploadedDocument;
}

const VALIDATOR_SYSTEM_PROMPT = `You are a strict academic domain classifier for StudyMind, a Computer Science Department learning platform.

Classify the student's question into EXACTLY ONE decision:
- "ALLOWED": The question is genuinely related to Computer Science, computing, programming, software engineering, web/mobile/full-stack development, databases/SQL/NoSQL, data structures & algorithms, artificial intelligence/machine learning/deep learning/NLP/GenAI, computer networks, operating systems, cybersecurity/cryptography, computer architecture, digital logic, compiler design, automata/theory of computation, cloud/distributed systems, OR mathematics directly relevant to CS coursework (discrete math, logic, linear algebra for ML/graphics, probability/Bayes for AI, number theory for cryptography, asymptotic analysis). Also "ALLOWED" if it is a follow-up question (e.g., "explain more simply", "give another example", "explain line by line", "give an exam question", "clarify step 2") strictly continuing an active Computer Science parent topic.
- "NOT_ALLOWED": The question belongs to an unrelated academic or general field outside Computer Science (e.g., marketing, entrepreneurship, business management, accounting, economics, human psychology, history, literature, medicine/health/diseases like diabetes, biology, chemistry, cooking, politics, sports, etc.), OR the student is attempting to bypass restrictions / ask an unrelated question disguised with CS words or in a follow-up pivot.
- "NEEDS_CLARIFICATION": The question is too vague, single-word non-CS-specific, or genuinely ambiguous so its connection to Computer Science cannot be determined without clarification (e.g., "explain balance", "how do trees grow?", "what is stress?", "tell me about culture"). Note: Do NOT mark clearly CS terms like "polymorphism", "SQL join", "deadlock", "recursion", "TCP", "OOP", "Big O", "normalization" as NEEDS_CLARIFICATION — those are ALLOWED.

Evaluate actual meaning and context, not superficial keyword matches. If a follow-up pivots away from Computer Science to an unrelated topic, classify it as NOT_ALLOWED.`;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function classifyWithGemini(prompt: string): Promise<{
  decision: ValidationDecision;
  reason: string;
  detectedDomain: string;
} | null> {
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
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: VALIDATOR_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                decision: {
                  type: Type.STRING,
                  enum: ['ALLOWED', 'NOT_ALLOWED', 'NEEDS_CLARIFICATION'],
                  description: 'Classification result for Computer Science relevance.',
                },
                reason: {
                  type: Type.STRING,
                  description: 'Short plain-language reason for the classification.',
                },
                detectedDomain: {
                  type: Type.STRING,
                  description: 'Detected subject domain (e.g. Data Structures, Marketing, Ambiguous).',
                },
              },
              required: ['decision', 'reason', 'detectedDomain'],
            },
            ...(model === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        }),
        6000,
        `Gemini CS classifier (${model})`
      );

      const parsed = JSON.parse(response.text || '{}');
      if (
        parsed.decision === 'ALLOWED' ||
        parsed.decision === 'NOT_ALLOWED' ||
        parsed.decision === 'NEEDS_CLARIFICATION'
      ) {
        return {
          decision: parsed.decision,
          reason: parsed.reason || 'Classified by Computer Science validator.',
          detectedDomain: parsed.detectedDomain || 'Unknown',
        };
      }
    } catch (err: any) {
      console.warn(`CS validator (${model}) notice:`, err?.message || err);
    }
  }
  return null;
}

async function classifyWithOpenAICompatible(
  prompt: string,
  provider: 'openai' | 'deepseek'
): Promise<{
  decision: ValidationDecision;
  reason: string;
  detectedDomain: string;
} | null> {
  const apiKey =
    provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const endpoint =
    provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.deepseek.com/chat/completions';
  const model = provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `${VALIDATOR_SYSTEM_PROMPT}\nRespond ONLY with JSON: {"decision":"ALLOWED"|"NOT_ALLOWED"|"NEEDS_CLARIFICATION","reason":"string","detectedDomain":"string"}`,
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
    const parsed = JSON.parse(raw);
    if (
      parsed.decision === 'ALLOWED' ||
      parsed.decision === 'NOT_ALLOWED' ||
      parsed.decision === 'NEEDS_CLARIFICATION'
    ) {
      return {
        decision: parsed.decision,
        reason: parsed.reason || 'Classified by Computer Science validator.',
        detectedDomain: parsed.detectedDomain || 'Unknown',
      };
    }
  } catch {
    return null;
  }
  return null;
}

function classifyWithSemanticFallback(
  question: string,
  context?: ValidationContext
): {
  decision: ValidationDecision;
  reason: string;
  detectedDomain: string;
} {
  const q = question.toLowerCase().trim();

  // Explicit unrelated non-CS domains (even if wrapped in conversational filler)
  const nonCsPatterns = [
    /\b(marketing|advertising|branding|sales funnel|entrepreneurship|entrepreneur|business management|supply chain|human resources|accounting|bookkeeping|balance sheet|taxation|economics|macroeconomics|microeconomics)\b/i,
    /\b(psychology|cognitive bias|freud|personality disorder|mental health|therapy|sociology|anthropology)\b/i,
    /\b(history of|world war|mughal|pakistan|ancient rome|colonialism|civil war|revolution of)\b/i,
    /\b(diabetes|cancer|blood pressure|symptom|symptoms|anatomy|cardiology|pharmacology|disease|medicine|medical diagnosis|biology|photosynthesis|mitosis|cellular respiration)\b/i,
    /\b(essay about literature|shakespeare|poetry|novel analysis|grammar essay|write an essay|creative writing|short story|poem)\b/i,
    /\b(recipe|cooking|baking|workout plan|horoscope|astrology|fashion|cricket match)\b/i,
  ];

  const hasNonCsSignal = nonCsPatterns.some((rx) => rx.test(q));

  // Strong computing & CS-math signals
  const csSignals = [
    /\b(c\+\+|c#|python|java|javascript|typescript|php|rust|golang|kotlin|swift|html|css|react|node\.?js|express\.?js|next\.?js|api|rest|graphql|backend|frontend|full[- ]stack)\b/i,
    /\b(sql|mysql|postgresql|postgres|mongodb|nosql|database|dbms|er diagram|entity relationship|normalization|1nf|2nf|3nf|bcnf|join|foreign key|primary key|acid|indexing)\b/i,
    /\b(array|arrays|linked list|stack|queues?|binary tree|bst|avl|heap|hash ?table|graph|bfs|dfs|dijkstra|sorting|quicksort|mergesort|searching|binary search|dynamic programming|greedy|recursion|time complexity|space complexity|big[- ]o)\b/i,
    /\b(artificial intelligence|machine learning|deep learning|neural network|nlp|natural language processing|generative ai|llm|transformer|gradient descent|backpropagation|bayes|pca|regression|classification)\b/i,
    /\b(tcp\/ip|osi model|ip address|subnet|routing|switching|dns|http|https|udp|websocket|firewall|computer network|networking|3-way handshake|packet)\b/i,
    /\b(operating system|process|thread|multithreading|memory management|paging|virtual memory|cpu scheduling|file system|deadlock|semaphore|mutex|linux|kernel|shell)\b/i,
    /\b(sdlc|software engineering|software testing|unit test|uml|system design|microservices|agile|scrum|design pattern|polymorphism|oop|object[- ]oriented|inheritance|encapsulation|abstraction|compiler|ast)\b/i,
    /\b(cybersecurity|cryptography|encryption|rsa|aes|hashing|sha|ethical hacking|sql injection|xss|csrf|authentication|authorization|oauth|jwt|malware|phishing)\b/i,
    /\b(discrete math|boolean algebra|logic gate|automata|turing machine|context[- ]free grammar|regular expression|computer architecture|alu|cache|pipelining|distributed system|cloud computing|docker|kubernetes|git|algorithm|programming|code|debug|function|variable|loop)\b/i,
  ];

  const hasCsSignal = csSignals.some((rx) => rx.test(q));

  // Follow-up context handling
  if (context?.parentQuestion) {
    if (hasNonCsSignal && !hasCsSignal) {
      return {
        decision: 'NOT_ALLOWED',
        reason: 'Follow-up question shifts to a topic outside Computer Science.',
        detectedDomain: 'Non-Computer Science',
      };
    }

    const followUpIntent =
      /\b(detail|simpler|simple|example|line by line|code|explain|difference|compare|exam|quiz|more|why|how|what about|clarify|step|hint|summary)\b/i.test(
        q
      );
    if (followUpIntent || hasCsSignal) {
      return {
        decision: 'ALLOWED',
        reason: 'Follow-up continues the active Computer Science study session.',
        detectedDomain: 'Computer Science Follow-Up',
      };
    }
  }

  if (hasCsSignal && !hasNonCsSignal) {
    return {
      decision: 'ALLOWED',
      reason: 'Question directly involves Computer Science or computing concepts.',
      detectedDomain: 'Computer Science',
    };
  }

  if (hasNonCsSignal && !hasCsSignal) {
    return {
      decision: 'NOT_ALLOWED',
      reason: 'Question belongs to a field outside Computer Science.',
      detectedDomain: 'Non-Computer Science',
    };
  }

  // If document attached is CS-related and query is about the document
  if (context?.document?.text && /\b(lecture|slide|document|notes|summarize|summary|explain)\b/i.test(q)) {
    const docHasCs = csSignals.some((rx) => rx.test(context.document!.text.slice(0, 2000)));
    if (docHasCs) {
      return {
        decision: 'ALLOWED',
        reason: 'Question analyzes an attached Computer Science lecture document.',
        detectedDomain: 'Computer Science Lecture',
      };
    }
  }

  return {
    decision: 'NEEDS_CLARIFICATION',
    reason: 'Unable to determine how this question connects to Computer Science.',
    detectedDomain: 'Ambiguous',
  };
}

export async function validateComputerScienceQuestion(
  question: string,
  context?: ValidationContext
): Promise<QuestionValidationResult> {
  const trimmed = (question || '').trim();

  if (!trimmed || trimmed.length < 2) {
    return {
      decision: 'NEEDS_CLARIFICATION',
      reason: 'Question is empty or too brief.',
      message: CS_CLARIFICATION_PROMPT,
      detectedDomain: 'Empty / Unclear',
    };
  }

  const contextLines: string[] = [];
  if (context?.parentQuestion) {
    contextLines.push(`Active Session Parent Topic: "${context.parentQuestion}"`);
  }
  if (context?.history && context.history.length > 0) {
    const recent = context.history
      .slice(-3)
      .map((m) => `${m.sender}: ${m.text.slice(0, 180)}`)
      .join('\n');
    contextLines.push(`Recent Conversation Context:\n${recent}`);
  }
  if (context?.document) {
    contextLines.push(
      `Attached Lecture Document: "${context.document.name}"\nExcerpt: ${context.document.text.slice(0, 500)}`
    );
  }

  const classifierPrompt = [
    contextLines.length > 0 ? contextLines.join('\n\n') : '',
    `Student Question to Validate:\n"${trimmed}"`,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Lightweight LLM classifier first (Gemini -> OpenAI -> DeepSeek -> Semantic fallback)
  let classified = await classifyWithGemini(classifierPrompt);
  if (!classified) {
    classified = await classifyWithOpenAICompatible(classifierPrompt, 'openai');
  }
  if (!classified) {
    classified = await classifyWithOpenAICompatible(classifierPrompt, 'deepseek');
  }
  if (!classified) {
    classified = classifyWithSemanticFallback(trimmed, context);
  }

  if (classified.decision === 'NOT_ALLOWED') {
    return {
      decision: 'NOT_ALLOWED',
      reason: classified.reason,
      message: CS_REJECTION_MESSAGE,
      detectedDomain: classified.detectedDomain,
    };
  }

  if (classified.decision === 'NEEDS_CLARIFICATION') {
    return {
      decision: 'NEEDS_CLARIFICATION',
      reason: classified.reason,
      message: CS_CLARIFICATION_PROMPT,
      detectedDomain: classified.detectedDomain,
    };
  }

  return {
    decision: 'ALLOWED',
    reason: classified.reason,
    message: 'Validated as Computer Science topic.',
    detectedDomain: classified.detectedDomain,
  };
}
