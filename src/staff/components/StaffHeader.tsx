import { useState } from 'react';
import { CirclePlus, LogOut, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useServices } from '../../app/providers/ServicesProvider';
import logo from '../../shared/assets/logo-header.svg';
import { ROUTES } from '../../shared/constants/routes';
import styles from './StaffHeader.module.css';

export function StaffHeader() {
  const { logout } = useAuth();
  const { screenContent } = useServices();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await screenContent.clearCache();
    } catch (error) {
      console.error('Failed to clear screen cache', error);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate(ROUTES.staffLogin, { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link className={styles.logoLink} to={ROUTES.staff} aria-label="В панель управления">
          <img className={styles.logo} src={logo} alt="Мультимедиа ПРО" />
        </Link>
        <nav className={styles.actions} aria-label="Быстрые действия">
          <Link className={styles.action} to={ROUTES.staffHeroNew}><CirclePlus size={12} />Добавить</Link>
          <button
            className={styles.action}
            type="button"
            onClick={() => void handleClearCache()}
            disabled={isClearingCache}
            aria-busy={isClearingCache}
          >
            <Trash2 size={12} />Очистить кэш
          </button>
        </nav>
      </div>
      <button className={styles.action} type="button" onClick={handleLogout} disabled={isLoggingOut}>
        <LogOut size={12} />{isLoggingOut ? 'Выход…' : 'Выйти'}
      </button>
    </header>
  );
}
