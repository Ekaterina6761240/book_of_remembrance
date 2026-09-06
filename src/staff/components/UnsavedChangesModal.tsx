import { X } from 'lucide-react';
import styles from './HeroEditor.module.css';

type UnsavedChangesModalProps = {
  onConfirm(): void;
  onCancel(): void;
};

export function UnsavedChangesModal({ onConfirm, onCancel }: UnsavedChangesModalProps) {
  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
        <button className={styles.modalClose} type="button" onClick={onCancel} aria-label="Закрыть"><X size={12} /></button>
        <h2 id="unsaved-title">Несохранённые изменения</h2>
        <p>Изменения будут потеряны. Покинуть страницу?</p>
        <button className={styles.confirmButton} type="button" onClick={onConfirm}>Покинуть страницу</button>
        <button className={styles.modalCancel} type="button" onClick={onCancel}>Продолжить редактирование</button>
      </section>
    </div>
  );
}
