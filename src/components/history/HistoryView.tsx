import React, { useState } from 'react';
import { StudySession } from '../../types';
import { 
  Search, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Check, 
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface HistoryViewProps {
  sessions: StudySession[];
  onOpenSession: (session: StudySession) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onStartNewStudy: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onOpenSession,
  onDeleteSession,
  onRenameSession,
  onStartNewStudy,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = sessions.filter(s => 
    s.question.toLowerCase().includes(search.toLowerCase()) ||
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (s: StudySession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEditing = (s: StudySession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(s.id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Study Archive & Memory
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Conversation History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Revisit your multi-model answers, study sheets, and quizzes anytime.
          </p>
        </div>

        <button
          onClick={onStartNewStudy}
          type="button"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>New Question</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search past questions or topics..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No conversations found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try adjusting your search query.' : 'Ask your first question to begin building your study history.'}
          </p>
          <button
            onClick={onStartNewStudy}
            type="button"
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            Ask a Question
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => onOpenSession(s)}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="px-2.5 py-1 text-sm font-semibold border border-indigo-500 rounded bg-indigo-50/30 text-slate-900 focus:outline-none w-full max-w-md"
                        autoFocus
                      />
                      <button
                        onClick={e => saveEditing(s, e)}
                        className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {s.title || s.question}
                      </h3>
                      <button
                        onClick={e => startEditing(s, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                    "{s.question}"
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                    <span>{formatRelativeTime(s.timestamp)}</span>
                    <span>·</span>
                    <span className="capitalize">{s.selectedModels.join(', ')}</span>
                    {s.followUps?.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-indigo-600">
                          <MessageSquare className="w-3 h-3" />
                          {s.followUps.length} follow-ups
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    type="button"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 pl-2">
                    <span>Open</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
