import React, { useRef, useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Loader2, 
  Upload, 
  Paperclip, 
  Presentation, 
  FileText, 
  FileSpreadsheet, 
  FileCode2, 
  Eye, 
  X, 
  ChevronDown, 
  BookOpen, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UploadedDocument } from '../../types';
import { 
  parseUploadedDocument, 
  formatFileSize, 
  getDocumentCategory, 
  DocumentCategory 
} from '../../services/documents/documentParser';

export const PRESET_LECTURES: UploadedDocument[] = [
  {
    id: 'preset_cs101',
    name: 'CS101_Lecture08_Trees_And_Graphs.pptx',
    size: 2450000,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    wordCount: 3420,
    slideCount: 24,
    uploadedAt: Date.now(),
    text: `--- PowerPoint Presentation: CS101_Lecture08_Trees_And_Graphs.pptx (24 Slides) ---

### Slide 1: CS101 Lecture 8 - Trees & Graph Traversals
Prof. H. Vance - Department of Computer Science
Today: Tree Terminology, Binary Search Trees, Balanced Trees (AVL/Red-Black), Graph Representations, BFS & DFS.

### Slide 2: Why Trees?
Hierarchical data structures vs linear arrays.
O(log n) lookup, insertion, deletion in balanced search trees.
File systems, DOM trees, AST compilers, database B-Trees.

### Slide 3: Binary Search Tree (BST) Invariant
For every node N:
- Every key in LeftSubtree(N) < N.key
- Every key in RightSubtree(N) > N.key
In-order traversal visits nodes in sorted ascending order!
[Speaker Notes]: Emphasize that degenerate BSTs degrade to O(n) linked lists unless rebalanced.

### Slide 4: Tree Traversal Orders
- Pre-order (Root, Left, Right): Cloning trees, serialization.
- In-order (Left, Root, Right): Sorted sequence in BST.
- Post-order (Left, Right, Root): Deleting trees, bottom-up calculations.
- Level-order (BFS): Finding shortest paths in unweighted trees.

### Slide 5: Graph Terminology & Representations
Adjacency Matrix: Space O(V^2), fast edge check O(1).
Adjacency List: Space O(V + E), optimal for sparse graphs.
Directed vs Undirected, Weighted vs Unweighted.

### Slide 6: Breadth-First Search (BFS)
Queue-based exploration. Explores neighbor vertices level by level. Optimal for shortest path in unweighted graphs. Time: O(V + E).

### Slide 7: Depth-First Search (DFS)
Stack / recursive exploration. Used for cycle detection, topological sorting (DAGs), connected components. Time: O(V + E).`,
  },
  {
    id: 'preset_db204',
    name: 'CS204_Lecture05_Database_Normalization_SQL.pdf',
    size: 1820000,
    type: 'application/pdf',
    wordCount: 2890,
    pageCount: 16,
    uploadedAt: Date.now(),
    text: `--- Lecture Document: CS204 Relational Database Design & SQL Joins (16 Pages) ---

--- Page 1 ---
CS204: Database Management Systems
Topic: Normalization (1NF, 2NF, 3NF, BCNF), Primary & Foreign Keys, SQL Joins

--- Page 2 ---
Normal Forms Summary:
1. First Normal Form (1NF): Atomic column values, no repeating groups.
2. Second Normal Form (2NF): In 1NF + no partial functional dependencies on a composite primary key.
3. Third Normal Form (3NF): In 2NF + no transitive dependencies (non-key attributes depend only on the key).

--- Page 3 ---
SQL Join Types:
- INNER JOIN: Matching rows in both tables.
- LEFT JOIN: All left rows + matched right rows.
- Indexing (B+ Trees): Accelerates SELECT queries while adding write overhead on INSERT/UPDATE.`,
  },
  {
    id: 'preset_os301',
    name: 'CS301_Lecture10_OS_Processes_Deadlocks.pptx',
    size: 3100000,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    wordCount: 2650,
    slideCount: 18,
    uploadedAt: Date.now(),
    text: `--- PowerPoint Presentation: CS301 Operating Systems - Processes, Threads & Deadlocks (18 Slides) ---

### Slide 1: CS301 Operating Systems
Department of Computer Science - Week 10

### Slide 2: Process vs Thread
Process: Independent address space, PCB, heavier context switch.
Thread: Shares heap & code with sibling threads in the same process, lightweight stack & registers.

### Slide 3: Coffman's Four Deadlock Conditions
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait

### Slide 4: CPU Scheduling Algorithms
FCFS, Shortest Job First (SJF), Round Robin (time quantum), Priority Scheduling.`,
  },
  {
    id: 'preset_cs320',
    name: 'CS320_Lecture07_Eigenvalues_For_ML.docx',
    size: 980000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    wordCount: 2150,
    pageCount: 10,
    uploadedAt: Date.now(),
    text: `CS 320: Mathematics for Computing & Machine Learning - Eigenvalues & Dimensionality Reduction

1. Core Definition
Let A be an n x n covariance matrix. Scalar lambda is an eigenvalue and v != 0 is an eigenvector if:
A * v = lambda * v
Non-trivial solutions exist when det(A - lambda * I) = 0.

2. Applications in Computer Science
- Principal Component Analysis (PCA) for feature reduction in Machine Learning
- PageRank eigenvector computation in Search Engines
- Spectral Graph Partitioning & Computer Graphics transformations.`,
  },
];

