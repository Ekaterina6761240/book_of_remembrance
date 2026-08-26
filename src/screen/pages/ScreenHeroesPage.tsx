import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';
import { useScreenHeroes } from '../hooks/useScreenHeroes';

export function ScreenHeroesPage() {
  const { heroes, isLoading, error } = useScreenHeroes();
  const status = isLoading ? 'Загрузка…' : error ?? `Опубликовано записей: ${heroes.length}`;
  return <PagePlaceholder area="screen" title="Герои" description="Каталог историй для музейного экрана." links={[{ to: ROUTES.screen, label: 'На главную' }]}>{status}</PagePlaceholder>;
}
