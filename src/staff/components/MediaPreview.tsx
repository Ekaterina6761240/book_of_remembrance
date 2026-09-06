import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { MediaFile } from '../../shared/types';
import styles from './MediaPicker.module.css';

type MediaPreviewProps = {
  media: MediaFile;
  className?: string;
};

export function MediaPreview({ media, className }: MediaPreviewProps) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [media.url]);

  return (
    <div className={`${styles.mediaPreview} ${className ?? ''}`}>
      <ImageIcon size={24} aria-hidden="true" />
      {!hasError && <img src={media.thumbnailUrl ?? media.url} alt={media.name ?? 'Изображение героя'} onError={() => setHasError(true)} />}
    </div>
  );
}
