import { RotateCcw, X } from 'lucide-react';
import type { DistrictFeedback } from '../hooks/useStaffDistricts';
import styles from './Districts.module.css';

type DistrictFeedbackBarProps = {
  feedback: DistrictFeedback;
  onUndo(): void;
  onClose(): void;
};

export function DistrictFeedbackBar({ feedback, onUndo, onClose }: DistrictFeedbackBarProps) {
  return (
    <div className={`${styles.feedback} ${feedback.type === 'error' ? styles.feedbackError : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
      <span>{feedback.message}</span>
      <div className={styles.feedbackActions}>
        {feedback.canUndo && <button type="button" onClick={onUndo}><RotateCcw size={12} />Отменить удаление</button>}
        <button type="button" onClick={onClose} aria-label="Скрыть сообщение"><X size={12} /></button>
      </div>
    </div>
  );
}
