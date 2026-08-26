import { useEffect, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { Hero } from '../../shared/types';

export const useScreenHero = (id: number | null) => {
  const { heroes: heroesService } = useServices();
  const [hero, setHero] = useState<Hero | null>(null);
  const [isLoading, setIsLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    if (id === null) {
      setIsLoading(false);
      setError('Неверный идентификатор героя');
      return () => { isActive = false; };
    }
    heroesService.getById(id)
      .then((hero) => {
        if (isActive) {
          setHero(hero);
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setError(error instanceof Error ? error.message : 'Герой не найден');
          setIsLoading(false);
        }
      });
    return () => { isActive = false; };
  }, [heroesService, id]);

  return { hero, isLoading, error };
};
