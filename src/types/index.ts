export type AIProvider = 'chatgpt' | 'gemini' | 'claude' | 'deepseek';

export interface AIModelMeta {
  id: AIProvider;
  name: string;
  providerName: string;
  tagline: string;
  iconName: string;
  badgeColor: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  defaultModelName: string;
  strengths: string[];
}

export interface AIModelResponse {
  provider: AIProvider;
  modelName: string;
  answer: string;
  latencyMs: number;
  status: 'success' | 'error' | 'unavailable' | 'loading';
  error?: string;
  perspectiveHighlight?: string;
  keyApproach?: string;
}

export interface ExampleSection {
  codeOrContext: string;
  explanation: string;
  language?: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  hint?: string;
}

export interface SynthesisResult {
  simpleExplanation: string;
  detailedExplanation: string;
  example: ExampleSection;
  importantPoints: string[];
  commonMistakes?: string[];
  quickSummary: string;
  practiceQuestions: PracticeQuestion[];
  consensusSummary?: string;
  agreements: string[];
  differencesOrNuances: string[];
}

export interface FollowUpMessage {
  id: string;
  sender: 'student' | 'multivio' | 'system';
  text: string;
  timestamp: number;
  providerPerspective?: AIProvider;
}

export type QuizType = 'mcq' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizData {
  id: string;
  topic: string;
  questions: QuizQuestion[];
  completed: boolean;
  score?: number;
  total?: number;
}

export interface ImportantTerm {
  term: string;
  definition: string;
}

export interface StudyNote {
  topic: string;
  definition: string;
  keyConcepts: string[];
  examples: string;
  importantTerms: ImportantTerm[];
  examPoints: string[];
  lastEdited: number;
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  text: string;
  wordCount: number;
  pageCount?: number;
  slideCount?: number;
  uploadedAt: number;
}

export interface StudySession {
  id: string;
  title: string;
  question: string;
  timestamp: number;
  selectedModels: AIProvider[];
  responses: Record<AIProvider, AIModelResponse>;
  synthesis: SynthesisResult;
  followUps: FollowUpMessage[];
  quiz?: QuizData;
  notes?: StudyNote;
  document?: UploadedDocument;
}

export interface ProviderStatus {
  chatgpt: boolean;
  gemini: boolean;
  claude: boolean;
  deepseek: boolean;
  supabase?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest?: boolean;
  createdAt?: string;
}
