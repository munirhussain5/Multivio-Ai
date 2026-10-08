import { UploadedDocument } from '../../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// Configure local bundled worker URL (no external CDN dependencies)
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (err) {
    console.warn('Unable to set pdfjs workerSrc:', err);
  }
}

export type DocumentCategory = 'presentation' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'text';

export function getDocumentCategory(fileName: string): DocumentCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['pptx', 'ppt', 'odp', 'key'].includes(ext)) return 'presentation';
  if (ext === 'pdf') return 'pdf';
  if (['docx', 'doc', 'odt', 'rtf', 'pages'].includes(ext)) return 'document';
  if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext)) return 'spreadsheet';
  if (['py', 'java', 'cpp', 'c', 'cs', 'ts', 'js', 'html', 'css', 'json', 'xml', 'sql', 'sh', 'tex'].includes(ext)) return 'code';
  return 'text';
}

/**
 * Universal document text extraction for:
 * - PowerPoint presentations (.pptx, .ppt, .odp)
 * - PDFs (.pdf)
 * - Word documents (.docx, .doc, .odt, .rtf)
 * - Spreadsheets (.xlsx, .xls, .csv, .tsv)
 * - Text, Markdown, LaTeX, and Source Code (.txt, .md, .tex, .py, .java, .cpp, .sql, etc.)
 */
export async function parseUploadedDocument(file: File): Promise<UploadedDocument> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';
  let pageCount: number | undefined = undefined;
  let slideCount: number | undefined = undefined;

  try {
    if (fileExt === 'pptx' || fileExt === 'ppt') {
      const pptResult = await extractTextFromPptx(file);
      extractedText = pptResult.text;
      slideCount = pptResult.slides;
    } else if (fileExt === 'odp') {
      const odpResult = await extractTextFromOpenDocument(file);
      extractedText = odpResult.text;
      slideCount = odpResult.slides;
    } else if (fileExt === 'pdf' || file.type === 'application/pdf') {
      const pdfResult = await extractTextFromPDF(file);
      extractedText = pdfResult.text;
      pageCount = pdfResult.pages;
    } else if (fileExt === 'docx') {
      extractedText = await extractTextFromDocx(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      extractedText = await extractTextFromXlsx(file);
    } else if (fileExt === 'odt') {
      const odtResult = await extractTextFromOpenDocument(file);
      extractedText = odtResult.text;
    } else if (fileExt === 'rtf') {
      const rawRtf = await readAsPlainText(file);
      extractedText = cleanRtf(rawRtf);
    } else {
      // Plain text, Markdown, CSV, JSON, code, LaTeX, HTML, etc.
      extractedText = await readAsPlainText(file);
    }
  } catch (err) {
    console.warn('Specialized parsing failed, attempting fallback plain text reading:', err);
    extractedText = await readAsPlainText(file).catch(() => '');
  }

  // Clean extracted text: remove null bytes and normalize whitespace
  const cleanedText = extractedText
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean) : [];

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    type: file.type || `application/${fileExt}`,
    text: cleanedText || `Lecture Document: ${file.name} attached for educational analysis.`,
    wordCount: Math.max(words.length, 1),
    pageCount,
    slideCount,
    uploadedAt: Date.now(),
  };
}

/**
 * Extracts slide texts, titles, bullet points, and speaker notes from PowerPoint .pptx
 */
