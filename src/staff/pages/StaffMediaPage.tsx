import { useState } from 'react';
import { ChevronRight, Trash2, X } from 'lucide-react';
import type { MediaFile } from '../../shared/types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MediaPicker } from '../components/MediaPicker';
import { MediaPreviewModal } from '../components/MediaPreviewModal';
import styles from '../components/StaffMedia.module.css';
import { useStaffMedia } from '../hooks/useStaffMedia';

export function StaffMediaPage() {
  const state = useStaffMedia();
  const [preview, setPreview] = useState<MediaFile | null>(null);

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <nav className={styles.breadcrumbs} aria-label="Хлебные крошки"><span>Медиафайлы</span><ChevronRight size={12} /><span>Все медиафайлы</span></nav>
        <h1>Медиафайлы</h1>
      </header>

      {state.feedback && (
        <div className={`${styles.feedback} ${state.feedback.type === 'error' ? styles.feedbackError : ''}`} role={state.feedback.type === 'error' ? 'alert' : 'status'}>
          <span>{state.feedback.message}</span><button type="button" onClick={state.dismissFeedback} aria-label="Скрыть сообщение"><X size={12} /></button>
        </div>
      )}

      <section className={styles.libraryCard} aria-label="Библиотека медиафайлов">
        {state.selectedMedia.length > 0 && (
          <button className={styles.deleteSelected} type="button" onClick={() => state.requestDelete(state.selectedMedia)}><Trash2 size={12} fill="currentColor" />Удалить выбранные</button>
        )}

        {state.isLoading ? (
          <div className={styles.stateMessage} role="status"><span className={styles.spinner} />Загрузка медиафайлов…</div>
        ) : state.loadError ? (
          <div className={styles.stateMessage} role="alert"><p>{state.loadError}</p><button type="button" onClick={() => void state.reload()}>Повторить</button></div>
        ) : (
          <MediaPicker
            items={state.media}
            selectionMode="multiple"
            selectedIds={state.selectedIds}
            isUploading={state.isUploading}
            uploadProgress={state.uploadProgress}
            uploadError={state.uploadError}
            uploadLabel="Добавить медиафайлы"
            onSelectionChange={state.setSelectedIds}
            onPreview={setPreview}
            onUpload={(files) => void state.uploadFiles(files)}
          />
        )}
      </section>

      {preview && <MediaPreviewModal media={preview} onClose={() => setPreview(null)} />}
      {state.deleteCandidates.length > 0 && (
        <ConfirmationModal count={state.deleteCandidates.length} isLoading={state.isDeleting} onConfirm={() => void state.confirmDelete()} onCancel={state.cancelDelete} />
      )}
    </main>
  );
}
