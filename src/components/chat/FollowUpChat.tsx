import React, { useState } from 'react';
import { FollowUpMessage, StudySession } from '../../types';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { Send, Sparkles, User, Brain, CornerDownLeft, Loader2 } from 'lucide-react';
import { MultivioLogo } from '../ui/MultivioLogo';

interface FollowUpChatProps {
  session: StudySession;
  onSendFollowUp: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  session,
  onSendFollowUp,
  isLoading = false,
}) => {
  const [input, setInput] = useState('');

  const quickPrompts = [
    'Explain in full detail by comparing all AI models (ChatGPT, Gemini, Claude, DeepSeek).',
    "I still don't understand, explain using a simpler real-world story.",
    'Show a concise code example in Python.',
    'What are the most common exam questions on this?',
    'What is the difference between this and similar concepts?',
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await onSendFollowUp(msg);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onSendFollowUp(prompt);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-lg bg-white border border-blue-200 flex items-center justify-center p-0.5 shadow-2xs">
            <MultivioLogo className="w-6.5 h-6.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Interactive Follow-up & Tutor
            </h3>
            <p className="text-xs text-slate-500">
              Ask clarifying questions or request code in other languages while maintaining session context.
            </p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
        {session.followUps.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-slate-600 font-medium">
              Have questions about this lesson?
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Ask Multivio anything you're uncertain about, or click a quick prompt below:
            </p>

            {/* Quick Prompts */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-xl mx-auto">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(qp)}
                  type="button"
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 text-slate-700 text-xs text-left transition-all cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        ) : (
          session.followUps.map((msg, index) => {
            const isTargetStyled = index === 2 || msg.sender === 'student';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === 'student' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    msg.sender === 'student'
                      ? 'bg-[#6273ec] text-white'
                      : 'bg-white border border-blue-200 p-0.5 shadow-2xs'
                  }`}
                >
                  {msg.sender === 'student' ? <User className="w-4 h-4" /> : <MultivioLogo className="w-6 h-6" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'student'
                      ? 'rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                  style={
                    isTargetStyled
                      ? {
                          backgroundColor: '#6273ec',
                        }
                      : undefined
                  }
                >
                  <div
                    style={
                      isTargetStyled
                        ? {
                            borderColor: '#a2e1e1',
                            color: '#e6ebf1',
                          }
                        : undefined
                    }
                    className={isTargetStyled ? '[&_p]:text-[#e6ebf1] [&_p]:border-[#a2e1e1]' : ''}
                  >
                    <MarkdownRenderer
                      content={msg.text}
                      className={isTargetStyled ? '!text-[#e6ebf1] [&_p]:!text-[#e6ebf1] [&_p]:!border-[#a2e1e1]' : ''}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span>Multivio is formulating your personalized clarification...</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-3.5 bg-slate-50/80 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask to improve"
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Ask</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
