import React from 'react';

interface StatusBarProps {
  isProcessing: boolean;
  error: string | null;
  onConvert: () => void;
  onSave: () => void;
  onAbort: () => void;
  hasImage: boolean;
  hasConfig: boolean;
  hasMarkdown: boolean;
  convertingPage: { current: number; total: number } | null;
}

function Spinner(): React.ReactElement {
  return (
    <svg
      className="status-bar__spinner"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}
    >
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function StatusBar({
  isProcessing,
  error,
  onConvert,
  onSave,
  onAbort,
  hasImage,
  hasConfig,
  hasMarkdown,
  convertingPage,
}: StatusBarProps): React.ReactElement {
  const convertDisabled = !hasImage || !hasConfig || isProcessing;
  const saveDisabled = !hasMarkdown || isProcessing;

  let statusText: string;
  let statusClass: string;

  if (error) {
    statusText = error;
    statusClass = 'status-error';
  } else if (isProcessing && convertingPage) {
    statusText = convertingPage.total > 1
      ? `Converting page ${convertingPage.current} of ${convertingPage.total}...`
      : 'Converting...';
    statusClass = 'status-processing';
  } else if (isProcessing) {
    statusText = 'Converting...';
    statusClass = 'status-processing';
  } else if (!hasConfig) {
    statusText = 'Configure your LLM provider to begin';
    statusClass = '';
  } else if (!hasImage) {
    statusText = 'Ready — upload an image or PDF to convert';
    statusClass = '';
  } else {
    statusText = 'Ready to convert';
    statusClass = '';
  }

  return (
    <div className="status-bar">
      <span className={`status-text ${statusClass}`}>
        {isProcessing && <Spinner />}
        {statusText}
      </span>

      <div className="status-bar__actions">
        <button
          className="btn-primary"
          onClick={onConvert}
          disabled={convertDisabled}
        >
          Convert
        </button>

        {isProcessing && (
          <button
            className="btn-danger"
            onClick={onAbort}
          >
            Abort
          </button>
        )}

        <button
          className="btn-secondary"
          onClick={onSave}
          disabled={saveDisabled}
        >
          Save as .md
        </button>
      </div>
    </div>
  );
}
