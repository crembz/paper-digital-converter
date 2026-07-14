import { useCallback, useEffect, useRef, useState } from 'react';
import { AppConfig, loadConfig, saveConfig } from './services/config';
import { convertImageToMarkdown } from './services/llm';
import { generateFilenameFromMarkdown } from './utils/filename';
import ImageUploader from './components/ImageUploader';
import ImagePreview from './components/ImagePreview';
import MarkdownEditor from './components/MarkdownEditor';
import StatusBar from './components/StatusBar';
import ConfigPanel from './components/ConfigPanel';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [markdown, setMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [outputFilename, setOutputFilename] = useState('output.md');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [convertingPage, setConvertingPage] = useState<{ current: number; total: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (typeof window.electronAPI === 'undefined') return;

    window.electronAPI.isMaximized().then(setIsMaximized);

    const unsubscribe = window.electronAPI.onWindowStateChanged((data) => {
      setIsMaximized(data.maximized);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleImageLoaded = useCallback((dataUri: string) => {
    setPages([dataUri]);
    setCurrentPage(0);
    setMarkdown('');
    setError(null);
  }, []);

  const handlePdfLoaded = useCallback((pdfPages: string[], _filename: string) => {
    setPages(pdfPages);
    setCurrentPage(0);
    setMarkdown('');
    setError(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setPages([]);
    setCurrentPage(0);
    setMarkdown('');
    setError(null);
    setConvertingPage(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!config || pages.length === 0) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsProcessing(true);
    setMarkdown('');
    setError(null);
    setConvertingPage({ current: 1, total: pages.length });

    let fullResult = '';

    try {
      for (let i = 0; i < pages.length; i++) {
        if (abortController.signal.aborted) break;

        setConvertingPage({ current: i + 1, total: pages.length });

        const pageResult = await convertImageToMarkdown(
          config,
          pages[i],
          (chunk: string) => {
            setMarkdown((prev) => prev + chunk);
          },
          abortController.signal,
        );

        fullResult += pageResult;

        if (i < pages.length - 1) {
          fullResult += '\n\n---\n\n';
          setMarkdown((prev) => prev + '\n\n---\n\n');
        }
      }

      if (!abortController.signal.aborted && fullResult) {
        setOutputFilename(`${generateFilenameFromMarkdown(fullResult)}.md`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      if (message !== 'The operation was aborted') {
        setError(message);
      }
    } finally {
      setIsProcessing(false);
      setConvertingPage(null);
      abortControllerRef.current = null;
    }
  }, [config, pages]);

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSave = useCallback(async () => {
    if (typeof window.electronAPI === 'undefined') return;
    const filePath = await window.electronAPI.saveFileDialog(outputFilename);

    if (filePath) {
      await window.electronAPI.writeFile(filePath, markdown);
    }
  }, [markdown, outputFilename]);

  const handleConfigSaved = useCallback(async (savedConfig: AppConfig) => {
    await saveConfig(savedConfig);
    setConfig(savedConfig);
    setShowConfig(false);
  }, []);

  const hasPages = pages.length > 0;
  const currentImage = hasPages ? pages[currentPage] ?? pages[0]! : null;

  return (
    <div className="container">
      <div className="top-bar">
        <h1>Paper → Digital Converter</h1>
        <div className="top-bar__controls">
          <button className="btn-secondary" onClick={() => setShowConfig(true)}>
            Settings
          </button>
          <div className="window-controls">
            <button className="window-controls__btn window-controls__btn--minimize" onClick={() => window.electronAPI.minimizeWindow()}>
              <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button className="window-controls__btn window-controls__btn--maximize" onClick={() => window.electronAPI.maximizeWindow()}>
              {isMaximized ? (
                <svg width="12" height="12" viewBox="0 0 12 12"><rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="3" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
              )}
            </button>
            <button className="window-controls__btn window-controls__btn--close" onClick={() => window.electronAPI.closeWindow()}>
              <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="split-view">
        <div className="panel">
          {!hasPages && !pdfLoading ? (
            <ImageUploader
              onImageSelect={handleImageLoaded}
              onPdfSelect={handlePdfLoaded}
              onLoadingState={setPdfLoading}
            />
          ) : pdfLoading ? (
            <ImageUploader
              onImageSelect={handleImageLoaded}
              onPdfSelect={handlePdfLoaded}
              onLoadingState={setPdfLoading}
            />
          ) : (
            <ImagePreview
              image={currentImage!}
              onReplace={handleRemoveImage}
              totalPages={pages.length}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        <div className="panel">
          <MarkdownEditor markdown={markdown} readOnly={isProcessing} />
        </div>
      </div>

      <StatusBar
        isProcessing={isProcessing}
        error={error}
        hasImage={hasPages}
        hasConfig={!!config}
        hasMarkdown={!!markdown}
        onConvert={handleConvert}
        onAbort={handleAbort}
        onSave={handleSave}
        convertingPage={convertingPage}
      />

      {showConfig && (
        <div className="overlay" onClick={() => setShowConfig(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <ConfigPanel
              config={config}
              onSave={handleConfigSaved}
              onClose={() => setShowConfig(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
