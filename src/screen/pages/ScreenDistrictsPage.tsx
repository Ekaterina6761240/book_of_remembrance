import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import type { District } from '../../shared/types';
import districtPeople from '../assets/district-people.svg';
import { DistrictPicker } from '../components/DistrictPicker';
import { useScreenDistricts } from '../hooks/useScreenDistricts';
import styles from './ScreenDistrictsPage.module.css';

export function ScreenDistrictsPage() {
  const { districts, isLoading, error } = useScreenDistricts();
  const navigate = useNavigate();
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null);

  useEffect(() => {
    if (districts.length === 0) {
      setActiveDistrict(null);
      return;
    }

    setActiveDistrict((current) => {
      if (current && districts.some((district) => district.id === current.id)) return current;
      return districts[Math.floor((districts.length - 1) / 2)] ?? districts[0] ?? null;
    });
  }, [districts]);

  const openDistrict = (district: District) => {
    navigate(`${ROUTES.screenHeroes}?district=${district.id}`);
  };

  return (
    <main className={styles.page}>
      <img className={styles.people} src={districtPeople} alt="" aria-hidden="true" />

      <Link className={styles.backLink} to={ROUTES.screen} aria-label="Вернуться на стартовый экран">
        <span className={styles.backIcon}><ArrowLeft aria-hidden="true" strokeWidth={1.35} /></span>
        <span>Назад</span>
      </Link>

      <p className={styles.instruction}>
        Выберите район города,<br />
        чтобы узнать о подвигах<br />
        его жителей
      </p>

      <section className={styles.pickerColumn} aria-label="Районы города">
        {isLoading && <p className={styles.status}>Загрузка районов…</p>}
        {error && <p className={`${styles.status} ${styles.error}`} role="alert">{error}</p>}
        {!isLoading && !error && districts.length > 0 && (
          <DistrictPicker
            districts={districts}
            value={activeDistrict}
            onChange={setActiveDistrict}
            onActivate={openDistrict}
          />
        )}
        {!isLoading && !error && districts.length === 0 && (
          <p className={styles.status}>Районы пока не добавлены</p>
        )}
      </section>
    </main>
  );
}
