import React, { useState, useEffect } from 'react';
import { 
  AIModelResponse, 
  AIProvider, 
  FollowUpMessage, 
  ProviderStatus, 
  QuestionValidationResult,
  QuizData, 
  QuizType,
  StudyNote, 
  StudySession,
  UploadedDocument
} from './types';
import { Navbar, NavTab } from './components/navbar/Navbar';
import { AISelector } from './components/ai-selector/AISelector';
import { AIResponseCard } from './components/ai-response/AIResponseCard';
import { CombinedAnswer } from './components/synthesis/CombinedAnswer';
import { CompareMatrix } from './components/compare/CompareMatrix';
import { FollowUpChat } from './components/chat/FollowUpChat';
import { QuizView } from './components/quiz/QuizView';
import { NotesView } from './components/notes/NotesView';
import { DashboardView } from './components/dashboard/DashboardView';
import { HistoryView } from './components/history/HistoryView';
import { AboutView } from './components/about/AboutView';
import { IntegratedSearchInput } from './components/search/IntegratedSearchInput';
import { QuickGuideModal } from './components/modals/QuickGuideModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthUser } from './types/index';
import { 
  syncSessionToSupabase, 
  loadSessionsFromSupabase, 
  testSupabaseConnection,
  getStoredUser,
  storeUser,
  signOutUser
} from './services/supabase/supabaseClient';
import { MultivioLogo } from './components/ui/MultivioLogo';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Brain, 
  CheckCircle2, 
  RefreshCw, 
  MessageSquare, 
  ChevronRight,
  Loader2,
  FileQuestion,
  HelpCircle,
  Zap,
  Mail,
  Paperclip,
  FileText,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

const STORAGE_KEY = 'multivio_sessions_v1';
const DEFAULT_MODELS: AIProvider[] = ['chatgpt', 'gemini', 'claude', 'deepseek'];

