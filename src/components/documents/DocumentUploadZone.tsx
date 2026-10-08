import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  Eye, 
  AlertCircle, 
  FileCode2, 
  Presentation,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { UploadedDocument } from '../../types';
import { 
  parseUploadedDocument, 
  formatFileSize, 
  getDocumentCategory, 
  DocumentCategory 
} from '../../services/documents/documentParser';

interface DocumentUploadZoneProps {
  attachedDocument: UploadedDocument | null;
  onDocumentAttached: (doc: UploadedDocument | null) => void;
  disabled?: boolean;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  attachedDocument,
  onDocumentAttached,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingFileName, setParsingFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // File limit check (e.g. 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File is too large (maximum size is 50MB).');
      return;
    }

    setErrorMsg(null);
    setParsingFileName(file.name);
    setIsParsing(true);

    try {
      const parsedDoc = await parseUploadedDocument(file);
      onDocumentAttached(parsedDoc);
    } catch (err: any) {
      console.error('Error parsing document:', err);
      setErrorMsg('Failed to process document. Please try another lecture file (PowerPoint, PDF, Word, or Text).');
    } finally {
      setIsParsing(false);
      setParsingFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isParsing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const getFormatBadge = (name: string) => {
    const category: DocumentCategory = getDocumentCategory(name);
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';

    if (category === 'presentation') {
      return {
        badge: ext,
        label: 'Presentation',
        bg: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Presentation,
      };
    }
    if (category === 'pdf') {
      return {
        badge: 'PDF',
        label: 'PDF Document',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: FileText,
      };
    }
    if (category === 'document') {
      return {
        badge: ext,
        label: 'Word / Text Doc',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: FileText,
      };
    }
    if (category === 'spreadsheet') {
      return {
        badge: ext,
        label: 'Spreadsheet / Data',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: FileSpreadsheet,
      };
    }
    if (category === 'code') {
      return {
        badge: ext,
        label: 'Code / Script',
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: FileCode2,
      };
    }
    return {
      badge: ext,
      label: 'Lecture Notes',
      bg: 'bg-slate-100 text-slate-800 border-slate-200',
      icon: FileText,
    };
  };

  return (
    <div className="w-full">
      {/* Hidden File Input supporting all document types */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pptx,.ppt,.odp,.pdf,.docx,.doc,.odt,.rtf,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.json,.xml,.tex,.py,.java,.cpp,.c,.ts,.js,.sql"
        className="hidden"
        onChange={e => handleFileChange(e.target.files)}
        disabled={disabled || isParsing}
      />

      {/* When no document is attached */}
      {!attachedDocument && (
        <div className="space-y-1.5">
          {isParsing ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold">Extracting lecture contents: </span>
                <span className="truncate text-indigo-700 font-mono text-[11px]">{parsingFileName}</span>
                <span className="text-indigo-500 block text-[10px] mt-0.5">
                  Reading slides, notes, tables, and text for Multi-AI synthesis...
                </span>
              </div>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`transition-all rounded-xl border border-dashed px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                isDragOver 
                  ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-200' 
                  : 'border-slate-300 bg-slate-50/80 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs shrink-0">
                  <Upload className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>Upload Lecture Slides & Documents</span>
                    <span className="text-[10px] font-medium bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                      PPT · PDF · DOC · XLS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    PowerPoint presentations (.pptx), PDFs, Word (.docx), spreadsheets, or study notes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose File</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick format indicators */}
          {!isParsing && (
            <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] text-slate-400">
              <span className="font-medium text-slate-500">Supports:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">.pptx / .ppt</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">.pdf</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">.docx / .doc</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">.xlsx / .csv</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">.txt / .md / code</span>
            </div>
          )}
        </div>
      )}

      {/* Error notification */}
      {errorMsg && (
        <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attached Document Card */}
      {attachedDocument && (() => {
        const badgeInfo = getFormatBadge(attachedDocument.name);
        const IconComponent = badgeInfo.icon;

        return (
          <div className="bg-[#e0f2fe]/60 border border-sky-300/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs transition-all">
            <div className="flex items-center gap-3 min-w-0">
              {/* Type Badge */}
              <div className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center font-black text-[10px] shrink-0 shadow-2xs ${badgeInfo.bg}`}>
                <IconComponent className="w-4 h-4 mb-0.5" />
                <span className="leading-none text-[8px] tracking-tight">{badgeInfo.badge.slice(0, 4)}</span>
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[220px] sm:max-w-md" title={attachedDocument.name}>
                    {attachedDocument.name}
                  </span>
                  <span className="text-[10px] bg-sky-200/90 text-sky-900 px-1.5 py-0.5 rounded font-semibold border border-sky-300 shrink-0">
                    Ready for Multi-AI
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-700">{badgeInfo.label}</span>
                  <span>·</span>
                  <span>{formatFileSize(attachedDocument.size)}</span>
                  <span>·</span>
                  {attachedDocument.slideCount ? (
                    <>
                      <span className="font-semibold text-orange-950 bg-orange-100/90 px-1.5 py-0.2 rounded border border-orange-200">
                        {attachedDocument.slideCount} Slides
                      </span>
                      <span>·</span>
                    </>
                  ) : attachedDocument.pageCount ? (
                    <>
                      <span className="font-semibold text-rose-950 bg-rose-100/90 px-1.5 py-0.2 rounded border border-rose-200">
                        {attachedDocument.pageCount} Pages
                      </span>
                      <span>·</span>
                    </>
                  ) : null}
                  <span>~{attachedDocument.wordCount.toLocaleString()} words extracted</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Preview extracted text */}
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-sky-300 hover:bg-sky-50 text-xs font-semibold text-sky-900 transition-colors cursor-pointer shadow-2xs"
                title="Inspect extracted lecture text"
              >
                <Eye className="w-3.5 h-3.5 text-sky-700" />
                <span>Preview Lecture</span>
              </button>

              {/* Remove document */}
              <button
                type="button"
                onClick={() => onDocumentAttached(null)}
                disabled={disabled}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remove attached document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Document Text Preview Modal */}
      {showPreviewModal && attachedDocument && (() => {
        const badgeInfo = getFormatBadge(attachedDocument.name);
        const IconComponent = badgeInfo.icon;

        return (
          <div 
            onClick={() => setShowPreviewModal(false)}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div 
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center font-black text-[9px] shrink-0 ${badgeInfo.bg}`}>
                    <IconComponent className="w-4 h-4" />
                    <span>{badgeInfo.badge.slice(0, 4)}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {attachedDocument.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {attachedDocument.slideCount 
                        ? `${attachedDocument.slideCount} Slides extracted`
                        : attachedDocument.pageCount 
                        ? `${attachedDocument.pageCount} Pages extracted` 
                        : badgeInfo.label} · {attachedDocument.wordCount.toLocaleString()} words
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 leading-relaxed bg-slate-50/40 whitespace-pre-wrap selection:bg-indigo-100">
                {attachedDocument.text || 'No text could be extracted from this presentation or document.'}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-between text-xs bg-white">
                <span className="text-slate-500">
                  Ready to analyze across ChatGPT, Gemini, Claude, and DeepSeek.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
