import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';

export function StaffMediaPage() {
  return <PagePlaceholder area="staff" title="Медиафайлы" description="Библиотека фотографий и документов." links={[{ to: ROUTES.staff, label: 'В панель' }]} />;
}
