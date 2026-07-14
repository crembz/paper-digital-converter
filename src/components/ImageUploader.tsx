import { useCallback, useState } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { renderPdfPages } from '../utils/pdf';

interface ImageUploaderProps {
  onImageSelect: (dataUri: string) => void;
  onPdfSelect: (pages: string[], filename: string) => void;
  onLoadingState: (loading: boolean) => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as DataURL'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({ onImageSelect, onPdfSelect, onLoadingState }: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        if (file.type === 'application/pdf') {
          setIsLoading(true);
          onLoadingState(true);
          const pages = await renderPdfPages(file);
          onPdfSelect(pages, file.name);
        } else {
          const dataUri = await readFileAsDataUri(file);
          onImageSelect(dataUri);
        }
      } catch {
        // Silently ignore read errors; user can retry
      } finally {
        setIsLoading(false);
        onLoadingState(false);
      }
    },
    [onImageSelect, onPdfSelect, onLoadingState],
  );

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    multiple: false,
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <div className="image-uploader">
      <div
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${isLoading ? 'dropzone--loading' : ''}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />

        <div className="dropzone__content">
          {isLoading ? (
            <p className="dropzone__text">Rendering PDF pages...</p>
          ) : (
            <>
              <svg
                className="dropzone__icon"
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>

              <p className="dropzone__text">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag & drop an image or PDF, or click to browse'}
              </p>

              <p className="dropzone__hint">PNG, JPG, TIFF, WEBP, PDF</p>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn-secondary"
        disabled={isLoading}
        onClick={() => {
          const input = document.querySelector('.dropzone input[type="file"]');
          if (input instanceof HTMLInputElement) {
            input.click();
          }
        }}
      >
        Browse Files
      </button>
    </div>
  );
}
