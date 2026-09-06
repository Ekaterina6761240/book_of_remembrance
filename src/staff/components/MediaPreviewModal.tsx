import { X } from 'lucide-react';
import type { MediaFile } from '../../shared/types';
import { MediaPreview } from './MediaPreview';
import styles from './MediaPicker.module.css';

type MediaPreviewModalProps = {
  media: MediaFile;
  onClose(): void;
};

export function MediaPreviewModal({ media, onClose }: MediaPreviewModalProps) {
  return (
    <div className={styles.previewOverlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.previewModal} role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <div className={styles.previewHeader}>
          <h2 id="preview-title">{media.name ?? `Изображение ${media.id}`}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть предпросмотр"><X size={16} /></button>
        </div>
        <MediaPreview media={media} className={styles.largePreview} />
        {(media.width || media.height) && <p>{media.width ?? '—'} × {media.height ?? '—'} px</p>}
      </section>
    </div>
  );
}
