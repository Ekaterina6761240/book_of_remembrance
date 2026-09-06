import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Heroes.module.css';

type HeroesPaginationProps = {
  page: number;
  totalPages: number;
  onChange(page: number): void;
};

const getPageNumbers = (page: number, totalPages: number): number[] => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
};

export function HeroesPagination({ page, totalPages, onChange }: HeroesPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Страницы списка героев">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Предыдущая страница">
        <ChevronLeft size={14} />
      </button>
      {getPageNumbers(page, totalPages).map((pageNumber) => (
        <button
          className={pageNumber === page ? styles.activePage : ''}
          type="button"
          key={pageNumber}
          onClick={() => onChange(pageNumber)}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Следующая страница">
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
