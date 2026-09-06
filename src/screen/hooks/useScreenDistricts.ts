import { useEffect, useState } from 'react';
import { useServices } from '../../app/providers/ServicesProvider';
import type { District } from '../../shared/types';

type ScreenDistrictsState = {
  districts: District[];
  isLoading: boolean;
  error: string | null;
};

export const useScreenDistricts = (): ScreenDistrictsState => {
  const { districts: districtsService } = useServices();
  const [state, setState] = useState<ScreenDistrictsState>({
    districts: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isActive = true;

    districtsService.getAll()
      .then((districts) => {
        if (isActive) {
          setState({ districts, isLoading: false, error: null });
        }
      })
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
    };
  }, [districtsService]);

  return state;
};
