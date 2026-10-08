import React, { useState } from 'react';
import { AIModelResponse, AIProvider, SynthesisResult } from '../../types';
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
  Layers,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CombinedAnswerProps {
  synthesis: SynthesisResult;
  question: string;
  responses?: Record<AIProvider, AIModelResponse>;
  selectedModels?: AIProvider[];
  onGenerateQuiz: () => void;
  onMakeNotes: () => void;
  onExplainMoreSimply: () => void;
  onExplainInDetail?: () => void;
  onAskFollowUp: () => void;
  onSaveAnswer: () => void;
  isSaved?: boolean;
}

export const CombinedAnswer: React.FC<CombinedAnswerProps> = ({
  synthesis,
  question,
  responses,
  selectedModels = ['chatgpt', 'gemini', 'claude', 'deepseek'],
  onGenerateQuiz,
  onMakeNotes,
  onExplainMoreSimply,
  onExplainInDetail,
  onAskFollowUp,
  onSaveAnswer,
  isSaved = false,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [detailedTab, setDetailedTab] = useState<'synthesis' | 'comparison'>('synthesis');
  const [activeModelPill, setActiveModelPill] = useState<AIProvider | 'all'>('all');

  const handleShare = () => {
    const textToCopy = `StudyMind Educational Answer: ${question}\n\nSummary:\n${synthesis.quickSummary}\n\nFull explanation on StudyMind.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleFullDetailClick = () => {
    setDetailedTab('comparison');
    if (onExplainInDetail) {
      onExplainInDetail();
    }
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
                  StudyMind Master Lesson
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] font-semibold uppercase tracking-wider">
                  7-Point Format
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
                Unified comparative synthesis across ChatGPT, Gemini, Claude, and DeepSeek.
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

      {/* Main 7 Content Sections */}
      <div className="p-5 sm:p-7 space-y-7">
        {/* 1. Simple Explanation */}
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              1. Simple Explanation
            </h3>
          </div>
          <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 text-slate-800 text-sm leading-relaxed">
            <MarkdownRenderer content={synthesis.simpleExplanation} />
          </div>
        </section>

        {/* 2. Detailed Explanation (With Multi-Model Comparison) */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                2. Detailed Explanation
              </h3>
            </div>

            {/* Toggle format buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setDetailedTab('synthesis')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  detailedTab === 'synthesis'
                    ? 'bg-white text-indigo-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Master Synthesis
              </button>
              <button
                type="button"
                onClick={() => setDetailedTab('comparison')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  detailedTab === 'comparison'
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/70'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compare All AI Models</span>
              </button>
            </div>
          </div>

          {/* Model Comparison Breakdown Box */}
          <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50/60 to-sky-50/70 border border-indigo-200/70 rounded-xl p-3.5 sm:p-4 mb-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Cross-AI Model Comparative Synthesis
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                ChatGPT · Gemini · Claude · DeepSeek
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Synthesizing all distinct cognitive viewpoints into one authoritative educational explanation:
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailedTab('comparison');
                  setActiveModelPill('chatgpt');
                }}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  detailedTab === 'comparison' && activeModelPill === 'chatgpt'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ChatGPT
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Structured syllabus, taxonomy & numbered steps</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailedTab('comparison');
                  setActiveModelPill('gemini');
                }}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  detailedTab === 'comparison' && activeModelPill === 'gemini'
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Gemini
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Intuitive analogies & big-picture mental models</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailedTab('comparison');
                  setActiveModelPill('claude');
                }}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  detailedTab === 'comparison' && activeModelPill === 'claude'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Claude
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Academic depth, theoretical boundary rules & nuance</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailedTab('comparison');
                  setActiveModelPill('deepseek');
                }}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  detailedTab === 'comparison' && activeModelPill === 'deepseek'
                    ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-400/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-violet-300 shadow-2xs'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    DeepSeek
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Underlying mechanics, execution & performance tradeoffs</p>
              </button>
            </div>
          </div>

          {/* If Comparison Tab is Active: Show Selected AI Models Breakdown */}
          {detailedTab === 'comparison' && responses && (
            <div className="mb-4 bg-slate-50 rounded-xl border border-indigo-200/80 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Detailed Model Perspective Explorer
                </span>
                
                {/* Model Selector Pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveModelPill('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      activeModelPill === 'all'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    All 4 Models
                  </button>
                  {selectedModels.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setActiveModelPill(m)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                        activeModelPill === m
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Models Grid or Single View */}
              <div className="space-y-3">
                {selectedModels
                  .filter(m => activeModelPill === 'all' || activeModelPill === m)
                  .map(m => {
                    const res = responses[m];
                    if (!res) return null;
                    return (
                      <div
                        key={m}
                        className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                            <strong className="text-xs font-bold text-slate-900 capitalize">
                              {res.modelName || m}
                            </strong>
                            {res.perspectiveHighlight && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                                {res.perspectiveHighlight}
                              </span>
                            )}
                          </div>
                          {res.latencyMs && (
                            <span className="text-[11px] font-mono text-slate-400">
                              {res.latencyMs}ms response
                            </span>
                          )}
                        </div>

                        {res.keyApproach && (
                          <p className="text-xs text-indigo-900 bg-indigo-50/50 p-2 rounded-md font-medium">
                            <span className="font-semibold">Cognitive Approach: </span>
                            {res.keyApproach}
                          </p>
                        )}

                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-1 max-h-96 overflow-y-auto">
                          <MarkdownRenderer content={res.answer} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Master Unified Synthesis Markdown */}
          <div className="text-slate-800 text-sm leading-relaxed space-y-3 bg-white p-4.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Authoritative Master Synthesis:
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Unified across all models
              </span>
            </div>
            <MarkdownRenderer content={synthesis.detailedExplanation} />
          </div>
        </section>

        {/* 3. Practical Example */}
        {synthesis.example && (
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <Code2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                3. Practical Example
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
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                4. Important Points
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

        {/* 5. Common Mistakes */}
        {synthesis.commonMistakes && synthesis.commonMistakes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                5. Common Mistakes & Pitfalls
              </h3>
            </div>
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4">
              <p className="text-xs text-rose-900 font-semibold mb-2.5">
                Watch out for these frequent misconceptions and exam traps:
              </p>
              <ul className="space-y-2">
                {synthesis.commonMistakes.map((mistake, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-rose-100 text-xs sm:text-sm text-slate-800 shadow-2xs"
                  >
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ✕
                    </span>
                    <span className="leading-relaxed">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 6. Quick Summary */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
              6
            </span>
            <Zap className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              6. Quick Summary
            </h3>
          </div>
          <div className="p-3.5 bg-indigo-50/60 border-l-3 border-indigo-600 rounded-r-xl text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
            {synthesis.quickSummary}
          </div>
        </section>

        {/* 7. Practice Questions */}
        {synthesis.practiceQuestions && synthesis.practiceQuestions.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-800 font-bold text-xs flex items-center justify-center shrink-0">
                  7
                </span>
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  7. Practice Questions
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

          {onExplainInDetail && (
            <button
              onClick={handleFullDetailClick}
              type="button"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-300 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Explain in Full Detail (All Models)</span>
            </button>
          )}

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
