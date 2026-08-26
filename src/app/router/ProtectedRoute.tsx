import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import styles from './ProtectedRoute.module.css';

export function ProtectedRoute() {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <div className={styles.loading} role="status" aria-label="Проверка сессии" />;
  }

  if (!user) {
    return <Navigate replace to="/staff/login" state={{ from: location }} />;
  }

  return <Outlet />;
}
