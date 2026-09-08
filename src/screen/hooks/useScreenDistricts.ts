import { useEffect, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { District } from '../../shared/types';

type ScreenDistrictsState = {
  districts: District[];
  isLoading: boolean;
  error: string | null;
};

export const useScreenDistricts = (): ScreenDistrictsState => {
  const { screenContent } = useServices();
  const [state, setState] = useState<ScreenDistrictsState>({
    districts: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isActive = true;
    let latestVersion = -1;
    const applySnapshot = (snapshot: Awaited<ReturnType<typeof screenContent.getSnapshot>>) => {
      if (!isActive || snapshot.version < latestVersion) return;
      latestVersion = snapshot.version;
      setState({ districts: snapshot.districts, isLoading: false, error: null });
    };
    const unsubscribe = screenContent.subscribe(applySnapshot);

    screenContent.getSnapshot()
      .then(applySnapshot)
      .catch((error: unknown) => {
        if (isActive) {
          setState({
            districts: [],
            isLoading: false,
            error: error instanceof Error ? error.message : 'Не удалось загрузить районы',
          });
        }
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [screenContent]);

  return state;
};
