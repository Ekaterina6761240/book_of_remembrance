import styles from './HeroTabs.module.css';

export type HeroTab = 'biography' | 'feat' | 'awards';
const TABS: Array<{ id: HeroTab; label: string }> = [
  { id: 'biography', label: 'Биография' },
  { id: 'feat', label: 'Подвиги' },
  { id: 'awards', label: 'Награды' },
];

type Props = { active: HeroTab; onChange: (tab: HeroTab) => void };

export function HeroTabs({ active, onChange }: Props) {
  return <nav className={styles.tabs} aria-label="Разделы истории героя">
    {TABS.map((tab) => <button key={tab.id} type="button" aria-pressed={active === tab.id} onClick={() => onChange(tab.id)}>{tab.label}</button>)}
  </nav>;
}
