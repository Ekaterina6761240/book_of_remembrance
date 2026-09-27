import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './HeroesScroller.module.css';

type HeroesScrollerProps = {
  children: ReactNode;
};

export function HeroesScroller({ children }: HeroesScrollerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, scrollLeft: 0, moved: false });
  const trackDragRef = useRef(-1);
  const initializedRef = useRef(false);
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
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list) return;
    initializedRef.current = false;

    const initializeScroll = () => {
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      if (!initializedRef.current && maxScroll > 1) {
        const firstCard = list.firstElementChild as HTMLElement | null;
        viewport.scrollLeft = (firstCard?.offsetWidth ?? 0) / 2;
        initializedRef.current = true;
      }
      updateProgress();
    };

    initializeScroll();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(initializeScroll);
    observer.observe(viewport);
    observer.observe(list);
    return () => observer.disconnect();
  }, [children]);

  const scrollByPage = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * viewport.clientWidth * 0.72, behavior: 'smooth' });
  };

  const seekToPointer = (clientX: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const bounds = track.getBoundingClientRect();
    const thumbSize = Number.parseFloat(getComputedStyle(track).getPropertyValue('--thumb-size')) || 0;
    const availableWidth = Math.max(1, bounds.width - thumbSize);
    const nextProgress = Math.min(1, Math.max(0, (clientX - bounds.left - thumbSize / 2) / availableWidth));
    viewport.scrollLeft = nextProgress * Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  };

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canScroll) return;
    trackDragRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekToPointer(event.clientX);
  };

  const handleTrackPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (trackDragRef.current === event.pointerId) seekToPointer(event.clientX);
  };

  const finishTrackDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (trackDragRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    trackDragRef.current = -1;
  };

  const handleTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollByPage(event.key === 'ArrowLeft' ? -1 : 1);
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
    if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: viewport.scrollLeft, moved: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || dragRef.current.pointerId !== event.pointerId) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 6 && !dragRef.current.moved) {
      dragRef.current.moved = true;
      viewport.setPointerCapture(event.pointerId);
    }
    if (!dragRef.current.moved) return;
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
        <div
          ref={trackRef}
          className={styles.track}
          role="slider"
          tabIndex={canScroll ? 0 : -1}
          aria-label="Положение в списке героев"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={finishTrackDrag}
          onPointerCancel={finishTrackDrag}
          onKeyDown={handleTrackKeyDown}
          style={{ '--scroll-progress': progress } as CSSProperties}
        >
          <span className={styles.rail} />
          <span className={styles.thumb} />
        </div>
        <div className={styles.arrows}>
          <button type="button" onClick={() => scrollByPage(-1)} disabled={!canScroll || progress <= 0.001} aria-label="Предыдущие герои">
            <ArrowLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollByPage(1)} disabled={!canScroll || progress >= 0.999} aria-label="Следующие герои">
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
