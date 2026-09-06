import { type MouseEvent, type PointerEvent, type ReactNode, type WheelEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './HeroesScroller.module.css';

type HeroesScrollerProps = {
  children: ReactNode;
};

export function HeroesScroller({ children }: HeroesScrollerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false });
  const [progress, setProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  const updateProgress = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    setCanScroll(maxScroll > 1);
    setProgress(maxScroll > 0 ? viewport.scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    updateProgress();
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateProgress);
    observer.observe(viewport);
    observer.observe(list);
    return () => observer.disconnect();
  }, [children]);

  const scrollByPage = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * viewport.clientWidth * 0.72, behavior: 'smooth' });
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: viewport.scrollLeft, moved: false };
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || dragRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 6) dragRef.current.moved = true;
    viewport.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || dragRef.current.pointerId !== event.pointerId) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    dragRef.current.pointerId = -1;
  };

  const preventDraggedClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  };

  return (
    <div className={styles.scroller} data-scrollable={canScroll || undefined}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        onScroll={updateProgress}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={preventDraggedClick}
      >
        <div ref={listRef} className={styles.list}>{children}</div>
      </div>

      <div className={styles.controls} aria-hidden={!canScroll}>
        <div className={styles.track}>
          <span className={styles.thumb} style={{ left: `${progress * 100}%` }} />
        </div>
        <div className={styles.arrows}>
          <button type="button" onClick={() => scrollByPage(-1)} disabled={!canScroll || progress <= 0} aria-label="Предыдущие герои">
            <ArrowLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollByPage(1)} disabled={!canScroll || progress >= 1} aria-label="Следующие герои">
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
