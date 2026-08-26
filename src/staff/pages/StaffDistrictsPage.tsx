import { useMemo, useState } from 'react';
import { ChevronRight, Search, Trash2 } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { DistrictFeedbackBar } from '../components/DistrictFeedbackBar';
import { DistrictForm } from '../components/DistrictForm';
import { DistrictsTable } from '../components/DistrictsTable';
import districtStyles from '../components/Districts.module.css';
import { useStaffDistricts } from '../hooks/useStaffDistricts';

export function StaffDistrictsPage() {
  const state = useStaffDistricts();
  const [search, setSearch] = useState('');

  const visibleDistricts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return state.districts
      .filter((district) => !query || district.name.toLocaleLowerCase('ru').includes(query) || district.slug.includes(query))
      .sort((left, right) => left.name.localeCompare(right.name, 'ru'));
  }, [search, state.districts]);

  const pageTitle = state.editor?.mode === 'create'
    ? 'Добавление района'
    : state.editor?.mode === 'edit'
      ? 'Редактирование района'
      : 'Районы';

  return (
    <main className={districtStyles.page}>
      <div className={districtStyles.pageHeader}>
        <div className={districtStyles.titleGroup}>
          <nav className={districtStyles.breadcrumbs} aria-label="Хлебные крошки">
            <button type="button" onClick={state.closeEditor}>Районы</button>
            <ChevronRight size={12} />
            <span>{state.editor ? pageTitle : 'Все районы'}</span>
          </nav>
          <h1>{pageTitle}</h1>
        </div>
        <button className={districtStyles.addButton} type="button" onClick={state.openCreate}>Добавить новый район</button>
      </div>

      {state.feedback && <DistrictFeedbackBar feedback={state.feedback} onUndo={() => void state.undoDelete()} onClose={state.dismissFeedback} />}

      {state.editor ? (
        <DistrictForm editor={state.editor} isSaving={state.isSaving} onSubmit={state.saveDistrict} onCancel={state.closeEditor} />
      ) : (
        <section className={districtStyles.listCard} aria-label="Районы">
          <div className={districtStyles.toolbar}>
            <button
              className={`${districtStyles.deleteSelected} ${state.selectedDistricts.length > 0 ? districtStyles.visible : ''}`}
              type="button"
              onClick={() => state.requestDelete(state.selectedDistricts)}
              disabled={state.selectedDistricts.length === 0}
            >
              <Trash2 size={12} fill="currentColor" />Удалить выбранные
            </button>
            <label className={districtStyles.search}>
              <Search size={14} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск" aria-label="Поиск районов" />
            </label>
          </div>

          {state.isLoading ? (
            <div className={districtStyles.stateMessage} role="status"><span className={districtStyles.spinner} />Загрузка районов…</div>
          ) : state.loadError ? (
            <div className={districtStyles.stateMessage} role="alert"><p>{state.loadError}</p><button type="button" onClick={() => void state.reload()}>Повторить</button></div>
          ) : (
            <DistrictsTable
              districts={visibleDistricts}
              totalDistricts={state.districts.length}
              heroCounts={state.heroCounts}
              selectedIds={state.selectedIds}
              onToggleSelection={state.toggleSelection}
              onToggleAll={state.toggleAll}
              onEdit={state.openEdit}
              onDuplicate={(district) => void state.duplicateDistrict(district)}
              onDelete={(district) => state.requestDelete([district])}
            />
          )}
        </section>
      )}

      {state.deleteCandidates.length > 0 && (
        <ConfirmationModal
          count={state.deleteCandidates.length}
          isLoading={state.isSaving}
          onConfirm={() => void state.confirmDelete()}
          onCancel={state.cancelDelete}
        />
      )}
    </main>
  );
}
