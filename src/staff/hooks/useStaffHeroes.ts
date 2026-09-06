import { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { District, Hero } from '../../shared/types';

const PAGE_SIZE = 10;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useStaffHeroes = () => {
  const { districts: districtsService, heroes: heroesService } = useServices();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQueryState] = useState('');
  const [districtId, setDistrictIdState] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleteCandidates, setDeleteCandidates] = useState<Hero[]>([]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [nextHeroes, nextDistricts] = await Promise.all([
        heroesService.getAll(),
        districtsService.getAll(),
      ]);
      setHeroes(nextHeroes);
      setDistricts(nextDistricts.sort((left, right) => left.name.localeCompare(right.name, 'ru')));
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error, 'Не удалось загрузить список героев.'));
    } finally {
      setIsLoading(false);
    }
  }, [districtsService, heroesService]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredHeroes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');
    return heroes
      .filter((hero) => {
        const fullName = [hero.lastName, hero.firstName, hero.middleName].filter(Boolean).join(' ').toLocaleLowerCase('ru');
        return (!normalizedQuery || fullName.includes(normalizedQuery))
          && (districtId === null || hero.districtId === districtId);
      })
      .sort((left, right) => {
        const byLastName = left.lastName.localeCompare(right.lastName, 'ru');
        return byLastName || left.firstName.localeCompare(right.firstName, 'ru');
      });
  }, [districtId, heroes, query]);

  const totalPages = Math.max(1, Math.ceil(filteredHeroes.length / PAGE_SIZE));
  const visibleHeroes = useMemo(
    () => filteredHeroes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredHeroes, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const setQuery = (value: string) => {
    setQueryState(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const setDistrictId = (value: number | null) => {
    setDistrictIdState(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allVisibleSelected = visibleHeroes.length > 0 && visibleHeroes.every((hero) => next.has(hero.id));
      visibleHeroes.forEach((hero) => allVisibleSelected ? next.delete(hero.id) : next.add(hero.id));
      return next;
    });
  };

  const requestDelete = (candidates: Hero[]) => {
    setActionError(null);
    setDeleteCandidates(candidates);
  };

  const cancelDelete = () => setDeleteCandidates([]);

  const confirmDelete = async () => {
    if (deleteCandidates.length === 0) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await Promise.all(deleteCandidates.map((hero) => heroesService.delete(hero.id)));
      const deletedIds = new Set(deleteCandidates.map((hero) => hero.id));
      setHeroes((current) => current.filter((hero) => !deletedIds.has(hero.id)));
      setSelectedIds((current) => new Set([...current].filter((id) => !deletedIds.has(id))));
      setDeleteCandidates([]);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Не удалось удалить выбранные записи.'));
      setDeleteCandidates([]);
      await reload();
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedHeroes = useMemo(
    () => heroes.filter((hero) => selectedIds.has(hero.id)),
    [heroes, selectedIds],
  );

  return {
    heroes,
    districts,
    visibleHeroes,
    filteredCount: filteredHeroes.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    query,
    districtId,
    selectedIds,
    selectedHeroes,
    deleteCandidates,
    isLoading,
    isDeleting,
    loadError,
    actionError,
    setQuery,
    setDistrictId,
    setPage,
    toggleSelection,
    toggleAllVisible,
    requestDelete,
    cancelDelete,
    confirmDelete,
    dismissActionError: () => setActionError(null),
    reload,
  };
};