interface IntegratedSearchInputProps {
  question: string;
  setQuestion: (q: string) => void;
  attachedDocument: UploadedDocument | null;
  setAttachedDocument: (doc: UploadedDocument | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const IntegratedSearchInput: React.FC<IntegratedSearchInputProps> = ({
  question,
  setQuestion,
  attachedDocument,
  setAttachedDocument,
  onSubmit,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingFileName, setParsingFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum size limit.');
      return;
    }

    setErrorMsg(null);
    setParsingFileName(file.name);
    setIsParsing(true);
    setIsOptionsOpen(false);

    try {
      const parsedDoc = await parseUploadedDocument(file);
      setAttachedDocument(parsedDoc);
      // If question is empty, suggest summarizing this lecture
      if (!question.trim()) {
        setQuestion(`Summarize key concepts and exam points from ${file.name}`);
      }
    } catch (err: any) {
      console.error('Error parsing document:', err);
      setErrorMsg('Failed to process document. Please try a PowerPoint (.pptx), PDF, Word, or Text file.');
    } finally {
      setIsParsing(false);
      setParsingFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectPreset = (preset: UploadedDocument) => {
    setAttachedDocument(preset);
    setIsOptionsOpen(false);
    if (!question.trim()) {
      if (preset.id === 'preset_cs101') {
        setQuestion('Explain binary search trees vs graphs and traversal complexities from lecture slides');
      } else if (preset.id === 'preset_db204') {
        setQuestion('Explain 1NF, 2NF, 3NF database normalization and SQL joins from the lecture notes');
      } else if (preset.id === 'preset_os301') {
        setQuestion('Compare processes vs threads and explain Coffman deadlock conditions from this slide deck');
      } else {
        setQuestion('Explain how eigenvalues and eigenvectors are used in PCA and PageRank for Machine Learning');
      }
    }
  };

  const getFormatBadge = (name: string) => {
    const category: DocumentCategory = getDocumentCategory(name);
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';

    if (category === 'presentation') {
      return {
        badge: ext,
        label: 'Presentation',
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: Presentation,
      };
    }
    if (category === 'pdf') {
      return {
        badge: 'PDF',
        label: 'PDF Document',
        bg: 'bg-rose-100 text-rose-900 border-rose-300',
        icon: FileText,
      };
    }
    if (category === 'document') {
      return {
        badge: ext,
        label: 'Word Doc',
        bg: 'bg-sky-100 text-sky-900 border-sky-300',
        icon: FileText,
      };
    }
    if (category === 'spreadsheet') {
      return {
        badge: ext,
        label: 'Spreadsheet',
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: FileSpreadsheet,
      };
    }
    if (category === 'code') {
      return {
        badge: ext,
        label: 'Code / Script',
        bg: 'bg-purple-100 text-purple-900 border-purple-300',
        icon: FileCode2,
      };
    }
    return {
      badge: ext,
      label: 'Notes',
      bg: 'bg-slate-100 text-slate-900 border-slate-300',
      icon: FileText,
    };
  };

  return (
    <div className="relative w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pptx,.ppt,.odp,.pdf,.docx,.doc,.odt,.rtf,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.json,.xml,.tex,.py,.java,.cpp,.c,.ts,.js,.sql"
        className="hidden"
        onChange={e => handleFileChange(e.target.files)}
        disabled={isLoading || isParsing}
      />

      {/* Main Integrated Box */}
      <div 
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
          }
        }}
        className={`flex flex-col gap-2 bg-slate-50 border-2 rounded-2xl p-2.5 sm:p-3 transition-all shadow-xs ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-100'
            : 'border-slate-200 focus-within:border-indigo-600 focus-within:bg-white'
        }`}
      >
        {/* Top Attached Lecture Pill (if document is selected) */}
        {attachedDocument && (() => {
          const badge = getFormatBadge(attachedDocument.name);
          const IconComp = badge.icon;
          return (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 text-xs shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`px-1.5 py-0.5 rounded font-black text-[9px] border flex items-center gap-1 ${badge.bg}`}>
                  <IconComp className="w-3 h-3" />
                  <span>{badge.badge.slice(0, 4)}</span>
                </div>
                <span className="font-semibold truncate max-w-[200px] sm:max-w-md text-slate-900" title={attachedDocument.name}>
                  {attachedDocument.name}
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  {attachedDocument.slideCount 
                    ? `(${attachedDocument.slideCount} slides · ~${attachedDocument.wordCount.toLocaleString()} words)`
                    : attachedDocument.pageCount
                    ? `(${attachedDocument.pageCount} pages · ~${attachedDocument.wordCount.toLocaleString()} words)`
                    : `(${formatFileSize(attachedDocument.size)} · ~${attachedDocument.wordCount.toLocaleString()} words)`}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-indigo-200 hover:bg-indigo-100/60 text-[11px] font-medium text-indigo-700 transition-colors cursor-pointer"
                  title="Preview extracted lecture content"
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden xs:inline">Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttachedDocument(null)}
                  disabled={isLoading}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove attached lecture"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Parsing indicator */}
        {isParsing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
            <span className="truncate">
              Extracting lecture slides & text from <span className="font-semibold">{parsingFileName}</span>...
            </span>
          </div>
        )}

        {/* Input & Action Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Question Text Input */}
          <div className="flex items-center flex-1 min-w-0 px-1">
            <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSubmit()}
              placeholder={
                attachedDocument 
                  ? `Ask anything about ${attachedDocument.name.slice(0, 30)}...` 
                  : "what to want to learn today?"
              }
              className="w-full bg-transparent py-1.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons: Lecture Options + Ask Multivio */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto w-full sm:w-auto">
            {/* Options for Lectures Dropdown Trigger */}
            <div className="relative flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                disabled={isLoading || isParsing}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  attachedDocument
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100/70'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-900'
                }`}
                title="Options for lecture slides (PowerPoint, PDF, Word) and sample decks"
              >
                <Presentation className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Lectures</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOptionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Lecture Options Dropdown Menu */}
              {isOptionsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsOptionsOpen(false)} 
                  />
                  <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-1.5 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1.5 font-bold text-slate-900 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lecture & Slide Options</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">PPT, PDF, DOC</span>
                    </div>

                    {/* Option 1: Upload from computer */}
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-950 font-medium flex items-center gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-indigo-900 flex items-center gap-1">
                            <span>Upload Lecture Slides or Document</span>
                          </div>
                          <p className="text-[10px] text-indigo-700 truncate mt-0.5">
                            PowerPoint (.pptx, .ppt), PDF, Word (.docx), Excel, Notes
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Option 2: Pre-loaded Sample Academic Lectures */}
                    <div className="mt-1 pt-1.5 border-t border-slate-100">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Or select a sample lecture:
                      </div>
                      <div className="space-y-1 mt-0.5">
                        {PRESET_LECTURES.map((preset) => {
                          const isSelected = attachedDocument?.id === preset.id;
                          const isPpt = preset.name.endsWith('.pptx');
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPreset(preset)}
                              className={`w-full text-left px-2.5 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                                  : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[8px] shrink-0 ${
                                  isPpt ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {isPpt ? <Presentation className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[11px] truncate text-slate-900">
                                    {preset.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {preset.slideCount ? `${preset.slideCount} slides` : `${preset.pageCount} pages`} · ~{preset.wordCount.toLocaleString()} words
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Ask Multivio Submit Button */}
            <button
              onClick={onSubmit}
              disabled={(!question.trim() && !attachedDocument) || isLoading}
              type="button"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask Multivio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Document Text Preview Modal */}
      {showPreviewModal && attachedDocument && (() => {
        const badge = getFormatBadge(attachedDocument.name);
        const IconComp = badge.icon;

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
                  <div className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center font-black text-[9px] shrink-0 ${badge.bg}`}>
                    <IconComp className="w-4 h-4" />
                    <span>{badge.badge.slice(0, 4)}</span>
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
                        : badge.label} · {attachedDocument.wordCount.toLocaleString()} words
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
                {attachedDocument.text || 'No text content available.'}
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
