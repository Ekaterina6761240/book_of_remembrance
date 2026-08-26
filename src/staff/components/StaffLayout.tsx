import { Outlet } from 'react-router-dom';
import { StaffHeader } from './StaffHeader';
import { StaffSidebar } from './StaffSidebar';
import styles from './StaffLayout.module.css';

export function StaffLayout() {
  return (
    <div className={styles.layout}>
      <StaffHeader />
      <div className={styles.body}>
        <StaffSidebar />
        <div className={styles.content}><Outlet /></div>
      </div>
    </div>
  );
}
