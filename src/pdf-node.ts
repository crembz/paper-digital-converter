import * as pdfjsLib from 'pdfjs-dist';
import { createCanvas } from '@napi-rs/canvas';
import { promises as fs } from 'fs';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function renderPdfPages(filePath: string): Promise<string[]> {
  const buffer = await fs.readFile(filePath);
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 3 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    await page.render({ canvasContext: ctx, viewport }).promise;

    pages.push(canvas.toDataURL('image/png'));
  }

  return pages;
}
