import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';

export function StaffDashboardPage() {
  return <PagePlaceholder area="staff" title="Панель управления" links={[{ to: ROUTES.staffDistricts, label: 'Районы' }, { to: ROUTES.staffHeroes, label: 'Герои' }, { to: ROUTES.staffMedia, label: 'Медиафайлы' }]} />;
}
