import { useEffect, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { Hero } from '../../shared/types';

export const useStaffHeroes = () => {
  const { heroes: heroesService } = useServices();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    heroesService.getAll()
      .then((heroes) => isActive && setHeroes(heroes))
      .catch((error: unknown) => isActive && setError(error instanceof Error ? error.message : 'Ошибка загрузки'))
      .finally(() => isActive && setIsLoading(false));
    return () => { isActive = false; };
  }, [heroesService]);

  return { heroes, isLoading, error };
};
