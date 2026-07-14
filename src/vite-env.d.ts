/// <reference types="vite/client" />

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url' {
  const workerSrc: string
  export default workerSrc
}
