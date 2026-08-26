import { Image, MapPin, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import styles from './StaffSidebar.module.css';

const items = [
  { to: ROUTES.staffDistricts, label: 'Районы', icon: MapPin },
  { to: ROUTES.staffHeroes, label: 'Герои', icon: UserRound },
  { to: ROUTES.staffMedia, label: 'Медиафайлы', icon: Image },
] as const;

export function StaffSidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.navigation} aria-label="Разделы панели">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`} key={to} to={to}>
            <Icon className={styles.icon} size={12} fill="currentColor" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
