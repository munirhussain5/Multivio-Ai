import React, { useState } from 'react';
import { SynthesisResult } from '../../types';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { CodeBlock } from '../ui/CodeBlock';
import { 
  GraduationCap, 
  Lightbulb, 
  BookOpen, 
  Code2, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Bookmark, 
  Sparkles,
  HelpCircle,
  Share2,
  Check,
  Zap,
  Layers
} from 'lucide-react';

interface CombinedAnswerProps {
  synthesis: SynthesisResult;
  question: string;
  onGenerateQuiz: () => void;
  onMakeNotes: () => void;
  onExplainMoreSimply: () => void;
  onAskFollowUp: () => void;
  onSaveAnswer: () => void;
  isSaved?: boolean;
}

export const CombinedAnswer: React.FC<CombinedAnswerProps> = ({
  synthesis,
  question,
  onGenerateQuiz,
  onMakeNotes,
  onExplainMoreSimply,
  onAskFollowUp,
  onSaveAnswer,
  isSaved = false,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    const textToCopy = `StudyMind Educational Answer: ${question}\n\nSummary:\n${synthesis.quickSummary}\n\nFull explanation on StudyMind.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-500/20 shadow-sm overflow-hidden">
      {/* Prominent Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  StudyMind Combined Explanation
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
                Synthesized from multiple AI perspectives into one unified, structured lesson.
              </p>
            </div>
          </div>

          {/* Action buttons header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
              title="Share or copy summary"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={onSaveAnswer}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved in History' : 'Save Answer'}</span>
            </button>
          </div>
        </div>

        {/* Quick model consensus bar */}
        {synthesis.consensusSummary && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-indigo-100">
            <Layers className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold text-white">Cross-Model Alignment: </strong>
              {synthesis.consensusSummary}
            </p>
          </div>
        )}
      </div>

      {/* Main Content Sections */}
      <div className="p-5 sm:p-7 space-y-7">
        {/* 1. Simple Explanation */}
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Simple Explanation
            </h3>
          </div>
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 text-slate-800 text-sm leading-relaxed">
            <MarkdownRenderer content={synthesis.simpleExplanation} />
          </div>
        </section>

        {/* 2. Detailed Explanation */}
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Detailed Explanation
            </h3>
          </div>
          <div className="text-slate-800 text-sm leading-relaxed space-y-3">
            <MarkdownRenderer content={synthesis.detailedExplanation} />
          </div>
        </section>

        {/* 3. Practical Example */}
        {synthesis.example && (
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <Code2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Practical Example
              </h3>
            </div>
            
            {synthesis.example.codeOrContext && (
              <CodeBlock 
                code={synthesis.example.codeOrContext} 
                language={synthesis.example.language || 'code'} 
              />
            )}

            {synthesis.example.explanation && (
              <p className="text-xs sm:text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong className="font-semibold text-slate-900">How it works: </strong>
                {synthesis.example.explanation}
              </p>
            )}
          </section>
        )}

        {/* 4. Important Points */}
        {synthesis.importantPoints && synthesis.importantPoints.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Important Points
              </h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {synthesis.importantPoints.map((point, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 5. Quick Summary */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Quick Summary
            </h3>
          </div>
          <div className="p-3.5 bg-indigo-50/60 border-l-3 border-indigo-600 rounded-r-xl text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
            {synthesis.quickSummary}
          </div>
        </section>

        {/* 6. Practice Questions */}
        {synthesis.practiceQuestions && synthesis.practiceQuestions.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Practice Questions
                </h3>
              </div>
              <button
                onClick={onGenerateQuiz}
                type="button"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Launch Full Interactive Quiz →
              </button>
            </div>

            <div className="space-y-2">
              {synthesis.practiceQuestions.map((pq, idx) => (
                <div key={pq.id || idx} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-indigo-600 shrink-0 mt-0.5">
                      Q{idx + 1}.
                    </span>
                    <div className="text-xs sm:text-sm text-slate-800">
                      <p className="font-medium">{pq.question}</p>
                      {pq.hint && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          💡 Hint: {pq.hint}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interactive Action Toolbar */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2.5">
          <button
            onClick={onGenerateQuiz}
            type="button"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer w-full sm:w-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Generate Quiz</span>
          </button>

          <button
            onClick={onMakeNotes}
            type="button"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer w-full sm:w-auto"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            <span>Make Study Notes</span>
          </button>

          <button
            onClick={onExplainMoreSimply}
            type="button"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Explain More Simply</span>
          </button>

          <button
            onClick={onAskFollowUp}
            type="button"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer w-full sm:w-auto"
          >
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Ask Follow-up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
