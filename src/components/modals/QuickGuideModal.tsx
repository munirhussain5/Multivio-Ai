import React from 'react';
import { X, Sparkles, Brain, CheckCircle2, Layers, BookOpen, GraduationCap } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '01',
      title: 'One Question',
      desc: 'Type what you want to learn once. No need to switch between four different AI tabs or copy-paste prompts repeatedly.',
      icon: BookOpen,
      color: 'text-indigo-600',
    },
    {
      num: '02',
      title: 'Four AI Perspectives',
      desc: 'Dispatches your question concurrently to ChatGPT, Gemini, Claude, and DeepSeek—each leveraging its unique analytical strength.',
      icon: Layers,
      color: 'text-blue-600',
    },
    {
      num: '03',
      title: 'Compare & Identify Nuances',
      desc: 'Examines where models agree (consensus) and flags differences, alternative notations, or deep systems performance details.',
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      num: '04',
      title: 'One Clear Unified Lesson',
      desc: 'The StudyMind synthesizer creates a structured explanation with simple language, analogies, runnable code, and exam takeaways.',
      icon: GraduationCap,
      color: 'text-amber-600',
    },
    {
      num: '05',
      title: 'Practice & Cement',
      desc: 'Test your knowledge instantly with auto-generated interactive quizzes and exportable revision study sheets.',
      icon: Brain,
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">How StudyMind Works</h3>
              <p className="text-xs text-indigo-200">
                "One question. Multiple AI perspectives. One clear answer."
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid gap-3">
            {steps.map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                    {st.num}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{st.title}</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Powered by modular educational AI architecture</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
            >
              Got it, let's learn!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
