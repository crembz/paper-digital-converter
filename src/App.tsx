import { useCallback, useEffect, useRef, useState } from 'react';
import { AppConfig, loadConfig } from './services/config';
import { convertImageToMarkdown } from './services/llm';
import ImageUploader from './components/ImageUploader';
import ImagePreview from './components/ImagePreview';
import MarkdownEditor from './components/MarkdownEditor';
import StatusBar from './components/StatusBar';
import ConfigPanel from './components/ConfigPanel';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  const handleImageLoaded = useCallback((dataUri: string) => {
    setImage(dataUri);
    setMarkdown('');
    setError(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImage(null);
    setMarkdown('');
    setError(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!config || !image) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsProcessing(true);
    setMarkdown('');
    setError(null);

    try {
      await convertImageToMarkdown(
        config,
        image,
        (chunk: string) => {
          setMarkdown((prev) => prev + chunk);
        },
        abortController.signal,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      if (message !== 'The operation was aborted') {
        setError(message);
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [config, image]);

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSave = useCallback(async () => {
    if (typeof window.electronAPI === 'undefined') return;
    const filePath = await window.electronAPI.saveFileDialog('output.md');

    if (filePath) {
      await window.electronAPI.writeFile(filePath, markdown);
    }
  }, [markdown]);

  const handleConfigSaved = useCallback((savedConfig: AppConfig) => {
    setConfig(savedConfig);
    setShowConfig(false);
  }, []);

  return (
    <div className="container">
      <div className="top-bar">
        <h1>Paper → Digital Converter</h1>
        <div>
          <button className="btn-secondary" onClick={() => setShowConfig(true)}>
            Settings
          </button>
        </div>
      </div>

      <div className="split-view">
        <div className="panel">
          {!image ? (
            <ImageUploader onImageSelect={handleImageLoaded} />
          ) : (
            <ImagePreview
              image={image}
              onReplace={handleRemoveImage}
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
        hasImage={!!image}
        hasConfig={!!config}
        hasMarkdown={!!markdown}
        onConvert={handleConvert}
        onAbort={handleAbort}
        onSave={handleSave}
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
