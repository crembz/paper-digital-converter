import { useCallback } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';

interface ImageUploaderProps {
  onImageSelect: (dataUri: string) => void;
}

const ACCEPTED_IMAGE_TYPES: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
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

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const dataUri = await readFileAsDataUri(file);
        onImageSelect(dataUri);
      } catch {
        // Silently ignore read errors; user can retry
      }
    },
    [onImageSelect],
  );

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxFiles: 1,
    multiple: false,
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <div className="image-uploader">
      <div
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />

        <div className="dropzone__content">
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
              ? 'Drop the image here'
              : 'Drag & drop an image, or click to browse'}
          </p>

          <p className="dropzone__hint">PNG, JPG, TIFF, WEBP</p>
        </div>
      </div>

      <button
        type="button"
        className="btn-secondary"
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
