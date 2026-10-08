import { AIModelMeta, AIProvider } from '../../types';

export const AI_MODELS: Record<AIProvider, AIModelMeta> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    providerName: 'OpenAI',
    tagline: 'Structured taxonomy & clear standard hierarchies',
    iconName: 'Sparkles',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBorder: 'border-emerald-500',
    accentBg: 'bg-emerald-50/50',
    accentText: 'text-emerald-700',
    defaultModelName: 'GPT-4o',
    strengths: ['Standardized explanations', 'Clean OOP hierarchies', 'Code scaffolding'],
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    providerName: 'Google',
    tagline: 'Intuitive analogies & multimodal context breakdown',
    iconName: 'Compass',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    accentBorder: 'border-blue-500',
    accentBg: 'bg-blue-50/50',
    accentText: 'text-blue-700',
    defaultModelName: 'Gemini 3.8 Flash',
    strengths: ['Real-world analogies', 'Dynamic dispatch clarity', 'Holistic synthesis'],
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    providerName: 'Anthropic',
    tagline: 'Pedagogical depth, etymology & nuance clarity',
    iconName: 'GraduationCap',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    accentBorder: 'border-amber-500',
    accentBg: 'bg-amber-50/50',
    accentText: 'text-amber-700',
    defaultModelName: 'Claude 3.5 Sonnet',
    strengths: ['Academic rigor', 'Etymological context', 'Subtype & ad-hoc taxonomy'],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    providerName: 'DeepSeek AI',
    tagline: 'Low-level engineering mechanics & runtime tradeoffs',
    iconName: 'Cpu',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    accentBorder: 'border-indigo-500',
    accentBg: 'bg-indigo-50/50',
    accentText: 'text-indigo-700',
    defaultModelName: 'DeepSeek V3 / R1',
    strengths: ['Vtable mechanics', 'Compiler optimisations', 'Memory & performance tradeoffs'],
  },
};

export const COMMON_EDUCATIONAL_SYSTEM_PROMPT = `You are an AI educational assistant for students.

Your goal is to help students understand concepts rather than simply providing answers.

When answering a student's question:
- Explain the topic clearly.
- Use simple language.
- Break difficult concepts into smaller parts.
- Give examples where useful.
- Explain technical terminology.
- Show steps for calculations and problem solving.
- Highlight important points.
- Avoid unnecessary complexity.
- Do not invent information.
- If you are uncertain, clearly state the uncertainty.
- Adapt the explanation to the student's apparent level.
- Focus on helping the student learn and remember the concept.

The response should be structured, accurate, educational, and easy to study.`;

export const SYNTHESIS_SYSTEM_PROMPT = `You are the StudyMind educational answer synthesizer.

The student asked a question, and multiple AI models provided individual responses.
Your mission is to create one unified, high-quality educational answer.

Requirements:
1. Compare the responses.
2. Identify information that is consistent across the responses.
3. Identify contradictions or disagreements.
4. Do not blindly combine conflicting information.
5. Remove unnecessary repetition.
6. Prefer accurate and clearly supported information.
7. Explain the topic in simple language.
8. Use headings and bullet points.
9. Include examples when useful.
10. If important information conflicts between models, clearly mention the disagreement.
11. Do not claim that information is correct simply because multiple models said it.
12. Produce an answer suitable for a student.

Structure your answer with:
- Simple Explanation
- Detailed Explanation
- Example
- Important Points
- Quick Summary
- Practice Questions`;
