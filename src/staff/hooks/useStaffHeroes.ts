import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { District, Hero } from '../../shared/types';

const PAGE_SIZE = 10;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useStaffHeroes = () => {
  const { districts: districtsService, heroes: heroesService } = useServices();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [heroesError, setHeroesError] = useState<string | null>(null);
  const [districtsError, setDistrictsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQueryState] = useState('');
  const [districtId, setDistrictIdState] = useState<number | null>(null);
  const [page, setPageState] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [deleteCandidates, setDeleteCandidates] = useState<Hero[]>([]);
  const requestIdRef = useRef(0);

  const loadDistricts = useCallback(async () => {
    setDistrictsError(null);
    try {
      const nextDistricts = await districtsService.getAll();
      setDistricts(nextDistricts.sort((left, right) => left.name.localeCompare(right.name, 'ru')));
    } catch (error: unknown) {
      setDistrictsError(getErrorMessage(error, 'Не удалось загрузить районы.'));
    }
  }, [districtsService]);

  const loadHeroes = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setHeroesError(null);
    try {
      const result = await heroesService.getList({
        page,
        perPage: PAGE_SIZE,
        search: query.trim() || undefined,
        districtId: districtId ?? undefined,
        sortOrder: 'asc',
      });
      if (requestId !== requestIdRef.current) return;

      setHeroes(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.page !== page) setPageState(result.page);
    } catch (error: unknown) {
      if (requestId === requestIdRef.current) {
        setHeroesError(getErrorMessage(error, 'Не удалось загрузить список героев.'));
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [districtId, heroesService, page, query]);

  useEffect(() => {
    void loadDistricts();
  }, [loadDistricts]);

  useEffect(() => {
    void loadHeroes();
  }, [loadHeroes]);

  const reload = useCallback(async () => {
    await Promise.all([loadDistricts(), loadHeroes()]);
  }, [loadDistricts, loadHeroes]);

  const setQuery = (value: string) => {
    setQueryState(value);
    setPageState(1);
    setSelectedIds(new Set());
  };

  const setDistrictId = (value: number | null) => {
    setDistrictIdState(value);
    setPageState(1);
    setSelectedIds(new Set());
  };

  const setPage = (value: number) => {
    setPageState(value);
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
      const allVisibleSelected = heroes.length > 0 && heroes.every((hero) => next.has(hero.id));
      heroes.forEach((hero) => allVisibleSelected ? next.delete(hero.id) : next.add(hero.id));
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
      setSelectedIds((current) => new Set([...current].filter((id) => !deletedIds.has(id))));
      setDeleteCandidates([]);
      await loadHeroes();
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Не удалось удалить выбранные записи.'));
      setDeleteCandidates([]);
      await loadHeroes();
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
    visibleHeroes: heroes,
    filteredCount: total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(totalPages, 1),
    query,
    districtId,
    selectedIds,
    selectedHeroes,
    deleteCandidates,
    isLoading,
    isDeleting,
    loadError: heroesError ?? districtsError,
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
