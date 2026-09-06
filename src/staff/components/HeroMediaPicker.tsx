import { useState } from 'react';
import { X } from 'lucide-react';
import type { MediaFile } from '../../shared/types';
import { MediaPicker, type MediaSelectionMode } from './MediaPicker';
import { MediaPreviewModal } from './MediaPreviewModal';
import styles from './HeroEditor.module.css';

type HeroMediaPickerProps = {
  title: string;
  media: MediaFile[];
  selectionMode: MediaSelectionMode;
  disabledIds: Set<number>;
  isUploading: boolean;
  uploadProgress: number | null;
  uploadError?: string | null;
  onConfirm(media: MediaFile[]): void;
  onUpload(files: File[]): void;
  onClose(): void;
};

export function HeroMediaPicker({ title, media, selectionMode, disabledIds, isUploading, uploadProgress, uploadError, onConfirm, onUpload, onClose }: HeroMediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const selectedMedia = media.filter((item) => selectedIds.has(item.id));

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.mediaModal} role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
        <div className={styles.modalHeader}>
          <h2 id="media-picker-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть выбор изображения"><X size={16} /></button>
        </div>
        <MediaPicker
          items={media}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          disabledIds={disabledIds}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          uploadLabel="Загрузить новое изображение"
          onSelectionChange={setSelectedIds}
          onPreview={setPreview}
          onUpload={onUpload}
        />
        <div className={styles.pickerActions}>
          <button className={styles.saveButton} type="button" disabled={selectedMedia.length === 0 || isUploading} onClick={() => onConfirm(selectedMedia)}>
            {selectionMode === 'single' ? 'Выбрать изображение' : `Добавить выбранные (${selectedMedia.length})`}
          </button>
          <button className={styles.cancelButton} type="button" onClick={onClose}>Отменить</button>
        </div>
      </section>
      {preview && <MediaPreviewModal media={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
