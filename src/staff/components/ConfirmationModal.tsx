import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Districts.module.css';

type ConfirmationModalProps = {
  count: number;
  isLoading: boolean;
  onConfirm(): void;
  onCancel(): void;
};

export function ConfirmationModal({ count, isLoading, onConfirm, onCancel }: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, onCancel]);

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !isLoading && onCancel()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <button className={styles.modalClose} type="button" onClick={onCancel} disabled={isLoading} aria-label="Закрыть"><X size={12} /></button>
        <h2 id="delete-title">Удаление элементов</h2>
        <p>Вы уверены, что хотите удалить {count === 1 ? 'выбранный элемент' : 'выбранные элементы'}?</p>
        <button className={styles.deleteButton} type="button" onClick={onConfirm} disabled={isLoading}>{isLoading ? 'Удаление…' : 'Удалить'}</button>
        <button className={styles.modalCancel} type="button" onClick={onCancel} disabled={isLoading}>Отменить</button>
      </section>
    </div>
  );
}
