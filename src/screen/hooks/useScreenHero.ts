import { useEffect, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { Hero } from '../../shared/types';

export type ScreenHeroStatus = 'loading' | 'success' | 'not-found' | 'error';

export const useScreenHero = (id: number | null) => {
  const { screenContent } = useServices();
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
    screenContent.getSnapshot()
      .then((snapshot) => {
        if (isActive) {
          const publicHero = snapshot.heroes.find((hero) => hero.id === id) ?? null;
          setHero(publicHero);
          setIsLoading(false);
          setStatus(publicHero ? 'success' : 'not-found');
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setError(error instanceof Error ? error.message : 'Не удалось загрузить героя');
          setIsLoading(false);
          setStatus('error');
        }
      });
    return () => { isActive = false; };
  }, [id, screenContent]);

  return { hero, isLoading, error, status };
};
