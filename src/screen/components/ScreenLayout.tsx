import { Outlet } from 'react-router-dom';
import styles from './ScreenLayout.module.css';

export function ScreenLayout() {
  return <div className={styles.layout}><Outlet /></div>;
}
