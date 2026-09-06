import { ArrowLeft, ArrowRight, X, ImageOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MediaFile } from '../../shared/types';
import styles from './HeroGallery.module.css';

type Props = { media: MediaFile[]; index: number; onIndexChange: (index: number) => void; onClose: () => void };

export function HeroGallery({ media, index, onIndexChange, onClose }: Props) {
  const [failed, setFailed] = useState(false);
  const touchStart = useRef<number | null>(null);
  const current = media[index];
  const previous = () => index > 0 && onIndexChange(index - 1);
  const next = () => index < media.length - 1 && onIndexChange(index + 1);

  useEffect(() => setFailed(false), [current?.id]);
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = oldOverflow; };
  });

  if (!current) return null;
  return <div className={styles.gallery} role="dialog" aria-modal="true" aria-label="Полноэкранная галерея"
    onPointerDown={(event) => { touchStart.current = event.clientX; }}
    onPointerUp={(event) => { if (touchStart.current === null) return; const delta = event.clientX - touchStart.current; if (Math.abs(delta) > 55) delta < 0 ? next() : previous(); touchStart.current = null; }}>
    <button className={styles.close} type="button" onClick={onClose} aria-label="Закрыть галерею"><X aria-hidden="true" /></button>
    <button className={`${styles.arrow} ${styles.previous}`} type="button" onClick={previous} disabled={index === 0} aria-label="Предыдущая фотография"><ArrowLeft aria-hidden="true" /></button>
    <div className={styles.imageWrap}>{failed ? <div className={styles.fallback}><ImageOff aria-hidden="true" /><span>Не удалось загрузить фотографию</span></div> : <img src={current.url} alt={current.name || 'Фотография героя'} onError={() => setFailed(true)} />}</div>
    <button className={`${styles.arrow} ${styles.next}`} type="button" onClick={next} disabled={index === media.length - 1} aria-label="Следующая фотография"><ArrowRight aria-hidden="true" /></button>
    <p className={styles.counter}>{index + 1}/{media.length}</p>
  </div>;
}
