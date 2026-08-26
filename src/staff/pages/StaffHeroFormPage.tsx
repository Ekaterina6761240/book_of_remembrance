import { useParams } from 'react-router-dom';
import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';

export function StaffHeroFormPage() {
  const { id } = useParams();
  const title = id ? `Редактирование записи #${id}` : 'Новая запись о герое';
  return <PagePlaceholder area="staff" title={title} description="Форма будет реализована на следующем этапе." links={[{ to: ROUTES.staffHeroes, label: 'К списку' }]} />;
}
