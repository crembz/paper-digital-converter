import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  markdown: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

interface TextStats {
  characters: number;
  words: number;
}

function computeStats(text: string): TextStats {
  const characters = text.length;
  const trimmed = text.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  return { characters, words };
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function MarkdownEditor({
  markdown,
  onChange,
  disabled = false,
  readOnly = false,
}: MarkdownEditorProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const isDisabled = disabled || readOnly;

  const stats = useMemo<TextStats>(() => computeStats(markdown), [markdown]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    },
    [onChange],
  );

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [markdown]);

  return (
    <div className="markdown-editor">
      <div className="markdown-editor__toolbar">
        <span className="markdown-editor__stats">
          {stats.characters} chars &middot; {stats.words} words
        </span>
        <button
          type="button"
          className="btn-secondary markdown-editor__copy"
          onClick={handleCopy}
          disabled={isDisabled || markdown.length === 0}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="markdown-editor__split">
        <textarea
          className="markdown-editor__input"
          value={markdown}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="Markdown output will appear here..."
          spellCheck={false}
        />

        <div className="markdown-editor__preview">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
