import { useEffect, useRef } from 'react';
import { ArrowUp, ChevronDown, Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { District } from '../../shared/types';
import styles from './Districts.module.css';

type DistrictsTableProps = {
  districts: District[];
  totalDistricts: number;
  heroCounts: Record<number, number>;
  selectedIds: Set<number>;
  onToggleSelection(id: number): void;
  onToggleAll(ids: number[]): void;
  onEdit(district: District): void;
  onDuplicate(district: District): void;
  onDelete(district: District): void;
};

export function DistrictsTable({
  districts,
  totalDistricts,
  heroCounts,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onEdit,
  onDuplicate,
  onDelete,
}: DistrictsTableProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedVisibleCount = districts.filter((district) => selectedIds.has(district.id)).length;
  const allSelected = districts.length > 0 && selectedVisibleCount === districts.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedVisibleCount > 0 && !allSelected;
    }
  }, [allSelected, selectedVisibleCount]);

  if (districts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{totalDistricts === 0 ? 'Районов пока нет' : 'Ничего не найдено'}</p>
      </div>
    );
  }

  return (
    <div className={styles.table} role="table" aria-label="Список районов">
      <div className={`${styles.tableRow} ${styles.tableHeader}`} role="row">
        <div className={styles.checkboxCell} role="columnheader">
          <input
            ref={selectAllRef}
            className={styles.checkbox}
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleAll(districts.map((district) => district.id))}
            aria-label="Выбрать все районы"
          />
        </div>
        <div className={styles.headingCell} role="columnheader"><span>Название</span><ArrowUp size={12} /></div>
        <div className={styles.headingCell} role="columnheader"><span>Ярлык</span><ChevronDown size={12} /></div>
        <div className={styles.headingCell} role="columnheader"><span>Записи</span><ChevronDown size={12} /></div>
        <div role="columnheader" />
      </div>
      <div className={styles.separator} />
      {districts.map((district) => (
        <div className={styles.tableRow} role="row" key={district.id} data-district-id={district.id}>
          <div className={styles.checkboxCell} role="cell">
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={selectedIds.has(district.id)}
              onChange={() => onToggleSelection(district.id)}
              aria-label={`Выбрать ${district.name}`}
            />
          </div>
          <div className={styles.bodyCell} role="cell">{district.name}</div>
          <div className={`${styles.bodyCell} ${styles.muted}`} role="cell">{district.slug}</div>
          <div className={styles.bodyCell} role="cell">{heroCounts[district.id] ?? 0}</div>
          <div className={styles.rowActions} role="cell">
            <button type="button" onClick={() => onEdit(district)} aria-label={`Редактировать ${district.name}`} title="Редактировать"><Pencil size={12} fill="currentColor" /></button>
            <button type="button" onClick={() => onDelete(district)} aria-label={`Удалить ${district.name}`} title="Удалить"><Trash2 size={12} fill="currentColor" /></button>
            <button type="button" onClick={() => onDuplicate(district)} aria-label={`Дублировать ${district.name}`} title="Дублировать"><Copy size={12} /></button>
            <button className={styles.moreButton} type="button" aria-label={`Ещё действия: ${district.name}`} title="Ещё"><MoreVertical size={12} /></button>
          </div>
        </div>
      ))}
      <p className={styles.total}>{districts.length} {districts.length === 1 ? 'элемент' : 'элементов'}</p>
    </div>
  );
}
