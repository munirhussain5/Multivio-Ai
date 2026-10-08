import React from 'react';
import { AIProvider } from '../../types';
import { AI_MODELS } from '../../services/ai/providersConfig';
import { Check, CheckSquare, Square } from 'lucide-react';

interface AISelectorProps {
  selectedModels: AIProvider[];
  onChange: (models: AIProvider[]) => void;
  disabled?: boolean;
}

export const AISelector: React.FC<AISelectorProps> = ({
  selectedModels,
  onChange,
  disabled = false,
}) => {
  const allProviders: AIProvider[] = ['chatgpt', 'gemini', 'claude', 'deepseek'];

  const toggleModel = (provider: AIProvider) => {
    if (disabled) return;
    if (selectedModels.includes(provider)) {
      // Must keep at least one selected
      if (selectedModels.length > 1) {
        onChange(selectedModels.filter(m => m !== provider));
      }
    } else {
      onChange([...selectedModels, provider]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange([...allProviders]);
  };

  const handleClearAll = () => {
    if (disabled) return;
    // Leave just Gemini as default fallback
    onChange(['gemini']);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Selected AI Perspectives
          </span>
          <span className="text-xs text-slate-400">
            ({selectedModels.length} of {allProviders.length} active)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled || selectedModels.length === allProviders.length}
            className="text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40 disabled:hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Select All
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || selectedModels.length <= 1}
            className="text-slate-500 hover:text-slate-700 font-medium disabled:opacity-40 disabled:hover:text-slate-500 transition-colors cursor-pointer"
          >
            Reset to Primary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {allProviders.map(provider => {
          const info = AI_MODELS[provider];
          const isSelected = selectedModels.includes(provider);

          return (
            <div
              key={provider}
              onClick={() => toggleModel(provider)}
              className={`p-3 rounded-xl border text-left transition-all select-none cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-300 bg-white shadow-xs ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-white text-slate-400'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                      {info.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      · {info.providerName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {info.tagline}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={`font-mono ${isSelected ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                  {info.defaultModelName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {info.strengths[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
