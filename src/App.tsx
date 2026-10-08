import React, { useState, useEffect } from 'react';
import { 
  AIModelResponse, 
  AIProvider, 
  FollowUpMessage, 
  ProviderStatus, 
  QuizData, 
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
import { generateEducationalResponse, generateFollowUpAnswer } from './services/ai/mockGenerator';
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
  FileText
} from 'lucide-react';

const STORAGE_KEY = 'studymind_sessions_v1';

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

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !getStoredUser());
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    storeUser(user);
    setIsAuthModalOpen(false);
    showToast(`Welcome to StudyMind, ${user.name}!`);
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
          setSessions(parsed);
          setCurrentSession(parsed[0]);
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
            setSessions(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const merged = [...prev, ...cloudSessions.filter(s => !existingIds.has(s.id))];
              return merged;
            });
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
  const handleAskStudyMind = async (overrideQuestion?: string) => {
    let q = (overrideQuestion || question).trim();
    if (!q && attachedDocument) {
      q = `Analyze and explain key lecture concepts from: ${attachedDocument.name}`;
    }
    if (!q || isLoading) return;

    setIsLoading(true);
    setCurrentTab('study');
    setLoadingStep(attachedDocument ? `Analyzing lecture document "${attachedDocument.name}" across AI models...` : 'Dispatching question to selected AI models...');

    try {
      // First attempt backend endpoint
      const response = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          models: selectedModels,
          document: attachedDocument || undefined,
        }),
      });

      if (response.ok) {
        const session: StudySession = await response.json();
        if (attachedDocument && !session.document) {
          session.document = attachedDocument;
        }
        setCurrentSession(session);
        const updated = [session, ...sessions.filter(s => s.id !== session.id)];
        saveSessionsToStorage(updated);
        showToast('Lesson generated and ready!');
      } else {
        throw new Error('Backend returned non-200');
      }
    } catch (err) {
      console.info('Using client-side educational engine fallback:', err);
      // Client-side fallback guarantees instantaneous responsiveness
      const baseline = generateEducationalResponse(q, selectedModels, attachedDocument || undefined);
      const session: StudySession = {
        id: `session-${Date.now()}`,
        title: q.length > 50 ? q.slice(0, 47) + '...' : q,
        question: q,
        timestamp: Date.now(),
        selectedModels,
        responses: baseline.responses,
        synthesis: baseline.synthesis,
        followUps: [],
        quiz: {
          id: `quiz-${Date.now()}`,
          topic: q,
          questions: baseline.quizQuestions,
          completed: false,
        },
        notes: baseline.notes,
        document: attachedDocument || undefined,
      };

      setCurrentSession(session);
      const updated = [session, ...sessions.filter(s => s.id !== session.id)];
      saveSessionsToStorage(updated);
      showToast('Lesson generated and ready!');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Follow-up question handler
  const handleSendFollowUp = async (userMessage: string) => {
    if (!currentSession || isFollowUpLoading) return;

    const studentMsg: FollowUpMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: userMessage,
      timestamp: Date.now(),
    };

    const sessionWithUserMsg: StudySession = {
      ...currentSession,
      followUps: [...currentSession.followUps, studentMsg],
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

      let replyText = '';
      if (response.ok) {
        const data = await response.json();
        replyText = data.reply;
      } else {
        replyText = generateFollowUpAnswer(sessionWithUserMsg, userMessage, sessionWithUserMsg.followUps);
      }

      const botMsg: FollowUpMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'studymind',
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
    } catch (err) {
      const replyText = generateFollowUpAnswer(sessionWithUserMsg, userMessage, sessionWithUserMsg.followUps);
      const botMsg: FollowUpMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'studymind',
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
    setCurrentSession(s);
    setQuestion(s.question);
    setSelectedModels(s.selectedModels);
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
    handleAskStudyMind(sample);
  };

  const handleExplainMoreSimply = () => {
    handleSendFollowUp('Can you explain this even more simply, using an intuitive everyday story for a beginner?');
  };

  const handleExplainInDetail = () => {
    showToast('Formulating complete detailed explanation comparing all AI models...');
    handleSendFollowUp('Please provide a complete detailed explanation of this topic using the official StudyMind 7-point format by comparing all AI models (ChatGPT, Gemini, Claude, DeepSeek). Provide the whole meaningful depth of the question.');
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
              handleAskStudyMind(topic);
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
          currentSession?.quiz ? (
            <QuizView
              quiz={currentSession.quiz}
              onUpdateQuiz={handleUpdateQuiz}
              onBackToLesson={() => setCurrentTab('study')}
            />
          ) : (
            <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <FileQuestion className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No active quiz yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ask any educational question first, and StudyMind will formulate an interactive quiz tailored to your lesson!
              </p>
              <button
                onClick={() => {
                  setQuestion('Explain polymorphism in OOP');
                  handleAskStudyMind('Explain polymorphism in OOP');
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Try Sample Quiz on Polymorphism
              </button>
            </div>
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
                  handleAskStudyMind('Explain polymorphism in OOP');
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
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Learn Smarter With Multiple AI Models
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                  Ask one question. Compare multiple AI perspectives. Get one clear explanation designed for learning.
                </p>
              </div>

              {/* Large Question Input Box with Integrated Lecture Options */}
              <div className="max-w-3xl mx-auto space-y-4">
                <IntegratedSearchInput
                  question={question}
                  setQuestion={setQuestion}
                  attachedDocument={attachedDocument}
                  setAttachedDocument={setAttachedDocument}
                  onSubmit={() => handleAskStudyMind()}
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
                          handleAskStudyMind(sp);
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

            {/* LOADING STATE */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-indigo-200 p-8 sm:p-12 text-center shadow-xs animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  <Brain className="w-7 h-7 animate-bounce" />
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

                {/* 1. Combined StudyMind Answer (Featured Prominently) */}
                {(viewMode === 'combined' || viewMode === 'both') && (
                  <CombinedAnswer
                    synthesis={currentSession.synthesis}
                    question={currentSession.question}
                    responses={currentSession.responses}
                    selectedModels={currentSession.selectedModels}
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
                          Individual AI Perspectives ({currentSession.selectedModels.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Expand any model to review its original unfiltered response and specialized approach.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {currentSession.selectedModels.map(provider => {
                        const res = currentSession.responses[provider];
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
                      Enter your homework or study question once. StudyMind queries ChatGPT, Gemini, Claude, and DeepSeek simultaneously.
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
                      StudyMind eliminates conflicting fluff and synthesizes one verified, structured lesson with analogies and step-by-step code.
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
            <div className="w-9 h-9 rounded-xl bg-sky-200/90 border border-sky-300 flex items-center justify-center text-sky-800 shadow-xs">
              <Brain className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-sky-950">StudyMind</span>
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
