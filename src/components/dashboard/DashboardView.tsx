import React, { useState } from 'react';
import { StudySession } from '../../types';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Layers, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Zap,
  TrendingUp,
  Brain,
  Database,
  RefreshCw
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL 
} from '../../services/supabase/supabaseClient';
import { MultivioLogo } from '../ui/MultivioLogo';

interface DashboardViewProps {
  sessions: StudySession[];
  onOpenSession: (session: StudySession) => void;
  onAskTopic: (topic: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  onOpenSession,
  onAskTopic,
}) => {
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    try {
      const res = await testSupabaseConnection();
      if (res.connected && res.latencyMs !== undefined) {
        setSupabaseLatency(res.latencyMs);
      }
    } finally {
      setIsTestingSupabase(false);
    }
  };
  // Compute activity stats
  const questionsAsked = sessions.length;
  const topicsStudied = new Set(sessions.map(s => (s.question || '').toLowerCase())).size;
  const completedQuizzes = sessions.filter(s => s.quiz?.completed).map(s => s.quiz!);
  const quizCount = completedQuizzes.length;
  
  const avgScore = quizCount > 0
    ? Math.round(
        completedQuizzes.reduce((acc, q) => acc + ((q.score || 0) / (q.total || 1)) * 100, 0) / quizCount
      )
    : 0;

  const popularTopics = [
    { title: 'Object-Oriented Programming', query: 'Explain polymorphism in OOP with real-world examples and code.' },
    { title: 'Data Structures', query: 'Compare QuickSort and MergeSort time complexity and memory tradeoffs.' },
    { title: 'Database Systems', query: 'Explain Database Normalization from 1NF through 3NF with tables.' },
    { title: 'Computer Networks', query: 'How does the TCP/IP 3-Way Handshake establish a reliable connection?' },
    { title: 'Artificial Intelligence', query: 'How does Gradient Descent work in training neural networks?' },
    { title: 'Operating Systems', query: 'Explain CPU scheduling, deadlocks, and virtual memory paging in operating systems.' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Your AI Learning Assistant for Computer Science
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome back to Multivio!
          </h2>
          <p className="text-sm sm:text-base text-indigo-200 mt-2 leading-relaxed">
            Learn programming, databases, algorithms, networking, artificial intelligence, and more with multiple AI models in one place.
          </p>

          <button
            onClick={() => onAskTopic('Explain polymorphism in OOP')}
            type="button"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-sm transition-colors cursor-pointer"
          >
            <span>Ask a New Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards (Stat strip with zero-pill discipline) */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Your Learning Activity
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Questions Asked</span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {questionsAsked}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">across all AI providers</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Topics Studied</span>
              <MultivioLogo className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {topicsStudied}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">unique concept lessons</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Quizzes Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {quizCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">assessments passed</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium text-slate-500">Avg Quiz Score</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {quizCount > 0 ? `${avgScore}%` : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {quizCount > 0 ? 'retention rating' : 'take a quiz to measure'}
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Cloud Backend Status Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-emerald-500/30 p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm sm:text-base text-white">
                  Supabase Cloud Backend
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 truncate">
                Project ID: <span className="font-mono text-emerald-300 font-semibold">{SUPABASE_PROJECT_ID}</span> · Endpoint: <span className="font-mono text-slate-400 text-[11px]">{SUPABASE_URL}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically syncs study sessions, multi-model explanations, quizzes, and revision notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {supabaseLatency !== null && (
              <span className="text-[11px] text-emerald-300 font-mono bg-emerald-950/60 border border-emerald-500/40 px-2 py-1 rounded-lg">
                Ping: {supabaseLatency}ms
              </span>
            )}
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
              <span>{isTestingSupabase ? 'Pinging...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Topics to Learn */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recommended Core Topics
          </h3>
          <span className="text-xs text-slate-400">Click to explore multi-AI perspectives</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularTopics.map((pt, idx) => (
            <div
              key={idx}
              onClick={() => onAskTopic(pt.query)}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs p-4 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block mb-1">
                  {pt.title}
                </span>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  "{pt.query}"
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                <span>Start Learning</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Conversations
          </h3>
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No past conversations yet. Try searching one of the recommended topics above!
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.slice(0, 4).map(s => (
              <div
                key={s.id}
                onClick={() => onOpenSession(s)}
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {s.title || s.question}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{(s.selectedModels || []).length} AI perspectives</span>
                    <span>·</span>
                    <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 shrink-0">
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
