import { useEffect, useState } from 'react';
import { ApiError } from '../../api/ApiError';
import { useServices } from '../../app/providers/ServicesProvider';
import type { Hero } from '../../shared/types';

export type ScreenHeroStatus = 'loading' | 'success' | 'not-found' | 'error';

export const useScreenHero = (id: number | null) => {
  const { heroes: heroesService } = useServices();
  const [hero, setHero] = useState<Hero | null>(null);
  const [isLoading, setIsLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ScreenHeroStatus>(id === null ? 'error' : 'loading');

  useEffect(() => {
    let isActive = true;
    setHero(null);
    setError(null);
    if (id === null) {
      setIsLoading(false);
      setError('Неверный идентификатор героя');
      setStatus('error');
      return () => { isActive = false; };
    }
    setIsLoading(true);
    setStatus('loading');
    heroesService.getById(id)
      .then((hero) => {
        if (isActive) {
          setHero(hero);
          setIsLoading(false);
          setStatus('success');
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setError(error instanceof Error ? error.message : 'Не удалось загрузить героя');
          setIsLoading(false);
          setStatus(error instanceof ApiError && error.status === 404 ? 'not-found' : 'error');
        }
      });
    return () => { isActive = false; };
  }, [heroesService, id]);

  return { hero, isLoading, error, status };
};
