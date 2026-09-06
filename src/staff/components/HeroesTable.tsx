import { Edit3, MoreVertical, Trash2 } from 'lucide-react';
import type { District, Hero } from '../../shared/types';
import styles from './Heroes.module.css';

type HeroesTableProps = {
  heroes: Hero[];
  districts: District[];
  selectedIds: Set<number>;
  onToggleSelection(id: number): void;
  onToggleAll(): void;
  onEdit(hero: Hero): void;
  onDelete(hero: Hero): void;
};

const getFullName = (hero: Hero): string =>
  [hero.lastName, hero.firstName, hero.middleName].filter(Boolean).join(' ');

const getLifeYears = (hero: Hero): string => {
  const birthYear = hero.birthDate?.slice(0, 4);
  const deathYear = hero.deathDate?.slice(0, 4);
  if (!birthYear && !deathYear) return '—';
  return `${birthYear ?? '—'}–${deathYear ?? ''}`;
};

export function HeroesTable({ heroes, districts, selectedIds, onToggleSelection, onToggleAll, onEdit, onDelete }: HeroesTableProps) {
  const districtNames = new Map(districts.map((district) => [district.id, district.name]));
  const allSelected = heroes.length > 0 && heroes.every((hero) => selectedIds.has(hero.id));
  const partlySelected = heroes.some((hero) => selectedIds.has(hero.id)) && !allSelected;

  return (
    <div className={styles.tableScroll}>
      <div className={styles.table} role="table" aria-label="Герои">
        <div className={`${styles.tableRow} ${styles.tableHeader}`} role="row">
          <div className={styles.checkboxCell} role="columnheader">
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={allSelected}
              ref={(element) => { if (element) element.indeterminate = partlySelected; }}
              onChange={onToggleAll}
              aria-label="Выбрать всех героев на странице"
            />
          </div>
          <div className={styles.headingCell} role="columnheader">ФИО</div>
          <div className={styles.headingCell} role="columnheader">Район</div>
          <div className={styles.headingCell} role="columnheader">Годы жизни</div>
          <div className={styles.headingCell} role="columnheader">Статус</div>
          <div role="columnheader" aria-label="Действия" />
        </div>
        {heroes.map((hero) => (
          <div key={hero.id}>
            <div className={styles.tableRow} role="row" data-hero-id={hero.id} data-selected={selectedIds.has(hero.id)}>
              <div className={styles.checkboxCell} role="cell">
                <input className={styles.checkbox} type="checkbox" checked={selectedIds.has(hero.id)} onChange={() => onToggleSelection(hero.id)} aria-label={`Выбрать ${getFullName(hero)}`} />
              </div>
              <div className={`${styles.bodyCell} ${styles.nameCell}`} role="cell" title={getFullName(hero)}>{getFullName(hero)}</div>
              <div className={styles.bodyCell} role="cell" title={districtNames.get(hero.districtId)}>{districtNames.get(hero.districtId) ?? 'Не указан'}</div>
              <div className={`${styles.bodyCell} ${styles.muted}`} role="cell">{getLifeYears(hero)}</div>
              <div className={styles.bodyCell} role="cell">
                <span className={`${styles.status} ${hero.status === 'draft' ? styles.draft : ''}`}>{hero.status === 'draft' ? 'Черновик' : 'Опубликован'}</span>
              </div>
              <div className={styles.rowActions} role="cell">
                <button type="button" onClick={() => onEdit(hero)} aria-label={`Редактировать ${getFullName(hero)}`}><Edit3 size={15} /></button>
                <button type="button" onClick={() => onDelete(hero)} aria-label={`Удалить ${getFullName(hero)}`}><Trash2 size={15} /></button>
                <button className={styles.moreButton} type="button" aria-label="Дополнительные действия"><MoreVertical size={17} /></button>
              </div>
            </div>
            <div className={styles.separator} />
          </div>
        ))}
      </div>
    </div>
  );
}
