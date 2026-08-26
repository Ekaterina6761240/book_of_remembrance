import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';

export function ScreenDistrictsPage() {
  return <PagePlaceholder area="screen" title="Районы" description="Выбор района для просмотра историй." links={[{ to: ROUTES.screen, label: 'На главную' }]} />;
}
