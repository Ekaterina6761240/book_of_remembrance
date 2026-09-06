import { ArrowLeft } from 'lucide-react';
import styles from './ScreenBackButton.module.css';

type Props = { onClick: () => void; label?: string };

export function ScreenBackButton({ onClick, label = 'Назад' }: Props) {
  return (
    <button className={styles.button} type="button" onClick={onClick} aria-label={label}>
      <span className={styles.icon}><ArrowLeft aria-hidden="true" strokeWidth={1.45} /></span>
      <span>{label}</span>
    </button>
  );
}