function normalizeSession(raw: any): StudySession | null {
  if (!raw || typeof raw !== 'object' || typeof raw.question !== 'string') {
    return null;
  }
  const responses =
    raw.responses && typeof raw.responses === 'object' ? raw.responses : {};
  const responseKeys = Object.keys(responses).filter((k): k is AIProvider =>
    DEFAULT_MODELS.includes(k as AIProvider)
  );
  const selectedModels: AIProvider[] =
    Array.isArray(raw.selectedModels) && raw.selectedModels.length > 0
      ? raw.selectedModels
      : responseKeys.length > 0
        ? responseKeys
        : DEFAULT_MODELS;

  const synthesis =
    raw.synthesis && typeof raw.synthesis === 'object'
      ? {
          simpleExplanation: raw.synthesis.simpleExplanation || '',
          detailedExplanation: raw.synthesis.detailedExplanation || '',
          howItWorks: raw.synthesis.howItWorks,
          example: raw.synthesis.example || { codeOrContext: '', explanation: '' },
          importantPoints: Array.isArray(raw.synthesis.importantPoints)
            ? raw.synthesis.importantPoints
            : [],
          commonMistakes: Array.isArray(raw.synthesis.commonMistakes)
            ? raw.synthesis.commonMistakes
            : [],
          quickSummary: raw.synthesis.quickSummary || '',
          practiceQuestions: Array.isArray(raw.synthesis.practiceQuestions)
            ? raw.synthesis.practiceQuestions
            : [],
          consensusSummary: raw.synthesis.consensusSummary || '',
          agreements: Array.isArray(raw.synthesis.agreements) ? raw.synthesis.agreements : [],
          differencesOrNuances: Array.isArray(raw.synthesis.differencesOrNuances)
            ? raw.synthesis.differencesOrNuances
            : [],
        }
      : {
          simpleExplanation: '',
          detailedExplanation: '',
          example: { codeOrContext: '', explanation: '' },
          importantPoints: [],
          commonMistakes: [],
          quickSummary: '',
          practiceQuestions: [],
          consensusSummary: '',
          agreements: [],
          differencesOrNuances: [],
        };

  return {
    ...raw,
    id: raw.id || `session-${Date.now()}`,
    title: raw.title || raw.question,
    question: raw.question,
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
    selectedModels,
    responses,
    synthesis,
    followUps: Array.isArray(raw.followUps) ? raw.followUps : [],
  };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('study');
  const [question, setQuestion] = useState('');
  const [attachedDocument, setAttachedDocument] = useState<UploadedDocument | null>(null);
  const [selectedModels, setSelectedModels] = useState<AIProvider[]>([
    'chatgpt',
    'gemini',
    'claude',
    'deepseek',
  ]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'combined' | 'models' | 'both'>('both');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{
    result: QuestionValidationResult;
    originalQuestion: string;
  } | null>(null);
  const [clarificationText, setClarificationText] = useState('');
  const [providerErrorAlert, setProviderErrorAlert] = useState<{
    error: string;
    responses?: Record<AIProvider, AIModelResponse>;
  } | null>(null);
  const [standaloneQuiz, setStandaloneQuiz] = useState<QuizData | null>(null);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !getStoredUser());
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    storeUser(user);
    setIsAuthModalOpen(false);
    showToast(`Welcome to Multivio, ${user.name}!`);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    showToast('Signed out successfully.');
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Load persisted history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .map(normalizeSession)
            .filter((s): s is StudySession => s !== null);
          if (normalized.length > 0) {
            setSessions(normalized);
            setCurrentSession(normalized[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse saved sessions from localStorage:', e);
    }

    // Check server provider status & Supabase
    fetch('/api/providers/status')
      .then(res => res.json())
      .then(data => setProviderStatus(data))
      .catch(() => {
        // Fallback status if offline
        setProviderStatus({
          chatgpt: false,
          gemini: true,
          claude: false,
          deepseek: false,
          supabase: true,
        });
      });

    // Test and load cloud sessions from Supabase
    testSupabaseConnection().then(health => {
      if (health.connected) {
        setProviderStatus(prev => ({ ...(prev || { chatgpt: false, gemini: true, claude: false, deepseek: false }), supabase: true }));
        loadSessionsFromSupabase().then(cloudSessions => {
          if (cloudSessions && cloudSessions.length > 0) {
            const normalizedCloud = cloudSessions
              .map(normalizeSession)
              .filter((s): s is StudySession => s !== null);
            if (normalizedCloud.length > 0) {
              setSessions(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const merged = [...prev, ...normalizedCloud.filter(s => !existingIds.has(s.id))];
                return merged;
              });
            }
          }
        });
      }
    });
  }, []);

  // Save sessions to storage and sync to Supabase
  const saveSessionsToStorage = (updated: StudySession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage limit reached:', e);
    }
    // Asynchronously sync latest session to Supabase
    if (updated.length > 0) {
      syncSessionToSupabase(updated[0]).catch(err => {
        console.debug('Supabase background sync notice:', err);
      });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Main Ask handler
  const handleAskMultivio = async (overrideQuestion?: string) => {
    let q = (overrideQuestion || question).trim();
    if (!q && attachedDocument) {
      q = `Analyze and explain key Computer Science lecture concepts from: ${attachedDocument.name}`;
    }
    if (!q) {
      showToast('Please enter a Computer Science question first.');
      return;
    }
    if (isLoading) return;

    setValidationAlert(null);
    setProviderErrorAlert(null);
    setIsLoading(true);
    setCurrentTab('study');
    setLoadingStep(
      attachedDocument
        ? `Validating & analyzing lecture document "${attachedDocument.name}" across selected AI models...`
        : 'Validating Computer Science topic & querying selected AI models...'
    );

    try {
      const response = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          models: selectedModels,
          document: attachedDocument || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (data?.rejected && data?.validation) {
        setValidationAlert({
          result: data.validation,
          originalQuestion: q,
        });
        setClarificationText('');
        showToast(
          data.validation.decision === 'NEEDS_CLARIFICATION'
            ? 'Please clarify how your question relates to Computer Science.'
            : 'StudyMind only answers Computer Science & computing questions.'
        );
        return;
      }

      if (!response.ok || data?.allProvidersFailed) {
        setProviderErrorAlert({
          error:
            data?.error ||
            'Unable to retrieve responses from the selected AI providers. Please check your server API keys.',
          responses: data?.responses,
        });
        showToast('AI provider error: check details on screen.');
        return;
      }

      const session = normalizeSession(data) || (data as StudySession);
      if (attachedDocument && !session.document) {
        session.document = attachedDocument;
      }
      setCurrentSession(session);
      const updated = [session, ...sessions.filter(s => s.id !== session.id)];
      saveSessionsToStorage(updated);
      showToast('Computer Science lesson ready!');
    } catch (err: any) {
      console.error('Error querying /api/study:', err);
      setProviderErrorAlert({
        error:
          err?.message ||
          'Could not connect to the StudyMind backend server. Please verify the server is running.',
      });
      showToast('Backend connection error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationAlert || !clarificationText.trim() || isLoading) return;
    const clarifiedQuery = `${validationAlert.originalQuestion} (Computer Science context: ${clarificationText.trim()})`;
    setQuestion(clarifiedQuery);
    setClarificationText('');
    await handleAskMultivio(clarifiedQuery);
  };

  // Custom CS quiz generator handler
  const handleGenerateCustomQuiz = async (
    topic: string,
    count: number,
    questionTypes: QuizType[]
  ): Promise<{ error?: string; rejectedMessage?: string }> => {
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          count,
          questionTypes,
          contextSummary: currentSession?.synthesis?.detailedExplanation,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (data?.rejected && data?.validation) {
        return { rejectedMessage: data.validation.message };
      }

      if (!response.ok || !data?.questions) {
        return {
          error: data?.error || 'Could not generate quiz questions. Check backend API configuration.',
        };
      }

      const generatedQuiz: QuizData = data;
      if (currentSession) {
        const updatedSession: StudySession = {
          ...currentSession,
          quiz: generatedQuiz,
        };
        setCurrentSession(updatedSession);
        saveSessionsToStorage(
          sessions.map(s => (s.id === updatedSession.id ? updatedSession : s))
        );
      } else {
        setStandaloneQuiz(generatedQuiz);
      }

      showToast(`Generated ${generatedQuiz.questions.length} CS quiz questions!`);
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to connect to quiz generation endpoint.' };
    }
  };

  // Follow-up question handler (CS-validated on backend)
  const handleSendFollowUp = async (userMessage: string) => {
    if (!currentSession || isFollowUpLoading || !userMessage.trim()) return;

    const studentMsg: FollowUpMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: userMessage,
      timestamp: Date.now(),
    };

    const sessionWithUserMsg: StudySession = {
      ...currentSession,
      followUps: [...(currentSession.followUps || []), studentMsg],
    };
    setCurrentSession(sessionWithUserMsg);
    setIsFollowUpLoading(true);

    try {
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sessionWithUserMsg,
          message: userMessage,
          history: sessionWithUserMsg.followUps,
        }),
      });

      const data = await response.json().catch(() => ({}));

      let replyText = '';
      if (data?.rejected && data?.validation) {
        replyText = data.validation.message;
        showToast(
          data.validation.decision === 'NEEDS_CLARIFICATION'
            ? 'Please clarify how your follow-up relates to Computer Science.'
            : 'Follow-up restricted to Computer Science topics.'
        );
      } else if (response.ok && data?.reply) {
        replyText = data.reply;
      } else {
        replyText = `⚠️ **Unable to complete follow-up:** ${
          data?.error || 'The backend AI provider did not return a response.'
        }`;
      }

      const botMsg: FollowUpMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'multivio',
        text: replyText,
        timestamp: Date.now(),
      };

      const finalSession: StudySession = {
        ...sessionWithUserMsg,
        followUps: [...sessionWithUserMsg.followUps, botMsg],
      };

      setCurrentSession(finalSession);
      const updatedSessions = sessions.map(s => s.id === finalSession.id ? finalSession : s);
      saveSessionsToStorage(updatedSessions);
    } catch (err: any) {
      const botMsg: FollowUpMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'multivio',
        text: `⚠️ **Connection Error:** ${err?.message || 'Unable to reach follow-up endpoint.'}`,
        timestamp: Date.now(),
      };
      const finalSession: StudySession = {
        ...sessionWithUserMsg,
        followUps: [...sessionWithUserMsg.followUps, botMsg],
      };
      setCurrentSession(finalSession);
      const updatedSessions = sessions.map(s => s.id === finalSession.id ? finalSession : s);
      saveSessionsToStorage(updatedSessions);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Update Quiz
  const handleUpdateQuiz = (updatedQuiz: QuizData) => {
    if (!currentSession) return;
    const updatedSession: StudySession = {
      ...currentSession,
      quiz: updatedQuiz,
    };
    setCurrentSession(updatedSession);
    const updated = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    saveSessionsToStorage(updated);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessionsToStorage(updated);
    if (currentSession?.id === sessionId) {
      setCurrentSession(updated.length > 0 ? updated[0] : null);
    }
    showToast('Conversation deleted');
  };

  // Rename session
  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const updated = sessions.map(s => s.id === sessionId ? { ...s, title: newTitle } : s);
    saveSessionsToStorage(updated);
    if (currentSession?.id === sessionId) {
      setCurrentSession({ ...currentSession, title: newTitle });
    }
    showToast('Conversation renamed');
  };

  // Open specific session
  const handleOpenSession = (s: StudySession) => {
    const safe = normalizeSession(s) || s;
    setCurrentSession(safe);
    setQuestion(safe.question || '');
    setSelectedModels(
      Array.isArray(safe.selectedModels) && safe.selectedModels.length > 0
        ? safe.selectedModels
        : DEFAULT_MODELS
    );
    setCurrentTab('study');
  };

  // Sample prompt chips
  const samplePrompts = [
    'Explain polymorphism in object-oriented programming.',
    'How does TCP/IP 3-way handshake work in networking?',
    'Explain recursion in C++ with stack frame breakdown.',
    'Database normalization: Explain 1NF, 2NF, and 3NF with tables.',
    'Compare QuickSort vs MergeSort complexity & memory tradeoffs.',
    'What is Bayes\' Theorem and how is it used in machine learning?',
  ];

  const handleTryExample = () => {
    const sample = samplePrompts[0];
    setQuestion(sample);
    handleAskMultivio(sample);
  };

  const handleExplainMoreSimply = () => {
    handleSendFollowUp('Can you explain this even more simply, using an intuitive everyday story for a beginner?');
  };

  const handleExplainInDetail = () => {
    showToast('Formulating complete detailed explanation comparing all AI models...');
    handleSendFollowUp('Please provide a complete detailed explanation of this topic using the official Multivio 7-point format by comparing all AI models (ChatGPT, Gemini, Claude, DeepSeek). Provide the whole meaningful depth of the question.');
    scrollToFollowUp();
  };

  const scrollToFollowUp = () => {
    const el = document.getElementById('follow-up-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hasActiveSession={Boolean(currentSession)}
        providerStatus={providerStatus}
        onOpenQuickGuide={() => setIsGuideOpen(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB: ABOUT */}
        {currentTab === 'about' && (
          <AboutView onStartStudy={() => setCurrentTab('study')} />
        )}

        {/* TAB: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <DashboardView
            sessions={sessions}
            onOpenSession={handleOpenSession}
            onAskTopic={topic => {
              setQuestion(topic);
              setCurrentTab('study');
              handleAskMultivio(topic);
            }}
          />
        )}

        {/* TAB: HISTORY */}
        {currentTab === 'history' && (
          <HistoryView
            sessions={sessions}
            onOpenSession={handleOpenSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onStartNewStudy={() => {
              setQuestion('');
              setCurrentTab('study');
            }}
          />
        )}

        {/* TAB: QUIZ */}
        {currentTab === 'quiz' && (
          (currentSession?.quiz || standaloneQuiz) ? (
            <QuizView
              quiz={(currentSession?.quiz || standaloneQuiz)!}
              onUpdateQuiz={(updatedQuiz) => {
                if (currentSession) {
                  handleUpdateQuiz(updatedQuiz);
                } else {
                  setStandaloneQuiz(updatedQuiz);
                }
              }}
              onGenerateCustomQuiz={handleGenerateCustomQuiz}
              onBackToLesson={currentSession ? () => setCurrentTab('study') : undefined}
            />
          ) : (
            <QuizView
              quiz={{
                id: 'quiz-empty',
                topic: 'Computer Science Practice Quiz',
                questions: [],
                completed: false,
              }}
              onUpdateQuiz={() => {}}
              onGenerateCustomQuiz={handleGenerateCustomQuiz}
              onBackToLesson={() => setCurrentTab('study')}
            />
          )
        )}

        {/* TAB: NOTES */}
        {currentTab === 'notes' && (
          currentSession?.notes ? (
            <NotesView
              notes={currentSession.notes}
              onBackToLesson={() => setCurrentTab('study')}
            />
          ) : (
            <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No study notes generated yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ask a question to generate a compact, downloadable revision sheet with exam points and definitions.
              </p>
              <button
                onClick={() => {
                  setQuestion('Explain polymorphism in OOP');
                  handleAskMultivio('Explain polymorphism in OOP');
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Generate Sample Study Notes
              </button>
            </div>
          )
        )}

        {/* TAB: COMPARE */}
        {currentTab === 'compare' && currentSession && (
          <CompareMatrix
            question={currentSession.question}
            selectedModels={currentSession.selectedModels}
            responses={currentSession.responses}
            synthesis={currentSession.synthesis}
            onBackToStudy={() => setCurrentTab('study')}
          />
        )}

        {/* TAB: AI STUDY (MAIN HERO & LESSON VIEW) */}
        {currentTab === 'study' && (
          <div className="space-y-8">
            {/* HERO SECTION (Search & AI Selector) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-xs">
              <div className="text-center max-w-3xl mx-auto mb-6">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full mb-2.5">
                  Your AI Learning Assistant for Computer Science
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Learn Smarter With Multiple AI Models
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                  Learn programming, databases, algorithms, networking, artificial intelligence, and more with multiple AI models in one place.
                </p>
              </div>

              {/* Large Question Input Box with Integrated Lecture Options */}
              <div className="max-w-3xl mx-auto space-y-4">
                <IntegratedSearchInput
                  question={question}
                  setQuestion={setQuestion}
                  attachedDocument={attachedDocument}
                  setAttachedDocument={setAttachedDocument}
                  onSubmit={() => handleAskMultivio()}
                  isLoading={isLoading}
                />

                {/* Example pills & Try Example button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-medium mr-1 hidden xs:inline">Quick topics:</span>
                    {samplePrompts.slice(0, 3).map((sp, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuestion(sp);
                          handleAskMultivio(sp);
                        }}
                        disabled={isLoading}
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer truncate max-w-[150px] sm:max-w-xs"
                      >
                        {sp.split(' ')[1] || sp}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleTryExample}
                    disabled={isLoading}
                    type="button"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer self-start sm:self-auto shrink-0 pt-1 sm:pt-0"
                  >
                    Try an Example →
                  </button>
                </div>

                {/* AI Models Selector */}
                <div className="pt-3 border-t border-slate-100">
                  <AISelector
                    selectedModels={selectedModels}
                    onChange={setSelectedModels}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* COMPUTER SCIENCE VALIDATION REJECTION / CLARIFICATION ALERT */}
            {validationAlert && (
              <div
                className={`rounded-2xl border p-5 sm:p-6 shadow-xs ${
                  validationAlert.result.decision === 'NEEDS_CLARIFICATION'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      validationAlert.result.decision === 'NEEDS_CLARIFICATION'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {validationAlert.result.decision === 'NEEDS_CLARIFICATION' ? (
                      <HelpCircle className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold">
                        {validationAlert.result.decision === 'NEEDS_CLARIFICATION'
                          ? 'Clarification Needed: Computer Science Connection'
                          : 'Computer Science & Computing Topics Only'}
                      </h3>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          validationAlert.result.decision === 'NEEDS_CLARIFICATION'
                            ? 'bg-amber-200/70 text-amber-900'
                            : 'bg-rose-200/70 text-rose-900'
                        }`}
                      >
                        {validationAlert.result.decision}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed font-medium">
                      {validationAlert.result.message}
                    </p>
                    {validationAlert.result.reason && (
                      <p className="text-xs opacity-80">
                        Reason: {validationAlert.result.reason}
                      </p>
                    )}

                    {validationAlert.result.decision === 'NEEDS_CLARIFICATION' && (
                      <form onSubmit={handleSubmitClarification} className="pt-2 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={clarificationText}
                          onChange={(e) => setClarificationText(e.target.value)}
                          placeholder="Explain how this relates to Computer Science (e.g., Data Structures, OOP, AI)..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                        <button
                          type="submit"
                          disabled={!clarificationText.trim() || isLoading}
                          className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shrink-0"
                        >
                          Submit Clarification
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROVIDER ERROR / MISSING KEY ALERT */}
            {providerErrorAlert && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-amber-950">
                      AI Provider Response Unavailable
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900 mt-1">
                      {providerErrorAlert.error}
                    </p>
                  </div>
                </div>
                {providerErrorAlert.responses && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {Object.values(providerErrorAlert.responses).map((res) => (
                      <AIResponseCard key={res.provider} response={res} defaultExpanded={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LOADING STATE */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-indigo-200 p-8 sm:p-12 text-center shadow-xs animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 flex items-center justify-center mx-auto mb-4 p-2 shadow-xs">
                  <MultivioLogo className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Synthesizing Multi-AI Perspectives
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {loadingStep || 'Querying ChatGPT, Gemini, Claude, and DeepSeek concurrently...'}
                </p>

                <div className="flex justify-center items-center gap-3 mt-6">
                  {selectedModels.map(m => (
                    <div key={m} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 capitalize">
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS VIEW */}
            {!isLoading && currentSession && (
              <div className="space-y-6">
                {/* Active Question Bar */}
                <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 shadow-xs">
                  <div className="min-w-0 w-full md:w-auto">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                      Current Lesson Question
                    </span>
                    <h2 className="text-base sm:text-xl font-bold tracking-tight mt-0.5 break-words">
                      "{currentSession.question}"
                    </h2>
                    {currentSession.document && (
                      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-950 border border-sky-700/60 text-sky-200 text-xs mt-2 w-fit">
                        <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{currentSession.document.name}</span>
                        <span className="text-sky-300/80">
                          ({(currentSession.document.size / 1024).toFixed(0)} KB · 
                          {currentSession.document.slideCount ? ` ${currentSession.document.slideCount} slides · ` : currentSession.document.pageCount ? ` ${currentSession.document.pageCount} pages · ` : ' '}
                          ~{currentSession.document.wordCount} words)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full md:w-auto pt-1 md:pt-0 border-t border-slate-800 md:border-t-0">
                    {/* View mode toggle */}
                    <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-xs shrink-0 overflow-x-auto max-w-full">
                      <button
                        onClick={() => setViewMode('both')}
                        type="button"
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          viewMode === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        All Views
                      </button>
                      <button
                        onClick={() => setViewMode('combined')}
                        type="button"
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          viewMode === 'combined' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Synthesis
                      </button>
                      <button
                        onClick={() => setViewMode('models')}
                        type="button"
                        className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          viewMode === 'models' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Models
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentTab('compare')}
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Compare</span>
                    </button>
                  </div>
                </div>

                {/* 1. Combined Multivio Answer (Featured Prominently) */}
                {(viewMode === 'combined' || viewMode === 'both') && (
                  <CombinedAnswer
                    synthesis={currentSession.synthesis}
                    question={currentSession.question}
                    responses={currentSession.responses}
                    selectedModels={currentSession.selectedModels || DEFAULT_MODELS}
                    onGenerateQuiz={() => setCurrentTab('quiz')}
                    onMakeNotes={() => setCurrentTab('notes')}
                    onExplainMoreSimply={handleExplainMoreSimply}
                    onExplainInDetail={handleExplainInDetail}
                    onAskFollowUp={scrollToFollowUp}
                    onSaveAnswer={() => showToast('Lesson safely saved in history!')}
                    isSaved={true}
                  />
                )}

                {/* 2. Individual AI Model Cards */}
                {(viewMode === 'models' || viewMode === 'both') && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Individual AI Perspectives ({(currentSession.selectedModels || []).length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Expand any model to review its original unfiltered response and specialized approach.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {(currentSession.selectedModels || []).map(provider => {
                        const res = currentSession.responses?.[provider];
                        if (!res) return null;
                        return (
                          <AIResponseCard
                            key={provider}
                            response={res}
                            defaultExpanded={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Follow-up Interactive Chat */}
                <div id="follow-up-section" className="pt-4">
                  <FollowUpChat
                    session={currentSession}
                    onSendFollowUp={handleSendFollowUp}
                    isLoading={isFollowUpLoading}
                  />
                </div>
              </div>
            )}

            {/* INITIAL LANDING EMPTY STATE (Features overview when no question asked yet) */}
            {!isLoading && !currentSession && (
              <div className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3">
                      1
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">
                      No More 4-Tab Juggling
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Enter your homework or study question once. Multivio queries ChatGPT, Gemini, Claude, and DeepSeek simultaneously.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                      2
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">
                      Critical Synthesis & Consensus
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Multivio eliminates conflicting fluff and synthesizes one verified, structured lesson with analogies and step-by-step code.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
                      3
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">
                      Practice & Retain for Exams
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Transform any topic into interactive quizzes and downloadable revision cheat-sheets with single-click ease.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quick Guide Modal */}
      <QuickGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-sky-200 bg-[#e0f2fe] py-8 mt-12 text-xs text-sky-900 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-300 flex items-center justify-center p-1 shadow-xs">
              <MultivioLogo className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-sky-950">Multivio</span>
                <span className="text-sky-400">·</span>
                <span className="text-sky-800">"One question. Multiple AI perspectives. One clear answer."</span>
              </div>
              <p className="text-[11px] text-sky-700/80 mt-0.5">
                Multi-AI Educational Synthesis Platform
              </p>
            </div>
          </div>

          {/* Author attribution & Contact */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-sky-800">
            <button
              onClick={() => setCurrentTab('about')}
              type="button"
              className="flex items-center gap-1.5 hover:text-sky-950 transition-colors cursor-pointer group"
            >
              <span className="text-sky-600 font-normal">Created by</span>
              <span className="font-bold text-sky-950 group-hover:underline">Munir Hussain</span>
              <span className="text-[10px] text-sky-700 bg-sky-200/80 px-1.5 py-0.5 rounded font-medium">Founder</span>
            </button>
            <span className="text-sky-300 hidden sm:inline">·</span>
            <a 
              href="mailto:munii11khan@gmail.com" 
              className="flex items-center gap-1.5 text-sky-800 hover:text-sky-950 hover:underline transition-colors"
              title="Send email to Munir Hussain"
            >
              <Mail className="w-3.5 h-3.5 text-sky-600" />
              <span>munii11khan@gmail.com</span>
            </a>
            <span className="text-sky-300 hidden sm:inline">·</span>
            <button
              onClick={() => setCurrentTab('about')}
              type="button"
              className="text-sky-700 hover:text-sky-950 hover:underline cursor-pointer"
            >
              About the Platform
            </button>
          </div>
        </div>
      </footer>

      {/* Supabase Authentication Modal (Login & Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        isMandatory={false}
      />
    </div>
  );
}
