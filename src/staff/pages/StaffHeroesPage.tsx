import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';
import { useStaffHeroes } from '../hooks/useStaffHeroes';

export function StaffHeroesPage() {
  const { heroes, isLoading, error } = useStaffHeroes();
  const status = isLoading ? 'Загрузка…' : error ?? `Всего записей: ${heroes.length}`;
  return <PagePlaceholder area="staff" title="Управление героями" links={[{ to: ROUTES.staffHeroNew, label: 'Новая запись' }, { to: ROUTES.staff, label: 'В панель' }]}>{status}</PagePlaceholder>;
}
