import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../shared/constants/routes';
import { HeroGallery } from '../components/HeroGallery';
import { HeroMedia } from '../components/HeroMedia';
import { HeroTabs, type HeroTab } from '../components/HeroTabs';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { useScreenHero } from '../hooks/useScreenHero';
import { formatHeroLifeDates, getHeroFullName, getHeroMedia } from '../utils/hero';
import styles from './ScreenHeroPage.module.css';

const parseHeroId = (value?: string): number | null => {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export function ScreenHeroPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hero, status, error } = useScreenHero(parseHeroId(id));
  const [activeTab, setActiveTab] = useState<HeroTab>('biography');
  const [mediaIndex, setMediaIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const media = useMemo(() => hero ? getHeroMedia(hero) : [], [hero]);
  useEffect(() => { setActiveTab('biography'); setMediaIndex(0); setGalleryOpen(false); }, [hero?.id]);
  const goBack = () => {
    const historyIndex = (window.history.state as { idx?: unknown } | null)?.idx;
    if (typeof historyIndex === 'number' && historyIndex > 0) navigate(-1);
    else navigate(ROUTES.screenHeroes, { replace: true });
  };

  if (status !== 'success' || !hero) {
    const title = status === 'loading' ? 'Загрузка истории…' : status === 'not-found' ? 'Герой не найден' : 'Не удалось загрузить историю';
    return <main className={`${styles.page} ${styles.statePage}`}><div className={styles.stateBack}><ScreenBackButton onClick={goBack} /></div><section className={styles.state} role={status === 'error' ? 'alert' : undefined}><h1>{title}</h1>{status !== 'loading' && <p>{status === 'not-found' ? 'Проверьте адрес страницы или вернитесь к списку героев.' : error}</p>}</section></main>;
  }
  const tabText = activeTab === 'biography' ? hero.biography : activeTab === 'feat' ? hero.feat : hero.awards;
  const paragraphs = tabText?.split(/\n+/).map((part) => part.trim()).filter(Boolean) ?? [];
  return <main className={styles.page}>
    <div className={styles.back}><ScreenBackButton onClick={goBack} /></div>
    <div className={styles.tabs}><HeroTabs active={activeTab} onChange={setActiveTab} /></div>
    <div className={styles.identity}><h1>{getHeroFullName(hero)}</h1><p>{formatHeroLifeDates(hero)}</p></div>
    <div className={styles.media}><HeroMedia media={media} index={mediaIndex} onIndexChange={setMediaIndex} onOpen={() => setGalleryOpen(true)} /></div>
    <section className={styles.content} aria-live="polite">{paragraphs.length ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className={styles.empty}>Информация отсутствует</p>}</section>
    {galleryOpen && media.length > 0 && <HeroGallery media={media} index={mediaIndex} onIndexChange={setMediaIndex} onClose={() => setGalleryOpen(false)} />}
  </main>;
}
