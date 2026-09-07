import { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import { ApiError } from '../../api/ApiError';
import type { District, DistrictFormData } from '../../shared/types';

const DELETE_CONFLICT_MESSAGE = 'Невозможно удалить район, если к нему привязаны герои.';

export type DistrictEditor =
  | { mode: 'create' }
  | { mode: 'edit'; district: District }
  | null;

export type DistrictFeedback = {
  type: 'success' | 'error';
  message: string;
  canUndo?: boolean;
};

const getErrorStatus = (error: unknown): number | null => {
  if (error instanceof ApiError) return error.status;
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return null;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useStaffDistricts = () => {
  const { districts: districtsService, heroes: heroesService } = useServices();
  const [districts, setDistricts] = useState<District[]>([]);
  const [heroCounts, setHeroCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [editor, setEditor] = useState<DistrictEditor>(null);
  const [deleteCandidates, setDeleteCandidates] = useState<District[]>([]);
  const [feedback, setFeedback] = useState<DistrictFeedback | null>(null);
  const [deletedDistricts, setDeletedDistricts] = useState<District[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedDistricts = await districtsService.getAll();
      const totals = await Promise.all(loadedDistricts.map((district) =>
        heroesService.getList({ page: 1, perPage: 1, districtId: district.id })
          .then((result) => [district.id, result.total] as const),
      ));
      const counts = Object.fromEntries(totals);
      setDistricts(loadedDistricts);
      setHeroCounts(counts);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Не удалось загрузить районы.'));
    } finally {
      setIsLoading(false);
    }
  }, [districtsService, heroesService]);

  useEffect(() => { void load(); }, [load]);

  const selectedDistricts = useMemo(
    () => districts.filter((district) => selectedIds.has(district.id)),
    [districts, selectedIds],
  );

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: number[]) => {
    setSelectedIds((current) => {
      const areAllSelected = ids.length > 0 && ids.every((id) => current.has(id));
      const next = new Set(current);
      ids.forEach((id) => areAllSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const saveDistrict = async (data: DistrictFormData): Promise<boolean> => {
    setIsSaving(true);
    setFeedback(null);
    try {
      if (editor?.mode === 'edit') {
        const updated = await districtsService.update(editor.district.id, {
          ...data,
          sortOrder: editor.district.sortOrder,
        });
        setDistricts((current) => current.map((district) => district.id === updated.id ? updated : district));
        setFeedback({ type: 'success', message: 'Район обновлён' });
      } else {
        const nextSortOrder = districts.reduce((maximum, district) => Math.max(maximum, district.sortOrder ?? 0), 0) + 10;
        const created = await districtsService.create({ ...data, sortOrder: nextSortOrder });
        setDistricts((current) => [...current, created]);
        setFeedback({ type: 'success', message: 'Район добавлен' });
      }
      setEditor(null);
      return true;
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Не удалось сохранить район.') });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const duplicateDistrict = async (district: District) => {
    const suffix = districts.length + 1;
    await saveDistrict({
      name: `${district.name} (копия)`,
      slug: `${district.slug}-copy-${suffix}`,
    });
  };

  const confirmDelete = async () => {
    if (deleteCandidates.length === 0) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      for (const district of deleteCandidates) {
        await districtsService.delete(district.id);
      }
      const deletedIds = new Set(deleteCandidates.map((district) => district.id));
      setDistricts((current) => current.filter((district) => !deletedIds.has(district.id)));
      setSelectedIds((current) => new Set([...current].filter((id) => !deletedIds.has(id))));
      setDeletedDistricts(deleteCandidates);
      setFeedback({
        type: 'success',
        message: deleteCandidates.length === 1 ? '1 элемент удалён' : `${deleteCandidates.length} элемента удалены`,
        canUndo: true,
      });
      setDeleteCandidates([]);
    } catch (error) {
      const status = getErrorStatus(error);
      setFeedback({
        type: 'error',
        message: status === 409 || status === 422
          ? DELETE_CONFLICT_MESSAGE
          : getErrorMessage(error, 'Не удалось удалить район.'),
      });
      setDeleteCandidates([]);
    } finally {
      setIsSaving(false);
    }
  };

  const undoDelete = async () => {
    if (deletedDistricts.length === 0) return;
    setIsSaving(true);
    try {
      const restored: District[] = [];
      for (const district of deletedDistricts) {
        restored.push(await districtsService.create({
          name: district.name,
          slug: district.slug,
          sortOrder: district.sortOrder,
        }));
      }
      setDistricts((current) => [...current, ...restored]);
      setDeletedDistricts([]);
      setFeedback({ type: 'success', message: 'Удаление отменено' });
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Не удалось восстановить районы.') });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    districts,
    heroCounts,
    isLoading,
    isSaving,
    loadError,
    selectedIds,
    selectedDistricts,
    editor,
    deleteCandidates,
    feedback,
    reload: load,
    toggleSelection,
    toggleAll,
    openCreate: () => { setEditor({ mode: 'create' }); setSelectedIds(new Set()); setFeedback(null); },
    openEdit: (district: District) => { setEditor({ mode: 'edit', district }); setSelectedIds(new Set()); setFeedback(null); },
    closeEditor: () => setEditor(null),
    saveDistrict,
    duplicateDistrict,
    requestDelete: (candidates: District[]) => setDeleteCandidates(candidates),
    cancelDelete: () => setDeleteCandidates([]),
    confirmDelete,
    dismissFeedback: () => setFeedback(null),
    undoDelete,
  };
};
