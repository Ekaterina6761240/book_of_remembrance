import { Link } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import startCrowd1920 from '../assets/start-crowd-1920.svg';
import startCrowd3840 from '../assets/start-crowd-3840.svg';
import startFigure1920 from '../assets/start-figure-1920.svg';
import startFigure3840 from '../assets/start-figure-3840.svg';
import { guardScreenLinkNavigation } from '../utils/navigationGuard';
import styles from './ScreenHomePage.module.css';

export function ScreenHomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.beigePanel} aria-hidden="true" />

      <picture aria-hidden="true">
        <source media="(min-width: 2560px)" srcSet={startFigure3840} />
        <img className={styles.figure} src={startFigure1920} alt="" draggable={false} />
      </picture>

      <picture aria-hidden="true">
        <source media="(min-width: 2560px)" srcSet={startCrowd3840} />
        <img className={styles.crowd} src={startCrowd1920} alt="" draggable={false} />
      </picture>

      <Link className={styles.startLink} to={ROUTES.screenDistricts} onClick={guardScreenLinkNavigation} aria-label="Начать просмотр книги памяти">
        <span className={styles.title}>Память героев</span>
        <span className={styles.prompt}>Начать просмотр</span>
      </Link>
    </main>
  );
}
