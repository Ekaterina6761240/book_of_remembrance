import { PagePlaceholder } from '../../shared/components/PagePlaceholder';
import { ROUTES } from '../../shared/constants/routes';

export function ScreenHomePage() {
  return <PagePlaceholder area="screen" title="Книга памяти" description="Главная страница музейного киоска." links={[{ to: ROUTES.screenDistricts, label: 'Районы' }, { to: ROUTES.screenHeroes, label: 'Герои' }]} />;
}
