import React from 'react';
import { CodeBlock } from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by code blocks first
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.substring(lastIndex, match.index);
      parts.push(<TextSection key={`text-${lastIndex}`} text={textChunk} />);
    }
    const language = match[1] || 'code';
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<TextSection key={`text-${lastIndex}`} text={content.substring(lastIndex)} />);
  }

  return <div className={`educational-prose text-slate-800 text-sm leading-relaxed ${className}`}>{parts}</div>;
};

const TextSection: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="my-2 space-y-1 pl-4 list-disc marker:text-indigo-500">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-slate-700 leading-normal">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
      return;
    }

    flushList(`list-${index}`);

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${index}`} className="text-sm font-semibold text-slate-900 mt-3 mb-1 uppercase tracking-wide">
          {formatInline(trimmed.substring(5))}
        </h4>
      );
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-base font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5">
          {formatInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg font-bold text-slate-900 mt-5 mb-2 border-b border-slate-100 pb-1">
          {formatInline(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl font-extrabold text-slate-900 mt-5 mb-2">
          {formatInline(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`bq-${index}`} className="border-l-3 border-indigo-400 pl-3 my-2 text-slate-600 italic bg-indigo-50/30 py-1 rounded-r">
          {formatInline(trimmed.substring(2))}
        </blockquote>
      );
    } else if (trimmed.length > 0) {
      elements.push(
        <p key={`p-${index}`} className="my-1.5 text-slate-700 leading-relaxed">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushList('final');

  return <>{elements}</>;
};

function formatInline(str: string): React.ReactNode {
  // Bold formatting **text**
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-slate-100 text-indigo-700 rounded text-xs font-mono border border-slate-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
