import { ArrowLeft, X } from 'lucide-react';
import styles from './VirtualKeyboard.module.css';

const KEY_ROWS = [
  ['Ё', 'Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Ъ'],
  ['Х', 'Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', '-'],
] as const;

type VirtualKeyboardProps = {
  onInput: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClose: () => void;
};

export function VirtualKeyboard({ onInput, onBackspace, onSpace, onClose }: VirtualKeyboardProps) {
  return (
    <section className={styles.keyboard} aria-label="Экранная клавиатура">
      <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Закрыть клавиатуру">
        <X aria-hidden="true" />
      </button>

      {KEY_ROWS.map((row, rowIndex) => (
        <div className={styles.row} key={row.join('')}>
          {row.map((key) => (
            <button key={key} className={styles.key} type="button" onClick={() => onInput(key)} aria-label={`Ввести ${key}`}>
              {key}
            </button>
          ))}
          {rowIndex === KEY_ROWS.length - 1 && (
            <button className={`${styles.key} ${styles.backspace}`} type="button" onClick={onBackspace} aria-label="Удалить последний символ">
              <ArrowLeft aria-hidden="true" />
            </button>
          )}
        </div>
      ))}

      <button className={styles.space} type="button" onClick={onSpace} aria-label="Пробел">
        <span aria-hidden="true" />
      </button>
    </section>
  );
}
