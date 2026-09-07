import { useEffect, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { Hero } from '../../shared/types';

type ScreenHeroesState = {
  heroes: Hero[];
  isLoading: boolean;
  error: string | null;
};

export const useScreenHeroes = (): ScreenHeroesState => {
  const { screenContent } = useServices();
  const [state, setState] = useState<ScreenHeroesState>({ heroes: [], isLoading: true, error: null });

  useEffect(() => {
    let isActive = true;
    screenContent.getSnapshot()
      .then((snapshot) => isActive && setState({ heroes: snapshot.heroes, isLoading: false, error: null }))
      .catch((error: unknown) => isActive && setState({
        heroes: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Не удалось загрузить героев',
      }));
    return () => { isActive = false; };
  }, [screenContent]);

  return state;
};
