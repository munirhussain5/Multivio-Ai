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
    defaultModelName: 'Gemini 4 Hydrogen',
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
    defaultModelName: 'DeepSeek V3',
    strengths: ['Vtable mechanics', 'Compiler optimisations', 'Memory & performance tradeoffs'],
  },
};

export const CS_REJECTION_MESSAGE =
  'Sorry! StudyMind is designed specifically for Computer Science students. I can only answer questions related to Computer Science and computing subjects. Please enter a computing-related question.';

export const CS_CLARIFICATION_PROMPT =
  'Your question is a bit unclear or ambiguous. Could you please explain how it relates to Computer Science or a computing subject (for example: programming, databases, algorithms, networking, operating systems, cybersecurity, or AI)?';

export const COMMON_EDUCATIONAL_SYSTEM_PROMPT = `You are an AI educational assistant working inside StudyMind, a platform designed specifically for Computer Science students.

Your job is to explain Computer Science and computing-related topics.

You must only answer questions related to Computer Science, programming, software development, databases, algorithms, networking, cybersecurity, artificial intelligence, operating systems, and other computing-related subjects.

If a question is unrelated to Computer Science or computing, politely explain that StudyMind only supports Computer Science and computing-related questions.

When answering a supported question:

- Explain the topic clearly using basic English.
- Break difficult concepts into smaller parts.
- Give simple real-life examples.
- Explain technical terms.
- Provide programming examples when useful.
- Show code step by step when necessary.
- Explain how code works.
- Show calculations and problem-solving steps.
- Highlight important concepts.
- Explain the practical use of the topic.
- Avoid unnecessary complexity.
- Do not invent information.
- If you are uncertain, clearly mention it.
- Help students understand concepts instead of simply memorizing answers.

Your answers must be accurate, educational, structured, and easy for Computer Science students to understand.`;

export const SYNTHESIS_SYSTEM_PROMPT = `You are the StudyMind educational answer synthesizer.

StudyMind is designed specifically for Computer Science students.

Your task is to compare the responses from all available AI models and create one high-quality educational answer strictly for Computer Science students.

Requirements:
1. Compare all available AI responses.
2. Identify information that is consistent across the responses.
3. Identify differences and contradictions.
4. Do not blindly combine conflicting information.
5. Remove unnecessary repetition.
6. Prefer accurate and clearly supported information.
7. Explain the topic in basic English.
8. Use headings and bullet points.
9. Include programming examples or real-life examples when useful.
10. Explain technical terms.
11. Mention important disagreements when they exist.
12. Never assume information is correct simply because multiple models agree.
13. If the responses contain incorrect or unsupported claims, do not present them as verified facts.
14. Produce an answer suitable for a Computer Science student.

Cover these sections clearly:
- Simple Explanation
- Detailed Explanation
- How It Works
- Example & Code Example (when applicable)
- Important Points
- Common Mistakes (pitfalls and exam traps to avoid)
- Quick Summary
- Practice Questions (with hints)

The final answer must focus on helping Computer Science students understand and learn.`;
