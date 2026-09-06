import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { District } from '../../shared/types';
import styles from './DistrictPicker.module.css';

type DistrictPickerProps = {
  districts: District[];
  value: District | null;
  onChange: (district: District) => void;
  onActivate?: (district: District) => void;
};

export function DistrictPicker({ districts, value, onChange, onActivate }: DistrictPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const positionedListRef = useRef('');
  const activeIndex = value ? districts.findIndex((district) => district.id === value.id) : -1;

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior) => {
    const list = listRef.current;
    const item = itemRefs.current[index];
    if (!list || !item) return;

    const top = item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
    list.scrollTo({ top, behavior });
  }, []);

  useLayoutEffect(() => {
    const listKey = districts.map((district) => district.id).join(':');
    if (activeIndex >= 0 && positionedListRef.current !== listKey) {
      scrollToIndex(activeIndex, 'auto');
      positionedListRef.current = listKey;
    }
  }, [activeIndex, districts, scrollToIndex]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const updateClosestDistrict = () => {
    const list = listRef.current;
    if (!list || districts.length === 0) return;

    const focusY = list.getBoundingClientRect().top + list.clientHeight / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - focusY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    const closestDistrict = districts[closestIndex];
    if (closestDistrict && closestDistrict.id !== value?.id) onChange(closestDistrict);
  };

  const handleScroll = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      updateClosestDistrict();
      frameRef.current = null;
    });
  };

  const handleClick = (district: District, index: number) => {
    const wasActive = district.id === value?.id;
    onChange(district);
    scrollToIndex(index, 'smooth');
    if (wasActive) onActivate?.(district);
  };

  return (
    <div
      ref={listRef}
      className={styles.picker}
      role="listbox"
      aria-label="Выбор района города"
      aria-activedescendant={value ? `screen-district-${value.id}` : undefined}
      tabIndex={0}
      onScroll={handleScroll}
    >
      {districts.map((district, index) => {
        const distance = activeIndex < 0 ? 4 : Math.min(Math.abs(index - activeIndex), 4);
        const isActive = distance === 0;

        return (
          <button
            key={district.id}
            ref={(node) => { itemRefs.current[index] = node; }}
            id={`screen-district-${district.id}`}
            className={styles.option}
            type="button"
            role="option"
            aria-selected={isActive}
            data-distance={distance}
            data-size={district.name.length > 26 ? 'compact' : district.name.length > 20 ? 'condensed' : 'regular'}
            onClick={() => handleClick(district, index)}
          >
            {district.name}
          </button>
        );
      })}
    </div>
  );
}
