import { useCallback, useEffect, useRef, useState } from 'react';
import { AppConfig, loadConfig, saveConfig } from './services/config';
import { convertImageToMarkdown } from './services/llm';
import ImageUploader from './components/ImageUploader';
import ImagePreview from './components/ImagePreview';
import StatusBar from './components/StatusBar';
import ConfigPanel from './components/ConfigPanel';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [convertingPage, setConvertingPage] = useState<{ current: number; total: number } | null>(null);
  const [batchFiles, setBatchFiles] = useState<Array<{ pages: string[]; filename: string } | null>>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [filesConverted, setFilesConverted] = useState(0);
  const [filesSkipped, setFilesSkipped] = useState(0);
  const [filesFailed, setFilesFailed] = useState(0);
  const outputFolder = config?.outputFolder || null;
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<'rename' | 'overwrite' | 'skip' | null>(null);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const conflictStrategyRef = useRef(conflictStrategy);
  const existingFilesRef = useRef(existingFiles);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    conflictStrategyRef.current = conflictStrategy;
  }, [conflictStrategy]);

  useEffect(() => {
    existingFilesRef.current = existingFiles;
  }, [existingFiles]);

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

  const handleImageLoaded = useCallback((dataUri: string, filename: string) => {
    setPages([dataUri]);
    setCurrentPage(0);
    setError(null);
    setBatchFiles([]);
    setBatchStatus('idle');
    setFilesConverted(0);
    setFilesSkipped(0);
    setFilesFailed(0);
    setCurrentFilename(filename);
    setConflictStrategy(null);
    setExistingFiles([]);
    setShowConflictDialog(false);
  }, []);

  const handlePdfLoaded = useCallback((pdfPages: string[], filename: string) => {
    setPages(pdfPages);
    setCurrentPage(0);
    setError(null);
    setBatchFiles([]);
    setBatchStatus('idle');
    setFilesConverted(0);
    setFilesSkipped(0);
    setFilesFailed(0);
    setCurrentFilename(filename);
    setConflictStrategy(null);
    setExistingFiles([]);
    setShowConflictDialog(false);
  }, []);

  const handleFilesSelected = useCallback((files: Array<{ pages: string[]; filename: string }>) => {
    setPages([]);
    setCurrentPage(0);
    setError(null);
    setBatchFiles(files);
    setCurrentFileIndex(0);
    setBatchStatus('idle');
    setFilesConverted(0);
    setFilesSkipped(0);
    setFilesFailed(0);
    setCurrentFilename(null);
    setConflictStrategy(null);
    setExistingFiles([]);
    setShowConflictDialog(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setPages([]);
    setCurrentPage(0);
    setError(null);
    setConvertingPage(null);
    setBatchFiles([]);
    setBatchStatus('idle');
    setFilesConverted(0);
    setFilesSkipped(0);
    setFilesFailed(0);
    setConflictStrategy(null);
    setExistingFiles([]);
    setShowConflictDialog(false);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!config) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const currentStrategy = conflictStrategyRef.current;
    const currentExisting = existingFilesRef.current;

    setIsProcessing(true);
    setError(null);
    setBatchStatus('processing');
    setFilesConverted(0);
    setFilesSkipped(0);
    setFilesFailed(0);

    try {
      if (batchFiles.length > 0) {
        for (let f = 0; f < batchFiles.length; f++) {
          if (abortController.signal.aborted) break;

          const file = batchFiles[f];
          if (!file) continue;

          const baseName = file.filename.replace(/\.[^/.]+$/, '');
          const mdName = `${baseName}.md`;
          const outputPath = outputFolder + '/' + mdName;

          if (currentStrategy === 'skip' && currentExisting.includes(mdName)) {
            setFilesSkipped((prev) => prev + 1);
            continue;
          }

          setCurrentFileIndex(f);
          setConvertingPage({ current: 1, total: file.pages.length });

          try {
            let fileResult = '';

            for (let p = 0; p < file.pages.length; p++) {
              if (abortController.signal.aborted) break;

              setConvertingPage({ current: p + 1, total: file.pages.length });

              const pageResult = await convertImageToMarkdown(
                config,
                file.pages[p],
                () => {},
                abortController.signal,
              );

              fileResult += pageResult;

              if (p < file.pages.length - 1) {
                fileResult += '\n\n---\n\n';
              }
            }

            if (!abortController.signal.aborted && fileResult && outputFolder) {
              if (currentStrategy === 'rename' && currentExisting.includes(mdName)) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const renameMdName = `${baseName}_${timestamp}.md`;
                window.electronAPI.writeFile(outputFolder + '/' + renameMdName, fileResult);
              } else {
                window.electronAPI.writeFile(outputPath, fileResult);
              }
              setFilesConverted((prev) => prev + 1);
            }
          } catch {
            setFilesFailed((prev) => prev + 1);
          }
        }

        if (!abortController.signal.aborted) {
          setBatchStatus('done');
          setConflictStrategy(null);
          setExistingFiles([]);
        } else {
          setBatchStatus('error');
        }
      } else {
        if (!abortController.signal.aborted && outputFolder && currentFilename) {
          const baseName = currentFilename.replace(/\.[^/.]+$/, '');
          const mdName = `${baseName}.md`;

          if (currentStrategy === 'skip' && currentExisting.includes(mdName)) {
            setFilesSkipped((prev) => prev + 1);
          } else {
            try {
              setConvertingPage({ current: 1, total: pages.length });

              let fullResult = '';

              for (let i = 0; i < pages.length; i++) {
                if (abortController.signal.aborted) break;

                setConvertingPage({ current: i + 1, total: pages.length });

                const pageResult = await convertImageToMarkdown(
                  config,
                  pages[i],
                  () => {},
                  abortController.signal,
                );

                fullResult += pageResult;

                if (i < pages.length - 1) {
                  fullResult += '\n\n---\n\n';
                }
              }

              if (!abortController.signal.aborted && fullResult) {
                if (currentStrategy === 'rename' && currentExisting.includes(mdName)) {
                  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                  const renameMdName = `${baseName}_${timestamp}.md`;
                  window.electronAPI.writeFile(outputFolder + '/' + renameMdName, fullResult);
                } else {
                  window.electronAPI.writeFile(outputFolder + '/' + mdName, fullResult);
                }
                setFilesConverted((prev) => prev + 1);
              }
            } catch {
              setFilesFailed((prev) => prev + 1);
            }
          }
        }

        if (!abortController.signal.aborted) {
          setBatchStatus('done');
          setConflictStrategy(null);
          setExistingFiles([]);
        } else {
          setBatchStatus('error');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      if (message !== 'The operation was aborted') {
        setError(message);
        setBatchStatus('error');
      }
    } finally {
      setIsProcessing(false);
      setConvertingPage(null);
      abortControllerRef.current = null;
    }
  }, [config, pages, batchFiles, outputFolder, currentFilename]);

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleOpenFolder = useCallback(async () => {
    if (outputFolder) {
      await window.electronAPI.openFolder(outputFolder);
    }
  }, [outputFolder]);

  const handleConvertWithFolder = useCallback(async () => {
    if (typeof window.electronAPI === 'undefined') return;
    if (!outputFolder) return;

    const isBatch = batchFiles.length > 0;
    const targetFiles = isBatch
      ? batchFiles.filter(Boolean).map(f => `${f!.filename.replace(/\.[^/.]+$/, '')}.md`)
      : currentFilename ? [`${currentFilename.replace(/\.[^/.]+$/, '')}.md`] : [];

    const existing: string[] = [];
    for (const filename of targetFiles) {
      const exists = await window.electronAPI.fileExists(outputFolder + '/' + filename);
      if (exists) {
        existing.push(filename);
      }
    }

    if (existing.length > 0) {
      setExistingFiles(existing);
      setShowConflictDialog(true);
      return;
    }

    await handleConvert();
  }, [outputFolder, batchFiles, currentFilename, handleConvert]);

  const handleConfigSaved = useCallback(async (savedConfig: AppConfig) => {
    await saveConfig(savedConfig);
    setConfig(savedConfig);
    setShowConfig(false);
  }, []);

  const hasPages = pages.length > 0;
  const hasBatchFiles = batchFiles.length > 0;
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

      <div className="main-panel">
        {hasBatchFiles ? (
          <div className="batch-view">
            <div className="batch-view__header">
              <span className="batch-view__count">
                {batchFiles.filter(Boolean).length} files loaded
              </span>
              {!hasPages && !pdfLoading && (
                <button
                  className="btn-secondary batch-view__clear"
                  onClick={handleRemoveImage}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="batch-view__content">
              {batchFiles.map((file, index) => (
                <div
                  key={index}
                  className={`batch-file ${file ? 'batch-file--valid' : 'batch-file--error'} ${currentFileIndex === index ? 'batch-file--current' : ''}`}
                  onClick={() => {
                    if (file) {
                      setCurrentFileIndex(index);
                      setPages(file.pages);
                      setCurrentPage(0);
                    }
                  }}
                >
                  <span className="batch-file__name">{file?.filename ?? 'Failed to load'}</span>
                  <span className="batch-file__pages">{file ? file.pages.length : 0} page{file && file.pages.length !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        ) : !hasPages && !pdfLoading ? (
          <ImageUploader
            onImageSelect={handleImageLoaded}
            onPdfSelect={handlePdfLoaded}
            onFilesSelected={handleFilesSelected}
            onLoadingState={setPdfLoading}
            onError={setError}
          />
        ) : pdfLoading ? (
          <ImageUploader
            onImageSelect={handleImageLoaded}
            onPdfSelect={handlePdfLoaded}
            onFilesSelected={handleFilesSelected}
            onLoadingState={setPdfLoading}
            onError={setError}
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

      <StatusBar
        isProcessing={isProcessing}
        error={error}
        hasImage={hasPages || hasBatchFiles}
        hasConfig={!!config}
        convertingPage={convertingPage}
        batchStatus={batchStatus}
        totalFiles={batchFiles.filter(Boolean).length}
        filesConverted={filesConverted}
        filesSkipped={filesSkipped}
        filesFailed={filesFailed}
        outputFolder={outputFolder}
        showConflictDialog={showConflictDialog}
        onConvert={handleConvert}
        onAbort={handleAbort}
        onConvertWithFolder={handleConvertWithFolder}
        onOpenFolder={handleOpenFolder}
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

      {showConflictDialog && (
        <div className="overlay" onClick={() => { setShowConflictDialog(false); setConflictStrategy(null); setExistingFiles([]); }}>
          <div className="modal conflict-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="conflict-dialog__title">Existing files found</h2>
            <p className="conflict-dialog__text">
              The following files already exist in the output folder:
            </p>
            <ul className="conflict-dialog__list">
              {existingFiles.map(f => (
                <li key={f} className="conflict-dialog__file">{f}</li>
              ))}
            </ul>
            <p className="conflict-dialog__question">How would you like to proceed?</p>
            <div className="conflict-dialog__actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  conflictStrategyRef.current = 'skip';
                  setShowConflictDialog(false);
                  handleConvert();
                }}
              >
                Skip existing files
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  conflictStrategyRef.current = 'overwrite';
                  setShowConflictDialog(false);
                  handleConvert();
                }}
              >
                Overwrite existing
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  conflictStrategyRef.current = 'rename';
                  setShowConflictDialog(false);
                  handleConvert();
                }}
              >
                Rename & process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
