import React from 'react';
import { AIModelResponse, AIProvider, SynthesisResult } from '../../types';
import { AI_MODELS } from '../../services/ai/providersConfig';
import { CheckCircle2, SplitSquareVertical, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

interface CompareMatrixProps {
  question: string;
  selectedModels: AIProvider[];
  responses: Record<AIProvider, AIModelResponse>;
  synthesis: SynthesisResult;
  onBackToStudy: () => void;
}

export const CompareMatrix: React.FC<CompareMatrixProps> = ({
  question,
  selectedModels,
  responses,
  synthesis,
  onBackToStudy,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Side-By-Side AI Perspective Analysis
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 break-words">
            "{question}"
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            See how different AI architectures tackle the exact same educational question.
          </p>
        </div>

        <button
          onClick={onBackToStudy}
          type="button"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span>Back to Lesson</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Consensus & Contrast Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consensus */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Where All Models Agree (Consensus)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {synthesis.agreements?.length > 0 ? (
              synthesis.agreements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">Universal agreement on core conceptual foundations.</li>
            )}
          </ul>
        </div>

        {/* Differences & Unique Angles */}
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
          <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold text-sm">
            <SplitSquareVertical className="w-4 h-4 text-indigo-600" />
            <span>Model Nuances & Divergent Focus</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {synthesis.differencesOrNuances?.length > 0 ? (
              synthesis.differencesOrNuances.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">Each model provides unique depth in its specialized discipline.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Comparative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(selectedModels || []).map(provider => {
          const info = AI_MODELS[provider];
          const res = responses?.[provider];
          if (!res || !info) return null;

          return (
            <div 
              key={provider}
              className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{info.name}</span>
                  <span className="text-[11px] font-mono text-slate-500">{res.modelName}</span>
                </div>
                <div className="text-xs text-indigo-700 font-medium mt-1">
                  {res.perspectiveHighlight || info.tagline}
                </div>
                {res.keyApproach && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {res.keyApproach}
                  </p>
                )}
              </div>

              {/* Scrollable text body */}
              <div className="p-4 max-h-96 overflow-y-auto text-xs text-slate-700 leading-relaxed border-b border-slate-100">
                {res.status === 'success' && res.answer ? (
                  <MarkdownRenderer content={res.answer} />
                ) : (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    {res.error || 'Provider unavailable for this request.'}
                  </div>
                )}
              </div>

              {/* Footer strength badge */}
              <div className="p-3 bg-white text-[11px] text-slate-500 flex items-center justify-between">
                <span>Best for:</span>
                <span className="font-medium text-slate-700">{info.strengths[0]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
