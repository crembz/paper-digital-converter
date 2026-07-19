import * as pdfjsLib from 'pdfjs-dist';
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfJsWorker;

const pdfjsLogger = {
  warn: () => {},
  error: (msg: string) => {
    if (msg.includes('XFA') || msg.includes('xfa') || msg.includes('rich text')) return;
  },
};
(pdfjsLib.GlobalWorkerOptions as unknown as Record<string, unknown>).logger = pdfjsLogger;

async function renderPageToDataUri(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 3 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL('image/png');
}

export async function renderPdfPages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  const silentWarn = console.warn.bind(console);
  const silentError = console.error.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('XFA') || msg.includes('xfa') || msg.includes('rich text'))) return;
    silentWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('XFA') || msg.includes('xfa') || msg.includes('rich text'))) return;
    silentError(...args);
  };

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      pages.push(await renderPageToDataUri(pdf, i));
    }
  } finally {
    console.warn = silentWarn;
    console.error = silentError;
  }

  return pages;
}
