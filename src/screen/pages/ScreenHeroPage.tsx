import { useParams } from 'react-router-dom';
import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';
import { useScreenHero } from '../hooks/useScreenHero';

export function ScreenHeroPage() {
  const { id } = useParams();
  const numericId = id && /^\d+$/.test(id) ? Number(id) : null;
  const { hero, isLoading, error } = useScreenHero(numericId);
  const title = hero ? `${hero.lastName} ${hero.firstName} ${hero.middleName ?? ''}`.trim() : 'Карточка героя';
  const status = isLoading ? 'Загрузка…' : error ?? `Запись #${hero?.id}`;
  return <PagePlaceholder area="screen" title={title} description="Детальная музейная история." links={[{ to: ROUTES.screenHeroes, label: 'Ко всем героям' }]}>{status}</PagePlaceholder>;
}
