import { ImagePlus } from 'lucide-react';
import type { MediaFile } from '../../shared/types';
import { MediaPreview } from './MediaPreview';
import styles from './MediaPicker.module.css';

export type MediaSelectionMode = 'single' | 'multiple';

type MediaPickerProps = {
  items: MediaFile[];
  selectionMode: MediaSelectionMode;
  selectedIds: Set<number>;
  disabledIds?: Set<number>;
  isUploading: boolean;
  uploadProgress: number | null;
  uploadError?: string | null;
  uploadLabel?: string;
  emptyText?: string;
  onSelectionChange(ids: Set<number>): void;
  onPreview(item: MediaFile): void;
  onUpload(files: File[]): void;
};

export function MediaPicker({
  items,
  selectionMode,
  selectedIds,
  disabledIds = new Set(),
  isUploading,
  uploadProgress,
  uploadError,
  uploadLabel = 'Загрузить файлы',
  emptyText = 'В медиатеке пока нет файлов',
  onSelectionChange,
  onPreview,
  onUpload,
}: MediaPickerProps) {
  const toggleSelection = (id: number) => {
    if (disabledIds.has(id)) return;
    if (selectionMode === 'single') {
      onSelectionChange(selectedIds.has(id) ? new Set() : new Set([id]));
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className={styles.picker}>
      <div className={styles.pickerToolbar}>
        <p>{selectionMode === 'multiple' ? `Выбрано: ${selectedIds.size}` : selectedIds.size > 0 ? 'Файл выбран' : 'Выберите файл'}</p>
        <label className={styles.uploadButton}>
          <ImagePlus size={14} />{isUploading ? 'Загрузка…' : uploadLabel}
          <input type="file" accept="image/*" multiple={selectionMode === 'multiple'} disabled={isUploading} onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) onUpload(files);
            event.target.value = '';
          }} />
        </label>
      </div>

      {uploadProgress !== null && (
        <div className={styles.progress} role="progressbar" aria-label="Загрузка файлов" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
          <div style={{ width: `${uploadProgress}%` }} />
          <span>{uploadProgress}%</span>
        </div>
      )}
      {uploadError && <p className={styles.uploadError} role="alert">{uploadError}</p>}

      {items.length === 0 ? <div className={styles.empty}>{emptyText}</div> : (
        <div className={styles.grid} role="list" aria-label="Медиафайлы">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isDisabled = disabledIds.has(item.id);
            const itemName = item.name ?? `Изображение ${item.id}`;
            return (
              <article className={styles.mediaItem} data-media-id={item.id} data-selected={isSelected} data-disabled={isDisabled} role="listitem" key={item.id}>
                <button className={styles.previewButton} type="button" onClick={() => onPreview(item)} aria-label={`Открыть ${itemName}`}>
                  <MediaPreview media={item} />
                </button>
                <label className={styles.selectionControl} title={isDisabled ? 'Файл уже добавлен' : undefined}>
                  <input
                    type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                    name={selectionMode === 'single' ? 'media-selection' : undefined}
                    checked={isSelected || isDisabled}
                    disabled={isDisabled}
                    onChange={() => toggleSelection(item.id)}
                    aria-label={`${selectionMode === 'single' ? 'Выбрать' : 'Отметить'} ${itemName}`}
                  />
                </label>
                <span title={itemName}>{itemName}</span>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
