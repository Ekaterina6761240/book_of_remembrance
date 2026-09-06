import { ChevronRight, Search, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { HeroesPagination } from '../components/HeroesPagination';
import { HeroesTable } from '../components/HeroesTable';
import styles from '../components/Heroes.module.css';
import { useStaffHeroes } from '../hooks/useStaffHeroes';

export function StaffHeroesPage() {
  const navigate = useNavigate();
  const state = useStaffHeroes();
  const firstVisible = state.filteredCount === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const lastVisible = Math.min(state.page * state.pageSize, state.filteredCount);
  const hasFilters = state.query.trim().length > 0 || state.districtId !== null;

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
            <span>Герои</span><ChevronRight size={12} /><span>Все герои</span>
          </nav>
          <h1>Герои</h1>
        </div>
        <button className={styles.addButton} type="button" onClick={() => navigate(ROUTES.staffHeroNew)}>Добавить нового героя</button>
      </div>

      {state.actionError && (
        <div className={styles.feedbackError} role="alert">
          <span>{state.actionError}</span>
          <button type="button" onClick={state.dismissActionError} aria-label="Скрыть сообщение"><X size={12} /></button>
        </div>
      )}

      <section className={styles.listCard} aria-label="Список героев">
        <div className={styles.toolbar}>
          <button
            className={`${styles.deleteSelected} ${state.selectedHeroes.length > 0 ? styles.visible : ''}`}
            type="button"
            onClick={() => state.requestDelete(state.selectedHeroes)}
            disabled={state.selectedHeroes.length === 0}
          >
            <Trash2 size={12} fill="currentColor" />Удалить выбранные
          </button>
          <div className={styles.filters}>
            <label className={styles.search}>
              <Search size={14} />
              <input value={state.query} onChange={(event) => state.setQuery(event.target.value)} placeholder="Поиск" aria-label="Поиск героев" />
            </label>
            <label className={styles.selectWrap}>
              <select value={state.districtId ?? ''} onChange={(event) => state.setDistrictId(event.target.value ? Number(event.target.value) : null)} aria-label="Фильтр по району">
                <option value="">Все районы</option>
                {state.districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
            </label>
          </div>
        </div>

        {state.isLoading ? (
          <div className={styles.stateMessage} role="status"><span className={styles.spinner} />Загрузка героев…</div>
        ) : state.loadError ? (
          <div className={styles.stateMessage} role="alert"><p>{state.loadError}</p><button type="button" onClick={() => void state.reload()}>Повторить</button></div>
        ) : state.visibleHeroes.length === 0 ? (
          <div className={styles.empty}><p>{hasFilters ? 'По заданным параметрам ничего не найдено' : 'Героев пока нет'}</p></div>
        ) : (
          <>
            <HeroesTable
              heroes={state.visibleHeroes}
              districts={state.districts}
              selectedIds={state.selectedIds}
              onToggleSelection={state.toggleSelection}
              onToggleAll={state.toggleAllVisible}
              onEdit={(hero) => navigate(`${ROUTES.staffHeroes}/${hero.id}`)}
              onDelete={(hero) => state.requestDelete([hero])}
            />
            <div className={styles.tableFooter}>
              <p>Показано {firstVisible}–{lastVisible} из {state.filteredCount}</p>
              <HeroesPagination page={state.page} totalPages={state.totalPages} onChange={state.setPage} />
            </div>
          </>
        )}
      </section>

      {state.deleteCandidates.length > 0 && (
        <ConfirmationModal
          count={state.deleteCandidates.length}
          isLoading={state.isDeleting}
          onConfirm={() => void state.confirmDelete()}
          onCancel={state.cancelDelete}
        />
      )}
    </main>
  );
}
