import { ArrowLeft } from 'lucide-react';
import { acquireScreenNavigation } from '../utils/navigationGuard';
import styles from './ScreenBackButton.module.css';

type Props = { onClick: () => void; label?: string };

export function ScreenBackButton({ onClick, label = 'Назад' }: Props) {
  return (
    <button
      className={styles.button}
      type="button"
      onClick={() => {
        if (acquireScreenNavigation()) onClick();
      }}
      aria-label={label}
    >
      <span className={styles.icon}><ArrowLeft aria-hidden="true" strokeWidth={1.45} /></span>
      <span>{label}</span>
    </button>
  );
}
