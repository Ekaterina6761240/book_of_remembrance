import { ArrowLeft, ArrowRight, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MediaFile } from '../../shared/types';
import { getOptimizedScreenMediaUrl } from '../utils/media';
import styles from './HeroMedia.module.css';

type Props = { media: MediaFile[]; index: number; onIndexChange: (index: number) => void; onOpen: () => void };

export function HeroMedia({ media, index, onIndexChange, onOpen }: Props) {
  const [failed, setFailed] = useState(false);
  const current = media[index];
  useEffect(() => setFailed(false), [current?.id]);
  const canPrev = index > 0;
  const canNext = index < media.length - 1;

  return <section className={styles.media} aria-label="Фотографии героя">
    {current && !failed ? (
      <button className={styles.photoButton} type="button" onClick={onOpen} aria-label="Открыть фотографию на весь экран">
        <img src={getOptimizedScreenMediaUrl(current)} alt={current.name || 'Фотография героя'} draggable={false} onError={() => setFailed(true)} />
      </button>
    ) : <div className={styles.placeholder}><UserRound aria-hidden="true" /><span>Фотография отсутствует</span></div>}
    {media.length > 0 && <div className={styles.controls}>
      <button type="button" onClick={() => onIndexChange(index - 1)} disabled={!canPrev} aria-label="Предыдущая фотография"><ArrowLeft aria-hidden="true" /></button>
      <span aria-live="polite">{index + 1}/{media.length}</span>
      <button type="button" onClick={() => onIndexChange(index + 1)} disabled={!canNext} aria-label="Следующая фотография"><ArrowRight aria-hidden="true" /></button>
    </div>}
  </section>;
}