async function extractTextFromPptx(file: File): Promise<{ text: string; slides: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Find slide XML entries: ppt/slides/slide1.xml, etc.
    const slideEntries: { name: string; num: number; file: JSZip.JSZipObject }[] = [];
    
    zip.forEach((relativePath, zipEntry) => {
      const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
      if (match) {
        slideEntries.push({
          name: relativePath,
          num: parseInt(match[1], 10),
          file: zipEntry,
        });
      }
    });

    slideEntries.sort((a, b) => a.num - b.num);

    const slideTexts: string[] = [];
    for (const item of slideEntries) {
      const xml = await item.file.async('text');
      // Extract <a:t>...</a:t>
      const textMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
      const slideStrings = textMatches.map(t => t.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      
      // Check for speaker notes: ppt/notesSlides/notesSlide{N}.xml
      let notesText = '';
      const notesFile = zip.file(`ppt/notesSlides/notesSlide${item.num}.xml`);
      if (notesFile) {
        try {
          const notesXml = await notesFile.async('text');
          const noteMatches = notesXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
          const noteStrings = noteMatches.map(t => t.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
          if (noteStrings.length > 0) {
            notesText = `\n*Speaker Notes:* ${noteStrings.join(' ')}`;
          }
        } catch {
          // ignore notes extraction error
        }
      }

      if (slideStrings.length > 0 || notesText) {
        slideTexts.push(`### Slide ${item.num}\n${slideStrings.join('\n')}${notesText}`);
      }
    }

    const fullText = slideTexts.join('\n\n');
    if (fullText.trim().length > 10) {
      return {
        text: `--- PowerPoint Presentation: ${file.name} (${slideEntries.length} Slides) ---\n\n${fullText}`,
        slides: slideEntries.length || 1,
      };
    }
  } catch (err) {
    console.warn('JSZip PPTX extraction failed, using stream fallback:', err);
  }

  // Fallback for PPT / binary PPT
  return fallbackPptExtractor(file);
}

async function fallbackPptExtractor(file: File): Promise<{ text: string; slides: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const decoder = new TextDecoder('latin1');
  const rawString = decoder.decode(arrayBuffer);

  const slideMatches = rawString.match(/Slide\s*\d+/gi) || [];
  const estimatedSlides = Math.max(slideMatches.length, 1);

  // Extract printable unicode/ascii sequences
  const textMatches = rawString.match(/[A-Za-z0-9,.;:!?'"()/\-\s]{5,}/g) || [];
  const filtered = textMatches.filter(s => s.trim().length > 15 && /[a-zA-Z]{3,}/.test(s));

  return {
    text: `--- Presentation: ${file.name} (~${estimatedSlides} Slides) ---\n\n` + filtered.slice(0, 200).join('\n'),
    slides: estimatedSlides,
  };
}

/**
 * Extracts text from Word .docx XML
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (docXmlFile) {
      const xml = await docXmlFile.async('text');
      const paragraphs = xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, '\t')
        .replace(/<[^>]+>/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      if (paragraphs.length > 10) return paragraphs;
    }
  } catch (err) {
    console.warn('JSZip DOCX parse error:', err);
  }
  return readAsPlainText(file);
}

/**
 * Extracts tabular data and cell text from Excel .xlsx
 */
async function extractTextFromXlsx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Shared strings
    const sharedStringsFile = zip.file('xl/sharedStrings.xml');
    const sharedStrings: string[] = [];
    if (sharedStringsFile) {
      const xml = await sharedStringsFile.async('text');
      const matches = xml.match(/<t[^>]*>(.*?)<\/t>/g) || [];
      matches.forEach(m => sharedStrings.push(m.replace(/<[^>]+>/g, '')));
    }

    const sheetFile = zip.file('xl/worksheets/sheet1.xml');
    if (sheetFile) {
      const sheetXml = await sheetFile.async('text');
      const rowMatches = sheetXml.match(/<row[^>]*>(.*?)<\/row>/g) || [];
      const rows: string[] = [];
      for (const row of rowMatches.slice(0, 100)) {
        const cellMatches = row.match(/<v>(.*?)<\/v>/g) || [];
        const cellVals = cellMatches.map(c => {
          const val = c.replace(/<[^>]+>/g, '');
          const idx = parseInt(val, 10);
          return !isNaN(idx) && sharedStrings[idx] ? sharedStrings[idx] : val;
        });
        if (cellVals.length > 0) rows.push(cellVals.join(' | '));
      }
      if (rows.length > 0) return `Spreadsheet Data (${file.name}):\n\n` + rows.join('\n');
    }
    if (sharedStrings.length > 0) {
      return `Spreadsheet Data (${file.name}):\n` + sharedStrings.join(', ');
    }
  } catch (err) {
    console.warn('JSZip XLSX error:', err);
  }
  return readAsPlainText(file);
}

/**
 * Extracts text from OpenDocument presentations/text (.odp, .odt)
 */
async function extractTextFromOpenDocument(file: File): Promise<{ text: string; slides?: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const contentXml = zip.file('content.xml');
    if (contentXml) {
      const xml = await contentXml.async('text');
      
      // Count draw:page for slides
      const pageMatches = xml.match(/<draw:page\b/g);
      const slides = pageMatches ? pageMatches.length : undefined;

      const text = xml
        .replace(/<\/text:p>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
      return { text, slides };
    }
  } catch (err) {
    console.warn('OpenDocument error:', err);
  }
  return { text: await readAsPlainText(file) };
}

/**
 * Extracts text from PDF
 */
async function extractTextFromPDF(file: File): Promise<{ text: string; pages: number }> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const pages = pdf.numPages;
    const textChunks: string[] = [];

    for (let pageNum = 1; pageNum <= Math.min(pages, 100); pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        if (pageText.trim()) {
          textChunks.push(`--- Page ${pageNum} ---\n${pageText.trim()}`);
        }
      } catch (pageErr) {
        console.warn(`Could not extract page ${pageNum}:`, pageErr);
      }
    }

    const fullText = textChunks.join('\n\n');
    if (fullText.trim().length > 20) {
      return { text: fullText, pages };
    }
  } catch (pdfJsErr) {
    console.warn('pdfjs-dist worker or parsing encountered an issue, running stream extractor:', pdfJsErr);
  }

  return fallbackPdfTextExtractor(arrayBuffer);
}

async function fallbackPdfTextExtractor(arrayBuffer: ArrayBuffer): Promise<{ text: string; pages: number }> {
  const decoder = new TextDecoder('latin1');
  const rawString = decoder.decode(arrayBuffer);
  
  const matches: string[] = [];
  const textPattern = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;

  while ((match = textPattern.exec(rawString)) !== null) {
    const cleanChunk = match[1]
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\r/g, ' ')
      .replace(/\\n/g, ' ')
      .trim();
    if (cleanChunk.length > 1 && !/^[\x00-\x1F\x7F-\x9F]+$/.test(cleanChunk)) {
      matches.push(cleanChunk);
    }
  }

  const pageMatches = rawString.match(/\/Type\s*\/Page\b/g);
  const estimatedPages = pageMatches ? pageMatches.length : 1;

  if (matches.length > 5) {
    return {
      text: matches.join(' '),
      pages: estimatedPages,
    };
  }

  // If binary strings failed, extract printable sequences
  const asciiMatches = rawString.match(/[A-Za-z0-9,.;:!?'"()/\-\s]{5,}/g) || [];
  const filtered = asciiMatches.filter(s => s.trim().length > 15 && /[a-zA-Z]{3,}/.test(s));

  return {
    text: filtered.slice(0, 150).join('\n'),
    pages: estimatedPages,
  };
}

function cleanRtf(raw: string): string {
  return raw
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\[a-z0-9-]+/gi, '')
    .replace(/[{}]/g, '')
    .trim();
}

function readAsPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
