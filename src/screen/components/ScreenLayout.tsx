import { Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { screenKioskConfig } from '../config/kiosk';
import { useIdleManager } from '../hooks/useIdleManager';
import styles from './ScreenLayout.module.css';

export function ScreenLayout() {
  const navigate = useNavigate();

  useIdleManager(screenKioskConfig.idleTimeoutMs, () => {
    navigate(ROUTES.screen, { replace: true });
  });

  return <div className={styles.layout}><Outlet /></div>;
}
