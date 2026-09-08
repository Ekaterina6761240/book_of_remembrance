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
    let latestVersion = -1;
    const applySnapshot = (snapshot: Awaited<ReturnType<typeof screenContent.getSnapshot>>) => {
      if (!isActive || snapshot.version < latestVersion) return;
      latestVersion = snapshot.version;
      setState({ heroes: snapshot.heroes, isLoading: false, error: null });
    };
    const unsubscribe = screenContent.subscribe(applySnapshot);
    screenContent.getSnapshot()
      .then(applySnapshot)
      .catch((error: unknown) => isActive && setState({
        heroes: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Не удалось загрузить героев',
      }));
    return () => { isActive = false; unsubscribe(); };
  }, [screenContent]);

  return state;
};
