import React, { useState } from 'react';
import { AIModelResponse } from '../../types';
import { AI_MODELS } from '../../services/ai/providersConfig';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface AIResponseCardProps {
  response: AIModelResponse;
  defaultExpanded?: boolean;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({
  response,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const modelInfo = AI_MODELS[response.provider];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = response.status === 'success';

  return (
    <div className={`rounded-xl border transition-all ${
      isExpanded 
        ? 'bg-white border-slate-300 shadow-sm' 
        : 'bg-white/80 border-slate-200 hover:border-slate-300'
    }`}>
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-800 shrink-0">
            {modelInfo.name.substring(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                {modelInfo.name}
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                ({response.modelName})
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {modelInfo.providerName}
              </span>
            </div>

            {response.perspectiveHighlight && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Focus: <span className="text-slate-700 font-medium">{response.perspectiveHighlight}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right side stats & controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {response.latencyMs > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono hidden md:flex">
              <Clock className="w-3 h-3" />
              <span>{(response.latencyMs / 1000).toFixed(2)}s</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Copy answer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 p-1"
          >
            {isExpanded ? (
              <>
                <span className="hidden sm:inline">Collapse</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Expand</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
          {response.keyApproach && (
            <div className="my-2.5 px-3 py-2 bg-slate-50 border-l-2 border-indigo-400 rounded-r text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Pedagogical Approach: </span>
              {response.keyApproach}
            </div>
          )}

          {isSuccess ? (
            <MarkdownRenderer content={response.answer} />
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {response.error || 'This AI provider is unavailable for this request.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
