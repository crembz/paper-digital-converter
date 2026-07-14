import * as pdfjsLib from 'pdfjs-dist';

async function renderPageToDataUri(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2 });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  await page.render({ canvas, viewport }).promise;
  
  return canvas.toDataURL('image/png');
}

export async function renderPdfPages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    pages.push(await renderPageToDataUri(pdf, i));
  }
  
  return pages;
}
