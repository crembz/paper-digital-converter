import { useState, useRef, useCallback, useEffect } from 'react';

interface ImagePreviewProps {
  image: string;
  onReplace: () => void;
}

function extractFilenameFromDataUri(dataUri: string): string | null {
  const nameMatch = dataUri.match(/name=([^&]+)/);
  if (nameMatch && nameMatch[1]) {
    return decodeURIComponent(nameMatch[1]);
  }

  const segments = dataUri.split(',');
  if (segments.length < 2) return null;

  const header = segments[0];
  const filenameMatch = header.match(/;name=([^;]+)/);
  if (filenameMatch && filenameMatch[1]) {
    return decodeURIComponent(filenameMatch[1]);
  }

  const mimeMatch = header.match(/data:([^;]+)/);
  if (mimeMatch && mimeMatch[1]) {
    const mime = mimeMatch[1];
    const ext = mime.split('/').pop();
    if (ext) {
      return `image.${ext}`;
    }
  }

  return null;
}

function extractDimensions(img: HTMLImageElement): { width: number; height: number } {
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

export default function ImagePreview({ image, onReplace }: ImagePreviewProps) {
  const [scale, setScale] = useState<number>(1);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filename = extractFilenameFromDataUri(image);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      setDimensions(extractDimensions(target));
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.25), 4));
    },
    [],
  );

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  useEffect(() => {
    setScale(1);
    setDimensions(null);
  }, [image]);

  return (
    <div className="image-preview">
      <div className="image-preview__toolbar">
        {filename && <span className="image-preview__filename">{filename}</span>}
        {dimensions && (
          <span className="image-preview__dimensions">
            {dimensions.width} &times; {dimensions.height}
          </span>
        )}
        <span className="image-preview__zoom">{Math.round(scale * 100)}%</span>
        <button type="button" className="btn-secondary" onClick={handleResetZoom}>
          Reset Zoom
        </button>
        <button type="button" className="btn-secondary" onClick={onReplace}>
          Replace
        </button>
      </div>

      <div
        ref={containerRef}
        className="image-preview__container"
        onWheel={handleWheel}
      >
        <img
          src={image}
          alt="Uploaded document"
          className="image-preview__image"
          style={{ transform: `scale(${scale})` }}
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}
